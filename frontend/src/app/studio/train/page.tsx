"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBackend } from "@/components/BackendProvider";
import { Recorder, type Clip } from "@/components/Recorder";
import { Button, Card, Input, Label, Meter, Muted, SectionTitle, Select, Status, Textarea, type StatusMsg } from "@/components/ui";
import { api, ApiError, type Dataset, type Prompt } from "@/lib/api";
import { fmtDuration } from "@/lib/audio";

function ClipRow({ id, clip, onChange, onStatus }: { id: string; clip: Dataset["clips"][number]; onChange: () => void; onStatus: (s: StatusMsg) => void }) {
  const [text, setText] = useState(clip.text);
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="w-12 shrink-0 text-[13px] tabular-nums text-pebble">{clip.duration_seconds.toFixed(1)}s</span>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={async () => {
          if (text === clip.text) return;
          try {
            await api.updateClip(id, clip.clip_id, text);
            onStatus({ tone: "ok", text: "Transcript updated." });
          } catch {
            onStatus({ tone: "err", text: "Could not update transcript." });
          }
        }}
        className="flex-1 !py-2"
        aria-label="Clip transcript"
      />
      <Button
        small
        variant="danger"
        onClick={async () => {
          await api.deleteClip(id, clip.clip_id).catch(() => {});
          onChange();
        }}
      >
        Delete
      </Button>
    </li>
  );
}

