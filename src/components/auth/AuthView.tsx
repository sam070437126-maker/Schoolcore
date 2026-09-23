import React, { useState, useEffect } from 'react';
import Login07 from './Login07';
import SignupForm from './SignupForm';
import { InvitationAcceptForm } from './InvitationAcceptForm';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { GoogleSchoolSearchModal } from '../common/GoogleSchoolSearchModal';
import { DiscoveredSchoolPlace } from '../../types';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';
import { Lock, ArrowLeft, Globe } from 'lucide-react';

interface AuthViewProps {
  onBackToWebsite?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onBackToWebsite }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'invite'>('login');
  const [activeInviteToken, setActiveInviteToken] = useState<string>('');
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [showManualTokenModal, setShowManualTokenModal] = useState<boolean>(false);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const { showToast } = useToast();

  const { inviteToken, clearInviteTokenFromUrl } = useAuthRedirect({
    onInviteTokenFound: (tok) => {
      setActiveInviteToken(tok);
      setMode('invite');
      showToast('Institutional invitation link detected. Please activate your account below.', 'info');
    },
  });

  useEffect(() => {
    if (inviteToken) {
      setActiveInviteToken(inviteToken);
      setMode('invite');
    }
  }, [inviteToken]);

  const handleSelectDiscoveredSchool = (place: DiscoveredSchoolPlace) => {
    showToast(`Discovered ${place.name}. You can use this name for your school registration.`);
    setIsDiscoveryModalOpen(false);
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) {
      showToast('Please enter an invitation token.', 'error');
      return;
    }
    setActiveInviteToken(manualTokenInput.trim());
    setMode('invite');
    setShowManualTokenModal(false);
    showToast('Validating entered invitation token...', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative selection:bg-emerald-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Bar with Mode Switcher & Quick Navigation */}
      <header className="w-full max-w-6xl mx-auto px-4 py-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
            SC
          </div>
          <div>
            <span className="font-bold text-sm text-slate-100 tracking-tight">SchoolCore</span>
            <span className="text-[10px] text-emerald-400 font-medium ml-2 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40">
              v1.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToWebsite && (
            <button
              type="button"
              onClick={onBackToWebsite}
              className="px-3 py-1.5 text-xs rounded-xl font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Public Website</span>
            </button>
          )}
          {mode === 'invite' && (
            <button
              type="button"
              onClick={() => {
                clearInviteTokenFromUrl();
                setMode('login');
              }}
              className="px-3 py-1.5 text-xs rounded-lg font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        {mode === 'invite' && activeInviteToken ? (
          <InvitationAcceptForm
            token={activeInviteToken}
            onSuccess={() => {
              clearInviteTokenFromUrl();
            }}
            onSwitchToSignIn={() => {
              clearInviteTokenFromUrl();
              setMode('login');
            }}
          />
        ) : mode === 'login' ? (
          <Login07 onSwitchToSignUp={() => setMode('register')} />
        ) : (
          <SignupForm
            onSwitchToSignIn={() => setMode('login')}
            onHaveTokenClick={() => setShowManualTokenModal(true)}
          />
        )}
      </main>

      {/* Manual Invitation Token Entry Modal */}
      {showManualTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Redeem Invitation Token</h3>
                <p className="text-[11px] text-slate-400">Enter the cryptographic token from your invite</p>
              </div>
            </div>

            <form onSubmit={handleManualTokenSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Invitation Token or URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. inv_tok_... or full link"
                  value={manualTokenInput}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val.includes('invite_token=')) {
                      try {
                        const parsed = new URL(val).searchParams.get('invite_token');
                        if (parsed) val = parsed;
                      } catch {
                        // ignore
                      }
                    }
                    setManualTokenInput(val);
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualTokenModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Validate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google School Discovery Modal */}
      <GoogleSchoolSearchModal
        isOpen={isDiscoveryModalOpen}
        onClose={() => setIsDiscoveryModalOpen(false)}
        onSelectSchool={handleSelectDiscoveredSchool}
        initialQuery=""
        initialState="All States"
      />
    </div>
  );
};
export default AuthView;
