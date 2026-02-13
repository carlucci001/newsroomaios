import { Metadata } from 'next';
import { SITE_URL, SITE_NAME, createBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Pricing Plans - Starter $99/mo, Growth $199/mo, Professional $299/mo',
  description:
    'Transparent newspaper platform pricing with no revenue sharing. Starter $99/mo, Growth $199/mo (most popular), Professional $299/mo. $199 one-time setup includes 36 AI articles, 100 directory listings, and complete business setup. Keep 100% of all revenue you earn.',
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    title: 'Newsroom AIOS Pricing - Keep 100% of Your Revenue',
    description:
      'No hidden fees. No revenue sharing. Plans from $99/mo. $199 one-time setup gets you a complete newspaper business.',
    url: `${SITE_URL}/pricing`,
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = [
    createBreadcrumbJsonLd([
      { name: 'Home', url: SITE_URL },
      { name: 'Pricing', url: `${SITE_URL}/pricing` },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${SITE_NAME} Starter Plan`,
      description:
        'AI-powered newspaper platform for getting started. 1 AI journalist, 50 articles/month, basic advertising, 25 directory listings.',
      brand: { '@type': 'Brand', name: SITE_NAME },
      offers: {
        '@type': 'Offer',
        price: '99',
        priceCurrency: 'USD',
        priceValidUntil: '2027-12-31',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/pricing`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${SITE_NAME} Growth Plan`,
      description:
        'Most popular plan. 3 AI journalists, 115 articles/month, advanced advertising with CPC/CPM, unlimited directory listings, custom branding.',
      brand: { '@type': 'Brand', name: SITE_NAME },
      offers: {
        '@type': 'Offer',
        price: '199',
        priceCurrency: 'USD',
        priceValidUntil: '2027-12-31',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/pricing`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${SITE_NAME} Professional Plan`,
      description:
        'For high-volume publishers. 6 AI journalists, 200 articles/month, full analytics, AI banner generation, unlimited directory listings, dedicated support.',
      brand: { '@type': 'Brand', name: SITE_NAME },
      offers: {
        '@type': 'Offer',
        price: '299',
        priceCurrency: 'USD',
        priceValidUntil: '2027-12-31',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/pricing`,
      },
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
