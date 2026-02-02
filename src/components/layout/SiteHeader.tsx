'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Newspaper, ArrowRight } from 'lucide-react';

interface SiteHeaderProps {
  onGetStarted?: () => void;
}

export function SiteHeader({ onGetStarted }: SiteHeaderProps) {
  return (
    <nav className="relative z-50 border-b border-border/40 backdrop-blur-xl bg-background/90 sticky top-0">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-blue-600">
            <Newspaper className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-display font-bold">
            Newsroom <span className="text-brand-blue-600">AIOS</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/features" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">Features</Link>
          <Link href="/how-it-works" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">How It Works</Link>
          <Link href="/pricing" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">Pricing</Link>
          <Link href="/testimonials" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">Success Stories</Link>
          <Button variant="ghost" size="sm">Sign In</Button>
          {onGetStarted ? (
            <Button size="sm" onClick={onGetStarted} className="gap-2 shadow-lg shadow-brand-blue-500/20">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Link href="/onboarding">
              <Button size="sm" className="gap-2 shadow-lg shadow-brand-blue-500/20">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
