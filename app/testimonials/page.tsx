'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Globe2,
  Target,
  Users,
  TrendingUp,
  DollarSign,
  Building2,
  Mail,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function RevenuePotentialPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Newsroom Background - VISIBLE at 25% opacity */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                             linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              currentColor 10px,
              currentColor 11px
            )`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-50/40 via-background to-brand-gray-50/40" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-border/40 backdrop-blur-xl bg-background/90 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-blue-600">
              <Globe2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold">
              Newsroom <span className="text-brand-blue-600">AIOS</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">
              Features
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">
              How It Works
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">
              Pricing
            </Link>
            <Link href="/testimonials" className="text-sm font-medium text-brand-blue-600 border-b-2 border-brand-blue-600">
              Revenue Potential
            </Link>
            <Link href="/account/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm" className="gap-2 shadow-lg shadow-brand-blue-500/20">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-brand-blue-200/60 bg-gradient-to-r from-brand-blue-50/80 to-brand-blue-100/60 backdrop-blur-sm mb-8">
              <TrendingUp className="h-4 w-4 text-brand-blue-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-brand-blue-700 to-brand-blue-600 bg-clip-text text-transparent">
                Revenue Potential
              </span>
            </div>
            <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              What Your Newspaper<br />
              <span className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent">
                Could Earn
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Explore the revenue potential of running a local AI-powered newspaper with multiple monetization streams.
            </p>
          </div>

          {/* Goals Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-20">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent mb-2">
                3
              </div>
              <div className="text-sm text-muted-foreground font-medium">Revenue Streams</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent mb-2">
                $40-60K
              </div>
              <div className="text-sm text-muted-foreground font-medium">Potential/Year</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent mb-2">
                100%
              </div>
              <div className="text-sm text-muted-foreground font-medium">Revenue Retained</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent mb-2">
                Day 1
              </div>
              <div className="text-sm text-muted-foreground font-medium">Monetization Ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Streams Breakdown */}
      <section className="relative py-20 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-4">
            Three Revenue Streams
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-16 max-w-3xl mx-auto">
            Each stream operates independently, giving you multiple ways to generate income from your local community.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {/* Advertising */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-xl">
              <CardContent className="pt-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-brand-blue-500/30">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4">AI-Powered Advertising</h3>
                <p className="text-muted-foreground mb-6">
                  Local businesses sign up and get AI-generated banners instantly. You set pricing and approve ads.
                </p>
                <div className="bg-brand-blue-50 rounded-xl p-6 mb-6">
                  <div className="text-sm text-muted-foreground mb-2">Potential Revenue Range</div>
                  <div className="text-3xl font-display font-bold text-brand-blue-600">
                    $1,500 - $3,000<span className="text-lg text-muted-foreground">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">With 15-30 active advertisers</div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Self-service advertiser portal</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>AI banner generation included</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Flexible pricing models</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Directory */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-xl">
              <CardContent className="pt-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-brand-blue-500/30">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4">Business Directory</h3>
                <p className="text-muted-foreground mb-6">
                  Free basic listings attract businesses, featured tier at $49/month provides premium placement.
                </p>
                <div className="bg-brand-blue-50 rounded-xl p-6 mb-6">
                  <div className="text-sm text-muted-foreground mb-2">Potential Revenue Range</div>
                  <div className="text-3xl font-display font-bold text-brand-blue-600">
                    $500 - $1,500<span className="text-lg text-muted-foreground">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">With 10-30 featured businesses</div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Free tier drives adoption</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>SEO-optimized listings</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Business claim/verify system</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Subscriptions */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-xl">
              <CardContent className="pt-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-brand-blue-500/30">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4">Newsletter Subscriptions</h3>
                <p className="text-muted-foreground mb-6">
                  Premium subscribers at $9/month get exclusive content, ad-free experience, and early access.
                </p>
                <div className="bg-brand-blue-50 rounded-xl p-6 mb-6">
                  <div className="text-sm text-muted-foreground mb-2">Potential Revenue Range</div>
                  <div className="text-3xl font-display font-bold text-brand-blue-600">
                    $500 - $1,500<span className="text-lg text-muted-foreground">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">With 50-150 premium subscribers</div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Automated email campaigns</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Content paywall system</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Subscriber analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Combined Potential */}
          <div className="bg-gradient-to-br from-brand-blue-50 to-brand-blue-100/50 rounded-3xl p-12 border-2 border-brand-blue-200/60 shadow-xl">
            <div className="text-center">
              <DollarSign className="h-16 w-16 text-brand-blue-600 mx-auto mb-6" />
              <h3 className="font-display text-4xl font-bold mb-4">
                Combined Potential: <span className="text-brand-blue-600">$3,000 - $5,000+/month</span>
              </h3>
              <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
                With all three revenue streams active, newspapers have the potential to generate $40,000 - $60,000+ annually.
              </p>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Revenue varies based on community size, engagement, and effort. These figures represent potential outcomes, not guarantees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Growth Timeline */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-4">
            Potential Growth Path
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-16 max-w-3xl mx-auto">
            A realistic timeline for building your newspaper business. Results vary based on your community and effort.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2">
              <CardContent className="pt-8">
                <div className="text-6xl font-display font-bold text-brand-blue-200 mb-4">01</div>
                <h3 className="text-xl font-display font-bold mb-2">Month 1: Foundation</h3>
                <p className="text-muted-foreground mb-4">
                  Launch your newspaper, publish initial content, seed your business directory, and activate all revenue streams.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Potential Range</div>
                  <div className="text-xl font-bold text-brand-blue-600">$0 - $1,000/month</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-8">
                <div className="text-6xl font-display font-bold text-brand-blue-200 mb-4">02</div>
                <h3 className="text-xl font-display font-bold mb-2">Month 2-3: Traction</h3>
                <p className="text-muted-foreground mb-4">
                  Build audience through consistent content, onboard local advertisers, and grow your subscriber base.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Potential Range</div>
                  <div className="text-xl font-bold text-brand-blue-600">$1,000 - $3,000/month</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-8">
                <div className="text-6xl font-display font-bold text-brand-blue-200 mb-4">03</div>
                <h3 className="text-xl font-display font-bold mb-2">Month 4+: Scale</h3>
                <p className="text-muted-foreground mb-4">
                  Optimize pricing, expand advertiser base, and leverage community trust for continued growth.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Potential Range</div>
                  <div className="text-xl font-bold text-brand-blue-600">$3,000 - $5,000+/month</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Coming Soon: Publisher Stories */}
      <section className="relative py-20 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 rounded-3xl p-16 shadow-2xl border border-brand-blue-400/20 text-center text-white">
            <Users className="h-16 w-16 mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Publisher Stories Coming Soon
            </h2>
            <p className="text-xl text-brand-blue-100 mb-10 max-w-2xl mx-auto">
              We're building a community of local publishers. Real success stories from real newspapers will be featured here as our platform grows.
            </p>
            <Link href="/onboarding">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-10 h-16 gap-3 bg-white text-brand-blue-600 hover:bg-brand-blue-50 shadow-xl"
              >
                Be an Early Publisher <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-3xl" />
            <div className="relative bg-card border-2 border-brand-blue-200 rounded-3xl p-16 shadow-2xl">
              <Sparkles className="h-16 w-16 text-brand-blue-600 mx-auto mb-6" />
              <h2 className="font-display text-5xl md:text-6xl font-bold mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                $199 one-time setup. Keep 100% of all revenue you generate. Launch your newspaper today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <Link href="/onboarding">
                  <Button
                    size="lg"
                    className="text-lg px-10 h-16 gap-3 shadow-xl shadow-brand-blue-500/30"
                  >
                    Launch Your Paper <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-10 h-16 border-2"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
