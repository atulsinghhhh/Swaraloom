import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StudioShell } from "@/components/StudioShell";

export const metadata: Metadata = { title: "Studio — Swaraloom" };

export default function Layout({ children }: { children: ReactNode }) {
  return <StudioShell>{children}</StudioShell>;
}
