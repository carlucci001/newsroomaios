import { Metadata } from 'next';
import { SITE_URL, createBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description:
    'Refund policy for Newsroom AIOS. Understand our refund terms for the $199 setup fee and monthly subscription plans.',
  alternates: { canonical: `${SITE_URL}/refund-policy` },
  robots: { index: true, follow: true },
};

export default function RefundPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            createBreadcrumbJsonLd([
              { name: 'Home', url: SITE_URL },
              { name: 'Refund Policy', url: `${SITE_URL}/refund-policy` },
            ])
          ),
        }}
      />
      {children}
    </>
  );
}
