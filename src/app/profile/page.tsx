"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/hooks/use-user-profile";
import { YEAR_OPTIONS, INTEREST_OPTIONS } from "@/lib/constants";
import { PremiumGate } from "@/components/auth/premium-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  User,
  GraduationCap,
  Heart,
  Target,
  Save,
  Loader2,
  CheckCircle,
} from "lucide-react";

function ProfileContent() {
  const { user } = useAuth();
  const { profile, updateProfile, loaded } = useUserProfile();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local form state (initialized from profile once loaded)
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [major, setMajor] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [values, setValues] = useState({
    compensation: 3,
    impact: 3,
    flexibility: 3,
    stability: 3,
  });

  // Populate form when profile loads
  useEffect(() => {
    if (loaded) {
      setName(profile.name);
      setYear(profile.year);
      setMajor(profile.major);
      setInterests(profile.interests);
      setValues(profile.values);
    }
  }, [loaded, profile]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await updateProfile({
      name,
      year,
      major,
      interests,
      values,
      locationPreferences: profile.locationPreferences,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile to get personalized career recommendations.
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Member since
              </p>
              <p className="text-sm">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education
          </CardTitle>
          <CardDescription>Your academic background</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Year in school
            </label>
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

      {/* Interests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Interests
          </CardTitle>
          <CardDescription>Areas that interest you (select 2-4)</CardDescription>
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

      {/* Values */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Career Values
          </CardTitle>
          <CardDescription>
            Rate the importance of each factor (1-5)
          </CardDescription>
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
                <span className="text-sm text-muted-foreground">
                  {values[key]}/5
                </span>
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

      {/* Save */}
      <Separator />
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Saved
          </span>
        )}
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Profile
        </Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <PremiumGate
      feature="Profile"
      description="Sign in to save your profile and get personalized career recommendations."
      icon={User}
    >
      <ProfileContent />
    </PremiumGate>
  );
}
