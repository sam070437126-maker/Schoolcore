import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../common/Toast.tsx';
import {
  SchoolClass,
  Subject,
  StaffMember,
  AcademicConfig,
  TeacherSubjectAssignment,
} from '../../types/index.ts';
import {
  Settings2,
  Plus,
  Trash2,
  Save,
  UserCheck,
  CheckCircle2,
  Sliders,
  Scale,
  BookOpen
} from 'lucide-react';

interface AcademicSetupProps {
  classes: SchoolClass[];
  subjects: Subject[];
  staffList: StaffMember[];
  config: AcademicConfig | null;
  onConfigUpdated: (newConfig: AcademicConfig) => void;
}

export const AcademicSetup: React.FC<AcademicSetupProps> = ({
  classes,
  subjects,
  staffList,
  config,
  onConfigUpdated,
}) => {
  const { isAdmin, isPrincipal, isAcademicCoordinator, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const canManageSetup = isAdmin || isPrincipal || isAcademicCoordinator || isSuperAdmin;

  const [assignments, setAssignments] = useState<TeacherSubjectAssignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState<boolean>(true);

  // New assignment form
  const [assignTeacherId, setAssignTeacherId] = useState<string>(staffList[0]?.id || '');
  const [assignClassId, setAssignClassId] = useState<string>(classes[0]?.id || '');
  const [assignSubjectId, setAssignSubjectId] = useState<string>(subjects[0]?.id || '');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // Editable config state
  const [ca1Max, setCa1Max] = useState<number>(
    config?.assessment_components.find((c) => c.code === 'ca1')?.max_score || 10
  );
  const [ca2Max, setCa2Max] = useState<number>(
    config?.assessment_components.find((c) => c.code === 'ca2')?.max_score || 10
  );
  const [ca3Max, setCa3Max] = useState<number>(
    config?.assessment_components.find((c) => c.code === 'ca3')?.max_score || 20
  );
  const [examMax, setExamMax] = useState<number>(
    config?.assessment_components.find((c) => c.code === 'exam')?.max_score || 60
  );
  const [passMark, setPassMark] = useState<number>(config?.pass_mark || 50);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Fetch current assignments
  const loadAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const res = await api.getTeacherSubjectAssignments();
      setAssignments(res.assignments);
    } catch {
      showToast('Failed to load teacher subject assignments.', 'error');
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  // Handle Add Assignment
  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTeacherId || !assignClassId || !assignSubjectId) {
      showToast('Please select a teacher, class, and subject.', 'error');
      return;
    }

    setIsAssigning(true);
    try {
      await api.assignTeacherSubject({
        teacher_id: assignTeacherId,
        class_id: assignClassId,
        subject_id: assignSubjectId,
        academic_session_id: 'ses-2025-2026',
      });
      showToast('Teacher subject assignment registered.');
      loadAssignments();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign teacher.', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Delete Assignment
  const handleDeleteAssignment = async (id: string) => {
    try {
      await api.deleteTeacherSubjectAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      showToast('Assignment removed.');
    } catch {
      showToast('Failed to remove assignment.', 'error');
    }
  };

  // Handle Save Configuration
  const handleSaveConfig = async () => {
    const totalMax = ca1Max + ca2Max + ca3Max + examMax;
    if (totalMax !== 100) {
      showToast(`Total score weight must equal 100% (currently ${totalMax}%).`, 'error');
      return;
    }

    setIsSavingConfig(true);
    try {
      const updatedComponents = [
        { id: 'comp-ca1', name: 'Continuous Assessment 1 (Test)', code: 'ca1', max_score: ca1Max, weight_percentage: ca1Max },
        { id: 'comp-ca2', name: 'Continuous Assessment 2 (Assignment)', code: 'ca2', max_score: ca2Max, weight_percentage: ca2Max },
        { id: 'comp-ca3', name: 'Continuous Assessment 3 (Project/Mid-Term)', code: 'ca3', max_score: ca3Max, weight_percentage: ca3Max },
        { id: 'comp-exam', name: 'Terminal Examination', code: 'exam', max_score: examMax, weight_percentage: examMax },
      ];

      const res = await api.updateAcademicConfig({
        pass_mark: passMark,
        assessment_components: updatedComponents,
      });

      onConfigUpdated(res.config);
      showToast(res.message || 'Academic configuration updated.');
    } catch (err: any) {
      showToast(err.message || 'Failed to update academic configuration.', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
      {/* Column 1: Teacher Subject Assignments */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Teacher Subject Allocations</span>
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Assign instructors to teach specific subjects across classroom arms.
          </p>
        </div>

        {/* New Assignment Form */}
        {canManageSetup && (
          <form
            onSubmit={handleAddAssignment}
            className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5"
          >
            <div className="font-semibold text-slate-700 text-[11px]">
              Assign Teacher to Class Subject
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Teacher
                </label>
                <select
                  id="assign-teacher-select"
                  value={assignTeacherId}
                  onChange={(e) => setAssignTeacherId(e.target.value)}
                  className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded text-slate-800 text-xs font-medium"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Class Arm
                </label>
                <select
                  id="assign-class-select"
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                  className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded text-slate-800 text-xs font-medium"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Subject
                </label>
                <select
                  id="assign-subject-select"
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded text-slate-800 text-xs font-medium"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              id="btn-add-subject-assignment"
              type="submit"
              disabled={isAssigning}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAssigning ? 'Allocating...' : 'Allocate Instructor'}</span>
            </button>
          </form>
        )}

        {/* Existing Assignments List */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-600">
            Active Allocations ({assignments.length})
          </div>

          {isLoadingAssignments ? (
            <div className="py-6 text-center text-slate-400">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="py-6 text-center text-slate-500 italic bg-slate-50 rounded border border-slate-200">
              No teacher allocations created yet.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{a.teacher_name || 'Teacher'}</div>
                    <div className="text-[11px] text-slate-500">
                      {a.class_name} &bull; <span className="font-bold text-emerald-700">{a.subject_name}</span>
                    </div>
                  </div>

                  {canManageSetup && (
                    <button
                      onClick={() => handleDeleteAssignment(a.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Remove allocation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Continuous Assessment Weights & Grading Scale */}
      <div className="space-y-5">
        {/* CA Components & Weights */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Continuous Assessment (CA) Components</span>
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Configure maximum marks and weightings. The sum must total 100%.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                CA 1 (Test)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={ca1Max}
                onChange={(e) => setCa1Max(Number(e.target.value))}
                className="w-full py-1.5 px-2 font-mono bg-slate-50 border border-slate-300 rounded text-center text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                CA 2 (Assign)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={ca2Max}
                onChange={(e) => setCa2Max(Number(e.target.value))}
                className="w-full py-1.5 px-2 font-mono bg-slate-50 border border-slate-300 rounded text-center text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                CA 3 (Mid-Term)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={ca3Max}
                onChange={(e) => setCa3Max(Number(e.target.value))}
                className="w-full py-1.5 px-2 font-mono bg-slate-50 border border-slate-300 rounded text-center text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Examination
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={examMax}
                onChange={(e) => setExamMax(Number(e.target.value))}
                className="w-full py-1.5 px-2 font-mono bg-slate-50 border border-slate-300 rounded text-center text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="font-semibold text-slate-700">Total Weight: </span>
              <span
                className={`font-mono font-bold ${
                  ca1Max + ca2Max + ca3Max + examMax === 100
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                }`}
              >
                {ca1Max + ca2Max + ca3Max + examMax}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Pass Mark:</span>
              <input
                type="number"
                min="30"
                max="70"
                value={passMark}
                onChange={(e) => setPassMark(Number(e.target.value))}
                className="w-16 py-1 px-1.5 font-mono text-center bg-white border border-slate-300 rounded font-bold text-xs"
              />
              <span className="text-slate-500">%</span>
            </div>
          </div>

          {canManageSetup && (
            <button
              id="btn-save-academic-config"
              type="button"
              disabled={isSavingConfig}
              onClick={handleSaveConfig}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors ml-auto"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingConfig ? 'Saving...' : 'Save Assessment Scale'}</span>
            </button>
          )}
        </div>

        {/* School Standard Grading Scale */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>Standard Secondary School Grading Scale</span>
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Grade boundaries automatically applied across score sheets and report cards.
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <th className="py-2 px-3">Grade</th>
                  <th className="py-2 px-3">Score Range</th>
                  <th className="py-2 px-3">Remark</th>
                  <th className="py-2 px-3 text-right">GPA Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(config?.grading_scale || [
                  { id: '1', grade: 'A', min_score: 75, max_score: 100, remark: 'Excellent', gpa_point: 5.0 },
                  { id: '2', grade: 'B', min_score: 65, max_score: 74, remark: 'Very Good', gpa_point: 4.0 },
                  { id: '3', grade: 'C', min_score: 50, max_score: 64, remark: 'Credit', gpa_point: 3.0 },
                  { id: '4', grade: 'D', min_score: 45, max_score: 49, remark: 'Pass', gpa_point: 2.0 },
                  { id: '5', grade: 'E', min_score: 40, max_score: 44, remark: 'Fair', gpa_point: 1.0 },
                  { id: '6', grade: 'F', min_score: 0, max_score: 39, remark: 'Fail', gpa_point: 0.0 },
                ]).map((g) => (
                  <tr key={g.id}>
                    <td className="py-1.5 px-3 font-bold font-mono text-slate-900">{g.grade}</td>
                    <td className="py-1.5 px-3 font-mono text-slate-600">
                      {g.min_score} - {g.max_score}%
                    </td>
                    <td className="py-1.5 px-3 text-slate-700">{g.remark}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-500">
                      {g.gpa_point?.toFixed(1) || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
