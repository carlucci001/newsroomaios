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
      onGetStarted();
    } else {
      setIsChoiceDialogOpen(true);
    }
  };

  const navLinks = [
    { href: '/features', label: 'Features' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/growth-map', label: 'Growth Map' },
    { href: '/testimonials', label: 'Success Stories' },
    { href: '/blog', label: 'Blog' },
  ];

  const isActive = (href: string) =>
    pathname === href || (href === '/blog' && pathname?.startsWith('/blog/'));

  return (
    <>
      <nav className="relative z-50 border-b border-border/40 bg-white sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center shrink-0" style={{ width: 300, height: 100 }}>
            <img src="/newsroom-logo.png" alt="Newsroom AIOS" width={300} height={100} className="w-[300px] h-auto max-h-[100px] object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ease-out ${
                  isActive(href)
                    ? 'text-white bg-brand-blue-600 font-semibold shadow-md shadow-brand-blue-500/30'
                    : '!text-gray-600 hover:!text-brand-blue-600 hover:bg-gray-100 hover:scale-[1.04] active:scale-95'
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <Link href="/account/login">
              <Button variant="outline" size="sm" className="rounded-full border-gray-300 text-gray-700 hover:border-brand-blue-400 hover:text-brand-blue-600 transition-all duration-200 active:scale-95">Sign In</Button>
            </Link>
            <Button
              size="sm"
              onClick={handleGetStartedClick}
              className="gap-2 rounded-full bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 text-white shadow-lg shadow-brand-blue-500/30 hover:from-brand-blue-500 hover:to-brand-blue-600 hover:shadow-xl hover:shadow-brand-blue-500/40 hover:scale-[1.04] transition-all duration-200 active:scale-95"
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
          <div className="flex flex-col items-center justify-center h-full gap-4 p-6 animate-in slide-in-from-top-4 duration-300">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-2xl font-medium px-8 py-3 rounded-full transition-all duration-200 active:scale-95 ${
                  isActive(href)
                    ? 'text-white bg-brand-blue-600 font-bold shadow-lg shadow-brand-blue-500/30'
                    : 'text-gray-700 hover:text-brand-blue-600 hover:bg-brand-blue-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="w-16 h-px bg-gray-200 my-2" />
            <Link href="/account/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" size="lg" className="w-full rounded-full transition-all active:scale-95">Sign In</Button>
            </Link>
            <Button
              size="lg"
              onClick={() => {
                handleGetStartedClick();
                setMobileMenuOpen(false);
              }}
              className="gap-2 rounded-full shadow-lg shadow-brand-blue-500/20 w-full bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-all active:scale-95 active:shadow-md"
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
