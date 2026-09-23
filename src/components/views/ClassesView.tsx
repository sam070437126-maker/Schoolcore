import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { Modal } from '../common/Modal.tsx';
import { api } from '../../lib/api.ts';
import { SchoolClass, StaffMember, Student } from '../../types/index.ts';
import { NavTab } from '../layout/Sidebar.tsx';
import {
  GraduationCap,
  Users,
  Plus,
  Edit2,
  BookOpen,
  ClipboardCheck,
  UserCheck,
  Sparkles,
  ArrowRight,
  School
} from 'lucide-react';

interface ClassesViewProps {
  onNavigate: (tab: NavTab, extra?: any) => void;
  initialOpenCreate?: boolean;
}

export const ClassesView: React.FC<ClassesViewProps> = ({ onNavigate, initialOpenCreate }) => {
  const { role, isAdmin, isPrincipal, isAcademicCoordinator, isSuperAdmin, staff: currentStaff } = useAuth();
  const { showToast } = useToast();
  const canManageClass = isAdmin || isPrincipal || isAcademicCoordinator || isSuperAdmin;

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(!!initialOpenCreate);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    level: 'JSS 1',
    arm: 'A',
    class_teacher_id: '',
    capacity: 45,
    subjects: ['Mathematics', 'English Language', 'Basic Science', 'Civic Education'],
  });
  const [subjectInput, setSubjectInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClassesAndStaff = async () => {
    setIsLoading(true);
    try {
      const [classRes, staffRes] = await Promise.all([api.getClasses(), api.getStaff()]);
      setClasses(classRes?.classes || []);
      setStaffList(staffRes?.staff || []);
    } catch (err: any) {
      showToast('Failed to load class information.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndStaff();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      level: 'JSS 1',
      arm: 'A',
      class_teacher_id: staffList[0]?.id || '',
      capacity: 45,
      subjects: ['Mathematics', 'English Language', 'Basic Science', 'Civic Education'],
    });
    setSubjectInput('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (cls: SchoolClass) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      level: cls.level,
      arm: cls.arm,
      class_teacher_id: cls.class_teacher_id || '',
      capacity: cls.capacity || 45,
      subjects: cls.subjects || ['Mathematics', 'English Language'],
    });
    setIsEditModalOpen(true);
  };

  const handleOpenRoster = async (cls: SchoolClass) => {
    setSelectedClass(cls);
    setIsRosterModalOpen(true);
    try {
      const res = await api.getClassById(cls.id);
      setClassStudents(res.students);
    } catch (e) {
      setClassStudents([]);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please specify the class name.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createClass(formData);
      showToast('Class created successfully.');
      setIsCreateModalOpen(false);
      fetchClassesAndStaff();
    } catch (err: any) {
      showToast(err.message || 'Failed to create class.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await api.updateClass(selectedClass.id, formData);
      showToast('Class updated successfully.');
      setIsEditModalOpen(false);
      fetchClassesAndStaff();
    } catch (err: any) {
      showToast(err.message || 'Failed to update class.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubject = () => {
    if (!subjectInput.trim()) return;
    if (!formData.subjects.includes(subjectInput.trim())) {
      setFormData({ ...formData, subjects: [...formData.subjects, subjectInput.trim()] });
    }
    setSubjectInput('');
  };

  const handleRemoveSubject = (sub: string) => {
    setFormData({ ...formData, subjects: formData.subjects.filter((s) => s !== sub) });
  };

  return (
    <div id="classes-view" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            Class Management & Arms
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {classes.length} active classes in current academic session
          </p>
        </div>

        {canManageClass && (
          <button
            id="add-class-btn"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Class</span>
          </button>
        )}
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div id="classes-empty-state" className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No classes registered</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create your first class arm (e.g. JSS 1A or SS 1 Science) to organize student registers and assign teachers.
          </p>
          {canManageClass && (
            <button
              id="empty-create-class-btn"
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Class</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const isAssignedToCurrentTeacher =
              currentStaff?.assigned_classes?.includes(cls.id) || cls.class_teacher_id === currentStaff?.id;

            return (
              <div
                key={cls.id}
                id={`class-card-${cls.id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-emerald-300 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {cls.level}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Arm {cls.arm}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{cls.name}</h3>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                      <Users className="w-3.5 h-3.5" />
                      <span>{cls.student_count || 0} Students</span>
                    </div>
                  </div>

                  {/* Class Teacher */}
                  <div className="mt-3.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs text-slate-700">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="text-slate-400 text-[10px] block font-semibold uppercase">Class Teacher</span>
                      <span className="font-medium text-slate-900 truncate">
                        {cls.class_teacher_name || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Subjects preview */}
                  <div className="mt-3">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold uppercase mb-1.5">
                      <BookOpen className="w-3 h-3" />
                      <span>Curriculum Subjects ({cls.subjects?.length || 0})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cls.subjects?.slice(0, 3).map((sub, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                        >
                          {sub}
                        </span>
                      ))}
                      {cls.subjects && cls.subjects.length > 3 && (
                        <span className="px-1.5 py-0.5 text-slate-400 text-[10px]">
                          +{cls.subjects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                  <button
                    id={`view-roster-${cls.id}`}
                    onClick={() => handleOpenRoster(cls)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                  >
                    <span>View Roster</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`class-scores-btn-${cls.id}`}
                      onClick={() => onNavigate('academics', { classId: cls.id, academicTab: 'scores' })}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Enter CA & Exam Scores"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                      <span>Scores</span>
                    </button>

                    <button
                      id={`class-attendance-btn-${cls.id}`}
                      onClick={() => onNavigate('attendance', { classId: cls.id })}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Take Attendance for this class"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>Roll Call</span>
                    </button>

                    {canManageClass && (
                      <button
                        id={`edit-class-btn-${cls.id}`}
                        onClick={() => handleOpenEdit(cls)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                        title="Edit Class Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      <Modal
        id="create-class-modal"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Class Arm"
        subtitle="Configure class level, arm, and assign class teacher"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Class Display Name *</label>
            <input
              id="form-class-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              placeholder="e.g. JSS 1A or SS 2 Science"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Level</label>
              <select
                id="form-class-level"
                value={formData.level}
                onChange={(e) => {
                  const lvl = e.target.value;
                  setFormData({
                    ...formData,
                    level: lvl,
                    name: `${lvl} ${formData.arm}`.trim(),
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              >
                <option value="JSS 1">JSS 1</option>
                <option value="JSS 2">JSS 2</option>
                <option value="JSS 3">JSS 3</option>
                <option value="SS 1">SS 1</option>
                <option value="SS 2">SS 2</option>
                <option value="SS 3">SS 3</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Arm / Stream</label>
              <input
                id="form-class-arm"
                type="text"
                value={formData.arm}
                onChange={(e) => {
                  const arm = e.target.value;
                  setFormData({
                    ...formData,
                    arm,
                    name: `${formData.level} ${arm}`.trim(),
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                placeholder="e.g. A, B, Science, Gold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assign Class Teacher</label>
            <select
              id="form-class-teacher-select"
              value={formData.class_teacher_id}
              onChange={(e) => setFormData({ ...formData, class_teacher_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
            >
              <option value="">-- Select Teacher --</option>
              {staffList.map((stf) => (
                <option key={stf.id} value={stf.id}>
                  {stf.full_name} ({stf.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subjects Taught</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubject();
                  }
                }}
                className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                placeholder="Add subject (e.g. Chemistry)..."
              />
              <button
                type="button"
                onClick={handleAddSubject}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-medium"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {formData.subjects.map((sub, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md flex items-center gap-1.5"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub)}
                    className="text-slate-400 hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Class...' : 'Save Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT CLASS MODAL */}
      <Modal
        id="edit-class-modal"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Class Information"
        subtitle={`Updating ${selectedClass?.name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Class Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Class Teacher</label>
            <select
              value={formData.class_teacher_id}
              onChange={(e) => setFormData({ ...formData, class_teacher_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">-- Select Teacher --</option>
              {staffList.map((stf) => (
                <option key={stf.id} value={stf.id}>
                  {stf.full_name} ({stf.role})
                </option>
              ))}
            </select>
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
              {isSubmitting ? 'Saving...' : 'Update Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CLASS ROSTER MODAL */}
      <Modal
        id="class-roster-modal"
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        title={`Student Roster — ${selectedClass?.name}`}
        subtitle={`Class Teacher: ${selectedClass?.class_teacher_name || 'Unassigned'}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-semibold text-slate-700">
              Enrolled Students ({classStudents.length})
            </span>
            <button
              onClick={() => {
                setIsRosterModalOpen(false);
                onNavigate('attendance', { classId: selectedClass?.id });
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Take Roll Call
            </button>
          </div>

          {classStudents.length === 0 ? (
            <p className="py-6 text-center text-slate-500">No students enrolled in this class yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {classStudents.map((s, idx) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {s.last_name.toUpperCase()}, {s.first_name} {s.middle_name || ''}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{s.admission_number}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">{s.gender}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
