import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { User, Mail, Phone, Briefcase, Calendar, Building } from "lucide-react";
import Link from "next/link";

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

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select(`
      *,
      designation:designations(name),
      department:departments(name)
    `)
    .eq("profile_id", user?.id)
    .single();

  console.log("Employee data:", employee);
  console.log("Employee error:", employeeError);
  console.log("Employee exists?", !!employee);

  // Fetch manager info separately if reports_to exists
  let managerName = null;
  if (employee?.reports_to) {
    // Try to fetch the manager's employee record and their profile
    const { data: managerEmployee, error: managerError } = await supabase
      .from("employees")
      .select(`
        id,
        profile_id
      `)
      .eq("id", employee.reports_to)
      .single();
    
    if (managerEmployee?.profile_id) {
      // Fetch the manager's profile - use maybeSingle() instead of single() to handle missing records
      const { data: managerProfile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", managerEmployee.profile_id)
        .maybeSingle();
      
      if (managerProfile) {
        managerName = managerProfile.full_name;
      } else {
        // Profile not found or not accessible
        console.warn("Manager profile not found or not accessible:", managerEmployee.profile_id);
        managerName = "Manager (Profile Not Found)";
      }
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div>
          <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
            My Profile
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
            View your personal and employment information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card p-6">
          <div className="flex flex-col items-center text-center">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, var(--tag-orange), var(--tag-amber))' }}
            >
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-xl font-light mb-1">{profile?.full_name}</h2>
            <span className="badge-orange mb-4 capitalize">
              {profile?.role?.replace("_", " ")}
            </span>
            {employee?.status && (
              <span className={`badge ${
                employee.status === 'active' ? 'badge-success' :
                employee.status === 'on_leave' ? 'badge-warning' :
                'badge-danger'
              }`}>
                {employee.status.replace("_", " ").toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
            Contact Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 mt-0.5" style={{ color: 'var(--tag-orange)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Email</p>
                <p className="text-sm font-light">{profile?.email}</p>
              </div>
            </div>
            {profile?.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5" style={{ color: 'var(--tag-orange)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Phone</p>
                  <p className="text-sm font-light">{profile.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Employment Information */}
        {employee && (
          <div className="card p-6 lg:col-span-3">
            <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
              Employment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 mt-0.5" style={{ color: 'var(--tag-orange)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Designation</p>
                  <p className="text-sm font-light">{employee.designation?.name || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 mt-0.5" style={{ color: 'var(--tag-orange)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Department</p>
                  <p className="text-sm font-light">{employee.department?.name || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 mt-0.5" style={{ color: 'var(--tag-orange)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Joining Date</p>
                  <p className="text-sm font-light">
                    {employee.joining_date ? formatDate(employee.joining_date) : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 mt-0.5" style={{ color: 'var(--tag-orange)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Reports To</p>
                  <p className="text-sm font-light">
                    {managerName || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 mt-0.5" style={{ color: 'var(--tag-orange)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Employment Type</p>
                  <p className="text-sm font-light capitalize">
                    {employee.employment_type?.replace("_", " ") || "—"}
                  </p>
                </div>
              </div>

              {employee.joining_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-0.5" style={{ color: 'var(--tag-orange)' }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Tenure</p>
                    <p className="text-sm font-light">
                      {calculateTenure(employee.joining_date)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
    return `${displayMonths} month${displayMonths !== 1 ? 's' : ''}`;
  } else if (displayMonths === 0) {
    return `${displayYears} year${displayYears !== 1 ? 's' : ''}`;
  } else {
    return `${displayYears} year${displayYears !== 1 ? 's' : ''}, ${displayMonths} month${displayMonths !== 1 ? 's' : ''}`;
  }
}
