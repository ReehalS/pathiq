"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/hooks/use-user-profile";
import { YEAR_OPTIONS, INTEREST_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, GraduationCap, Heart, Target } from "lucide-react";

export function OnboardingForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { updateProfile } = useUserProfile();
  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState("");

  // Pre-populate name from signup metadata
  useEffect(() => {
    const metaName = user?.user_metadata?.name;
    if (metaName && !name) setName(metaName);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const [year, setYear] = useState("");
  const [major, setMajor] = useState("");

  // Step 2
  const [interests, setInterests] = useState<string[]>([]);

  // Step 3
  const [values, setValues] = useState({
    compensation: 3,
    impact: 3,
    flexibility: 3,
    stability: 3,
  });

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleComplete = async () => {
    await updateProfile({
      name,
      year,
      major,
      interests,
      values,
      locationPreferences: [],
    });
    router.push("/dashboard");
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return year && major;
      case 2:
        return interests.length >= 1;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="w-full">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-2 w-16 rounded-full transition-colors",
              s <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      <div className="min-h-[480px] w-full">
      {step === 1 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Tell us about you</CardTitle>
            <CardDescription>This helps us personalize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your name</label>
              <Input
                placeholder="First name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Year in school</label>
              <div className="flex flex-wrap gap-2">
                {YEAR_OPTIONS.map((y) => (
                  <Badge
                    key={y}
                    variant={year === y ? "default" : "outline"}
                    className="cursor-pointer py-1.5 px-3 text-sm"
                    onClick={() => setYear(y)}
                  >
                    {y}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Major</label>
              <Input
                placeholder="e.g. Computer Science, Economics..."
                value={major}
                onChange={(e) => setMajor(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>What interests you?</CardTitle>
            <CardDescription>Select 2-4 areas that excite you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {INTEREST_OPTIONS.map((opt) => (
                <Badge
                  key={opt.value}
                  variant={interests.includes(opt.value) ? "default" : "outline"}
                  className="cursor-pointer py-2.5 px-3 text-sm justify-center"
                  onClick={() => toggleInterest(opt.value)}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>What matters most?</CardTitle>
            <CardDescription>Rate the importance of each factor (1-5)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(
              [
                { key: "compensation", label: "Compensation" },
                { key: "impact", label: "Social Impact" },
                { key: "flexibility", label: "Flexibility" },
                { key: "stability", label: "Job Stability" },
              ] as const
            ).map(({ key, label }) => (
              <div key={key}>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">{label}</label>
                  <span className="text-sm text-muted-foreground">{values[key]}/5</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setValues((v) => ({ ...v, [key]: n }))}
                      className={cn(
                        "flex-1 h-9 rounded-md border text-sm font-medium transition-colors",
                        values[key] >= n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        ) : (
          <div />
        )}
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-1">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} className="gap-1">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
