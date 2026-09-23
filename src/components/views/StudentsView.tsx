import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { Modal } from '../common/Modal.tsx';
import { api } from '../../lib/api.ts';
import { Student, SchoolClass, Gender, StudentStatus } from '../../types/index.ts';
import { useRealtimeSubscription } from '../../lib/supabase-realtime.ts';
import {
  Users,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Archive,
  UserCheck,
  Phone,
  Mail,
  Home,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

interface StudentsViewProps {
  initialOpenCreate?: boolean;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ initialOpenCreate }) => {
  const { role, isAdmin, isPrincipal, isRegistrar, isSuperAdmin, isParent, school } = useAuth();
  const { showToast } = useToast();
  const canManage = (isAdmin || isPrincipal || isRegistrar || isSuperAdmin) && !isParent;

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(!!initialOpenCreate);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    isOpen: boolean;
    student: Student | null;
    newStatus: StudentStatus | null;
  }>({ isOpen: false, student: null, newStatus: null });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAttendanceStats, setStudentAttendanceStats] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'MALE' as Gender,
    date_of_birth: '2012-05-14',
    admission_number: '',
    current_class_id: '',
    house: 'Red House (Falcon)',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relationship: 'Father',
    address: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchClasses = async () => {
    try {
      const res = await api.getClasses();
      setClasses(res?.classes || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getStudents({
        search,
        classId: selectedClass,
        status: selectedStatus,
        page,
        limit: 15,
      });
      setStudents(res.students);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      showToast(err.message || 'Failed to load students list.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedClass, selectedStatus, page, showToast]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Real-time synchronization with Supabase and cross-tab events
  useRealtimeSubscription('students', () => {
    fetchStudents();
  });

  const handleOpenCreate = () => {
    const schoolPrefix = school?.code ? school.code.split('-')[0] : 'SCH';
    const currentYear = new Date().getFullYear();
    setFormData({
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: 'MALE',
      date_of_birth: '2012-05-14',
      admission_number: `${schoolPrefix}/${currentYear}/${Math.floor(100 + Math.random() * 900)}`,
      current_class_id: classes[0]?.id || '',
      house: 'Red House (Falcon)',
      guardian_name: '',
      guardian_phone: '',
      guardian_email: '',
      guardian_relationship: 'Father',
      address: '',
      notes: '',
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      first_name: student.first_name,
      middle_name: student.middle_name || '',
      last_name: student.last_name,
      gender: student.gender,
      date_of_birth: student.date_of_birth,
      admission_number: student.admission_number,
      current_class_id: student.current_class_id || '',
      house: student.house || 'Red House (Falcon)',
      guardian_name: student.guardian_name,
      guardian_phone: student.guardian_phone,
      guardian_email: student.guardian_email || '',
      guardian_relationship: student.guardian_relationship || 'Parent',
      address: student.address,
      notes: student.notes || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = async (student: Student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
    try {
      const res = await api.getStudentById(student.id);
      setSelectedStudent(res.student);
      setStudentAttendanceStats(res.attendanceStats);
    } catch (e) {
      // fallback
    }
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.first_name.trim()) errs.first_name = 'First name is required';
    if (!formData.last_name.trim()) errs.last_name = 'Last name is required';
    if (!formData.admission_number.trim()) errs.admission_number = 'Admission number is required';
    if (!formData.guardian_name.trim()) errs.guardian_name = 'Guardian name is required';
    if (!formData.guardian_phone.trim()) errs.guardian_phone = 'Guardian contact phone is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await api.createStudent(formData);
      showToast('Student enrolled successfully.');
      setIsCreateModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to enroll student.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !validateForm()) return;
    setIsSubmitting(true);
    try {
      await api.updateStudent(selectedStudent.id, formData);
      showToast('Student information updated.');
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to update student.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (student: Student, newStatus: StudentStatus) => {
    setConfirmStatusModal({
      isOpen: true,
      student,
      newStatus,
    });
  };

  const executeStatusChange = async () => {
    if (!confirmStatusModal.student || !confirmStatusModal.newStatus) return;
    const { student, newStatus } = confirmStatusModal;
    try {
      await api.changeStudentStatus(student.id, newStatus);
      showToast(`Student status updated to ${newStatus}.`);
      fetchStudents();
      if (isDetailModalOpen && selectedStudent?.id === student.id) {
        setSelectedStudent({ ...selectedStudent, status: newStatus });
      }
      setConfirmStatusModal({ isOpen: false, student: null, newStatus: null });
    } catch (err: any) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  if (isParent) {
    const child = students[0];
    return (
      <div id="parent-student-view" className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Enrolled Student
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {child ? `${child.last_name.toUpperCase()}, ${child.first_name} ${child.middle_name || ''}` : "My Child's Profile"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Official school record at {school?.name || 'SchoolCore'}
              </p>
            </div>
            {child && (
              <div className="text-left sm:text-right">
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Admission Number</div>
                <div className="text-lg font-mono font-bold text-emerald-700">{child.admission_number}</div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs animate-pulse">
              Loading child record from school database...
            </div>
          ) : !child ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No enrolled student records found linked to your parent account.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Core Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Current Class</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {child.current_class_name || 'JSS 2A'}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Gender</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{child.gender}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Date of Birth</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{child.date_of_birth}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">House</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{child.house || 'Red House (Falcon)'}</div>
                </div>
              </div>

              {/* Guardian & Contact Details */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Guardian Contact Information on File</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Primary Guardian:</span>
                    <span className="font-semibold text-slate-900">{child.guardian_name} ({child.guardian_relationship || 'Parent'})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Phone Number:</span>
                    <span className="font-semibold text-slate-900">{child.guardian_phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Email Address:</span>
                    <span className="font-semibold text-slate-900">{child.guardian_email || 'On file'}</span>
                  </div>
                </div>
                {child.address && (
                  <div className="pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-400 block mb-0.5">Residential Address:</span>
                    <span className="font-medium text-slate-800">{child.address}</span>
                  </div>
                )}
              </div>

              {/* View Only Notice */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-800">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <span>
                  This profile is locked to <strong>View Only</strong> mode for parent security. To request changes to personal records, please contact the school administration office.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="students-view" className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Students Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {total} student records in {classes.length} class arms
          </p>
        </div>

        {canManage && (
          <button
            id="add-student-btn"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="student-search-input"
            type="text"
            placeholder="Search by name, admission no..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-emerald-600 transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            id="student-class-filter"
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-emerald-600"
          >
            <option value="ALL">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <select
            id="student-status-filter"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-emerald-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive / Archived</option>
            <option value="GRADUATED">Graduated</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs animate-pulse">
            Loading student records from database...
          </div>
        ) : students.length === 0 ? (
          <div id="no-students-empty" className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No students found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || selectedClass !== 'ALL' || selectedStatus !== 'ALL'
                ? 'Try adjusting your search criteria or filter options.'
                : 'Get started by enrolling your first student into the school directory.'}
            </p>
            {canManage && !search && selectedClass === 'ALL' && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                Enroll Student
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="students-table" className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Adm No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Gender</th>
                  <th className="px-4 py-3 hidden md:table-cell">Guardian Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((s) => (
                  <tr key={s.id} id={`student-row-${s.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{s.admission_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {s.last_name.toUpperCase()}, {s.first_name} {s.middle_name || ''}
                      </div>
                      <div className="text-[10px] text-slate-400 sm:hidden">{s.gender} • {s.guardian_phone}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {s.current_class_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{s.gender}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-slate-900 font-medium">{s.guardian_name}</div>
                      <div className="text-slate-500 text-[11px]">{s.guardian_phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.status === 'INACTIVE'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`view-student-${s.id}`}
                          onClick={() => handleOpenDetail(s)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                          title="View Profile & Attendance"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              id={`edit-student-${s.id}`}
                              onClick={() => handleOpenEdit(s)}
                              className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title="Edit Student"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {s.status === 'ACTIVE' ? (
                              <button
                                id={`archive-student-${s.id}`}
                                onClick={() => handleStatusChange(s, 'INACTIVE')}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Deactivate / Archive"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                id={`activate-student-${s.id}`}
                                onClick={() => handleStatusChange(s, 'ACTIVE')}
                                className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Re-activate Student"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalPages}</span> ({total} records)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="pagination-prev"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="pagination-next"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE STUDENT MODAL */}
      <Modal
        id="create-student-modal"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Enroll New Student"
        subtitle="Add student record to class register and school database"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                id="form-first-name"
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                placeholder="e.g. Tunde"
              />
              {formErrors.first_name && <p className="text-rose-600 text-[10px] mt-0.5">{formErrors.first_name}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Middle Name</label>
              <input
                id="form-middle-name"
                type="text"
                value={formData.middle_name}
                onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                placeholder="e.g. Oluwaseun"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name (Surname) *</label>
              <input
                id="form-last-name"
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                placeholder="e.g. Adeyemi"
              />
              {formErrors.last_name && <p className="text-rose-600 text-[10px] mt-0.5">{formErrors.last_name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admission Number *</label>
              <input
                id="form-adm-no"
                type="text"
                value={formData.admission_number}
                onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 uppercase font-mono"
              />
              {formErrors.admission_number && <p className="text-rose-600 text-[10px] mt-0.5">{formErrors.admission_number}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Class Assignment</label>
              <select
                id="form-class-select"
                value={formData.current_class_id}
                onChange={(e) => setFormData({ ...formData, current_class_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                id="form-gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                id="form-dob"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">House (Sport/Interhouse)</label>
              <select
                id="form-house"
                value={formData.house}
                onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              >
                <option value="Red House (Falcon)">Red House (Falcon)</option>
                <option value="Blue House (Eagle)">Blue House (Eagle)</option>
                <option value="Green House (Cheetah)">Green House (Cheetah)</option>
                <option value="Yellow House (Lion)">Yellow House (Lion)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-semibold text-slate-800 text-xs mb-2">Guardian / Parent Contact Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Guardian Name *</label>
                <input
                  id="form-guardian-name"
                  type="text"
                  value={formData.guardian_name}
                  onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  placeholder="e.g. Engr. B. Adeyemi"
                />
                {formErrors.guardian_name && <p className="text-rose-600 text-[10px] mt-0.5">{formErrors.guardian_name}</p>}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Guardian Phone *</label>
                <input
                  id="form-guardian-phone"
                  type="tel"
                  value={formData.guardian_phone}
                  onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  placeholder="+234 802 000 0000"
                />
                {formErrors.guardian_phone && <p className="text-rose-600 text-[10px] mt-0.5">{formErrors.guardian_phone}</p>}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Relationship</label>
                <select
                  id="form-relationship"
                  value={formData.guardian_relationship}
                  onChange={(e) => setFormData({ ...formData, guardian_relationship: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Relative">Relative</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="block font-medium text-slate-700 mb-1">Residential Address</label>
              <input
                id="form-address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                placeholder="Street address, City, State"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              id="submit-student-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Saving to Database...' : 'Save & Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STUDENT MODAL */}
      <Modal
        id="edit-student-modal"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student Record"
        subtitle={`Updating profile for ${selectedStudent?.first_name} ${selectedStudent?.last_name}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Middle Name</label>
              <input
                type="text"
                value={formData.middle_name}
                onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Class Assignment</label>
              <select
                value={formData.current_class_id}
                onChange={(e) => setFormData({ ...formData, current_class_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">House</label>
              <input
                type="text"
                value={formData.house}
                onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-semibold text-slate-800 text-xs mb-2">Guardian Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Guardian Name *</label>
                <input
                  type="text"
                  value={formData.guardian_name}
                  onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Guardian Phone *</label>
                <input
                  type="tel"
                  value={formData.guardian_phone}
                  onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block font-medium text-slate-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
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

      {/* STUDENT DETAIL PROFILE MODAL */}
      <Modal
        id="student-detail-modal"
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Student Profile & Attendance"
        subtitle={`Admission ID: ${selectedStudent?.admission_number}`}
        maxWidth="lg"
      >
        {selectedStudent && (
          <div className="space-y-5 text-xs">
            {/* Header info card */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-base shadow-xs">
                {selectedStudent.first_name[0]}
                {selectedStudent.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {selectedStudent.first_name} {selectedStudent.middle_name || ''} {selectedStudent.last_name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                  <span className="font-semibold text-emerald-800">{selectedStudent.current_class_name}</span>
                  <span>•</span>
                  <span>{selectedStudent.gender}</span>
                  <span>•</span>
                  <span>{selectedStudent.house || 'No House'}</span>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  selectedStudent.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {selectedStudent.status}
              </span>
            </div>

            {/* Attendance Performance Metrics */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Attendance Summary
              </h4>
              {studentAttendanceStats ? (
                <div className="grid grid-cols-4 gap-2 text-center pt-1">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-medium">Recorded</span>
                    <p className="text-sm font-bold text-slate-900">{studentAttendanceStats.total}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 font-medium">Present</span>
                    <p className="text-sm font-bold text-emerald-900">{studentAttendanceStats.present}</p>
                  </div>
                  <div className="p-2 bg-rose-50 rounded border border-rose-100">
                    <span className="text-[10px] text-rose-700 font-medium">Absent</span>
                    <p className="text-sm font-bold text-rose-900">{studentAttendanceStats.absent}</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded border border-amber-100">
                    <span className="text-[10px] text-amber-700 font-medium">Late</span>
                    <p className="text-sm font-bold text-amber-900">{studentAttendanceStats.late}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-xs">No attendance records logged yet.</p>
              )}
            </div>

            {/* Guardian & Contact Info */}
            <div className="space-y-2 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-2">Guardian Contact & Details</h4>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Guardian Name</span>
                  <p className="font-medium text-slate-900">{selectedStudent.guardian_name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Relationship</span>
                  <p className="font-medium text-slate-900">{selectedStudent.guardian_relationship || 'Parent'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Phone</span>
                  <p className="font-medium text-slate-900">{selectedStudent.guardian_phone}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Date of Birth</span>
                  <p className="font-medium text-slate-900">{selectedStudent.date_of_birth}</p>
                </div>
              </div>
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Home Address</span>
                <p className="font-medium text-slate-900">{selectedStudent.address}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              {(isAdmin || isPrincipal) && (
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEdit(selectedStudent);
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Record
                </button>
              )}
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* STATUS CHANGE CONFIRMATION MODAL */}
      <Modal
        id="confirm-status-change-modal"
        isOpen={confirmStatusModal.isOpen}
        onClose={() => setConfirmStatusModal({ isOpen: false, student: null, newStatus: null })}
        title="Update Student Status"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to change the status of{' '}
            <strong className="text-slate-900">
              {confirmStatusModal.student?.first_name} {confirmStatusModal.student?.last_name}
            </strong>{' '}
            ({confirmStatusModal.student?.admission_number}) to{' '}
            <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800 text-[11px]">
              {confirmStatusModal.newStatus}
            </span>
            ?
          </p>
          {confirmStatusModal.newStatus === 'INACTIVE' && (
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Note: Marking a student as inactive removes them from active class roll calls while preserving their historical records and attendance history.
            </p>
          )}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              id="cancel-status-change-btn"
              onClick={() => setConfirmStatusModal({ isOpen: false, student: null, newStatus: null })}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              id="confirm-status-change-btn"
              onClick={executeStatusChange}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Confirm Update
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
