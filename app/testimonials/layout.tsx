import { Metadata } from 'next';
import { SITE_URL, createBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Revenue Potential & Success Stories - Publisher Earnings',
  description:
    'Explore the revenue potential of running an AI-powered local newspaper. Three revenue streams — advertising, business directory, and subscriptions — with combined potential of $3,000-$5,000+/month ($40-60K/year).',
  alternates: { canonical: `${SITE_URL}/testimonials` },
  openGraph: {
    title: 'Newsroom AIOS Revenue Potential - $40-60K/Year',
    description:
      'Three revenue streams. Combined potential of $3,000-$5,000+ per month for local newspaper publishers.',
    url: `${SITE_URL}/testimonials`,
  },
};

export default function TestimonialsLayout({
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
              { name: 'Success Stories', url: `${SITE_URL}/testimonials` },
            ])
          ),
        }}
      />
      {children}
    </>
  );
}
