import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../common/Toast.tsx';
import {
  SchoolClass,
  Subject,
  SubjectResult,
  Student,
  AcademicConfig,
  ResultStatus,
} from '../../types/index.ts';
import {
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  Sparkles,
  BookOpen,
  Filter,
  Users,
  Info
} from 'lucide-react';

interface ScoreEntrySheetProps {
  classes: SchoolClass[];
  subjects: Subject[];
  config: AcademicConfig | null;
  onRefresh?: () => void;
}

interface StudentScoreRow {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  ca1: number | string;
  ca2: number | string;
  ca3: number | string;
  exam: number | string;
  teacherComment: string;
  existingResultId?: string;
  status?: ResultStatus;
}

export const ScoreEntrySheet: React.FC<ScoreEntrySheetProps> = ({
  classes,
  subjects,
  config,
}) => {
  const { user, role, isTeacher, isAdmin, isPrincipal, isAcademicCoordinator, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const canPublishScores = isAdmin || isPrincipal || isAcademicCoordinator || isSuperAdmin;

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedTerm, setSelectedTerm] = useState<'FIRST_TERM' | 'SECOND_TERM' | 'THIRD_TERM'>('FIRST_TERM');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('ses-2025-2026');

  const [students, setStudents] = useState<Student[]>([]);
  const [scoreRows, setScoreRows] = useState<StudentScoreRow[]>([]);
  const [existingResults, setExistingResults] = useState<SubjectResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [resultsStatus, setResultsStatus] = useState<ResultStatus | 'EMPTY'>('EMPTY');

  // Max score limits from config
  const ca1Max = config?.assessment_components.find((c) => c.code === 'ca1')?.max_score || 10;
  const ca2Max = config?.assessment_components.find((c) => c.code === 'ca2')?.max_score || 10;
  const ca3Max = config?.assessment_components.find((c) => c.code === 'ca3')?.max_score || 20;
  const examMax = config?.assessment_components.find((c) => c.code === 'exam')?.max_score || 60;

  // Fetch students for selected class and existing scores
  useEffect(() => {
    if (!selectedClassId) return;

    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        const [studentsRes, resultsRes] = await Promise.all([
          api.getStudents({ classId: selectedClassId, limit: 100 }),
          selectedSubjectId
            ? api.getSubjectResults({
                classId: selectedClassId,
                subjectId: selectedSubjectId,
                sessionId: selectedSessionId,
                term: selectedTerm,
              })
            : Promise.resolve({ results: [] }),
        ]);

        if (!isMounted) return;

        const classStudents = studentsRes.students || [];
        setStudents(classStudents);
        setExistingResults(resultsRes.results || []);

        // Map existing results to student rows
        const resultMap = new Map<string, SubjectResult>();
        resultsRes.results.forEach((r: SubjectResult) => {
          resultMap.set(r.student_id, r);
        });

        const rows: StudentScoreRow[] = classStudents.map((stu) => {
          const res = resultMap.get(stu.id);
          return {
            studentId: stu.id,
            studentName: `${stu.first_name} ${stu.last_name}`,
            admissionNumber: stu.admission_number,
            ca1: res?.ca1_score ?? '',
            ca2: res?.ca2_score ?? '',
            ca3: res?.ca3_score ?? '',
            exam: res?.exam_score ?? '',
            teacherComment: res?.teacher_subject_remark || '',
            existingResultId: res?.id,
            status: res?.status || 'DRAFT',
          };
        });

        setScoreRows(rows);

        // Compute overall status of sheet
        if (resultsRes.results.length === 0) {
          setResultsStatus('EMPTY');
        } else {
          const firstStatus = resultsRes.results[0]?.status || 'DRAFT';
          setResultsStatus(firstStatus);
        }
      } catch (err: any) {
        showToast('Failed to load class roster and academic records.', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedClassId, selectedSubjectId, selectedTerm, selectedSessionId]);

  // Handle score changes
  const handleScoreChange = (
    index: number,
    field: 'ca1' | 'ca2' | 'ca3' | 'exam',
    value: string
  ) => {
    let numVal: number | string = value;
    if (value !== '') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) return;

      // Validate max boundaries
      if (field === 'ca1' && parsed > ca1Max) numVal = ca1Max;
      else if (field === 'ca2' && parsed > ca2Max) numVal = ca2Max;
      else if (field === 'ca3' && parsed > ca3Max) numVal = ca3Max;
      else if (field === 'exam' && parsed > examMax) numVal = examMax;
      else if (parsed < 0) numVal = 0;
      else numVal = parsed;
    }

    setScoreRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: numVal };
      return updated;
    });
  };

  const handleCommentChange = (index: number, comment: string) => {
    setScoreRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], teacherComment: comment };
      return updated;
    });
  };

  // Quick helper to calculate total and grade for display
  const computeRowSummary = (row: StudentScoreRow) => {
    const c1 = row.ca1 === '' ? null : Number(row.ca1);
    const c2 = row.ca2 === '' ? null : Number(row.ca2);
    const c3 = row.ca3 === '' ? null : Number(row.ca3);
    const ex = row.exam === '' ? null : Number(row.exam);

    const hasAny = c1 !== null || c2 !== null || c3 !== null || ex !== null;
    if (!hasAny) return { total: '-', grade: '-', remark: '-' };

    const total = (c1 || 0) + (c2 || 0) + (c3 || 0) + (ex || 0);

    let grade = 'F';
    let remark = 'Fail';

    if (config?.grading_scale) {
      for (const item of config.grading_scale) {
        if (total >= item.min_score && total <= item.max_score) {
          grade = item.grade;
          remark = item.remark;
          break;
        }
      }
    } else {
      if (total >= 75) { grade = 'A'; remark = 'Excellent'; }
      else if (total >= 65) { grade = 'B'; remark = 'Very Good'; }
      else if (total >= 50) { grade = 'C'; remark = 'Credit'; }
      else if (total >= 40) { grade = 'D'; remark = 'Pass'; }
    }

    return { total, grade, remark };
  };

  // Save scores (Draft or Submitted)
  const handleSaveScores = async (targetStatus: 'DRAFT' | 'SUBMITTED') => {
    if (!selectedClassId || !selectedSubjectId) {
      showToast('Please select a class and subject first.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const entries = scoreRows.map((row) => ({
        studentId: row.studentId,
        ca1: row.ca1 === '' ? null : Number(row.ca1),
        ca2: row.ca2 === '' ? null : Number(row.ca2),
        ca3: row.ca3 === '' ? null : Number(row.ca3),
        exam: row.exam === '' ? null : Number(row.exam),
        teacherComment: row.teacherComment || undefined,
      }));

      const res = await api.saveSubjectResultsBatch({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        sessionId: selectedSessionId,
        term: selectedTerm,
        status: targetStatus,
        entries,
      });

      setResultsStatus(targetStatus);
      showToast(res.message);
    } catch (err: any) {
      showToast(err.message || 'Failed to save scores. Check connection.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Approve & Publish (Admin/Principal/Coordinator action)
  const handlePublishScores = async () => {
    if (!selectedClassId || !selectedSubjectId) return;
    setIsSaving(true);
    try {
      const res = await api.updateResultsStatus({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        sessionId: selectedSessionId,
        term: selectedTerm,
        targetStatus: 'PUBLISHED',
      });
      setResultsStatus('PUBLISHED');
      showToast(res.message);
    } catch (err: any) {
      showToast(err.message || 'Failed to publish results.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Revert back to draft for teacher corrections
  const handleRevertToDraft = async () => {
    if (!selectedClassId || !selectedSubjectId) return;
    setIsSaving(true);
    try {
      const res = await api.updateResultsStatus({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        sessionId: selectedSessionId,
        term: selectedTerm,
        targetStatus: 'DRAFT',
      });
      setResultsStatus('DRAFT');
      showToast(res.message);
    } catch (err: any) {
      showToast(err.message || 'Failed to revert results.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClass = (classes || []).find((c) => c.id === selectedClassId);
  const selectedSubject = (subjects || []).find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-4 text-xs">
      {/* Filter and Class/Subject Selection Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Continuous Assessment & Score Sheet</span>
            </h2>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Enter test, quiz, assignment, and terminal examination marks.
            </p>
          </div>

          {/* Current Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Sheet Status:</span>
            {resultsStatus === 'PUBLISHED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Published & Terminal
              </span>
            )}
            {resultsStatus === 'SUBMITTED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Submitted (Pending Review)
              </span>
            )}
            {resultsStatus === 'DRAFT' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                Draft in Progress
              </span>
            )}
            {resultsStatus === 'EMPTY' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                No Scores Saved Yet
              </span>
            )}
          </div>
        </div>

        {/* Dropdown selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Select Class Arm
            </label>
            <select
              id="score-class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-emerald-500 font-medium"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.level})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Select Subject
            </label>
            <select
              id="score-subject-select"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-emerald-500 font-medium"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Academic Term
            </label>
            <select
              id="score-term-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value as any)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-emerald-500 font-medium"
            >
              <option value="FIRST_TERM">First Term</option>
              <option value="SECOND_TERM">Second Term</option>
              <option value="THIRD_TERM">Third Term</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Academic Session
            </label>
            <select
              id="score-session-select"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-emerald-500 font-medium"
            >
              <option value="ses-2025-2026">2025/2026 Academic Session</option>
              <option value="ses-2024-2025">2024/2025 Academic Session</option>
            </select>
          </div>
        </div>
      </div>

      {/* Score Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table meta info bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">
              {selectedClass?.name || 'Class'} &bull; {selectedSubject?.name || 'Subject'}
            </span>
            <span>Roster: {students.length} Students</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="bg-slate-200/80 px-2 py-0.5 rounded font-mono">CA1: max {ca1Max}</span>
            <span className="bg-slate-200/80 px-2 py-0.5 rounded font-mono">CA2: max {ca2Max}</span>
            <span className="bg-slate-200/80 px-2 py-0.5 rounded font-mono">CA3: max {ca3Max}</span>
            <span className="bg-slate-200/80 px-2 py-0.5 rounded font-mono">Exam: max {examMax}</span>
            <span className="font-bold text-slate-700">Total: 100%</span>
          </div>
        </div>

        {/* Loading / Empty / Table */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs">Loading academic scores...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-medium text-slate-700">No students found in this class.</p>
            <p className="text-[11px] text-slate-400 mt-1">Enroll students into {selectedClass?.name} to begin recording marks.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold text-[11px]">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Student Name</th>
                  <th className="py-2.5 px-2 w-20 text-center font-mono">
                    CA 1 <span className="text-[10px] text-slate-400 font-normal">({ca1Max})</span>
                  </th>
                  <th className="py-2.5 px-2 w-20 text-center font-mono">
                    CA 2 <span className="text-[10px] text-slate-400 font-normal">({ca2Max})</span>
                  </th>
                  <th className="py-2.5 px-2 w-20 text-center font-mono">
                    CA 3 <span className="text-[10px] text-slate-400 font-normal">({ca3Max})</span>
                  </th>
                  <th className="py-2.5 px-2 w-20 text-center font-mono">
                    Exam <span className="text-[10px] text-slate-400 font-normal">({examMax})</span>
                  </th>
                  <th className="py-2.5 px-2 w-16 text-center font-bold text-slate-900">Total</th>
                  <th className="py-2.5 px-2 w-14 text-center font-bold">Grade</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scoreRows.map((row, idx) => {
                  const summary = computeRowSummary(row);
                  const isPassing = typeof summary.total === 'number' && summary.total >= (config?.pass_mark || 50);

                  return (
                    <tr
                      key={row.studentId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/40' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-800">{row.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {row.admissionNumber}
                        </div>
                      </td>

                      {/* CA 1 Input */}
                      <td className="py-1.5 px-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max={ca1Max}
                          step="0.5"
                          disabled={resultsStatus === 'PUBLISHED' && !canPublishScores}
                          value={row.ca1}
                          placeholder="-"
                          onChange={(e) => handleScoreChange(idx, 'ca1', e.target.value)}
                          className="w-16 py-1 px-1 text-center font-mono bg-white border border-slate-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </td>

                      {/* CA 2 Input */}
                      <td className="py-1.5 px-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max={ca2Max}
                          step="0.5"
                          disabled={resultsStatus === 'PUBLISHED' && !canPublishScores}
                          value={row.ca2}
                          placeholder="-"
                          onChange={(e) => handleScoreChange(idx, 'ca2', e.target.value)}
                          className="w-16 py-1 px-1 text-center font-mono bg-white border border-slate-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </td>

                      {/* CA 3 Input */}
                      <td className="py-1.5 px-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max={ca3Max}
                          step="0.5"
                          disabled={resultsStatus === 'PUBLISHED' && !canPublishScores}
                          value={row.ca3}
                          placeholder="-"
                          onChange={(e) => handleScoreChange(idx, 'ca3', e.target.value)}
                          className="w-16 py-1 px-1 text-center font-mono bg-white border border-slate-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </td>

                      {/* Exam Input */}
                      <td className="py-1.5 px-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max={examMax}
                          step="0.5"
                          disabled={resultsStatus === 'PUBLISHED' && !canPublishScores}
                          value={row.exam}
                          placeholder="-"
                          onChange={(e) => handleScoreChange(idx, 'exam', e.target.value)}
                          className="w-16 py-1 px-1 text-center font-mono bg-white border border-slate-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </td>

                      {/* Computed Total */}
                      <td className="py-2 px-2 text-center font-mono font-bold">
                        {summary.total !== '-' ? (
                          <span
                            className={`${
                              isPassing ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {summary.total}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Computed Grade */}
                      <td className="py-2 px-2 text-center font-bold">
                        {summary.grade !== '-' ? (
                          <span
                            className={`inline-block w-6 py-0.5 rounded text-[11px] font-mono ${
                              summary.grade === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : summary.grade === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : summary.grade === 'C'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {summary.grade}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Teacher remark */}
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          disabled={resultsStatus === 'PUBLISHED' && !canPublishScores}
                          value={row.teacherComment}
                          placeholder="e.g. Excellent progress"
                          onChange={(e) => handleCommentChange(idx, e.target.value)}
                          className="w-full py-1 px-2 text-xs bg-white border border-slate-200 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Action Toolbar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Changes are saved directly to school database. You can save as draft at any time.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Draft Save */}
            <button
              id="btn-save-draft-scores"
              type="button"
              disabled={isSaving || students.length === 0}
              onClick={() => handleSaveScores('DRAFT')}
              className="py-1.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            {/* Submit to Academic Office */}
            <button
              id="btn-submit-scores"
              type="button"
              disabled={isSaving || students.length === 0 || resultsStatus === 'PUBLISHED'}
              onClick={() => handleSaveScores('SUBMITTED')}
              className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Approval</span>
            </button>

            {/* Administrator & Coordinator Publishing Controls */}
            {canPublishScores && (
              <>
                {resultsStatus !== 'PUBLISHED' ? (
                  <button
                    id="btn-publish-scores"
                    type="button"
                    disabled={isSaving || students.length === 0}
                    onClick={handlePublishScores}
                    className="py-1.5 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve & Publish</span>
                  </button>
                ) : (
                  <button
                    id="btn-revert-scores"
                    type="button"
                    disabled={isSaving}
                    onClick={handleRevertToDraft}
                    className="py-1.5 px-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Reopen for Corrections</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
