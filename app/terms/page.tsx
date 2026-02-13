import Link from 'next/link';
import { Newspaper, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-lg bg-brand-blue-600 group-hover:bg-brand-blue-700 transition-colors">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold">
              Newsroom <span className="text-brand-blue-600">AIOS</span>
            </span>
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
          <h1 className="text-4xl font-display font-bold mb-4">Terms of Use</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 1, 2026</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                These Terms of Use constitute a legally binding agreement made between you and <strong>Farrington Development LLC</strong>
                (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), concerning your access to and use of the Newsroom AIOS platform.
              </p>
              <p className="text-foreground/80 leading-relaxed mb-4">
                By accessing or using our platform, you agree to be bound by these Terms of Use. If you disagree with any
                part of these terms, you may not access the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Services Description</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Newsroom AIOS provides an AI-powered platform for creating and managing local digital newspapers. Our services include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>AI-generated news content based on your selected categories and service area</li>
                <li>Website hosting and domain configuration</li>
                <li>Advertising and monetization tools</li>
                <li>Analytics and reporting</li>
                <li>Content management system</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Account Registration</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                To use our services, you must create an account and provide accurate, complete information. You are responsible
                for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section className="mb-8 bg-amber-50 border border-amber-200 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 text-amber-900">Payment Terms & Refund Policy</h2>
              <p className="text-amber-900 leading-relaxed mb-4">
                <strong>IMPORTANT: Please read this section carefully before purchasing.</strong>
              </p>
              <ul className="list-disc pl-6 space-y-3 text-amber-900">
                <li>
                  <strong>Setup Fee:</strong> A one-time $199 setup fee is charged at the time of purchase. This fee covers
                  domain configuration, template customization, initial content seeding, and platform provisioning.
                </li>
                <li>
                  <strong>Monthly Subscription:</strong> After the setup fee, you will be charged a monthly subscription
                  fee based on your selected plan (Starter: $99/mo, Growth: $199/mo, Professional: $299/mo, Enterprise: Custom pricing).
                </li>
                <li>
                  <strong>No Refunds:</strong> Due to the significant time, resources, and proprietary processes required
                  to provision your newspaper, <strong>all payments are non-refundable once your newspaper is live and you
                  have confirmed it is operational</strong>. This includes both the setup fee and any subscription payments.
                </li>
                <li>
                  <strong>Cancellation:</strong> You may cancel your subscription at any time. Upon cancellation, your
                  subscription will remain active until the end of your current billing period. No partial refunds will
                  be issued for unused time.
                </li>
              </ul>
              <p className="text-amber-900 leading-relaxed mt-4">
                By completing your purchase, you acknowledge and agree to these payment terms and refund policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">User Responsibilities</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">As a user of our platform, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Use the platform only for lawful purposes</li>
                <li>Not publish content that is defamatory, obscene, or otherwise objectionable</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not attempt to gain unauthorized access to any part of the platform</li>
                <li>Not use the platform to distribute malware or engage in any malicious activity</li>
                <li>Maintain accurate and up-to-date account information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                The Newsroom AIOS platform, including all software, designs, and content created by us, is owned by
                Farrington Development LLC and protected by intellectual property laws.
              </p>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Content generated for your newspaper using our AI tools becomes your property upon generation.
                However, you grant us a license to use aggregated, anonymized data for platform improvement purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">AI-Generated Content</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Our platform uses artificial intelligence to generate news content. While we strive for accuracy, you acknowledge that:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>AI-generated content should be reviewed before publication</li>
                <li>You are responsible for the accuracy and appropriateness of published content</li>
                <li>We are not liable for any errors or inaccuracies in AI-generated content</li>
                <li>Content should comply with journalistic standards and applicable laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Revenue and Monetization</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                You retain 100% of all revenue generated through your newspaper, including advertising revenue,
                directory listings, and subscription fees. We do not take any commission or revenue share.
                Our only fees are the setup fee and monthly subscription.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                To the maximum extent permitted by law, Farrington Development LLC shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages resulting from your use of or
                inability to use the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Ownership & Portability</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                You retain ownership of all content generated for your newspaper through our platform, including articles,
                images you have licensed, and business directory data you have collected.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>
                  <strong>Your Content:</strong> AI-generated articles, editorial content, and custom configurations
                  created for your newspaper are your property.
                </li>
                <li>
                  <strong>Data Export:</strong> Upon request, we will provide an export of your article content
                  and subscriber data in a standard format within 30 days.
                </li>
                <li>
                  <strong>After Cancellation:</strong> Your newspaper and all associated data will be deactivated
                  at the end of your billing period. Data is retained for 90 days after cancellation to allow for
                  reactivation, after which it may be permanently deleted.
                </li>
                <li>
                  <strong>Platform IP:</strong> The Newsroom AIOS platform, templates, software, and proprietary
                  systems remain the exclusive property of Farrington Development LLC. Your license to use the
                  platform ends upon termination.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">AI Content Liability</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Our platform uses artificial intelligence to assist in generating news content for your newspaper.
                By using our platform, you acknowledge and agree to the following:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>
                  <strong>Editorial Responsibility:</strong> You are the publisher of your newspaper and bear
                  ultimate responsibility for all content published on your site, whether AI-generated or not.
                </li>
                <li>
                  <strong>Review Obligation:</strong> AI-generated content should be reviewed for accuracy,
                  fairness, and compliance with applicable laws before publication.
                </li>
                <li>
                  <strong>No Warranty of Accuracy:</strong> While we strive for high-quality AI output, we make
                  no warranty that AI-generated content is free from errors, omissions, or bias.
                </li>
                <li>
                  <strong>Indemnification:</strong> You agree to indemnify Farrington Development LLC against
                  any claims arising from content published on your newspaper site, including claims of defamation,
                  copyright infringement, or privacy violations.
                </li>
                <li>
                  <strong>AI Transparency:</strong> We recommend that you maintain transparency with your readers
                  about the use of AI in your editorial process. Our platform provides an AI Disclosure page
                  template for this purpose.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                The Newsroom AIOS platform is designed for legitimate local news publishing. You agree not to use
                the platform for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Publishing hate speech, content that promotes violence, or discriminatory material</li>
                <li>Generating or distributing intentional misinformation or disinformation</li>
                <li>Operating a website that primarily serves as a vehicle for spam, scams, or fraud</li>
                <li>Publishing content that violates any applicable federal, state, or local law</li>
                <li>Impersonating a legitimate news organization or public official</li>
                <li>Using the platform to harass, threaten, or intimidate individuals</li>
                <li>Attempting to reverse-engineer, copy, or redistribute the platform software</li>
                <li>Sharing your platform credentials or API keys with unauthorized third parties</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                Violation of this Acceptable Use policy may result in immediate suspension or termination
                of your account without refund.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Termination</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                We may terminate or suspend your account and access to the platform immediately, without prior notice,
                for any reason, including breach of these Terms. Upon termination, your right to use the platform
                will immediately cease.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware,
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. We will provide notice of significant changes
                by posting the updated Terms on this page. Your continued use of the platform after changes constitutes
                acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                If you have any questions about these Terms of Use, please contact us:
              </p>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="font-semibold">Farrington Development LLC</p>
                <p className="text-foreground/80">Email: legal@newsroomaios.com</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex gap-4">
              <Link href="/privacy">
                <Button variant="outline">Privacy Policy</Button>
              </Link>
              <Link href="/refund-policy">
                <Button variant="outline">Refund Policy</Button>
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
