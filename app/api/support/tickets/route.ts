import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyPlatformSecret } from '@/lib/platformAuth';
import { generateFirstResponse, generateAutopilotResponse } from '@/lib/supportAI';

// AI Support Assistant identity — displayed on AI-generated messages
const AI_ASSISTANT_NAME = 'Marge';
const AI_ASSISTANT_PHOTO = 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0242565142.firebasestorage.app/o/avatars%2F5bacf02c-2f6d-4651-8cf0-5b23c0f01996%2F1767633685245_Screenshot_20251231_075714_Samsung%20Wallet.jpg?alt=media&token=c81d6723-8160-47fd-93cd-6d7b0eee7dbe';

// CORS headers for tenant domains
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key, X-Platform-Secret',
  'Access-Control-Max-Age': '86400',
};

/**
 * OPTIONS /api/support/tickets
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

/**
 * Authenticate request — supports platform secret OR tenant API key
 */
async function authenticateRequest(request: NextRequest): Promise<{
  valid: boolean;
  isPlatformAdmin: boolean;
  tenantId?: string;
  tenantName?: string;
  error?: string;
}> {
  const db = getAdminDb();
  if (!db) return { valid: false, isPlatformAdmin: false, error: 'Database not configured' };

  const platformSecret = request.headers.get('x-platform-secret');
  const tenantId = request.headers.get('x-tenant-id');
  const apiKey = request.headers.get('x-api-key');

  // Platform admin auth
  if (platformSecret) {
    if (!verifyPlatformSecret(request)) {
      return { valid: false, isPlatformAdmin: false, error: 'Invalid platform secret' };
    }
    // Platform admin can optionally scope to a tenant
    if (tenantId) {
      const tenantDoc = await db.collection('tenants').doc(tenantId).get();
      return {
        valid: true,
        isPlatformAdmin: true,
        tenantId,
        tenantName: tenantDoc.exists ? (tenantDoc.data()?.businessName || tenantId) : tenantId,
      };
    }
    return { valid: true, isPlatformAdmin: true };
  }

  // Tenant API key auth
  if (tenantId && apiKey) {
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return { valid: false, isPlatformAdmin: false, error: 'Tenant not found' };
    }
    const tenantData = tenantDoc.data()!;
    if (tenantData.apiKey !== apiKey) {
      return { valid: false, isPlatformAdmin: false, error: 'Invalid API key' };
    }
    return {
      valid: true,
      isPlatformAdmin: false,
      tenantId,
      tenantName: tenantData.businessName || tenantId,
    };
  }

  return { valid: false, isPlatformAdmin: false, error: 'Authentication required' };
}

