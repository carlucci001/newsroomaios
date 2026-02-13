import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

const RESERVED_SLUGS = [
  'www', 'api', 'admin', 'mail', 'app', 'platform',
  'help', 'support', 'status', 'docs', 'blog', 'news',
];

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
  }

  // Validate slug format: lowercase alphanumeric only, no hyphens
  if (slug.length < 3 || slug.length > 30 || !/^[a-z0-9]+$/.test(slug)) {
    return NextResponse.json(
      { available: false, error: 'Invalid format: 3-30 lowercase letters and numbers only' },
      { status: 400 }
    );
  }

  if (RESERVED_SLUGS.includes(slug)) {
    return NextResponse.json(
      { available: false, error: 'This name is reserved' },
      { status: 400 }
    );
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const existing = await db.collection('tenants').where('slug', '==', slug).get();

  return NextResponse.json({
    available: existing.empty,
    slug,
    subdomain: `${slug}.newsroomaios.com`,
  });
}
