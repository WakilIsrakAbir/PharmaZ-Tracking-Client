import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The two buttons that start a new form, both alike so neither looks "selected".
// Each opens an empty form with the visit date already set to `day`.
// They sit one under the other, full width; `inline` puts them side by side on wider screens.
export function NewFormButtons({ day, inline = false, className }) {
  return (
    <div className={cn("grid gap-2", inline && "sm:flex", className)}>
      <Button asChild>
        <Link href={`/doctors/new?date=${day}`}>
          <Plus /> New doctor form
        </Link>
      </Button>
      <Button asChild>
        <Link href={`/pharmacies/new?date=${day}`}>
          <Plus /> New pharmacy form
        </Link>
      </Button>
    </div>
  );
}
