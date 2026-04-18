import { createAdminClient } from "@/lib/supabase/admin";

export interface OrgNodeData {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  avatarUrl: string | null;
  email?: string | null;
  children: OrgNodeData[];
}

interface RawRow {
  id: string;
  reports_to: string | null;
  status: string | null;
  profiles: { full_name: string; email: string; avatar_url: string | null } | null;
  designation: { name: string } | null;
  department: { name: string } | null;
}

export interface FetchOrgTreeOptions {
  includeInactive?: boolean;
  includeEmail?: boolean;
}

export async function fetchOrgTree(
  opts: FetchOrgTreeOptions = {},
): Promise<{ roots: OrgNodeData[]; orphanCount: number }> {
  const supabase = await createAdminClient();

  let query = supabase.from("employees").select(`
    id,
    reports_to,
    status,
    profiles!inner(full_name, email, avatar_url),
    designation:designations(name),
    department:departments(name)
  `);

  if (!opts.includeInactive) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as RawRow[];
  return buildOrgTree(rows, { includeEmail: !!opts.includeEmail });
}

export function buildOrgTree(
  rows: RawRow[],
  opts: { includeEmail?: boolean } = {},
): { roots: OrgNodeData[]; orphanCount: number } {
  const byId = new Map<string, OrgNodeData>();

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      name: row.profiles?.full_name ?? "Unknown",
      title: row.designation?.name ?? null,
      department: row.department?.name ?? null,
      avatarUrl: row.profiles?.avatar_url ?? null,
      email: opts.includeEmail ? (row.profiles?.email ?? null) : undefined,
      children: [],
    });
  }

  const roots: OrgNodeData[] = [];
  let orphanCount = 0;

  for (const row of rows) {
    const node = byId.get(row.id);
    if (!node) continue;

    if (row.reports_to && byId.has(row.reports_to)) {
      byId.get(row.reports_to)!.children.push(node);
    } else {
      if (row.reports_to) orphanCount++;
      roots.push(node);
    }
  }

  const sortByName = (a: OrgNodeData, b: OrgNodeData) => a.name.localeCompare(b.name);
  const sortTree = (node: OrgNodeData) => {
    node.children.sort(sortByName);
    node.children.forEach(sortTree);
  };
  roots.sort(sortByName);
  roots.forEach(sortTree);

  return { roots, orphanCount };
}
