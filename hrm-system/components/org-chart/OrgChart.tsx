"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Edit3, Search } from "lucide-react";
import type { OrgNodeData } from "@/lib/org-chart";
import { Badge, Input, cn } from "@/components/ui";

interface OrgChartProps {
  roots: OrgNodeData[];
  isAdmin: boolean;
}

export default function OrgChart({ roots, isAdmin }: OrgChartProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const matched = new Set<string>();
    const visit = (node: OrgNodeData) => {
      const hit =
        node.name.toLowerCase().includes(q) ||
        (node.title ?? "").toLowerCase().includes(q) ||
        (node.department ?? "").toLowerCase().includes(q) ||
        (node.email ?? "").toLowerCase().includes(q);
      if (hit) matched.add(node.id);
      node.children.forEach(visit);
    };
    roots.forEach(visit);
    return matched;
  }, [search, roots]);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <div className="mb-6 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary pointer-events-none" />
          <Input
            placeholder="Search by name, title, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto pb-6">
        <div className="min-w-fit mx-auto flex justify-center">
          {roots.length === 0 ? (
            <div className="text-ink-tertiary text-sm py-16">
              No employees found to chart.
            </div>
          ) : roots.length === 1 ? (
            <OrgNode
              node={roots[0]}
              matches={matches}
              collapsed={collapsed}
              onToggle={toggle}
              isAdmin={isAdmin}
            />
          ) : (
            <div className="flex gap-10 items-start">
              {roots.map((root) => (
                <OrgNode
                  key={root.id}
                  node={root}
                  matches={matches}
                  collapsed={collapsed}
                  onToggle={toggle}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface NodeProps {
  node: OrgNodeData;
  matches: Set<string> | null;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  isAdmin: boolean;
}

function OrgNode({ node, matches, collapsed, onToggle, isAdmin }: NodeProps) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);
  const isMatch = matches?.has(node.id) ?? false;
  const isDimmed = matches !== null && !isMatch;

  return (
    <div className="flex flex-col items-center">
      <NodeCard
        node={node}
        onToggle={hasChildren ? () => onToggle(node.id) : undefined}
        collapsed={isCollapsed}
        hasChildren={hasChildren}
        dimmed={isDimmed}
        highlighted={isMatch}
        isAdmin={isAdmin}
      />

      {hasChildren && !isCollapsed && (
        <ul
          className={cn(
            "flex justify-center relative pt-6 m-0 p-0 list-none",
            "before:content-[''] before:absolute before:top-0 before:left-1/2 before:h-6",
            "before:border-l before:border-line-subtle",
          )}
        >
          {node.children.map((child, idx) => {
            const multi = node.children.length > 1;
            const isFirst = idx === 0;
            const isLast = idx === node.children.length - 1;
            return (
              <li
                key={child.id}
                className={cn(
                  "relative px-4 flex-shrink-0 list-none",
                  multi && [
                    "before:content-[''] before:absolute before:top-0 before:right-1/2 before:w-1/2 before:h-0",
                    "before:border-t before:border-line-subtle",
                    "after:content-[''] after:absolute after:top-0 after:left-1/2 after:w-1/2 after:h-0",
                    "after:border-t after:border-line-subtle",
                    isFirst && "before:invisible",
                    isLast && "after:invisible",
                  ],
                )}
              >
                <OrgNode
                  node={child}
                  matches={matches}
                  collapsed={collapsed}
                  onToggle={onToggle}
                  isAdmin={isAdmin}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface NodeCardProps {
  node: OrgNodeData;
  onToggle?: () => void;
  collapsed: boolean;
  hasChildren: boolean;
  dimmed: boolean;
  highlighted: boolean;
  isAdmin: boolean;
}

function NodeCard({
  node,
  onToggle,
  collapsed,
  hasChildren,
  dimmed,
  highlighted,
  isAdmin,
}: NodeCardProps) {
  return (
    <div
      className={cn(
        "relative w-56 bg-surface-raised border rounded-md shadow-e1 px-4 py-3",
        "transition-all duration-base ease-out-expo",
        highlighted ? "border-accent shadow-e2" : "border-line-subtle",
        dimmed && "opacity-30",
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar name={node.name} avatarUrl={node.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-ink-primary truncate">
            {node.name}
          </div>
          <div className="text-[11px] text-ink-tertiary truncate">
            {node.title ?? "—"}
          </div>
        </div>
      </div>

      {node.department && (
        <div className="mt-2">
          <Badge variant="neutral" size="sm">
            {node.department}
          </Badge>
        </div>
      )}

      {isAdmin && (
        <Link
          href={`/admin/employees/${node.id}/edit`}
          className={cn(
            "absolute top-2 right-2 p-1 rounded-sm",
            "text-ink-tertiary hover:text-ink-accent hover:bg-surface-muted",
            "transition-colors duration-fast ease-out-expo",
          )}
          title="Edit employee"
          aria-label={`Edit ${node.name}`}
        >
          <Edit3 className="w-3.5 h-3.5" />
        </Link>
      )}

      {hasChildren && onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10",
            "w-5 h-5 rounded-full bg-surface-raised border border-line-subtle",
            "flex items-center justify-center",
            "text-ink-tertiary hover:text-ink-accent hover:border-line",
            "transition-colors duration-fast ease-out-expo",
          )}
          aria-label={collapsed ? "Expand reports" : "Collapse reports"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
}

function Avatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const initials =
    name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "—";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-line-subtle"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-surface-muted border border-line-subtle flex items-center justify-center text-[11px] font-medium text-ink-secondary flex-shrink-0">
      {initials}
    </div>
  );
}
