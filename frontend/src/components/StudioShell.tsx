"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BackendProvider, useBackend } from "./BackendProvider";
import { Logo } from "./ui";

const NAV = [
  { href: "/studio", label: "Speak" },
  { href: "/studio/voices", label: "Voices" },
  { href: "/studio/train", label: "Train" },
  { href: "/studio/benchmark", label: "Benchmark" },
];

function Banner() {
  const { config, offline } = useBackend();
  if (offline) {
    return (
      <div className="rounded-[14px] border border-err/30 bg-err/5 px-4 py-3 text-[14px] text-iron">
        <b className="font-medium text-err">Can’t reach the voice engine.</b>{" "}
        Start it with <code className="rounded bg-mist px-1.5 py-0.5 text-[13px]">uv run voice-web</code> and this page
        reconnects on its own.
      </div>
    );
  }
  if (config?.stale) {
    // textContent semantics: React escapes this, and it carries a filename from disk.
    return (
      <div className="rounded-[14px] border border-err/30 bg-err/5 px-4 py-3 text-[14px] text-iron">
        <b className="font-medium text-err">This server is out of date — restart it.</b>
        <span className="mt-1 block text-pebble">{config.stale}</span>
        <span className="mt-1 block text-pebble">
          Stop it with Ctrl-C and run <code className="rounded bg-mist px-1.5 py-0.5 text-[13px]">uv run voice-web</code> again.
        </span>
      </div>
    );
  }
  return null;
}

function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Studio" className="flex flex-wrap items-center gap-1 rounded-full bg-mist p-1">
      {NAV.map((n) => {
        const active = n.href === "/studio" ? pathname === "/studio" : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-[15px] font-medium transition-colors ${
              active ? "bg-white text-signal shadow-[0_1px_2px_rgba(23,23,23,0.08)]" : "text-charcoal hover:text-signal"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StudioShell({ children }: { children: ReactNode }) {
  return (
    <BackendProvider>
      <div className="min-h-screen bg-bone">
        <header className="border-b border-silk bg-white">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-4">
            <Link href="/" aria-label="Swaraloom home">
              <Logo />
            </Link>
            <Nav />
            <span className="hidden text-[13px] text-pebble md:inline">Runs on this Mac · nothing is uploaded</span>
          </div>
        </header>
        <main className="mx-auto max-w-[820px] space-y-5 px-6 pb-24 pt-10">
          <Banner />
          {children}
        </main>
      </div>
    </BackendProvider>
  );
}
