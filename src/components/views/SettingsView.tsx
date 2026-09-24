import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { api } from '../../lib/api.ts';
import { School, SchoolSettings, DiscoveredSchoolPlace } from '../../types/index.ts';
import { GoogleSchoolSearchModal } from '../common/GoogleSchoolSearchModal.tsx';
import { GoogleSchoolVerificationModal } from '../common/GoogleSchoolVerificationModal.tsx';
import { SchoolLocationMap } from '../SchoolLocationMap.tsx';
import { UserAccountPanel } from './settings/UserAccountPanel.tsx';
import {
  Settings,
  School as SchoolIcon,
  Calendar,
  Clock,
  Shield,
  Save,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  MapPin,
  Globe,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Building2,
  Navigation,
  User,
  KeyRound,
  Trash2
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { school, updateSchoolContext, isAdmin, isSuperAdmin, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [currentSchool, setCurrentSchool] = useState<School | null>(school);
  const [showDecommissionModal, setShowDecommissionModal] = useState<boolean>(false);
  const [isDecommissioning, setIsDecommissioning] = useState<boolean>(false);
  const [decommissionConfirmText, setDecommissionConfirmText] = useState<string>('');

  const [formData, setFormData] = useState({
    school_name: '',
    phone: '',
    email: '',
    address: '',
    state: '',
    lga: '',
    website: '',
    current_session: '',
    current_term: '',
    attendance_late_cutoff_time: '08:15',
    enable_afternoon_session: false,
    low_bandwidth_mode: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Google Maps Discovery & Reverification Modals
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [targetVerifyPlaceId, setTargetVerifyPlaceId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSettings();
      setSettings(res.settings);
      setCurrentSchool(res.school);
      setFormData({
        school_name: res.school.name,
        phone: res.school.phone || '',
        email: res.school.email || '',
        address: res.school.address || '',
        state: res.school.state || '',
        lga: (res.school as any).lga || '',
        website: res.school.website || '',
        current_session: (res.school as any).current_session || '2025/2026',
        current_term: res.school.current_term || 'FIRST_TERM',
        attendance_late_cutoff_time: (res.settings as any)?.attendance_late_cutoff_time || '08:15',
        enable_afternoon_session: (res.settings as any)?.enable_afternoon_session || false,
        low_bandwidth_mode: (res.settings as any)?.low_bandwidth_mode ?? true,
      });
    } catch (err: any) {
      showToast('Failed to load school settings.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateSettings({
        school_updates: {
          name: formData.school_name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          state: formData.state,
          lga: formData.lga,
          website: formData.website,
        },
        settings_updates: {
          attendance_late_cutoff_time: formData.attendance_late_cutoff_time,
          enable_afternoon_session: formData.enable_afternoon_session,
          low_bandwidth_mode: formData.low_bandwidth_mode,
        },
      });

      if (res.school) {
        setCurrentSchool(res.school);
        updateSchoolContext(res.school);
      }
      showToast('School configuration updated successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectDiscoveredSchool = (place: DiscoveredSchoolPlace) => {
    setTargetVerifyPlaceId(place.google_place_id);
    setIsVerifyModalOpen(true);
  };

  const handleVerificationComplete = (updatedSchool: School) => {
    setCurrentSchool(updatedSchool);
    updateSchoolContext(updatedSchool);
    setFormData((prev) => ({
      ...prev,
      school_name: updatedSchool.name,
      phone: updatedSchool.phone || prev.phone,
      address: updatedSchool.address || prev.address,
      state: updatedSchool.state || prev.state,
      lga: updatedSchool.lga || prev.lga,
      website: updatedSchool.website || prev.website,
    }));
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 text-xs animate-pulse">Loading settings...</div>;
  }

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          Settings & Institutional Administration
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage school identity, user accounts, and Supabase cloud database protocols
        </p>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            id="tab-school-profile"
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>School Profile & Google Maps</span>
          </button>

          <button
            id="tab-user-account"
            type="button"
            onClick={() => setActiveTab('account')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'account'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Account & Security</span>
          </button>
        </div>
      </div>

      {activeTab === 'account' && <UserAccountPanel />}

      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="space-y-6">
        {/* Google Maps Institutional Verification & Sync Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Google Maps Institutional Discovery & Verification</h3>
                <p className="text-[11px] text-slate-500">
                  Verify school identity, official physical premises, telephone, and coordinates via Google Places API
                </p>
              </div>
            </div>

            {currentSchool?.google_place_id ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verified & Linked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 self-start sm:self-auto">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Unverified School
              </span>
            )}
          </div>

          {currentSchool?.google_place_id ? (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Google Place ID</span>
                  <code className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 inline-block mt-0.5">
                    {currentSchool.google_place_id}
                  </code>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Verification Status</span>
                  <span className="text-slate-700 text-xs">
                    Last audited:{' '}
                    {currentSchool.last_verified_at
                      ? new Date(currentSchool.last_verified_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Recently linked'}
                  </span>
                </div>

                {currentSchool.latitude && currentSchool.longitude && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">Coordinates</span>
                    <span className="text-slate-700 font-mono text-[11px]">
                      {currentSchool.latitude.toFixed(5)}° N, {currentSchool.longitude.toFixed(5)}° E
                    </span>
                  </div>
                )}

                {currentSchool.google_maps_uri && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">Google Maps Listing</span>
                    <a
                      href={currentSchool.google_maps_uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold underline text-xs mt-0.5"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Interactive Google Maps Campus View */}
              <div className="pt-2">
                <SchoolLocationMap
                  schoolName={currentSchool.name}
                  address={currentSchool.address}
                  phone={currentSchool.phone}
                  coordinates={
                    currentSchool.latitude && currentSchool.longitude
                      ? { lat: currentSchool.latitude, lng: currentSchool.longitude }
                      : undefined
                  }
                  className="h-64 w-full"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                <button
                  id="reverify-google-btn"
                  type="button"
                  onClick={() => {
                    setTargetVerifyPlaceId(currentSchool.google_place_id);
                    setIsVerifyModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Verify & Compare with Google</span>
                </button>

                <button
                  id="relink-google-btn"
                  type="button"
                  onClick={() => setIsSearchModalOpen(true)}
                  className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Link Different Google Place</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-xs">Link your school to Google Maps</p>
                <p className="text-[11px] text-slate-600 max-w-lg leading-relaxed">
                  Automatically verify institutional physical address, telephone number, official website, and GPS coordinates directly from Google's verified Places directory.
                </p>
              </div>

              <button
                id="search-link-google-btn"
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Find & Link on Google Maps</span>
              </button>
            </div>
          )}
        </div>

        {/* School Profile Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <SchoolIcon className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-slate-900 text-sm">School Identity & Premises</h3>
            </div>

            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Google Maps Auto-Fill</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Official School Name *</label>
              <input
                id="settings-school-name"
                type="text"
                value={formData.school_name}
                onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Phone</label>
              <input
                id="settings-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                id="settings-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Local Government Area (LGA)</label>
              <input
                type="text"
                value={formData.lga}
                onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Official Website</label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Academic Session & Term Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">Academic Session & Term</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Academic Session</label>
              <input
                id="settings-session"
                type="text"
                value={formData.current_session}
                onChange={(e) => setFormData({ ...formData, current_session: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                placeholder="2025/2026"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Active Term</label>
              <select
                id="settings-term"
                value={formData.current_term}
                onChange={(e) => setFormData({ ...formData, current_term: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attendance & Operational Policies */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">Attendance & Device Optimization</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Morning Late Cutoff Time</label>
              <input
                type="time"
                value={formData.attendance_late_cutoff_time}
                onChange={(e) => setFormData({ ...formData, attendance_late_cutoff_time: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-emerald-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Students arriving after this time are marked Late by default.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Low-Bandwidth Mobile Mode</span>
                <span className="text-[11px] text-slate-500">
                  Minimizes payload size, preloads essential cached data for older 2G/3G connections.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.low_bandwidth_mode}
                onChange={(e) => setFormData({ ...formData, low_bandwidth_mode: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            id="save-settings-btn"
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>

        {/* Danger Zone: Institution Decommissioning (Admins only) */}
        {(isAdmin || isSuperAdmin) && currentSchool && currentSchool.id !== 'global-platform' && (
          <div className="mt-8 bg-red-50/50 border border-red-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Danger Zone: Decommission Institution</span>
            </div>
            <p className="text-xs text-red-600/90 leading-relaxed">
              Permanently decommission and delete this school tenant (<strong className="font-semibold text-red-800">{currentSchool.name}</strong>), including all associated rosters, classes, attendance sessions, and records. This action cannot be undone.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">School ID: {currentSchool.id}</span>
              <button
                id="btn-decommission-school-open"
                type="button"
                onClick={() => {
                  setDecommissionConfirmText('');
                  setShowDecommissionModal(true);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Decommission School</span>
              </button>
            </div>
          </div>
        )}
      </form>
      )}

      {/* Decommission Confirmation Modal */}
      {showDecommissionModal && currentSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Decommission School?</h3>
                <p className="text-xs text-slate-500">{currentSchool.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to permanently delete <strong className="font-bold text-slate-900">{currentSchool.name}</strong>? All student records, attendance rolls, faculty assignments, and school data will be erased immediately.
            </p>

            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center justify-between">
              <span>Type <strong>DELETE</strong> to confirm:</span>
              <button
                type="button"
                onClick={() => setDecommissionConfirmText('DELETE')}
                className="text-[11px] text-amber-700 hover:text-amber-900 underline font-semibold cursor-pointer"
              >
                Quick Fill
              </button>
            </div>

            <input
              id="decommission-confirm-input"
              type="text"
              value={decommissionConfirmText}
              onChange={(e) => setDecommissionConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono mb-4 focus:outline-red-500"
            />

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDecommissionModal(false)}
                disabled={isDecommissioning}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-decommission"
                type="button"
                disabled={isDecommissioning || decommissionConfirmText.trim().toUpperCase() !== 'DELETE'}
                onClick={async () => {
                  setIsDecommissioning(true);
                  try {
                    await api.deleteSchool(currentSchool.id);
                    showToast(`School tenant "${currentSchool.name}" successfully deleted.`, 'success');
                    setShowDecommissionModal(false);
                    setTimeout(() => {
                      logout();
                    }, 1200);
                  } catch (err: any) {
                    showToast(err.message || 'Failed to delete school tenant.', 'error');
                  } finally {
                    setIsDecommissioning(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDecommissioning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete School Tenant</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google School Discovery Search Modal */}
      <GoogleSchoolSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectSchool={handleSelectDiscoveredSchool}
        initialQuery={formData.school_name}
        initialState={formData.state || 'All States'}
        title="Find & Link School on Google Maps"
        subtitle="Search verified educational institutions to import or update institutional profile data"
      />

      {/* Google School Verification & Sync Modal */}
      {currentSchool && (
        <GoogleSchoolVerificationModal
          isOpen={isVerifyModalOpen}
          onClose={() => {
            setIsVerifyModalOpen(false);
            setTargetVerifyPlaceId(undefined);
          }}
          school={currentSchool}
          targetPlaceId={targetVerifyPlaceId}
          onVerificationComplete={handleVerificationComplete}
          onSearchAnotherPlace={() => setIsSearchModalOpen(true)}
        />
      )}
    </div>
  );
};
