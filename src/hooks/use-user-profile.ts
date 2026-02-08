"use client";

import { useState, useEffect, useCallback } from "react";
import { UserProfile } from "@/lib/types";

const STORAGE_KEY = "pathiq-profile";

const defaultProfile: UserProfile = {
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

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [hasProfile, setHasProfile] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        setProfile(parsed);
        setHasProfile(!!parsed.year && !!parsed.major);
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setHasProfile(!!next.year && !!next.major);
      return next;
    });
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(defaultProfile);
    setHasProfile(false);
  }, []);

  return { profile, updateProfile, hasProfile, clearProfile, loaded };
}
