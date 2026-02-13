import { Metadata } from 'next';
import { SITE_URL, SITE_NAME, createBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Blog — Community Newspaper Insights & Platform Updates',
  description:
    'Expert guides on launching a local newspaper, AI-powered journalism, advertising revenue, business directories, and community news strategies. From the team behind Newsroom AIOS.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: `Blog | ${SITE_NAME}`,
    description:
      'Guides, strategies, and insights for launching and growing a profitable community newspaper with AI-powered tools.',
    url: `${SITE_URL}/blog`,
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: 'Blog', url: `${SITE_URL}/blog` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
