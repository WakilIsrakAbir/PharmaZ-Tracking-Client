import { Logo } from "@/components/shared/Logo";
import { STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// The sign-in page frame, kept small enough to fit any laptop screen without scrolling.
//   Large screens  the navy brand panel on the left; the form in a white card on the right.
//   Phones         a navy band with the logo, and the form's card rising out of it.
export function AuthShell({ children }) {
  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-2">
      <BrandPanel />
      <main className="flex min-w-0 flex-col">
        <div className="relative overflow-hidden bg-primary px-6 pt-7 pb-20 text-primary-foreground lg:hidden">
          <Backdrop />
          <Logo inverted className="relative" />
        </div>
        {/* On phones the card rises over the band, so it sits on a layer above it. */}
        <div className="relative z-10 -mt-12 flex flex-1 items-start justify-center px-4 pb-8 sm:px-8 lg:mt-0 lg:items-center lg:p-10">
          <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-xl shadow-primary/[0.06] sm:p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-primary px-10 py-9 text-primary-foreground lg:flex lg:flex-col xl:px-14">
      <Backdrop />
      <Logo inverted className="relative" />
      <div className="relative my-auto w-full max-w-md py-8">
        <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance">Every doctor and pharmacy, on track.</h2>
        <p className="mt-3 text-white/65">Onboarding forms, one shared calendar, and where every partner stands.</p>
        <TodayPreview className="mt-8" />
      </div>
      <p className="relative text-xs text-white/45">PharmaZ247 · Internal tool for the marketing team</p>
    </aside>
  );
}

// Soft light and a faint grid behind the navy, so it isn't a flat block.
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 -right-32 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(98,120,224,0.42),transparent)]" />
      <div className="absolute -bottom-48 -left-32 size-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(240,160,32,0.14),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black_35%,transparent_75%)] bg-size-[48px_48px]" />
    </div>
  );
}

// A made-up glimpse of the day list on the dashboard: what the team sees once signed in.
const PREVIEW = [
  { initials: "TA", name: "Dr. Tanvir Ahmed", place: "Square Hospital · 11:00 AM", status: "setup" },
  { initials: "RP", name: "Rahman Pharmacy", place: "Dhanmondi 27 · 2:30 PM", status: "implementation" },
  { initials: "LP", name: "Lazz Pharma", place: "Kalabagan · 5:15 PM", status: "demo" },
];

function TodayPreview({ className }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 backdrop-blur-sm", className)}>
      <p className="border-b border-white/10 px-4 py-2.5 text-[11px] font-semibold tracking-wide text-white/80 uppercase">Today</p>
      <ul className="divide-y divide-white/[0.08]">
        {PREVIEW.map((visit) => {
          const { label, dot } = STATUSES[visit.status];
          return (
            <li key={visit.name} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/85">{visit.initials}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{visit.name}</span>
                <span className="block truncate text-xs text-white/55">{visit.place}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/90">
                <span className={cn("size-1.5 rounded-full", dot)} />
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
