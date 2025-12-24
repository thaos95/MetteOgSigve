import { supabaseServer } from './supabaseServer';

export type AuditEntry = {
  adminEmail: string;
  action: string;
  targetTable?: string;
  targetId?: string;
  before?: any;
  after?: any;
  ip?: string | null;
  deviceId?: string | null;
  metadata?: any;
};

export async function logAdminAction(entry: AuditEntry) {
  const {
    adminEmail,
    action,
    targetTable = null,
    targetId = null,
    before = null,
    after = null,
    ip = null,
    deviceId = null,
    metadata = null,
  } = entry;

  if (!adminEmail) {
    console.warn('logAdminAction called without adminEmail');
  }

  const payload = {
    admin_email: adminEmail,
    action,
    target_table: targetTable,
    target_id: targetId,
    before: before ? JSON.stringify(before) : null,
    after: after ? JSON.stringify(after) : null,
    ip,
    device_id: deviceId,
    metadata,
  };

  const { error } = await supabaseServer.from('admin_audit_logs').insert([payload]);
  if (error) {
    console.error('Failed to write admin audit log:', error);
    return { ok: false, error };
  }
  return { ok: true };
}
