import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

/**
 * GET /api/stripe/invoices?tenantId={id}
 *
 * Returns the 10 most recent invoices for a tenant.
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const snap = await db.collection('invoices')
      .where('tenantId', '==', tenantId)
      .orderBy('paidAt', 'desc')
      .limit(10)
      .get();

    const invoices = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        amountPaid: data.amountPaid || 0,
        status: data.status || 'unknown',
        paidAt: data.paidAt?.toDate?.()?.toISOString() || data.paidAt || null,
        hostedInvoiceUrl: data.hostedInvoiceUrl || null,
      };
    });

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('[Invoices] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
