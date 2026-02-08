"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/hooks/use-user-profile";

/**
 * Handles two redirects:
 * 1. Authenticated user without profile → /onboarding (from any page except /onboarding itself)
 * 2. Unauthenticated user on /onboarding → / (onboarding requires auth)
 */
export function OnboardingRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { hasProfile, loaded: profileLoaded } = useUserProfile();

  useEffect(() => {
    if (authLoading || !profileLoaded) return;

    // Unauthenticated users cannot access /onboarding
    if (!isAuthenticated && pathname === "/onboarding") {
      router.replace("/");
      return;
    }

    // Authenticated users without a profile get sent to onboarding
    if (isAuthenticated && !hasProfile && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [authLoading, profileLoaded, isAuthenticated, hasProfile, pathname, router]);

  return null;
}
