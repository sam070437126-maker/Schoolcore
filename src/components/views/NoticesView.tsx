import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { Modal } from '../common/Modal.tsx';
import { api } from '../../lib/api.ts';
import { SchoolNotice, NoticeAudience, NoticePriority } from '../../types/index.ts';
import { useRealtimeSubscription } from '../../lib/supabase-realtime.ts';
import {
  Bell,
  Plus,
  Filter,
  Calendar,
  AlertTriangle,
  Pin,
  Trash2,
  Edit2,
  Users,
  CheckCircle2
} from 'lucide-react';

interface NoticesViewProps {
  initialOpenCreate?: boolean;
}

export const NoticesView: React.FC<NoticesViewProps> = ({ initialOpenCreate }) => {
  const { role, isAdmin, isPrincipal, isParent } = useAuth();
  const { showToast } = useToast();
  const canManage = (isAdmin || isPrincipal) && !isParent;

  const [notices, setNotices] = useState<SchoolNotice[]>([]);
  const [audienceFilter, setAudienceFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(!!initialOpenCreate);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedNotice, setSelectedNotice] = useState<SchoolNotice | null>(null);
  const [deleteNoticeId, setDeleteNoticeId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'EVERYONE' as NoticeAudience,
    priority: 'NORMAL' as NoticePriority,
    expires_at: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotices(audienceFilter);
      setNotices(res.notices);
    } catch (err: any) {
      showToast('Failed to load notices.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [audienceFilter]);

  // Real-time synchronization for notices
  useRealtimeSubscription('notices', () => {
    fetchNotices();
  });

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      message: '',
      audience: 'EVERYONE',
      priority: 'NORMAL',
      expires_at: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (n: SchoolNotice) => {
    setSelectedNotice(n);
    setFormData({
      title: n.title,
      message: n.message,
      audience: n.audience,
      priority: n.priority,
      expires_at: n.expires_at ? n.expires_at.split('T')[0] : '',
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      showToast('Please enter title and notice message.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createNotice(formData);
      showToast('School announcement published.');
      setIsCreateModalOpen(false);
      fetchNotices();
    } catch (err: any) {
      showToast(err.message || 'Failed to publish notice.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotice || !formData.title.trim()) return;
    setIsSubmitting(true);
    try {
      await api.updateNotice(selectedNotice.id, formData);
      showToast('Notice updated.');
      setIsEditModalOpen(false);
      fetchNotices();
    } catch (err: any) {
      showToast(err.message || 'Failed to update notice.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (noticeId: string) => {
    setDeleteNoticeId(noticeId);
  };

  const executeDeleteNotice = async () => {
    if (!deleteNoticeId) return;
    try {
      await api.deleteNotice(deleteNoticeId);
      showToast('Notice removed successfully.');
      setDeleteNoticeId(null);
      fetchNotices();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete notice.', 'error');
    }
  };

  return (
    <div id="notices-view" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            School Notices & Bulletins
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official announcements for teachers, staff, students, and parents
          </p>
        </div>

        {canManage && (
          <button
            id="post-notice-btn"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Notice</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-xs">
        <span className="text-slate-400 font-semibold text-[11px] uppercase ml-1 mr-2">Audience:</span>
        {['ALL', 'EVERYONE', 'TEACHERS', 'STUDENTS', 'PARENTS'].map((aud) => (
          <button
            key={aud}
            onClick={() => setAudienceFilter(aud)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              audienceFilter === aud
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {aud === 'ALL' ? 'All Notices' : aud}
          </button>
        ))}
      </div>

      {/* Notices List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div id="notices-empty-state" className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No notices posted</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {audienceFilter !== 'ALL'
              ? `There are no notices published for audience: ${audienceFilter}.`
              : 'Publish official school bulletins, announcements, or staff circulars.'}
          </p>
          {(isAdmin || isPrincipal) && (
            <button
              id="empty-post-notice-btn"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post New Notice</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {notices.map((n) => (
            <div
              key={n.id}
              id={`notice-card-${n.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4 hover:border-emerald-300 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      n.priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-800'
                        : n.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {n.priority}
                  </span>

                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    For: {n.audience}
                  </span>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(n.published_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{n.title}</h3>
                <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-line leading-relaxed">{n.message}</p>

                <div className="mt-3 text-[11px] text-slate-400">
                  Published by <strong className="text-slate-600 font-medium">{n.author_name}</strong>
                  {n.expires_at && ` • Expires ${new Date(n.expires_at).toLocaleDateString()}`}
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                  <button
                    id={`edit-notice-${n.id}`}
                    onClick={() => handleOpenEdit(n)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    title="Edit Notice"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    id={`delete-notice-${n.id}`}
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE NOTICE MODAL */}
      <Modal
        id="create-notice-modal"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Post School Notice"
        subtitle="Publish announcement to school staff, teachers, or students"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Title *</label>
            <input
              id="notice-title-input"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              placeholder="e.g. Mid-Term Examination Schedule"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
              <select
                id="notice-audience-select"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value as NoticeAudience })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              >
                <option value="EVERYONE">Everyone (School-wide)</option>
                <option value="TEACHERS">Teachers Only</option>
                <option value="STUDENTS">Students Only</option>
                <option value="PARENTS">Parents Only</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                id="notice-priority-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as NoticePriority })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              >
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Message Content *</label>
            <textarea
              id="notice-message-input"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              placeholder="Enter announcement details, dates, or guidelines..."
            />
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
              id="submit-notice-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT NOTICE MODAL */}
      <Modal
        id="edit-notice-modal"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Notice"
        subtitle={`Updating ${selectedNotice?.title}`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Audience</label>
              <select
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value as NoticeAudience })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="EVERYONE">Everyone</option>
                <option value="TEACHERS">Teachers Only</option>
                <option value="STUDENTS">Students Only</option>
                <option value="PARENTS">Parents Only</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as NoticePriority })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Message</label>
            <textarea
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
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
              {isSubmitting ? 'Updating...' : 'Update Notice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        id="delete-notice-confirm-modal"
        isOpen={!!deleteNoticeId}
        onClose={() => setDeleteNoticeId(null)}
        title="Confirm Notice Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to permanently remove this school announcement? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeleteNoticeId(null)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeDeleteNotice}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
            >
              Delete Notice
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
