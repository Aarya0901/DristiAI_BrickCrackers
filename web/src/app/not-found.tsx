import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "../components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center justify-center py-40 text-center">
      <span className="mono text-[length:0.75rem] text-[var(--ink-muted)]">404</span>
      <h1 className="font-display mt-4 font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1 }}>
        This seat does not exist.
      </h1>
      <p className="mt-4 max-w-[48ch] text-[var(--ink-secondary)]" style={{ fontSize: "var(--text-body)", lineHeight: 1.6 }}>
        The page you are looking for has been removed, moved, or never existed — like a seat outside the calibrated zone, it cannot be evaluated.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/" arrow>Return home</ButtonLink>
        <ButtonLink href="/demo" variant="secondary">View the demo</ButtonLink>
      </div>
    </div>
  );
}
