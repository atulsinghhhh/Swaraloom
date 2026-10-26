import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const cx = (...a: (string | false | undefined | null)[]) => a.filter(Boolean).join(" ");

type Variant = "primary" | "ghost" | "inverse" | "danger";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium tracking-[0.025em] transition-colors disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-signal text-white hover:bg-signal-deep",
  ghost: "border border-charcoal text-charcoal hover:bg-charcoal hover:text-white",
  inverse: "bg-white text-charcoal hover:bg-bone",
  danger: "border border-err/40 text-err hover:bg-err hover:text-white",
};

export function Button({
  variant = "ghost",
  small,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean }) {
  return <button className={cx(base, variants[variant], small && "!px-4 !py-2 !text-[14px]", className)} {...rest} />;
}

export function ButtonLink({
  href,
  variant = "ghost",
  className,
  children,
  external,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
  external?: boolean;
}) {
  const cls = cx(base, variants[variant], className);
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx("rounded-[20px] border border-silk bg-white p-6", className)}>{children}</section>;
}

export function SectionTitle({ n, children, hint }: { n?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="font-heading-sm !text-[1.5rem] text-midnight">
        {n && <span className="mr-2 text-ember">{n}</span>}
        {children}
      </h2>
      {hint && <p className="mt-1 text-[14px] text-pebble">{hint}</p>}
    </div>
  );
}

export function Label({ children, hint, htmlFor }: { children: ReactNode; hint?: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 mt-4 block text-[13px] font-medium text-graphite first:mt-0">
      {children}
      {hint && <span className="ml-1.5 font-normal text-ash">{hint}</span>}
    </label>
  );
}

const field =
  "w-full rounded-[14px] border border-silk bg-white px-4 py-3 text-[15px] text-midnight placeholder:text-ash focus:border-signal focus:outline-none";

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(field, p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={cx(field, "min-h-28 resize-y leading-relaxed", p.className)} />
);
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={cx(field, "appearance-none pr-10", p.className)} />
);

export type Tone = "ok" | "err" | "warn" | "info";
export type StatusMsg = { text: string; tone: Tone } | null;

const toneCls: Record<Tone, string> = {
  ok: "text-ok",
  err: "text-err",
  warn: "text-warn",
  info: "text-slate",
};

export function Status({ msg, className }: { msg: StatusMsg; className?: string }) {
  return (
    <p role="status" aria-live="polite" className={cx("mt-3 min-h-5 whitespace-pre-wrap text-[14px]", msg && toneCls[msg.tone], className)}>
      {msg?.text}
    </p>
  );
}

export function Meter({ value }: { value: number }) {
  return (
    <div className="mt-3 h-1 overflow-hidden rounded-full bg-mist" aria-hidden>
      <div className="h-full rounded-full bg-signal transition-[width] duration-100" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full border border-ember px-3 py-1 text-[13px] font-medium text-ember", className)}>
      {children}
    </span>
  );
}

export function Muted({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("text-[13px] text-pebble", className)}>{children}</span>;
}

/** Wordmark: a small woven-bars glyph + serif name. */
export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <rect x="2" y="9" width="3.5" height="8" rx="1.75" fill="#f55c15" />
        <rect x="8" y="4" width="3.5" height="18" rx="1.75" fill="#397dff" />
        <rect x="14.5" y="7" width="3.5" height="12" rx="1.75" fill={light ? "#ffffff" : "#171717"} />
        <rect x="20.5" y="10.5" width="3.5" height="5" rx="1.75" fill="#397dff" />
      </svg>
      <span className={cx("font-serif text-[24px] font-light leading-none tracking-[-0.03em]", light ? "text-white" : "text-midnight")}>
        Swaraloom
      </span>
    </span>
  );
}
