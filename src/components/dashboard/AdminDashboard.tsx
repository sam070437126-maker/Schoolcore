import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NavTab } from '../layout/Sidebar.tsx';
import { PaperlessScorecard } from './PaperlessScorecard.tsx';
import { AdminInvitationsModal } from '../admin/AdminInvitationsModal.tsx';
import { AdminUserAccountsModal } from '../admin/AdminUserAccountsModal.tsx';
import { SchoolControlRoom } from '../admin/SchoolControlRoom.tsx';
import { DashboardStats } from '../../types/index.ts';
import {
  Calendar,
  ClipboardCheck,
  PlusCircle,
  BookOpen,
  Mail,
  Users,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Settings,
  Bell,
  Activity,
  Layers,
  FileCheck2,
  CreditCard,
  Building,
  KeyRound
} from 'lucide-react';

interface AdminDashboardProps {
  stats: DashboardStats | null;
  onNavigate: (tab: NavTab, extra?: any) => void;
  todayFormatted: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  onNavigate,
  todayFormatted,
}) => {
  const { user, school, isAdmin, isPrincipal } = useAuth();
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'control_room' | 'overview'>('control_room');
  const [showSetupChecklist, setShowSetupChecklist] = useState<boolean>(true);
  const [isInvitationsModalOpen, setIsInvitationsModalOpen] = useState<boolean>(false);
  const [isUserAccountsModalOpen, setIsUserAccountsModalOpen] = useState<boolean>(false);

  // Setup Milestones
  const setupSteps = [
    {
      id: 'profile',
      title: 'School Profile & Academic Year',
      desc: school?.name ? `${school.name} (${school.current_session_id || '2025/2026'})` : 'Configure your school identity',
      done: Boolean(school?.name),
      actionLabel: 'Review Settings',
      onAction: () => onNavigate('settings'),
    },
    {
      id: 'classes',
      title: 'Create Class Arms',
      desc: (stats?.total_classes || 0) > 0 ? `${stats?.total_classes} class arm${(stats?.total_classes || 0) > 1 ? 's' : ''} registered` : 'Create class registers (e.g. JSS 1A, SS 1 Science)',
      done: (stats?.total_classes || 0) > 0,
      actionLabel: (stats?.total_classes || 0) > 0 ? 'Manage Classes' : 'Add Class',
      onAction: () => onNavigate('classes', (stats?.total_classes || 0) === 0 ? { openCreateModal: true } : undefined),
    },
    {
      id: 'staff',
      title: 'Register Faculty & Teachers',
      desc: (stats?.total_staff || 0) > 0 ? `${stats?.total_staff} faculty member${(stats?.total_staff || 0) > 1 ? 's' : ''} active` : 'Add teachers to assign classes and take roll call',
      done: (stats?.total_staff || 0) > 0,
      actionLabel: (stats?.total_staff || 0) > 0 ? 'View Staff' : 'Add Staff',
      onAction: () => onNavigate('staff', (stats?.total_staff || 0) === 0 ? { openCreateModal: true } : undefined),
    },
    {
      id: 'students',
      title: 'Admit Students',
      desc: (stats?.total_students || 0) > 0 ? `${stats?.total_students} student${(stats?.total_students || 0) > 1 ? 's' : ''} enrolled` : 'Admit students with institutional admission numbers',
      done: (stats?.total_students || 0) > 0,
      actionLabel: (stats?.total_students || 0) > 0 ? 'Student Directory' : 'Admit Student',
      onAction: () => onNavigate('students', (stats?.total_students || 0) === 0 ? { openCreateModal: true } : undefined),
    },
    {
      id: 'attendance',
      title: 'Take Daily Attendance',
      desc: (stats?.attendance_today?.marked_classes || 0) > 0
        ? `${stats?.attendance_today?.marked_classes} roll call${(stats?.attendance_today?.marked_classes || 0) > 1 ? 's' : ''} recorded today`
        : 'Record classroom roll calls with 1-click submission',
      done: (stats?.attendance_today?.marked_classes || 0) > 0,
      actionLabel: 'Take Roll Call',
      onAction: () => onNavigate('attendance'),
    },
  ];

  const completedStepsCount = setupSteps.filter(s => s.done).length;

  return (
    <div id="admin-dashboard" className="space-y-6">
      {/* Header Banner - Executive Institutional Canvas with Micro-Grid Texture */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#0a0f1d] text-white p-6 sm:p-7 rounded-2xl shadow-md border border-slate-700/80">
        {/* Subtle architectural tactile texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, rgba(148, 163, 184, 0.05) 1px, transparent 1px)`,
            backgroundSize: '16px 16px, 32px 32px',
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            {/* Textured Date Plate - NOT a button */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-950/80 border border-slate-700/80 shadow-inner select-none backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 font-mono tracking-wide">
                <Calendar className="w-3.5 h-3.5 text-emerald-400/90 shrink-0" />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Date:</span>
                <span>{todayFormatted}</span>
              </span>
              <span className="w-px h-3 bg-slate-700/80" />
              <span className="text-[10px] uppercase tracking-wider text-emerald-400/90 font-bold font-sans">
                Live Session
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Good day, {user?.full_name || 'Administrator'}</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Operational control room for <strong className="text-white font-semibold">{school?.name}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="dash-take-attendance-btn"
              onClick={() => onNavigate('attendance')}
              className="px-3.5 py-2 bg-emerald-700/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/50 shadow-xs transition-all cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-200" />
              <span>Take Attendance</span>
            </button>
            <button
              id="dash-add-student-btn"
              onClick={() => onNavigate('students', { openCreateModal: true })}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700/90 shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-300" />
              <span>Add Student</span>
            </button>
            <button
              id="dash-academics-btn"
              onClick={() => onNavigate('academics')}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700/90 shadow-xs transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Academics & Reports</span>
            </button>
            <button
              id="dash-accounts-otp-btn"
              onClick={() => setIsUserAccountsModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-b from-amber-500/15 to-amber-600/10 hover:from-amber-500/25 hover:to-amber-600/20 text-amber-200 hover:text-amber-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-amber-500/40 hover:border-amber-400/70 shadow-xs transition-all cursor-pointer backdrop-blur-xs"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>User Accounts & Access Codes</span>
            </button>
            <button
              id="dash-invitations-btn"
              onClick={() => setIsInvitationsModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700/90 hover:border-emerald-500/50 shadow-xs transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Invite via Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtab Switcher: Control Room vs Executive Overview */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-500">
        <button
          id="tab-control-room"
          onClick={() => setActiveAdminSubTab('control_room')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeAdminSubTab === 'control_room'
              ? 'border-emerald-600 text-emerald-600 font-extrabold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>School Control Room & Teacher Command</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
        <button
          id="tab-overview"
          onClick={() => setActiveAdminSubTab('overview')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeAdminSubTab === 'overview'
              ? 'border-emerald-600 text-emerald-600 font-extrabold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Executive Overview & Scorecards</span>
        </button>
      </div>

      {activeAdminSubTab === 'control_room' ? (
        <SchoolControlRoom onNavigate={onNavigate} />
      ) : (
        <>
          {/* Institutional Paperless Transformation Scorecard */}
          <PaperlessScorecard onNavigate={onNavigate} />

          {/* Onboarding & Setup Workflow Guide */}
      {showSetupChecklist && (
        <div id="onboarding-setup-guide" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/60 via-slate-50 to-white border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-600 text-white">
                  School Readiness
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {completedStepsCount} of {setupSteps.length} milestones complete
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                {completedStepsCount === setupSteps.length
                  ? 'All core school systems active and running paperless'
                  : 'Complete initial school onboarding configuration'}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28 sm:w-36 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((completedStepsCount / setupSteps.length) * 100)}%` }}
                />
              </div>
              <button
                onClick={() => setShowSetupChecklist(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Dismiss checklist"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {setupSteps.map((step, idx) => (
              <div
                key={step.id}
                id={`setup-step-${step.id}`}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      step.done
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}
                  >
                    {step.done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs sm:text-sm font-semibold truncate ${step.done ? 'text-slate-900' : 'text-slate-700'}`}>
                      {step.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{step.desc}</p>
                  </div>
                </div>

                <button
                  onClick={step.onAction}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                    step.done
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                  }`}
                >
                  {step.actionLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          id="stat-students"
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Students</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.total_students || 0}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            {stats?.total_students || 0} active learners
          </div>
        </div>

        <div
          id="stat-classes"
          onClick={() => onNavigate('classes')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Arms</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.total_classes || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">JSS & SSS cohorts</div>
        </div>

        <div
          id="stat-faculty"
          onClick={() => onNavigate('staff')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Faculty & Staff</span>
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.total_staff || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{stats?.total_staff || 0} active personnel</div>
        </div>

        <div
          id="stat-attendance-rate"
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Attendance</span>
            <ClipboardCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.attendance_today?.rate_percentage || 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats?.attendance_today?.marked_classes || 0} / {stats?.total_classes || 0} classes recorded
          </div>
        </div>
      </div>

      {/* Secondary Row: Quick Actions & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-3">Administrator Operations Launchpad</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigate('students')}
              className="p-3.5 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-xl text-left transition-all cursor-pointer"
            >
              <Users className="w-5 h-5 text-emerald-600 mb-1.5" />
              <div className="font-bold text-xs text-slate-900">Students Directory</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Profiles & admissions</p>
            </button>

            <button
              onClick={() => onNavigate('classes')}
              className="p-3.5 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-xl text-left transition-all cursor-pointer"
            >
              <GraduationCap className="w-5 h-5 text-emerald-600 mb-1.5" />
              <div className="font-bold text-xs text-slate-900">Classes & Arms</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Class rosters & levels</p>
            </button>

            <button
              onClick={() => onNavigate('attendance')}
              className="p-3.5 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-xl text-left transition-all cursor-pointer"
            >
              <ClipboardCheck className="w-5 h-5 text-emerald-600 mb-1.5" />
              <div className="font-bold text-xs text-slate-900">Attendance Register</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Daily roll call & audits</p>
            </button>

            <button
              onClick={() => onNavigate('academics')}
              className="p-3.5 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-xl text-left transition-all cursor-pointer"
            >
              <BookOpen className="w-5 h-5 text-emerald-600 mb-1.5" />
              <div className="font-bold text-xs text-slate-900">Academics & Reports</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Grades & broadsheets</p>
            </button>

            <button
              onClick={() => onNavigate('finance')}
              className="p-3.5 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-xl text-left transition-all cursor-pointer"
            >
              <CreditCard className="w-5 h-5 text-emerald-600 mb-1.5" />
              <div className="font-bold text-xs text-slate-900">Bursary & Accounts</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Fee payments & ledger</p>
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className="p-3.5 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-xl text-left transition-all cursor-pointer"
            >
              <Settings className="w-5 h-5 text-emerald-600 mb-1.5" />
              <div className="font-bold text-xs text-slate-900">School Settings</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Grading scale & profile</p>
            </button>
          </div>
        </div>

        {/* Notices */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <span>School Bulletins</span>
              </h3>
              <button
                onClick={() => onNavigate('notices')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {stats?.important_notices && stats.important_notices.length > 0 ? (
                stats.important_notices.slice(0, 3).map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">{n.title}</span>
                      {n.priority === 'HIGH' || n.priority === 'URGENT' ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                          {n.priority}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No active announcements.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grounded Institutional Verification & System Health Bottom Panel */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0c1322] via-[#0f172a] to-[#0a0f1d] text-slate-300 rounded-2xl p-4 sm:p-5 border border-slate-700/80 shadow-md">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <span className="font-semibold text-slate-100">SchoolCore Enterprise Node Active</span>
              <span className="text-slate-500 mx-2">•</span>
              <span className="text-slate-400 font-mono text-[11px]">Tenant: {school?.name || 'Bright Future Secondary School'}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1 rounded-md border border-slate-700/80 text-slate-300 shadow-inner">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Tenant Partition Verified</span>
            </span>
            <span className="hidden md:inline text-slate-600">•</span>
            <span className="font-mono text-slate-400">Zero-Paper Protocol v2.4</span>
          </div>
        </div>
      </div>
      </>
      )}

      {/* School-Verified Institutional Invitations Modal */}
      <AdminInvitationsModal
        isOpen={isInvitationsModalOpen}
        onClose={() => setIsInvitationsModalOpen(false)}
        schoolId={school?.id}
        schoolName={school?.name}
      />

      {/* User Accounts & Access Codes (OTP) Provisioning Modal */}
      <AdminUserAccountsModal
        isOpen={isUserAccountsModalOpen}
        onClose={() => setIsUserAccountsModalOpen(false)}
      />
    </div>
  );
};
