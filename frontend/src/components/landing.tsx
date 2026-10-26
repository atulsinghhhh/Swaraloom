import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, ButtonLink, Logo } from "./ui";
export { Navbar as Nav } from "./Navbar";

/* ---------- small helpers ---------- */

function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-6 md:px-10 ${className}`}>{children}</div>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <Badge>{children}</Badge>;
}

const Icon = ({ d, className = "" }: { d: string; className?: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d={d} />
  </svg>
);

/* ---------- announcement + nav ---------- */

export function Announcement() {
  return (
    <div className="bg-signal px-4 py-2 text-center text-[14px] text-white">
      Hindi and English, fully offline on Apple Silicon.{" "}
      <Link href="/studio" className="font-medium underline underline-offset-2">
        Open the studio →
      </Link>
    </div>
  );
}

/* ---------- hero ---------- */

const BUILT_ON = ["Apple MLX", "Qwen3", "Whisper", "Moonshine", "Kokoro", "Chatterbox", "Silero VAD"];

export function Hero() {
  return (
    <section className="bg-white pb-20 pt-16 md:pt-24">
      <Container className="text-center">
        <Eyebrow>Local-first · Apache, MIT &amp; BSD only</Eyebrow>
        <h1 className="font-display mx-auto mt-6 max-w-[15ch] md:max-w-[17ch]">Voices that never leave your Mac</h1>
        <p className="mx-auto mt-6 max-w-[56ch] text-[18px] leading-[1.47] tracking-[0.025em] text-slate">
          Swaraloom weaves speech recognition, a reasoning model and natural speech into one agent that runs entirely on your own
          machine — in Hindi and English, in a voice you own.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/studio" variant="primary">
            Open the studio
          </ButtonLink>
          <ButtonLink href="#how">See how it works</ButtonLink>
        </div>

        <div className="mt-16 border-t border-silk pt-8">
          <p className="text-[13px] text-pebble">Woven from open models</p>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-0 gap-y-3">
            {BUILT_ON.map((n) => (
              <li key={n} className="border-l border-silk px-6 font-serif text-[1.25rem] font-light tracking-[-0.017em] text-ash first:border-l-0">
                {n}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

/* ---------- field + floating demo cards ---------- */

function Waveform() {
  const bars = [0.4, 0.8, 0.5, 1, 0.65, 0.9, 0.45, 0.75, 0.55, 0.95, 0.5, 0.7, 0.4, 0.85, 0.6];
  return (
    <div className="flex h-10 items-center gap-[3px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] origin-center rounded-full bg-signal"
          style={{ height: `${h * 100}%`, animation: `bar ${1.1 + (i % 5) * 0.17}s ease-in-out ${i * 0.06}s infinite` }}
        />
      ))}
    </div>
  );
}

export function FieldDemo() {
  return (
    <section className="bg-white pb-8">
      <Container>
        <div className="relative overflow-hidden rounded-[20px] border border-silk">
          {/* Muted aerial-field texture: crop rows, a road, soft light. Pure CSS — no stock photo. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              animation: "drift 28s ease-in-out infinite alternate",
              background: [
                "linear-gradient(112deg, transparent 0 46%, rgba(231,229,222,.95) 46% 47.2%, transparent 47.2% 100%)",
                "repeating-linear-gradient(112deg, rgba(120,140,98,.55) 0 36px, rgba(142,160,112,.5) 36px 72px, rgba(168,176,128,.5) 72px 100px, rgba(104,128,88,.55) 100px 140px)",
                "radial-gradient(120% 90% at 20% 10%, rgba(255,255,255,.55), transparent 60%)",
                "linear-gradient(180deg, #9fb18a, #7f9a74)",
              ].join(","),
              filter: "saturate(.7)",
            }}
          />
          <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_1.1fr] md:p-12 lg:p-16">
            {/* Stat card */}
            <div className="self-start rounded-[14px] bg-white/80 p-6 shadow-stat backdrop-blur-md md:max-w-[300px]">
              <p className="font-serif text-[4rem] font-light leading-none tracking-[-0.04em] text-midnight">0</p>
              <p className="mt-3 text-[14px] text-slate">bytes of audio or text leave your machine — no cloud APIs, no recurring cost.</p>
            </div>

            {/* Chat demo */}
            <div className="rounded-[20px] border border-silk bg-white p-6 shadow-float" aria-label="Sample conversation">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] font-medium text-charcoal">Swaraloom</span>
                <span className="text-[12px] text-ash">Sample conversation</span>
              </div>
              <div className="space-y-3 text-[15px]">
                <p className="ml-auto w-fit max-w-[85%] rounded-[20px] bg-charcoal px-4 py-2.5 text-white">What files are in my workspace?</p>
                <p className="w-fit max-w-[90%] rounded-[20px] border border-silk px-4 py-2.5 text-charcoal">
                  <span className="mb-1 block font-mono text-[12px] text-ember">list_files() → database.yml (52 bytes)</span>
                  One file: <b className="font-medium">database.yml</b>.
                </p>
                <p className="ml-auto w-fit max-w-[85%] rounded-[20px] bg-charcoal px-4 py-2.5 text-white">Read it and tell me the pool size.</p>
                <p className="w-fit max-w-[90%] rounded-[20px] border border-silk px-4 py-2.5 text-charcoal">The pool size in database.yml is 5.</p>
                <p className="w-fit max-w-[90%] rounded-[20px] border border-ember/50 bg-ember/5 px-4 py-2.5 text-[14px] text-charcoal">
                  <span className="font-medium text-ember">Confirm?</span> write_file(summary.txt) — approval is typed, never spoken.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-4 rounded-full bg-bone px-5 py-3">
                <Waveform />
                <span className="text-[14px] text-ash">Listening…</span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-[12px] text-ash">Illustrative interface. The exchange is taken from the project’s own end-to-end tool test.</p>
      </Container>
    </section>
  );
}

/* ---------- how it works: triptych ---------- */

function MiniCard({ children }: { children: ReactNode }) {
  return <div className="flex aspect-[4/3] flex-col justify-center rounded-[20px] border border-silk bg-white p-6">{children}</div>;
}

export function Triptych() {
  return (
    <section id="how" className="scroll-mt-4 bg-white py-[96px] md:py-[120px]">
      <Container>
        <div className="mx-auto max-w-[720px] text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="font-heading-lg mt-5">Listen. Think. Speak.</h2>
          <p className="mt-4 text-[18px] leading-[1.47] text-slate">
            Every stage runs on your own silicon, behind a swappable interface. Replace any model without touching the rest.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <div>
            <MiniCard>
              <p className="text-[12px] uppercase tracking-[0.12em] text-ash">Speech in</p>
              <Waveform />
              <p className="mt-3 rounded-[14px] bg-bone px-4 py-3 text-[14px] text-charcoal">“Kal subah ki meeting ka summary likho.”</p>
            </MiniCard>
            <h3 className="font-heading-sm mt-5 text-signal">Listen</h3>
            <p className="mt-2 text-[16px] text-slate">
              Silero detects when you start and stop. Moonshine streams English in real time; Whisper handles Hindi. You can interrupt it
              mid-sentence.
            </p>
          </div>
          <div>
            <MiniCard>
              <p className="text-[12px] uppercase tracking-[0.12em] text-ash">Reasoning</p>
              <div className="mt-3 space-y-2 text-[13px]">
                <p className="rounded-full border border-silk px-4 py-2 text-charcoal">recall(“meeting notes”)</p>
                <p className="rounded-full border border-silk px-4 py-2 text-charcoal">read_file(“notes.md”)</p>
                <p className="rounded-full border border-ember/50 bg-ember/5 px-4 py-2 text-charcoal">write_file → confirm</p>
              </div>
            </MiniCard>
            <h3 className="font-heading-sm mt-5 text-signal">Think</h3>
            <p className="mt-2 text-[16px] text-slate">
              Qwen3-4B on MLX calls tools inside a sandbox, with encrypted memory injected as context. Anything that writes, runs or
              reaches the network waits for your yes.
            </p>
          </div>
          <div>
            <MiniCard>
              <p className="text-[12px] uppercase tracking-[0.12em] text-ash">Speech out</p>
              <p className="font-serif text-[1.75rem] font-light leading-tight tracking-[-0.02em] text-midnight">नमस्ते, आपकी आवाज़ में।</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="rounded-full bg-signal px-4 py-2 text-[13px] font-medium text-white">▶ Play</span>
                <span className="text-[13px] text-pebble">first sentence spoken while the rest is still being written</span>
              </div>
            </MiniCard>
            <h3 className="font-heading-sm mt-5 text-signal">Speak</h3>
            <p className="mt-2 text-[16px] text-slate">
              Kokoro for English, Chatterbox for Hindi and cloned voices. Sentence-streamed, so audio starts in ~280 ms instead of waiting
              for the full reply.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- features ---------- */

const FEATURES = [
  {
    icon: "M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3zM9 12l2 2 4-4",
    title: "Private by construction",
    body: "No cloud call exists in the core path. Memory is encrypted at rest with a key in the macOS Keychain; one command wipes it and destroys the key.",
  },
  {
    icon: "M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3zM6 11a6 6 0 0012 0M12 17v4",
    title: "Consent-gated voice cloning",
    body: "There is no code path that stores a voice without a consent record. You type the phrase exactly — a checkbox is too easy to click past.",
  },
  {
    icon: "M4 6h16M4 12h10M4 18h16",
    title: "Hindi that reads as Hindi",
    body: "Script detection routes Devanagari to the Hindi voice. Code-mixed sentences are handled, and unsupported languages are refused instead of mispronounced.",
  },
  {
    icon: "M9 3h6l1 3h3v13H5V6h3l1-3zM9 13h6",
    title: "Tools with a gate",
    body: "Files, a command allow-list and HTTP — sandboxed on the resolved path. The confirmation gate fails closed, and approval is typed because “yes” is the word recognisers mishear.",
  },
  {
    icon: "M4 12a8 8 0 018-8 8 8 0 018 8M12 12l4-4M12 20v-2",
    title: "Fast enough to talk to",
    body: "A prefix cache keeps time-to-first-token flat as the chat grows — about 165 ms warm instead of climbing every turn.",
  },
  {
    icon: "M5 5h14v14H5zM5 10h14M10 5v14",
    title: "A licence audit that fails the build",
    body: "Only Apache, MIT and BSD. Every installed package is checked, and a copyleft dependency makes the diagnostic exit non-zero.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-4 bg-bone py-[96px] md:py-[120px]">
      <Container>
        <div className="max-w-[640px]">
          <Eyebrow>Features</Eyebrow>
          <h2 className="font-heading-lg mt-5">Built to be trusted, not just demoed</h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="rounded-[20px] border border-silk bg-white p-6">
              <Icon d={f.icon} className="text-ember" />
              <h3 className="font-heading-sm mt-5 !text-[1.5rem] text-midnight">{f.title}</h3>
              <p className="mt-3 text-[15px] leading-[1.55] text-slate">{f.body}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- numbers ---------- */

const STATS = [
  ["0.12", "RTF", "English speech-to-text, streaming, in 228 MiB"],
  ["165 ms", "", "to first token, warm, with the prefix cache"],
  ["0.63", "RTF", "Hindi speech synthesis, 8-bit — faster than real time"],
  ["5.9 GiB", "", "whole pipeline resident, against a 12 GiB budget"],
];

const GAPS = [
  "Sub-1 s turn latency isn’t met yet — about 1.8 s to first audio when warm.",
  "No echo cancellation, so headphones are advised.",
  "Hindi is the only Indian language spoken, and it needs an enrolled voice.",
  "Naturalness hasn’t been rated by human listeners yet — only intelligibility has been measured.",
];

export function Numbers() {
  return (
    <section id="numbers" className="scroll-mt-4 bg-white py-[96px] md:py-[120px]">
      <Container>
        <div className="mx-auto max-w-[720px] text-center">
          <Eyebrow>Numbers</Eyebrow>
          <h2 className="font-heading-lg mt-5">Measured, not claimed</h2>
          <p className="mt-4 text-[18px] leading-[1.47] text-slate">
            Timed on an M3 Pro with 18 GiB. RTF is compute time divided by audio length — below 1.0 is faster than real time.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(([n, unit, label]) => (
            <div key={label} className="rounded-[20px] border border-silk p-6">
              <p className="font-serif text-[2.75rem] font-light leading-none tracking-[-0.03em] text-midnight">
                {n}
                {unit && <span className="ml-1.5 text-[1.25rem] text-pebble">{unit}</span>}
              </p>
              <p className="mt-3 text-[14px] text-slate">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[20px] border border-ember/40 bg-ember/[0.04] p-6 md:p-8">
          <h3 className="font-heading-sm !text-[1.5rem] text-midnight">What it can’t do yet</h3>
          <ul className="mt-4 grid gap-x-10 gap-y-3 md:grid-cols-2">
            {GAPS.map((g) => (
              <li key={g} className="flex gap-3 text-[15px] text-slate">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ember" aria-hidden />
                {g}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

/* ---------- pipeline ---------- */

const PIPE = [
  ["Mic", "your voice"],
  ["VAD", "Silero"],
  ["STT", "Moonshine · Whisper"],
  ["LLM + tools", "Qwen3-4B · MLX"],
  ["TTS router", "Kokoro · Chatterbox"],
  ["Speaker", "your voice, or yours cloned"],
];

export function Pipeline() {
  return (
    <section className="bg-bone py-[96px]">
      <Container>
        <h2 className="font-heading text-center">One loop, six stages, one machine</h2>
        <ol className="mt-12 grid gap-3 md:grid-cols-6">
          {PIPE.map(([t, s], i) => (
            <li key={t} className="relative rounded-[14px] border border-silk bg-white px-4 py-5 text-center">
              <span className="text-[12px] text-ember">0{i + 1}</span>
              <p className="mt-1 text-[15px] font-medium text-midnight">{t}</p>
              <p className="mt-1 text-[13px] text-pebble">{s}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------- pricing ---------- */

const PLANS = [
  { name: "Desktop", price: "Free", note: "on your own Mac", feats: ["Everything runs locally", "Unlimited generation", "Your voices, your keys"], cta: "Open the studio", href: "/studio", primary: true },
  { name: "Creator", price: "₹499", note: "per month · hosted", feats: ["500,000 characters", "₹25 per extra 10k", "Hindi + English API"], cta: "Hosted plans — soon" },
  { name: "Developer", price: "₹1,999", note: "per month · hosted", feats: ["2,500,000 characters", "₹25 per extra 10k", "API keys & usage metering"], cta: "Hosted plans — soon" },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-4 bg-white py-[96px] md:py-[120px]">
      <Container>
        <div className="mx-auto max-w-[720px] text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="font-heading-lg mt-5">Free on your Mac. Metered if you’d rather we host it.</h2>
          <p className="mt-4 text-[16px] text-slate">
            The hosted API is built and metered, but payments aren’t live yet — so those plans aren’t purchasable today.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <article key={p.name} className={`flex flex-col rounded-[20px] border p-7 ${p.primary ? "border-charcoal" : "border-silk"}`}>
              <h3 className="font-heading-sm text-midnight">{p.name}</h3>
              <p className="mt-4 font-serif text-[3rem] font-light leading-none tracking-[-0.03em] text-midnight">{p.price}</p>
              <p className="mt-1 text-[13px] text-pebble">{p.note}</p>
              <ul className="mt-6 flex-1 space-y-3 text-[15px] text-slate">
                {p.feats.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ember" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {p.href ? (
                  <ButtonLink href={p.href} variant="primary" className="w-full">
                    {p.cta}
                  </ButtonLink>
                ) : (
                  <span className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full border border-silk px-5 py-3 text-[15px] font-medium text-ash">
                    {p.cta}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- final CTA + footer ---------- */

export function FinalCta() {
  return (
    <section className="bg-bone py-[96px] md:py-[120px]">
      <Container className="text-center">
        <h2 className="font-heading-lg mx-auto max-w-[18ch]">Give your agent a voice of its own</h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-[18px] leading-[1.47] text-slate">
          Enrol a voice in a minute, type a line, and hear it back — without a single request leaving your machine.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/studio/voices" variant="primary">
            Enrol a voice
          </ButtonLink>
          <ButtonLink href="/studio">Open the studio</ButtonLink>
        </div>
      </Container>
    </section>
  );
}

const FOOTER: Record<string, [string, string][]> = {
  Product: [
    ["Studio", "/studio"],
    ["Voices", "/studio/voices"],
    ["Train", "/studio/train"],
  ],
  Explore: [
    ["How it works", "#how"],
    ["Features", "#features"],
    ["Numbers", "#numbers"],
    ["Pricing", "#pricing"],
  ],
  Trust: [
    ["Listening test", "/listen"],
    ["Benchmark", "/studio/benchmark"],
  ],
};

export function Footer() {
  return (
    <footer className="bg-midnight py-16 text-ash">
      <Container>
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-[32ch] text-[14px] leading-[1.55]">Local voice, woven on your own silicon. Nothing leaves the machine.</p>
          </div>
          {Object.entries(FOOTER).map(([h, links]) => (
            <div key={h}>
              <p className="text-[14px] font-medium text-white">{h}</p>
              <ul className="mt-5 space-y-3 text-[14px]">
                {links.map(([label, href]) => (
                  <li key={label}>
                    {href.startsWith("#") ? (
                      <a href={href} className="transition-colors hover:text-white">
                        {label}
                      </a>
                    ) : (
                      <Link href={href} className="transition-colors hover:text-white">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-14 border-t border-graphite pt-6 text-[13px]">© {new Date().getFullYear()} Swaraloom. Built on Apache-2.0, MIT and BSD software.</p>
      </Container>
    </footer>
  );
}
