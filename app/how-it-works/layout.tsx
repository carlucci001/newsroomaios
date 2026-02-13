import { Metadata } from 'next';
import { SITE_URL, createBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How It Works - Launch Your Newspaper in 3 Simple Steps',
  description:
    'Go from idea to published newspaper in under 30 minutes. Step 1: Choose your domain. Step 2: Configure AI content with journalist personas. Step 3: Start publishing and earning from ads, directory, and subscriptions. No technical skills required.',
  alternates: { canonical: `${SITE_URL}/how-it-works` },
  openGraph: {
    title: 'How Newsroom AIOS Works - 3 Steps to Your Own Newspaper',
    description:
      'Launch a fully monetized local newspaper in under 30 minutes. Choose domain, configure AI, start earning.',
    url: `${SITE_URL}/how-it-works`,
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = [
    createBreadcrumbJsonLd([
      { name: 'Home', url: SITE_URL },
      { name: 'How It Works', url: `${SITE_URL}/how-it-works` },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Launch a Local Newspaper with Newsroom AIOS',
      description:
        'Go from idea to published newspaper in under 30 minutes with AI-powered tools.',
      totalTime: 'PT30M',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Choose Your Domain',
          text: 'Select your newspaper name and custom domain. Newsroom AIOS handles SSL certificates, CDN acceleration, and all technical setup automatically.',
          url: `${SITE_URL}/how-it-works`,
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'AI Content Setup',
          text: 'Configure your AI journalists, select content categories from 40+ options, and define your editorial voice and publishing schedule.',
          url: `${SITE_URL}/how-it-works`,
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Start Publishing and Earning',
          text: 'Activate advertising, business directory, and subscription revenue streams. Publish your first AI-generated articles and start growing your audience.',
          url: `${SITE_URL}/how-it-works`,
        },
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
