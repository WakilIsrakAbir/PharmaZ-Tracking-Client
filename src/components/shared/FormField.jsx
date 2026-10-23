import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Accessibility props for an input that has a FormField message:
//   <Input {...fieldProps("email", errors.email)} {...register("email")} />
export const fieldProps = (id, error) => ({
  id,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-message` : undefined,
});

// A label, the input (children), and under it either the error or a hint.
export function FormField({ id, label, hint, error, className, children }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-message`} className="text-sm text-destructive">
          {error.message}
        </p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

// Shows the API's field messages next to the matching inputs.
// Returns true if at least one field message was shown.
export function showServerErrors(error, setError) {
  const entries = Object.entries(error?.fields ?? {});
  entries.forEach(([field, message], index) => {
    setError(field, { type: "server", message }, { shouldFocus: index === 0 });
  });
  return entries.length > 0;
}
