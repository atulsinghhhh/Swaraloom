"use client";

import { useState } from "react";
import { useBackend } from "@/components/BackendProvider";
import { Recorder, type Clip } from "@/components/Recorder";
import { Button, Card, Input, Label, Muted, SectionTitle, Status, Textarea, type StatusMsg } from "@/components/ui";
import { api, ApiError, type Voice } from "@/lib/api";
import { isDevanagari } from "@/lib/audio";

function VoiceRow({ v, onChange }: { v: Voice; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(v.reference_text ?? "");
  const [busy, setBusy] = useState<null | "auto" | "save" | "delete">(null);
  const [err, setErr] = useState<string | null>(null);

  const refText = (v.reference_text ?? "").trim();
  const state = !refText
    ? { text: "no transcript — Hindi unavailable", cls: "text-warn" }
    : isDevanagari(refText)
      ? { text: "Hindi transcript — ready", cls: "text-ok" }
      : { text: "Latin transcript — English only", cls: "text-warn" };

  const run = async (kind: "auto" | "save" | "delete", fn: () => Promise<unknown>) => {
    setBusy(kind);
    setErr(null);
    try {
      await fn();
      setEditing(false);
      onChange();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <li className="border-b border-silk py-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-midnight">
            {v.speaker_name} <Muted>· {v.duration_seconds}s · </Muted>
            <span className={`text-[13px] ${state.cls}`}>{state.text}</span>
          </p>
          {refText && !editing && (
            <p className="mt-1 text-[13px] text-pebble">
              “{refText.slice(0, 90)}
              {refText.length > 90 ? "…" : ""}”
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Typing a transcript that does not match the audio is the easiest way to
              get wildly wrong output length, so offer to do it from the audio. */}
          <Button small disabled={busy !== null} onClick={() => run("auto", () => api.transcribeVoice(v.profile_id))}>
            {busy === "auto" ? "Transcribing…" : "Auto-transcribe"}
          </Button>
          <Button small disabled={busy !== null} onClick={() => setEditing((x) => !x)}>
            {refText ? "Edit transcript" : "Add transcript"}
          </Button>
          <Button
            small
            variant="danger"
            disabled={busy !== null}
            onClick={() => run("delete", () => api.deleteVoice(v.profile_id))}
          >
            Delete
          </Button>
        </div>
      </div>

      {editing && (
        <div className="mt-4">
          <Label htmlFor={`t-${v.profile_id}`} hint="— the exact words said in the reference clip">
            Transcript
          </Label>
          <Textarea id={`t-${v.profile_id}`} value={draft} onChange={(e) => setDraft(e.target.value)} className="!min-h-20" />
          <p className="mt-1.5 text-[13px] text-pebble">
            If the clip is English, Hindi will carry your timbre with an English accent. For native Hindi, re-record the clip in Hindi.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" small disabled={busy !== null} onClick={() => run("save", () => api.setReferenceText(v.profile_id, draft))}>
              Save transcript
            </Button>
            <Button small onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {err && <p className="mt-2 text-[13px] text-err">{err}</p>}
    </li>
  );
}

export default function VoicesPage() {
  const { config, voices, refreshVoices } = useBackend();
  const [name, setName] = useState("");
  const [consent, setConsent] = useState("");
  const [refText, setRefText] = useState("");
  const [clip, setClip] = useState<Clip | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<StatusMsg>(null);
  const [wipeStatus, setWipeStatus] = useState<StatusMsg>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const phrase = config?.consent_phrase ?? "…";
  const consentOk = !!config && consent.trim().toLowerCase() === config.consent_phrase.toLowerCase();
  const ready = !!clip && name.trim() && consentOk;
  const tooShort = !!clip && !!config && clip.seconds < config.min_seconds;

  const enrol = async () => {
    if (!clip) return;
    setBusy(true);
    setStatus({ tone: "info", text: "Encrypting and saving…" });
    try {
      const r = await api.enrol({ name, consent, clip: clip.blob, referenceText: refText });
      setStatus({ tone: "ok", text: `Enrolled ${r.speaker_name} (${r.duration_seconds}s).` });
      setConsent("");
      setClip(null);
      await refreshVoices();
    } catch (e) {
      setStatus({ tone: "err", text: e instanceof ApiError ? e.message : "Failed." });
    } finally {
      setBusy(false);
    }
  };

  const wipe = async () => {
    try {
      const r = await api.wipeAll();
      setWipeStatus({ tone: "ok", text: `Deleted ${r.deleted_profiles} profile(s) and destroyed the encryption key.` });
      setConfirmWipe(false);
      await refreshVoices();
    } catch (e) {
      setWipeStatus({ tone: "err", text: e instanceof ApiError ? e.message : "Failed." });
    }
  };

  return (
    <>
      <div className="mb-2">
        <h1 className="font-heading">Your voices</h1>
        <p className="mt-2 text-pebble">Enrol a voice with explicit consent. The clip is encrypted at rest and you can erase it at any time.</p>
      </div>

      <Card>
        <SectionTitle n="1">Enrol a voice</SectionTitle>
        <div className="mb-5 rounded-[14px] border border-ember/40 bg-ember/5 px-4 py-3 text-[14px] text-iron">
          Cloning a voice is consequential. Only enrol a voice you own or have explicit permission to use. The reference clip is
          encrypted at rest with a key held in the macOS Keychain.
        </div>

        <Label htmlFor="name">Whose voice is this?</Label>
        <Input id="name" placeholder="Your name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />

        <Label htmlFor="consent">
          Type <code className="rounded bg-mist px-1.5 py-0.5 text-[13px] text-ember">{phrase}</code> to confirm consent
        </Label>
        <Input
          id="consent"
          placeholder="Type the phrase exactly"
          autoComplete="off"
          value={consent}
          onChange={(e) => setConsent(e.target.value)}
        />

        <Label htmlFor="reftext" hint="(needed for Hindi)">
          What do you say in the clip?
        </Label>
        <Input
          id="reftext"
          placeholder="Type the exact words of your reference clip"
          autoComplete="off"
          value={refText}
          onChange={(e) => setRefText(e.target.value)}
        />
        <p className="mt-1.5 text-[13px] text-pebble">
          For Hindi output, record the clip <b className="font-medium">in Hindi</b> and type the same Devanagari here. The Hindi model
          conditions on the transcript as well as the audio; English-only clips give an English accent.
        </p>

        <Label hint={`(${config ? `${config.min_seconds}–${config.max_seconds}s` : "…"}, read anything aloud naturally)`}>
          Reference clip
        </Label>
        <Recorder
          maxSeconds={config?.max_seconds}
          busy={busy}
          onClip={(c) => {
            setClip(c);
            setStatus({ tone: "ok", text: `Got ${c.seconds.toFixed(1)}s.` });
          }}
          onNotice={(text, tone) => setStatus({ text, tone })}
        />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={enrol} disabled={!ready || busy || tooShort}>
            Enrol this voice
          </Button>
          {clip && <Muted>{clip.seconds.toFixed(1)}s</Muted>}
          {tooShort && config && <Muted className="!text-warn">Clip is {clip!.seconds.toFixed(1)}s; {config.min_seconds}s minimum.</Muted>}
        </div>
        <Status msg={status} />
      </Card>

      <Card>
        <SectionTitle n="2">Saved voices</SectionTitle>
        {voices === null ? (
          <Muted>Loading…</Muted>
        ) : voices.length === 0 ? (
          <Muted>None yet.</Muted>
        ) : (
          <ul>
            {voices.map((v) => (
              <VoiceRow key={v.profile_id} v={v} onChange={refreshVoices} />
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-silk pt-5">
          {confirmWipe ? (
            <>
              <Muted className="!text-iron">Delete every voice, clip and the encryption key?</Muted>
              <Button variant="danger" small onClick={wipe}>
                Yes, delete everything
              </Button>
              <Button small onClick={() => setConfirmWipe(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="danger" small onClick={() => setConfirmWipe(true)}>
              Delete all my data
            </Button>
          )}
        </div>
        <Status msg={wipeStatus} />
      </Card>
    </>
  );
}
