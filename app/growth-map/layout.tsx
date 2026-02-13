import { Metadata } from 'next';
import { SITE_URL, createBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Growth Map - Live Newspaper Launches Across America',
  description:
    'Watch Newsroom AIOS newspaper launches happening in real-time across the United States. See live newspapers and reserved territories on our interactive growth map. Your community could be next.',
  alternates: { canonical: `${SITE_URL}/growth-map` },
  openGraph: {
    title: 'Newsroom AIOS Growth Map - Nationwide Newspaper Expansion',
    description:
      'Interactive map showing live newspaper launches and reservations across America.',
    url: `${SITE_URL}/growth-map`,
  },
};

export default function GrowthMapLayout({
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
              { name: 'Growth Map', url: `${SITE_URL}/growth-map` },
            ])
          ),
        }}
      />
      {children}
    </>
  );
}
