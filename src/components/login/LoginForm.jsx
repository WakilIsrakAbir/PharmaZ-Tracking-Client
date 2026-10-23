"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { ChoosePasswordForm } from "@/components/login/ChoosePasswordForm";
import { pageAfterSignIn } from "@/components/login/pageAfterSignIn";
import { SubmitButton } from "@/components/login/SubmitButton";
import { FormField, fieldProps, showServerErrors } from "@/components/shared/FormField";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

// The sign-in form (see app/login/page.jsx): email + password.
// Someone still on a temporary password goes straight on to ChoosePasswordForm.
export function LoginForm() {
  const [problem, setProblem] = useState(null);
  const [firstSignIn, setFirstSignIn] = useState(null); // { name, temporaryPassword }
  // No default values on purpose: anything typed before the page finished loading is kept.
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  async function onSubmit(values) {
    setProblem(null);
    try {
      const { data: user } = await api("/auth/login", { method: "POST", body: values });
      if (user.mustChangePassword) {
        setFirstSignIn({ name: user.name, temporaryPassword: values.password });
        return;
      }
      window.location.assign(pageAfterSignIn()); // a full page load starts the app fresh for this user
    } catch (error) {
      if (!showServerErrors(error, setError)) setProblem(error.message);
    }
  }

  if (firstSignIn) {
    return <ChoosePasswordForm name={firstSignIn.name} temporaryPassword={firstSignIn.temporaryPassword} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-muted-foreground">Sign in to fill in forms and see the calendar.</p>

      {/* method="post" keeps the password out of the address bar if the form is sent before the page has loaded. */}
      <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        {problem && (
          <Alert variant="destructive">
            <AlertDescription>{problem}</AlertDescription>
          </Alert>
        )}

        <FormField id="email" label="Email" error={errors.email}>
          <Input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            {...fieldProps("email", errors.email)}
            {...register("email", { required: "Please enter your email." })}
          />
        </FormField>

        <FormField id="password" label="Password" error={errors.password}>
          <PasswordInput autoComplete="current-password" {...fieldProps("password", errors.password)} {...register("password", { required: "Please enter your password." })} />
        </FormField>

        <SubmitButton pending={isSubmitting} pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">Need an account? Ask your admin to add you to the team.</p>
    </div>
  );
}
