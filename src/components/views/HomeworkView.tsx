import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { HomeworkAssignment, SchoolClass, Subject } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Upload,
  Send,
  ExternalLink,
  Award,
  Filter,
  Check,
  AlertCircle,
  MessageSquare,
  Users,
  X,
} from 'lucide-react';

interface HomeworkViewProps {
  initialClassId?: string;
}

export const HomeworkView: React.FC<HomeworkViewProps> = ({ initialClassId }) => {
  const { user, school, role, isTeacher, isParent, isAdmin, isPrincipal } = useAuth();
  const { showToast } = useToast();

  const [homeworkList, setHomeworkList] = useState<HomeworkAssignment[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [selectedHomeworkForSubmit, setSelectedHomeworkForSubmit] = useState<HomeworkAssignment | null>(null);
  const [showGradingModal, setShowGradingModal] = useState<boolean>(false);
  const [selectedHomeworkForGrading, setSelectedHomeworkForGrading] = useState<HomeworkAssignment | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    class_id: '',
    subject_id: '',
    title: '',
    instructions: '',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_marks: 20,
    attachment_title: 'Maths_Practice_Worksheet_Ch4.pdf',
    attachment_url: 'https://schoolcore.cloud/resources/worksheets/jss2-maths-algebra-ch4.pdf',
  });

  const [submissionData, setSubmissionData] = useState({
    student_id: 'stu-bright-01',
    student_name: 'Tunde Adeyemi',
    attachment_url: '',
    feedback: '',
  });

  const [gradingScores, setGradingScores] = useState<Record<string, { score: number; feedback: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hwRes, clsRes, subRes] = await Promise.all([
        api.getHomework(selectedClassId !== 'all' ? { classId: selectedClassId } : undefined),
        api.getClasses(),
        api.getSubjects(),
      ]);
      setHomeworkList(hwRes.homework || []);
      setClasses(clsRes.classes || []);
      setSubjects(subRes.subjects || []);

      if (clsRes.classes?.length > 0 && !formData.class_id) {
        setFormData((prev) => ({
          ...prev,
          class_id: clsRes.classes[0].id,
          subject_id: subRes.subjects?.[0]?.id || '',
        }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load assignments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.subject_id || !formData.title || !formData.instructions) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    const cls = classes.find((c) => c.id === formData.class_id);
    const sub = subjects.find((s) => s.id === formData.subject_id);

    setIsSubmitting(true);
    try {
      await api.createHomework({
        class_id: formData.class_id,
        class_name: cls?.name || 'Class',
        subject_id: formData.subject_id,
        subject_name: sub?.name || 'Subject',
        title: formData.title,
        instructions: formData.instructions,
        due_date: formData.due_date,
        total_marks: formData.total_marks,
        attachments: formData.attachment_title
          ? [{ title: formData.attachment_title, url: formData.attachment_url, type: 'PDF' }]
          : [],
      });

      showToast('Homework assignment published successfully!', 'success');
      setShowCreateModal(false);
      setFormData({
        class_id: classes[0]?.id || '',
        subject_id: subjects[0]?.id || '',
        title: '',
        instructions: '',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_marks: 20,
        attachment_title: 'Maths_Practice_Worksheet_Ch4.pdf',
        attachment_url: 'https://schoolcore.cloud/resources/worksheets/jss2-maths-algebra-ch4.pdf',
      });
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Could not publish homework.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHomeworkForSubmit) return;

    setIsSubmitting(true);
    try {
      await api.submitHomework(selectedHomeworkForSubmit.id, {
        student_id: submissionData.student_id,
        student_name: isParent ? 'Tunde Adeyemi (Submitted by Parent)' : user?.full_name || 'Student',
        attachment_url: submissionData.attachment_url || 'https://schoolcore.cloud/uploads/homework/solution_tunde.pdf',
        feedback: submissionData.feedback || 'Completed solutions submitted via SchoolCore portal.',
      });

      showToast('Homework solutions submitted successfully!', 'success');
      setShowSubmitModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit assignment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGradeSubmission = async (homeworkId: string, studentId: string) => {
    const gradeInfo = gradingScores[studentId];
    if (!gradeInfo || gradeInfo.score === undefined) {
      showToast('Please enter a score first.', 'error');
      return;
    }

    try {
      await api.gradeHomework(homeworkId, {
        student_id: studentId,
        score: Number(gradeInfo.score),
        feedback: gradeInfo.feedback || 'Good effort and methodical workings.',
      });

      showToast('Grade recorded successfully.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Could not save grade.', 'error');
    }
  };

  const filteredList = homeworkList.filter((hw) => {
    if (selectedClassId !== 'all' && hw.class_id !== selectedClassId) return false;
    const isPastDue = new Date(hw.due_date).getTime() < Date.now();
    if (selectedStatus === 'active' && isPastDue) return false;
    if (selectedStatus === 'overdue' && !isPastDue) return false;
    return true;
  });

  const canPublish = isAdmin || isPrincipal || isTeacher;

  return (
    <div className="space-y-6">
      {/* Header & Metric summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Homework & Learning Resources</h1>
              <p className="text-xs text-slate-500">
                Paperless assignment distribution, digital submissions, and real-time grading.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canPublish && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Homework</span>
            </button>
          )}
        </div>
      </div>

      {/* Control filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active & Open</option>
            <option value="overdue">Past Due Date</option>
          </select>
        </div>

        <div className="text-slate-500 font-medium">
          Showing <span className="text-slate-900 font-bold">{filteredList.length}</span> assignments
        </div>
      </div>

      {/* Homework assignments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Homework Assignments Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Assignments published by subject teachers will appear here for students and parents.
          </p>
          {canPublish && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
            >
              Create First Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((hw) => {
            const isPastDue = new Date(hw.due_date).getTime() < Date.now();
            const mySubmission = hw.submissions?.find(
              (s) => s.student_id === 'stu-bright-01' || s.student_name.includes(user?.full_name || '')
            );

            return (
              <div
                key={hw.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all hover:border-slate-300"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                        {hw.subject_name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {hw.class_name}
                      </span>
                      {isPastDue ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" /> Past Due Date
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Active & Open
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        Max Marks: <strong className="text-slate-700">{hw.total_marks}</strong>
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900">{hw.title}</h2>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{hw.instructions}</p>

                    {/* Attachments */}
                    {hw.attachments && hw.attachments.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                          Digital Resource Attachments:
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {hw.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-rose-500" />
                              <span>{att.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Due: <strong className="text-slate-800">{hw.due_date}</strong>
                        </span>
                      </div>
                      <div>
                        Teacher: <span className="font-semibold text-slate-700">{hw.teacher_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0">
                    {/* Status for Parent / Student */}
                    {isParent && (
                      <div className="text-right w-full sm:w-auto">
                        {mySubmission ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                              <Check className="w-3.5 h-3.5" />
                              {mySubmission.status === 'GRADED'
                                ? `Graded: ${mySubmission.score}/${hw.total_marks}`
                                : 'Solution Submitted'}
                            </span>
                            {mySubmission.feedback && (
                              <p className="text-[11px] text-slate-500 italic max-w-xs">
                                Teacher: "{mySubmission.feedback}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedHomeworkForSubmit(hw);
                              setShowSubmitModal(true);
                            }}
                            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Submit Solution</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Teacher / Admin Controls */}
                    {canPublish && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedHomeworkForGrading(hw);
                            setShowGradingModal(true);
                          }}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Submissions ({hw.submissions?.length || 0})</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Create Homework */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Publish Homework & Materials</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Class *</label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                    required
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 Practice: Simultaneous Equations"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructions & Problem Sets *</label>
                <textarea
                  rows={4}
                  placeholder="Provide clear step-by-step questions or instructions for the students..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Marks *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700">Attach Reference Material / Worksheet</span>
                <input
                  type="text"
                  placeholder="Attachment Title (e.g. Maths_Worksheet_Ch4.pdf)"
                  value={formData.attachment_title}
                  onChange={(e) => setFormData({ ...formData, attachment_title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-xs"
                />
                <input
                  type="url"
                  placeholder="Attachment URL or Drive Link"
                  value={formData.attachment_url}
                  onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish to Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Submit Assignment */}
      {showSubmitModal && selectedHomeworkForSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Submit Homework Solution</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHomework} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900">{selectedHomeworkForSubmit.title}</p>
                <p className="text-slate-500 mt-0.5">
                  {selectedHomeworkForSubmit.subject_name} • Max Marks: {selectedHomeworkForSubmit.total_marks}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Name</label>
                <input
                  type="text"
                  value={submissionData.student_name}
                  onChange={(e) => setSubmissionData({ ...submissionData, student_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Upload Answer Document / File Link
                </label>
                <input
                  type="text"
                  placeholder="https://cloud.schoolcore.ng/uploads/tunde_maths_answers.pdf"
                  value={submissionData.attachment_url}
                  onChange={(e) => setSubmissionData({ ...submissionData, attachment_url: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports scanned homework photos, PDF documents, or handwritten notes.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student / Parent Submission Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Completed all 5 algebra problems with step-by-step workings."
                  value={submissionData.feedback}
                  onChange={(e) => setSubmissionData({ ...submissionData, feedback: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit to Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Grading & Review Submissions */}
      {showGradingModal && selectedHomeworkForGrading && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Student Submissions & Digital Grading</h3>
                <p className="text-xs text-slate-500">
                  {selectedHomeworkForGrading.title} ({selectedHomeworkForGrading.class_name}) • Max Score:{' '}
                  {selectedHomeworkForGrading.total_marks}
                </p>
              </div>
              <button
                onClick={() => setShowGradingModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {selectedHomeworkForGrading.submissions?.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No student submissions have been uploaded yet.</p>
                </div>
              ) : (
                selectedHomeworkForGrading.submissions.map((sub) => (
                  <div key={sub.student_id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-sm">{sub.student_name}</div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'GRADED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    {sub.feedback && <p className="text-slate-600 italic">Notes: "{sub.feedback}"</p>}

                    {sub.attachment_url && (
                      <a
                        href={sub.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Student Solution File</span>
                      </a>
                    )}

                    {/* Teacher scoring controls */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">Score:</span>
                        <input
                          type="number"
                          min="0"
                          max={selectedHomeworkForGrading.total_marks}
                          placeholder={sub.score?.toString() || '0'}
                          defaultValue={sub.score ?? ''}
                          onChange={(e) =>
                            setGradingScores({
                              ...gradingScores,
                              [sub.student_id]: {
                                score: Number(e.target.value),
                                feedback: gradingScores[sub.student_id]?.feedback || sub.feedback || '',
                              },
                            })
                          }
                          className="w-16 border border-slate-300 rounded-lg px-2 py-1 bg-white font-bold text-center"
                        />
                        <span className="text-slate-400">/ {selectedHomeworkForGrading.total_marks}</span>
                      </div>

                      <input
                        type="text"
                        placeholder="Teacher remark / constructive feedback..."
                        defaultValue={sub.feedback || ''}
                        onChange={(e) =>
                          setGradingScores({
                            ...gradingScores,
                            [sub.student_id]: {
                              score: gradingScores[sub.student_id]?.score ?? (sub.score || 0),
                              feedback: e.target.value,
                            },
                          })
                        }
                        className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-2 py-1 bg-white"
                      />

                      <button
                        onClick={() => handleGradeSubmission(selectedHomeworkForGrading.id, sub.student_id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Save Score
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowGradingModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
