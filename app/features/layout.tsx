import { Metadata } from 'next';
import { SITE_URL, SITE_NAME, createBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Features - AI Advertising, Business Directory & Newsletter Subscriptions',
  description:
    'Three built-in revenue streams: AI-powered advertising with automated banner generation, local business directory with free-to-featured upgrade path, and premium newsletter subscriptions. Combined potential of $3,000-$5,000+/month. Keep 100% of all revenue.',
  alternates: { canonical: `${SITE_URL}/features` },
  openGraph: {
    title: 'Newsroom AIOS Features - Three Revenue Streams, One Platform',
    description:
      'AI-powered advertising, business directory, and newsletter subscriptions. Built-in monetization from day one.',
    url: `${SITE_URL}/features`,
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = [
    createBreadcrumbJsonLd([
      { name: 'Home', url: SITE_URL },
      { name: 'Features', url: `${SITE_URL}/features` },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'AI-powered platform for launching and managing local community newspapers with built-in advertising, business directory, and subscription revenue streams.',
      featureList: [
        'AI-powered article generation with multiple AI journalist personas',
        'Automated advertising platform with AI banner generation',
        'CPC, CPM, and flat-rate ad pricing models',
        'Real-time advertising analytics and reporting',
        'Local business directory with free and featured tiers',
        'Business claim and verify system',
        'Premium newsletter subscriptions with paywall',
        'Automated email campaigns with AI-curated content',
        'Subscriber analytics and engagement tracking',
        'Custom domain with SSL and CDN',
        'Text-to-speech article narration',
        'SEO-optimized newspaper websites',
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
