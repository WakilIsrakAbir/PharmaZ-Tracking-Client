"use client";

// The sign-in page's two forms (see app/login/page.jsx):
//   LoginForm           email + password
//   ChoosePasswordForm  first sign-in: replace the temporary password with your own

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";

import { FormField, PasswordInput, fieldProps, passwordRules, showServerErrors } from "@/components/shared/common";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { homePage } from "@/lib/constants";
import { firstName } from "@/lib/format";

// Where to go after signing in: the page that sent you here (?next=…), or this person's home page
// (the dashboard, or the call log for the support team). Only pages of this app are allowed, never another website.
function pageAfterSignIn(user) {
  const next = new URLSearchParams(window.location.search).get("next");
  const isPageOfThisApp = next?.startsWith("/") && !next.startsWith("//");
  return isPageOfThisApp ? next : homePage(user.role);
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
      window.location.assign(pageAfterSignIn(user)); // a full page load starts the app fresh for this user
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
      <p className="mt-1 text-sm text-muted-foreground">Sign in to continue.</p>

      {/* method="post" keeps the password out of the address bar if the form is sent before the page has loaded. */}
      <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {problem && (
          <Alert variant="destructive">
            <AlertDescription>{problem}</AlertDescription>
          </Alert>
        )}

        <FormField id="email" label="Email" error={errors.email}>
          <WithIcon icon={Mail}>
            <Input
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              className={INPUT_WITH_ICON}
              {...fieldProps("email", errors.email)}
              {...register("email", { required: "Please enter your email." })}
            />
          </WithIcon>
        </FormField>

        <FormField id="password" label="Password" error={errors.password}>
          <WithIcon icon={LockKeyhole}>
            <PasswordInput
              autoComplete="current-password"
              placeholder="Your password"
              className={INPUT_WITH_ICON}
              {...fieldProps("password", errors.password)}
              {...register("password", { required: "Please enter your password." })}
            />
          </WithIcon>
        </FormField>

        <SubmitButton pending={isSubmitting} pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">Need an account? Ask your admin.</p>
    </div>
  );
}

// The sign-in boxes have an icon on the left.
const INPUT_WITH_ICON = "pl-10";

function WithIcon({ icon: Icon, children }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      {children}
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
      const { data: user } = await api("/auth/password", { method: "PATCH", body: { currentPassword, newPassword } });
      window.location.assign(pageAfterSignIn(user));
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

      <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
        {problem && (
          <Alert variant="destructive">
            <AlertDescription>{problem}</AlertDescription>
          </Alert>
        )}

        {!temporaryPassword && (
          <FormField id="currentPassword" label="Temporary password" error={errors.currentPassword} hint="The one your admin sent you.">
            <WithIcon icon={LockKeyhole}>
              <PasswordInput
                autoComplete="current-password"
                className={INPUT_WITH_ICON}
                {...fieldProps("currentPassword", errors.currentPassword)}
                {...register("currentPassword", { required: "Please enter your temporary password." })}
              />
            </WithIcon>
          </FormField>
        )}

        <FormField id="newPassword" label="New password" error={errors.newPassword}>
          <WithIcon icon={LockKeyhole}>
            <PasswordInput
              autoComplete="new-password"
              autoFocus
              className={INPUT_WITH_ICON}
              {...fieldProps("newPassword", errors.newPassword)}
              {...register("newPassword", passwordRules)}
            />
          </WithIcon>
        </FormField>

        <FormField id="confirmPassword" label="Type it again" error={errors.confirmPassword}>
          <WithIcon icon={LockKeyhole}>
            <PasswordInput
              autoComplete="new-password"
              className={INPUT_WITH_ICON}
              {...fieldProps("confirmPassword", errors.confirmPassword)}
              {...register("confirmPassword", {
                required: "Please type the new password again.",
                validate: (value) => value === getValues("newPassword") || "The two passwords don't match.",
              })}
            />
          </WithIcon>
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
