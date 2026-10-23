"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { FormField, fieldProps, showServerErrors } from "@/components/shared/FormField";
import { CredentialsPanel } from "@/components/team/CredentialsPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateUser, useUpdateUser } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { formatPhone } from "@/lib/format";

// Add a teammate (no `user`), or edit a teammate's name and phone (with `user`).
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
          <div className="grid gap-2 sm:grid-cols-2">
            {["marketing", "admin"].map((role) => (
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
