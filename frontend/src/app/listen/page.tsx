"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input, Label, Logo, Meter, Muted } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

type Kind = "identity" | "naturalness";
type Stage = "start" | "test" | "done";

function ListenTest() {
  const bench = useSearchParams().get("b") ?? "latest";
  const [stage, setStage] = useState<Stage>("start");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("identity");
  const [queue, setQueue] = useState<string[]>([]);
  const [at, setAt] = useState(0);
  const [played, setPlayed] = useState(false);
  const [ended, setEnded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState("Play it once, then answer. Trust your first reaction.");
  const audio = useRef<HTMLAudioElement | null>(null);
  const playedAt = useRef(0);
  const sending = useRef(false);

  useEffect(() => {
    try {
      setName(localStorage.getItem("listenName") ?? "");
    } catch {}
  }, []);

  const loadItem = useCallback(
    (items: string[], i: number) => {
      audio.current?.pause();
      const a = new Audio(`/api/listen/${bench}/audio/${items[i]}`);
      a.onended = () => {
        setPlaying(false);
        setEnded(true);
      };
      audio.current = a;
      setPlayed(false);
      setEnded(false);
      setPlaying(false);
      setHint("Play it once, then answer. Trust your first reaction.");
    },
    [bench],
  );

  useEffect(() => () => audio.current?.pause(), []);

  const begin = async (which: Kind) => {
    const listener = name.trim();
    if (!listener) return setError("Please put a name in first.");
    setError(null);
    setKind(which);
    try {
      localStorage.setItem("listenName", listener);
    } catch {}
    try {
      const s = await api.listenSession(bench, listener, which);
      const done = new Set(s.done);
      // Resume where they left off: re-asking an item they already rated would
      // weight that listener's opinion twice.
      const todo = s.items.filter((i) => !done.has(i));
      if (!todo.length) return setStage("done");
      setQueue(todo);
      setAt(0);
      setStage("test");
      loadItem(todo, 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load the test.");
    }
  };

  const play = () => {
    const a = audio.current;
    if (!a) return;
    a.currentTime = 0;
    a.play();
    if (!played) {
      setPlayed(true);
      playedAt.current = Date.now();
    }
    setPlaying(true);
    setEnded(false);
  };

  const answer = useCallback(
    async (fields: Record<string, string>) => {
      if (sending.current) return;
      sending.current = true;
      try {
        await api.listenRate(bench, {
          listener: name.trim(),
          item_id: queue[at],
          // First play to answer. The harness drops anything shorter than the clip
          // itself as a click-through, so this is measured, not guessed.
          ms: String(Date.now() - playedAt.current),
          ...fields,
        });
        audio.current?.pause();
        if (at + 1 >= queue.length) {
          setAt(at + 1);
          setStage("done");
        } else {
          setAt(at + 1);
          loadItem(queue, at + 1);
        }
      } catch {
        setHint("Could not save that — try again.");
      } finally {
        sending.current = false;
      }
    },
    [bench, name, queue, at, loadItem],
  );

  // Keyboard: space plays; 1–5 for naturalness; R / S for the identity test.
  // Faster for anyone scoring a hundred clips, and the harness is only useful if scoring is cheap.
  useEffect(() => {
    if (stage !== "test") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === " ") {
        e.preventDefault();
        play();
        return;
      }
      if (!played) return;
      if (kind === "naturalness" && /^[1-5]$/.test(e.key)) answer({ score: e.key });
      if (kind === "identity" && /^[rR]$/.test(e.key)) answer({ called_real: "true" });
      if (kind === "identity" && /^[sS]$/.test(e.key)) answer({ called_real: "false" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const choiceBase =
    "flex flex-col items-center gap-1 rounded-[20px] border border-silk bg-white px-4 py-6 text-midnight transition-colors enabled:hover:border-signal enabled:hover:bg-signal/5 disabled:opacity-40";

  return (
    <div className="mx-auto w-full max-w-[640px] px-6 py-14">
      <div className="mb-10 flex justify-center">
        <Logo />
      </div>

      {stage === "start" && (
        <Card className="!p-8">
          <h1 className="font-heading !text-[2rem]">A short listening test</h1>
          <p className="mt-3 text-pebble">
            You will hear short Hindi clips. There are no wrong answers — we are measuring the voice, not you. It takes about five
            minutes.
          </p>
          <div className="mt-6">
            <Label htmlFor="name">Your name or a nickname</Label>
            <Input id="name" placeholder="e.g. Ravi" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
            <p className="mt-1.5 text-[13px] text-pebble">Only used to keep your answers together so a reload does not start you over.</p>
          </div>
          <ol className="mt-6 space-y-2 text-[15px] text-slate">
            <li>
              <b className="font-medium text-midnight">Real or synthetic</b> — you hear one clip and say whether a person actually said
              it, or a computer produced it.
            </li>
            <li>
              <b className="font-medium text-midnight">How natural</b> — you rate how natural the Hindi sounds, 1 to 5.
            </li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => begin("identity")}>
              Real or synthetic
            </Button>
            <Button onClick={() => begin("naturalness")}>How natural</Button>
          </div>
          {error && <p className="mt-4 text-[14px] text-warn">{error}</p>}
        </Card>
      )}

      {stage === "test" && (
        <Card className="!p-8 text-center">
          <p className="text-[15px] text-slate">
            {kind === "identity" ? "Did a real person say this, or did a computer make it?" : "How natural does this Hindi sound?"}
          </p>
          <div className="my-6 flex justify-center">
            <Button variant="primary" onClick={play} className="!px-8 !py-4 !text-[17px]">
              {playing ? "■ Playing…" : ended ? "↻ Play again" : "▶ Play"}
            </Button>
          </div>

          {kind === "identity" ? (
            <div className="grid grid-cols-2 gap-3">
              <button className={choiceBase} disabled={!played} onClick={() => answer({ called_real: "true" })}>
                <span className="font-serif text-[1.5rem] font-light">A real person</span>
                <span className="text-[13px] text-pebble">someone actually said this · R</span>
              </button>
              <button className={choiceBase} disabled={!played} onClick={() => answer({ called_real: "false" })}>
                <span className="font-serif text-[1.5rem] font-light">Synthetic</span>
                <span className="text-[13px] text-pebble">a computer produced it · S</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {[
                [1, "bad"],
                [2, "poor"],
                [3, "fair"],
                [4, "good"],
                [5, "natural"],
              ].map(([n, label]) => (
                <button key={n} className={choiceBase} disabled={!played} onClick={() => answer({ score: String(n) })}>
                  <span className="font-serif text-[2rem] font-light">{n}</span>
                  <span className="text-[12px] text-pebble">{label}</span>
                </button>
              ))}
            </div>
          )}

          <Meter value={queue.length ? at / queue.length : 0} />
          <Muted className="mt-2 block">
            {at} of {queue.length} answered
          </Muted>
          <p className="mt-4 text-[13px] text-pebble">{hint}</p>
        </Card>
      )}

      {stage === "done" && (
        <Card className="!p-8 text-center">
          <h1 className="font-heading !text-[2rem]">धन्यवाद — that is all of them.</h1>
          <p className="mt-3 text-pebble">Your answers are saved. You can close this tab.</p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => begin(kind === "identity" ? "naturalness" : "identity")}>Do the other test</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function ListenPage() {
  return (
    <div className="min-h-screen bg-bone">
      <Suspense>
        <ListenTest />
      </Suspense>
    </div>
  );
}
