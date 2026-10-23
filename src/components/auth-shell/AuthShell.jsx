import { BrandPanel } from "@/components/auth-shell/BrandPanel";
import { Logo } from "@/components/shared/Logo";

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
