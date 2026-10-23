import { ArrowRight, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

// The big button under the sign-in forms. While the form is being sent it shows a spinner and `pendingText`.
export function SubmitButton({ pending, pendingText, children }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" /> {pendingText}
        </>
      ) : (
        <>
          {children} <ArrowRight />
        </>
      )}
    </Button>
  );
}
