import { cn } from "@/lib/utils";

// "Label *": the red star after a required field's name.
export function RequiredLabel({ children }) {
  return (
    <>
      {children} <span className="text-destructive">*</span>
    </>
  );
}

// The navy number circle from the paper form.
export function NumberCircle({ no }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
      {no}
    </span>
  );
}

// A paper-form field: the number, the label, the input, and the error under it.
// `group` is for a set of choices, so it uses fieldset + legend instead of a label.
export function NumberedField({ field: [no, label], id, required, wide, group, error, children }) {
  const Wrapper = group ? "fieldset" : "div";
  const Caption = group ? "legend" : "label";
  return (
    <Wrapper className={cn("space-y-2", wide && "md:col-span-2")}>
      <Caption {...(!group && { htmlFor: id })} className="mb-2 flex items-center gap-2 text-sm font-medium">
        <NumberCircle no={no} />
        {label}
        {required && <span className="text-destructive">*</span>}
      </Caption>
      {children}
      {error?.message && <p className="text-sm text-destructive">{error.message}</p>}
    </Wrapper>
  );
}
