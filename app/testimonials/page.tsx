'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Globe2,
  Quote,
  Star,
  Users,
  TrendingUp,
  DollarSign,
  Award,
  BarChart3,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function TestimonialsPage() {
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
              Success Stories
            </Link>
            <Button variant="ghost" size="sm">Sign In</Button>
            <Button size="sm" className="gap-2 shadow-lg shadow-brand-blue-500/20">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-brand-blue-200/60 bg-gradient-to-r from-brand-blue-50/80 to-brand-blue-100/60 backdrop-blur-sm mb-8">
              <Users className="h-4 w-4 text-brand-blue-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-brand-blue-700 to-brand-blue-600 bg-clip-text text-transparent">
                Success Stories
              </span>
            </div>
            <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Loved by Publishers<br />
              <span className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent">
                Nationwide
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Real stories from real publishers who transformed their local journalism with Newsroom AIOS.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-20">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent mb-2">
                500+
              </div>
              <div className="text-sm text-muted-foreground font-medium">Active Newspapers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent mb-2">
                $50M+
              </div>
              <div className="text-sm text-muted-foreground font-medium">Revenue Generated</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent mb-2">
                10M+
              </div>
              <div className="text-sm text-muted-foreground font-medium">Monthly Readers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-brand-blue-600 to-brand-blue-500 bg-clip-text text-transparent mb-2">
                98%
              </div>
              <div className="text-sm text-muted-foreground font-medium">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Success Stories */}
      <section className="relative py-20 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {/* Testimonial 1 */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-xl bg-gradient-to-br from-card to-brand-blue-50/30">
              <CardContent className="pt-8">
                <Quote className="h-12 w-12 text-brand-blue-200 mb-6" />
                <p className="text-lg leading-relaxed mb-8 italic">
                  "We launched our newspaper in 3 weeks and hit $5,000/month in revenue within 60 days. The AI-generated advertising banners are incredible—our local businesses love them."
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 rounded-full overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                      alt="Sarah Mitchell"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Sarah Mitchell</div>
                    <div className="text-sm text-muted-foreground">Publisher, Mountain View Times</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-xl bg-gradient-to-br from-card to-brand-blue-50/30">
              <CardContent className="pt-8">
                <Quote className="h-12 w-12 text-brand-blue-200 mb-6" />
                <p className="text-lg leading-relaxed mb-8 italic">
                  "The business directory became our #1 revenue stream. Local businesses love the featured tier and the SEO brings them real customers. We're at $2,400/month just from directory."
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 rounded-full overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                      alt="James Rodriguez"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">James Rodriguez</div>
                    <div className="text-sm text-muted-foreground">Editor-in-Chief, Coastal Chronicle</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-2 hover:border-brand-blue-500/50 transition-all hover:shadow-xl bg-gradient-to-br from-card to-brand-blue-50/30">
              <CardContent className="pt-8">
                <Quote className="h-12 w-12 text-brand-blue-200 mb-6" />
                <p className="text-lg leading-relaxed mb-8 italic">
                  "Newsroom AIOS gave us the tools to compete with big city papers. Our community journalism has never been stronger—or more profitable. $6,200/month combined revenue now."
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 rounded-full overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
                      alt="Emily Chen"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Emily Chen</div>
                    <div className="text-sm text-muted-foreground">Managing Editor, Valley Gazette</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Case Study: Mountain View Times */}
          <div className="bg-gradient-to-br from-brand-blue-50 to-brand-blue-100/50 rounded-3xl p-12 border-2 border-brand-blue-200/60 shadow-xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-600 text-white text-sm font-semibold mb-6">
                  <Award className="h-4 w-4" />
                  Featured Case Study
                </div>
                <h2 className="font-display text-4xl font-bold mb-4">
                  Mountain View Times:<br />
                  <span className="text-brand-blue-600">From Zero to $5K/month</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Sarah Mitchell launched Mountain View Times in a rural Colorado town of 8,000 residents. Within 60 days, she built a thriving local newspaper generating $5,000/month in recurring revenue.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <TrendingUp className="h-6 w-6 text-brand-blue-600 shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Launch: Week 1</div>
                      <p className="text-sm text-muted-foreground">Published 15 articles, seeded directory with 30 businesses, activated all revenue streams</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <BarChart3 className="h-6 w-6 text-brand-blue-600 shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Day 30: First Revenue</div>
                      <p className="text-sm text-muted-foreground">8 advertisers, 5 featured businesses, 20 premium subscribers = $1,800/mo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <DollarSign className="h-6 w-6 text-brand-blue-600 shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Day 60: Profitable</div>
                      <p className="text-sm text-muted-foreground">18 advertisers, 12 featured businesses, 50 subscribers = $5,000/mo</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop"
                  alt="Mountain View Times newsroom"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Testimonials */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-16">
            What Publishers Are Saying
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2">
              <CardContent className="pt-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed">
                  "The AI journalists are incredible. I can focus on investigative pieces while the AI handles daily news coverage. Quality is surprisingly good—readers can't tell the difference."
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                      alt="Michael Turner"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold">Michael Turner</div>
                    <div className="text-sm text-muted-foreground">Harbor News Daily</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed">
                  "We tried three other newspaper platforms before Newsroom AIOS. None had built-in monetization like this. The advertising platform alone paid for itself in week 2."
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
                      alt="Rebecca Santos"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold">Rebecca Santos</div>
                    <div className="text-sm text-muted-foreground">Desert Sun Tribune</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed">
                  "Setup took 2 hours. Published first article same day. Had paying advertisers within 48 hours. This is what journalism software should have been all along."
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
                      alt="David Kim"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold">David Kim</div>
                    <div className="text-sm text-muted-foreground">Lakeside Observer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed">
                  "Our community loves the newsletter. We went from 0 subscribers to 150 in 90 days. The automated email campaigns are gold—engagement rates are through the roof."
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop"
                      alt="Jennifer Park"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold">Jennifer Park</div>
                    <div className="text-sm text-muted-foreground">Pine Ridge Press</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Revenue Results */}
      <section className="relative py-20 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-4">
            Real Revenue Results
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-16 max-w-3xl mx-auto">
            Verified monthly recurring revenue from our top-performing newspapers
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-2 border-brand-blue-200 bg-gradient-to-br from-card to-brand-blue-50/20 text-center">
              <CardContent className="pt-8">
                <DollarSign className="h-10 w-10 text-brand-blue-600 mx-auto mb-4" />
                <div className="text-4xl font-display font-bold text-brand-blue-600 mb-2">$6,200</div>
                <div className="text-sm text-muted-foreground mb-1">Valley Gazette</div>
                <div className="text-xs text-muted-foreground">Month 3</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-brand-blue-200 bg-gradient-to-br from-card to-brand-blue-50/20 text-center">
              <CardContent className="pt-8">
                <DollarSign className="h-10 w-10 text-brand-blue-600 mx-auto mb-4" />
                <div className="text-4xl font-display font-bold text-brand-blue-600 mb-2">$5,000</div>
                <div className="text-sm text-muted-foreground mb-1">Mountain View Times</div>
                <div className="text-xs text-muted-foreground">Month 2</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-brand-blue-200 bg-gradient-to-br from-card to-brand-blue-50/20 text-center">
              <CardContent className="pt-8">
                <DollarSign className="h-10 w-10 text-brand-blue-600 mx-auto mb-4" />
                <div className="text-4xl font-display font-bold text-brand-blue-600 mb-2">$4,100</div>
                <div className="text-sm text-muted-foreground mb-1">Coastal Chronicle</div>
                <div className="text-xs text-muted-foreground">Month 2</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-brand-blue-200 bg-gradient-to-br from-card to-brand-blue-50/20 text-center">
              <CardContent className="pt-8">
                <DollarSign className="h-10 w-10 text-brand-blue-600 mx-auto mb-4" />
                <div className="text-4xl font-display font-bold text-brand-blue-600 mb-2">$3,200</div>
                <div className="text-sm text-muted-foreground mb-1">Desert Sun Tribune</div>
                <div className="text-xs text-muted-foreground">Month 1</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Video Testimonials Teaser */}
      <section className="relative py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 rounded-3xl p-16 shadow-2xl border border-brand-blue-400/20 text-center text-white">
            <Sparkles className="h-16 w-16 mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              See Publishers in Action
            </h2>
            <p className="text-xl text-brand-blue-100 mb-10 max-w-2xl mx-auto">
              Watch video interviews with newspaper owners who share their journey from launch to profitability.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-10 h-16 gap-3 bg-white text-brand-blue-600 hover:bg-brand-blue-50 shadow-xl"
            >
              <Globe2 className="h-5 w-5" />
              Watch Video Stories
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-500/20 to-brand-blue-600/20 rounded-3xl blur-3xl" />
            <div className="relative bg-card border-2 border-brand-blue-200 rounded-3xl p-16 shadow-2xl">
              <Award className="h-16 w-16 text-brand-blue-600 mx-auto mb-6" />
              <h2 className="font-display text-5xl md:text-6xl font-bold mb-6">
                Join 500+ Publishers
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                $199 one-time setup. Keep 100% of all revenue you generate. Launch your newspaper and start earning.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <Button
                  size="lg"
                  className="text-lg px-10 h-16 gap-3 shadow-xl shadow-brand-blue-500/30"
                >
                  Launch Your Paper <ArrowRight className="h-5 w-5" />
                </Button>
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
      <footer className="border-t border-border bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-brand-blue-600">
                  <Globe2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-display font-bold">
                  Newsroom <span className="text-brand-blue-600">AIOS</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Empowering local journalism with AI-powered tools and built-in monetization.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-brand-blue-600 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-brand-blue-600 transition-colors">Pricing</Link></li>
                <li><Link href="/testimonials" className="hover:text-brand-blue-600 transition-colors">Success Stories</Link></li>
                <li><a href="#" className="hover:text-brand-blue-600 transition-colors">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-brand-blue-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-brand-blue-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-brand-blue-600 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-brand-blue-600 transition-colors">API Reference</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-brand-blue-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-brand-blue-600 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-brand-blue-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-blue-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 Newsroom AIOS. Transforming local journalism with AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
