'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Feather, ArrowRight, Menu, X } from 'lucide-react';
import { OnboardingChoice } from '@/components/onboarding/OnboardingChoice';

interface SiteHeaderProps {
  onGetStarted?: () => void;
}

export function SiteHeader({ onGetStarted }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const router = useRouter();

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
      <nav className="relative z-50 border-b border-border/40 backdrop-blur-xl bg-background/90 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-blue-600">
              <Feather className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold">
              Newsroom <span className="text-brand-blue-600">AIOS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">Features</Link>
            <Link href="/how-it-works" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">How It Works</Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">Pricing</Link>
            <Link href="/growth-map" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">Growth Map</Link>
            <Link href="/testimonials" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">Success Stories</Link>
            <Link href="/account/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Button
              size="sm"
              onClick={handleGetStartedClick}
              className="gap-2 shadow-lg shadow-brand-blue-500/20 bg-brand-blue-600 text-white hover:bg-brand-blue-700"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center h-full gap-8 p-6">
            <Link
              href="/features"
              className="text-2xl font-medium hover:text-brand-blue-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/how-it-works"
              className="text-2xl font-medium hover:text-brand-blue-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="text-2xl font-medium hover:text-brand-blue-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/growth-map"
              className="text-2xl font-medium hover:text-brand-blue-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Growth Map
            </Link>
            <Link
              href="/testimonials"
              className="text-2xl font-medium hover:text-brand-blue-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Success Stories
            </Link>
            <Link href="/account/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" size="lg" className="w-full">Sign In</Button>
            </Link>
            <Button
              size="lg"
              onClick={() => {
                handleGetStartedClick();
                setMobileMenuOpen(false);
              }}
              className="gap-2 shadow-lg shadow-brand-blue-500/20 w-full bg-brand-blue-600 text-white hover:bg-brand-blue-700"
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
