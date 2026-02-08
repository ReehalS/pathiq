"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, AlertCircle, User } from "lucide-react";

type AuthMode = "sign-in" | "sign-up";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: AuthMode;
  /** Optional message shown above the form (e.g., feature gate prompt) */
  message?: string;
  /** Called after successful auth */
  onSuccess?: () => void;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultMode = "sign-in",
  message,
  onSuccess,
}: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const passwordStrength = (pwd: string): { label: string; color: string } => {
    if (pwd.length < 8) return { label: "Too short", color: "bg-red-500" };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (score >= 3) return { label: "Strong", color: "bg-green-500" };
    if (score >= 2) return { label: "Medium", color: "bg-yellow-500" };
    return { label: "Weak", color: "bg-red-500" };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (mode === "sign-up" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "sign-in") {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error);
        } else {
          handleOpenChange(false);
          onSuccess?.();
        }
      } else {
        const { error } = await signUp(email, password, name || undefined);
        if (error) {
          setError(error);
        } else {
          setSuccess(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = mode === "sign-up" ? passwordStrength(password) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "sign-in" ? "Welcome back" : "Create your account"}
          </DialogTitle>
          <DialogDescription>
            {message ||
              (mode === "sign-in"
                ? "Sign in to access premium features like AI Chat and Compare."
                : "Create a free account to unlock AI Chat and Compare.")}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Check your email</p>
              <p className="text-sm text-muted-foreground mt-1">
                We sent a confirmation link to <span className="font-medium">{email}</span>.
                Click the link to activate your account.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => switchMode("sign-in")}
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name (sign-up only) */}
            {mode === "sign-up" && (
              <div className="space-y-1.5">
                <label htmlFor="auth-name" className="text-sm font-medium">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="auth-name"
                    type="text"
                    placeholder="Your first name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    autoComplete="given-name"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={8}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                />
              </div>
              {mode === "sign-up" && password.length > 0 && strength && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${strength.color}`}
                      style={{
                        width:
                          strength.label === "Strong"
                            ? "100%"
                            : strength.label === "Medium"
                              ? "60%"
                              : "30%",
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password (sign-up only) */}
            {mode === "sign-up" && (
              <div className="space-y-1.5">
                <label htmlFor="auth-confirm" className="text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="auth-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {mode === "sign-in" ? "Sign In" : "Create Account"}
            </Button>

            {/* Toggle mode */}
            <p className="text-center text-sm text-muted-foreground">
              {mode === "sign-in" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("sign-up")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("sign-in")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
