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

    let invoices: any[] = [];
    try {
      const snap = await db.collection('invoices')
        .where('tenantId', '==', tenantId)
        .orderBy('paidAt', 'desc')
        .limit(10)
        .get();

      invoices = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amountPaid: data.amountPaid || 0,
          status: data.status || 'unknown',
          paidAt: data.paidAt?.toDate?.()?.toISOString() || data.paidAt || null,
          hostedInvoiceUrl: data.hostedInvoiceUrl || null,
        };
      });
    } catch (queryErr: any) {
      // Index may not exist yet if no invoices have been created
      console.warn('[Invoices] Query failed (likely missing index):', queryErr.message);
    }

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('[Invoices] Error:', error.message);
    return NextResponse.json({ invoices: [] });
  }
}
