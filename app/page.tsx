'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Building2,
  Mail,
  CheckCircle2,
  ArrowRight,
  Play,
  Zap,
  Globe2,
  Shield,
  Rocket,
  DollarSign,
  Star,
  Award,
  ChevronRight,
  Quote,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { OnboardingContent } from "@/components/onboarding/OnboardingContent";
import { StatusContent } from "@/components/status/StatusContent";
import { VideoModal } from "@/components/VideoModal";
import { OnboardingChoice } from "@/components/onboarding/OnboardingChoice";
import { LeadCaptureForm } from "@/components/onboarding/LeadCaptureForm";

type PageView = 'home' | 'onboarding' | 'status' | 'leadCapture';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [pageView, setPageView] = useState<PageView>('home');
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [adminCredentials, setAdminCredentials] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [newspaperUrl, setNewspaperUrl] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  // Handle onboarding success - transition to status view
  const handleOnboardingSuccess = (newTenantId: string, credentials?: { email: string; temporaryPassword: string }, siteUrl?: string) => {
    setTenantId(newTenantId);
    if (credentials) setAdminCredentials(credentials);
    if (siteUrl) setNewspaperUrl(siteUrl);
    setPageView('status');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Go back to home
  const goHome = () => {
    setPageView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open onboarding choice dialog
  const openOnboarding = () => {
    setIsChoiceDialogOpen(true);
  };

  // Handle reserve spot choice
  const handleReserveSpot = () => {
    setIsChoiceDialogOpen(false);
    setPageView('leadCapture');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle get started today choice
  const handleGetStartedToday = () => {
    setIsChoiceDialogOpen(false);
    setPageView('onboarding');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle lead capture success
  const handleLeadCaptureSuccess = () => {
    setPageView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setIsVisible(true);

    // Check URL params for deep linking
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const idParam = params.get('id');

    if (viewParam === 'onboarding') {
      setPageView('onboarding');
    } else if (viewParam === 'status' && idParam) {
      setTenantId(idParam);
      setPageView('status');
    } else if (viewParam === 'leadCapture') {
      setPageView('leadCapture');
    }

    // Clear URL params after reading them
    if (viewParam) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.observe-animation');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex flex-col">
      {/* Newsroom Background - VISIBLE at 25% opacity */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Newspaper texture overlay */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                             linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
        {/* Printing press pattern */}
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
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-50/40 via-background to-brand-gray-50/40" />
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-brand-blue-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-blue-600/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Navigation */}
      <SiteHeader onGetStarted={openOnboarding} />

      {/* Conditional Content: Home Page OR Onboarding OR Status OR Lead Capture */}
      {pageView === 'leadCapture' && (
        <LeadCaptureForm
          onBack={goHome}
          onSuccess={handleLeadCaptureSuccess}
        />
      )}

      {pageView === 'onboarding' && (
        <OnboardingContent
          onSuccess={handleOnboardingSuccess}
          onBack={goHome}
        />
      )}

      {pageView === 'status' && tenantId && (
        <StatusContent
          tenantId={tenantId}
          onBack={goHome}
          adminCredentials={adminCredentials}
          newspaperUrl={newspaperUrl}
        />
      )}

      {pageView === 'home' && (
        <>
      {/* Hero Section with Background Image */}
      <section ref={heroRef} className="relative pt-24 pb-32 md:pt-32 md:pb-48 overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1920&h=1080&fit=crop&q=80"
            alt="Modern newsroom"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
        </div>

        <div className={`relative max-w-7xl mx-auto px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-brand-blue-200/60 bg-gradient-to-r from-brand-blue-50/80 to-brand-blue-100/60 backdrop-blur-sm mb-8 shadow-lg shadow-brand-blue-500/10 animate-fade-in">
              <Sparkles className="h-4 w-4 text-brand-blue-600 animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-brand-blue-700 to-brand-blue-600 bg-clip-text text-transparent">
                Building the future of local journalism
              </span>
              <Award className="h-4 w-4 text-brand-blue-600" />
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
              <span className="bg-gradient-to-br from-foreground via-foreground to-brand-gray-700 bg-clip-text text-transparent">
                Launch Your Local Newspaper
              </span>
              <br />
              <span className="bg-gradient-to-r from-brand-blue-600 via-brand-blue-500 to-brand-blue-600 bg-clip-text text-transparent animate-gradient">
                in Minutes
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-4 max-w-4xl mx-auto leading-relaxed font-light">
              AI-powered platform for community journalism.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground/80 mb-12 max-w-3xl mx-auto">
              Everything you need to create, publish, and monetize your local newspaper—from
              <span className="text-brand-blue-600 font-semibold"> AI-generated content</span> to
              <span className="text-brand-blue-600 font-semibold"> automated advertising</span> to
              <span className="text-brand-blue-600 font-semibold"> premium subscriptions</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
              <Button
                size="lg"
                onClick={openOnboarding}
                className="text-lg px-10 h-16 gap-3 shadow-2xl shadow-brand-blue-500/30 hover:shadow-brand-blue-500/40 transition-all hover:scale-105 group"
              >
                Launch Your Paper
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsVideoModalOpen(true)}
                className="text-lg px-10 h-16 gap-3 border-2 hover:border-brand-blue-500/50 hover:bg-brand-blue-50/50 transition-all group"
              >
                <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="pt-12 border-t border-border/40 backdrop-blur-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                <div className="group cursor-default">
                  <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                    50+
                  </div>
                  <div className="text-sm md:text-base text-muted-foreground font-medium">Year One Goal</div>
                </div>
                <div className="group cursor-default">
                  <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                    Local
                  </div>
                  <div className="text-sm md:text-base text-muted-foreground font-medium">Community Focus</div>
                </div>
                <div className="group cursor-default">
                  <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                    $40-60K
                  </div>
                  <div className="text-sm md:text-base text-muted-foreground font-medium">Revenue Potential/Year</div>
                </div>
                <div className="group cursor-default">
                  <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                    100%
                  </div>
                  <div className="text-sm md:text-base text-muted-foreground font-medium">Publisher-First</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Preview */}
      <section className="relative py-20 -mt-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative max-w-6xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-3xl" />
            <div className="relative rounded-2xl overflow-hidden border-4 border-border shadow-2xl bg-background">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop&q=80"
                alt="Newsroom AIOS Platform Dashboard"
                className="w-full h-auto"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6 italic">
              Complete dashboard showing revenue analytics, content management, and subscriber growth
            </p>
          </div>
        </div>
      </section>

      {/* Value Proposition Banner */}
      <section className="relative py-20 bg-gradient-to-b from-muted/30 to-transparent border-y border-border/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground mb-12 font-semibold tracking-wider uppercase">
            Built for Local Journalism
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center">
            {[
              { name: 'AI-Powered Content', icon: '🤖' },
              { name: 'Multiple Revenue Streams', icon: '💰' },
              { name: 'Community Focused', icon: '🏘️' },
              { name: 'Launch in Minutes', icon: '🚀' }
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-3 p-6 rounded-xl hover:bg-brand-blue-50/50 transition-all group cursor-default"
              >
                <span className="text-4xl group-hover:scale-125 transition-transform">{item.icon}</span>
                <span className="text-center font-display text-lg font-semibold text-muted-foreground group-hover:text-brand-blue-600 transition-colors">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Three Revenue Streams */}
      <section id="features" ref={featuresRef} className="relative py-32 md:py-40 observe-animation">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-50 border border-brand-blue-200/60 mb-6">
              <Zap className="h-4 w-4 text-brand-blue-600" />
              <span className="text-sm font-semibold text-brand-blue-700">Revenue Streams</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Three Ways to Earn.<br />
              <span className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent">
                One Powerful Platform.
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Turn your local newspaper into a thriving business with built-in monetization from day one.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Advertising Card */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-2xl hover:shadow-brand-blue-500/20 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-brand-blue-500/30">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-display mb-3">AI-Powered Advertising</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Advertisers sign up and get stunning AI-generated banners instantly. Choose from flexible pricing models.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Automated AI banner generation</span>
                      <p className="text-sm text-muted-foreground">Professional designs in seconds using Gemini + Imagen</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Flexible pricing models</span>
                      <p className="text-sm text-muted-foreground">CPC, CPM, or flat monthly/weekly rates</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Real-time analytics</span>
                      <p className="text-sm text-muted-foreground">Track impressions, clicks, and conversions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Admin approval workflow</span>
                      <p className="text-sm text-muted-foreground">Quality control before ads go live</p>
                    </div>
                  </li>
                </ul>
                <div className="pt-6 border-t border-border">
                  <div className="flex items-baseline gap-2 mb-1">
                    <div className="text-sm text-muted-foreground font-medium">Revenue Potential</div>
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div className="text-4xl font-display font-bold bg-gradient-to-r from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent">
                    $1,500-3,000<span className="text-xl text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">With 15-30 active advertisers</p>
                </div>
              </CardContent>
            </Card>

            {/* Directory Card */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-2xl hover:shadow-brand-blue-500/20 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-brand-blue-500/30">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-display mb-3">Business Directory</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Local businesses list for free, upgrade to featured tier for premium placement and benefits.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Free basic listings</span>
                      <p className="text-sm text-muted-foreground">Get businesses onboard at no cost</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Featured tier at $49/month</span>
                      <p className="text-sm text-muted-foreground">Premium placement, images, and priority ranking</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">SEO optimized</span>
                      <p className="text-sm text-muted-foreground">Local search rankings for your community</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Claim and verify</span>
                      <p className="text-sm text-muted-foreground">Business owners can claim existing listings</p>
                    </div>
                  </li>
                </ul>
                <div className="pt-6 border-t border-border">
                  <div className="flex items-baseline gap-2 mb-1">
                    <div className="text-sm text-muted-foreground font-medium">Revenue Potential</div>
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div className="text-4xl font-display font-bold bg-gradient-to-r from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent">
                    $500-1,500<span className="text-xl text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">With 10-30 featured businesses</p>
                </div>
              </CardContent>
            </Card>

            {/* Newsletter Card */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-2xl hover:shadow-brand-blue-500/20 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-brand-blue-500/30">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-display mb-3">Newsletter Subscriptions</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Free readers become premium subscribers at $9/month for exclusive content and ad-free experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Automated email campaigns</span>
                      <p className="text-sm text-muted-foreground">Send newsletters with AI-curated content</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Paywall for premium content</span>
                      <p className="text-sm text-muted-foreground">Monetize exclusive articles and deep dives</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Subscriber analytics</span>
                      <p className="text-sm text-muted-foreground">Track engagement and optimize content</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Annual plans available</span>
                      <p className="text-sm text-muted-foreground">$90/year for committed readers</p>
                    </div>
                  </li>
                </ul>
                <div className="pt-6 border-t border-border">
                  <div className="flex items-baseline gap-2 mb-1">
                    <div className="text-sm text-muted-foreground font-medium">Revenue Potential</div>
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div className="text-4xl font-display font-bold bg-gradient-to-r from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent">
                    $500-1,500<span className="text-xl text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">With 50-150 premium subscribers</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Combined Revenue CTA */}
          <div className="text-center bg-gradient-to-br from-brand-blue-50 to-brand-blue-100/50 rounded-3xl p-12 border-2 border-brand-blue-200/60 shadow-xl">
            <DollarSign className="h-16 w-16 text-brand-blue-600 mx-auto mb-6" />
            <h3 className="font-display text-4xl font-bold mb-4">
              Combined Potential: <span className="text-brand-blue-600">$3,000-5,000+/month</span>
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              With all three revenue streams active, newspapers have the potential to earn $40,000-60,000+ per year in recurring revenue.
            </p>
            <Link href="/features">
              <Button size="lg" className="gap-2 shadow-lg shadow-brand-blue-500/30">
                See Full Revenue Breakdown <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-32 bg-gradient-to-b from-muted/30 to-transparent observe-animation">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-50 border border-brand-blue-200/60 mb-6">
              <Rocket className="h-4 w-4 text-brand-blue-600" />
              <span className="text-sm font-semibold text-brand-blue-700">Simple Process</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-bold mb-6">
              Launch in <span className="text-brand-blue-600">3 Simple Steps</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Go from idea to published newspaper in under 30 minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                icon: Globe2,
                title: 'Choose Your Domain',
                description: 'Select your newspaper name and custom domain. We\'ll handle all the technical setup automatically.',
                features: ['Custom domain included', 'SSL certificate', 'CDN acceleration']
              },
              {
                step: '02',
                icon: Sparkles,
                title: 'AI Content Setup',
                description: 'Configure your AI journalists, select content categories, and define your editorial voice.',
                features: ['AI journalist personas', 'Content scheduling', 'Editorial guidelines']
              },
              {
                step: '03',
                icon: TrendingUp,
                title: 'Start Publishing',
                description: 'Activate revenue streams, publish your first articles, and start growing your audience.',
                features: ['Instant monetization', 'Analytics dashboard', '24/7 support']
              }
            ].map((item, i) => (
              <div
                key={i}
                className="relative group"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-card border-2 border-border hover:border-brand-blue-500/50 rounded-2xl p-8 transition-all hover:shadow-xl">
                  <div className="text-8xl font-display font-bold text-brand-blue-100 absolute -top-6 -right-6 select-none">
                    {item.step}
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-brand-blue-500/30 group-hover:scale-110 transition-transform relative z-10">
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-4 relative z-10">{item.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed relative z-10">{item.description}</p>
                  <ul className="space-y-2 relative z-10">
                    {item.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-brand-blue-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" ref={pricingRef} className="relative py-32 md:py-40 observe-animation">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-50 border border-brand-blue-200/60 mb-6">
              <DollarSign className="h-4 w-4 text-brand-blue-600" />
              <span className="text-sm font-semibold text-brand-blue-700">Transparent Pricing</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-bold mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              No hidden fees. No revenue sharing. Keep 100% of what you earn from ads, directory, and subscriptions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                  <p className="text-sm text-muted-foreground mt-2">+ $199 one-time setup</p>
                  <p className="text-xs text-brand-blue-600 font-medium mt-1">
                    Includes 36 articles + 100 listings + all revenue systems
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={openOnboarding} className="w-full mb-6 hover:bg-brand-gray-50">
                  Get Started
                </Button>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">1 AI journalist</span>
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
                    <span className="text-sm">Email support</span>
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
                <CardDescription>For serious publishers</CardDescription>
                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-display font-bold text-brand-blue-600">$199</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">+ $199 one-time setup</p>
                  <p className="text-xs text-brand-blue-600 font-medium mt-1">
                    Includes 36 articles + 100 listings + all revenue systems
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={openOnboarding} className="w-full mb-6 shadow-lg shadow-brand-blue-500/30">
                  Get Started
                </Button>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">3 AI journalists</span>
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
                    <span className="text-sm font-semibold">Unlimited directory listings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Custom branding</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Priority support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-blue-600 to-brand-blue-700" />
              <CardHeader className="pb-8 pt-8">
                <CardTitle className="text-2xl font-display mb-2">Professional</CardTitle>
                <CardDescription>For high-volume publishers</CardDescription>
                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-display font-bold">$299</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">+ $199 one-time setup</p>
                  <p className="text-xs text-brand-blue-600 font-medium mt-1">
                    Includes 36 articles + 100 listings + all revenue systems
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={openOnboarding} className="w-full mb-6 hover:bg-brand-blue-50">
                  Get Started
                </Button>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">6 AI journalists</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Up to 200 articles/month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Full analytics suite</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">AI banner generation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Custom integrations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Enterprise Plan - Full Width */}
          <div className="max-w-2xl mx-auto mt-8">
            <Card className="border-2 border-dashed border-brand-blue-300 hover:border-brand-blue-500 transition-all hover:shadow-xl relative overflow-hidden bg-gradient-to-br from-brand-blue-50/50 to-transparent">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-display font-bold mb-2">Enterprise</h3>
                    <p className="text-muted-foreground">
                      Looking to launch multiple newspapers across the country? Our Enterprise plan offers custom solutions for newspaper networks.
                    </p>
                  </div>
                  <Button variant="outline" className="shrink-0 hover:bg-brand-blue-50">
                    Contact Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-16">
            <p className="text-muted-foreground text-lg mb-6">
              $199 one-time setup includes 36 articles, 100 directory listings, and all revenue systems. Keep 100% of everything you earn.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-blue-600" />
                <span>No revenue sharing</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-blue-600" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-blue-600" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="relative py-32 bg-gradient-to-b from-muted/30 to-transparent observe-animation">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-50 border border-brand-blue-200/60 mb-6">
              <Users className="h-4 w-4 text-brand-blue-600" />
              <span className="text-sm font-semibold text-brand-blue-700">Why Newsroom AIOS</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-bold mb-6">
              Built for <span className="text-brand-blue-600">Local Publishers</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Efficiency",
                description: "Generate professional articles, advertising banners, and newsletters automatically. Focus on community engagement while AI handles the heavy lifting.",
                icon: "🤖"
              },
              {
                title: "Multiple Revenue Streams",
                description: "Monetize from day one with advertising, business directory listings, and premium subscriptions—all built into one platform.",
                icon: "💰"
              },
              {
                title: "Community First",
                description: "Local journalism matters. Our platform is designed to help you serve your community with relevant, timely content that builds trust.",
                icon: "🏘️"
              }
            ].map((item, i) => (
              <Card key={i} className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-xl bg-gradient-to-br from-card to-brand-blue-50/30">
                <CardContent className="pt-8">
                  <div className="text-5xl mb-6">{item.icon}</div>
                  <h3 className="text-xl font-display font-bold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Growth Map CTA */}
      <section className="relative py-32 observe-animation bg-gradient-to-b from-transparent via-brand-blue-50/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200/60 mb-6">
              <MapPin className="h-4 w-4 text-green-600 animate-pulse" />
              <span className="text-sm font-semibold text-green-700">Live Growth Map</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-bold mb-6">
              Watch Our <span className="text-brand-blue-600">Nationwide Expansion</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
              See real-time reservations and launches happening across America. Your community could be next!
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue-500/20 to-green-500/20 rounded-3xl blur-3xl" />
            <Card className="relative border-2 border-brand-blue-200 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                {/* Map Preview Image */}
                <div className="relative bg-gradient-to-br from-brand-blue-50 to-green-50 p-12 min-h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative inline-block mb-8">
                      <div className="absolute inset-0 bg-brand-blue-500/20 rounded-full blur-2xl" />
                      <MapPin className="relative h-24 w-24 text-brand-blue-600 mx-auto animate-bounce" />
                    </div>
                    <h3 className="text-3xl font-display font-bold mb-4">
                      Interactive US Map
                    </h3>
                    <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                      Blue pins show reserved territories. Green pins show live newspapers. Watch the movement in real-time!
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Link href="/growth-map">
                        <Button size="lg" className="gap-2 shadow-xl shadow-brand-blue-500/30">
                          <MapPin className="h-5 w-5" />
                          View Live Growth Map
                        </Button>
                      </Link>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={openOnboarding}
                        className="gap-2"
                      >
                        Reserve Your Spot
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Activity Ticker */}
                <div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 px-8 py-4">
                  <div className="flex items-center justify-center gap-4 text-white">
                    <TrendingUp className="h-5 w-5 animate-pulse" />
                    <p className="text-sm font-semibold">
                      🔥 Live Activity: Reservations happening right now across the country
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white rounded-xl border-2 border-brand-blue-100">
              <p className="text-4xl font-display font-bold text-brand-blue-600 mb-2">50+</p>
              <p className="text-sm text-muted-foreground">Territory Goal Year 1</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl border-2 border-green-100">
              <p className="text-4xl font-display font-bold text-green-600 mb-2">Live</p>
              <p className="text-sm text-muted-foreground">Real-Time Updates</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl border-2 border-purple-100">
              <p className="text-4xl font-display font-bold text-purple-600 mb-2">USA</p>
              <p className="text-sm text-muted-foreground">Nationwide Coverage</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 observe-animation">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 rounded-3xl p-16 shadow-2xl border border-brand-blue-400/20">
              <h2 className="font-display text-5xl md:text-6xl font-bold text-white mb-6">
                Ready to Launch Your Newspaper?
              </h2>
              <p className="text-xl text-brand-blue-100 mb-10 max-w-2xl mx-auto">
                Join the next generation of local publishers using AI-powered tools and multi-stream monetization.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={openOnboarding}
                  className="text-lg px-10 h-16 gap-3 bg-white text-brand-blue-600 hover:bg-brand-blue-50 shadow-xl"
                >
                  Launch Your Paper <ArrowRight className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="text-lg px-10 h-16 gap-3 border-2 border-white text-white hover:bg-white/10"
                >
                  <Play className="h-5 w-5" /> Watch Demo
                </Button>
              </div>
              <p className="text-brand-blue-200 mt-8 text-sm">
                $199 complete business setup • All systems included • Keep 100% of revenue
              </p>
            </div>
          </div>
        </div>
      </section>

        </>
      )}

      {/* Footer */}
      <SiteFooter />

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoSrc="/hero-video.mp4"
      />

      {/* Onboarding Choice Dialog */}
      <OnboardingChoice
        isOpen={isChoiceDialogOpen}
        onClose={() => setIsChoiceDialogOpen(false)}
        onReserveSpot={handleReserveSpot}
        onGetStarted={handleGetStartedToday}
      />

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-fade-in {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }

        .observe-animation {
          opacity: 0;
          transform: translateY(30px);
        }

        .observe-animation.animate-fade-in-up {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
