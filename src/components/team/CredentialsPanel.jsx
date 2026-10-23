"use client";

import { useState } from "react";
import { Check, CircleCheck, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { firstName } from "@/lib/format";

// Shown once, right after an account is created or a password is reset.
// The admin shares these details with the teammate privately (e.g. on WhatsApp).
export function CredentialsPanel({ user, temporaryPassword, reason, onDone, onAddAnother }) {
  const name = firstName(user.name);

  async function copyMessage() {
    const message = [
      reason === "created" ? `Hi ${name}, your PharmaZ247 Tracker account is ready.` : `Hi ${name}, your PharmaZ247 Tracker password was reset.`,
      "",
      `Sign in: ${window.location.origin}/login`,
      `Email: ${user.email}`,
      `Temporary password: ${temporaryPassword}`,
      "",
      "You'll choose your own password when you sign in.",
    ].join("\n");
    if (await copyText(message)) toast.success("Message copied. Paste it into WhatsApp or email.");
  }

  return (
    <>
      <DialogHeader>
        <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-status-implementation-soft text-status-implementation-ink">
          <CircleCheck className="size-6" aria-hidden="true" />
        </span>
        <DialogTitle>{reason === "created" ? `${user.name} can sign in now` : `New temporary password for ${name}`}</DialogTitle>
        <DialogDescription>Share these details with {name} privately. The temporary password is shown only this once.</DialogDescription>
      </DialogHeader>

      <dl className="divide-y rounded-lg border bg-muted/40">
        <Credential label="Email" value={user.email} />
        <Credential label="Temporary password" value={temporaryPassword} strong />
      </dl>

      <p className="text-sm text-muted-foreground">When {name} signs in, the tracker asks them to choose their own password.</p>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button variant="outline" onClick={copyMessage}>
          <MessageCircle /> Copy message
        </Button>
        <div className="flex gap-2">
          {onAddAnother && (
            <Button variant="outline" onClick={onAddAnother}>
              Add another
            </Button>
          )}
          <Button onClick={onDone}>Done</Button>
        </div>
      </DialogFooter>
    </>
  );
}

function Credential({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className={strong ? "font-mono text-base font-semibold tracking-wide" : "truncate text-sm font-medium"}>{value}</dd>
      </div>
      <CopyButton value={value} label={`Copy ${label.toLowerCase()}`} />
    </div>
  );
}

// Copying to the clipboard
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    toast.error("Couldn't copy. Please select the text and copy it yourself.");
    return false;
  }
}

// A small button that copies `value` and shows a tick for a moment.
function CopyButton({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!(await copyText(value))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label={copied ? "Copied" : label}>
      {copied ? <Check className="text-status-implementation-ink" /> : <Copy />}
    </Button>
  );
}
