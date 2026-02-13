export const SITE_URL = 'https://newsroomaios.com';
export const SITE_NAME = 'Newsroom AIOS';
export const SITE_DESCRIPTION =
  'AI-powered platform for launching and managing local community newspapers with built-in advertising, business directory, and subscription revenue streams.';
export const BUSINESS_NAME = 'Farrington Development LLC';
export const SUPPORT_EMAIL = 'support@newsroomaios.com';

export const DEFAULT_OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Newsroom AIOS - AI-Powered Local Newspaper Platform',
};

export function createBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/newsroom-logo.png`,
    description: SITE_DESCRIPTION,
    foundingDate: '2025',
    parentOrganization: {
      '@type': 'Organization',
      name: BUSINESS_NAME,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: SUPPORT_EMAIL,
      contactType: 'customer support',
    },
  };
}

export function getWebApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: SITE_DESCRIPTION,
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '99',
      highPrice: '299',
      priceCurrency: 'USD',
      offerCount: 3,
    },
    featureList: [
      'AI-powered article generation',
      'Automated advertising platform',
      'Local business directory',
      'Newsletter subscription management',
      'AI journalist personas',
      'Revenue analytics dashboard',
      'Custom domain support',
      'SEO-optimized newspaper websites',
    ],
  };
}

export function getArticleJsonLd(article: {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    url: article.url,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/newsroom-logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };
}

export function getFaqJsonLd(
  faqs: { question: string; answer: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
