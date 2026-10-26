# Local Voice Agent — Project Explained

A plain-language walkthrough of the whole project: what it is, how it works, how the code is organised, how to run it, and where it stands. It is based on `README.md`, `whatwehave.md`, `plan.md`, `plan-hindi.md`, `outreach/` and the source tree. Where a number comes from the project's own measurements, it is theirs, not independently re-verified.

---

## 1. What is this project?

A **fully local, privacy-first AI voice agent for Apple Silicon Macs**.

You speak → it understands → an LLM thinks (and can use tools) → it speaks back. All of it runs **on your own machine**: no cloud APIs, no recurring cost, no audio or text leaving the computer.

On top of the core agent it also has:

- **Voice cloning** (consent-gated) — type text, hear it in a voice you enrolled.
- **Hindi + English** support (English is conversational; Hindi is mainly type-and-listen).
- **A web UI** (`voice-web`) and a **desktop app** (Tauri `.app` wrapper).
- **A commercial layer** — a paid-API/billing design ("ElevenLabs for India") and outreach material for first customers.
- **A large evaluation harness** — scripts that *measure* quality, speed and cost rather than guessing.

### The four hard rules (enforced in code)

| # | Rule | How it's enforced |
|---|------|-------------------|
| 1 | **Permissive licences only** (Apache-2.0 / MIT / BSD) | `src/voiceagent/models.py` has a model registry + a `DENYLIST`; `voice-doctor` audits every installed package and **exits non-zero** on a violation |
| 2 | **Memory budget** — resident pipeline < 12 GiB on an 18 GiB M3 Pro | `voice-doctor` projects memory and checks it |
| 3 | **Zero recurring cost** — local inference only | No cloud calls in the core path |
| 4 | **Modular** — every layer swappable | Each layer has a `base.py` interface (STT, LLM, TTS, tools) |

---

## 2. The big picture (architecture)

```
 mic → VAD (silero) → STT → LLM (+ tools, + memory) → TTS router → speaker
                                                        ├─ Kokoro                  (English, live)
                                                        ├─ Chatterbox Multilingual (Hindi)
                                                        └─ Chatterbox Turbo        (cloned voice)
```

