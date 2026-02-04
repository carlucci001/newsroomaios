import { getDb } from '@/lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { Tenant, NewsCategory } from '@/types/tenant';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryName: string;
  categorySlug: string;
  publishedAt: Date;
  author: string;
  imageUrl?: string;
}

async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const db = getDb();
  const tenantsQuery = query(
    collection(db, 'tenants'),
    where('slug', '==', slug),
    limit(1)
  );
  const snap = await getDocs(tenantsQuery);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Tenant;
}

async function getArticlesByCategory(tenantId: string, categorySlug: string): Promise<Article[]> {
  const db = getDb();
  // Fetch articles and filter by category in memory to avoid composite index requirement
  const articlesQuery = query(
    collection(db, `tenants/${tenantId}/articles`),
    limit(100)
  );
  const snap = await getDocs(articlesQuery);

  const articles = snap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        categoryName: data.categoryName,
        categorySlug: data.categorySlug,
        publishedAt: data.publishedAt?.toDate?.() || new Date(),
        author: data.author,
        status: data.status,
        imageUrl: data.imageUrl || data.featuredImage,
      };
    })
    .filter(a => a.status === 'published' && a.categorySlug === categorySlug)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, 30);

  return articles as Article[];
}

function getCategoryInfo(tenant: Tenant, categorySlug: string): NewsCategory | null {
  return tenant.categories.find(c => c.slug === categorySlug) || null;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string; categorySlug: string }>;
}) {
  const { slug, categorySlug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    notFound();
  }

  const category = getCategoryInfo(tenant, categorySlug);
  if (!category) {
    notFound();
  }

  const articles = await getArticlesByCategory(tenant.id, categorySlug);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href={`/${tenant.slug}`} className="text-3xl font-bold text-gray-900 hover:text-blue-600">
            {tenant.businessName}
          </Link>
          <p className="text-gray-500 mt-1">
            Serving {tenant.serviceArea.city}, {tenant.serviceArea.state}
          </p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-6 overflow-x-auto">
          {tenant.categories.filter(c => c.enabled).map((cat) => (
            <Link
              key={cat.id}
              href={`/${tenant.slug}/${cat.slug}`}
              className={`text-sm font-medium whitespace-nowrap ${
                cat.slug === categorySlug
                  ? 'text-blue-400 border-b-2 border-blue-400 pb-1'
                  : 'hover:text-blue-300'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Category Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href={`/${tenant.slug}`} className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <span className="text-gray-900">{category.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
          {category.directive && (
            <p className="text-gray-600 mt-2 max-w-2xl">{category.directive}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <h2 className="text-xl font-semibold text-gray-700">No Articles Yet</h2>
            <p className="text-gray-500 mt-2">
              Articles for {category.name} are being generated. Check back soon!
            </p>
            <Link
              href={`/${tenant.slug}`}
              className="inline-block mt-4 text-blue-600 hover:underline"
            >
              &larr; Back to Home
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-500 mb-6">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {article.imageUrl && (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      {article.categoryName}
                    </span>
                    <h2 className="mt-2 text-lg font-bold text-gray-900 line-clamp-2">
                      <Link href={`/${tenant.slug}/article/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-gray-600 text-sm line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>{article.author}</span>
                      <time>
                        {article.publishedAt.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {tenant.businessName}. All rights reserved.</p>
          <p className="mt-2">
            Powered by{' '}
            <a href="https://newsroomaios.com" className="text-blue-400 hover:underline">
              Newsroom AIOS
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
