import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.tsx';
import { useToast } from '../common/Toast.tsx';
import { api } from '../../lib/api.ts';
import { AdminInvitation, UserRole } from '../../types/index.ts';
import { useRealtimeDashboard } from '../../hooks/useRealtimeDashboard.ts';
import {
  Mail,
  UserPlus,
  ShieldCheck,
  Copy,
  Check,
  RotateCw,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  Lock,
} from 'lucide-react';

interface AdminInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId?: string;
  schoolName?: string;
}

export const AdminInvitationsModal: React.FC<AdminInvitationsModalProps> = ({
  isOpen,
  onClose,
  schoolId,
  schoolName,
}) => {
  const { showToast } = useToast();
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<UserRole>('TEACHER');

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const res = await api.getInvitations();
      setInvitations(res.invitations || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load institutional invitations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInvitations();
    }
  }, [isOpen]);

  // Hook into Realtime Dashboard for live state updates
  useRealtimeDashboard(schoolId);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast('Please provide a valid institutional email address.', 'error');
      return;
    }

    setIsDispatching(true);
    try {
      const res = await api.createInvitation({
        email: email.trim(),
        role,
        fullName: fullName.trim() || undefined,
      });

      showToast(`Verification invitation dispatched to ${email}`, 'success');
      setEmail('');
      setFullName('');
      setRole('TEACHER');
      await fetchInvitations();
    } catch (err: any) {
      showToast(err.message || 'Failed to send invitation.', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleResend = async (invitation: AdminInvitation) => {
    setActionLoadingId(invitation.id);
    try {
      await api.resendInvitation(invitation.id);
      showToast(`Invitation re-dispatched to ${invitation.email}`, 'success');
      await fetchInvitations();
    } catch (err: any) {
      showToast(err.message || 'Failed to resend invitation.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevoke = async (invitation: AdminInvitation) => {
    if (!window.confirm(`Are you sure you want to revoke the invitation for ${invitation.email}?`)) {
      return;
    }

    setActionLoadingId(invitation.id);
    try {
      await api.revokeInvitation(invitation.id);
      showToast(`Invitation for ${invitation.email} revoked.`, 'info');
      await fetchInvitations();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke invitation.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyLink = (invitation: AdminInvitation) => {
    const origin = window.location.origin;
    const registrationUrl = `${origin}?invite_token=${encodeURIComponent(invitation.invitation_token)}`;

    navigator.clipboard
      .writeText(registrationUrl)
      .then(() => {
        setCopiedTokenId(invitation.id);
        showToast('Single-use registration link copied to clipboard!', 'success');
        setTimeout(() => setCopiedTokenId(null), 2500);
      })
      .catch(() => {
        showToast(`Invite token: ${invitation.invitation_token}`, 'info');
      });
  };

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'PRINCIPAL':
      case 'SCHOOL_ADMIN':
        return 'bg-purple-900/40 text-purple-300 border-purple-800/60';
      case 'TEACHER':
        return 'bg-blue-900/40 text-blue-300 border-blue-800/60';
      case 'BURSAR':
        return 'bg-amber-900/40 text-amber-300 border-amber-800/60';
      case 'PARENT':
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <Modal
      id="admin-invitations-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="School-Verified Institutional Invitations"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Security Model Explanation Banner */}
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Decoupled Registration & Institutional Access Gate</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-medium">
                Active Security Policy
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Public self-registration is strictly disabled for{' '}
              <span className="text-slate-200 font-medium">{schoolName || 'your school'}</span>. All faculty, staff,
              and guardians must be explicitly invited via verified administrative links to ensure institutional data isolation and prevent unauthorized access.
            </p>
          </div>
        </div>

        {/* Dispatch Invitation Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Dispatch New Verification Link</span>
          </h3>

          <form onSubmit={handleSendInvite} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Recipient Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. adeyemi@school.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-400 mb-1">Invitee Full Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Mr. Babatunde Adeyemi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Institutional Role <span className="text-rose-400">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="TEACHER">Subject Teacher</option>
                <option value="PARENT">Parent / Guardian</option>
                <option value="BURSAR">Bursar / Accounts</option>
                <option value="PRINCIPAL">Principal / VP</option>
                <option value="ACADEMIC_COORDINATOR">Academic Coordinator</option>
                <option value="REGISTRAR">Registrar</option>
                <option value="SCHOOL_ADMIN">School Admin</option>
              </select>
            </div>

            <div className="md:col-span-12 flex justify-end mt-1">
              <button
                type="submit"
                disabled={isDispatching}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {isDispatching ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching via Edge Worker...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Institutional Invite</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Invitations List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Institutional Access Tokens ({invitations.length})
            </h3>
            <button
              type="button"
              onClick={fetchInvitations}
              disabled={isLoading}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoading && invitations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading invitation registry...</div>
          ) : invitations.length === 0 ? (
            <div className="p-8 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl text-center">
              <Mail className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-300">No invitations dispatched yet</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Dispatch your first verification link above to onboard teachers, staff, or parents.
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 bg-slate-900/60">
              {invitations.map((inv) => {
                const isJoined = inv.status === 'JOINED';
                const isPending = inv.status === 'PENDING' || inv.status === 'INVITED';
                const isExpired = inv.status === 'EXPIRED';

                return (
                  <div key={inv.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-100">{inv.email}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${getRoleBadgeColor(
                            inv.role
                          )}`}
                        >
                          {inv.role}
                        </span>
                        {isJoined ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Joined & Activated
                          </span>
                        ) : isPending ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Pending Registration
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expired
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        {inv.full_name && <span>Invitee: {inv.full_name}</span>}
                        <span>
                          Expires: {new Date(inv.expires_at).toLocaleDateString()} at{' '}
                          {new Date(inv.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {inv.invited_by_name && <span>By: {inv.invited_by_name}</span>}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleCopyLink(inv)}
                          className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copy One-Time Registration Link"
                        >
                          {copiedTokenId === inv.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      )}

                      {isPending && (
                        <button
                          type="button"
                          disabled={actionLoadingId === inv.id}
                          onClick={() => handleResend(inv)}
                          className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Resend Invitation Email"
                        >
                          <RotateCw
                            className={`w-3 h-3 text-slate-400 ${actionLoadingId === inv.id ? 'animate-spin' : ''}`}
                          />
                          <span>Resend</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={actionLoadingId === inv.id}
                        onClick={() => handleRevoke(inv)}
                        className="p-1.5 rounded-md hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                        title="Revoke Invitation"
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
      </div>
    </Modal>
  );
};
