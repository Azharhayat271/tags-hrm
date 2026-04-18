import { PageHeader } from "@/components/ui";
import OrgChart from "@/components/org-chart/OrgChart";
import { fetchOrgTree } from "@/lib/org-chart";

export const dynamic = "force-dynamic";

export default async function OrgChartPage() {
  const { roots, orphanCount } = await fetchOrgTree();

  return (
    <div className="max-w-[1240px] mx-auto">
      <PageHeader
        eyebrow="People"
        title="Organization chart"
        subtitle="See the full reporting structure, starting from the top."
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
      />
      <OrgChart roots={roots} isAdmin={false} />
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
