"use client";

import { useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { FormField, PasswordInput, fieldProps, passwordRules, showServerErrors } from "@/components/common";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

// On the Account page. Changing it keeps this device signed in and signs out every other one.
export function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  async function onSubmit({ currentPassword, newPassword }) {
    try {
      await api("/auth/password", { method: "PATCH", body: { currentPassword, newPassword } });
      reset(EMPTY);
      toast.success("Your password was changed. Other devices were signed out.");
    } catch (error) {
      if (!showServerErrors(error, setError)) toast.error(error.message);
    }
  }

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
      <FormField id="currentPassword" label="Current password" error={errors.currentPassword}>
        <PasswordInput
          autoComplete="current-password"
          {...fieldProps("currentPassword", errors.currentPassword)}
          {...register("currentPassword", { required: "Please enter your current password." })}
        />
      </FormField>

      <FormField id="newPassword" label="New password" error={errors.newPassword}>
        <PasswordInput autoComplete="new-password" {...fieldProps("newPassword", errors.newPassword)} {...register("newPassword", passwordRules)} />
      </FormField>

      <FormField id="confirmPassword" label="Type the new password again" error={errors.confirmPassword}>
        <PasswordInput
          autoComplete="new-password"
          {...fieldProps("confirmPassword", errors.confirmPassword)}
          {...register("confirmPassword", {
            required: "Please type the new password again.",
            validate: (value) => value === getValues("newPassword") || "The two passwords don't match.",
          })}
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <LoaderCircle className="animate-spin" />}
        Change password
      </Button>
    </form>
  );
}
