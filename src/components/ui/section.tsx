import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  hideHeader,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  hideHeader?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("px-6 py-24 sm:py-28", className)}>
      <div className="mx-auto max-w-6xl">
        {!hideHeader ? (
          <div className="mb-10">
            {eyebrow ? (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-tight text-white/80 backdrop-blur-3xl">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_16px_rgba(0,230,118,.55)]" />
                <span>{eyebrow}</span>
              </div>
            ) : null}
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-3 max-w-2xl text-pretty text-base leading-7 text-white/70">
                {subtitle}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

