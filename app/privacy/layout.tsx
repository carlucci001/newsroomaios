import { Metadata } from 'next';
import { SITE_URL, createBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Newsroom AIOS. Learn how we collect, use, and protect your personal information on our AI-powered newspaper platform.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
};

export default function PrivacyLayout({
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
              { name: 'Privacy Policy', url: `${SITE_URL}/privacy` },
            ])
          ),
        }}
      />
      {children}
    </>
  );
}
