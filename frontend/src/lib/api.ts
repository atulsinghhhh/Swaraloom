// Typed client for the Swaraloom backend. All paths are same-origin; Next
// rewrites /api/* to the Python server (see next.config.ts).

export type Config = {
  consent_phrase: string;
  min_seconds: number;
  max_seconds: number;
  model_loaded: boolean;
  formats: string[];
  source: string;
  stale: string | null;
};

export type Voice = {
  profile_id: string;
  speaker_name: string;
  duration_seconds: number;
  created_at?: string;
  consent_granted_at?: string;
  reference_text?: string;
};

export type Clip = {
  clip_id: string;
  text: string;
  duration_seconds: number;
  language: string;
  created_at: string;
};

export type Dataset = {
  profile_id: string;
  speaker_name: string;
  clip_count: number;
  total_seconds: number;
  target_seconds: number;
  fraction_of_target: number;
  usable: boolean;
  minimum_useful_seconds: number;
  clips: Clip[];
};

export type Prompt = { slug: string; text: string; register: string; note: string };

export type QueueState = {
  running: boolean;
  waiting: number;
  depth: number;
  capacity: number;
  accepting: boolean;
  mean_job_seconds: number;
  eta_seconds: number;
  running_for_seconds: number | null;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fail(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => ({}));
  const detail = body?.detail ?? body?.error?.message ?? body?.message;
  throw new ApiError(
    typeof detail === "string" ? detail : fallback,
    res.status,
  );
}

async function json<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) await fail(res, fallback);
  return res.json() as Promise<T>;
}

const form = (fields: Record<string, string | Blob>, name?: string) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v instanceof Blob) fd.append(k, v, name ?? "clip.wav");
    else fd.append(k, v);
  }
  return fd;
};

