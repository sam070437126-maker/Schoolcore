import React, { useState, useEffect } from 'react';
import { Users, UserPlus, ShieldCheck, Phone, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api.ts';

interface GuardianItem {
  id: string;
  profile_id: string;
  name: string;
  email: string;
  phone: string;
  guardian_type: 'PRIMARY' | 'SECONDARY';
  relationship: string;
  is_emergency_contact: boolean;
  is_current_user: boolean;
}

interface FamilyGuardiansCardProps {
  familyGroupId?: string;
  onGuardianLinked?: () => void;
}

export const FamilyGuardiansCard: React.FC<FamilyGuardiansCardProps> = ({
  familyGroupId,
  onGuardianLinked,
}) => {
  const [guardians, setGuardians] = useState<GuardianItem[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('Mother');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadGuardians = async () => {
    try {
      setIsLoading(true);
      const res = await api.getFamilyGuardians();
      setGuardians(res.guardians || []);
      setStudentInfo(res.student);
    } catch (err: any) {
      console.warn('Failed to load family guardians:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGuardians();
  }, [familyGroupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setErrorMsg('Please enter the guardian full name and phone number.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await api.linkCoGuardian({
        family_group_id: familyGroupId,
        guardian_name: name.trim(),
        guardian_phone: phone.trim(),
        guardian_email: email.trim() || undefined,
        relationship: relationship.trim(),
        guardian_type: 'SECONDARY',
      });

      setSuccessMsg(res.message || 'Co-guardian linked successfully.');
      setName('');
      setPhone('');
      setEmail('');
      
      await loadGuardians();
      if (onGuardianLinked) onGuardianLinked();

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not link co-guardian. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-stone-200 uppercase tracking-wider">
            Family Unit & Guardians
          </span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Link Co-Guardian</span>
        </button>
      </div>

      <div className="p-4">
        <p className="text-xs text-stone-400 mb-3 leading-relaxed">
          Both parents share the same Family ID (<code className="text-stone-300 font-mono text-[11px]">{familyGroupId}</code>). Announcements, report cards, and attendance push simultaneously to both phones.
        </p>

        {isLoading ? (
          <div className="py-4 text-center text-xs text-stone-500">Loading family contacts...</div>
        ) : guardians.length === 0 ? (
          <div className="py-4 text-center text-xs text-stone-500">No linked guardians found.</div>
        ) : (
          <div className="space-y-2.5">
            {guardians.map((g) => (
              <div
                key={g.id}
                className="p-3 rounded-lg bg-stone-950/60 border border-stone-800/80 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-200 truncate">{g.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        g.guardian_type === 'PRIMARY'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {g.relationship} ({g.guardian_type})
                    </span>
                    {g.is_current_user && (
                      <span className="text-[10px] text-stone-500 italic">(You)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-stone-500" />
                      {g.phone}
                    </span>
                    {g.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-stone-500" />
                        {g.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-emerald-400 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">Verified</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal to Link Guardian */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-md w-full p-5 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-800">
              <h3 className="text-sm font-semibold text-stone-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Link Co-Guardian / Second Parent
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-200 text-xs"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              Link another parent (e.g. mother, father, or secondary guardian) to {studentInfo?.name || 'this student'}. Both will have access to real-time attendance and academic alerts.
            </p>

            {errorMsg && (
              <div className="mb-3 p-2.5 rounded bg-red-950/60 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-3 p-2.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ngozi Adeyemi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-stone-950 border border-stone-700 text-xs text-stone-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-stone-300 mb-1">
                    Relationship
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-700 text-xs text-stone-100 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Sponsor">Sponsor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+234 803 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-stone-950 border border-stone-700 text-xs text-stone-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-300 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="parent.guardian@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-stone-950 border border-stone-700 text-xs text-stone-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Linking...' : 'Link Guardian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
