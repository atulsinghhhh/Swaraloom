"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ButtonLink, Logo } from "./ui";

/* Same anatomy as the reference header: logo · pill nav with dropdowns ·
   text "Login"-style link + primary pill on the right. The Resources panel is
   a mega-menu (featured card, two feature cards, a plain link list); Platform
   is a simple stacked list. Every entry points at something that exists. */

type Item = { label: string; href: string; blurb?: string };

const PLATFORM: Item[] = [
  { label: "Listen", href: "/#how", blurb: "Voice detection and streaming speech recognition." },
  { label: "Think", href: "/#how", blurb: "A local reasoning model with sandboxed tools and encrypted memory." },
  { label: "Speak", href: "/#how", blurb: "Natural English and Hindi speech, streamed sentence by sentence." },
  { label: "Voice cloning", href: "/studio/voices", blurb: "Consent-gated: no consent record, no stored voice." },
];

const LINKS: Item[] = [
  { label: "How it works", href: "/#how" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Benchmark", href: "/studio/benchmark" },
  { label: "Train a voice", href: "/studio/train" },
];

const chevron = (open: boolean) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
    <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const pill = "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[15px] font-medium text-charcoal transition-colors hover:text-signal aria-expanded:text-signal";

function Dropdown({
  id,
  label,
  open,
  onToggle,
  onClose,
  children,
  align = "left",
}: {
  id: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
  align?: "left" | "center";
}) {
  const ref = useRef<HTMLLIElement>(null);

  // Hover opens it on desktop (like the reference), click/keyboard works everywhere.
  return (
    <li
      ref={ref}
      className="relative"
      onMouseEnter={() => !open && onToggle()}
      onMouseLeave={() => open && onClose()}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) onClose();
      }}
    >
      <button type="button" className={pill} aria-expanded={open} aria-controls={id} aria-haspopup="true" onClick={onToggle}>
        {label}
        {chevron(open)}
      </button>
      {open && (
        <div
          id={id}
          className={`absolute top-full z-50 pt-2 ${align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"}`}
        >
          <div className="rounded-[20px] border border-silk bg-white p-3 shadow-float">{children}</div>
        </div>
      )}
    </li>
  );
}

