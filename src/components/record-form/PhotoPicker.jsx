"use client";

import { Camera } from "lucide-react";
import { toast } from "sonner";

import { NumberCircle } from "@/components/record-form/NumberedField";
import { Button } from "@/components/ui/button";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // the API refuses bigger photos too

// Field 2: tap the box to take a photo (on phones) or choose a file.
export function PhotoPicker({ field: [no, label], current, photo, onChange, error }) {
  const preview = photo?.url ?? current;

  function choose(file) {
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("That photo is bigger than 2 MB. Please choose a smaller one.");
      return;
    }
    if (photo?.url) URL.revokeObjectURL(photo.url); // free the old preview
    onChange({ file, url: URL.createObjectURL(file) });
  }

  function clear() {
    if (photo?.url) URL.revokeObjectURL(photo.url);
    onChange(null);
  }

  return (
    <div className="flex items-center gap-5">
      <label className="relative flex size-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-input bg-muted/40 text-center text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview, or a private photo from our own API
          <img src={preview} alt="Chosen photo" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 px-2">
            <Camera className="size-5" aria-hidden="true" />
            Attach photo
          </span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label={label}
          onChange={(event) => {
            choose(event.target.files?.[0]);
            event.target.value = ""; // lets the same file be picked again
          }}
        />
      </label>
      <div className="min-w-0 space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <NumberCircle no={no} /> {label}
        </p>
        <p className="text-sm text-muted-foreground">JPG, PNG or WEBP, up to 2 MB. On a phone you can take the photo now.</p>
        {photo && (
          <Button type="button" variant="ghost" size="sm" onClick={clear} className="-ml-3">
            Remove new photo
          </Button>
        )}
        {error?.message && <p className="text-sm text-destructive">{error.message}</p>}
      </div>
    </div>
  );
}
