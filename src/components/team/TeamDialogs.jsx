"use client";

// The Team page's dialogs and the "…" menu on each person:
//   TeammateDialog   add a teammate, or edit a teammate's name and phone
//   UserActions      the "…" menu: edit, change role, reset password, deactivate / reactivate
//   CredentialsPanel the one-time email + temporary password to share with the teammate

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Check, CircleCheck, Copy, Ellipsis, KeyRound, LoaderCircle, MessageCircle, Pencil, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, FormField, fieldProps, showServerErrors } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useCreateUser, useResetPassword, useUpdateUser } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { firstName, formatPhone } from "@/lib/format";

// ---------------------------------------------------------------------------
// Add a teammate (no `user`), or edit a teammate's name and phone (with `user`)
// ---------------------------------------------------------------------------
export function TeammateDialog({ open, onOpenChange, user }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* A dialog only shows its content while open, so the form starts fresh every time. */}
        <TeammateForm user={user} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TeammateForm({ user, onDone }) {
  const isEditing = Boolean(user);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [created, setCreated] = useState(null); // { user, temporaryPassword } after "Create account"
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ? formatPhone(user.phone) : "",
      role: "marketing",
    },
  });

  if (created) {
    return (
      <CredentialsPanel
        {...created}
        reason="created"
        onDone={onDone}
        onAddAnother={() => {
          setCreated(null);
          reset();
        }}
      />
    );
  }

  async function onSubmit(values) {
    try {
      if (isEditing) {
        const saved = await updateUser.mutateAsync({ id: user.id, name: values.name, phone: values.phone });
        toast.success(`${saved.name}'s details were saved.`);
        onDone();
      } else {
        setCreated(await createUser.mutateAsync(values));
      }
    } catch (error) {
      if (!showServerErrors(error, setError)) toast.error(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{isEditing ? `Edit ${user.name}` : "Add a teammate"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update their name or phone number. Their email stays the same."
            : "They'll get a temporary password, and choose their own the first time they sign in."}
        </DialogDescription>
      </DialogHeader>

      <FormField id="name" label="Full name" error={errors.name}>
        <Input autoComplete="off" placeholder="e.g. Rafi Hasan" autoFocus {...fieldProps("name", errors.name)} {...register("name", { required: "Please enter their full name." })} />
      </FormField>

      {!isEditing && (
        <FormField id="email" label="Email" error={errors.email} hint="They sign in with this email.">
          <Input type="email" autoComplete="off" placeholder="name@example.com" {...fieldProps("email", errors.email)} {...register("email", { required: "Please enter their email." })} />
        </FormField>
      )}

      {/* Required: the name and phone number are shown on every form this person submits. */}
      <FormField id="phone" label="Phone" error={errors.phone} hint="Shown on every form they submit, e.g. 01711-234567">
        <Input
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="01711-234567"
          {...fieldProps("phone", errors.phone)}
          {...register("phone", { required: "Please enter their phone number." })}
        />
      </FormField>

      {!isEditing && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Role</legend>
          <div className="grid gap-2">
            {["marketing", "support", "admin"].map((role) => (
              <label
                key={role}
                className="flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:bg-secondary has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
              >
                <input type="radio" value={role} className="mt-0.5 size-4 accent-primary" {...register("role")} />
                <span>
                  <span className="block text-sm font-medium">{ROLES[role].label}</span>
                  <span className="block text-xs text-muted-foreground">{ROLES[role].description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="animate-spin" />}
          {isEditing ? "Save changes" : "Create account"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ---------------------------------------------------------------------------
// The "…" menu on each person. Admins can't change their own role or deactivate
// themselves (the API refuses too), so their own row only has safe actions.
// ---------------------------------------------------------------------------
export function UserActions({ user, isMe }) {
  const updateUser = useUpdateUser();
  const resetPassword = useResetPassword();
  const [openDialog, setOpenDialog] = useState(null); // "edit" | "confirm" | "credentials"
  const [action, setAction] = useState(null); // what "confirm" asks about: "role" | "reset" | "deactivate"
  const [credentials, setCredentials] = useState(null); // the new temporary password after a reset
  const [newRole, setNewRole] = useState(null); // the role chosen under "Change role"
  // `action`, `newRole` and `credentials` are kept after their dialog closes, so its text stays while it fades out.

  const name = firstName(user.name);
  const closeOnDismiss = (open) => !open && setOpenDialog(null); // Escape, ✕, Cancel or a click outside

  // What each role means for the person, in the question asked before changing it.
  const roleChange = {
    admin: { title: `Make ${user.name} an admin?`, description: `${name} will be able to add teammates, change their access, delete forms and see every support call.`, confirmLabel: "Make admin" },
    marketing: { title: `Move ${user.name} to marketing?`, description: `${name} will fill in onboarding forms and see the calendar, but won't manage the team or see support calls.`, confirmLabel: "Move to marketing" },
    support: { title: `Move ${user.name} to support?`, description: `${name} will log support calls and see only the call log, with their own calls.`, confirmLabel: "Move to support" },
  };

  // The question asked before each action.
  const questions = {
    role: roleChange[newRole] ?? roleChange.marketing,
    reset: {
      title: `Reset ${name}'s password?`,
      description: `${name} will be signed out everywhere and get a new temporary password to sign in with.`,
      confirmLabel: "Reset password",
    },
    deactivate: {
      title: `Deactivate ${user.name}?`,
      description: `${name} will be signed out right away and won't be able to sign in. Their forms stay, and you can reactivate the account at any time.`,
      confirmLabel: "Deactivate",
      destructive: true,
    },
  };

  function ask(nextAction, role = null) {
    setAction(nextAction);
    setNewRole(role);
    setOpenDialog("confirm");
  }

  async function run(chosenAction) {
    try {
      if (chosenAction === "role") {
        await updateUser.mutateAsync({ id: user.id, role: newRole });
        toast.success(newRole === "admin" ? `${user.name} is now an admin.` : `${user.name} is now on the ${ROLES[newRole].label.toLowerCase()} team.`);
        setOpenDialog(null);
      } else if (chosenAction === "reset") {
        setCredentials(await resetPassword.mutateAsync(user.id));
        setOpenDialog("credentials");
      } else if (chosenAction === "deactivate") {
        await updateUser.mutateAsync({ id: user.id, isActive: false });
        toast.success(`${user.name} was deactivated and signed out.`);
        setOpenDialog(null);
      } else if (chosenAction === "reactivate") {
        await updateUser.mutateAsync({ id: user.id, isActive: true });
        toast.success(`${user.name} can sign in again.`);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.name}`}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => setOpenDialog("edit")}>
            <Pencil /> Edit details
          </DropdownMenuItem>
          {isMe && (
            <DropdownMenuItem asChild>
              <Link href="/account">
                <KeyRound /> Change my password
              </Link>
            </DropdownMenuItem>
          )}
          {!isMe && user.isActive && (
            <>
              {/* The other two roles, under "Change role". */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ShieldCheck /> Change role
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {Object.entries(ROLES)
                    .filter(([role]) => role !== user.role)
                    .map(([role, { label, description }]) => (
                      <DropdownMenuItem key={role} onSelect={() => ask("role", role)} className="flex-col items-start gap-0">
                        <span>{label}</span>
                        <span className="text-xs text-muted-foreground">{description}</span>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onSelect={() => ask("reset")}>
                <KeyRound /> Reset password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => ask("deactivate")}>
                <UserX /> Deactivate
              </DropdownMenuItem>
            </>
          )}
          {!isMe && !user.isActive && (
            <DropdownMenuItem onSelect={() => run("reactivate")}>
              <UserCheck /> Reactivate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <TeammateDialog open={openDialog === "edit"} onOpenChange={closeOnDismiss} user={user} />

      <ConfirmDialog
        open={openDialog === "confirm"}
        onOpenChange={closeOnDismiss}
        {...questions[action]}
        pending={updateUser.isPending || resetPassword.isPending}
        onConfirm={() => run(action)}
      />

      <Dialog open={openDialog === "credentials"} onOpenChange={closeOnDismiss}>
        <DialogContent className="sm:max-w-md">
          {credentials && <CredentialsPanel {...credentials} reason="reset" onDone={() => setOpenDialog(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shown once, right after an account is created or a password is reset.
// The admin shares these details with the teammate privately (e.g. on WhatsApp).
// ---------------------------------------------------------------------------
function CredentialsPanel({ user, temporaryPassword, reason, onDone, onAddAnother }) {
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

// ---------------------------------------------------------------------------
// Copying to the clipboard
// ---------------------------------------------------------------------------
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
