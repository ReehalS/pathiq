"use client";

import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface PremiumGateProps {
  children: ReactNode;
  /** Feature name shown in the gate prompt */
  feature: string;
  /** Description shown when gated */
  description: string;
  /** Icon component shown in gate prompt */
  icon?: React.ElementType;
}

/**
 * Wraps content that requires authentication.
 * If user is authenticated, renders children.
 * If not, shows a premium feature prompt with sign-in/sign-up.
 */
export function PremiumGate({
  children,
  feature,
  description,
  icon: Icon = Lock,
}: PremiumGateProps) {
  const { isAuthenticated, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showGate, setShowGate] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Sign in to access {feature}</h2>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            {description}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => setShowAuth(true)}>
            Sign In
          </Button>
          <Button variant="outline" onClick={() => setShowGate(true)}>
            Create Account
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Browse careers, view insights, and explore salary data — all free without an account.
        </p>
      </div>

      <AuthModal
        open={showAuth}
        onOpenChange={setShowAuth}
        defaultMode="sign-in"
        message={`Sign in to access ${feature}`}
      />

      <AuthModal
        open={showGate}
        onOpenChange={setShowGate}
        defaultMode="sign-up"
        message={`Create an account to access ${feature}`}
      />
    </>
  );
}

interface PremiumButtonProps {
  children: ReactNode;
  feature: string;
  onClick: () => void;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Button that either runs onClick (if authenticated) or shows auth modal.
 */
export function PremiumButton({
  children,
  feature,
  onClick,
  className,
  variant = "default",
  size = "default",
}: PremiumButtonProps) {
  const { isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const handleClick = () => {
    if (isAuthenticated) {
      onClick();
    } else {
      setShowAuth(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
      >
        {children}
      </Button>

      <AuthModal
        open={showAuth}
        onOpenChange={setShowAuth}
        defaultMode="sign-in"
        message={`Sign in to access ${feature}`}
        onSuccess={onClick}
      />
    </>
  );
}
