// Browser-side audio plumbing. MediaRecorder yields webm/opus, which neither
// libsndfile nor miniaudio (the backend's decoders) can read — but the browser
// can always decode its own recording. So everything is converted to mono
// 16-bit WAV here and the server only ever sees a format it understands.

export async function blobToWav(blob: Blob): Promise<{ blob: Blob; seconds: number }> {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  await ctx.close();

  const n = decoded.length;
  const mono = new Float32Array(n);
  for (let c = 0; c < decoded.numberOfChannels; c++) {
    const data = decoded.getChannelData(c);
    for (let i = 0; i < n; i++) mono[i] += data[i] / decoded.numberOfChannels;
  }

  const sr = decoded.sampleRate;
  const buf = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buf);
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  str(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, mono[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return { blob: new Blob([buf], { type: "audio/wav" }), seconds: n / sr };
}

// A real .webm needs a Matroska muxer, which libsndfile lacks. The browser has
// one: play the buffer into a MediaStreamDestination and let MediaRecorder mux
// it. This runs in real time; every other format is encoded server-side.
export async function wavToWebm(wav: Blob): Promise<Blob> {
  const ctx = new AudioContext();
  const buf = await ctx.decodeAudioData(await wav.arrayBuffer());
  const dest = ctx.createMediaStreamDestination();
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(dest);

  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
  const rec = new MediaRecorder(dest.stream, { mimeType: mime });
  const parts: Blob[] = [];
  rec.ondataavailable = (e) => parts.push(e.data);
  const done = new Promise<void>((res) => (rec.onstop = () => res()));
  rec.start();
  src.start();
  await new Promise<void>((res) => (src.onended = () => res()));
  rec.stop();
  await done;
  await ctx.close();
  return new Blob(parts, { type: "audio/webm" });
}

export function saveBlob(blob: Blob, ext: string, basis: string): string {
  const name =
    (basis.trim().slice(0, 40).replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "speech") + "." + ext;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return name;
}

export const fmtDuration = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${s.toFixed(1)}s`);
export const isDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