function DesktopNav() {
  const [open, setOpen] = useState<string | null>(null);
  const close = () => setOpen(null);
  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-nav]")) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, []);

  return (
    <nav aria-label="Primary" data-nav className="hidden lg:block">
      <ul className="flex items-center gap-0.5">
        <Dropdown id="m-platform" label="Platform" open={open === "platform"} onToggle={() => toggle("platform")} onClose={close}>
          <ul className="w-[340px]">
            {PLATFORM.map((i) => (
              <li key={i.label}>
                <Link href={i.href} onClick={close} className="block rounded-[14px] px-4 py-3 transition-colors hover:bg-bone">
                  <span className="block text-[15px] font-medium text-midnight">{i.label}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-pebble">{i.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Dropdown>

        <Dropdown id="m-resources" label="Resources" open={open === "resources"} onToggle={() => toggle("resources")} onClose={close}>
          <div className="grid w-[640px] grid-cols-[1.15fr_1fr] gap-3">
            <div className="grid gap-3">
              {/* Featured */}
              <Link
                href="/#numbers"
                onClick={close}
                className="group relative overflow-hidden rounded-[14px] border border-silk bg-bone p-5 transition-colors hover:border-quill"
              >
                <span className="inline-flex rounded-full border border-ember px-2.5 py-0.5 text-[12px] font-medium text-ember">Featured</span>
                <span className="font-heading-sm mt-3 block text-[1.25rem] text-midnight">Measured, not claimed</span>
                <span className="mt-1 block text-[13px] leading-snug text-slate">
                  Real-time factors, latency and memory — and an honest list of what it can’t do yet.
                </span>
                <span className="mt-3 inline-block text-[13px] font-medium text-signal">Read now →</span>
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/listen" onClick={close} className="rounded-[14px] border border-silk p-4 transition-colors hover:border-quill hover:bg-bone">
                  <span className="block text-[15px] font-medium text-midnight">Listening test</span>
                  <span className="mt-1 block text-[13px] leading-snug text-pebble">Hear clips blind and rate how natural they sound.</span>
                  <span className="mt-2 inline-block text-[13px] font-medium text-signal">Start →</span>
                </Link>
                <Link href="/studio/benchmark" onClick={close} className="rounded-[14px] border border-silk p-4 transition-colors hover:border-quill hover:bg-bone">
                  <span className="block text-[15px] font-medium text-midnight">Benchmark</span>
                  <span className="mt-1 block text-[13px] leading-snug text-pebble">Record the held-out sentences for the test.</span>
                  <span className="mt-2 inline-block text-[13px] font-medium text-signal">Record →</span>
                </Link>
              </div>
            </div>
            <div className="px-3 py-2">
              <p className="mb-2 text-[12px] uppercase tracking-[0.12em] text-ash">Links</p>
              <ul>
                {LINKS.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} onClick={close} className="block rounded-full px-3 py-2 text-[15px] text-charcoal transition-colors hover:bg-bone hover:text-signal">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Dropdown>

        <li>
          <Link href="/#numbers" className={pill}>
            Numbers
          </Link>
        </li>
        <li>
          <Link href="/#pricing" className={pill}>
            Pricing
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = () => setOpen(false);
  const row = "flex w-full items-center justify-between border-b border-silk py-4 text-left font-serif text-[1.5rem] font-light tracking-[-0.02em] text-midnight";

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-11 place-items-center rounded-full border border-silk text-charcoal"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[var(--nav-h,72px)] z-50 overflow-y-auto bg-white px-6 pb-10">
          <ul>
            {[
              ["platform", "Platform", PLATFORM],
              ["resources", "Resources", LINKS],
            ].map(([id, label, items]) => (
              <li key={id as string}>
                <button type="button" className={row} aria-expanded={sub === id} onClick={() => setSub(sub === id ? null : (id as string))}>
                  {label as string}
                  {chevron(sub === id)}
                </button>
                {sub === id && (
                  <ul className="border-b border-silk py-2">
                    {(items as Item[]).map((i) => (
                      <li key={i.label}>
                        <Link href={i.href} onClick={go} className="block py-2.5 text-[16px] text-charcoal">
                          {i.label}
                        </Link>
                      </li>
                    ))}
                    {id === "resources" && (
                      <li>
                        <Link href="/listen" onClick={go} className="block py-2.5 text-[16px] text-charcoal">
                          Listening test
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            ))}
            <li>
              <Link href="/#numbers" onClick={go} className={row}>
                Numbers
              </Link>
            </li>
            <li>
              <Link href="/#pricing" onClick={go} className={row}>
                Pricing
              </Link>
            </li>
          </ul>
          <div className="mt-8 flex flex-col gap-3">
            <ButtonLink href="/studio/voices" variant="primary" className="w-full">
              Get started
            </ButtonLink>
            <ButtonLink href="/studio" className="w-full">
              Open studio
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  return (
    <header className="relative z-40 bg-white" style={{ ["--nav-h" as string]: "72px" }}>
      <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between gap-6 px-6 md:px-10">
        <Link href="/" aria-label="Swaraloom home" className="shrink-0">
          <Logo />
        </Link>
        <DesktopNav />
        <div className="flex items-center gap-2">
          {/* The reference's "Login" text link, here the way into the studio. */}
          <Link href="/studio" className="hidden rounded-full px-3.5 py-2 text-[15px] font-medium text-charcoal transition-colors hover:text-signal sm:inline-flex">
            Open studio
          </Link>
          <ButtonLink href="/studio/voices" variant="primary" className="hidden !py-2.5 sm:inline-flex">
            Get started
          </ButtonLink>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
