import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPermission, PermissionKey } from "@/lib/permissions";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.split(".")[0] || "jwt-secret"
);

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

/**
 * Middleware to authenticate and authorize API requests
 * Extracts and validates JWT token from Authorization header
 * Attaches user info to request for handler use
 */
export function withAuth<T extends unknown[]>(
  handler: (req: AuthenticatedRequest, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({
            error: true,
            code: "UNAUTHORIZED",
            message: "Missing or invalid authorization token",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.substring(7);

      // Verify JWT token using Supabase's JWT secret
      let payload: any;
      try {
        const verified = await jwtVerify(
          token,
          new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET || "your-secret")
        );
        payload = verified.payload;
      } catch (jwtError) {
        // If JWT verification fails, try to get user from Supabase
        const supabase = await createAdminClient();
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
          return new Response(
            JSON.stringify({
              error: true,
              code: "UNAUTHORIZED",
              message: "Invalid token",
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        // Get user profile with role
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role, email")
          .eq("id", data.user.id)
          .single();

        const authReq = req as AuthenticatedRequest;
        authReq.userId = data.user.id;
        authReq.userRole = (profile as any)?.role || "employee";
        authReq.userEmail = (profile as any)?.email || data.user.email;

        return handler(authReq, ...args);
      }

      // Get user profile with role
      const supabase = await createAdminClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role, email")
        .eq("id", payload.sub)
        .single();

      const authReq = req as AuthenticatedRequest;
      authReq.userId = payload.sub;
      authReq.userRole = (profile as any)?.role || "employee";
      authReq.userEmail = (profile as any)?.email;

      return handler(authReq, ...args);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return new Response(
        JSON.stringify({
          error: true,
          code: "INTERNAL_ERROR",
          message: "Authentication failed",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}

/**
 * Higher-order function to require specific roles
 */
export function requireRole(...roles: string[]) {
  return (handler: (req: AuthenticatedRequest) => Promise<Response>) => {
    return async (req: AuthenticatedRequest) => {
      if (!roles.includes(req.userRole || "")) {
        return new Response(
          JSON.stringify({
            error: true,
            code: "FORBIDDEN",
            message: "You don't have permission to perform this action",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      return handler(req);
    };
  };
}

/**
 * Require a specific granular permission. Super-admin and admin roles pass
 * automatically; employees pass only if they have an active grant for `key`.
 */
export function requirePermission(key: PermissionKey) {
  return (handler: (req: AuthenticatedRequest) => Promise<Response>) => {
    return async (req: AuthenticatedRequest) => {
      if (!req.userId) {
        return new Response(
          JSON.stringify({
            error: true,
            code: "UNAUTHORIZED",
            message: "Authentication required",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const ok = await hasPermission(req.userId, key);
      if (!ok) {
        return new Response(
          JSON.stringify({
            error: true,
            code: "FORBIDDEN",
            message: "You don't have permission to perform this action",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      return handler(req);
    };
  };
}

/**
 * Extract user context from request
 */
export function getUserContext(req: AuthenticatedRequest) {
  if (!req.userId) {
    throw new Error("User context not available - middleware not applied");
  }

  return {
    userId: req.userId,
    userRole: req.userRole,
    userEmail: req.userEmail,
  };
}
