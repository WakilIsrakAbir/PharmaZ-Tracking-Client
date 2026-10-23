"use client";

import { useState } from "react";
import Link from "next/link";
import { Ellipsis, KeyRound, Pencil, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CredentialsPanel } from "@/components/team/CredentialsPanel";
import { TeammateDialog } from "@/components/team/TeammateDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResetPassword, useUpdateUser } from "@/lib/api";
import { firstName } from "@/lib/format";

// The "…" menu on each person: edit, change role, reset password, deactivate / reactivate.
// Admins can't change their own role or deactivate themselves (the API refuses too),
// so their own row only has safe actions.
export function UserActions({ user, isMe }) {
  const updateUser = useUpdateUser();
  const resetPassword = useResetPassword();
  const [openDialog, setOpenDialog] = useState(null); // "edit" | "confirm" | "credentials"
  const [action, setAction] = useState(null); // what "confirm" asks about: "role" | "reset" | "deactivate"
  const [credentials, setCredentials] = useState(null); // the new temporary password after a reset
  // `action` and `credentials` are kept after their dialog closes, so its text stays while it fades out.

  const name = firstName(user.name);
  const makeAdmin = user.role !== "admin";
  const closeOnDismiss = (open) => !open && setOpenDialog(null); // Escape, ✕, Cancel or a click outside

  // The question asked before each action.
  const questions = {
    role: makeAdmin
      ? { title: `Make ${user.name} an admin?`, description: `${name} will be able to add teammates, change their access and delete forms.`, confirmLabel: "Make admin" }
      : { title: `Move ${user.name} to marketing?`, description: `${name} keeps their work but won't be able to manage the team any more.`, confirmLabel: "Move to marketing" },
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

  function ask(nextAction) {
    setAction(nextAction);
    setOpenDialog("confirm");
  }

  async function run(chosenAction) {
    try {
      if (chosenAction === "role") {
        await updateUser.mutateAsync({ id: user.id, role: makeAdmin ? "admin" : "marketing" });
        toast.success(makeAdmin ? `${user.name} is now an admin.` : `${user.name} is now on the marketing team.`);
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
              <DropdownMenuItem onSelect={() => ask("role")}>
                <ShieldCheck /> {makeAdmin ? "Make admin" : "Move to marketing"}
              </DropdownMenuItem>
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
