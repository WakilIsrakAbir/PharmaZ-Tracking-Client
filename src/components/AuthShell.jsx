import { CalendarDays, ClipboardCheck, Users } from "lucide-react";

import { Logo } from "@/components/Logo";
import { STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// The sign-in page frame: a brand panel on large screens, the form beside it.
export function AuthShell({ children }) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <main className="flex flex-col px-4 py-8 sm:px-8">
        <Logo className="lg:hidden" />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground">PharmaZ247 · Internal tool for the marketing team</p>
      </main>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-32 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(98,120,224,0.45),transparent)]" />
        <div className="absolute -bottom-48 -left-32 size-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(240,160,32,0.16),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black_35%,transparent_75%)] bg-size-[48px_48px]" />
      </div>

      <Logo inverted className="relative" />

      <div className="relative my-auto max-w-md py-12">
        <h2 className="text-4xl leading-[1.15] font-semibold tracking-tight text-balance">Every doctor and pharmacy, on track.</h2>
        <p className="mt-4 text-lg leading-relaxed text-white/70">
          Fill in onboarding forms after each visit, see them on one calendar, and know where every partner stands.
        </p>
        <div className="mt-10 space-y-3">
          <PreviewCard when="Today · 5:00 PM" kind="Doctor" name="Dr. Tanvir Ahmed" place="Square Hospital Chambers, Panthapath" status="setup" />
          <PreviewCard when="Tomorrow · 11:30 AM" kind="Pharmacy" name="Rahman Pharmacy" place="Dhanmondi 27, Dhaka" status="implementation" className="ml-8" />
        </div>
      </div>

      <ul className="relative flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
        <Feature icon={ClipboardCheck}>The forms you already use</Feature>
        <Feature icon={CalendarDays}>One shared calendar</Feature>
        <Feature icon={Users}>Everyone up to date</Feature>
      </ul>
    </aside>
  );
}

// A small, made-up example of what the calendar shows.
function PreviewCard({ when, kind, name, place, status, className }) {
  const { label, dot } = STATUSES[status];
  return (
    <div className={cn("max-w-sm rounded-xl border border-white/10 bg-white/[0.07] p-4 shadow-lg shadow-black/10 backdrop-blur-sm", className)}>
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-white/60">
        <span>{when}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-white/90">
          <span className={cn("size-1.5 rounded-full", dot)} />
          {label}
        </span>
      </div>
      <p className="mt-2 font-semibold">
        {kind} · {name}
      </p>
      <p className="mt-0.5 text-sm text-white/60">{place}</p>
    </div>
  );
}

function Feature({ icon: Icon, children }) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="size-4 text-white/50" />
      {children}
    </li>
  );
}
