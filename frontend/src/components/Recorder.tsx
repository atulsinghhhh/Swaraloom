"use client";

import { useEffect, useRef, useState } from "react";
import { blobToWav } from "@/lib/audio";
import { Button, Meter, Muted } from "./ui";

export type Clip = { blob: Blob; seconds: number };

/**
 * Record from the mic or pick a file. Whatever comes back is already mono WAV,
 * so callers never deal with webm. Parent decides what to do with the clip.
 */
export function Recorder({
  onClip,
  onNotice,
  maxSeconds,
  recordLabel = "Record",
  stopLabel = "Stop",
  disabled,
  showPreview = true,
  busy,
}: {
  onClip: (clip: Clip) => void | Promise<void>;
  onNotice?: (text: string, tone: "ok" | "err" | "warn" | "info") => void;
  maxSeconds?: number;
  recordLabel?: string;
  stopLabel?: string;
  disabled?: boolean;
  showPreview?: boolean;
  busy?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const cleanup = useRef<(() => void) | null>(null);

  // Release the mic and any object URL if the component goes away mid-take.
  useEffect(
    () => () => {
      cleanup.current?.();
    },
    [],
  );
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const accept = async (raw: Blob) => {
    try {
      onNotice?.("Converting…", "info");
      const wav = await blobToWav(raw);
      setPreviewUrl(URL.createObjectURL(wav.blob));
      await onClip(wav);
    } catch (e) {
      onNotice?.("Could not process that audio: " + (e instanceof Error ? e.message : String(e)), "err");
    }
  };

  const start = async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onNotice?.("Microphone permission denied.", "err");
      return;
    }
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream);
    recorder.current = rec;
    rec.ondataavailable = (e) => chunks.push(e.data);

    // Live level so it is obvious the mic is actually hearing something.
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      if (rec.state !== "recording") return;
      analyser.getByteTimeDomainData(buf);
      let peak = 0;
      for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
      setLevel(Math.min(1, (peak / 128) * 1.8));
      const secs = (Date.now() - t0) / 1000;
      setElapsed(secs);
      if (maxSeconds && secs >= maxSeconds) rec.stop();
      raf = requestAnimationFrame(tick);
    };

    const release = () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
      setLevel(0);
      cleanup.current = null;
    };
    cleanup.current = release;

    rec.onstop = async () => {
      release();
      setRecording(false);
      await accept(new Blob(chunks, { type: rec.mimeType }));
    };

    rec.start();
    setRecording(true);
    onNotice?.("Recording… speak naturally.", "warn");
    raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={start} disabled={disabled || recording || busy} small>
          <span className="size-2 rounded-full bg-err" aria-hidden /> {recordLabel}
        </Button>
        <Button onClick={stop} disabled={!recording} small>
          <span className="size-2 bg-charcoal" aria-hidden /> {stopLabel}
        </Button>
        <Muted>or</Muted>
        <input
          type="file"
          accept="audio/*"
          disabled={disabled || recording || busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await accept(f);
            e.target.value = "";
          }}
          className="min-w-44 flex-1 text-[13px] text-slate file:mr-3 file:rounded-full file:border file:border-silk file:bg-bone file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-charcoal hover:file:bg-mist"
        />
        {recording && <Muted className="tabular-nums">{elapsed.toFixed(1)}s</Muted>}
      </div>
      <Meter value={level} />
      {showPreview && previewUrl && <audio className="mt-4" controls src={previewUrl} />}
    </div>
  );
}
