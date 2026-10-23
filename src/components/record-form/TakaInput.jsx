import { Input } from "@/components/ui/input";

// A number box with a ৳ sign in front.
export function TakaInput(props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">৳</span>
      <Input type="number" inputMode="numeric" min="0" step="1" placeholder="0" className="pl-7" {...props} />
    </div>
  );
}
