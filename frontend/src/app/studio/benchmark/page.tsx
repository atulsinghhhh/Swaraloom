"use client";

import { useCallback, useEffect, useState } from "react";
import { Recorder } from "@/components/Recorder";
import { Badge, Button, Card, Muted, SectionTitle, Status, type StatusMsg } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

type Sentence = { slug: string; text: string; targets: string[]; recorded: boolean };

export default function BenchmarkPage() {
  const [items, setItems] = useState<Sentence[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMsg>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.benchSentences().then(setItems).catch(() => setItems([])), []);
  useEffect(() => {
    load();
  }, [load]);

  const done = items?.filter((s) => s.recorded).length ?? 0;
  const current = items?.find((s) => s.slug === active) ?? items?.find((s) => !s.recorded) ?? null;

  return (
    <>
      <div className="mb-2">
        <h1 className="font-heading">Record the benchmark</h1>
        <p className="mt-2 text-pebble">
          Read each held-out sentence aloud. The blind listening test then compares your real reading against the synthetic one for
          the same sentence — so the two differ only in the thing being measured.
        </p>
      </div>

      <Card>
        <SectionTitle hint={items ? `${done} of ${items.length} recorded` : "Loading…"}>Now reading</SectionTitle>
        {current ? (
          <>
            <p className="font-heading-sm !text-[1.75rem] leading-snug text-midnight">{current.text}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {current.targets.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
            <div className="mt-5">
              <Recorder
                busy={busy}
                recordLabel={current.recorded ? "Re-record" : "Record"}
                onNotice={(t, tone) => setStatus({ text: t, tone })}
                onClip={async (c) => {
                  setBusy(true);
                  try {
                    const r = await api.benchRecord(current.slug, c.blob);
                    setStatus({ tone: "ok", text: `Saved. ${r.recorded} of ${r.total} recorded.` });
                    setActive(null);
                    await load();
                  } catch (e) {
                    setStatus({ tone: "err", text: e instanceof ApiError ? e.message : "Could not save." });
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </div>
            <Status msg={status} />
          </>
        ) : (
          <p className="text-ok">All sentences are recorded. Thank you.</p>
        )}
      </Card>

      <Card>
        <SectionTitle>All sentences</SectionTitle>
        <ul className="divide-y divide-silk">
          {items?.map((s) => (
            <li key={s.slug} className="flex items-center gap-3 py-3">
              <span className={`size-2.5 shrink-0 rounded-full ${s.recorded ? "bg-ok" : "bg-quill"}`} aria-label={s.recorded ? "recorded" : "not recorded"} />
              <button onClick={() => setActive(s.slug)} className="min-w-0 flex-1 truncate text-left text-[15px] text-midnight hover:text-signal">
                {s.text}
              </button>
              {s.recorded && (
                <Button
                  small
                  variant="danger"
                  onClick={async () => {
                    await api.benchUnrecord(s.slug).catch(() => {});
                    load();
                  }}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
          {items?.length === 0 && <Muted>No sentences available.</Muted>}
        </ul>
      </Card>
    </>
  );
}
