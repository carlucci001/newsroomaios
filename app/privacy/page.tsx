import Link from 'next/link';
import { Newspaper, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-display font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 1, 2026</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Newsroom AIOS is a service of <strong>Farrington Development LLC</strong> (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
                We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains
                how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
                <li><strong>Business Information:</strong> Newspaper name, domain, service area, and category preferences</li>
                <li><strong>Payment Information:</strong> Credit card details processed securely through Stripe (we do not store your full card number)</li>
                <li><strong>Usage Data:</strong> Information about how you use our platform, including articles generated and features accessed</li>
                <li><strong>Communications:</strong> Any correspondence you have with us, including support requests</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your transactions and send related information</li>
                <li>Send you technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
                <li>Personalize and improve your experience on our platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">We may share your information in the following situations:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf (payment processing, hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> If required by law or in response to valid legal process</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you have given us explicit permission to share your information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information.
                However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot
                guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to or restrict certain processing of your information</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">California Privacy Rights (CCPA)</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li><strong>Right to Know:</strong> You may request that we disclose what personal information we have collected,
                  used, disclosed, and sold about you in the preceding 12 months.</li>
                <li><strong>Right to Delete:</strong> You may request that we delete personal information we have collected from you,
                  subject to certain exceptions.</li>
                <li><strong>Right to Opt-Out:</strong> You have the right to opt out of the sale of your personal information.
                  We do not sell your personal information.</li>
                <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising any of your
                  CCPA rights.</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                To exercise these rights, contact us at <strong>privacy@newsroomaios.com</strong>. We will respond to
                verifiable requests within 45 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">European Privacy Rights (GDPR)</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have
                additional rights under the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li><strong>Lawful Basis:</strong> We process your personal data based on: (a) your consent,
                  (b) performance of a contract, (c) compliance with legal obligations, or (d) our legitimate interests
                  in providing and improving our services.</li>
                <li><strong>Data Transfer:</strong> Your information may be transferred to and stored on servers
                  in the United States. By using our platform, you consent to this transfer. We implement appropriate
                  safeguards for international data transfers.</li>
                <li><strong>Right to Lodge a Complaint:</strong> You have the right to lodge a complaint with
                  your local data protection authority if you believe your rights have been violated.</li>
                <li><strong>Data Retention:</strong> We retain your personal information for as long as your account
                  is active or as needed to provide services. After account closure, we retain data for 90 days
                  before permanent deletion, unless longer retention is required by law.</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                For GDPR-related inquiries, contact us at <strong>privacy@newsroomaios.com</strong>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to track activity on our platform and hold certain information.
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Children&apos;s Privacy</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal
                information from children under 18.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="font-semibold">Farrington Development LLC</p>
                <p className="text-foreground/80">Email: privacy@newsroomaios.com</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex gap-4">
              <Link href="/terms">
                <Button variant="outline">Terms of Use</Button>
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
