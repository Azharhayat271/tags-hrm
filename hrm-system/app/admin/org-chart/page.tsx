import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader, cn } from "@/components/ui";
import OrgChart from "@/components/org-chart/OrgChart";
import { fetchOrgTree } from "@/lib/org-chart";

const secondaryLink = cn(
  "inline-flex items-center justify-center gap-1.5 font-medium",
  "h-8 text-xs px-3 rounded-sm",
  "bg-surface-raised text-ink-primary border border-line",
  "hover:bg-surface-muted hover:border-line-strong",
  "transition-[background-color,border-color,color,box-shadow] duration-base ease-out-expo",
);

export const dynamic = "force-dynamic";

export default async function AdminOrgChartPage({
  searchParams,
}: {
  searchParams: Promise<{ include_inactive?: string }>;
}) {
  const params = await searchParams;
  const includeInactive = params.include_inactive === "1";

  const { roots, orphanCount } = await fetchOrgTree({
    includeInactive,
    includeEmail: true,
  });

  return (
    <div className="max-w-[1240px] mx-auto">
      <PageHeader
        eyebrow="People"
        title="Organization chart"
        subtitle="Full reporting tree. Click the edit icon on any card to change reporting lines."
        meta={
          <>
            <span className="font-mono tabular-nums">
              {countPeople(roots)} people
            </span>
            {roots.length > 1 && (
              <span className="font-mono tabular-nums">
                · {roots.length} roots
              </span>
            )}
            {orphanCount > 0 && (
              <span className="text-[var(--warning-text)]">
                · {orphanCount} orphaned
              </span>
            )}
          </>
        }
        actions={
          <>
            <Link
              href={
                includeInactive
                  ? "/admin/org-chart"
                  : "/admin/org-chart?include_inactive=1"
              }
              className={secondaryLink}
            >
              {includeInactive ? "Active only" : "Include inactive"}
            </Link>
            <Link
              href="/admin/employees"
              className={secondaryLink}
            >
              <Users className="w-3.5 h-3.5" />
              Employees
            </Link>
          </>
        }
      />

      {roots.length > 1 && (
        <div className="mb-4 px-4 py-2.5 rounded-sm border border-[var(--warning-border)] bg-[var(--warning-tint)] text-[12px] text-[var(--warning-text)]">
          Multiple roots detected. Only employees with no reporting manager appear as roots — the CEO should be the single top of the tree.
        </div>
      )}

      <OrgChart roots={roots} isAdmin={true} />
    </div>
  );
}

function countPeople(nodes: { children: any[] }[]): number {
  let n = 0;
  const visit = (list: { children: any[] }[]) => {
    for (const node of list) {
      n++;
      visit(node.children);
    }
  };
  visit(nodes);
  return n;
}
