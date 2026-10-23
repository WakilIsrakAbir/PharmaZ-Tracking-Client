import { Phone } from "lucide-react";

import { Avatar } from "@/components/shared/Avatar";
import { formatDate, formatPhone } from "@/lib/format";

// The marketing person who filled in the form, so the team knows whom to ask about it.
// The name and phone number come from their account.
export function SubmittedBy({ person, submittedAt }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={person.name} className="size-9" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate font-medium">{person.name}</p>
        {/* On a narrow screen the date moves under the phone number. */}
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3">
          {person.phone ? (
            <a href={`tel:${person.phone}`} className="inline-flex items-center gap-1 font-medium text-primary tabular-nums hover:underline">
              <Phone className="size-3.5" aria-hidden="true" />
              {formatPhone(person.phone)}
            </a>
          ) : (
            <span className="text-muted-foreground">No phone number</span>
          )}
          <span className="text-xs text-muted-foreground">on {formatDate(submittedAt, "d MMM yyyy")}</span>
        </p>
      </div>
    </div>
  );
}
