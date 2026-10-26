"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useBackend } from "@/components/BackendProvider";
import { Button, Card, Input, Label, Muted, SectionTitle, Select, Status, Textarea, type StatusMsg } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { isDevanagari, saveBlob, wavToWebm } from "@/lib/audio";

type Metrics = { text: string };

export default function SpeakPage() {
  const { voices } = useBackend();
  const [voiceId, setVoiceId] = useState("");
  const [text, setText] = useState("Hello. This is my own voice, running entirely on my laptop.");
  const [format, setFormat] = useState("webm");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<StatusMsg>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [audio, setAudio] = useState<{ url: string; wav: Blob; text: string } | null>(null);
  const player = useRef<HTMLAudioElement>(null);

  // Default to the first voice once they load; keep the choice if it still exists.
  useEffect(() => {
    if (voices?.length && !voices.some((v) => v.profile_id === voiceId)) setVoiceId(voices[0].profile_id);
  }, [voices, voiceId]);

  useEffect(() => () => { if (audio) URL.revokeObjectURL(audio.url); }, [audio]);

  const speak = async () => {
    setBusy(true);
    setMetrics(null);
    const hindi = isDevanagari(text);
    setStatus({
      tone: "info",
      text: hindi
        ? "Synthesizing Hindi… the first run loads the Hindi model (can take a minute), then roughly real time."
        : "Synthesizing… the first run loads the model (~30 s).",
    });

    // While we wait, show the queue instead of a bare spinner: someone who can
    // see "2 ahead of you" does not click again, and clicking again is what
    // turned a slow request into a stuck machine.
    const poll = setInterval(async () => {
      try {
        const q = await api.queue();
        if (q.waiting > 0) {
          setStatus({ tone: "info", text: `${q.waiting} ahead of you · about ${Math.ceil(q.eta_seconds)}s wait` });
        }
      } catch {}
    }, 2000);

    const t0 = performance.now();
    try {
      const r = await api.speak(text, voiceId);
      const wall = ((performance.now() - t0) / 1000).toFixed(1);
      setAudio({ url: URL.createObjectURL(r.blob), wav: r.blob, text });
      setStatus(
        r.warning ? { tone: "warn", text: `Done. ${r.warning}` } : { tone: "ok", text: "Done." },
      );
      setMetrics({
        text:
          `${r.engine ?? "?"} (${r.language ?? "?"}) · ${r.audioSeconds}s of audio · synthesis ${r.synthesisMs}ms · ` +
          `realtime factor ${r.realtimeFactor} · round trip ${wall}s · ${(r.blob.size / 1024).toFixed(0)} KB wav`,
      });
      requestAnimationFrame(() => player.current?.play().catch(() => {}));
    } catch (e) {
      setStatus({ tone: "err", text: e instanceof ApiError ? e.message : "Synthesis failed." });
    } finally {
      clearInterval(poll);
      setBusy(false);
    }
  };

  const download = async () => {
    if (!audio) return;
    setBusy(true);
    try {
      if (format === "webm") {
        setStatus({ tone: "info", text: "Encoding WebM (runs in real time)…" });
        const blob = await wavToWebm(audio.wav);
        const name = saveBlob(blob, "webm", audio.text);
        setStatus({ tone: "ok", text: `Saved ${name} (${(blob.size / 1024).toFixed(0)} KB).` });
      } else {
        // Re-encode the audio we already have rather than re-synthesizing: a
        // container change must not cost a second generation (and two in
        // flight once wedged the machine in swap).
        setStatus({ tone: "info", text: `Encoding ${format.toUpperCase()}…` });
        const { blob, ext } = await api.encode(audio.wav, format);
        const name = saveBlob(blob, ext, audio.text);
        setStatus({ tone: "ok", text: `Saved ${name} (${(blob.size / 1024).toFixed(0)} KB).` });
      }
    } catch (e) {
      setStatus({ tone: "err", text: "Download failed: " + (e instanceof Error ? e.message : String(e)) });
    } finally {
      setBusy(false);
    }
  };

  const noVoices = voices !== null && voices.length === 0;

  return (
    <>
      <div className="mb-2">
        <h1 className="font-heading">Write something to hear</h1>
        <p className="mt-2 text-pebble">Type English or Hindi. It is spoken in your enrolled voice, on this machine.</p>
      </div>

      <Card>
        <SectionTitle>Speak</SectionTitle>

        <Label htmlFor="voice">Voice</Label>
        <Select id="voice" value={voiceId} onChange={(e) => setVoiceId(e.target.value)} disabled={!voices?.length}>
          {voices?.map((v) => (
            <option key={v.profile_id} value={v.profile_id}>
              {v.speaker_name}
            </option>
          ))}
        </Select>

        <Label htmlFor="text">Text</Label>
        <Textarea id="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type what you want to hear…" />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={speak} disabled={busy || !voiceId || !text.trim()}>
            {busy ? "Working…" : "Speak it"}
          </Button>
          {noVoices && (
            <Muted>
              <Link href="/studio/voices" className="text-signal underline underline-offset-2">
                Enrol a voice first.
              </Link>
            </Muted>
          )}
        </div>

        <Status msg={status} />
        {audio && <audio ref={player} className="mt-4" controls src={audio.url} />}
        {metrics && <p className="mt-3 text-[12px] tabular-nums text-pebble">{metrics.text}</p>}

        {audio && (
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-silk pt-5">
            <Label htmlFor="fmt">Download as</Label>
            <Select id="fmt" value={format} onChange={(e) => setFormat(e.target.value)} className="!w-auto">
              <option value="webm">WebM / Opus (smallest)</option>
              <option value="opus">Ogg / Opus</option>
              <option value="wav">WAV (uncompressed)</option>
              <option value="flac">FLAC (lossless)</option>
            </Select>
            <Button onClick={download} disabled={busy} small>
              Download
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
