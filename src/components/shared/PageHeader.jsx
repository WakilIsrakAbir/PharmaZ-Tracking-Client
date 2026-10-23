import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// The title row at the top of a page, with an optional "← back" link and buttons.
// Put it straight inside the page's container, so the back link can stay on screen while the page scrolls.
export function PageHeader({ title, description, actions, back }) {
  return (
    <>
      {back && <BackLink href={back.href} label={back.label} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </>
  );
}

// "← Doctors". It stays fixed at the top of the screen while the page scrolls (under the top bar on
// phones), so the way back is always one click away. The strip has the page's background and reaches
// the page's edges, so content scrolling under it doesn't show through.
// -mt-2 keeps the link where it would be without the strip; mb-1 keeps a 12px gap above the title.
function BackLink({ href, label }) {
  return (
    <div className="sticky top-14 z-20 -mx-4 -mt-2 mb-1 bg-canvas/90 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:px-8">
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> {label}
      </Link>
    </div>
  );
}
