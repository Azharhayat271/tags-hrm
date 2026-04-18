import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Mail, Phone, Briefcase, Calendar, Building, UserCircle2 } from "lucide-react";
import { Badge, PageHeader, cn } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const { data: employee } = await supabase
    .from("employees")
    .select(`*, designation:designations(name), department:departments(name)`)
    .eq("profile_id", user?.id)
    .single();

  let managerName: string | null = null;
  if (employee?.reports_to) {
    const { data: managerEmployee } = await supabase
      .from("employees")
      .select(`id, profile_id`)
      .eq("id", employee.reports_to)
      .single();

    if (managerEmployee?.profile_id) {
      const { data: managerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", managerEmployee.profile_id)
        .maybeSingle();
      managerName = managerProfile?.full_name ?? "Manager (profile unavailable)";
    }
  }

  const initials = (profile?.full_name ?? "")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "—";

  const roleLabel =
    profile?.role === "super_admin" ? "Super admin" :
    profile?.role === "admin" ? "Admin" :
    "Employee";

  const statusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
    active: { label: "Active", variant: "success" },
    on_leave: { label: "On leave", variant: "warning" },
    resigned: { label: "Resigned", variant: "danger" },
    terminated: { label: "Terminated", variant: "danger" },
    inactive: { label: "Inactive", variant: "neutral" },
  };
  const statusMeta = employee?.status ? statusMap[employee.status] : null;

  return (
    <div className="max-w-[1100px] mx-auto">
      <PageHeader
        eyebrow="Account"
        title="My profile"
        subtitle="Your personal and employment information on file."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Identity card */}
        <div className="rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden">
          <div className="p-6 flex flex-col items-center text-center">
            <span
              aria-hidden
              className="inline-flex items-center justify-center w-20 h-20 rounded-md bg-surface-sunken border border-line-subtle text-[22px] font-light tracking-wide text-ink-secondary mb-4"
            >
              {initials}
            </span>
            <h2 className="text-[1.25rem] font-light tracking-[-0.015em] text-ink-primary mb-1">
              {profile?.full_name}
            </h2>
            <p className="text-[11px] text-ink-tertiary font-mono tabular-nums mb-4">
              {profile?.email}
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Badge variant="accent" size="md">
                {roleLabel}
              </Badge>
              {statusMeta && (
                <Badge variant={statusMeta.variant} size="md" dot>
                  {statusMeta.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Contact information */}
        <div className="lg:col-span-2 rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-line-subtle">
            <span className="eyebrow">Contact</span>
            <h3 className="text-[15px] font-normal text-ink-primary mt-0.5">How to reach you</h3>
          </div>
          <dl className="divide-y divide-line-subtle">
            <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={profile?.email ?? "—"} mono />
            <InfoRow
              icon={<Phone className="w-3.5 h-3.5" />}
              label="Phone"
              value={profile?.phone ?? "—"}
              mono
            />
          </dl>
        </div>

        {/* Employment information */}
        {employee && (
          <div className="lg:col-span-3 rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-line-subtle flex items-center justify-between">
              <div>
                <span className="eyebrow">Employment</span>
                <h3 className="text-[15px] font-normal text-ink-primary mt-0.5">Role & tenure</h3>
              </div>
              {employee.joining_date && (
                <span className="text-[11px] text-ink-tertiary font-mono tabular-nums">
                  Since {formatDate(employee.joining_date)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line-subtle">
              <TileCell
                icon={<Briefcase className="w-3.5 h-3.5" />}
                label="Designation"
                value={employee.designation?.name ?? "—"}
              />
              <TileCell
                icon={<Building className="w-3.5 h-3.5" />}
                label="Department"
                value={employee.department?.name ?? "—"}
              />
              <TileCell
                icon={<Calendar className="w-3.5 h-3.5" />}
                label="Joining date"
                value={employee.joining_date ? formatDate(employee.joining_date) : "—"}
                mono
              />
              <TileCell
                icon={<UserCircle2 className="w-3.5 h-3.5" />}
                label="Reports to"
                value={managerName ?? "—"}
              />
              <TileCell
                icon={<Briefcase className="w-3.5 h-3.5" />}
                label="Employment type"
                value={
                  employee.employment_type
                    ? employee.employment_type.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
                    : "—"
                }
              />
              {employee.joining_date && (
                <TileCell
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  label="Tenure"
                  value={calculateTenure(employee.joining_date)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="px-5 py-3.5 flex items-center gap-3">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-sm bg-surface-sunken border border-line-subtle text-ink-tertiary shrink-0">
        {icon}
      </span>
      <dt className="text-[11px] text-ink-tertiary uppercase tracking-[0.06em] font-medium w-24 shrink-0">
        {label}
      </dt>
      <dd className={cn("text-[13px] text-ink-primary min-w-0 truncate", mono && "font-mono tabular-nums")}>
        {value}
      </dd>
    </div>
  );
}

function TileCell({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-surface-raised px-5 py-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-ink-quaternary">{icon}</span>
        <span className="eyebrow">{label}</span>
      </div>
      <div className={cn("text-[14px] text-ink-primary", mono && "font-mono tabular-nums")}>
        {value}
      </div>
    </div>
  );
}

function calculateTenure(joiningDate: string): string {
  const start = new Date(joiningDate);
  const now = new Date();

  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();
  const totalMonths = years * 12 + months;
  const displayYears = Math.floor(totalMonths / 12);
  const displayMonths = totalMonths % 12;

  if (displayYears === 0) {
    return `${displayMonths} month${displayMonths !== 1 ? "s" : ""}`;
  }
  if (displayMonths === 0) {
    return `${displayYears} year${displayYears !== 1 ? "s" : ""}`;
  }
  return `${displayYears}y ${displayMonths}m`;
}