| Stage | What it does | Model / tech | Size / speed (project's measurements) |
|-------|--------------|--------------|---------------------------------------|
| **VAD** | Detects when you start/stop speaking, enables barge-in (interrupt the agent) | Silero VAD (ONNX) | tiny |
| **STT** (English) | Speech → text, *streaming* | Moonshine small-streaming | 228 MiB, RTF 0.12 |
| **STT** (Hindi) | Speech → text, batch | Whisper large-v3-turbo pinned to Hindi (MLX) | ~2.3 GiB, CER 4.8 % |
| **LLM** | Reasoning + tool calling | Qwen3-4B-Instruct-2507, 4-bit, via MLX | 2.16 GiB, ~165 ms to first token when warm |
| **TTS** (English) | Text → speech, sentence-streamed | Kokoro-82M | 0.68 GiB, first audio ~280 ms |
| **TTS** (Hindi) | Text → speech | Chatterbox Multilingual (8-bit, MIT) | RTF 0.63, 1.33 GiB resident |
| **TTS** (cloned) | Zero-shot voice clone from a short clip | Chatterbox Turbo (MIT) | RTF ~1.6 |

*RTF (real-time factor) = compute time ÷ audio length. Below 1.0 means faster than real time.*

Everything runs on **MLX** (Apple's ML framework for Apple Silicon / Metal).

### Notable design decisions (all deliberate, documented in the README)

- **Not Pipecat.** Pipecat has no MLX LLM service and needs a system `portaudio`. A custom loop in `orchestration/loop.py` is simpler; engines sit behind interfaces so Pipecat could be swapped in later.
- **Not SQLCipher.** No arm64 macOS wheel exists. Instead: plain SQLite with every message body encrypted via **Fernet**, key stored in the **macOS Keychain**.
- **No `phonemizer`.** It is GPLv3 and would force the whole app to be GPL. The code stubs out Kokoro's fallback to it (`tts/kokoro_engine.py`). Trade-off: unknown words may be skipped.
- **One Indic model resident at a time** — to stay under the memory ceiling.
- **Hindi moved from IndicF5 to Chatterbox Multilingual (Phase 12).** IndicF5's weights were MIT, but its `f5-tts` runtime pulled in non-commercial/GPL/LGPL packages and failed the audit. Chatterbox also measured better.
- **Rejected models:** XTTS v2 (CPML, non-commercial), F5-TTS (CC-BY-NC data), Fish Speech (CC-BY-NC-SA).
- **One accepted exception:** `num2words` (LGPL-2.1), used unmodified; it must stay replaceable (not frozen into one opaque binary).

---

## 3. Repository layout

```
voice/
├── README.md            Long-form evidence: every phase's results, with numbers
├── whatwehave.md        Short "current state" summary (kept up to date)
├── plan.md              Business/product strategy ("ElevenLabs for India")
├── plan-hindi.md        Technical priority: make Hindi sound like a real person
├── pyproject.toml       Dependencies, optional extras, CLI entry points
├── uv.lock              Locked dependency versions
├── .python-version      Python 3.12 (project requires >=3.12,<3.13)
├── src/voiceagent/      ← all the application code (~17.7k lines)
├── tests/               ~37 test files (README quotes 566 → 731 tests over time)
├── fixtures/            Test audio (WAVs of different lengths)
├── eval_out/            Saved evaluation results and written findings
├── site/                Static marketing/studio website (deployable to Vercel)
├── outreach/            Sales/outreach documents for first customers
└── desktop/             Tauri (Rust) wrapper that builds the macOS .app
```

### `src/voiceagent/` — module by module

| Module | Role |
|--------|------|
| `models.py` | Registry of every model: licence, memory estimate, denylist. The licence/memory source of truth |
| `paths.py`, `version.py` | Data locations; detects when source changed under a running server (shows a "restart" banner) |
| `diagnostics/doctor.py` | `voice-doctor`: RAM, Metal/MLX, licence audit, memory-budget table |
| `stt/` | Speech-to-text: `moonshine_engine.py`, `mlx_whisper_engine.py`, `live.py` (mic), benchmarks |
| `llm/` | `mlx_engine.py` (Qwen on MLX with **prefix KV-cache**), `agent.py` (tool-calling loop), `benchmark.py` |
| `tts/` | `kokoro_engine.py`, `chatterbox_indic.py` (Hindi), `router.py` (picks engine by language/voice), `chunker.py` (sentence streaming), `quantize.py` (builds the 8-bit checkpoint) |
| `orchestration/` | `loop.py` (the live conversation, `voice-chat`), `vad.py`, `audio_io.py` |
| `tools/` | Agent abilities: `files.py`, `shell.py`, `http.py`, `memory.py`, `registry.py`, `base.py` |
| `storage/db.py` | Encrypted SQLite for history and memory |
| `voice_clone/` | `engine.py`, `store.py` (consent-gated profiles), `dataset.py` (clip builder), `contribution.py` |
| `text/` | Script detection, Hindi normalisation, number→words, Latin→Devanagari transliteration (a 227-entry loanword table) |
| `eval/` | Quality/speed/cost measurement: round-trip scoring, A/B listening test, SpeechArenaBench analysis, cost-of-goods, spec sheet |
| `train/` | Reading prompts for voice enrolment |
| `web/` | FastAPI server (`server.py`) + billing, metering, queue, API keys, Razorpay, static HTML pages |

---

## 4. How the main features work

### 4.1 The live voice loop (`voice-chat`)

1. Mic audio is streamed; **Silero VAD** detects speech start/end.
2. **STT** transcribes (Moonshine for English; Whisper if `--language hi|auto`).
3. Relevant **memories** are retrieved and injected as a *system* message (so the model can't confuse recalled facts with what you just said).
4. The **LLM** replies, optionally calling tools.
5. Reply text is split into sentences and **streamed to TTS** — the first sentence is spoken while the LLM is still writing the rest (822 ms → 280 ms to first audio).
6. **Barge-in:** if you speak during playback, it stops. A stricter VAD threshold (0.85 vs 0.5) plus a 350 ms grace window reduces false triggers.

Flags: `--replay file.wav` (no mic), `--no-barge-in`, `--language en|hi|auto`.
**Use headphones** — there is no acoustic echo cancellation.

### 4.2 Tools (the agent can act)

| Tool | Needs confirmation? | Notes |
|------|---------------------|-------|
| `list_files`, `read_file` | No | Sandboxed to `~/VoiceAgentWorkspace` |
| `write_file` | **Yes** | 256 KB cap |
| `run_command` | **Yes** | Allow-list only; no shell |
| `http_request` | **Yes** | Only tool that leaves the machine; blocks loopback/private IPs |
| `remember`, `recall`, `forget_everything` | forget is gated | Backed by encrypted storage |

Security details worth knowing:
- Sandbox checks the **resolved** path, defeating `../`, symlink escapes and prefix-collision tricks.
- The shell tool uses `shlex` + `create_subprocess_exec` (never a shell), so `;`, `&&`, `|`, `$(…)` are inert. `find -exec/-delete` is refused.
- The confirmation gate **fails closed** (default hook returns `False`) and approval is **typed, not spoken**, since speech recognisers mishear "yes".

### 4.3 Encrypted memory

Conversations persist across restarts. Message bodies are Fernet-encrypted, key in macOS Keychain; destroying the key makes data unrecoverable. Honest limits: schema, row counts and timestamps are visible, and recall decrypts and scores in Python (fine at personal scale, not millions of rows).

### 4.4 Voice cloning (consent is structural)

- `VoiceProfileStore.save()` **requires** a `ConsentRecord` — there is no code path that stores a voice without one.
- The user must type exactly `I consent to cloning my voice`.
- Reference clips are encrypted at rest; "Delete all my data" removes everything **and destroys the key**.
- Performance trick: `prepare_conditionals()` once per voice (6.5 s → 1.6 s), and the token cap scales with text length (short phrases previously took 40 s).

### 4.5 Hindi

- Script detection routes Devanagari to the Hindi engine, English to Kokoro.
- Hindi uses Chatterbox Multilingual, quantised to 8-bit on first load (~7 s) — 1.9× faster on 44 % of the memory with identical measured quality.
- **Hindi needs an enrolled voice** (Chatterbox has no built-in speaker, and shipping one would mean a real person's voice with no consent record).
- Hindi only: Marathi is refused (`400 unsupported_language`); Nepali is served with an `X-Language-Warning` header; other Indian scripts raise `UnsupportedLanguage`.

### 4.6 Web UI & HTTP API (`voice-web`, port 8823)

Pages: `/` (main UI: enrol voice, type text, hear it, build datasets), `/listen` (blind A/B listening test), `/record-benchmark`.

Local API: `/api/voices`, `/api/speak`, `/api/encode`, `/api/dataset/...`, `/api/contribute`, `/api/listen/...`, `/api/config`, `/api/queue`, `/api/usage`.

Public/commercial API (`/v1/...`): `/v1/speech`, `/v1/voices`, `/v1/usage`, `/v1/balance`, `/v1/plans`, `/v1/checkout`, `/v1/webhooks/razorpay`.

### 4.7 Desktop app (`desktop/`)

A **Tauri** (Rust) shell that starts the server and shows the UI in a native window. Later phases made it self-contained (~1.3 GB, embeds Python via `build_runtime.sh`). Quitting reaps the server and frees the port. **Unsigned and un-notarised**, and model weights (~7.6 GB) are **not** bundled, so first use needs network.

### 4.8 The `site/` folder

Static pages (`index`, `studio`, `record`, `docs`) with a `vercel.json` — the public-facing website for the planned paid product, deployable to Vercel.

---

## 5. The business side

### `plan.md` — "ElevenLabs for India"
A paid Indian-language voice platform: website + API + rupee credits, with the fully offline desktop app as a premium tier. Key finding: on AI4Bharat's SpeechArenaBench (120k+ comparisons, 1,900+ native raters), the old Hindi model IndicF5 ranked last of seven systems, which drove the Phase 12 migration.

### Billing (`web/billing.py`, `web/razorpay.py`) — built, but not taking money
- Credits are **characters**; money is **paise** (integers).
- **Append-only ledger** — balance is its sum; refunds are appended reversals. Duplicate webhooks are no-ops via a unique index on payment reference.

| Plan | ₹/month | Characters |
|------|---------|-----------|
| free | 0 | 5,000 (blocks when spent) |
| creator | 499 | 500,000 |
| developer | 1,999 | 2,500,000 |

`/v1/checkout` returns 503 until `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are set. There is deliberately **no fake sandbox**.

### Cost & capacity (`eval/cogs.py`)
~40 s of compute per 1000 characters; one Mac ≈ 2M characters/day; electricity ≈ ₹0.04 per 10k chars. One machine supports roughly **38 Creator accounts** — a hard ceiling (~₹19k/month) until a second machine exists.

### `outreach/`
Written but **unsent** first-customer material: `CLAIMS.md` (which numbers may be quoted — read first), `ONE-PAGER.md`, `EMAILS.md`, `CALL-GUIDE.md`, `PRICING.md`, `TARGETS.md`. The core pitch: *a complete Hindi + English voice agent running fully offline on a consumer Mac, with a licence audit that fails the build.*

---

## 6. Evaluation philosophy (`eval/`, `eval_out/`)

The project measures instead of assuming. Highlights:

- **Round-trip scoring:** synthesise → transcribe with Whisper → compare to the input. It is an *alarm for broken speech*, not a quality ranking (AUC only ~0.63–0.67 vs human raters). Never quote it against a competitor.
- **Grapheme-level checks:** Marathi averaged 0.77 overall but failed on `ळ`, the letter that makes it Marathi.
- **Seed noise:** a single generation carries ~±0.15 noise; only defects that reproduce across seeds count.
- **Blind A/B listening test** (`/listen`): built, but **has zero human ratings** so far — naturalness remains unmeasured.
- Findings are written up in `eval_out/*/FINDINGS.md` and `eval_out/SPECSHEET.md`.

---

## 7. How to run it

```bash
uv sync                                  # base deps
uv sync --extra stt --extra llm --extra tts --extra clone \
        --extra loop --extra tools --extra indic   # models + audio extras
uv run voice-doctor                      # env, licence and memory-budget check
uv run voice-web                         # web UI → http://127.0.0.1:8823
uv run voice-chat                        # live voice loop (headphones!)
uv run voice-keys                        # manage API keys
uv run pytest tests/ -q                  # tests
```

Optional extras are separate on purpose so each component's memory cost could be measured individually. Model weights download on first use (several GB).
**Restart `voice-web` after `uv sync` or code changes** — a long-running server does not pick them up.

---

## 8. Honest limitations (from the project's own notes)

- **Naturalness of Hindi is unmeasured** (no human ratings yet).
- **Sub-1 s turn latency not met:** ~1.8 s to first audio warm, ~2.4 s cold.
- **No echo cancellation** — use headphones.
- **Hindi-only** among Indian languages; needs an enrolled voice and ~3 GiB free.
- Live loop only *hears* Hindi with `--language hi|auto`; default STT (Moonshine) is English-only and invents English text for Hindi audio.
- Memory encryption is weaker than SQLCipher.
- Qwen3 repetition loops are bounded, not eliminated.
- Desktop app is unsigned; weights not bundled.
- Payments not live; outreach unsent.
- On an 18 GB Mac with other apps open, models can swap and timings degrade — check load/swap before trusting any benchmark.

---

## 9. Project phases at a glance

| Phase | What | Status |
|-------|------|--------|
| 0 | Environment, memory & licence audit | ✅ |
| 1 | STT (Moonshine chosen) | ✅ |
| 2 | LLM (Qwen3-4B, tools, prefix cache) | ✅ |
| 3 | TTS (Kokoro, sentence-streamed) | ✅ |
| 4 | Live voice loop, VAD, barge-in | ✅ |
| 5 | Tools with confirmation gate | ✅ |
| 6 | Encrypted memory | ✅ |
| 7 | Voice cloning (consent-gated) | ✅ |
| 8 | Tauri desktop app | ✅ (now self-contained) |
| 9 | Hindi | ✅ |
| 10 | Voice fine-tuning (IndicF5 fine-tune later retired) | ✅ |
| 11 | Blind listening test | ✅ built, unrated |
| 12 | Hindi → Chatterbox Multilingual | ✅ |

**Next up** (per `whatwehave.md`): sign & notarise the `.app`; record an offline demo video; start the first customer conversations. **Later:** echo cancellation, native-speaker review of the loanword table, more Indic languages (Indic Parler-TTS is the candidate, but slow and licence-tricky).

---

## 10. Where to read next

| If you want… | Read |
|--------------|------|
| Current state in one page | `whatwehave.md` |
| Evidence and numbers per phase | `README.md` |
| Business strategy | `plan.md` |
| Hindi quality roadmap | `plan-hindi.md` |
| What may be claimed to customers | `outreach/CLAIMS.md` |
| Measured specs | `eval_out/SPECSHEET.md` |
