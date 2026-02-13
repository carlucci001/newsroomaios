import { Metadata } from 'next';
import { SITE_URL, createBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'Terms of Use for the Newsroom AIOS platform. Read our terms and conditions for using the AI-powered newspaper platform service.',
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
};

export default function TermsLayout({
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
              { name: 'Terms of Use', url: `${SITE_URL}/terms` },
            ])
          ),
        }}
      />
      {children}
    </>
  );
}
