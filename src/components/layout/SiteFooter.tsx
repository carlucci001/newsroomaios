'use client';

import Link from 'next/link';
import { Newspaper } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-gradient-to-b from-muted/50 to-muted/80 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-brand-blue-600">
                <Newspaper className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold">
                Newsroom <span className="text-brand-blue-600">AIOS</span>
              </span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Empowering local journalism with AI-powered tools and built-in monetization.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Platform</h3>
            <ul className="space-y-3 text-sm text-foreground/70">
              <li><Link href="/features" className="hover:text-brand-blue-600 transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-brand-blue-600 transition-colors">Pricing</Link></li>
              <li><Link href="/testimonials" className="hover:text-brand-blue-600 transition-colors">Success Stories</Link></li>
              <li><a href="#" className="hover:text-brand-blue-600 transition-colors">Documentation</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-3 text-sm text-foreground/70">
              <li><a href="#" className="hover:text-brand-blue-600 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-brand-blue-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-brand-blue-600 transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-brand-blue-600 transition-colors">API Reference</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-3 text-sm text-foreground/70">
              <li><Link href="/privacy" className="hover:text-brand-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-blue-600 transition-colors">Terms of Use</Link></li>
              <li><Link href="/refund-policy" className="hover:text-brand-blue-600 transition-colors">Refund Policy</Link></li>
              <li><a href="mailto:support@newsroomaios.com" className="hover:text-brand-blue-600 transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center space-y-2">
          <p className="text-sm text-foreground/60">
            © 2026 Newsroom AIOS. A service of <strong>Farrington Development LLC</strong>. All rights reserved.
          </p>
          <p className="text-xs text-foreground/50">
            Transforming local journalism with AI. <Link href="/refund-policy" className="underline hover:text-brand-blue-600">No refunds once your paper is live.</Link> Cancel anytime.
          </p>
        </div>
      </div>
    </footer>
  );
}
