import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal.tsx';
import { api } from '../../lib/api.ts';
import { DiscoveredSchoolPlace } from '../../types/index.ts';
import {
  Search,
  MapPin,
  Phone,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Building2,
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';

interface GoogleSchoolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSchool: (schoolPlace: DiscoveredSchoolPlace) => void;
  initialQuery?: string;
  initialState?: string;
  title?: string;
  subtitle?: string;
}

const NIGERIAN_STATES = [
  'All States',
  'Lagos',
  'Abuja (FCT)',
  'Ogun',
  'Oyo',
  'Rivers',
  'Kano',
  'Kaduna',
  'Edo',
  'Enugu',
  'Delta',
  'Anambra',
  'Ondo',
  'Osun',
  'Kwara',
  'Plateau',
  'Akwa Ibom',
  'Cross River',
  'Imo',
  'Abia',
  'Benue',
];

export const GoogleSchoolSearchModal: React.FC<GoogleSchoolSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSchool,
  initialQuery = '',
  initialState = 'All States',
  title = 'Find School on Google Maps',
  subtitle = 'Search verified schools to automatically populate institutional details',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedState, setSelectedState] = useState(initialState);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DiscoveredSchoolPlace[]>([]);
  const [source, setSource] = useState<'google' | 'sandbox'>('sandbox');
  const [attribution, setAttribution] = useState('Google Maps');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<DiscoveredSchoolPlace | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      if (initialQuery && initialQuery.trim().length >= 2) {
        setQuery(initialQuery);
        executeSearch(initialQuery, selectedState === 'All States' ? undefined : selectedState);
      } else {
        // Run default state search or show popular
        executeSearch('Secondary School', selectedState === 'All States' ? undefined : selectedState);
      }
    } else {
      setSelectedPlace(null);
      setSearchError(null);
    }
  }, [isOpen]);

  const executeSearch = async (searchTerm: string, stateFilter?: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await api.searchPlaces(
        searchTerm.trim(),
        stateFilter && stateFilter !== 'All States' ? stateFilter : undefined
      );
      setResults(res.places || []);
      setSource(res.source);
      setAttribution(res.attribution || 'Google Maps');
      setWarningMessage(res.warning || null);
    } catch (err: any) {
      setSearchError(err.message || 'Unable to connect to Google School Discovery. Please try again or type manually.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedPlace(null);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val, selectedState === 'All States' ? undefined : selectedState);
    }, 400);
  };

  const handleStateChange = (stateVal: string) => {
    setSelectedState(stateVal);
    setSelectedPlace(null);
    executeSearch(query, stateVal === 'All States' ? undefined : stateVal);
  };

  const handleConfirmSelection = () => {
    if (selectedPlace) {
      onSelectSchool(selectedPlace);
      onClose();
    }
  };

  return (
    <Modal
      id="google-school-search-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="xl"
    >
      <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-800">
        {/* Search Controls */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="places-search-input"
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Type school name or location (e.g. King's College, Lagos)..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-emerald-600 focus:border-emerald-600 shadow-xs"
              />
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin absolute right-3 top-3" />
              )}
            </div>

            <select
              id="places-state-select"
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-emerald-600 shadow-xs"
            >
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <button
              id="places-search-submit-btn"
              type="button"
              onClick={() => executeSearch(query, selectedState === 'All States' ? undefined : selectedState)}
              disabled={isSearching}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Instant auto-fill: Verified school name, address, phone & website
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              {source === 'google' ? 'Live Google Places API' : 'Institutional Registry'}
            </span>
          </div>
        </div>

        {warningMessage && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{warningMessage}</span>
          </div>
        )}

        {searchError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Search Notice</p>
              <p className="text-[11px] mt-0.5">{searchError}</p>
            </div>
          </div>
        )}

        {/* Place Detail Selected View */}
        {selectedPlace ? (
          <div className="bg-slate-50 border border-emerald-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mb-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Selected School to Import
                </span>
                <h4 className="text-sm font-bold text-slate-900">{selectedPlace.name}</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlace(null)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Choose another
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 text-xs">
              <div className="sm:col-span-2 flex items-start gap-2 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{selectedPlace.formatted_address || 'Address on file with Google Maps'}</span>
              </div>

              {selectedPlace.phone && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedPlace.phone}</span>
                </div>
              )}

              {selectedPlace.state && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    State: <strong className="text-slate-900">{selectedPlace.state}</strong>
                    {selectedPlace.lga && ` • LGA: ${selectedPlace.lga}`}
                  </span>
                </div>
              )}

              {selectedPlace.website && (
                <div className="sm:col-span-2 flex items-center gap-2 text-slate-700 truncate">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a
                    href={selectedPlace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline truncate"
                  >
                    {selectedPlace.website}
                  </a>
                </div>
              )}

              {selectedPlace.google_maps_uri && (
                <div className="sm:col-span-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                  <a
                    href={selectedPlace.google_maps_uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-slate-900 underline"
                  >
                    View on Google Maps
                  </a>
                </div>
              )}
            </div>

            {selectedPlace.is_already_registered ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2 mt-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Duplicate School Registration Notice</p>
                  <p className="text-[11px] mt-0.5">
                    This school is already registered in SchoolCore as{' '}
                    <strong>{selectedPlace.registered_school_name || selectedPlace.name}</strong>.
                    To prevent duplicate school accounts, please ask your school administrator for access or sign in to your existing account.
                  </p>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPlace(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100"
                >
                  Back to Results
                </button>
                <button
                  id="confirm-import-school-btn"
                  type="button"
                  onClick={handleConfirmSelection}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>Import & Review School Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Search Results List */
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[360px] overflow-y-auto bg-white">
            {isSearching ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                <p className="text-xs">Searching verified schools on Google Maps...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-700 text-xs">No matching schools found</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Try adjusting your search terms or state filter, or proceed with manual school registration.
                </p>
              </div>
            ) : (
              results.map((place) => {
                const isRegistered = place.is_already_registered;
                return (
                  <div
                    key={place.google_place_id}
                    id={`place-result-${place.google_place_id}`}
                    onClick={() => setSelectedPlace(place)}
                    className={`p-3 sm:p-3.5 flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                      isRegistered
                        ? 'bg-amber-50/40 hover:bg-amber-50/80 border-l-4 border-l-amber-400'
                        : 'hover:bg-emerald-50/60 border-l-4 border-l-transparent hover:border-l-emerald-600'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs truncate">{place.name}</span>
                        {isRegistered && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Registered on SchoolCore
                          </span>
                        )}
                        {place.state && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                            {place.state}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 flex items-start gap-1 line-clamp-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>{place.formatted_address || 'Address provided'}</span>
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        {place.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {place.phone}
                          </span>
                        )}
                        {place.website && (
                          <span className="flex items-center gap-1 text-emerald-700 truncate max-w-[180px]">
                            <Globe className="w-3 h-3 text-emerald-600" />
                            {place.website.replace(/^https?:\/\/(www\.)?/, '')}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-md font-semibold text-[11px] transition-colors shrink-0"
                    >
                      Select
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Required Attribution and Manual Option */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Powered by</span>
            <span className="font-semibold text-slate-700">{attribution}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-medium underline"
          >
            Or type school details manually
          </button>
        </div>
      </div>
    </Modal>
  );
};
