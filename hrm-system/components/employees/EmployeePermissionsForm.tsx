"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, useToast } from "@/components/ui";
import { useApiCall } from "@/lib/hooks/client";
import type { PermissionDef, PermissionKey } from "@/lib/permissions";

interface Props {
  targetUserId: string;
  definitions: PermissionDef[];
  initialGranted: string[];
}

export default function EmployeePermissionsForm({
  targetUserId,
  definitions,
  initialGranted,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const { callApi } = useApiCall();

  const [selected, setSelected] = useState<Set<PermissionKey>>(
    () => new Set(initialGranted as PermissionKey[])
  );
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionDef[]>();
    for (const def of definitions) {
      const arr = map.get(def.group) ?? [];
      arr.push(def);
      map.set(def.group, arr);
    }
    return Array.from(map.entries());
  }, [definitions]);

  const toggle = (key: PermissionKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const initial = useMemo(
    () => new Set(initialGranted as PermissionKey[]),
    [initialGranted]
  );
  const isDirty = useMemo(() => {
    if (initial.size !== selected.size) return true;
    for (const k of selected) if (!initial.has(k)) return true;
    return false;
  }, [initial, selected]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await callApi(
      `/api/admin/users/${targetUserId}/permissions`,
      {
        method: "PUT",
        body: { permissions: Array.from(selected) },
      }
    );
    setSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Permissions updated");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-line-subtle bg-surface-raised">
        {grouped.map(([group, defs], idx) => (
          <section
            key={group}
            className={
              idx === 0
                ? "p-5"
                : "p-5 border-t border-line-subtle"
            }
          >
            <h3 className="text-xs uppercase tracking-wider text-ink-tertiary mb-3">
              {group}
            </h3>
            <ul className="space-y-3">
              {defs.map((def) => {
                const checked = selected.has(def.key);
                return (
                  <li key={def.key}>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="mt-1 w-4 h-4 rounded border-line-strong text-accent focus:ring-accent"
                        checked={checked}
                        onChange={() => toggle(def.key)}
                      />
                      <span className="flex-1">
                        <span className="block text-sm text-ink-primary">
                          {def.label}
                        </span>
                        <span className="block text-xs text-ink-tertiary mt-0.5">
                          {def.description}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-tertiary">
          {selected.size === 0
            ? "No permissions granted — user will only see their personal workspace."
            : `${selected.size} permission${
                selected.size === 1 ? "" : "s"
              } granted.`}
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setSelected(new Set(initialGranted as PermissionKey[]))}
            disabled={!isDirty || saving}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={!isDirty}
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
