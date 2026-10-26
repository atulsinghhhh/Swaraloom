"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type Config, type Voice } from "@/lib/api";

type Backend = {
  config: Config | null;
  offline: boolean;
  voices: Voice[] | null;
  refreshVoices: () => Promise<void>;
};

const Ctx = createContext<Backend | null>(null);

/**
 * One poller for the whole studio: backend config (re-checked every 10 s) and
 * the voice list. The server compares the code it imported against the tree on
 * disk and reports `stale` when they differ — that failure looks like a broken
 * model, so the shell says so up front. A failed poll is just the server being
 * restarted, which is exactly what the banner asks for, so it is shown as
 * "offline", not as an error.
 */
export function BackendProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [offline, setOffline] = useState(false);
  const [voices, setVoices] = useState<Voice[] | null>(null);

  const refreshVoices = useCallback(async () => {
    try {
      setVoices(await api.voices());
    } catch {
      setVoices((v) => v ?? []);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const poll = () =>
      api
        .config()
        .then((c) => {
          if (!alive) return;
          setConfig(c);
          setOffline(false);
        })
        .catch(() => alive && setOffline(true));
    poll();
    refreshVoices();
    const id = setInterval(poll, 10_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [refreshVoices]);

  return <Ctx.Provider value={{ config, offline, voices, refreshVoices }}>{children}</Ctx.Provider>;
}

export function useBackend() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBackend must be used inside <BackendProvider>");
  return v;
}
