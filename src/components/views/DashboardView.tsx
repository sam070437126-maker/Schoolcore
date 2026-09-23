import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtimeDashboard } from '../../hooks/useRealtimeDashboard.ts';
import { NavTab } from '../layout/Sidebar.tsx';
import { AlertTriangle, RefreshCw, Building2, ArrowLeft } from 'lucide-react';

// Separated Role Dashboards
import { ParentDashboard } from '../dashboard/ParentDashboard.tsx';
import { BursarDashboard } from '../dashboard/BursarDashboard.tsx';
import { TeacherDashboard } from '../dashboard/TeacherDashboard.tsx';
import { AcademicCoordinatorDashboard } from '../dashboard/AcademicCoordinatorDashboard.tsx';
import { RegistrarDashboard } from '../dashboard/RegistrarDashboard.tsx';
import { PrincipalDashboard } from '../dashboard/PrincipalDashboard.tsx';
import { SuperAdminDashboard } from '../dashboard/SuperAdminDashboard.tsx';
import { AdminDashboard } from '../dashboard/AdminDashboard.tsx';

interface DashboardViewProps {
  onNavigate: (tab: NavTab, extra?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    user,
    school,
    role,
    isSuperAdmin,
    isInSchoolWorkspace,
    exitSchoolWorkspace,
    isAdmin,
    isPrincipal,
    isAcademicCoordinator,
    isRegistrar,
    isTeacher,
    isBursar,
    isParent,
  } = useAuth();

  const { stats, isLoading, error, refetch, version } = useRealtimeDashboard(school?.id, user?.id);

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  if (isLoading) {
    return (
      <div id="dashboard-loading" className="space-y-6">
        <div className="h-24 bg-slate-200/70 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-200/70 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-44 bg-slate-200/70 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-slate-200/70 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-200/70 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="dashboard-error" className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <p className="text-slate-800 font-semibold">{error}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  // 1. Super Admin (SaaS Multi-School Platform)
  if (isSuperAdmin) {
    if (isInSchoolWorkspace && school && school.id !== 'global-platform') {
      return (
        <div className="space-y-6">
          {/* Active School Workspace Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Active Institutional Workspace
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    {school.code || 'INSTITUTION'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white truncate">{school.name}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => exitSchoolWorkspace?.()}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                title="Return to Super Master Admin Platform Control"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit to Platform Control</span>
              </button>
            </div>
          </div>

          <AdminDashboard
            stats={stats}
            onNavigate={onNavigate}
            todayFormatted={todayFormatted}
          />
        </div>
      );
    }

    return (
      <SuperAdminDashboard
        onNavigate={onNavigate}
        todayFormatted={todayFormatted}
      />
    );
  }

  // 2. Parent Portal
  if (isParent) {
    return (
      <ParentDashboard
        onNavigate={onNavigate}
        todayFormatted={todayFormatted}
      />
    );
  }

  // 3. Bursar & Finance Officer
  if (isBursar) {
    return (
      <BursarDashboard
        onNavigate={onNavigate}
        todayFormatted={todayFormatted}
      />
    );
  }

  // 4. Teacher Workload Desk
  if (isTeacher) {
    return (
      <TeacherDashboard
        stats={stats}
        onNavigate={onNavigate}
        todayFormatted={todayFormatted}
      />
    );
  }

  // 5. Academic Coordinator
  if (isAcademicCoordinator) {
    return (
      <AcademicCoordinatorDashboard
        stats={stats}
        onNavigate={onNavigate}
        todayFormatted={todayFormatted}
      />
    );
  }

  // 6. Registrar & Admissions
  if (isRegistrar) {
    return (
      <RegistrarDashboard
        stats={stats}
        onNavigate={onNavigate}
        todayFormatted={todayFormatted}
      />
    );
  }

  // 7. Principal / Head Teacher
  if (isPrincipal) {
    return (
      <PrincipalDashboard
        stats={stats}
        onNavigate={onNavigate}
        todayFormatted={todayFormatted}
      />
    );
  }

  // 8. School Administrator (Default / Admin Control Room)
  return (
    <AdminDashboard
      stats={stats}
      onNavigate={onNavigate}
      todayFormatted={todayFormatted}
    />
  );
};
