import { createAdminClient } from "@/lib/supabase/admin";

export type AuditOperation = "created" | "updated" | "deleted";

export interface AuditLogEntry {
  user_id: string;
  operation: AuditOperation;
  table_name: string;
  record_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
}

/**
 * Log an action to the audit_logs table
 * @param entry - The audit log entry to record
 * @returns Promise that resolves when logged
 */
export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createAdminClient();

    const auditLogsTable = supabase.from("audit_logs") as any;

    const { error } = await auditLogsTable.insert({
      user_id: entry.user_id,
      operation: entry.operation,
      table_name: entry.table_name,
      record_id: entry.record_id,
      old_values: entry.old_values || null,
      new_values: entry.new_values || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to log audit action:", error);
      // Don't throw - audit logging failure shouldn't block the operation
    }
  } catch (error) {
    console.error("Audit logging error:", error);
    // Silently fail - audit logging is non-critical
  }
}

/**
 * Log multiple audit actions in batch
 */
export async function logAuditActionsBatch(entries: AuditLogEntry[]): Promise<void> {
  try {
    const supabase = await createAdminClient();

    const logsToInsert = entries.map((entry) => ({
      user_id: entry.user_id,
      operation: entry.operation,
      table_name: entry.table_name,
      record_id: entry.record_id,
      old_values: entry.old_values || null,
      new_values: entry.new_values || null,
      created_at: new Date().toISOString(),
    }));

    const auditLogsTable = supabase.from("audit_logs") as any;
    const { error } = await auditLogsTable.insert(logsToInsert);

    if (error) {
      console.error("Failed to log audit actions batch:", error);
    }
  } catch (error) {
    console.error("Audit logging batch error:", error);
  }
}
