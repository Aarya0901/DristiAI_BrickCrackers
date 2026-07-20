import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Seat not found",
};

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center border-b border-[var(--line-subtle)]">
      <div
        className="mx-auto grid w-full gap-10 lg:grid-cols-[1fr_320px] lg:items-center"
        style={{ maxWidth: "var(--content-max)", paddingInline: "var(--content-pad)" }}
      >
        <div>
          <p className="font-mono text-[var(--text-label)] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
            › 404
          </p>
          <h1
            className="mt-4 font-medium"
            style={{ fontSize: "var(--text-section)", lineHeight: "var(--lh-tight)", letterSpacing: "var(--tracking-tight)" }}
          >
            This seat is unobservable.
          </h1>
          <p className="mt-4 max-w-[480px] text-[var(--ink-secondary)]" style={{ fontSize: "var(--text-body-lg)" }}>
            The page you&rsquo;re looking for doesn&rsquo;t exist, or the route has moved.
            Visibility insufficient — abstaining, not guessing.
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <Button href="/" variant="primary">
              Return to the homepage
            </Button>
            <Button href="/research" variant="ghost">
              Read the architecture
            </Button>
          </div>
        </div>

        <div className="flex aspect-square w-full max-w-[320px] items-center justify-center border border-dashed border-[var(--unobservable)] bg-[var(--unobservable-soft)]">
          <span className="font-mono text-[13px] uppercase tracking-[var(--tracking-wide)] text-[var(--unobservable)]">
            visibility insufficient
          </span>
        </div>
      </div>
    </section>
  );
}
