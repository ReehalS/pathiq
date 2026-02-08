"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Menu,
  X,
  MessageSquare,
  GitCompare,
  LayoutDashboard,
  TrendingUp,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { UserMenu } from "@/components/auth/user-menu";

const freeLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/insights", label: "Insights", icon: TrendingUp },
];

const premiumLinks = [
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | undefined>();
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const handlePremiumClick = (href: string, label: string) => {
    if (isAuthenticated) {
      router.push(href);
      setMobileOpen(false);
    } else {
      setAuthMessage(`Sign in to access ${label}`);
      setPendingRedirect(href);
      setShowAuth(true);
      setMobileOpen(false);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingRedirect) {
      router.push(pendingRedirect);
      setPendingRedirect(null);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            PathIQ
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Free links */}
            {freeLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    pathname === link.href && "bg-secondary"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}

            {/* Premium links */}
            {premiumLinks.map((link) => (
              <Button
                key={link.href}
                variant={pathname === link.href ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2",
                  pathname === link.href && "bg-secondary"
                )}
                onClick={() => handlePremiumClick(link.href, link.label)}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
                {!isAuthenticated && !loading && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            ))}

            {/* Auth section */}
            <div className="ml-3 pl-3 border-l">
              {loading ? (
                <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
              ) : isAuthenticated ? (
                <UserMenu />
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setAuthMessage(undefined);
                    setPendingRedirect(null);
                    setShowAuth(true);
                  }}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          {/* Mobile: auth + toggle */}
          <div className="flex items-center gap-2 md:hidden">
            {!loading && isAuthenticated && <UserMenu />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="border-t md:hidden">
            <div className="flex flex-col p-2 gap-1">
              {/* Free links */}
              {freeLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <Button
                    variant={pathname === link.href ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              ))}

              {/* Premium links */}
              {premiumLinks.map((link) => (
                <Button
                  key={link.href}
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => handlePremiumClick(link.href, link.label)}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                  {!isAuthenticated && !loading && (
                    <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                  )}
                </Button>
              ))}

              {/* Mobile sign in */}
              {!loading && !isAuthenticated && (
                <Button
                  className="mt-2"
                  onClick={() => {
                    setAuthMessage(undefined);
                    setPendingRedirect(null);
                    setShowAuth(true);
                    setMobileOpen(false);
                  }}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthModal
        open={showAuth}
        onOpenChange={setShowAuth}
        message={authMessage}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