/**
 * GET /api/support/tickets
 * List tickets — tenant sees own tickets, platform admin sees all
 * Query params: status, priority, search, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401, headers: CORS_HEADERS });
    }

    const db = getAdminDb()!;
    const params = request.nextUrl.searchParams;
    const status = params.get('status');
    const priority = params.get('priority');
    const search = params.get('search');
    const ticketId = params.get('id');
    const limit = Math.min(parseInt(params.get('limit') || '50'), 100);

    // Single ticket fetch
    if (ticketId) {
      const ticketDoc = await db.collection('supportTickets').doc(ticketId).get();
      if (!ticketDoc.exists) {
        return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404, headers: CORS_HEADERS });
      }
      const ticketData = ticketDoc.data()!;

      // Tenant can only see own tickets
      if (!auth.isPlatformAdmin && ticketData.tenantId !== auth.tenantId) {
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403, headers: CORS_HEADERS });
      }

      // Fetch messages subcollection
      const messagesSnap = await db.collection('supportTickets').doc(ticketId)
        .collection('messages').orderBy('createdAt', 'asc').get();
      const messages = messagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      return NextResponse.json({
        success: true,
        ticket: { id: ticketDoc.id, ...ticketData },
        messages,
      }, { headers: CORS_HEADERS });
    }

    // List tickets — use simple query + client-side sort to avoid composite index requirements
    let q: FirebaseFirestore.Query = db.collection('supportTickets');

    // Tenant scoping — tenants only see their own tickets
    if (!auth.isPlatformAdmin) {
      q = q.where('tenantId', '==', auth.tenantId);
    } else if (params.get('tenantId')) {
      q = q.where('tenantId', '==', params.get('tenantId'));
    }

    if (status && status !== 'all') {
      q = q.where('status', '==', status);
    }
    if (priority && priority !== 'all') {
      q = q.where('priority', '==', priority);
    }

    const snapshot = await q.get();

    let tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort client-side (avoids needing composite indexes for every filter combo)
    tickets.sort((a: any, b: any) => {
      const aTime = a.createdAt?._seconds || a.createdAt?.seconds || 0;
      const bTime = b.createdAt?._seconds || b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    // Apply limit after sort
    tickets = tickets.slice(0, limit);

    // Client-side search filter (Firestore doesn't support full-text search)
    if (search) {
      const searchLower = search.toLowerCase();
      tickets = tickets.filter((t: any) =>
        t.subject?.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.tenantName?.toLowerCase().includes(searchLower) ||
        t.reporterName?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ success: true, tickets, total: tickets.length }, { headers: CORS_HEADERS });

  } catch (error: unknown) {
    console.error('[Support] GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch tickets' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /api/support/tickets
 * Create a new ticket (from tenant admin)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const { subject, description, category, priority, type, reporterUid, reporterName,
            reporterEmail, reporterPhoto, reporterRole, diagnostics, platformVersion } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { success: false, error: 'Subject and description are required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const db = getAdminDb()!;
    const now = new Date();

    const ticketData: Record<string, any> = {
      tenantId: auth.tenantId || body.tenantId,
      tenantName: auth.tenantName || body.tenantName || '',
      subject: subject.trim(),
      description: description.trim(),
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      type: type || 'support',
      reporterUid: reporterUid || '',
      reporterName: reporterName || '',
      reporterEmail: reporterEmail || '',
      reporterPhoto: reporterPhoto || '',
      reporterRole: reporterRole || '',
      assignedTo: '',
      assignedName: '',
      platformVersion: platformVersion || '',
      messageCount: 1, // Initial description counts as first message
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    };

    if (diagnostics) {
      ticketData.diagnostics = {
        url: diagnostics.url || '',
        browser: diagnostics.browser || '',
        consoleErrors: diagnostics.consoleErrors || [],
        timestamp: diagnostics.timestamp || now.toISOString(),
        errorMessage: diagnostics.errorMessage || '',
      };
    }

    // Create ticket
    const ticketRef = await db.collection('supportTickets').add(ticketData);

    // Add initial message (the description)
    await ticketRef.collection('messages').add({
      content: description.trim(),
      senderType: 'user',
      senderName: reporterName || '',
      senderEmail: reporterEmail || '',
      senderPhoto: reporterPhoto || '',
      attachments: diagnostics ? [{
        type: 'diagnostics',
        data: ticketData.diagnostics,
      }] : [],
      createdAt: now,
    });

    // AI triage + first response
    const { response: aiResponse, triage } = await generateFirstResponse(
      subject,
      description,
      category || 'general',
      auth.tenantName || '',
      diagnostics || undefined
    );

    if (aiResponse) {
      await ticketRef.collection('messages').add({
        content: aiResponse,
        senderType: 'ai',
        senderName: AI_ASSISTANT_NAME,
        senderEmail: '',
        senderPhoto: AI_ASSISTANT_PHOTO,
        attachments: [],
        createdAt: new Date(),
      });

      const triageUpdates: Record<string, any> = {
        messageCount: 2,
        lastMessageAt: new Date(),
      };

      // Apply triage results if high confidence
      if (triage) {
        triageUpdates.aiClassification = triage.classification;
        triageUpdates.aiConfidence = triage.confidence;
        triageUpdates.aiMatchedKnowledge = triage.matchedKnowledge;

        // Auto-set status for high-confidence non-issues and how-to's
        if (triage.confidence === 'high' && ['non_issue', 'how_to', 'known_issue'].includes(triage.classification)) {
          triageUpdates.status = triage.suggestedStatus || 'waiting';
        }

        // Auto-set priority based on triage
        if (triage.confidence !== 'low') {
          triageUpdates.priority = triage.suggestedPriority;
        }

        // Flag for escalation
        if (triage.escalate) {
          triageUpdates.needsEscalation = true;
        }
      }

      await ticketRef.update(triageUpdates);
    }

    return NextResponse.json({
      success: true,
      ticketId: ticketRef.id,
      aiResponse: aiResponse || null,
      triage: triage ? {
        classification: triage.classification,
        confidence: triage.confidence,
        escalate: triage.escalate,
      } : null,
    }, { status: 201, headers: CORS_HEADERS });

  } catch (error: unknown) {
    console.error('[Support] POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create ticket' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * PATCH /api/support/tickets
 * Update ticket — add message, change status/priority/assignment
 * Body: { ticketId, action, ... }
 *   action: 'reply' | 'update_status' | 'assign' | 'escalate' | 'update_priority' | 'upvote'
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const { ticketId, action } = body;

    if (!ticketId || !action) {
      return NextResponse.json(
        { success: false, error: 'ticketId and action are required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const db = getAdminDb()!;
    const ticketRef = db.collection('supportTickets').doc(ticketId);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404, headers: CORS_HEADERS });
    }

    const ticketData = ticketDoc.data()!;

    // Tenant can only modify own tickets (reply only)
    if (!auth.isPlatformAdmin && ticketData.tenantId !== auth.tenantId) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403, headers: CORS_HEADERS });
    }

    const now = new Date();
    const updates: Record<string, any> = { updatedAt: now };

    switch (action) {
      case 'reply': {
        const { content, senderType, senderName, senderEmail, senderPhoto, attachments } = body;
        if (!content) {
          return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400, headers: CORS_HEADERS });
        }

        // Tenants can only send 'user' type messages
        const resolvedSenderType = auth.isPlatformAdmin ? (senderType || 'admin') : 'user';

        await ticketRef.collection('messages').add({
          content: content.trim(),
          senderType: resolvedSenderType,
          senderName: senderName || '',
          senderEmail: senderEmail || '',
          senderPhoto: senderPhoto || '',
          attachments: attachments || [],
          createdAt: now,
        });

        updates.messageCount = (ticketData.messageCount || 0) + 1;
        updates.lastMessageAt = now;

        // Platform admin reply auto-sets status to 'in-progress' if it was 'open'
        if (auth.isPlatformAdmin && ticketData.status === 'open') {
          updates.status = 'in-progress';
        }

        // Autopilot: when a TENANT sends a message and mode is 'autopilot', AI responds
        if (!auth.isPlatformAdmin && resolvedSenderType === 'user') {
          try {
            const statusDoc = await db.collection('platformConfig').doc('supportStatus').get();
            const statusData = statusDoc.exists ? statusDoc.data()! : {};
            const mode = statusData.mode || (statusData.online ? 'online' : 'offline');

            if (mode === 'autopilot') {
              // Check if admin is busy with a different ticket
              const adminBusy = !!(statusData.activeTicketId && statusData.activeTicketId !== ticketId);

              // Get recent conversation for context
              const recentMsgs = await ticketRef.collection('messages')
                .orderBy('createdAt', 'asc').limitToLast(8).get();
              const history = recentMsgs.docs.map(d => {
                const m = d.data();
                return { role: m.senderType as string, content: m.content as string };
              });

              const aiReply = await generateAutopilotResponse(
                ticketData.tenantName || '',
                ticketData.subject || '',
                content.trim(),
                history,
                adminBusy
              );

              if (aiReply) {
                await ticketRef.collection('messages').add({
                  content: aiReply,
                  senderType: 'ai',
                  senderName: AI_ASSISTANT_NAME,
                  senderEmail: '',
                  senderPhoto: AI_ASSISTANT_PHOTO,
                  attachments: [],
                  createdAt: new Date(),
                });
                updates.messageCount = (updates.messageCount || 0) + 1;
                updates.lastMessageAt = new Date();
              }
            }
          } catch (aiErr) {
            console.error('[Support] Autopilot AI response failed (non-blocking):', aiErr);
          }
        }
        break;
      }

      case 'update_status': {
        if (!auth.isPlatformAdmin && !['open', 'closed'].includes(body.status)) {
          return NextResponse.json({ success: false, error: 'Tenants can only reopen or close tickets' }, { status: 403, headers: CORS_HEADERS });
        }
        updates.status = body.status;
        if (body.status === 'resolved') updates.resolvedAt = now;
        if (body.status === 'closed') updates.closedAt = now;
        break;
      }

      case 'assign': {
        if (!auth.isPlatformAdmin) {
          return NextResponse.json({ success: false, error: 'Only platform admins can assign tickets' }, { status: 403, headers: CORS_HEADERS });
        }
        updates.assignedTo = body.assignedTo || '';
        updates.assignedName = body.assignedName || '';
        if (ticketData.status === 'open') updates.status = 'in-progress';
        break;
      }

      case 'escalate': {
        if (!auth.isPlatformAdmin) {
          return NextResponse.json({ success: false, error: 'Only platform admins can escalate' }, { status: 403, headers: CORS_HEADERS });
        }
        updates.priority = 'urgent';
        if (ticketData.status === 'open') updates.status = 'in-progress';
        break;
      }

      case 'update_priority': {
        if (!auth.isPlatformAdmin) {
          return NextResponse.json({ success: false, error: 'Only platform admins can change priority' }, { status: 403, headers: CORS_HEADERS });
        }
        updates.priority = body.priority;
        break;
      }

      case 'upvote': {
        const currentUpvotes = ticketData.upvotes || 0;
        const upvotedBy: string[] = ticketData.upvotedBy || [];
        const voterId = auth.tenantId || 'anonymous';

        if (upvotedBy.includes(voterId)) {
          return NextResponse.json({ success: false, error: 'Already voted' }, { status: 400, headers: CORS_HEADERS });
        }

        updates.upvotes = currentUpvotes + 1;
        updates.upvotedBy = [...upvotedBy, voterId];
        break;
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400, headers: CORS_HEADERS });
    }

    await ticketRef.update(updates);

    return NextResponse.json({ success: true, updates }, { headers: CORS_HEADERS });

  } catch (error: unknown) {
    console.error('[Support] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update ticket' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * DELETE /api/support/tickets?id=ticketId
 * Delete a ticket and its messages. Platform admin only.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.valid || !auth.isPlatformAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    const ticketId = request.nextUrl.searchParams.get('id');
    if (!ticketId) {
      return NextResponse.json({ success: false, error: 'Ticket ID required' }, { status: 400, headers: CORS_HEADERS });
    }

    const db = getAdminDb()!;
    const ticketRef = db.collection('supportTickets').doc(ticketId);

    // Delete messages subcollection first
    const messagesSnap = await ticketRef.collection('messages').get();
    const batch = db.batch();
    messagesSnap.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(ticketRef);
    await batch.commit();

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });

  } catch (error: unknown) {
    console.error('[Support] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete ticket' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
