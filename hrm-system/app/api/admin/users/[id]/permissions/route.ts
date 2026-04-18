import { withAuth, getUserContext, AuthenticatedRequest } from "@/app/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { isPermissionKey, PERMISSION_KEYS, PermissionKey } from "@/lib/permissions";

async function getHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!["admin", "super_admin"].includes(req.userRole || "")) {
      return sendErrorResponse(Errors.FORBIDDEN("Only admins can view permissions"));
    }

    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return sendErrorResponse(Errors.NOT_FOUND("User"));
    }

    const { data: rows, error } = await supabase
      .from("user_permissions")
      .select("permission_key, granted_at, granted_by")
      .eq("user_id", id)
      .is("revoked_at", null);

    if (error) {
      return sendErrorResponse(error);
    }

    const granted = (rows ?? [])
      .map((r: any) => r.permission_key as string)
      .filter(isPermissionKey);

    return sendSuccessResponse({
      user: profile,
      availablePermissions: PERMISSION_KEYS,
      grantedPermissions: granted,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to fetch permissions"
      )
    );
  }
}

async function putHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!["admin", "super_admin"].includes(req.userRole || "")) {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only admins can modify permissions")
      );
    }

    const { id } = await params;
    const { userId: actorId } = getUserContext(req);
    const body = (await req.json()) as { permissions?: unknown };

    if (!Array.isArray(body.permissions)) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("`permissions` must be an array of permission keys")
      );
    }

    const requested: PermissionKey[] = [];
    for (const key of body.permissions) {
      if (typeof key !== "string" || !isPermissionKey(key)) {
        return sendErrorResponse(
          Errors.VALIDATION_ERROR(`Unknown permission key: ${String(key)}`)
        );
      }
      if (!requested.includes(key)) requested.push(key);
    }

    const supabase = await createAdminClient();

    // Target must exist and must not already be a full admin (those grants are redundant).
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", id)
      .single();

    if (!profile) {
      return sendErrorResponse(Errors.NOT_FOUND("User"));
    }

    const targetRole = (profile as { role: string }).role;
    if (targetRole === "admin" || targetRole === "super_admin") {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR(
          "Admins and super-admins already have full access; grants are unnecessary."
        )
      );
    }

    // Load current active grants so we can diff.
    const { data: currentRows } = await supabase
      .from("user_permissions")
      .select("permission_key")
      .eq("user_id", id)
      .is("revoked_at", null);

    const current = new Set<PermissionKey>(
      ((currentRows ?? []) as { permission_key: string }[])
        .map((r) => r.permission_key)
        .filter(isPermissionKey)
    );
    const next = new Set<PermissionKey>(requested);

    const toAdd = [...next].filter((k) => !current.has(k));
    const toRevoke = [...current].filter((k) => !next.has(k));

    const now = new Date().toISOString();

    const db = supabase as any;

    if (toRevoke.length > 0) {
      const { error: revokeError } = await db
        .from("user_permissions")
        .update({ revoked_at: now, updated_at: now })
        .eq("user_id", id)
        .is("revoked_at", null)
        .in("permission_key", toRevoke);
      if (revokeError) return sendErrorResponse(revokeError);
    }

    if (toAdd.length > 0) {
      const rows = toAdd.map((key) => ({
        user_id: id,
        permission_key: key,
        granted_by: actorId,
      }));
      const { error: insertError } = await db
        .from("user_permissions")
        .insert(rows);
      if (insertError) return sendErrorResponse(insertError);
    }

    if (toAdd.length > 0 || toRevoke.length > 0) {
      await logAuditAction({
        user_id: actorId,
        operation: "updated",
        table_name: "user_permissions",
        record_id: id,
        old_values: { permissions: [...current] },
        new_values: { permissions: [...next] },
      });
    }

    return sendSuccessResponse({
      grantedPermissions: [...next],
      added: toAdd,
      revoked: toRevoke,
    });
  } catch (error) {
    console.error("Error updating permissions:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to update permissions"
      )
    );
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
