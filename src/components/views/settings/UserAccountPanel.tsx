import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useToast } from '../../common/Toast.tsx';
import { api } from '../../../lib/api.ts';
import {
  User,
  Shield,
  KeyRound,
  Save,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  Building2,
  Eye,
  EyeOff
} from 'lucide-react';

export const UserAccountPanel: React.FC = () => {
  const { user, school, membership, refreshAuth } = useAuth();
  const { showToast } = useToast();

  // Profile update form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      showToast('Please enter a valid full name.', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await api.updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      await refreshAuth();
      showToast('Profile updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Please fill in both current and new passwords.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      showToast('Password successfully changed!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SCHOOL_ADMIN':
      case 'PRINCIPAL':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ACADEMIC_COORDINATOR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BURSAR':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'TEACHER':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'PARENT':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div id="user-account-panel" className="space-y-6">
      {/* 1. Account Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{user?.full_name || 'Staff User'}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeColor(membership?.role)}`}>
                {membership?.role?.replace('_', ' ') || 'USER'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>{user?.email}</span>
              {school && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {school.name}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right text-xs text-slate-500">
          <span className="text-[11px] block text-slate-400">Security Scope</span>
          <span className="font-semibold text-slate-700">Multi-tenant isolated</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Update Profile Information */}
        <form onSubmit={handleUpdateProfile} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-slate-900 text-sm">Personal Profile</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                id="profile-fullname-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Amina Bello"
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-8 pr-3 py-2 border rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Institutional login emails are managed by the school administrator.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  id="profile-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              id="save-profile-btn"
              type="submit"
              disabled={isUpdatingProfile}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isUpdatingProfile ? 'Saving...' : 'Update Profile'}</span>
            </button>
          </div>
        </form>

        {/* 3. Change Password Form */}
        <form onSubmit={handleChangePassword} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <KeyRound className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-slate-900 text-sm">Change Password</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  id="current-password-input"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full px-3 py-2 pr-9 border rounded-lg focus:outline-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  id="new-password-input"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 pr-9 border rounded-lg focus:outline-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                id="confirm-password-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[10px] text-rose-500 mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              id="change-password-btn"
              type="submit"
              disabled={isChangingPassword || (confirmPassword !== '' && newPassword !== confirmPassword)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isChangingPassword ? 'Changing...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Role Permissions & Safeguards Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Shield className="w-4 h-4 text-emerald-700" />
          <h4 className="font-bold text-slate-900 text-sm">Assigned Role Authority</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">Institutional Scope</span>
            <p className="text-slate-600 text-[11px]">
              Access restricted strictly to records matching school ID <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">{school?.id}</code>.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">Administrative Privileges</span>
            <p className="text-slate-600 text-[11px]">
              Authorized for {membership?.role?.replace('_', ' ')} capabilities with audit trail logging.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">Session Security</span>
            <p className="text-slate-600 text-[11px]">
              Cryptographically verified bearer token linked to your active profile session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
