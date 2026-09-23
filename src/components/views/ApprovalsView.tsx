import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { DigitalApproval, SchoolClass } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import {
  FileCheck2,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  PenTool,
  Calendar,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  Check,
  X,
  Filter,
} from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const { user, school, role, isParent, isTeacher, isAdmin, isPrincipal } = useAuth();
  const { showToast } = useToast();

  const [approvals, setApprovals] = useState<DigitalApproval[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedApprovalForAction, setSelectedApprovalForAction] = useState<DigitalApproval | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form
  const [formData, setFormData] = useState({
    type: 'SICK_NOTE' as 'SICK_NOTE' | 'LEAVE_OF_ABSENCE' | 'FIELD_TRIP' | 'POLICY_CONSENT',
    student_id: 'stu-bright-01',
    student_name: 'Tunde Adeyemi',
    class_id: 'cls-jss2a',
    class_name: 'JSS 2A',
    title: '',
    details: '',
    dates: new Date().toISOString().split('T')[0],
    signature_name: user?.full_name || 'Mrs. Ngozi Adeyemi',
  });

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setIsLoading(true);
    try {
      const [appRes, clsRes] = await Promise.all([api.getDigitalApprovals(), api.getClasses()]);
      setApprovals(appRes.approvals || []);
      setClasses(clsRes.classes || []);
    } catch (err: any) {
      showToast(err.message || 'Could not load digital approvals.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.details) {
      showToast('Please provide a title and explanation.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createDigitalApproval({
        type: formData.type,
        student_id: formData.student_id,
        student_name: formData.student_name,
        class_id: formData.class_id,
        class_name: formData.class_name,
        title: formData.title,
        details: formData.details,
        dates: formData.dates,
        signature_name: formData.signature_name,
      });

      showToast('Digital notice/approval submitted successfully.', 'success');
      setShowCreateModal(false);
      setFormData({
        type: 'SICK_NOTE',
        student_id: 'stu-bright-01',
        student_name: 'Tunde Adeyemi',
        class_id: 'cls-jss2a',
        class_name: 'JSS 2A',
        title: '',
        details: '',
        dates: new Date().toISOString().split('T')[0],
        signature_name: user?.full_name || 'Mrs. Ngozi Adeyemi',
      });
      loadApprovals();
    } catch (err: any) {
      showToast(err.message || 'Submission failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED' | 'SIGNED') => {
    if (!selectedApprovalForAction) return;

    setIsSubmitting(true);
    try {
      await api.updateDigitalApprovalStatus(selectedApprovalForAction.id, {
        status,
        signature_name: isParent ? user?.full_name : undefined,
        teacher_notes: actionNotes || undefined,
      });

      showToast(`Request marked as ${status}.`, 'success');
      setSelectedApprovalForAction(null);
      setActionNotes('');
      loadApprovals();
    } catch (err: any) {
      showToast(err.message || 'Update failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredList = approvals.filter((item) => {
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    return true;
  });

  const canApprove = isAdmin || isPrincipal || isTeacher;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-purple-100 text-purple-800 rounded-xl">
            <FileCheck2 className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Digital Approvals & Absence Reporting
            </h1>
            <p className="text-xs text-slate-500">
              Replace paper sick notes, field trip consent slips, and leave authorizations with verified digital signatures.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Approval / Sick Note</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Request Types</option>
              <option value="SICK_NOTE">Sick Note / Medical</option>
              <option value="LEAVE_OF_ABSENCE">Leave of Absence</option>
              <option value="FIELD_TRIP">Field Trip Consent</option>
              <option value="POLICY_CONSENT">Policy & Handbook Consent</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="SIGNED">Signed by Guardian</option>
              <option value="REJECTED">Declined</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 font-medium">
          Showing <span className="text-slate-900 font-bold">{filteredList.length}</span> digital records
        </div>
      </div>

      {/* Approvals Cards Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80">
          <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Digital Approvals Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Sick notes, excursion permission slips, and authorized absences will appear here.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 cursor-pointer"
          >
            Create First Notice
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((item) => {
            const isSick = item.type === 'SICK_NOTE';
            const isTrip = item.type === 'FIELD_TRIP_PERMISSION';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 transition-all hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isSick
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isTrip
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {item.type.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      Student: {item.student_name} ({item.class_name})
                    </span>
                    {item.dates && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {item.dates}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        item.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : item.status === 'SIGNED'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : item.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {item.status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {item.status === 'SIGNED' && <PenTool className="w-3.5 h-3.5" />}
                      {item.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                      {item.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                      <span>{item.status}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.details}</p>
                </div>

                {/* Digital Signature & Verification Box */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Digital Signature</span>
                      <span className="font-serif italic font-bold text-slate-900 text-sm">
                        {item.signature_name || item.parent_name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500">
                    <div>
                      Submitted by:{' '}
                      <strong className="text-slate-700">
                        {item.parent_name} ({item.parent_phone})
                      </strong>
                    </div>
                    {item.signed_at && (
                      <div>
                        Signed on: <span>{new Date(item.signed_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {item.teacher_notes && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                    <span className="font-bold block text-[11px]">Teacher / Administrative Remark:</span>
                    <p className="italic">"{item.teacher_notes}"</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  {canApprove && item.status === 'PENDING' && (
                    <button
                      onClick={() => setSelectedApprovalForAction(item)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      Review & Authorize
                    </button>
                  )}

                  {isParent && item.type === 'FIELD_TRIP_PERMISSION' && item.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setSelectedApprovalForAction(item);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Sign Permission Slip</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Create Approval Request */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Submit Digital Approval / Sick Note</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApproval} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Request Category *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  required
                >
                  <option value="SICK_NOTE">Sick Note & Medical Excuse</option>
                  <option value="LEAVE_OF_ABSENCE">Leave of Absence (Travel/Emergency)</option>
                  <option value="FIELD_TRIP">Field Trip / Excursion Consent</option>
                  <option value="POLICY_CONSENT">School Policy & Handbook Agreement</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Name *</label>
                  <input
                    type="text"
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class *</label>
                  <input
                    type="text"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Absence on Thursday due to Doctor Appointment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dates of Absence / Scope *</label>
                <input
                  type="text"
                  placeholder="e.g. 18th Oct 2025 – 19th Oct 2025"
                  value={formData.dates}
                  onChange={(e) => setFormData({ ...formData, dates: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Details & Reason *</label>
                <textarea
                  rows={3}
                  placeholder="State the medical condition or reason for excursion permission..."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1">
                <label className="block font-bold text-purple-950">Parent Digital Signature *</label>
                <input
                  type="text"
                  placeholder="Type your full legal name as digital signature"
                  value={formData.signature_name}
                  onChange={(e) => setFormData({ ...formData, signature_name: e.target.value })}
                  className="w-full border border-purple-300 rounded-lg p-2 bg-white font-serif italic text-sm"
                  required
                />
                <p className="text-[10px] text-purple-800">
                  By typing your name, you execute an electronic legal authorization under the Nigerian Evidence Act.
                </p>
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
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Sign & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Review & Authorize */}
      {selectedApprovalForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Review Digital Request</h3>
              <button
                onClick={() => setSelectedApprovalForAction(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">{selectedApprovalForAction.title}</div>
              <p className="text-slate-600">{selectedApprovalForAction.details}</p>
              <div className="text-[11px] text-slate-500 pt-1">
                Student: <strong>{selectedApprovalForAction.student_name}</strong> • Guardian:{' '}
                <strong>{selectedApprovalForAction.parent_name}</strong>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Administrative / Teacher Remark</label>
              <textarea
                rows={3}
                placeholder="e.g. Excused from school. Class prefect instructed to compile homework notes."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleUpdateStatus('REJECTED')}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Decline
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedApprovalForAction(null)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('APPROVED')}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Approve & Authorize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
