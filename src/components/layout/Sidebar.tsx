import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Activity,
  Users,
  GraduationCap,
  ClipboardCheck,
  UserCog,
  Bell,
  Settings,
  History,
  BookOpen,
  School,
  X,
  MessageSquare,
  CreditCard,
  FileCheck2,
  Server,
  Layers,
  FileSpreadsheet,
  UserPlus,
  ArrowLeft,
  Building2,
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'control_room'
  | 'students'
  | 'classes'
  | 'attendance'
  | 'academics'
  | 'homework'
  | 'messages'
  | 'finance'
  | 'approvals'
  | 'staff'
  | 'notices'
  | 'settings'
  | 'audit';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const {
    role,
    school,
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

  const handleNav = (tab: NavTab) => {
    onSelectTab(tab);
    onClose();
  };

  const roleLabel = isSuperAdmin
    ? isInSchoolWorkspace
      ? 'School Workspace'
      : 'SaaS Platform'
    : isParent
    ? 'Parent Portal'
    : isBursar
    ? 'Bursary & Finance'
    : isTeacher
    ? 'Teacher Desk'
    : isAcademicCoordinator
    ? 'Academic Operations'
    : isRegistrar
    ? 'Admissions Desk'
    : isPrincipal
    ? 'Executive Oversight'
    : 'School Administration';

  // Google Gill Design System navigation item token styling (4px/8px rhythm, accessible focus ring, high contrast)
  const getNavBtnClass = (isActive: boolean, activeColor = 'bg-emerald-600') =>
    `w-full flex items-center gap-3 px-3.5 py-2.5 my-0.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 select-none ${
      isActive
        ? `${activeColor} text-white shadow-xs font-semibold`
        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
    }`;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed lg:sticky top-0 lg:top-[57px] bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } h-screen lg:h-[calc(100vh-57px)]`}
      >
        {/* Top items */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Mobile close button header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm tracking-wide">SchoolCore</span>
            </div>
            <button
              id="sidebar-close-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Grouped by Role Separation */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>{roleLabel}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                {isSuperAdmin ? 'Platform' : 'Paperless OS'}
              </span>
            </div>

            {/* Super Admin in School Workspace Banner & Exit button */}
            {isSuperAdmin && isInSchoolWorkspace && (
              <div className="mb-2 space-y-1.5">
                <button
                  id="nav-exit-workspace"
                  type="button"
                  onClick={() => {
                    exitSchoolWorkspace?.();
                    handleNav('dashboard');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 hover:text-white border border-emerald-500/40 transition-all cursor-pointer shadow-xs"
                  title="Return to Super Admin Platform Control"
                >
                  <div className="flex items-center gap-2 truncate">
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Exit to SaaS Control</span>
                  </div>
                  <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </button>
                {school?.name && (
                  <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-200 truncate">{school.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono shrink-0">
                      {school.code || 'SCH'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Dashboard / Home */}
            <button
              id="nav-dashboard"
              onClick={() => handleNav('dashboard')}
              className={getNavBtnClass(activeTab === 'dashboard')}
            >
              {isSuperAdmin && !isInSchoolWorkspace ? (
                <Server className="w-4 h-4 shrink-0" />
              ) : (
                <LayoutDashboard className="w-4 h-4 shrink-0" />
              )}
              <span>
                {isSuperAdmin && !isInSchoolWorkspace
                  ? 'Platform Control'
                  : isTeacher
                  ? 'Teacher Home'
                  : isParent
                  ? 'Parent Home'
                  : isBursar
                  ? 'Bursary Overview'
                  : isAcademicCoordinator
                  ? 'Academic Overview'
                  : isRegistrar
                  ? 'Admissions Home'
                  : isPrincipal
                  ? 'Executive Overview'
                  : 'Overview Dashboard'}
              </span>
            </button>

            {/* ------------------------------------------------------------- */}
            {/* PART 1: SUPER ADMIN NAVIGATION (Multi-tenant Platform) */}
            {/* ------------------------------------------------------------- */}
            {isSuperAdmin && !isInSchoolWorkspace && (
              <>
                <button
                  id="nav-audit"
                  onClick={() => handleNav('audit')}
                  className={getNavBtnClass(activeTab === 'audit')}
                >
                  <History className="w-4 h-4 shrink-0" />
                  <span>Platform Audit Trail</span>
                </button>

                <button
                  id="nav-notices"
                  onClick={() => handleNav('notices')}
                  className={getNavBtnClass(activeTab === 'notices')}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>Platform Broadcasts</span>
                </button>
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* PART 2: PARENT NAVIGATION (Locked down to View-Only Child Access) */}
            {/* ------------------------------------------------------------- */}
            {isParent && (
              <>
                <button
                  id="nav-students"
                  onClick={() => handleNav('students')}
                  className={getNavBtnClass(activeTab === 'students')}
                >
                  <Users className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>My Child</span>
                </button>

                <button
                  id="nav-attendance"
                  onClick={() => handleNav('attendance')}
                  className={getNavBtnClass(activeTab === 'attendance')}
                >
                  <ClipboardCheck className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>Attendance History</span>
                </button>

                <button
                  id="nav-notices"
                  onClick={() => handleNav('notices')}
                  className={getNavBtnClass(activeTab === 'notices')}
                >
                  <Bell className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>School Notices</span>
                </button>
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* PART 3: BURSAR / FINANCE OFFICER (Strictly isolated financial operations) */}
            {/* ------------------------------------------------------------- */}
            {isBursar && (
              <>
                <button
                  id="nav-finance"
                  onClick={() => handleNav('finance')}
                  className={getNavBtnClass(activeTab === 'finance')}
                >
                  <CreditCard className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Fees & Cashless Ledger</span>
                </button>

                <button
                  id="nav-messages"
                  onClick={() => handleNav('messages')}
                  className={getNavBtnClass(activeTab === 'messages')}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>Parent Reminders</span>
                </button>

                <button
                  id="nav-notices"
                  onClick={() => handleNav('notices')}
                  className={getNavBtnClass(activeTab === 'notices')}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>School Notices</span>
                </button>
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* PART 4: TEACHER NAVIGATION (Personal Teaching Workload Only) */}
            {/* ------------------------------------------------------------- */}
            {isTeacher && (
              <>
                <button
                  id="nav-attendance"
                  onClick={() => handleNav('attendance')}
                  className={getNavBtnClass(activeTab === 'attendance')}
                >
                  <ClipboardCheck className="w-4 h-4 shrink-0" />
                  <span>Roll Call & Register</span>
                </button>

                <button
                  id="nav-academics"
                  onClick={() => handleNav('academics')}
                  className={getNavBtnClass(activeTab === 'academics')}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Enter Marks & Scores</span>
                </button>

                <button
                  id="nav-classes"
                  onClick={() => handleNav('classes')}
                  className={getNavBtnClass(activeTab === 'classes')}
                >
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span>My Assigned Classes</span>
                </button>

                <button
                  id="nav-homework"
                  onClick={() => handleNav('homework')}
                  className={getNavBtnClass(activeTab === 'homework')}
                >
                  <BookOpen className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Homework & Resources</span>
                </button>

                <button
                  id="nav-messages"
                  onClick={() => handleNav('messages')}
                  className={getNavBtnClass(activeTab === 'messages')}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>Class & Parent Messages</span>
                </button>

                <button
                  id="nav-notices"
                  onClick={() => handleNav('notices')}
                  className={getNavBtnClass(activeTab === 'notices')}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>Staff Notices</span>
                </button>
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* PART 5: ACADEMIC COORDINATOR (Curriculum & Results Quality) */}
            {/* ------------------------------------------------------------- */}
            {isAcademicCoordinator && (
              <>
                <button
                  id="nav-academics"
                  onClick={() => handleNav('academics')}
                  className={getNavBtnClass(activeTab === 'academics')}
                >
                  <BookOpen className="w-4 h-4 shrink-0 text-purple-400" />
                  <span>Academics & Broadsheet</span>
                </button>

                <button
                  id="nav-classes"
                  onClick={() => handleNav('classes')}
                  className={getNavBtnClass(activeTab === 'classes')}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>Classes & Curriculum</span>
                </button>

                <button
                  id="nav-students"
                  onClick={() => handleNav('students')}
                  className={getNavBtnClass(activeTab === 'students')}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Student Academic Records</span>
                </button>

                <button
                  id="nav-homework"
                  onClick={() => handleNav('homework')}
                  className={getNavBtnClass(activeTab === 'homework')}
                >
                  <BookOpen className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Learning Resources</span>
                </button>

                <button
                  id="nav-notices"
                  onClick={() => handleNav('notices')}
                  className={getNavBtnClass(activeTab === 'notices')}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>School Notices</span>
                </button>
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* PART 6: REGISTRAR / ADMISSIONS DESK (Student Records & Intake) */}
            {/* ------------------------------------------------------------- */}
            {isRegistrar && (
              <>
                <button
                  id="nav-students"
                  onClick={() => handleNav('students')}
                  className={getNavBtnClass(activeTab === 'students')}
                >
                  <Users className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>Student Directory & Intake</span>
                </button>

                <button
                  id="nav-classes"
                  onClick={() => handleNav('classes')}
                  className={getNavBtnClass(activeTab === 'classes')}
                >
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span>Class Rosters & Placement</span>
                </button>

                <button
                  id="nav-approvals"
                  onClick={() => handleNav('approvals')}
                  className={getNavBtnClass(activeTab === 'approvals')}
                >
                  <FileCheck2 className="w-4 h-4 shrink-0 text-purple-400" />
                  <span>Absence & Doctor Slips</span>
                </button>

                <button
                  id="nav-notices"
                  onClick={() => handleNav('notices')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'notices'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>School Notices</span>
                </button>
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* PART 7: PRINCIPAL / HEAD TEACHER (Executive Oversight) */}
            {/* ------------------------------------------------------------- */}
            {isPrincipal && (
              <>
                <button
                  id="nav-academics"
                  onClick={() => handleNav('academics')}
                  className={getNavBtnClass(activeTab === 'academics')}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Result Approvals & Reports</span>
                </button>

                <button
                  id="nav-attendance"
                  onClick={() => handleNav('attendance')}
                  className={getNavBtnClass(activeTab === 'attendance')}
                >
                  <ClipboardCheck className="w-4 h-4 shrink-0" />
                  <span>Attendance Oversight</span>
                </button>

                <button
                  id="nav-approvals"
                  onClick={() => handleNav('approvals')}
                  className={getNavBtnClass(activeTab === 'approvals')}
                >
                  <FileCheck2 className="w-4 h-4 shrink-0 text-purple-400" />
                  <span>Digital Approvals & Slips</span>
                </button>

                <button
                  id="nav-students"
                  onClick={() => handleNav('students')}
                  className={getNavBtnClass(activeTab === 'students')}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Student Records</span>
                </button>

                <button
                  id="nav-classes"
                  onClick={() => handleNav('classes')}
                  className={getNavBtnClass(activeTab === 'classes')}
                >
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span>Classes & Arms</span>
                </button>

                <button
                  id="nav-staff"
                  onClick={() => handleNav('staff')}
                  className={getNavBtnClass(activeTab === 'staff')}
                >
                  <UserCog className="w-4 h-4 shrink-0" />
                  <span>Faculty & Staff</span>
                </button>

                <button
                  id="nav-notices"
                  onClick={() => handleNav('notices')}
                  className={getNavBtnClass(activeTab === 'notices')}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>School Notices</span>
                </button>

                <button
                  id="nav-audit"
                  onClick={() => handleNav('audit')}
                  className={getNavBtnClass(activeTab === 'audit')}
                >
                  <History className="w-4 h-4 shrink-0" />
                  <span>Audit Logs</span>
                </button>
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* PART 8: SCHOOL ADMINISTRATOR (Full Institutional Operations) */}
            {/* ------------------------------------------------------------- */}
            {((isAdmin && !isSuperAdmin) || (isSuperAdmin && isInSchoolWorkspace)) && (
              <>
                <button
                  id="nav-control-room"
                  onClick={() => handleNav('control_room')}
                  className={getNavBtnClass(activeTab === 'control_room')}
                >
                  <Activity className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Control Room & Faculty</span>
                  <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </button>

                <button
                  id="nav-students"
                  onClick={() => handleNav('students')}
                  className={getNavBtnClass(activeTab === 'students')}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Students & Admissions</span>
                </button>

                <button
                  id="nav-classes"
                  onClick={() => handleNav('classes')}
                  className={getNavBtnClass(activeTab === 'classes')}
                >
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span>Classes & Arms</span>
                </button>

                <button
                  id="nav-attendance"
                  onClick={() => handleNav('attendance')}
                  className={getNavBtnClass(activeTab === 'attendance')}
                >
                  <ClipboardCheck className="w-4 h-4 shrink-0" />
                  <span>Daily Attendance</span>
                </button>

                <button
                  id="nav-academics"
                  onClick={() => handleNav('academics')}
                  className={getNavBtnClass(activeTab === 'academics')}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Academics & Reports</span>
                </button>

                <button
                  id="nav-finance"
                  onClick={() => handleNav('finance')}
                  className={getNavBtnClass(activeTab === 'finance')}
                >
                  <CreditCard className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Bursary & Fee Ledger</span>
                </button>

                <button
                  id="nav-approvals"
                  onClick={() => handleNav('approvals')}
                  className={getNavBtnClass(activeTab === 'approvals')}
                >
                  <FileCheck2 className="w-4 h-4 shrink-0 text-purple-400" />
                  <span>Digital Approvals</span>
                </button>

                <button
                  id="nav-messages"
                  onClick={() => handleNav('messages')}
                  className={getNavBtnClass(activeTab === 'messages')}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>Direct Messaging</span>
                </button>

                <button
                  id="nav-staff"
                  onClick={() => handleNav('staff')}
                  className={getNavBtnClass(activeTab === 'staff')}
                >
                  <UserCog className="w-4 h-4 shrink-0" />
                  <span>Staff & Faculty</span>
                </button>

                <button
                  id="nav-notices"
                  onClick={() => handleNav('notices')}
                  className={getNavBtnClass(activeTab === 'notices')}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>School Notices</span>
                </button>

                <button
                  id="nav-audit"
                  onClick={() => handleNav('audit')}
                  className={getNavBtnClass(activeTab === 'audit')}
                >
                  <History className="w-4 h-4 shrink-0" />
                  <span>Audit Logs</span>
                </button>

                <button
                  id="nav-settings"
                  onClick={() => handleNav('settings')}
                  className={getNavBtnClass(activeTab === 'settings')}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>School Settings</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
