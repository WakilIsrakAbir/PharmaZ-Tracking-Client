"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { pageAfterSignIn } from "@/components/login/pageAfterSignIn";
import { SubmitButton } from "@/components/login/SubmitButton";
import { FormField, fieldProps, showServerErrors } from "@/components/shared/FormField";
import { PasswordInput, passwordRules } from "@/components/shared/PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { firstName } from "@/lib/format";

// First sign-in: replace the temporary password with your own.
// Right after signing in we still have the temporary password, so we don't ask for it again.
// If the person comes back later (the page was closed), they type it once more.
export function ChoosePasswordForm({ name, temporaryPassword }) {
  const [problem, setProblem] = useState(null);
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: temporaryPassword ? { currentPassword: temporaryPassword } : undefined });

  async function onSubmit({ currentPassword, newPassword }) {
    setProblem(null);
    try {
      await api("/auth/password", { method: "PATCH", body: { currentPassword, newPassword } });
      window.location.assign(pageAfterSignIn());
    } catch (error) {
      // When the temporary password box is hidden, show its message at the top instead.
      const hiddenFieldMessage = temporaryPassword && error.fields?.currentPassword;
      if (hiddenFieldMessage) setProblem(hiddenFieldMessage);
      else if (!showServerErrors(error, setError)) setProblem(error.message);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-primary">Welcome to the team, {firstName(name)}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Choose your own password</h1>
      <p className="mt-1.5 text-muted-foreground">You signed in with a temporary password. Pick a new one that only you know. You&apos;ll use it from now on.</p>

      <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        {problem && (
          <Alert variant="destructive">
            <AlertDescription>{problem}</AlertDescription>
          </Alert>
        )}

        {!temporaryPassword && (
          <FormField id="currentPassword" label="Temporary password" error={errors.currentPassword} hint="The one your admin sent you.">
            <PasswordInput
              autoComplete="current-password"
              {...fieldProps("currentPassword", errors.currentPassword)}
              {...register("currentPassword", { required: "Please enter your temporary password." })}
            />
          </FormField>
        )}

        <FormField id="newPassword" label="New password" error={errors.newPassword}>
          <PasswordInput autoComplete="new-password" autoFocus {...fieldProps("newPassword", errors.newPassword)} {...register("newPassword", passwordRules)} />
        </FormField>

        <FormField id="confirmPassword" label="Type it again" error={errors.confirmPassword}>
          <PasswordInput
            autoComplete="new-password"
            {...fieldProps("confirmPassword", errors.confirmPassword)}
            {...register("confirmPassword", {
              required: "Please type the new password again.",
              validate: (value) => value === getValues("newPassword") || "The two passwords don't match.",
            })}
          />
        </FormField>

        <SubmitButton pending={isSubmitting} pendingText="Saving…">
          Save and continue
        </SubmitButton>
      </form>
    </div>
  );
}