export default function TrainPage() {
  const { voices } = useBackend();
  const [voiceId, setVoiceId] = useState("");
  const [ds, setDs] = useState<Dataset | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptAt, setPromptAt] = useState(0);
  // If the clip is a reading of the displayed prompt, the prompt text IS the
  // transcript and Whisper must not be consulted: asking it to guess text we
  // already know can only add error (it heard कृपया as क्रिपय).
  const [reading, setReading] = useState(true);

  const [clip, setClip] = useState<Clip | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<StatusMsg>(null);
  const [takeStatus, setTakeStatus] = useState<StatusMsg>(null);
  const [exportStatus, setExportStatus] = useState<StatusMsg>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    api.prompts().then(setPrompts).catch(() => setPrompts([]));
  }, []);

  // Keep the selected voice across refreshes AND browser reloads. Without the
  // stored half, reloading reset to the first voice, showed an empty dataset
  // for a speaker with no clips, and read exactly like the recordings had been erased.
  useEffect(() => {
    if (!voices?.length) return;
    if (voices.some((v) => v.profile_id === voiceId)) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("swaraloom.trainVoice");
    } catch {}
    setVoiceId(voices.find((v) => v.profile_id === stored)?.profile_id ?? voices[0].profile_id);
  }, [voices, voiceId]);

  const refresh = useCallback(async () => {
    if (!voiceId) return;
    try {
      setDs(await api.dataset(voiceId));
    } catch {
      setDs(null);
    }
  }, [voiceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const prompt = prompts.length ? prompts[promptAt % prompts.length] : null;
  const need = ds ? Math.max(0, ds.minimum_useful_seconds - ds.total_seconds) : 0;

  const onClip = async (c: Clip) => {
    setClip(c);
    if (!voiceId) return;
    // Exact text beats a good guess; only fall back to Whisper for free speech.
    if (reading && prompt) {
      setText(prompt.text);
      setStatus({ tone: "ok", text: "Transcript taken from the prompt — exact, no transcription error. Save it." });
      return;
    }
    setStatus({ tone: "info", text: "Transcribing…" });
    try {
      const d = await api.transcribeClip(voiceId, c.blob);
      setText(d.text);
      setStatus({ tone: "ok", text: `Heard ${d.language}. Check the text, then save.` });
    } catch {
      setStatus({ tone: "err", text: "Transcription failed — type the text by hand." });
    }
  };

  const save = async () => {
    if (!clip || !voiceId) return;
    if (!text.trim()) return setStatus({ tone: "err", text: "A transcript is required — the model learns text to voice." });
    setBusy(true);
    try {
      const d = await api.saveClip(voiceId, clip.blob, text.trim());
      setStatus({ tone: "ok", text: `Saved. ${d.clip_count} clips, ${fmtDuration(d.total_seconds)} total.` });
      setClip(null);
      setText("");
      setPromptAt((i) => i + 1);
      refresh();
    } catch (e) {
      setStatus({ tone: "err", text: e instanceof ApiError ? e.message : "Could not save the clip." });
    } finally {
      setBusy(false);
    }
  };

  // One Whisper pass over a whole take gives boundaries and aligned text together;
  // a VAD pass would find where speech stops but not what was said.
  const splitTake = async (c: Clip) => {
    if (!voiceId) return setTakeStatus({ tone: "err", text: "Pick a voice first." });
    setBusy(true);
    setTakeStatus({ tone: "info", text: `Transcribing and splitting ${c.seconds.toFixed(0)}s — this takes a moment…` });
    try {
      const d = await api.segment(voiceId, c.blob);
      setTakeStatus({
        tone: "ok",
        text:
          `Saved ${d.saved} clips (${fmtDuration(d.seconds_added)}) from ${fmtDuration(d.take_seconds)}` +
          (d.skipped ? `, skipped ${d.skipped} too-short fragment(s)` : "") +
          `. ${d.review_note}`,
      });
      refresh();
    } catch (e) {
      setTakeStatus({ tone: "err", text: e instanceof ApiError ? e.message : "Splitting failed." });
    } finally {
      setBusy(false);
    }
  };

  const exportIt = async () => {
    setExportStatus({ tone: "info", text: "Exporting…" });
    try {
      const d = await api.exportDataset(voiceId);
      setExportStatus({
        tone: "ok",
        text: `${d.clip_count} clips (${fmtDuration(d.total_seconds)}) written.\n\n${d.plaintext_warning}\n\n${d.next_steps.join("\n\n")}`,
      });
    } catch (e) {
      setExportStatus({ tone: "err", text: e instanceof ApiError ? e.message : "Export failed." });
    }
  };

  if (voices !== null && voices.length === 0) {
    return (
      <Card>
        <SectionTitle>Train on your voice</SectionTitle>
        <p className="text-pebble">
          You need an enrolled voice first.{" "}
          <Link href="/studio/voices" className="text-signal underline underline-offset-2">
            Enrol one
          </Link>
          .
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-2">
        <h1 className="font-heading">Train on your voice</h1>
        <p className="mt-2 text-pebble">
          Zero-shot cloning copies your timbre from one short clip and stops there. To be mistaken for you it has to learn your rhythm
          too, and that needs a dataset.
        </p>
      </div>

      <Card>
        <SectionTitle n="1" hint="Record clips of 1.5–20 seconds each, correct the transcript, and save.">
          Build a dataset
        </SectionTitle>

        <Label htmlFor="dsVoice">Voice to train</Label>
        <Select
          id="dsVoice"
          value={voiceId}
          onChange={(e) => {
            setVoiceId(e.target.value);
            try {
              localStorage.setItem("swaraloom.trainVoice", e.target.value);
            } catch {}
          }}
        >
          {voices?.map((v) => (
            <option key={v.profile_id} value={v.profile_id}>
              {v.speaker_name}
            </option>
          ))}
        </Select>

        <Meter value={ds?.fraction_of_target ?? 0} />
        <p className="mt-2 text-[13px] text-pebble">
          {ds
            ? `${ds.clip_count} clips · ${fmtDuration(ds.total_seconds)} of ${fmtDuration(ds.target_seconds)} target` +
              (ds.usable ? " · enough to train on" : ` · ${fmtDuration(need)} more before training is worth the compute`)
            : "No clips yet."}
        </p>

        <div className="mt-6">
          <Label hint="(optional — spans registers so your data is not all one tone)">Prompt</Label>
          <div className="rounded-[14px] bg-bone px-4 py-3 text-[15px] leading-relaxed text-midnight">
            {prompt ? (
              <>
                {prompt.text} <span className="text-[13px] text-ember">— {prompt.register}</span>
              </>
            ) : (
              <Muted>Loading prompts…</Muted>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button small onClick={() => setPromptAt((i) => i + 1)}>
              Another prompt
            </Button>
            <label className="inline-flex items-center gap-2 text-[14px] text-graphite">
              <input type="checkbox" className="size-4 accent-signal" checked={reading} onChange={(e) => setReading(e.target.checked)} />
              I am reading this prompt <Muted>(uses the prompt text, not Whisper)</Muted>
            </label>
          </div>
          <p className="mt-2 text-[13px] text-pebble">Or just talk naturally — that scales better than reading.</p>
        </div>

        <div className="mt-6">
          <Recorder recordLabel="Record clip" busy={busy} onClip={onClip} onNotice={(t, tone) => setStatus({ text: t, tone })} />
        </div>

        <Label htmlFor="dsText" hint="(auto-filled by Whisper — fix it before saving)">
          What you said
        </Label>
        <Textarea id="dsText" value={text} onChange={(e) => setText(e.target.value)} placeholder="Transcript of the clip…" />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={save} disabled={!clip || busy}>
            Save clip
          </Button>
          {clip && <Muted>{clip.seconds.toFixed(1)}s</Muted>}
        </div>
        <Status msg={status} />
      </Card>

      <Card>
        <SectionTitle n="2" hint="Talk for a minute or two — explain something, tell a story. It is split at word boundaries into clips of up to 8 seconds, each with its transcript, in one pass.">
          Record a long take
        </SectionTitle>
        <p className="mb-4 text-[13px] text-pebble">
          This is where the volume comes from: the prompts are only about four minutes.{" "}
          <b className="font-medium text-iron">Whisper writes these transcripts, so check them below.</b>
        </p>
        <Recorder recordLabel="Record long take" stopLabel="Stop & split" showPreview={false} busy={busy} onClip={splitTake} onNotice={(t, tone) => setTakeStatus({ text: t, tone })} />
        <Status msg={takeStatus} />
      </Card>

      <Card>
        <SectionTitle n="3">Clips</SectionTitle>
        {!ds || ds.clips.length === 0 ? (
          <Muted>None yet.</Muted>
        ) : (
          <ul className="divide-y divide-silk">
            {ds.clips
              .slice()
              .reverse()
              .map((c) => (
                <ClipRow key={c.clip_id} id={voiceId} clip={c} onChange={refresh} onStatus={setStatus} />
              ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-silk pt-5">
          <Button onClick={exportIt} disabled={!ds || ds.clip_count === 0}>
            Export for training
          </Button>
          {confirmWipe ? (
            <>
              <Muted className="!text-iron">Delete every clip for this voice?</Muted>
              <Button
                variant="danger"
                small
                onClick={async () => {
                  await api.wipeDataset(voiceId).catch(() => {});
                  setConfirmWipe(false);
                  setStatus({ tone: "ok", text: "All clips deleted. The enrolled voice is untouched." });
                  refresh();
                }}
              >
                Yes, delete clips
              </Button>
              <Button small onClick={() => setConfirmWipe(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setConfirmWipe(true)} disabled={!ds || ds.clip_count === 0}>
              Delete all clips
            </Button>
          )}
        </div>
        <Status msg={exportStatus} />
      </Card>
    </>
  );
}
