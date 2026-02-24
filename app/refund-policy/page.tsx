import Link from 'next/link';
import { ArrowLeft, AlertTriangle, XCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center shrink-0">
            <img src="/newsroom-logo.png" alt="Newsroom AIOS" width={200} height={67} className="h-[50px] w-auto object-contain" />
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-4">Refund Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 1, 2026</p>

          {/* Important Notice Banner */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-red-900 mb-2">Important: No Refunds Once Your Paper Is Live</h2>
                <p className="text-red-800 leading-relaxed">
                  Due to the significant investment of time, resources, and proprietary processes required to provision your newspaper,
                  <strong> all payments are non-refundable once your newspaper is online and you have confirmed it is operational.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Key Points Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="border-2 border-red-200 bg-red-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <XCircle className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-900">What Is NOT Refundable</h3>
                </div>
                <ul className="space-y-3 text-red-800">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>$199 setup fee once paper is live</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Monthly subscription payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Partial month after cancellation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900">What You CAN Do</h3>
                </div>
                <ul className="space-y-3 text-green-800">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Cancel anytime with no penalty</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Use service until end of billing period</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Downgrade/upgrade plans anytime</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Why No Refunds?</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Newsroom AIOS, operated by <strong>Farrington Development LLC</strong>, invests significant resources into launching each newspaper.
                When you sign up, we immediately begin a proprietary process that includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li><strong>Domain Configuration:</strong> Technical setup and DNS configuration for your custom domain</li>
                <li><strong>Template Customization:</strong> Personalizing your newspaper&apos;s design and branding</li>
                <li><strong>Content Seeding:</strong> AI-generated initial articles tailored to your service area and categories</li>
                <li><strong>Platform Provisioning:</strong> Server allocation, database setup, and infrastructure configuration</li>
                <li><strong>Quality Assurance:</strong> Testing to ensure your newspaper functions correctly</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                These processes begin immediately upon payment and cannot be reversed. The work performed has real costs
                that cannot be recovered, which is why we are unable to offer refunds once your paper is live.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Payment Structure</h2>
              <div className="bg-muted/50 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">One-Time Setup Fee</h3>
                    <p className="text-3xl font-bold text-brand-blue-600 mb-2">$199</p>
                    <p className="text-foreground/80 text-sm">
                      Charged at purchase. Covers all provisioning and setup costs. Non-refundable once paper is live.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Monthly Subscription</h3>
                    <p className="text-3xl font-bold text-brand-blue-600 mb-2">$99-$299/mo</p>
                    <p className="text-foreground/80 text-sm">
                      Billed monthly. Provides ongoing platform access. Cancel anytime, no refunds for partial months.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <Clock className="h-6 w-6 text-brand-blue-600" />
                Cancellation Policy
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                <strong>You may cancel your subscription at any time.</strong> Here&apos;s how it works:
              </p>
              <ol className="list-decimal pl-6 space-y-3 text-foreground/80">
                <li>
                  <strong>Cancel through your dashboard</strong> or by contacting support at support@newsroomaios.com
                </li>
                <li>
                  <strong>Your subscription remains active</strong> until the end of your current billing period
                </li>
                <li>
                  <strong>No further charges</strong> will be made after cancellation
                </li>
                <li>
                  <strong>No partial refunds</strong> will be issued for unused time in your current billing period
                </li>
                <li>
                  <strong>Your newspaper will be deactivated</strong> at the end of the billing period
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Confirmation Process</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                After your newspaper is provisioned, we will send you a confirmation request. By confirming that:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Your newspaper is accessible at your domain</li>
                <li>Your selected categories and service area are correctly configured</li>
                <li>Initial content has been generated</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                <strong>Once you confirm your newspaper is operational, all refund eligibility ends.</strong> This confirmation
                serves as your acknowledgment that services have been delivered as described.
              </p>
            </section>

            <section className="mb-8 bg-amber-50 border border-amber-200 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 text-amber-900">Before You Purchase</h2>
              <p className="text-amber-900 leading-relaxed mb-4">
                We want you to be fully informed before making a purchase. Please:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-amber-900">
                <li>Review all features and pricing on our website</li>
                <li>Understand that setup begins immediately upon payment</li>
                <li>Read our <Link href="/terms" className="underline">Terms of Use</Link> in full</li>
                <li>Contact us with any questions before purchasing</li>
              </ul>
              <p className="text-amber-900 leading-relaxed mt-4">
                <strong>By completing your purchase, you acknowledge and agree to this refund policy.</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Exceptions</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                In rare cases, we may consider exceptions at our sole discretion:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>If we are unable to provision your newspaper due to technical issues on our end</li>
                <li>If there is a material breach of our service commitments</li>
                <li>If legally required by applicable consumer protection laws</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                Any exceptions are evaluated on a case-by-case basis and do not create precedent for future requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                If you have questions about this refund policy or need assistance:
              </p>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="font-semibold">Farrington Development LLC</p>
                <p className="text-foreground/80">Email: support@newsroomaios.com</p>
                <p className="text-foreground/60 text-sm mt-2">Response time: Within 24-48 business hours</p>
              </div>
            </section>
          </div>

          {/* Summary Box */}
          <div className="mt-12 bg-brand-blue-50 border-2 border-brand-blue-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Summary</h2>
            <ul className="space-y-3 text-brand-blue-800">
              <li className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span><strong>No refunds</strong> once your newspaper is live and confirmed</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span><strong>Cancel anytime</strong> - subscription ends at billing period end</span>
              </li>
              <li className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <span><strong>No partial refunds</strong> for unused subscription time</span>
              </li>
            </ul>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex gap-4">
              <Link href="/privacy">
                <Button variant="outline">Privacy Policy</Button>
              </Link>
              <Link href="/terms">
                <Button variant="outline">Terms of Use</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-foreground/60">
            © 2026 Newsroom AIOS. A service of <strong>Farrington Development LLC</strong>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
