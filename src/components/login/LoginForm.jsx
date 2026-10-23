"use client";

// The sign-in page's two forms (see app/login/page.jsx):
//   LoginForm           email + password
//   ChoosePasswordForm  first sign-in: replace the temporary password with your own

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, LoaderCircle } from "lucide-react";

import { FormField, PasswordInput, fieldProps, passwordRules, showServerErrors } from "@/components/shared/common";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { firstName } from "@/lib/format";

// Where to go after signing in: the page that sent you here (?next=…), or the dashboard.
// Only pages of this app are allowed, never another website.
function pageAfterSignIn() {
  const next = new URLSearchParams(window.location.search).get("next");
  const isPageOfThisApp = next?.startsWith("/") && !next.startsWith("//");
  return isPageOfThisApp ? next : "/";
}

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

function SubmitButton({ pending, pendingText, children }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" /> {pendingText}
        </>
      ) : (
        <>
          {children} <ArrowRight />
        </>
      )}
    </Button>
  );
}
