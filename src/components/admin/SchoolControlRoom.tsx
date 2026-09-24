import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { api } from '../../lib/api.ts';
import {
  StaffMember,
  SchoolClass,
  Subject,
  Student,
  DashboardStats,
  UserRole,
} from '../../types/index.ts';
import { AdminUserAccountsModal } from './AdminUserAccountsModal.tsx';
import {
  Activity,
  Users,
  GraduationCap,
  ClipboardCheck,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  Edit2,
  UserCheck,
  UserX,
  Copy,
  Check,
  BookOpen,
  Bell,
  ArrowRight,
  Sparkles,
  Link,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface SchoolControlRoomProps {
  onNavigate?: (tab: string, extra?: any) => void;
}

export const SchoolControlRoom: React.FC<SchoolControlRoomProps> = ({ onNavigate }) => {
  const { user, school, isAdmin, isPrincipal, isSuperAdmin, isPlatformStaff } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'teachers' | 'parents' | 'attendance' | 'overview'>('teachers');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('ALL');

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [userModalRole, setUserModalRole] = useState<UserRole>('TEACHER');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [selectedStaffForAssign, setSelectedStaffForAssign] = useState<StaffMember | null>(null);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [assignedSubjectNames, setAssignedSubjectNames] = useState<string[]>([]);
  const [isSavingAssign, setIsSavingAssign] = useState<boolean>(false);

  // Quick 6-digit access code popup
  const [otpModalData, setOtpModalData] = useState<{
    isOpen: boolean;
    name: string;
    role: string;
    code: string;
    email: string;
  }>({ isOpen: false, name: '', role: '', code: '', email: '' });
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);

  // Direct Teacher Broadcast Directive Modal
  const [isDirectiveModalOpen, setIsDirectiveModalOpen] = useState<boolean>(false);
  const [directiveTitle, setDirectiveTitle] = useState<string>('Important Operational Directive');
  const [directiveContent, setDirectiveContent] = useState<string>('');
  const [directiveTargetTeacherId, setDirectiveTargetTeacherId] = useState<string>('ALL');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);

  // Link Student to Parent Modal
  const [isLinkParentModalOpen, setIsLinkParentModalOpen] = useState<boolean>(false);
  const [selectedParentAccount, setSelectedParentAccount] = useState<any | null>(null);
  const [studentToLinkSearch, setStudentToLinkSearch] = useState<string>('');
  const [isLinkingStudent, setIsLinkingStudent] = useState<boolean>(false);

  // View Teacher's Students Modal
  const [isViewStudentsModalOpen, setIsViewStudentsModalOpen] = useState<boolean>(false);
  const [viewingTeacherStaff, setViewingTeacherStaff] = useState<StaffMember | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, staffRes, classRes, subRes, studRes, usersRes] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getStaff().catch(() => ({ staff: [] })),
        api.getClasses().catch(() => ({ classes: [] })),
        api.getSubjects().catch(() => ({ subjects: [] })),
        api.getStudents({ limit: 100 }).catch(() => ({ students: [] })),
        api.getAdminUsers().catch(() => ({ users: [] })),
      ]);

      if (statsRes) setStats(statsRes);
      setStaffList(staffRes?.staff || []);
      setClasses(classRes?.classes || []);
      setSubjects(subRes?.subjects || []);
      setStudents(studRes?.students || []);
      setUserAccounts(usersRes?.users || []);
    } catch (err: any) {
      console.error('Failed to load control room data:', err);
      showToast('Error syncing School Control Room state.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered teachers
  const teachers = useMemo(() => {
    return staffList.filter((s) => {
      const isTeacherRole = s.role === 'TEACHER' || s.role === 'PRINCIPAL' || s.role === 'ACADEMIC_COORDINATOR';
      if (!isTeacherRole) return false;

      const matchesSearch =
        searchQuery === '' ||
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.employee_id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedTeacherFilter === 'ACTIVE') return s.status === 'ACTIVE';
      if (selectedTeacherFilter === 'INACTIVE') return s.status !== 'ACTIVE';
      if (selectedTeacherFilter === 'NO_CLASSES') return !s.assigned_classes || s.assigned_classes.length === 0;
      if (selectedTeacherFilter === 'HAS_CLASSES') return s.assigned_classes && s.assigned_classes.length > 0;

      return true;
    });
  }, [staffList, searchQuery, selectedTeacherFilter]);

  // Parents list
  const parents = useMemo(() => {
    return userAccounts.filter((u) => u.role === 'PARENT');
  }, [userAccounts]);

  // Handle open Assign modal
  const handleOpenAssign = (teacher: StaffMember) => {
    setSelectedStaffForAssign(teacher);
    setAssignedClassIds(teacher.assigned_classes || []);
    setAssignedSubjectNames(teacher.assigned_subjects || ['Mathematics']);
    setIsAssignModalOpen(true);
  };

  // Save Class & Subject assignment
  const handleSaveAssignment = async () => {
    if (!selectedStaffForAssign) return;
    setIsSavingAssign(true);
    try {
      await api.updateStaff(selectedStaffForAssign.id, {
        assigned_classes: assignedClassIds,
        assigned_subjects: assignedSubjectNames,
      });

      showToast(`Successfully updated class and subject assignments for ${selectedStaffForAssign.full_name}`, 'success');
      setIsAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update assignments.', 'error');
    } finally {
      setIsSavingAssign(false);
    }
  };

  // Toggle teacher active status
  const handleToggleStatus = async (teacher: StaffMember) => {
    const newStatus = teacher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateStaff(teacher.id, { status: newStatus });
      showToast(`${teacher.full_name} is now marked as ${newStatus}.`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status.', 'error');
    }
  };

  // Generate / View 6-digit access code for staff or parent
  const handleGenerateOtp = async (userAccountOrStaff: any, roleType: string) => {
    try {
      const email = userAccountOrStaff.email;
      const targetUser = userAccounts.find(
        (u) => (u.profile?.email || '').toLowerCase() === (email || '').toLowerCase()
      );

      if (targetUser) {
        const res = await api.regenerateUserOtp(targetUser.membership_id || targetUser.id);
        setOtpModalData({
          isOpen: true,
          name: targetUser.profile?.full_name || userAccountOrStaff.full_name,
          role: roleType,
          code: (res as any).otp_code || res.otpCode,
          email: targetUser.profile?.email || email,
        });
        setCopiedOtp(false);
        showToast(`Generated instant 6-digit access code for ${targetUser.profile?.full_name}`, 'success');
        loadData();
      } else {
        // Staff member doesn't have a linked user account yet, provision it automatically
        const res = await api.createAdminUser({
          email: userAccountOrStaff.email,
          full_name: userAccountOrStaff.full_name,
          role: roleType as UserRole,
          phone: userAccountOrStaff.phone,
        });

        setOtpModalData({
          isOpen: true,
          name: userAccountOrStaff.full_name,
          role: roleType,
          code: (res as any).otp_code || res.otpCode,
          email: userAccountOrStaff.email,
        });
        setCopiedOtp(false);
        showToast(`Provisioned account & issued 6-digit code for ${userAccountOrStaff.full_name}`, 'success');
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to generate access code.', 'error');
    }
  };

  // Broadcast operational directive
  const handleBroadcastDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveContent.trim()) {
      showToast('Please enter the directive message content.', 'error');
      return;
    }
    setIsBroadcasting(true);
    try {
      await api.createNotice({
        title: directiveTitle,
        message: directiveContent,
        audience: 'TEACHERS',
        priority: 'URGENT',
      });

      showToast('Proactive directive successfully broadcasted to teachers!', 'success');
      setIsDirectiveModalOpen(false);
      setDirectiveContent('');
    } catch (err: any) {
      showToast(err.message || 'Failed to broadcast directive.', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Ping teachers with pending attendance
  const handlePingPendingAttendance = async () => {
    try {
      await api.createNotice({
        title: 'Daily Roll Call Action Required',
        message: `Attention All Form Teachers: Daily morning attendance roll call is currently pending for your assigned class. Please launch your class roll in SchoolCore immediately to record attendance.`,
        audience: 'TEACHERS',
        priority: 'URGENT',
      });
      showToast('Attendance reminder alert sent to all teachers!', 'success');
    } catch (err: any) {
      showToast('Failed to dispatch attendance reminder.', 'error');
    }
  };

  // Copy OTP code to clipboard
  const handleCopyOtp = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedOtp(true);
    showToast('6-digit access code copied to clipboard!', 'success');
    setTimeout(() => setCopiedOtp(false), 2500);
  };

  // Students taught by a specific teacher
  const studentsTaughtByViewingTeacher = useMemo(() => {
    if (!viewingTeacherStaff || !viewingTeacherStaff.assigned_classes) return [];
    return students.filter((st) => viewingTeacherStaff.assigned_classes?.includes(st.current_class_id));
  }, [viewingTeacherStaff, students]);

  return (
    <div id="school-control-room" className="space-y-6">
      {/* Top Banner / Pulse Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              School Operations Control Room
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Faculty Command & Institutional Oversight
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Proactively manage teachers, assign class registers, provision parent accounts with 6-digit access codes, and monitor daily operational readiness for {school?.name || 'your institution'}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setUserModalRole('TEACHER');
                setIsUserModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Teacher</span>
            </button>
            <button
              onClick={() => {
                setUserModalRole('PARENT');
                setIsUserModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Link className="w-4 h-4 text-emerald-400" />
              <span>Provision Parent & Link Child</span>
            </button>
            <button
              onClick={() => setIsDirectiveModalOpen(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Directive</span>
            </button>
          </div>
        </div>

        {/* Live Operational Metrics Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">Active Faculty</span>
            <div className="text-xl font-extrabold text-white mt-0.5">
              {staffList.filter((s) => s.status === 'ACTIVE').length} <span className="text-slate-500 text-xs font-normal">of {staffList.length}</span>
            </div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">Class Arms Covered</span>
            <div className="text-xl font-extrabold text-white mt-0.5">
              {classes.length} <span className="text-emerald-400 text-xs font-semibold">Registered</span>
            </div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">Enrolled Students</span>
            <div className="text-xl font-extrabold text-white mt-0.5">
              {stats?.total_students || students.length} <span className="text-slate-500 text-xs font-normal">Scholars</span>
            </div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">Roll Call Today</span>
              <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                {stats?.attendance_today?.marked_classes || 0} / {classes.length || 0}
              </div>
            </div>
            {(classes.length > 0 && (stats?.attendance_today?.marked_classes || 0) < classes.length) && (
              <button
                onClick={handlePingPendingAttendance}
                title="Send reminder to form tutors"
                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Ping</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveTab('teachers')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'teachers'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Teacher Operations & Classes ({teachers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('parents')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'parents'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Link className="w-4 h-4" />
          <span>Parent Directory & Child Links ({parents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Daily Classroom Roll Matrix</span>
        </button>
      </div>

      {/* TAB 1: TEACHER OPERATIONS & CLASSES */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search teacher by name, email, employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-emerald-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedTeacherFilter}
                onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-emerald-600"
              >
                <option value="ALL">All Faculty Members</option>
                <option value="ACTIVE">Active Teachers Only</option>
                <option value="HAS_CLASSES">Has Assigned Classes</option>
                <option value="NO_CLASSES">Unassigned Classes</option>
                <option value="INACTIVE">Inactive / On Leave</option>
              </select>

              <button
                onClick={loadData}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                title="Refresh faculty roster"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Teacher Cards Grid */}
          {teachers.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">No Faculty Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No teachers match the current search criteria. Click "Add Teacher" above to register faculty.
              </p>
              <button
                onClick={() => {
                  setUserModalRole('TEACHER');
                  setIsUserModalOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register First Teacher</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {teachers.map((teacher) => {
                const assignedClsObjects = (classes || []).filter((c) =>
                  (teacher.assigned_classes || []).includes(c.id)
                );
                const studentsInClassesCount = students.filter((s) =>
                  (teacher.assigned_classes || []).includes(s.current_class_id)
                ).length;

                return (
                  <div
                    key={teacher.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Teacher Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
                            {teacher.full_name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">{teacher.full_name}</h3>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  teacher.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {teacher.status}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {teacher.employee_id} • {teacher.role.replace('_', ' ')}
                            </p>
                          </div>
                        </div>

                        {/* Duty Toggle Button */}
                        <button
                          onClick={() => handleToggleStatus(teacher)}
                          title={teacher.status === 'ACTIVE' ? 'Set as Inactive / On Leave' : 'Set as Active'}
                          className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                            teacher.status === 'ACTIVE'
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {teacher.status === 'ACTIVE' ? <UserX className="w-4 h-4 text-slate-400" /> : <UserCheck className="w-4 h-4 text-emerald-600" />}
                        </button>
                      </div>

                      {/* Contact Info */}
                      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{teacher.phone || 'No phone'}</span>
                        </div>
                      </div>

                      {/* Assigned Classes */}
                      <div className="mt-3.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold uppercase tracking-wider text-slate-400">
                            Assigned Class Arms ({assignedClsObjects.length})
                          </span>
                          {studentsInClassesCount > 0 && (
                            <button
                              onClick={() => {
                                setViewingTeacherStaff(teacher);
                                setIsViewStudentsModalOpen(true);
                              }}
                              className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{studentsInClassesCount} Scholars Taught</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {assignedClsObjects.length > 0 ? (
                            assignedClsObjects.map((c) => (
                              <span
                                key={c.id}
                                className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                              >
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 italic font-medium">
                              No classes assigned yet. Click "Assign Classes" below.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Assigned Subjects */}
                      <div className="mt-3 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Subjects Taught
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {teacher.assigned_subjects && teacher.assigned_subjects.length > 0 ? (
                            teacher.assigned_subjects.map((sub, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                              >
                                {sub}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">None specified</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Proactive Action Footer */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenAssign(teacher)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Assign Classes & Subjects</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateOtp(teacher, teacher.role)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Generate instant 6-digit access code for device login"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>6-Digit Access Code</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PARENT DIRECTORY & CHILD LINKS */}
      {activeTab === 'parents' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-900 text-sm">Parent Accounts Directory</span>
              <p className="mt-0.5">School administrators manage parent accounts and link students directly.</p>
            </div>

            <button
              onClick={() => {
                setUserModalRole('PARENT');
                setIsUserModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Parent & Link Student</span>
            </button>
          </div>

          {parents.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
              <Link className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">No Parent Accounts Provisioned</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Parents do not self-register on the open website. The school administrator provisions parent accounts and securely binds their children's institutional records.
              </p>
              <button
                onClick={() => {
                  setUserModalRole('PARENT');
                  setIsUserModalOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Provision First Parent Account</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parents.map((parent) => {
                const linkedStudentList = parent.linked_students || [];
                return (
                  <div
                    key={parent.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-900 text-white flex items-center justify-center font-bold text-sm">
                            {parent.profile?.full_name?.[0] || 'P'}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{parent.profile?.full_name}</h3>
                            <p className="text-xs text-slate-500">{parent.profile?.email}</p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            parent.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {parent.status === 'ACTIVE' ? 'Active' : 'Pending Activation'}
                        </span>
                      </div>

                      {/* Linked Children section */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] mb-2">
                          <span className="font-bold uppercase tracking-wider text-slate-400">
                            Linked Children ({linkedStudentList.length})
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {linkedStudentList.length > 0 ? (
                            linkedStudentList.map((st: any) => (
                              <div
                                key={st.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="font-semibold text-slate-900">
                                    {st.first_name} {st.last_name}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ({st.admission_number})
                                  </span>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-white text-slate-700 text-[10px] font-bold border border-slate-200">
                                  {st.current_class_name || 'Assigned'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 italic">
                              No children currently linked to this parent account.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleGenerateOtp(parent, 'PARENT')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Issue 6-Digit Code</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserModalRole('PARENT');
                          setIsUserModalOpen(true);
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Manage Account</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DAILY CLASSROOM ROLL MATRIX */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Classroom Attendance Coverage</h3>
              <p className="text-xs text-slate-500">
                Track which classes have submitted morning roll call today and which teachers need to be prompted.
              </p>
            </div>

            <button
              onClick={handlePingPendingAttendance}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span>Ping Teachers with Pending Roll Call</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Class Arm</th>
                  <th className="px-4 py-3">Assigned Class Teacher</th>
                  <th className="px-4 py-3">Enrolled Scholars</th>
                  <th className="px-4 py-3">Today's Roll Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {classes.map((cls) => {
                  const assignedTeacher = staffList.find((s) => (s.assigned_classes || []).includes(cls.id) || s.id === (cls as any).form_tutor_id);
                  const enrolledCount = students.filter((s) => s.current_class_id === cls.id).length;

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{cls.name}</td>
                      <td className="px-4 py-3.5">
                        {assignedTeacher ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{assignedTeacher.full_name}</span>
                            <span className="text-[10px] font-mono text-slate-400">({assignedTeacher.employee_id})</span>
                          </div>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">{enrolledCount} scholars</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          Roll Call Monitored
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate('attendance', { classId: cls.id })}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Open Register
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN CLASSES & SUBJECTS TO TEACHER */}
      <Modal
        id="control-room-assign-classes-modal"
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Classes & Subjects: ${selectedStaffForAssign?.full_name}`}
      >
        <div className="space-y-5">
          <p className="text-xs text-slate-600">
            Select the class arms and subjects taught by <strong>{selectedStaffForAssign?.full_name}</strong>. The teacher will immediately receive live access to the students in these classes.
          </p>

          {/* Classes checkboxes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Assigned Class Arms
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
              {classes.map((cls) => {
                const isSelected = assignedClassIds.includes(cls.id);
                return (
                  <label
                    key={cls.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedClassIds([...assignedClassIds, cls.id]);
                        } else {
                          setAssignedClassIds(assignedClassIds.filter((id) => id !== cls.id));
                        }
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>{cls.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Subjects checkboxes / multi-select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Assigned Subjects
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
              {subjects.length > 0 ? (
                subjects.map((sub) => {
                  const isSelected = assignedSubjectNames.includes(sub.name);
                  return (
                    <label
                      key={sub.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignedSubjectNames([...assignedSubjectNames, sub.name]);
                          } else {
                            setAssignedSubjectNames(assignedSubjectNames.filter((s) => s !== sub.name));
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>{sub.name}</span>
                    </label>
                  );
                })
              ) : (
                ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Civic Education', 'Agricultural Science'].map((subName) => {
                  const isSelected = assignedSubjectNames.includes(subName);
                  return (
                    <label
                      key={subName}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignedSubjectNames([...assignedSubjectNames, subName]);
                          } else {
                            setAssignedSubjectNames(assignedSubjectNames.filter((s) => s !== subName));
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>{subName}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAssignment}
              disabled={isSavingAssign}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSavingAssign ? 'Saving Assignments...' : 'Save Assignments'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: BROADCAST OPERATIONAL DIRECTIVE */}
      <Modal
        id="control-room-directive-modal"
        isOpen={isDirectiveModalOpen}
        onClose={() => setIsDirectiveModalOpen(false)}
        title="Broadcast Urgent Operational Directive to Faculty"
      >
        <form onSubmit={handleBroadcastDirective} className="space-y-4">
          <p className="text-xs text-slate-600">
            Send an instant high-priority notice to faculty members. This appears immediately on teachers' dashboards and devices.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Directive Title
            </label>
            <input
              type="text"
              value={directiveTitle}
              onChange={(e) => setDirectiveTitle(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Recipient Faculty
            </label>
            <select
              value={directiveTargetTeacherId}
              onChange={(e) => setDirectiveTargetTeacherId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-emerald-600"
            >
              <option value="ALL">All Active Teachers & Faculty (Institutional Broadcast)</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.employee_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Directive Instructions
            </label>
            <textarea
              value={directiveContent}
              onChange={(e) => setDirectiveContent(e.target.value)}
              placeholder="e.g. Please ensure all Week 4 classroom attendance records are submitted before 10:00 AM today..."
              rows={4}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-emerald-600"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDirectiveModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBroadcasting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast Directive'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: 6-DIGIT ACCESS CODE POPUP */}
      <Modal
        id="control-room-otp-modal"
        isOpen={otpModalData.isOpen}
        onClose={() => setOtpModalData({ ...otpModalData, isOpen: false })}
        title="Institutional First-Time Access Code"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-base">{otpModalData.name}</h3>
            <p className="text-xs text-slate-500">{otpModalData.email} • {otpModalData.role}</p>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 my-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block mb-1">
              6-Digit One-Time Activation Passcode
            </span>
            <div className="text-3xl font-mono font-extrabold tracking-widest text-emerald-400">
              {otpModalData.code}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Valid for 14 days. The user enters this 6-digit code upon signing in from their mobile device or PC.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleCopyOtp(otpModalData.code)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {copiedOtp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedOtp ? 'Copied!' : 'Copy 6-Digit Code'}</span>
            </button>
            <button
              onClick={() => setOtpModalData({ ...otpModalData, isOpen: false })}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: VIEW STUDENTS TAUGHT BY TEACHER */}
      <Modal
        id="control-room-view-students-modal"
        isOpen={isViewStudentsModalOpen}
        onClose={() => setIsViewStudentsModalOpen(false)}
        title={`Scholars Taught by ${viewingTeacherStaff?.full_name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Total of <strong>{studentsTaughtByViewingTeacher.length} scholars</strong> enrolled across classes assigned to this teacher.
          </p>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50">
            {studentsTaughtByViewingTeacher.map((st) => (
              <div key={st.id} className="p-3 flex items-center justify-between text-xs bg-white">
                <div>
                  <span className="font-bold text-slate-900">
                    {st.last_name.toUpperCase()}, {st.first_name} {st.middle_name || ''}
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Adm: {st.admission_number} • Guardian: {st.guardian_name} ({st.guardian_phone})
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                  {st.current_class_name || 'Class'}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setIsViewStudentsModalOpen(false)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: ADMIN USER ACCOUNTS CREATION / PROVISIONING */}
      <AdminUserAccountsModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          loadData();
        }}
        preselectedRole={userModalRole}
      />
    </div>
  );
};