export const api = {
  config: () => fetch("/api/config", { cache: "no-store" }).then((r) => json<Config>(r, "Backend unreachable")),

  queue: () => fetch("/api/queue", { cache: "no-store" }).then((r) => json<QueueState>(r, "Queue unavailable")),

  voices: () => fetch("/api/voices", { cache: "no-store" }).then((r) => json<Voice[]>(r, "Could not load voices")),

  enrol: (p: { name: string; consent: string; clip: Blob; referenceText: string }) =>
    fetch("/api/voices", {
      method: "POST",
      body: form({
        speaker_name: p.name,
        consent_phrase: p.consent,
        clip: p.clip,
        reference_text: p.referenceText,
      }, "reference.wav"),
    }).then((r) => json<{ profile_id: string; speaker_name: string; duration_seconds: number }>(r, "Enrolment failed")),

  setReferenceText: (id: string, text: string) =>
    fetch(`/api/voices/${id}`, { method: "PATCH", body: form({ reference_text: text }) }).then((r) =>
      json<{ profile_id: string; reference_text: string }>(r, "Could not update transcript"),
    ),

  transcribeVoice: (id: string) =>
    fetch(`/api/voices/${id}/transcribe`, { method: "POST" }).then((r) => json<unknown>(r, "Could not transcribe this clip")),

  deleteVoice: (id: string) =>
    fetch(`/api/voices/${id}`, { method: "DELETE" }).then((r) => json<unknown>(r, "Could not delete voice")),

  wipeAll: () =>
    fetch("/api/data", { method: "DELETE" }).then((r) => json<{ deleted_profiles: number }>(r, "Could not delete data")),

  /** Synthesize. Returns the audio and the engine's timing headers. */
  speak: async (text: string, profileId: string) => {
    const res = await fetch("/api/speak", { method: "POST", body: form({ text, profile_id: profileId }) });
    if (!res.ok) await fail(res, "Synthesis failed");
    const blob = await res.blob();
    const h = (k: string) => res.headers.get(k);
    return {
      blob,
      engine: h("X-Engine"),
      language: h("X-Language"),
      audioSeconds: h("X-Audio-Seconds"),
      synthesisMs: h("X-Synthesis-Ms"),
      realtimeFactor: h("X-Realtime-Factor"),
      warning: h("X-Language-Warning"),
    };
  },

  encode: async (wav: Blob, format: string) => {
    const res = await fetch("/api/encode", { method: "POST", body: form({ audio: wav, format }, "audio.wav") });
    if (!res.ok) await fail(res, "Encoding failed");
    return { blob: await res.blob(), ext: res.headers.get("X-Audio-Format") ?? format };
  },

  prompts: () => fetch("/api/prompts").then((r) => json<Prompt[]>(r, "Could not load prompts")),

  dataset: (id: string) => fetch(`/api/dataset/${id}`, { cache: "no-store" }).then((r) => json<Dataset>(r, "Could not load dataset")),

  transcribeClip: (id: string, wav: Blob) =>
    fetch(`/api/dataset/${id}/transcribe`, { method: "POST", body: form({ clip: wav }) }).then((r) =>
      json<{ text: string; language: string }>(r, "Transcription failed"),
    ),

  saveClip: (id: string, wav: Blob, text: string) =>
    fetch(`/api/dataset/${id}/clips`, {
      method: "POST",
      body: form({ clip: wav, text, language: /[ऀ-ॿ]/.test(text) ? "hi" : "en" }),
    }).then((r) => json<{ clip_count: number; total_seconds: number }>(r, "Could not save the clip")),

  updateClip: (id: string, clipId: string, text: string) =>
    fetch(`/api/dataset/${id}/clips/${clipId}`, { method: "PATCH", body: form({ text }) }).then((r) =>
      json<unknown>(r, "Could not update transcript"),
    ),

  deleteClip: (id: string, clipId: string) =>
    fetch(`/api/dataset/${id}/clips/${clipId}`, { method: "DELETE" }).then((r) => json<unknown>(r, "Could not delete clip")),

  segment: (id: string, wav: Blob) =>
    fetch(`/api/dataset/${id}/segment`, { method: "POST", body: form({ clip: wav, language: "hi" }, "take.wav") }).then((r) =>
      json<{ saved: number; seconds_added: number; take_seconds: number; skipped: number; review_note: string }>(
        r,
        "Splitting failed",
      ),
    ),

  exportDataset: (id: string) =>
    fetch(`/api/dataset/${id}/export`, { method: "POST", body: new FormData() }).then((r) =>
      json<{ clip_count: number; total_seconds: number; plaintext_warning: string; next_steps: string[] }>(r, "Export failed"),
    ),

  wipeDataset: (id: string) =>
    fetch(`/api/dataset/${id}`, { method: "DELETE" }).then((r) => json<unknown>(r, "Could not delete clips")),

  // Listening test
  listenSession: (bench: string, listener: string, kind: string) =>
    fetch(`/api/listen/${bench}/session?listener=${encodeURIComponent(listener)}&kind=${kind}`).then((r) =>
      json<{ items: string[]; done: string[] }>(r, "Could not load the test"),
    ),

  listenRate: (bench: string, fields: Record<string, string>) =>
    fetch(`/api/listen/${bench}/rate`, { method: "POST", body: form(fields) }).then((r) => json<unknown>(r, "Could not save that")),

  // Benchmark recording
  benchSentences: () =>
    fetch("/api/benchmark/sentences", { cache: "no-store" }).then((r) =>
      json<{ slug: string; text: string; targets: string[]; recorded: boolean }[]>(r, "Could not load sentences"),
    ),

  benchRecord: (slug: string, wav: Blob) =>
    fetch("/api/benchmark/record", { method: "POST", body: form({ slug, clip: wav }, "clip.wav") }).then((r) =>
      json<{ recorded: number; total: number }>(r, "Could not save the recording"),
    ),

  benchUnrecord: (slug: string) =>
    fetch(`/api/benchmark/record/${slug}`, { method: "DELETE" }).then((r) => json<unknown>(r, "Could not remove recording")),
};
