import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { api } from '../../lib/api.ts';
import { School, DiscoveredSchoolPlace, SchoolVerificationDifference } from '../../types/index.ts';
import { useToast } from './Toast.tsx';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Phone,
  MapPin,
  Globe,
  Loader2
} from 'lucide-react';

interface GoogleSchoolVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  targetPlaceId?: string;
  onVerificationComplete: (updatedSchool: School) => void;
  onSearchAnotherPlace?: () => void;
}

export const GoogleSchoolVerificationModal: React.FC<GoogleSchoolVerificationModalProps> = ({
  isOpen,
  onClose,
  school,
  targetPlaceId,
  onVerificationComplete,
  onSearchAnotherPlace,
}) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [googlePlace, setGooglePlace] = useState<DiscoveredSchoolPlace | null>(null);
  const [differences, setDifferences] = useState<SchoolVerificationDifference[]>([]);
  const [attribution, setAttribution] = useState('Google Maps');
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const placeIdToVerify = targetPlaceId || school.google_place_id;

  useEffect(() => {
    if (isOpen && placeIdToVerify) {
      loadVerificationData(placeIdToVerify);
    } else if (isOpen && !placeIdToVerify) {
      setError('No Google Place is linked to this school yet. Please search for your school first.');
      setIsLoading(false);
    }
  }, [isOpen, placeIdToVerify]);

  const loadVerificationData = async (placeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.verifySchoolWithGoogle(placeId);
      setGooglePlace(res.google_place);
      setDifferences(res.differences || []);
      setAttribution(res.attribution || 'Google Maps');

      // Initialize selected fields: default select fields that have meaningful differences
      const initialSelected: Record<string, boolean> = {};
      (res.differences || []).forEach((diff) => {
        if (diff.is_different && diff.google_value) {
          initialSelected[diff.field] = true;
        }
      });
      setSelectedFields(initialSelected);
    } catch (err: any) {
      setError(err.message || 'Failed to compare school profile with Google Maps.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFieldSelection = (field: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleApplyUpdates = async () => {
    if (!googlePlace?.google_place_id) return;

    const fieldsToApply = Object.entries(selectedFields)
      .filter(([_, isSelected]) => isSelected)
      .map(([field]) => field);

    setIsApplying(true);
    try {
      const res = await api.syncSchoolWithGoogle(googlePlace.google_place_id, fieldsToApply);
      showToast(res.message || 'School profile updated with verified Google Maps details.');
      onVerificationComplete(res.school);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to apply Google Maps updates.', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  const fieldLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    name: { label: 'School Name', icon: <Building2 className="w-3.5 h-3.5 text-slate-500" /> },
    phone: { label: 'Official Phone', icon: <Phone className="w-3.5 h-3.5 text-slate-500" /> },
    address: { label: 'Physical Address', icon: <MapPin className="w-3.5 h-3.5 text-slate-500" /> },
    website: { label: 'Official Website', icon: <Globe className="w-3.5 h-3.5 text-slate-500" /> },
    state: { label: 'State', icon: <Building2 className="w-3.5 h-3.5 text-slate-500" /> },
    lga: { label: 'LGA', icon: <MapPin className="w-3.5 h-3.5 text-slate-500" /> },
  };

  const differingCount = differences.filter((d) => d.is_different).length;
  const selectedCount = Object.values(selectedFields).filter(Boolean).length;

  return (
    <Modal
      id="google-verification-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Verify School Profile with Google Maps"
      subtitle="Compare your SchoolCore institutional records with current Google Places public data"
      maxWidth="2xl"
    >
      <div className="p-4 sm:p-6 space-y-5 text-xs text-slate-800">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-600" />
            <p className="font-semibold text-slate-700">Connecting to Google Maps & verifying school records...</p>
            <p className="text-[11px] text-slate-400">Comparing address, telephone, website, and institutional coordinates.</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Verification Notice</p>
                <p className="text-[11px] mt-0.5">{error}</p>
              </div>
            </div>
            {onSearchAnotherPlace && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSearchAnotherPlace();
                  }}
                  className="px-3 py-1.5 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-800"
                >
                  Search & Link School on Google Maps
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header Badge */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      {googlePlace?.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-200 text-emerald-900">
                      Verified Place
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Google Place ID:{' '}
                    <code className="font-mono text-[10px] bg-emerald-100/70 px-1 py-0.5 rounded text-slate-700">
                      {googlePlace?.google_place_id}
                    </code>
                  </p>
                </div>
              </div>

              {googlePlace?.google_maps_uri && (
                <a
                  href={googlePlace.google_maps_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold underline shrink-0"
                >
                  <span>View in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Summary Notice */}
            <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
              <span>
                {differingCount === 0 ? (
                  <strong className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All school records match current Google Maps data perfectly.
                  </strong>
                ) : (
                  <span>
                    Found <strong className="text-slate-900">{differingCount}</strong> field difference(s). Select which values to update:
                  </span>
                )}
              </span>

              {onSearchAnotherPlace && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSearchAnotherPlace();
                  }}
                  className="text-slate-500 hover:text-slate-800 underline text-[11px]"
                >
                  Link different Google Place
                </button>
              )}
            </div>

            {/* Differences Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="grid grid-cols-12 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <div className="col-span-3">Field</div>
                <div className="col-span-4">SchoolCore Value</div>
                <div className="col-span-4">Google Maps Value</div>
                <div className="col-span-1 text-center">Sync</div>
              </div>

              <div className="divide-y divide-slate-100">
                {differences.map((diff) => {
                  const meta = fieldLabels[diff.field] || { label: diff.field, icon: null };
                  const isChecked = !!selectedFields[diff.field];
                  const hasDifference = diff.is_different;

                  return (
                    <div
                      key={diff.field}
                      id={`diff-row-${diff.field}`}
                      className={`grid grid-cols-12 items-center px-3 py-2.5 transition-colors ${
                        hasDifference ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="col-span-3 flex items-center gap-1.5 font-semibold text-slate-800">
                        {meta.icon}
                        <span>{meta.label}</span>
                      </div>

                      <div className="col-span-4 text-[11px] text-slate-600 truncate pr-2" title={diff.current_value || 'None'}>
                        {diff.current_value || <span className="text-slate-400 italic">Not set</span>}
                      </div>

                      <div
                        className="col-span-4 text-[11px] font-medium text-slate-900 truncate pr-2"
                        title={diff.google_value || 'None'}
                      >
                        {diff.google_value ? (
                          <span className={hasDifference ? 'text-emerald-900 font-bold' : 'text-slate-700'}>
                            {diff.google_value}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not in Google listing</span>
                        )}
                      </div>

                      <div className="col-span-1 flex justify-center">
                        {diff.google_value ? (
                          <input
                            id={`sync-field-${diff.field}`}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleFieldSelection(diff.field)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                          />
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="text-slate-400">Data source:</span>
                <span className="font-semibold text-slate-700">{attribution}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  id="apply-google-sync-btn"
                  type="button"
                  onClick={handleApplyUpdates}
                  disabled={isApplying || (differingCount > 0 && selectedCount === 0)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
                  <span>
                    {isApplying
                      ? 'Applying updates...'
                      : selectedCount > 0
                      ? `Update ${selectedCount} Field${selectedCount > 1 ? 's' : ''}`
                      : 'Record Verified & Match'}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
