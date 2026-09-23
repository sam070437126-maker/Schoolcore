import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { api } from '../../lib/api.ts';
import { AdminInvitation } from '../../types/index.ts';
import {
  ShieldCheck,
  Building2,
  Lock,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

interface InvitationAcceptFormProps {
  token: string;
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

export const InvitationAcceptForm: React.FC<InvitationAcceptFormProps> = ({
  token,
  onSuccess,
  onSwitchToSignIn,
}) => {
  const { registerWithInvitation } = useAuth();
  const { showToast } = useToast();

  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [invalidationReason, setInvalidationReason] = useState<string>('');
  const [invitation, setInvitation] = useState<AdminInvitation | null>(null);
  const [schoolName, setSchoolName] = useState<string>('');

  // Registration Form
  const [fullName, setFullName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const verifyToken = async () => {
      setIsVerifying(true);
      try {
        const res = await api.verifyInvitation(token);
        if (!isMounted) return;
        if (res.valid && res.invitation) {
          setIsValid(true);
          setInvitation(res.invitation);
          setSchoolName(res.schoolName || 'SchoolCore Partner School');
          if (res.invitation.full_name) {
            setFullName(res.invitation.full_name);
          }
        } else {
          setIsValid(false);
          setInvalidationReason(res.reason || 'Invitation token is invalid, expired, or has already been redeemed.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setIsValid(false);
        setInvalidationReason(err.message || 'Unable to verify invitation. Please check your internet connection.');
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };

    if (token) {
      verifyToken();
    }
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('Please enter your full official name.', 'error');
      return;
    }

    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerWithInvitation({
        token,
        fullName: fullName.trim(),
        password,
      });

      showToast(`Welcome aboard! Your institutional account is active.`, 'success');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to activate account. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
          <RotateCw className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-base font-semibold text-slate-100">Verifying Institutional Access Link...</h2>
        <p className="text-xs text-slate-400">
          Validating cryptographic token integrity against school registration ledger.
        </p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-slate-900 border border-rose-900/50 rounded-2xl text-center space-y-5 shadow-xl">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-slate-100">Invalid or Expired Invitation</h2>
          <p className="text-xs text-rose-300/90 leading-relaxed">{invalidationReason}</p>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed text-left">
          Because SchoolCore implements a decoupled, school-verified security model, registrations cannot proceed
          without an active, unexpired administrative invitation. Please contact your Principal or School Administrator to receive a fresh verification link.
        </div>

        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
        >
          Return to Institutional Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Verified Institutional Invitation</span>
        </div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Activate Your Account</h1>
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{schoolName}</span>
        </p>
      </div>

      {/* Role & Email Summary Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
        <div>
          <div className="text-slate-400 text-[11px]">Authorized Email</div>
          <div className="font-semibold text-slate-200">{invitation?.email}</div>
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-[11px]">Institutional Role</div>
          <span className="inline-block font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[11px]">
            {invitation?.role}
          </span>
        </div>
      </div>

      {/* Activation Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Your Full Legal / Official Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              required
              placeholder="e.g. Mrs. Ngozi Okonjo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Create Password <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Confirm Password <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Re-enter chosen password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {isSubmitting ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Hydrating Institutional Identity...</span>
            </>
          ) : (
            <>
              <span>Activate Institutional Profile</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Already activated? <span className="text-emerald-400 font-medium underline">Sign in instead</span>
        </button>
      </div>
    </div>
  );
};
