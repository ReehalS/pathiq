"use client";

import { OnboardingForm } from "@/components/onboarding-form";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <OnboardingForm />
      </div>
    </div>
  );
}
