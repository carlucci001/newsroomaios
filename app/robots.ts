import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/', '/onboarding'],
      },
    ],
    sitemap: 'https://newsroomaios.com/sitemap.xml',
  }
}
