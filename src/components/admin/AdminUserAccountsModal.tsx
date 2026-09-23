import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal.tsx';
import { useToast } from '../common/Toast.tsx';
import { api } from '../../lib/api.ts';
import { UserRole, Student } from '../../types/index.ts';
import {
  Users,
  UserPlus,
  KeyRound,
  Copy,
  Check,
  RotateCw,
  Trash2,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  Share2,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Phone,
  Mail,
  UserX,
  Lock,
  X
} from 'lucide-react';

interface AdminUserAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'list' | 'create';
  preselectedRole?: UserRole;
}

interface EnrichedUserAccount {
  id: string;
  membership_id: string;
  profile_id: string;
  school_id: string;
  role: UserRole;
  status: 'ACTIVE' | 'PENDING_ACTIVATION';
  otp_code?: string;
  otp_expires_at?: string;
  first_login_at?: string;
  created_at: string;
  password_set?: boolean;
  admin_activation_code?: string;
  code_sent_to_admin_at?: string;
  profile: {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    created_at?: string;
  };
  linked_students?: Student[];
  staff?: any;
}

export const AdminUserAccountsModal: React.FC<AdminUserAccountsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'list',
  preselectedRole = 'PARENT',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>(defaultTab);

  // Data states
  const [users, setUsers] = useState<EnrichedUserAccount[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Form states for provisioning new account
  const [formRole, setFormRole] = useState<UserRole>(preselectedRole);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [temporaryPassword, setTemporaryPassword] = useState<string>('Welcome@2026');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [relationship, setRelationship] = useState<string>('Parent / Guardian');
  const [department, setDepartment] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Result card after account creation
  const [createdResult, setCreatedResult] = useState<{
    user: any;
    otpCode: string;
    temporaryPassword: string;
    role: UserRole;
    linkedStudents: Student[];
  } | null>(null);

  const fetchUsersAndStudents = async () => {
    setIsLoading(true);
    try {
      const [usersRes, studentsRes] = await Promise.all([
        api.getAdminUsers(),
        api.getStudents({ limit: 300 }),
      ]);
      setUsers(usersRes.users || []);
      setStudents(studentsRes.students || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load user accounts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsersAndStudents();
      setActiveTab(defaultTab);
      setFormRole(preselectedRole);
      setCreatedResult(null);
    }
  }, [isOpen, defaultTab, preselectedRole]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = u.profile?.full_name?.toLowerCase() || '';
      const em = u.profile?.email?.toLowerCase() || '';
      const ph = u.profile?.phone || '';
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        em.includes(query) ||
        ph.includes(query) ||
        (u.linked_students &&
          u.linked_students.some(
            (s) =>
              s.first_name.toLowerCase().includes(query) ||
              s.last_name.toLowerCase().includes(query) ||
              s.admission_number.toLowerCase().includes(query)
          ));

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Filtered students for parent linking
  const filteredStudentsForPicker = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 10);
    const q = studentSearch.toLowerCase().trim();
    return students
      .filter(
        (s) =>
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.admission_number.toLowerCase().includes(q) ||
          (s.current_class_name && s.current_class_name.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [students, studentSearch]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Please enter the user full name', 'error');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createAdminUser({
        full_name: fullName.trim(),
        email: email.trim(),
        role: formRole,
        phone: phone.trim() || undefined,
        initial_password: temporaryPassword.trim() || undefined,
        linked_student_ids: formRole === 'PARENT' ? selectedStudentIds : undefined,
        relationship: formRole === 'PARENT' ? relationship : undefined,
        department: formRole !== 'PARENT' ? department : undefined,
      });

      const linked = students.filter((s) => selectedStudentIds.includes(s.id));
      setCreatedResult({
        user: res.user,
        otpCode: res.otpCode,
        temporaryPassword: res.temporaryPassword || temporaryPassword,
        role: formRole,
        linkedStudents: linked,
      });

      showToast(`Account created for ${fullName.trim()} with 6-digit Access Code!`, 'success');
      // Reset input fields
      setFullName('');
      setEmail('');
      setPhone('');
      setSelectedStudentIds([]);
      setDepartment('');
      // Refresh background list
      fetchUsersAndStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to create user account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateOtp = async (membershipId: string, userName: string) => {
    setActionLoadingId(membershipId);
    try {
      const res = await api.regenerateUserOtp(membershipId);
      showToast(`New Access Code generated for ${userName}: ${res.otpCode}`, 'success');
      fetchUsersAndStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate access code', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActivateDirectly = async (membershipId: string, userName: string) => {
    setActionLoadingId(membershipId);
    try {
      await api.activateUser(membershipId);
      showToast(`${userName}'s account is now fully ACTIVE!`, 'success');
      fetchUsersAndStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to activate account', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (membershipId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to deactivate and remove access for ${userName}?`)) {
      return;
    }
    setActionLoadingId(membershipId);
    try {
      await api.deleteUser(membershipId);
      showToast(`Access revoked for ${userName}`, 'info');
      fetchUsersAndStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke user access', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string, label: string = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(label);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatHandoutMessage = (
    userProfile: { full_name: string; email: string },
    userRole: string,
    code: string,
    tempPass: string,
    linkedStudentsNames?: string[]
  ) => {
    const studentLine =
      linkedStudentsNames && linkedStudentsNames.length > 0
        ? `\nLinked Student(s): ${linkedStudentsNames.join(', ')}`
        : '';

    return `*SchoolCore Portal Access Invitation*
Hello ${userProfile.full_name},
Your official school account has been provisioned as [${userRole}].

*Your Login Credentials:*
• Login Email: ${userProfile.email}
• Initial Password: ${tempPass}
• First-Time Access Code (OTP): *${code}*${studentLine}

*Instructions:*
1. Visit the school portal
2. Enter your email and password
3. When prompted, enter your 6-digit access code: *${code}*
4. Set your permanent password to complete activation.`;
  };

  const pendingCount = users.filter((u) => u.status === 'PENDING_ACTIVATION').length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;

  return (
    <Modal
      id="admin-user-accounts-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="School User Accounts & Access Codes"
      subtitle="Provision accounts for Parents, Teachers, & Staff and manage First-Time 6-Digit Access Codes"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('list');
                setCreatedResult(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Accounts</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-200 ml-1">
                {users.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Provision Account & Code</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {activeCount} Active
            </span>
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium border border-amber-200 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              {pendingCount} Pending Code
            </span>
          </div>
        </div>

        {/* TAB 1: ACCOUNTS LIST */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user, email, student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-emerald-600"
                >
                  <option value="ALL">All Roles</option>
                  <option value="PARENT">Parents</option>
                  <option value="TEACHER">Teachers</option>
                  <option value="BURSAR">Bursars</option>
                  <option value="PRINCIPAL">Principals</option>
                  <option value="SCHOOL_ADMIN">School Admins</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-emerald-600"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_ACTIVATION">Pending First-Time Code</option>
                  <option value="ACTIVE">Active Users</option>
                </select>

                <button
                  type="button"
                  onClick={fetchUsersAndStudents}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Refresh List"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* List Table / Cards */}
            {isLoading ? (
              <div className="space-y-2 py-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No school accounts found</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? 'Try adjusting your search filters.'
                    : 'Click "+ Provision Account & Code" to add parents or teachers.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Provision First Account
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {filteredUsers.map((u) => {
                  const isPending = u.status === 'PENDING_ACTIVATION';
                  const isWorking = actionLoadingId === u.membership_id;

                  return (
                    <div
                      key={u.membership_id}
                      className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      {/* Left info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'PARENT'
                              ? 'bg-blue-100 text-blue-700'
                              : u.role === 'TEACHER'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {u.profile?.full_name?.[0] || 'U'}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-slate-900 truncate">
                              {u.profile?.full_name}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                u.role === 'PARENT'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : u.role === 'TEACHER'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}
                            >
                              {u.role.replace('_', ' ')}
                            </span>

                            {isPending ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                Pending Code
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Active
                              </span>
                            )}

                            {u.password_set ? (
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1"
                                title="Personal password configured by user"
                              >
                                <Lock className="w-2.5 h-2.5 text-slate-500" />
                                Password Set
                              </span>
                            ) : (
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-50/60 text-amber-800 border border-amber-200/60 flex items-center gap-1"
                                title="Default initial password active"
                              >
                                <KeyRound className="w-2.5 h-2.5 text-amber-600" />
                                Default Password
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 truncate">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {u.profile?.email}
                            </span>
                            {u.profile?.phone && (
                              <span className="flex items-center gap-1 truncate">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {u.profile.phone}
                              </span>
                            )}
                          </div>

                          {/* Linked Students for parents */}
                          {u.role === 'PARENT' && u.linked_students && u.linked_students.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              <span className="text-[10px] text-slate-400">Ward(s):</span>
                              {u.linked_students.map((st) => (
                                <span
                                  key={st.id}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200"
                                >
                                  <GraduationCap className="w-2.5 h-2.5 text-blue-500" />
                                  {st.first_name} {st.last_name}
                                  {st.current_class_name && (
                                    <span className="text-slate-400">
                                      ({st.current_class_name})
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: OTP Code & Actions */}
                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                        {isPending && (u.otp_code || u.admin_activation_code) ? (
                          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300/80 px-2.5 py-1 rounded-lg">
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            <div className="text-right">
                              <span className="text-[9px] block text-amber-700 font-medium uppercase leading-none">
                                Access Code
                              </span>
                              <span className="font-mono font-bold text-xs tracking-wider text-amber-950">
                                {u.otp_code || u.admin_activation_code}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const codeToCopy = (u.otp_code || u.admin_activation_code)!;
                                copyToClipboard(codeToCopy, u.membership_id, `Access Code ${codeToCopy} copied!`);
                              }}
                              className="p-1 text-amber-700 hover:bg-amber-100 rounded transition-colors ml-1 cursor-pointer"
                              title="Copy Access Code"
                            >
                              {copiedId === u.membership_id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : null}

                        {/* Handout copy button */}
                        {isPending && (u.otp_code || u.admin_activation_code) && (
                          <button
                            type="button"
                            onClick={() => {
                              const studentNames = u.linked_students?.map(
                                (s) => `${s.first_name} ${s.last_name}`
                              );
                              const codeToUse = (u.otp_code || u.admin_activation_code)!;
                              const msg = formatHandoutMessage(
                                u.profile,
                                u.role,
                                codeToUse,
                                'Welcome@2026',
                                studentNames
                              );
                              copyToClipboard(
                                msg,
                                `msg-${u.membership_id}`,
                                'Full invitation message copied for WhatsApp/SMS!'
                              );
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Copy Full Handout Message (WhatsApp/SMS)"
                          >
                            {copiedId === `msg-${u.membership_id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {/* Regenerate OTP */}
                        {isPending && (
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleRegenerateOtp(u.membership_id, u.profile.full_name)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-slate-200 transition-colors"
                            title="Regenerate new 6-digit Code"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${isWorking ? 'animate-spin' : ''}`} />
                          </button>
                        )}

                        {/* Direct Activate Override */}
                        {isPending && (
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleActivateDirectly(u.membership_id, u.profile.full_name)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Activate account directly without waiting for OTP"
                          >
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>Authorize</span>
                          </button>
                        )}

                        {/* Deactivate */}
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleDeleteUser(u.membership_id, u.profile.full_name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
                          title="Revoke access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROVISION NEW ACCOUNT */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            {createdResult ? (
              /* Success Result Card (Handout for Admin to give user) */
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">
                        Account Provisioned Successfully!
                      </h4>
                      <p className="text-xs text-emerald-700">
                        Give this 6-digit Access Code to the user for their first-time login
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200/60 text-emerald-900 uppercase">
                    {createdResult.role}
                  </span>
                </div>

                {/* Big Code Card */}
                <div className="bg-white border border-emerald-300/80 rounded-xl p-4 text-center space-y-2 shadow-xs">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    First-Time 6-Digit Access Code (OTP)
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-mono font-black text-emerald-700 tracking-widest bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-200 select-all">
                      {createdResult.otpCode}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          createdResult.otpCode,
                          'created-code',
                          `Access Code ${createdResult.otpCode} copied!`
                        )
                      }
                      className="p-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                      title="Copy Code"
                    >
                      {copiedId === 'created-code' ? (
                        <Check className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Valid for 14 days. User must enter this code when signing in for the first time.
                  </p>
                </div>

                {/* Credential summary */}
                <div className="bg-white/80 rounded-xl p-3 text-xs space-y-1.5 border border-emerald-100 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Full Name:</span>
                    <span className="font-semibold">{createdResult.user.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Login Email:</span>
                    <span className="font-semibold font-mono">{createdResult.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Initial Password:</span>
                    <span className="font-semibold font-mono">{createdResult.temporaryPassword}</span>
                  </div>
                  {createdResult.linkedStudents && createdResult.linkedStudents.length > 0 && (
                    <div className="flex justify-between pt-1 border-t border-emerald-100">
                      <span className="text-slate-500">Linked Students:</span>
                      <span className="font-semibold">
                        {createdResult.linkedStudents.map((s) => `${s.first_name} ${s.last_name}`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const names = createdResult.linkedStudents.map((s) => `${s.first_name} ${s.last_name}`);
                      const msg = formatHandoutMessage(
                        createdResult.user,
                        createdResult.role,
                        createdResult.otpCode,
                        createdResult.temporaryPassword,
                        names
                      );
                      copyToClipboard(msg, 'full-handout', 'Full Welcome Instructions copied to clipboard!');
                    }}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Full Welcome Message (WhatsApp / SMS)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatedResult(null)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    + Add Another User
                  </button>
                </div>
              </div>
            ) : (
              /* Provisioning Form */
              <form onSubmit={handleCreateAccount} className="space-y-4">
                {/* Role Picker */}
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">
                    Account Role
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {[
                      { role: 'PARENT', label: 'Parent' },
                      { role: 'TEACHER', label: 'Teacher' },
                      { role: 'BURSAR', label: 'Bursar' },
                      { role: 'PRINCIPAL', label: 'Principal' },
                      { role: 'ACADEMIC_COORDINATOR', label: 'Coordinator' },
                      { role: 'REGISTRAR', label: 'Registrar' },
                    ].map((item) => (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => setFormRole(item.role as UserRole)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          formRole === item.role
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={formRole === 'PARENT' ? 'e.g. Mrs. Folashade Adeyemi' : 'e.g. Samuel Adewale'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-emerald-600"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. parent@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone */}
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+234 803 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-emerald-600"
                    />
                  </div>

                  {/* Temporary Password */}
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Temporary Initial Password
                    </label>
                    <input
                      type="text"
                      required
                      value={temporaryPassword}
                      onChange={(e) => setTemporaryPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {/* PARENT SPECIFIC: LINK STUDENTS */}
                {formRole === 'PARENT' && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-blue-950">
                          Link Students / Children to Parent
                        </span>
                      </div>
                      <span className="text-[11px] text-blue-700 font-medium">
                        {selectedStudentIds.length} selected
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search student by name or admission number..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs text-slate-900 focus:outline-blue-500"
                      />
                      <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs text-slate-700 focus:outline-blue-500"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Parent / Guardian">Guardian</option>
                        <option value="Sponsor">Sponsor</option>
                      </select>
                    </div>

                    {/* Selected chips */}
                    {selectedStudentIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedStudentIds.map((id) => {
                          const s = students.find((st) => st.id === id);
                          if (!s) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-medium border border-blue-300"
                            >
                              <span>
                                {s.first_name} {s.last_name} ({s.current_class_name || 'Class'})
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleStudentSelection(id)}
                                className="text-blue-600 hover:text-blue-900 rounded-full"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Available student search results */}
                    <div className="max-h-32 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-blue-200">
                      {filteredStudentsForPicker.length === 0 ? (
                        <p className="text-[11px] text-slate-400 text-center py-2">
                          No students found matching your query
                        </p>
                      ) : (
                        filteredStudentsForPicker.map((st) => {
                          const isSelected = selectedStudentIds.includes(st.id);
                          return (
                            <div
                              key={st.id}
                              onClick={() => toggleStudentSelection(st.id)}
                              className={`flex items-center justify-between p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded text-blue-600"
                                />
                                <span>
                                  {st.first_name} {st.last_name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({st.admission_number})
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {st.current_class_name || 'No Class'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* STAFF SPECIFIC FIELDS */}
                {formRole !== 'PARENT' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Department / Faculty Area (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Science Department, Mathematics, Bursary"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-emerald-600"
                    />
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSubmitting ? 'Provisioning Account...' : 'Provision Account & Generate 6-Digit Access Code'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
export default AdminUserAccountsModal;
