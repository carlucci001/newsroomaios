'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { OnboardingChoice } from '@/components/onboarding/OnboardingChoice';

interface SiteHeaderProps {
  onGetStarted?: () => void;
}

export function SiteHeader({ onGetStarted }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleGetStartedClick = () => {
    if (onGetStarted) {
      // Use the provided callback (e.g., from home page)
      onGetStarted();
    } else {
      // Default behavior for other pages
      setIsChoiceDialogOpen(true);
    }
  };

  return (
    <>
      <nav className="relative z-50 border-b border-border/40 bg-white sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center shrink-0" style={{ width: 300, height: 100 }}>
            <img src="/newsroom-logo.png" alt="Newsroom AIOS" width={300} height={100} className="w-[300px] h-auto max-h-[100px] object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/features"
              className={`text-sm font-medium transition-all active:scale-95 relative group ${
                pathname === '/features'
                  ? 'text-brand-blue-600 font-semibold'
                  : 'hover:text-brand-blue-600 active:text-brand-blue-700'
              }`}
            >
              Features
              {pathname === '/features' && (
                <span className="absolute -bottom-[21px] left-0 right-0 h-1 bg-brand-blue-600 rounded-t-full animate-in slide-in-from-bottom-2" />
              )}
            </Link>
            <Link
              href="/how-it-works"
              className={`text-sm font-medium transition-all active:scale-95 relative group ${
                pathname === '/how-it-works'
                  ? 'text-brand-blue-600 font-semibold'
                  : 'hover:text-brand-blue-600 active:text-brand-blue-700'
              }`}
            >
              How It Works
              {pathname === '/how-it-works' && (
                <span className="absolute -bottom-[21px] left-0 right-0 h-1 bg-brand-blue-600 rounded-t-full animate-in slide-in-from-bottom-2" />
              )}
            </Link>
            <Link
              href="/pricing"
              className={`text-sm font-medium transition-all active:scale-95 relative group ${
                pathname === '/pricing'
                  ? 'text-brand-blue-600 font-semibold'
                  : 'hover:text-brand-blue-600 active:text-brand-blue-700'
              }`}
            >
              Pricing
              {pathname === '/pricing' && (
                <span className="absolute -bottom-[21px] left-0 right-0 h-1 bg-brand-blue-600 rounded-t-full animate-in slide-in-from-bottom-2" />
              )}
            </Link>
            <Link
              href="/growth-map"
              className={`text-sm font-medium transition-all active:scale-95 relative group ${
                pathname === '/growth-map'
                  ? 'text-brand-blue-600 font-semibold'
                  : 'hover:text-brand-blue-600 active:text-brand-blue-700'
              }`}
            >
              Growth Map
              {pathname === '/growth-map' && (
                <span className="absolute -bottom-[21px] left-0 right-0 h-1 bg-brand-blue-600 rounded-t-full animate-in slide-in-from-bottom-2" />
              )}
            </Link>
            <Link
              href="/testimonials"
              className={`text-sm font-medium transition-all active:scale-95 relative group ${
                pathname === '/testimonials'
                  ? 'text-brand-blue-600 font-semibold'
                  : 'hover:text-brand-blue-600 active:text-brand-blue-700'
              }`}
            >
              Success Stories
              {pathname === '/testimonials' && (
                <span className="absolute -bottom-[21px] left-0 right-0 h-1 bg-brand-blue-600 rounded-t-full animate-in slide-in-from-bottom-2" />
              )}
            </Link>
            <Link
              href="/blog"
              className={`text-sm font-medium transition-all active:scale-95 relative group ${
                pathname === '/blog' || pathname?.startsWith('/blog/')
                  ? 'text-brand-blue-600 font-semibold'
                  : 'hover:text-brand-blue-600 active:text-brand-blue-700'
              }`}
            >
              Blog
              {(pathname === '/blog' || pathname?.startsWith('/blog/')) && (
                <span className="absolute -bottom-[21px] left-0 right-0 h-1 bg-brand-blue-600 rounded-t-full animate-in slide-in-from-bottom-2" />
              )}
            </Link>
            <Link href="/account/login">
              <Button variant="ghost" size="sm" className="transition-all active:scale-95">Sign In</Button>
            </Link>
            <Button
              size="sm"
              onClick={handleGetStartedClick}
              className="gap-2 shadow-lg shadow-brand-blue-500/20 bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-all active:scale-95 active:shadow-md"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-all active:scale-95 active:bg-brand-blue-800"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="flex flex-col items-center justify-center h-full gap-8 p-6 animate-in slide-in-from-top-4 duration-300">
            <Link
              href="/features"
              className={`text-2xl font-medium transition-all active:scale-95 relative ${
                pathname === '/features'
                  ? 'text-brand-blue-600 font-bold scale-105'
                  : 'hover:text-brand-blue-600 active:text-brand-blue-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
              {pathname === '/features' && (
                <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-brand-blue-600 rounded-full animate-pulse" />
              )}
            </Link>
            <Link
              href="/how-it-works"
              className={`text-2xl font-medium transition-all active:scale-95 relative ${
                pathname === '/how-it-works'
                  ? 'text-brand-blue-600 font-bold scale-105'
                  : 'hover:text-brand-blue-600 active:text-brand-blue-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
              {pathname === '/how-it-works' && (
                <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-brand-blue-600 rounded-full animate-pulse" />
              )}
            </Link>
            <Link
              href="/pricing"
              className={`text-2xl font-medium transition-all active:scale-95 relative ${
                pathname === '/pricing'
                  ? 'text-brand-blue-600 font-bold scale-105'
                  : 'hover:text-brand-blue-600 active:text-brand-blue-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
              {pathname === '/pricing' && (
                <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-brand-blue-600 rounded-full animate-pulse" />
              )}
            </Link>
            <Link
              href="/growth-map"
              className={`text-2xl font-medium transition-all active:scale-95 relative ${
                pathname === '/growth-map'
                  ? 'text-brand-blue-600 font-bold scale-105'
                  : 'hover:text-brand-blue-600 active:text-brand-blue-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Growth Map
              {pathname === '/growth-map' && (
                <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-brand-blue-600 rounded-full animate-pulse" />
              )}
            </Link>
            <Link
              href="/testimonials"
              className={`text-2xl font-medium transition-all active:scale-95 relative ${
                pathname === '/testimonials'
                  ? 'text-brand-blue-600 font-bold scale-105'
                  : 'hover:text-brand-blue-600 active:text-brand-blue-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Success Stories
              {pathname === '/testimonials' && (
                <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-brand-blue-600 rounded-full animate-pulse" />
              )}
            </Link>
            <Link
              href="/blog"
              className={`text-2xl font-medium transition-all active:scale-95 relative ${
                pathname === '/blog' || pathname?.startsWith('/blog/')
                  ? 'text-brand-blue-600 font-bold scale-105'
                  : 'hover:text-brand-blue-600 active:text-brand-blue-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
              {(pathname === '/blog' || pathname?.startsWith('/blog/')) && (
                <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-brand-blue-600 rounded-full animate-pulse" />
              )}
            </Link>
            <Link href="/account/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" size="lg" className="w-full transition-all active:scale-95">Sign In</Button>
            </Link>
            <Button
              size="lg"
              onClick={() => {
                handleGetStartedClick();
                setMobileMenuOpen(false);
              }}
              className="gap-2 shadow-lg shadow-brand-blue-500/20 w-full bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-all active:scale-95 active:shadow-md"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Onboarding Choice Dialog */}
      <OnboardingChoice
        isOpen={isChoiceDialogOpen}
        onClose={() => setIsChoiceDialogOpen(false)}
        onReserveSpot={() => {
          setIsChoiceDialogOpen(false);
          router.push('/?view=leadCapture');
        }}
        onGetStarted={() => {
          setIsChoiceDialogOpen(false);
          router.push('/onboarding');
        }}
      />
    </>
  );
}
