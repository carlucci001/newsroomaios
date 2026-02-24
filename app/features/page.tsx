'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Target,
  Building2,
  Mail,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BarChart3,
  Zap,
  DollarSign,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function FeaturesPage() {
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
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-brand-blue-200/60 bg-gradient-to-r from-brand-blue-50/80 to-brand-blue-100/60 backdrop-blur-sm mb-8">
              <Zap className="h-4 w-4 text-brand-blue-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-brand-blue-700 to-brand-blue-600 bg-clip-text text-transparent">
                Revenue Streams
              </span>
            </div>
            <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Three Ways to Earn.<br />
              <span className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent">
                One Powerful Platform.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Turn your local newspaper into a thriving business with built-in monetization from day one. No technical knowledge required.
            </p>
          </div>

          {/* Platform Screenshot */}
          <div className="relative max-w-6xl mx-auto mb-32">
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-3xl" />
            <div className="relative rounded-2xl overflow-hidden border-4 border-border shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop"
                alt="Newsroom AIOS Dashboard - Revenue Analytics"
                width={1200}
                height={675}
                className="w-full h-auto"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6 italic">
              Live revenue dashboard showing all three income streams in real-time
            </p>
          </div>
        </div>
      </section>

      {/* Revenue Stream 1: AI-Powered Advertising */}
      <section className="relative py-20 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-50 border border-brand-blue-200/60 mb-6">
                <Target className="h-4 w-4 text-brand-blue-600" />
                <span className="text-sm font-semibold text-brand-blue-700">Revenue Stream #1</span>
              </div>
              <h2 className="font-display text-5xl font-bold mb-6">
                AI-Powered<br />
                <span className="text-brand-blue-600">Advertising Platform</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Advertisers sign up online and get professional AI-generated banner ads instantly. You approve, they pay, banners go live. It's that simple.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-blue-100 flex items-center justify-center shrink-0">
                    <Sparkles className="h-6 w-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Automated AI Banner Generation</h3>
                    <p className="text-muted-foreground">
                      Our AI analyzes the business website or directory listing, extracts brand colors and logos, then generates professional banners using Gemini + Imagen 3. No design skills needed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-blue-100 flex items-center justify-center shrink-0">
                    <DollarSign className="h-6 w-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Flexible Pricing Models</h3>
                    <p className="text-muted-foreground">
                      You control the pricing: flat monthly ($99-499), cost-per-click (CPC), or cost-per-impression (CPM). Different advertisers, different models.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-blue-100 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-6 w-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Real-Time Analytics</h3>
                    <p className="text-muted-foreground">
                      Track impressions, clicks, and conversions for every advertiser. Automated invoicing for CPC/CPM models. Transparent reporting builds trust.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-brand-blue-50 to-brand-blue-100/50 rounded-2xl p-8 border border-brand-blue-200/60">
                <div className="flex items-baseline gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-muted-foreground">Revenue Potential</span>
                </div>
                <div className="text-5xl font-display font-bold text-brand-blue-600 mb-2">
                  $1,500-3,000<span className="text-2xl text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">With 15-30 active advertisers</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1557838923-2985c318be48?w=800&h=500&fit=crop"
                  alt="AI-Generated Banner Examples"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center italic">
                Examples of AI-generated banners created in seconds
              </p>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-xl">Advertiser Onboarding Flow</CardTitle>
                  <CardDescription>From signup to live banner in under 5 minutes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                      <span className="text-sm">Advertiser enters business URL or links directory listing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                      <span className="text-sm">AI analyzes business and generates professional banner</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                      <span className="text-sm">Advertiser reviews and pays via Stripe</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm">4</div>
                      <span className="text-sm">You approve → Banner goes live automatically</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Stream 2: Business Directory */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-xl mb-6">
                <Image
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop"
                  alt="Business Directory Interface"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center italic mb-6">
                Searchable directory with featured business placements
              </p>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-xl">Featured vs Free Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-semibold mb-3 text-muted-foreground">Free Tier</div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                          <span>Basic listing</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                          <span>Contact info</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                          <span>Category placement</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold mb-3 text-brand-blue-600">Featured ($49/mo)</div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                          <span>Top placement</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                          <span>Photos & gallery</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                          <span>Featured badge</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                          <span>Priority ranking</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-50 border border-brand-blue-200/60 mb-6">
                <Building2 className="h-4 w-4 text-brand-blue-600" />
                <span className="text-sm font-semibold text-brand-blue-700">Revenue Stream #2</span>
              </div>
              <h2 className="font-display text-5xl font-bold mb-6">
                Local Business<br />
                <span className="text-brand-blue-600">Directory Platform</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Free basic listings get businesses onboard, then upgrade them to featured tier for premium placement and benefits. Low friction, high conversion.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-blue-100 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Free Tier Strategy</h3>
                    <p className="text-muted-foreground">
                      Let businesses create free listings to build your directory. Once they see the value and traffic, upgrading to featured is an easy sell at $49/month.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-blue-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-6 w-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">SEO-Optimized for Local Search</h3>
                    <p className="text-muted-foreground">
                      Every business listing is optimized for local search. Your directory ranks for "[city] restaurants", "[town] plumbers", etc. Free traffic for businesses.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-blue-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Claim & Verify System</h3>
                    <p className="text-muted-foreground">
                      Business owners can claim existing listings (you or AI can seed the directory). Verification builds trust and encourages upgrades.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-brand-blue-50 to-brand-blue-100/50 rounded-2xl p-8 border border-brand-blue-200/60">
                <div className="flex items-baseline gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-muted-foreground">Revenue Potential</span>
                </div>
                <div className="text-5xl font-display font-bold text-brand-blue-600 mb-2">
                  $500-1,500<span className="text-2xl text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">With 10-30 featured businesses</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Stream 3: Newsletter Subscriptions */}
      <section className="relative py-20 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-50 border border-brand-blue-200/60 mb-6">
                <Mail className="h-4 w-4 text-brand-blue-600" />
                <span className="text-sm font-semibold text-brand-blue-700">Revenue Stream #3</span>
              </div>
              <h2 className="font-display text-5xl font-bold mb-6">
                Premium Newsletter<br />
                <span className="text-brand-blue-600">Subscriptions</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Free readers become paying subscribers for exclusive content, ad-free experience, and email newsletters. Recurring revenue that grows with your audience.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-blue-100 flex items-center justify-center shrink-0">
                    <Mail className="h-6 w-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Automated Email Campaigns</h3>
                    <p className="text-muted-foreground">
                      Send weekly or daily newsletters with AI-curated content from your newspaper. Set it once, runs automatically. Subscribers stay engaged.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-blue-100 flex items-center justify-center shrink-0">
                    <Sparkles className="h-6 w-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Paywall for Premium Content</h3>
                    <p className="text-muted-foreground">
                      Mark articles as premium-only. Readers hit a soft paywall and subscribe for $9/month or $90/year. Seamless Stripe integration.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-blue-100 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-6 w-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Subscriber Analytics</h3>
                    <p className="text-muted-foreground">
                      Track open rates, click-through rates, and content engagement. Optimize your content strategy based on what subscribers actually read.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-brand-blue-50 to-brand-blue-100/50 rounded-2xl p-8 border border-brand-blue-200/60">
                <div className="flex items-baseline gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-muted-foreground">Revenue Potential</span>
                </div>
                <div className="text-5xl font-display font-bold text-brand-blue-600 mb-2">
                  $500-1,500<span className="text-2xl text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">With 50-150 premium subscribers</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=500&fit=crop"
                  alt="Newsletter Email Example"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center italic">
                Professional newsletter templates included
              </p>

              <Card className="border-2 border-brand-blue-200 bg-gradient-to-br from-card to-brand-blue-50/30">
                <CardHeader>
                  <CardTitle className="text-xl">Subscription Tiers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold mb-1">Free Tier</div>
                        <p className="text-sm text-muted-foreground">Limited articles, ads visible, no email</p>
                      </div>
                      <div className="text-2xl font-display font-bold text-muted-foreground">$0</div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold mb-1 text-brand-blue-600">Premium Monthly</div>
                        <p className="text-sm text-muted-foreground">All articles, ad-free, weekly newsletter</p>
                      </div>
                      <div className="text-2xl font-display font-bold text-brand-blue-600">$9</div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold mb-1 text-brand-blue-700">Premium Annual</div>
                        <p className="text-sm text-muted-foreground">Save 17% with annual billing</p>
                      </div>
                      <div className="text-2xl font-display font-bold text-brand-blue-700">$90<span className="text-sm text-muted-foreground">/yr</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Combined Revenue CTA */}
      <section className="relative py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 rounded-3xl p-16 shadow-2xl border border-brand-blue-400/20 text-center">
              <DollarSign className="h-20 w-20 text-white mx-auto mb-6" />
              <h2 className="font-display text-5xl md:text-6xl font-bold text-white mb-6">
                Combined Potential: $3,000-5,000+/month
              </h2>
              <p className="text-xl text-brand-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
                With all three revenue streams active, newspapers have the potential to earn <span className="font-bold text-white">$40,000-60,000+ per year</span> in recurring revenue. Results vary based on community and effort.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-10 h-16 gap-3 bg-white text-brand-blue-600 hover:bg-brand-blue-50 shadow-xl"
                  >
                    See Pricing Plans <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-10 h-16 border-2 border-white text-white bg-transparent hover:bg-white/10"
                  >
                    How It Works
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
