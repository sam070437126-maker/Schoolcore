import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { Modal } from '../common/Modal.tsx';
import { AdminInvitationsModal } from '../admin/AdminInvitationsModal.tsx';
import { AdminUserAccountsModal } from '../admin/AdminUserAccountsModal.tsx';
import { api } from '../../lib/api.ts';
import { StaffMember, SchoolClass, Role } from '../../types/index.ts';
import {
  UserCog,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Edit2,
  UserCheck,
  UserX,
  GraduationCap,
  ShieldCheck,
  Briefcase,
  KeyRound,
  Users
} from 'lucide-react';

interface StaffViewProps {
  initialOpenCreate?: boolean;
}

export const StaffView: React.FC<StaffViewProps> = ({ initialOpenCreate }) => {
  const { role: currentRole, isAdmin, isPrincipal } = useAuth();
  const { showToast } = useToast();

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(!!initialOpenCreate);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isInvitationsModalOpen, setIsInvitationsModalOpen] = useState<boolean>(false);
  const [isUserAccountsModalOpen, setIsUserAccountsModalOpen] = useState<boolean>(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [assignModalStaff, setAssignModalStaff] = useState<StaffMember | null>(null);
  const [assignClassIds, setAssignClassIds] = useState<string[]>([]);
  const [isSavingAssign, setIsSavingAssign] = useState<boolean>(false);
  const [quickOtpData, setQuickOtpData] = useState<{ isOpen: boolean; name: string; code: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: 'TEACHER' as Role,
    email: '',
    phone: '',
    employee_id: '',
    assigned_classes: [] as string[],
    assigned_subjects: ['Mathematics'],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaffAndClasses = async () => {
    setIsLoading(true);
    try {
      const [staffRes, classRes] = await Promise.all([api.getStaff(), api.getClasses()]);
      setStaffList(staffRes?.staff || []);
      setClasses(classRes?.classes || []);
    } catch (err: any) {
      showToast('Failed to load staff records.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndClasses();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      first_name: '',
      last_name: '',
      role: 'TEACHER',
      email: '',
      phone: '',
      employee_id: `STAFF/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      assigned_classes: classes[0] ? [classes[0].id] : [],
      assigned_subjects: ['Mathematics'],
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (stf: StaffMember) => {
    setSelectedStaff(stf);
    const names = stf.full_name.split(' ');
    setFormData({
      first_name: names[0] || '',
      last_name: names.slice(1).join(' ') || '',
      role: stf.role,
      email: stf.email,
      phone: stf.phone,
      employee_id: stf.employee_id,
      assigned_classes: stf.assigned_classes || [],
      assigned_subjects: stf.assigned_subjects || [],
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) {
      showToast('Please fill in required staff fields.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createStaff(formData);
      showToast('Staff member added successfully.');
      setIsCreateModalOpen(false);
      fetchStaffAndClasses();
    } catch (err: any) {
      showToast(err.message || 'Failed to add staff member.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      await api.updateStaff(selectedStaff.id, formData);
      showToast('Staff member updated.');
      setIsEditModalOpen(false);
      fetchStaffAndClasses();
    } catch (err: any) {
      showToast(err.message || 'Failed to update staff.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (stf: StaffMember) => {
    const newStatus = stf.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!window.confirm(`Set ${stf.full_name}'s status to ${newStatus}?`)) return;
    try {
      await api.updateStaff(stf.id, { status: newStatus });
      showToast(`Staff status set to ${newStatus}.`);
      fetchStaffAndClasses();
    } catch (err: any) {
      showToast('Failed to update staff status.', 'error');
    }
  };

  const handleOpenQuickAssign = (stf: StaffMember) => {
    setAssignModalStaff(stf);
    setAssignClassIds(stf.assigned_classes || []);
  };

  const handleSaveQuickAssign = async () => {
    if (!assignModalStaff) return;
    setIsSavingAssign(true);
    try {
      await api.updateStaff(assignModalStaff.id, {
        assigned_classes: assignClassIds,
      });
      showToast(`Updated assigned classes for ${assignModalStaff.full_name}`, 'success');
      setAssignModalStaff(null);
      fetchStaffAndClasses();
    } catch (err: any) {
      showToast(err.message || 'Failed to update assignments.', 'error');
    } finally {
      setIsSavingAssign(false);
    }
  };

  const handleIssueQuickOtp = async (stf: StaffMember) => {
    try {
      const usersRes = await api.getAdminUsers();
      const existing = (usersRes?.users || []).find(
        (u: any) => (u.profile?.email || '').toLowerCase() === stf.email.toLowerCase()
      );
      if (existing) {
        const res = await api.regenerateUserOtp(existing.membership_id || existing.id);
        setQuickOtpData({ isOpen: true, name: stf.full_name, code: (res as any).otp_code || res.otpCode });
        showToast(`Generated 6-digit access code for ${stf.full_name}`, 'success');
      } else {
        const res = await api.createAdminUser({
          email: stf.email,
          full_name: stf.full_name,
          role: stf.role as any,
          phone: stf.phone,
        });
        setQuickOtpData({ isOpen: true, name: stf.full_name, code: res.otpCode });
        showToast(`Provisioned account & issued 6-digit code for ${stf.full_name}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to generate access code.', 'error');
    }
  };

  // Filter staff
  const filteredStaff = staffList.filter((stf) => {
    const matchesSearch =
      stf.full_name.toLowerCase().includes(search.toLowerCase()) ||
      stf.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      stf.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || stf.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div id="staff-view" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-emerald-600" />
            Staff & Faculty Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage school teachers, principals, administrators, and classroom assignments
          </p>
        </div>

        {(isAdmin || isPrincipal) && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              id="manage-accounts-otp-btn"
              onClick={() => setIsUserAccountsModalOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-slate-950" />
              <span>User Accounts & Access Codes</span>
            </button>
            <button
              id="invite-staff-btn"
              onClick={() => setIsInvitationsModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors border border-emerald-500/40 cursor-pointer"
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Invite via Email</span>
            </button>
            <button
              id="add-staff-btn"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Search and Role Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="staff-search-input"
            type="text"
            placeholder="Search by staff name, ID, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            id="staff-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-emerald-600"
          >
            <option value="ALL">All Roles</option>
            <option value="TEACHER">Teachers</option>
            <option value="PRINCIPAL">Principals</option>
            <option value="SCHOOL_ADMIN">Administrators</option>
            <option value="BURSAR">Bursars</option>
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <div id="staff-empty-state" className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <UserCog className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No staff members found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || roleFilter !== 'ALL'
              ? 'Try adjusting your search query or role filter.'
              : 'Add teachers and faculty members to assign classes and manage daily rolls.'}
          </p>
          {(isAdmin || isPrincipal) && !search && roleFilter === 'ALL' && (
            <button
              id="empty-add-staff-btn"
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff Member</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((stf) => (
            <div
              key={stf.id}
              id={`staff-card-${stf.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                      {stf.full_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{stf.full_name}</h3>
                      <p className="text-[10px] font-mono text-slate-400">{stf.employee_id}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      stf.role === 'SCHOOL_ADMIN' || stf.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : stf.role === 'PRINCIPAL'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {stf.role.replace('_', ' ')}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="mt-3.5 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{stf.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{stf.phone || 'No phone provided'}</span>
                  </div>
                </div>

                {/* Assigned Classes */}
                {stf.role === 'TEACHER' && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Assigned Classes
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {stf.assigned_classes && stf.assigned_classes.length > 0 ? (
                        stf.assigned_classes.map((clsId) => {
                          const cls = (classes || []).find((c) => c.id === clsId);
                          return (
                            <span
                              key={clsId}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                            >
                              {cls?.name || clsId}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No assigned classes</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              {(isAdmin || isPrincipal) && (
                <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                      stf.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        stf.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {stf.status}
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleOpenQuickAssign(stf)}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                      title="Assign classes to this teacher"
                    >
                      Assign Classes
                    </button>
                    <button
                      onClick={() => handleIssueQuickOtp(stf)}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      title="Generate 6-digit access code for device login"
                    >
                      <KeyRound className="w-3 h-3 text-amber-600" />
                      <span>Access Code</span>
                    </button>
                    <button
                      id={`edit-staff-${stf.id}`}
                      onClick={() => handleOpenEdit(stf)}
                      className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                      title="Edit Staff Member"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`toggle-staff-${stf.id}`}
                      onClick={() => handleToggleStatus(stf)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                      title={stf.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      {stf.status === 'ACTIVE' ? (
                        <UserX className="w-3.5 h-3.5" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      <Modal
        id="create-staff-modal"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Staff Member"
        subtitle="Create faculty profile and assign role permissions"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                id="staff-first-name"
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                placeholder="e.g. Samuel"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                id="staff-last-name"
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                placeholder="e.g. Adewale"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role / Position *</label>
              <select
                id="staff-role-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              >
                <option value="TEACHER">Classroom Teacher</option>
                <option value="PRINCIPAL">Principal / Vice Principal</option>
                <option value="SCHOOL_ADMIN">School Administrator</option>
                <option value="BURSAR">Bursar / Accounts Officer</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee ID *</label>
              <input
                id="staff-emp-id"
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
              <input
                id="staff-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                placeholder="teacher@brightfuture.edu.ng"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                id="staff-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                placeholder="+234 803 000 0000"
              />
            </div>
          </div>

          {formData.role === 'TEACHER' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assign Initial Classes</label>
              <div className="grid grid-cols-2 gap-2 border rounded-lg p-2.5 max-h-36 overflow-y-auto">
                {classes.map((cls) => {
                  const isChecked = formData.assigned_classes.includes(cls.id);
                  return (
                    <label key={cls.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              assigned_classes: [...formData.assigned_classes, cls.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              assigned_classes: formData.assigned_classes.filter((id) => id !== cls.id),
                            });
                          }
                        }}
                        className="rounded text-emerald-600"
                      />
                      <span>{cls.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              id="submit-staff-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STAFF MODAL */}
      <Modal
        id="edit-staff-modal"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Staff Member"
        subtitle={`Updating profile for ${selectedStaff?.full_name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="TEACHER">Classroom Teacher</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="SCHOOL_ADMIN">Administrator</option>
                <option value="BURSAR">Bursar</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* School-Verified Institutional Invitations Modal */}
      <AdminInvitationsModal
        isOpen={isInvitationsModalOpen}
        onClose={() => setIsInvitationsModalOpen(false)}
      />

      {/* User Accounts & Access Codes (OTP) Provisioning Modal */}
      <AdminUserAccountsModal
        isOpen={isUserAccountsModalOpen}
        onClose={() => setIsUserAccountsModalOpen(false)}
      />

      {/* QUICK ASSIGN CLASSES MODAL */}
      <Modal
        id="quick-assign-modal"
        isOpen={!!assignModalStaff}
        onClose={() => setAssignModalStaff(null)}
        title={`Assign Classes: ${assignModalStaff?.full_name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Select the classes taught by <strong>{assignModalStaff?.full_name}</strong>. The teacher will immediately be able to view these scholars and record attendance.
          </p>

          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 border rounded-xl">
            {classes.map((cls) => {
              const isSelected = assignClassIds.includes(cls.id);
              return (
                <label
                  key={cls.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAssignClassIds([...assignClassIds, cls.id]);
                      } else {
                        setAssignClassIds(assignClassIds.filter((id) => id !== cls.id));
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>{cls.name}</span>
                </label>
              );
            })}
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              onClick={() => setAssignModalStaff(null)}
              className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveQuickAssign}
              disabled={isSavingAssign}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {isSavingAssign ? 'Saving...' : 'Save Class Assignments'}
            </button>
          </div>
        </div>
      </Modal>

      {/* QUICK OTP DISPLAY MODAL */}
      <Modal
        id="quick-otp-modal"
        isOpen={!!quickOtpData?.isOpen}
        onClose={() => setQuickOtpData(null)}
        title="Faculty One-Time Access Passcode"
      >
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">{quickOtpData?.name}</h4>
          <div className="p-4 bg-slate-900 text-white rounded-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
              6-Digit One-Time Activation Passcode
            </span>
            <div className="text-3xl font-mono font-extrabold tracking-widest text-emerald-400">
              {quickOtpData?.code}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Valid for 14 days. Staff member can use this code to sign in directly without email activation.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                if (quickOtpData?.code) {
                  navigator.clipboard.writeText(quickOtpData.code);
                  showToast('Access code copied!', 'success');
                }
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
            >
              Copy 6-Digit Code
            </button>
            <button
              onClick={() => setQuickOtpData(null)}
              className="px-4 py-2 border rounded-lg text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
