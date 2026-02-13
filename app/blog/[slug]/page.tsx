import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, getBlogPost } from '@/data/blog-posts';
import { SITE_URL, SITE_NAME, getArticleJsonLd, createBreadcrumbJsonLd } from '@/lib/seo';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      images: [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const articleJsonLd = getArticleJsonLd({
    title: post.title,
    description: post.excerpt,
    url: `${SITE_URL}/blog/${post.slug}`,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: post.author,
  });

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: 'Blog', url: `${SITE_URL}/blog` },
    { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([articleJsonLd, breadcrumbJsonLd]) }}
      />
      <SiteHeader />

      <article className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-sm text-brand-blue-600 hover:text-brand-blue-700 transition-colors"
          >
            &larr; Back to Blog
          </Link>
        </div>

        <header className="mb-10">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-brand-blue-50 text-brand-blue-700 mb-4">
            {post.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/60">
            <span>{post.author}</span>
            <span>·</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </header>

        <div className="rounded-xl overflow-hidden mb-10 aspect-[16/9]">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div
          className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-brand-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-16 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-foreground/60"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">
            Ready to Launch Your Community Newspaper?
          </h2>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">
            Join the growing network of AI-powered local newspapers. Launch in
            30 minutes with everything you need built in.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-6 py-3 rounded-lg bg-white text-brand-blue-700 font-semibold hover:bg-blue-50 transition-colors"
          >
            See Plans &amp; Pricing
          </Link>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
