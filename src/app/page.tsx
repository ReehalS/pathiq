"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  BarChart3,
  GitCompare,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Database,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const { hasProfile, loaded } = useUserProfile();

  const ctaHref = loaded && hasProfile ? "/dashboard" : "/onboarding";

  const features = [
    {
      icon: BarChart3,
      title: "Browse & Filter",
      description:
        "Explore 35+ career paths with real salary data, growth rates, and job openings from BLS and O*NET.",
    },
    {
      icon: GitCompare,
      title: "Compare Paths",
      description:
        "Side-by-side comparison of careers with salary trajectories, market outlook, and AI-powered trade-off analysis.",
    },
    {
      icon: MessageSquare,
      title: "AI Career Chat",
      description:
        "Ask questions in natural language. Get data-backed answers from an AI advisor with access to live market data.",
    },
  ];

  const stats = [
    { value: "35+", label: "Career Paths" },
    { value: "Real", label: "BLS/O*NET Data" },
    { value: "AI", label: "Powered Analysis" },
    { value: "Free", label: "Always" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            The Bloomberg Terminal for Career Decisions
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Make your next move with{" "}
            <span className="text-primary">data, not guesswork</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
            PathIQ helps undergraduates compare post-graduation paths using AI analysis
            and live market data. Real salaries, real growth rates, real opportunities.
          </p>
          <div className="flex justify-center gap-3">
            <Link href={ctaHref}>
              <Button size="lg" className="gap-2 text-base">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-base">
                Explore Careers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Everything you need to decide your path
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Powered by real data from the Bureau of Labor Statistics and O*NET,
            enhanced with AI analysis from GPT-4o.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Data sources */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h3 className="text-lg font-semibold mb-2">Backed by Real Data</h3>
          <p className="text-sm text-muted-foreground mb-6">
            All career data sourced from trusted government and industry databases
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: Database, label: "Bureau of Labor Statistics (BLS)" },
              { icon: Database, label: "O*NET Database" },
              { icon: TrendingUp, label: "Live Job Market Data" },
              { icon: Sparkles, label: "OpenAI GPT-4o" },
            ].map((source) => (
              <div
                key={source.label}
                className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm"
              >
                <source.icon className="h-4 w-4 text-muted-foreground" />
                {source.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Ready to explore your options?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Set up your profile in 30 seconds and start comparing career paths with real data.
        </p>
        <Link href={ctaHref}>
          <Button size="lg" className="gap-2 text-base">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <BarChart3 className="h-4 w-4" />
            PathIQ
          </div>
          <p>Built for ProdCon 2026. Data from BLS & O*NET.</p>
        </div>
      </footer>
    </div>
  );
}
