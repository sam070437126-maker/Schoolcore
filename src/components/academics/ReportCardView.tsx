import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { StudentReportCard, SchoolClass, Student } from '../../types/index.ts';
import {
  Printer,
  Award,
  Calendar,
  User,
  GraduationCap,
  School,
  CheckCircle2,
  FileText,
  Save,
  Clock,
  ArrowLeft,
  Share2
} from 'lucide-react';

interface ReportCardViewProps {
  initialStudentId?: string;
  classes: SchoolClass[];
  onBack?: () => void;
}

export const ReportCardView: React.FC<ReportCardViewProps> = ({
  initialStudentId,
  classes,
  onBack,
}) => {
  const { user, isAdmin, isPrincipal, isTeacher } = useAuth();
  const { showToast } = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes?.[0]?.id || '');
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [selectedTerm, setSelectedTerm] = useState<string>('FIRST_TERM');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('ses-2025-2026');

  const [reportCard, setReportCard] = useState<StudentReportCard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSavingRemarks, setIsSavingRemarks] = useState<boolean>(false);

  // Remarks state
  const [formTeacherRemark, setFormTeacherRemark] = useState<string>('');
  const [principalRemark, setPrincipalRemark] = useState<string>('');
  const [nextTermDate, setNextTermDate] = useState<string>('January 12, 2026');

  // Load students for selected class
  useEffect(() => {
    if (!selectedClassId) return;

    api.getStudents({ classId: selectedClassId, limit: 100 }).then((res) => {
      const students = res.students || [];
      setClassStudents(students);
      if (!selectedStudentId && students.length > 0) {
        setSelectedStudentId(students[0].id);
      }
    });
  }, [selectedClassId]);

  // Load report card
  useEffect(() => {
    if (!selectedStudentId) return;

    let isMounted = true;
    setIsLoading(true);

    api
      .getStudentReportCard(selectedStudentId, selectedSessionId, selectedTerm)
      .then((res) => {
        if (isMounted) {
          setReportCard(res.reportCard);
          setFormTeacherRemark(res.reportCard.remarks?.form_teacher_remark || '');
          setPrincipalRemark(res.reportCard.remarks?.principal_remark || '');
          setNextTermDate(res.reportCard.remarks?.next_term_begins || 'January 12, 2026');
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          showToast(err.message || 'Failed to load student report card.', 'error');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStudentId, selectedSessionId, selectedTerm]);

  // Save remarks
  const handleSaveRemarks = async () => {
    if (!selectedStudentId) return;
    setIsSavingRemarks(true);
    try {
      await api.saveStudentRemarks(selectedStudentId, {
        sessionId: selectedSessionId,
        term: selectedTerm,
        formTeacherRemark,
        principalRemark,
        nextTermResumptionDate: nextTermDate,
      });
      showToast('Teacher and Principal remarks saved successfully.');
    } catch (err: any) {
      showToast('Failed to save remarks.', 'error');
    } finally {
      setIsSavingRemarks(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar (Hidden in Print) */}
      <div className="print:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Return to broadsheet"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Student Terminal Report Card</span>
            </h2>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Official academic performance statement with subject grades and remarks.
            </p>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            id="report-class-select"
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedStudentId('');
            }}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            id="report-student-select"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium max-w-[200px]"
          >
            {classStudents.map((stu) => (
              <option key={stu.id} value={stu.id}>
                {stu.first_name} {stu.last_name} ({stu.admission_number})
              </option>
            ))}
          </select>

          <select
            id="report-term-select"
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
          >
            <option value="FIRST_TERM">First Term</option>
            <option value="SECOND_TERM">Second Term</option>
            <option value="THIRD_TERM">Third Term</option>
          </select>

          <button
            id="btn-print-report-card"
            onClick={handlePrint}
            className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report Card</span>
          </button>
        </div>
      </div>

      {/* Actual Report Card Document Container */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Generating official report card...</p>
        </div>
      ) : !reportCard ? (
        <div className="py-20 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-700">No report card data found.</p>
          <p className="text-xs text-slate-400 mt-1">Select a student who has entered academic scores.</p>
        </div>
      ) : (
        <div
          id="official-report-card-sheet"
          className="bg-white rounded-xl border border-slate-300 shadow-md p-6 sm:p-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900"
        >
          {/* Header with School Crest & Information */}
          <div className="border-b-2 border-emerald-700 pb-4 mb-5 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-lg">
                <School className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900">
                {reportCard.school?.name || 'SchoolCore Secondary School'}
              </h1>
            </div>

            <p className="text-xs text-slate-600 max-w-lg mx-auto italic mb-1">
              "{reportCard.school?.motto || 'Excellence in Character, Diligence in Learning'}"
            </p>

            <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <span>{reportCard.school?.address || '12 Education Way, Knowledge District'}</span>
              <span>Tel: {reportCard.school?.phone || '+234 803 123 4567'}</span>
              <span>Email: {reportCard.school?.email || 'admin@schoolcore.edu.ng'}</span>
            </div>

            <div className="mt-3 inline-block px-4 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs uppercase tracking-wider">
              Terminal Academic Report &bull; {reportCard.term?.replace('_', ' ')} (
              {reportCard.academic_session?.name || '2025/2026'})
            </div>
          </div>

          {/* Student Particulars & Attendance Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            {/* Student Info */}
            <div className="space-y-1">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Student Name</span>
                <span className="font-bold text-slate-900 text-sm">
                  {reportCard.student?.first_name} {reportCard.student?.last_name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Admission No.</span>
                <span className="font-mono font-semibold text-slate-800">
                  {reportCard.student?.admission_number}
                </span>
              </div>
            </div>

            {/* Class & Arm */}
            <div className="space-y-1">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Class & Arm</span>
                <span className="font-semibold text-slate-900">
                  {reportCard.class?.name} ({reportCard.class?.level})
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Gender / House</span>
                <span className="text-slate-800">
                  {reportCard.student?.gender || 'N/A'} &bull; {reportCard.student?.house || 'Emerald House'}
                </span>
              </div>
            </div>

            {/* Attendance Metrics */}
            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-3">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Attendance Record</span>
              <div className="text-[11px] text-slate-700 space-y-0.5">
                <div>Total Sessions: <span className="font-bold">{reportCard.attendance?.total_sessions || 0}</span></div>
                <div>Present: <span className="font-bold text-emerald-700">{reportCard.attendance?.present_sessions || 0}</span></div>
                <div>Rate: <span className="font-bold">{reportCard.attendance?.attendance_rate || 0}%</span></div>
              </div>
            </div>
          </div>

          {/* Subject Scores Table */}
          <div className="mb-5 border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-[11px]">
                  <th className="py-2 px-3">Subject Name</th>
                  <th className="py-2 px-2 text-center w-14 font-mono">CA1 (10)</th>
                  <th className="py-2 px-2 text-center w-14 font-mono">CA2 (10)</th>
                  <th className="py-2 px-2 text-center w-14 font-mono">CA3 (20)</th>
                  <th className="py-2 px-2 text-center w-16 font-mono">Exam (60)</th>
                  <th className="py-2 px-2 text-center w-16 font-bold text-slate-900">Total (100)</th>
                  <th className="py-2 px-2 text-center w-14 font-bold">Grade</th>
                  <th className="py-2 px-3 min-w-[140px]">Teacher's Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportCard.subject_results?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-slate-500 italic">
                      No subject scores entered for this student yet.
                    </td>
                  </tr>
                ) : (
                  reportCard.subject_results.map((res, i) => (
                    <tr key={res.id} className={i % 2 === 1 ? 'bg-slate-50/50' : ''}>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {res.subject_name || 'Subject'}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-600">
                        {res.ca1_score !== null ? res.ca1_score : '-'}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-600">
                        {res.ca2_score !== null ? res.ca2_score : '-'}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-600">
                        {res.ca3_score !== null ? res.ca3_score : '-'}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-600">
                        {res.exam_score !== null ? res.exam_score : '-'}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">
                        {res.total_score !== null ? res.total_score : '-'}
                      </td>
                      <td className="py-2 px-2 text-center font-bold">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            res.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-900'
                              : res.grade === 'B'
                              ? 'bg-blue-100 text-blue-900'
                              : res.grade === 'C'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {res.grade || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-600 italic">
                        {res.teacher_subject_remark || res.remark || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Academic Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Obtained</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {reportCard.summary?.total_score_obtained || 0} /{' '}
                {reportCard.summary?.max_possible_score || 0}
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Overall Average</span>
              <span className="text-base font-bold text-emerald-800 font-mono">
                {reportCard.summary?.average_percentage || 0}%
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Class Position</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {reportCard.summary?.class_rank ? `${reportCard.summary.class_rank} / ${reportCard.summary.class_size}` : '-'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Terminal Standing</span>
              <span className="text-base font-bold text-slate-900">
                {reportCard.summary?.overall_grade === 'A'
                  ? 'Distinction'
                  : reportCard.summary?.overall_grade === 'B'
                  ? 'Very Good'
                  : reportCard.summary?.overall_grade === 'C'
                  ? 'Credit'
                  : 'Pass'}
              </span>
            </div>
          </div>

          {/* Teacher and Principal Remarks Section */}
          <div className="space-y-3 mb-5 border-t border-slate-200 pt-4 text-xs">
            {/* Form Teacher Remark */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Form Teacher's Assessment & Remark
              </label>
              <textarea
                rows={2}
                value={formTeacherRemark}
                onChange={(e) => setFormTeacherRemark(e.target.value)}
                placeholder="e.g. A well-behaved and conscientious student. Remarkable participation in class discussions."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-emerald-600 print:bg-transparent print:border-none print:p-0"
              />
            </div>

            {/* Principal Remark */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Principal's Official Remark & Endorsement
              </label>
              <textarea
                rows={2}
                value={principalRemark}
                onChange={(e) => setPrincipalRemark(e.target.value)}
                placeholder="e.g. Commendable performance. Promoted with merit."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-emerald-600 print:bg-transparent print:border-none print:p-0"
              />
            </div>

            {/* Resumption Date */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Next Term Resumes:</span>
                <input
                  type="text"
                  value={nextTermDate}
                  onChange={(e) => setNextTermDate(e.target.value)}
                  className="py-1 px-2 bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-emerald-600 print:bg-transparent print:border-none print:p-0"
                />
              </div>

              {/* Save Remarks button (hidden in print) */}
              <button
                id="btn-save-report-remarks"
                type="button"
                disabled={isSavingRemarks}
                onClick={handleSaveRemarks}
                className="print:hidden py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1.5 text-xs shadow-2xs self-end"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingRemarks ? 'Saving...' : 'Save Official Remarks'}</span>
              </button>
            </div>
          </div>

          {/* Official Signatures Line */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 w-40 mx-auto mb-1 pb-4 text-[10px] text-slate-400 italic">
                {reportCard.remarks?.form_teacher_name || 'Class Teacher'}
              </div>
              <span className="text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                Form Teacher's Signature
              </span>
            </div>

            <div>
              <div className="border-b border-slate-400 w-40 mx-auto mb-1 pb-4 text-[10px] text-slate-400 italic">
                {reportCard.remarks?.principal_name || 'School Principal'}
              </div>
              <span className="text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                Principal's Stamp & Signature
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
