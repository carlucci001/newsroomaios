'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Star,
  Award,
  Sparkles,
  Newspaper,
  DollarSign,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
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
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-brand-blue-200/60 bg-gradient-to-r from-brand-blue-50/80 to-brand-blue-100/60 backdrop-blur-sm mb-8">
              <Zap className="h-4 w-4 text-brand-blue-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-brand-blue-700 to-brand-blue-600 bg-clip-text text-transparent">
                Transparent Pricing
              </span>
            </div>
            <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Choose Your Plan.<br />
              <span className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent">
                Keep 100% of Revenue.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              No hidden fees. No revenue sharing. You keep every dollar from ads, directory, and subscriptions. We only charge a simple monthly platform fee.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-8 mb-16 flex-wrap">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-brand-blue-600" />
              <span className="text-sm font-medium">$199 setup - Complete business included</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-brand-blue-600" />
              <span className="text-sm font-medium">Keep 100% of revenue</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-brand-blue-600" />
              <span className="text-sm font-medium">Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included in $199 Setup */}
      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-brand-blue-50 to-brand-blue-100/50 rounded-2xl p-12 mb-0">
            <div className="text-center mb-8">
              <h3 className="font-display text-3xl font-bold mb-3">
                Everything Included in Your $199 Setup
              </h3>
              <p className="text-lg text-muted-foreground">
                A complete multi-revenue newspaper business, ready to launch in minutes
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Content Ready */}
              <div className="bg-white rounded-xl p-6">
                <Newspaper className="h-10 w-10 text-brand-blue-600 mb-4" />
                <h4 className="font-bold text-lg mb-2">Launch-Ready Content</h4>
                <ul className="space-y-2 text-sm">
                  <li>✅ 36 AI-generated articles</li>
                  <li>✅ 100 directory listings (pre-populated)</li>
                  <li>✅ Subdomain with SSL</li>
                  <li>✅ Custom domain support</li>
                </ul>
              </div>

              {/* Revenue Systems */}
              <div className="bg-white rounded-xl p-6">
                <DollarSign className="h-10 w-10 text-green-600 mb-4" />
                <h4 className="font-bold text-lg mb-2">Built-In Revenue Systems</h4>
                <ul className="space-y-2 text-sm">
                  <li>✅ Subscription/paywall platform</li>
                  <li>✅ Advertising management (CPC/CPM)</li>
                  <li>✅ Directory listing monetization</li>
                  <li>✅ Keep 100% of ALL revenue</li>
                </ul>
              </div>

              {/* Tools & Support */}
              <div className="bg-white rounded-xl p-6">
                <Wrench className="h-10 w-10 text-purple-600 mb-4" />
                <h4 className="font-bold text-lg mb-2">Professional Tools</h4>
                <ul className="space-y-2 text-sm">
                  <li>✅ Full CMS & admin dashboard</li>
                  <li>✅ AI journalist personas</li>
                  <li>✅ Analytics & reporting</li>
                  <li>✅ DNS & domain management</li>
                </ul>
              </div>
            </div>

            <div className="text-center mt-8 pt-8 border-t border-brand-blue-200">
              <p className="text-2xl font-bold text-brand-blue-600">
                Comparable value: $5,000+ in development + hosting
              </p>
              <p className="text-muted-foreground mt-2">
                You pay: $199 one-time + $99-299/mo platform fee
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Starter Plan */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-gray-400 to-brand-gray-500" />
              <CardHeader className="pb-8 pt-8">
                <CardTitle className="text-2xl font-display mb-2">Starter</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-display font-bold">$99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">+ $199 one-time setup*</p>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/onboarding?plan=starter" className="block">
                  <Button variant="outline" className="w-full mb-6 hover:bg-brand-gray-50">
                    Get Started
                  </Button>
                </Link>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">1 AI journalist persona</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Up to 50 articles/month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Basic advertising features</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Business directory (25 listings)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Newsletter subscriptions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Email support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>Keep 100% of revenue</strong></span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Growth Plan (Most Popular) */}
            <Card className="border-2 border-brand-blue-500 shadow-2xl shadow-brand-blue-500/20 transition-all hover:shadow-brand-blue-500/30 relative overflow-hidden scale-105">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-blue-500 to-brand-blue-600" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-brand-blue-500 to-brand-blue-600 text-white text-sm font-semibold rounded-full shadow-lg">
                Most Popular
              </div>
              <CardHeader className="pb-8 pt-12">
                <CardTitle className="text-2xl font-display mb-2">Growth</CardTitle>
                <CardDescription>For growing publishers</CardDescription>
                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-display font-bold text-brand-blue-600">$199</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">+ $199 one-time setup*</p>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/onboarding?plan=growth" className="block">
                  <Button className="w-full mb-6 shadow-lg shadow-brand-blue-500/30">
                    Get Started
                  </Button>
                </Link>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">3 AI journalist personas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Up to 115 articles/month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Advanced advertising (CPC/CPM)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">100 directory listings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Newsletter features</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Priority support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold"><strong>Keep 100% of revenue</strong></span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-blue-600 to-brand-blue-700" />
              <CardHeader className="pb-8 pt-8">
                <CardTitle className="text-2xl font-display mb-2">Professional</CardTitle>
                <CardDescription>For serious publishers</CardDescription>
                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-display font-bold">$299</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">+ $199 one-time setup*</p>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/onboarding?plan=professional" className="block">
                  <Button variant="outline" className="w-full mb-6 hover:bg-brand-gray-50">
                    Get Started
                  </Button>
                </Link>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">6 AI journalist personas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Up to 200 articles/month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Advanced advertising (CPC/CPM)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Unlimited directory listings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Premium newsletter features</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">AI banner generation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Dedicated support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold"><strong>Keep 100% of revenue</strong></span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2 border-brand-blue-700/50 hover:border-brand-blue-600 transition-all hover:shadow-xl relative overflow-hidden bg-gradient-to-br from-brand-blue-50/30 to-transparent">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-blue-700 to-brand-blue-800" />
              <CardHeader className="pb-8 pt-8">
                <CardTitle className="text-2xl font-display mb-2">Enterprise</CardTitle>
                <CardDescription>Multiple newspapers nationwide</CardDescription>
                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold">Contact Us</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Custom pricing</p>
                  <p className="text-xs text-brand-blue-600 font-medium mt-1">
                    Each newspaper includes complete business setup
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full mb-6 hover:bg-brand-blue-50 border-brand-blue-300">
                  Contact Sales
                </Button>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Unlimited AI journalists</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Multi-newspaper network</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Unlimited everything</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Partner advertising network</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">White-label options</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">24/7 phone support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold"><strong>Keep 100% of revenue</strong></span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Revenue Retention Highlight */}
      <section className="relative py-20 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-br from-brand-blue-50 to-brand-blue-100/50 rounded-3xl p-12 border-2 border-brand-blue-200/60 shadow-xl text-center">
            <Award className="h-16 w-16 text-brand-blue-600 mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              No Revenue Sharing.<br />
              <span className="text-brand-blue-600">Ever.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Unlike other platforms that take 20-30% of your ad revenue, we charge a simple monthly fee. Every dollar from advertising, directory, and subscriptions goes straight to you. That means more of your hard-earned revenue stays in your pocket.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-display font-bold text-brand-blue-600 mb-2">$199</div>
                <div className="text-sm text-muted-foreground">One-Time Setup</div>
              </div>
              <div>
                <div className="text-4xl font-display font-bold text-brand-blue-600 mb-2">0%</div>
                <div className="text-sm text-muted-foreground">Revenue Share</div>
              </div>
              <div>
                <div className="text-4xl font-display font-bold text-brand-blue-600 mb-2">100%</div>
                <div className="text-sm text-muted-foreground">You Keep</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-4xl font-bold text-center mb-12">
            Compare All Features
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-4 px-6 font-display text-lg">Feature</th>
                  <th className="text-center py-4 px-6 font-display text-lg">Starter</th>
                  <th className="text-center py-4 px-6 font-display text-lg text-brand-blue-600">Growth</th>
                  <th className="text-center py-4 px-6 font-display text-lg">Professional</th>
                  <th className="text-center py-4 px-6 font-display text-lg">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-4 px-6 font-medium">AI Journalist Personas</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">1</td>
                  <td className="py-4 px-6 text-center text-brand-blue-600 font-semibold">3</td>
                  <td className="py-4 px-6 text-center">6</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="py-4 px-6 font-medium">Articles per Month</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">50</td>
                  <td className="py-4 px-6 text-center text-brand-blue-600 font-semibold">115</td>
                  <td className="py-4 px-6 text-center">200</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Advertising Features</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">Basic</td>
                  <td className="py-4 px-6 text-center text-brand-blue-600 font-semibold">CPC/CPM</td>
                  <td className="py-4 px-6 text-center">CPC/CPM</td>
                  <td className="py-4 px-6 text-center">Advanced</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="py-4 px-6 font-medium">AI Banner Generation</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                  <td className="py-4 px-6 text-center"><CheckCircle2 className="h-5 w-5 text-brand-blue-600 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><CheckCircle2 className="h-5 w-5 text-brand-blue-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Business Directory Listings</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">25</td>
                  <td className="py-4 px-6 text-center text-brand-blue-600 font-semibold">100</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="py-4 px-6 font-medium">Newsletter Subscriptions</td>
                  <td className="py-4 px-6 text-center"><CheckCircle2 className="h-5 w-5 text-brand-blue-600 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><CheckCircle2 className="h-5 w-5 text-brand-blue-600 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><CheckCircle2 className="h-5 w-5 text-brand-blue-600 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><CheckCircle2 className="h-5 w-5 text-brand-blue-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Multi-Newspaper Network</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                  <td className="py-4 px-6 text-center"><CheckCircle2 className="h-5 w-5 text-brand-blue-600 mx-auto" /></td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="py-4 px-6 font-medium">Partner Advertising Network</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                  <td className="py-4 px-6 text-center"><CheckCircle2 className="h-5 w-5 text-brand-blue-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">White-Label Options</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                  <td className="py-4 px-6 text-center"><CheckCircle2 className="h-5 w-5 text-brand-blue-600 mx-auto" /></td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="py-4 px-6 font-medium">Support</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">Email</td>
                  <td className="py-4 px-6 text-center text-brand-blue-600 font-semibold">Priority</td>
                  <td className="py-4 px-6 text-center">Dedicated</td>
                  <td className="py-4 px-6 text-center">24/7 Phone</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium"><strong>Revenue Share</strong></td>
                  <td className="py-4 px-6 text-center"><strong className="text-brand-blue-600">0%</strong></td>
                  <td className="py-4 px-6 text-center"><strong className="text-brand-blue-600">0%</strong></td>
                  <td className="py-4 px-6 text-center"><strong className="text-brand-blue-600">0%</strong></td>
                  <td className="py-4 px-6 text-center"><strong className="text-brand-blue-600">0%</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="relative py-20 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-5xl mx-auto px-6">
          {/* Revenue Systems Included Notice */}
          <div className="bg-brand-blue-600 text-white rounded-xl p-6 mb-8 text-center">
            <p className="text-lg font-semibold">
              All 3 revenue systems below are included in your $199 setup - ready to monetize immediately
            </p>
          </div>

          <div className="text-center mb-12">
            <Sparkles className="h-12 w-12 text-brand-blue-600 mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Example Scenario:<br />
              <span className="text-brand-blue-600">Potential Month 1</span>
            </h2>
            <p className="text-muted-foreground">Results vary based on community size and effort</p>
          </div>

          <Card className="border-2 border-brand-blue-200 bg-gradient-to-br from-card to-brand-blue-50/30 overflow-hidden">
            <CardContent className="pt-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <div className="font-semibold text-lg mb-1">Revenue Stream #1: Advertising</div>
                    <p className="text-sm text-muted-foreground">10 advertisers × $99/mo</p>
                  </div>
                  <div className="text-3xl font-display font-bold text-brand-blue-600">$990</div>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <div className="font-semibold text-lg mb-1">Revenue Stream #2: Directory</div>
                    <p className="text-sm text-muted-foreground">8 featured businesses × $49/mo</p>
                  </div>
                  <div className="text-3xl font-display font-bold text-brand-blue-600">$392</div>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <div className="font-semibold text-lg mb-1">Revenue Stream #3: Subscriptions</div>
                    <p className="text-sm text-muted-foreground">30 premium subscribers × $9/mo</p>
                  </div>
                  <div className="text-3xl font-display font-bold text-brand-blue-600">$270</div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t-2 border-brand-blue-200">
                  <div>
                    <div className="font-semibold text-xl mb-1">Total Monthly Revenue</div>
                    <p className="text-sm text-muted-foreground">Before platform fee</p>
                  </div>
                  <div className="text-4xl font-display font-bold text-brand-blue-600">$1,652</div>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <div className="font-medium">Platform fee (Growth plan)</div>
                  <div className="text-2xl font-display font-semibold">-$199</div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t-2 border-border bg-gradient-to-r from-brand-blue-500 to-brand-blue-600 -mx-8 px-8 py-6 -mb-8 text-white">
                  <div>
                    <div className="font-semibold text-2xl mb-1">Your Profit (Month 1)</div>
                    <p className="text-sm text-brand-blue-100">8.3x ROI on platform fee</p>
                  </div>
                  <div className="text-5xl font-display font-bold">$1,453</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-muted-foreground mt-8 text-lg">
            This is an example scenario. Actual results vary based on your community size, engagement, and marketing effort. Revenue potential ranges from <strong className="text-foreground">$1,500-$5,000+/month</strong>.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 rounded-3xl p-16 shadow-2xl border border-brand-blue-400/20">
              <Star className="h-16 w-16 text-white mx-auto mb-6 fill-white" />
              <h2 className="font-display text-5xl md:text-6xl font-bold text-white mb-6">
                Launch Your Paper Today
              </h2>
              <p className="text-xl text-brand-blue-100 mb-10 max-w-2xl mx-auto">
                *Your setup includes the seeding of your first 36 articles and 100 directory listings to get you started. Keep 100% of everything you earn.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <Link href="/onboarding">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-10 h-16 gap-3 bg-white text-brand-blue-600 hover:bg-brand-blue-50 shadow-xl"
                  >
                    Get Started <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/testimonials">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-10 h-16 border-2 border-white text-white hover:bg-white/10"
                  >
                    Read Success Stories
                  </Button>
                </Link>
              </div>
              <p className="text-brand-blue-200 mt-8 text-sm">
                $199 setup • Keep 100% of revenue • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}