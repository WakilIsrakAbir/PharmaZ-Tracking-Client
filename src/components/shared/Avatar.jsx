import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

// Soft background + dark text pairs. The same name always gets the same color.
const AVATAR_COLORS = [
  "bg-[#e8ebf7] text-[#1e2a5e]",
  "bg-[#e6f0fd] text-[#1d4fc4]",
  "bg-[#e3f5ef] text-[#0b7553]",
  "bg-[#fdf1dc] text-[#995a06]",
  "bg-[#fbe9ee] text-[#a8304f]",
  "bg-[#efe9fb] text-[#5b3bb0]",
];

function avatarColor(name = "") {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// The photo when there is one, otherwise the person's initials in a colored circle.
export function Avatar({ name, photoUrl, className }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- small private photos served by our own API
    return <img src={photoUrl} alt="" className={cn("size-9 shrink-0 rounded-full object-cover", className)} />;
  }
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[0.8rem] font-semibold select-none", avatarColor(name), className)}
    >
      {initials(name)}
    </span>
  );
}
