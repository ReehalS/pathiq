"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { UserProfile } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import React from "react";

const STORAGE_KEY = "pathiq-profile";

const defaultProfile: UserProfile = {
  name: "",
  year: "",
  major: "",
  interests: [],
  values: {
    compensation: 3,
    impact: 3,
    flexibility: 3,
    stability: 3,
  },
  locationPreferences: [],
};

/** Read profile from localStorage (returns null if not found). */
function readLocal(): UserProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as UserProfile;
  } catch {
    // ignore
  }
  return null;
}

/** Map Supabase row to UserProfile. */
function rowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    name: (row.name as string) ?? "",
    year: (row.year as string) ?? "",
    major: (row.major as string) ?? "",
    interests: (row.interests as string[]) ?? [],
    values: (row.values as UserProfile["values"]) ?? defaultProfile.values,
    locationPreferences: (row.location_preferences as string[]) ?? [],
  };
}

/** Map UserProfile to Supabase row fields. */
function profileToRow(p: UserProfile) {
  return {
    name: p.name || null,
    year: p.year || null,
    major: p.major || null,
    interests: p.interests,
    values: p.values,
    location_preferences: p.locationPreferences,
    updated_at: new Date().toISOString(),
  };
}

function hasData(p: UserProfile): boolean {
  return !!(p.year && p.major);
}

interface UserProfileContextValue {
  profile: UserProfile;
  hasProfile: boolean;
  loaded: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading: authLoading, supabase } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [hasProfile, setHasProfile] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const importedRef = useRef(false);

  // ---- Load profile from the right source ----
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function load() {
      if (isAuthenticated && user) {
        // Try Supabase first
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (cancelled) return;

        if (data && (data.year || data.major)) {
          // Supabase has profile data — use it
          const p = rowToProfile(data);
          setProfile(p);
          setHasProfile(hasData(p));
        } else {
          // Supabase profile is empty — check localStorage for import
          const local = readLocal();
          if (local && hasData(local) && !importedRef.current) {
            importedRef.current = true;
            // Import to Supabase
            await supabase
              .from("user_profiles")
              .upsert({ id: user.id, ...profileToRow(local) });
            localStorage.removeItem(STORAGE_KEY);
            if (!cancelled) {
              setProfile(local);
              setHasProfile(true);
            }
          }
        }
      } else {
        // Not authenticated — use localStorage
        const local = readLocal();
        if (local) {
          setProfile(local);
          setHasProfile(hasData(local));
        }
      }

      if (!cancelled) setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading, user?.id, supabase, user]);

  // ---- Update profile ----
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      const next = { ...profile, ...updates };
      setProfile(next);
      setHasProfile(hasData(next));

      if (isAuthenticated && user) {
        await supabase
          .from("user_profiles")
          .upsert({ id: user.id, ...profileToRow(next) });
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    },
    [profile, isAuthenticated, user, supabase]
  );

  // ---- Clear profile ----
  const clearProfile = useCallback(async () => {
    setProfile(defaultProfile);
    setHasProfile(false);

    if (isAuthenticated && user) {
      await supabase
        .from("user_profiles")
        .upsert({ id: user.id, ...profileToRow(defaultProfile) });
    }
    localStorage.removeItem(STORAGE_KEY);
  }, [isAuthenticated, user, supabase]);

  return React.createElement(
    UserProfileContext.Provider,
    { value: { profile, hasProfile, loaded, updateProfile, clearProfile } },
    children
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return ctx;
}
