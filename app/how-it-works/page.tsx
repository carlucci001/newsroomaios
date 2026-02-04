'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  ArrowRight,
  Globe2,
  Sparkles,
  TrendingUp,
  Rocket,
  Play,
  Zap,
  Users,
  BarChart3,
  Target,
  Building2,
  Mail,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function HowItWorksPage() {
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
            <Link href="/how-it-works" className="text-sm font-medium text-brand-blue-600 border-b-2 border-brand-blue-600">
              How It Works
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">
              Pricing
            </Link>
            <Link href="/testimonials" className="text-sm font-medium hover:text-brand-blue-600 transition-colors">
              Success Stories
            </Link>
            <Button variant="ghost" size="sm">Sign In</Button>
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
              <Rocket className="h-4 w-4 text-brand-blue-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-brand-blue-700 to-brand-blue-600 bg-clip-text text-transparent">
                Simple Process
              </span>
            </div>
            <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Launch in<br />
              <span className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent">
                3 Simple Steps
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Go from idea to published newspaper in under 30 minutes. No technical knowledge required.
            </p>
          </div>

          {/* Hero Image */}
          <div className="relative max-w-6xl mx-auto mb-20">
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-3xl" />
            <div className="relative rounded-2xl overflow-hidden border-4 border-border shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=675&fit=crop"
                alt="Getting started with Newsroom AIOS"
                width={1200}
                height={675}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 mb-32">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card border-2 border-border hover:border-brand-blue-500/50 rounded-2xl p-8 transition-all hover:shadow-xl">
                <div className="text-8xl font-display font-bold text-brand-blue-100 absolute -top-6 -right-6 select-none">
                  01
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-brand-blue-500/30 group-hover:scale-110 transition-transform relative z-10">
                  <Globe2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4 relative z-10">Choose Your Domain</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed relative z-10">
                  Select your newspaper name and custom domain. We'll handle all the technical setup automatically.
                </p>
                <ul className="space-y-2 relative z-10">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Custom domain included</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Free SSL certificate</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Global CDN acceleration</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card border-2 border-border hover:border-brand-blue-500/50 rounded-2xl p-8 transition-all hover:shadow-xl">
                <div className="text-8xl font-display font-bold text-brand-blue-100 absolute -top-6 -right-6 select-none">
                  02
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-brand-blue-500/30 group-hover:scale-110 transition-transform relative z-10">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4 relative z-10">AI Content Setup</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed relative z-10">
                  Configure your AI journalists, select content categories, and define your editorial voice.
                </p>
                <ul className="space-y-2 relative z-10">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>AI journalist personas</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Content scheduling</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Editorial guidelines</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card border-2 border-border hover:border-brand-blue-500/50 rounded-2xl p-8 transition-all hover:shadow-xl">
                <div className="text-8xl font-display font-bold text-brand-blue-100 absolute -top-6 -right-6 select-none">
                  03
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-brand-blue-500/30 group-hover:scale-110 transition-transform relative z-10">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4 relative z-10">Start Publishing</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed relative z-10">
                  Activate revenue streams, publish your first articles, and start growing your audience.
                </p>
                <ul className="space-y-2 relative z-10">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Instant monetization</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>Analytics dashboard</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                    <span>24/7 support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Walkthrough: Advertising */}
      <section className="relative py-20 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-50 border border-brand-blue-200/60 mb-6">
                <Target className="h-4 w-4 text-brand-blue-600" />
                <span className="text-sm font-semibold text-brand-blue-700">Advertiser Onboarding</span>
              </div>
              <h2 className="font-display text-5xl font-bold mb-6">
                From Signup to<br />
                <span className="text-brand-blue-600">Live Banner</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Advertisers complete the entire process in under 5 minutes. No back-and-forth emails. No manual design work.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Business Information</h3>
                    <p className="text-muted-foreground text-sm">
                      Advertiser enters business URL or links existing directory listing. Our system pulls all relevant data automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">AI Banner Generation</h3>
                    <p className="text-muted-foreground text-sm">
                      Gemini analyzes the business, creates a detailed image prompt. Imagen 3 generates professional banner. Takes 10-15 seconds.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Review & Payment</h3>
                    <p className="text-muted-foreground text-sm">
                      Advertiser sees preview, can regenerate if needed, then pays via Stripe. Seamless checkout experience.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold shrink-0">4</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Admin Approval → Live</h3>
                    <p className="text-muted-foreground text-sm">
                      You receive notification, review banner, approve with one click. Banner goes live automatically across your site.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop"
                  alt="Ad dashboard analytics"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center italic">
                Real-time analytics for all active campaigns
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Walkthrough: Directory */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop"
                  alt="Business directory management"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center italic mt-6">
                Manage all business listings from one dashboard
              </p>
            </div>

            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-50 border border-brand-blue-200/60 mb-6">
                <Building2 className="h-4 w-4 text-brand-blue-600" />
                <span className="text-sm font-semibold text-brand-blue-700">Directory Management</span>
              </div>
              <h2 className="font-display text-5xl font-bold mb-6">
                Free to Featured<br />
                <span className="text-brand-blue-600">Upgrade Path</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Start with free listings to build your directory, then convert businesses to featured tier with premium benefits.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Seed the Directory</h3>
                    <p className="text-muted-foreground text-sm">
                      You (or AI) create basic listings for local businesses. Public directory grows quickly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Business Owners Claim</h3>
                    <p className="text-muted-foreground text-sm">
                      Businesses discover their listing via Google, claim it for free, verify ownership.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Upgrade to Featured</h3>
                    <p className="text-muted-foreground text-sm">
                      Once claimed, they see featured benefits: photos, priority ranking, analytics. Easy $49/mo upsell.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold shrink-0">4</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Recurring Revenue</h3>
                    <p className="text-muted-foreground text-sm">
                      Featured businesses stay long-term. Low churn, predictable monthly revenue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Walkthrough: Subscriptions */}
      <section className="relative py-20 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-50 border border-brand-blue-200/60 mb-6">
                <Mail className="h-4 w-4 text-brand-blue-600" />
                <span className="text-sm font-semibold text-brand-blue-700">Subscriber Growth</span>
              </div>
              <h2 className="font-display text-5xl font-bold mb-6">
                Free Readers to<br />
                <span className="text-brand-blue-600">Paying Subscribers</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Build audience with free content, then convert engaged readers to premium with exclusive articles and newsletters.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Free Content Attracts</h3>
                    <p className="text-muted-foreground text-sm">
                      Publish local news freely. Build trust and audience. Readers come for community journalism.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Soft Paywall Converts</h3>
                    <p className="text-muted-foreground text-sm">
                      Mark premium articles. After 3 free views/month, readers hit paywall. Clear value prop: $9/mo for unlimited access.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Newsletter Engagement</h3>
                    <p className="text-muted-foreground text-sm">
                      Premium subscribers get weekly/daily newsletters with curated content. Email keeps them engaged.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold shrink-0">4</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Retention & Growth</h3>
                    <p className="text-muted-foreground text-sm">
                      Low churn (community connection). Subscribers refer friends. Compounding growth over time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop"
                  alt="Newsletter email campaigns"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center italic">
                Automated newsletter campaigns keep subscribers engaged
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <Zap className="h-12 w-12 text-brand-blue-600 mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Potential First 90 Days
            </h2>
            <p className="text-xl text-muted-foreground">
              A realistic growth path as you build your newspaper. Results vary based on your community and effort.
            </p>
          </div>

          <div className="space-y-12">
            <Card className="border-2 border-brand-blue-200">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="shrink-0">
                    <div className="h-16 w-16 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-display font-bold text-2xl">
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold mb-2">Week 1: Setup & Launch</h3>
                    <p className="text-muted-foreground mb-4">
                      Complete onboarding, configure AI journalists, publish first 10 articles, seed directory with 20 businesses, activate revenue streams.
                    </p>
                    <div className="text-sm text-brand-blue-600 font-semibold">Potential revenue: $0-500</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-brand-blue-200">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="shrink-0">
                    <div className="h-16 w-16 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-display font-bold text-2xl">
                      30
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold mb-2">Day 30: Early Traction</h3>
                    <p className="text-muted-foreground mb-4">
                      Building advertiser base, publishing regular content, onboarding businesses to directory. Local awareness growing.
                    </p>
                    <div className="text-sm text-brand-blue-600 font-semibold">Potential revenue: $500-1,500/mo</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-brand-blue-200">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="shrink-0">
                    <div className="h-16 w-16 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-display font-bold text-2xl">
                      60
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold mb-2">Day 60: Growth Momentum</h3>
                    <p className="text-muted-foreground mb-4">
                      Expanding advertiser relationships, growing content library, building featured business tier. Community engagement increasing.
                    </p>
                    <div className="text-sm text-brand-blue-600 font-semibold">Potential revenue: $1,500-3,000/mo</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-brand-blue-500 bg-gradient-to-br from-card to-brand-blue-50/30">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="shrink-0">
                    <div className="h-16 w-16 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-display font-bold text-2xl">
                      90
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold mb-2">Day 90: Established Newspaper</h3>
                    <p className="text-muted-foreground mb-4">
                      Mature advertiser base, substantial content archive, growing subscriber community. Sustainable business model emerging.
                    </p>
                    <div className="text-lg text-brand-blue-600 font-bold">Potential revenue: $3,000-5,000+/mo ($40-60K/year)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 rounded-3xl p-16 shadow-2xl border border-brand-blue-400/20">
              <Rocket className="h-16 w-16 text-white mx-auto mb-6" />
              <h2 className="font-display text-5xl md:text-6xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-brand-blue-100 mb-10 max-w-2xl mx-auto">
                Launch your local newspaper with AI-powered tools and built-in monetization. $199 one-time setup. Keep 100% of revenue.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <Link href="/onboarding">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-10 h-16 gap-3 bg-white text-brand-blue-600 hover:bg-brand-blue-50 shadow-xl"
                  >
                    Launch Your Paper <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-10 h-16 border-2 border-white text-white hover:bg-white/10"
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
