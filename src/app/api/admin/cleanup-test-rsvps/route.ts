import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { logAdminAction } from '../../../../lib/adminAudit';

/**
 * DELETE test RSVPs created by E2E tests.
 * Only deletes RSVPs where email matches test patterns (playwright, e2e, test+).
 * This preserves real guest data while cleaning up test pollution.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { password, dryRun } = body as { password?: string; dryRun?: boolean };
    
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Find test RSVPs by email patterns commonly used in tests
    const testPatterns = [
      '%playwright%',
      '%e2e%',
      '%test+%',
      '%auditui+%',
      '%edittest+%',
      '%dupauto+%',
      '%resend+%',
      '%test401+%',
      '%auditsec+%',
      '%unverified+%',
      '%change+%',
      '%alt+%',
    ];

    // Build OR query for all patterns
    let query = supabaseServer.from('rsvps').select('id, email, first_name, last_name, created_at');
    
    // Use ilike for each pattern
    const { data: testRsvps, error: findError } = await supabaseServer
      .from('rsvps')
      .select('id, email, first_name, last_name, created_at')
      .or(testPatterns.map(p => `email.ilike.${p}`).join(','));

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    const found = testRsvps || [];
    
    if (dryRun) {
      return NextResponse.json({ 
        ok: true, 
        dryRun: true, 
        wouldDelete: found.length,
        samples: found.slice(0, 10).map(r => ({ id: r.id, email: r.email, name: `${r.first_name} ${r.last_name}` }))
      });
    }

    if (found.length === 0) {
      return NextResponse.json({ ok: true, deleted: 0, message: 'No test RSVPs found' });
    }

    const ids = found.map(r => r.id);
    
    // Delete the test RSVPs
    const { error: deleteError } = await supabaseServer
      .from('rsvps')
      .delete()
      .in('id', ids);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Audit log
    const adminEmail = process.env.ADMIN_EMAIL || 'admin';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    const deviceId = req.headers.get('x-device-id') || null;
    await logAdminAction({
      adminEmail,
      action: 'cleanup-test-rsvps',
      targetTable: 'rsvps',
      targetId: 'TEST_DATA',
      before: { count: found.length, emails: found.map(r => r.email) },
      after: null,
      ip,
      deviceId
    });

    return NextResponse.json({ 
      ok: true, 
      deleted: found.length,
      emails: found.map(r => r.email)
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
