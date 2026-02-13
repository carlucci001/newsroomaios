import Link from 'next/link';
import { blogPosts } from '@/data/blog-posts';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-brand-blue-50 text-brand-blue-700 mb-4">
            Blog
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Insights for Community Publishers
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Guides, strategies, and deep dives on launching and growing a
            profitable local newspaper with AI-powered tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block bg-white rounded-xl border border-border/60 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-blue-50 text-brand-blue-700">
                    {post.category}
                  </span>
                  <span className="text-xs text-foreground/50">
                    {post.readTime}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-brand-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-sm text-foreground/60 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-foreground/50">
                  <span>{post.author}</span>
                  <span>·</span>
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
