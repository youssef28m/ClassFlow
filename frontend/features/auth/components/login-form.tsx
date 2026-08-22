"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  loginFormSchema,
  toLoginCredentials,
  type LoginFormValues,
} from "@/features/auth/schema";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-store";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { username: "", password: "", centerId: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(toLoginCredentials(values));
      router.push("/");
    } catch (error) {
      if (error instanceof ApiError) {
        let hasFieldErrors = false;
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const message = messages[0];
          if (message && field in loginFormSchema.shape) {
            hasFieldErrors = true;
            setError(field as keyof LoginFormValues, { message });
          }
        }
        if (!hasFieldErrors) setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm"
      noValidate
    >
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground">
          Use your ClassFlow account credentials
        </p>
      </div>

      {formError ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          {formError}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-card-foreground"
        >
          Username
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <User className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="e.g. receptionist1"
            aria-invalid={Boolean(errors.username)}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            {...register("username")}
          />
        </div>
        {errors.username ? (
          <p className="text-xs text-red-500">{errors.username.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-card-foreground"
        >
          Password
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
        {errors.password ? (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="centerId"
          className="block text-sm font-medium text-card-foreground"
        >
          Center ID{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Building2
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <input
            id="centerId"
            type="text"
            inputMode="numeric"
            placeholder="Only needed for multi-center staff"
            aria-invalid={Boolean(errors.centerId)}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            {...register("centerId")}
          />
        </div>
        {errors.centerId ? (
          <p className="text-xs text-red-500">{errors.centerId.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
      >
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <LogIn className="size-4" aria-hidden />
        )}
        Sign in
      </button>
    </form>
  );
}
