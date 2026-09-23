import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { School } from '../../types/index.ts';
import { NavTab } from '../layout/Sidebar.tsx';
import { db } from '../../lib/firebaseClient.ts';
import { collection, onSnapshot } from 'firebase/firestore';
import { useToast } from '../common/Toast.tsx';
import {
  Building2,
  ShieldCheck,
  Server,
  Activity,
  CheckCircle2,
  Database,
  Lock,
  Bell,
  PlusCircle,
  Radio,
  X,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  UserCheck,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  School as SchoolIcon,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Search,
  PauseCircle,
  PlayCircle,
  Filter,
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onNavigate: (tab: NavTab, extra?: any) => void;
  todayFormatted: string;
}

interface ProvisionedResult {
  school: School;
  administrator?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: string;
  };
  initialPassword?: string;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onNavigate,
  todayFormatted,
}) => {
  const { user, switchSchoolContext, enterSchoolWorkspace } = useAuth();
  const { showToast } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [provisionResult, setProvisionResult] = useState<ProvisionedResult | null>(null);

  // New School Form State
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [schoolType, setSchoolType] = useState('Comprehensive High School (JSS & SSS)');
  const [newState, setNewState] = useState('Lagos');
  const [newCity, setNewCity] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWebsite, setNewWebsite] = useState('');

  // Primary Administrator State
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('Admin@2026!');
  const [showPassword, setShowPassword] = useState(false);

  // Deletion Modal State
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Status Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  const resetForm = () => {
    setNewName('');
    setNewCode('');
    setSchoolType('Comprehensive High School (JSS & SSS)');
    setNewState('Lagos');
    setNewCity('');
    setNewAddress('');
    setNewEmail('');
    setNewPhone('');
    setNewWebsite('');
    setAdminName('');
    setAdminEmail('');
    setAdminPhone('');
    setAdminPassword('Admin@2026!');
    setShowPassword(false);
    setProvisionResult(null);
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminPassword(pwd + '!');
  };

  useEffect(() => {
    // 1. Initial REST API load
    loadSchools();

    // 2. Realtime Firestore listener for live updates across all schools
    let unsubscribe: (() => void) | undefined;
    try {
      const colRef = collection(db, 'schools');
      unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          setIsRealtimeActive(true);
          const liveSchools: School[] = [];
          snapshot.forEach((docSnap) => {
            liveSchools.push(docSnap.data() as School);
          });
          if (liveSchools.length > 0) {
            setSchools(liveSchools);
            setIsLoading(false);
          }
        },
        (error) => {
          console.warn('[SuperAdminDashboard] Realtime listener error:', error);
          setIsRealtimeActive(false);
        }
      );
    } catch (err) {
      console.warn('[SuperAdminDashboard] Firebase listener setup notice:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadSchools = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSchools();
      setSchools(res.schools || []);
    } catch {
      setSchools([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('School name is required.', 'error');
      return;
    }

    if (adminEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(adminEmail.trim())) {
        showToast('Please enter a valid administrator email address.', 'error');
        return;
      }
      if (!adminName.trim()) {
        showToast('Please enter administrator full name.', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await api.createSchool({
        name: newName.trim(),
        code: newCode.trim() || undefined,
        school_type: schoolType,
        state: newState,
        city: newCity.trim() || undefined,
        address: newAddress.trim() || undefined,
        email: newEmail.trim() || undefined,
        phone: newPhone.trim() || undefined,
        website: newWebsite.trim() || undefined,
        admin_name: adminName.trim() || undefined,
        admin_email: adminEmail.trim() || undefined,
        admin_phone: adminPhone.trim() || undefined,
        admin_password: adminPassword.trim() || undefined,
        admin_role: 'SCHOOL_ADMIN',
      });

      setProvisionResult({
        school: res.school,
        administrator: res.administrator,
        initialPassword: adminPassword,
      });

      showToast(`School tenant "${res.school.name}" provisioned successfully!`, 'success');
      loadSchools();
    } catch (err: any) {
      showToast(err.message || 'Failed to provision school tenant.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSchool = (targetSchool: School) => {
    if (enterSchoolWorkspace) {
      enterSchoolWorkspace(targetSchool);
    } else if (switchSchoolContext) {
      switchSchoolContext(targetSchool);
    }
    showToast(`Entering workspace for ${targetSchool.name}...`, 'info');
    onNavigate('dashboard');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  const handleDeleteSchool = async () => {
    if (!schoolToDelete) return;

    setIsDeleting(true);
    try {
      await api.deleteSchool(schoolToDelete.id);
      showToast(`School tenant "${schoolToDelete.name}" permanently removed.`, 'success');
      setSchools((prev) => prev.filter((s) => s.id !== schoolToDelete.id));
      setSchoolToDelete(null);
      setDeleteConfirmationText('');
      loadSchools();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove school tenant.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePurgeDemoData = async () => {
    setIsPurging(true);
    try {
      const res = await api.purgeDemoData();
      showToast(res.message || 'Demo data purged successfully.', 'success');
      setShowPurgeModal(false);
      loadSchools();
    } catch (err: any) {
      showToast(err.message || 'Failed to purge demo data.', 'error');
    } finally {
      setIsPurging(false);
    }
  };

  const handleToggleSchoolStatus = async (sch: School) => {
    const newStatus: 'ACTIVE' | 'SUSPENDED' = sch.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      await api.updateSchoolStatus(sch.id, newStatus);
      showToast(
        newStatus === 'ACTIVE'
          ? `Tenant "${sch.name}" has been activated.`
          : `Tenant "${sch.name}" has been suspended.`,
        newStatus === 'ACTIVE' ? 'success' : 'warning'
      );
      setSchools((prev) =>
        prev.map((s) => (s.id === sch.id ? { ...s, status: newStatus } : s))
      );
      loadSchools();
    } catch (err: any) {
      showToast(err.message || 'Failed to update tenant status.', 'error');
    }
  };

  const filteredSchools = schools.filter((sch) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      sch.name.toLowerCase().includes(q) ||
      (sch.code && sch.code.toLowerCase().includes(q)) ||
      (sch.state && sch.state.toLowerCase().includes(q)) ||
      (sch.email && sch.email.toLowerCase().includes(q));
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'SUSPENDED' ? sch.status === 'SUSPENDED' : sch.status !== 'SUSPENDED');
    return matchesSearch && matchesStatus;
  });

  const activeCount = schools.filter((s) => s.status !== 'SUSPENDED').length;
  const suspendedCount = schools.filter((s) => s.status === 'SUSPENDED').length;

  return (
    <div id="super-admin-dashboard" className="space-y-6">
      {/* SaaS Platform Operator Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#05231c] text-white p-6 rounded-2xl shadow-md border border-slate-700/80">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-950/80 border border-slate-700/80 shadow-inner select-none mb-2 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 font-mono tracking-wide">
                <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">System:</span>
                <span>Super Master Admin Platform</span>
              </span>
              <span className="w-px h-3 bg-slate-700/80" />
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 font-bold font-sans">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                {isRealtimeActive ? 'Firestore Live Sync Active' : 'Realtime Data Ready'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              SchoolCore Global Platform — {user?.full_name || 'Samuel Emmanuel'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Master Admin Control Center: Multi-tenant operations, school provisioning, live data feeds, and institutional governance across all schools.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Provision New School</span>
            </button>
            <button
              onClick={() => onNavigate('audit')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Platform Audit Logs</span>
            </button>
            <button
              onClick={() => onNavigate('notices')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span>Platform Broadcast</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global SaaS Platform Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total School Tenants</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{schools.length} Active</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Live registered tenants</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Super Master Admin</span>
            <Lock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-purple-700 truncate mt-2">samuelemma466@gmail.com</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Full multi-tenant authority</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Database Engine</span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">Cloud Firestore</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Real-time reactive storage</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Telemetry</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">100% Online</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Real-time sync stream connected</div>
        </div>
      </div>

      {/* Tenant Registry Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Provisioned School Tenants</h3>
            </div>
            <p className="text-xs text-slate-500">Autonomous institutional tenants running on SchoolCore multi-school architecture</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
              Live: {schools.length} {schools.length === 1 ? 'School' : 'Schools'}
            </span>
            <button
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-rose-200 transition-colors cursor-pointer"
              title="Purge all demo and test schools from database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Purge Demo Data</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Provision School</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search school name, code, state, or email..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({schools.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SUSPENDED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'SUSPENDED'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
              }`}
            >
              Suspended ({suspendedCount})
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Loading registered school tenants from Cloud Firestore...
            </div>
          ) : schools.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-3">
              <Building2 className="w-12 h-12 mx-auto text-emerald-600/40" />
              <div>
                <p className="font-bold text-slate-800 text-sm">No schools provisioned yet</p>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  Start with a clean installation. Click below to provision your platform's first institution and initial administrator.
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Provision First School</span>
              </button>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400 space-y-2">
              <p className="font-medium text-slate-600">No schools match your search or filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="text-emerald-600 hover:underline font-semibold cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredSchools.map((sch) => {
              const isSuspended = sch.status === 'SUSPENDED';
              return (
                <div
                  key={sch.id}
                  className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isSuspended ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isSuspended
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {(sch.code || sch.name.slice(0, 3)).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-base">{sch.name}</h4>
                        {sch.code && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                            {sch.code}
                          </span>
                        )}
                        {isSuspended ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <PauseCircle className="w-3 h-3" /> SUSPENDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {sch.address || 'Campus address pending'} {sch.state ? `• ${sch.state}` : ''}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 mt-2">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Tenant Isolated
                        </span>
                        {sch.email && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Mail className="w-3 h-3" /> {sch.email}
                          </span>
                        )}
                        {sch.phone && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3" /> {sch.phone}
                          </span>
                        )}
                        <span className="text-slate-400">
                          ID: <code className="font-mono text-[10px]">{sch.id}</code>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Activate / Suspend Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleSchoolStatus(sch)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isSuspended
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                      }`}
                      title={isSuspended ? `Activate ${sch.name}` : `Suspend ${sch.name}`}
                    >
                      {isSuspended ? (
                        <>
                          <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Activate</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Suspend</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenSchool(sch)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Open Workspace</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSchoolToDelete(sch);
                        setDeleteConfirmationText('');
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"
                      title={`Remove ${sch.name} from platform`}
                      aria-label={`Remove ${sch.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Provision New School Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative border border-slate-200 my-8">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setProvisionResult(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {provisionResult ? (
              /* Success Confirmation Screen */
              <div id="school-provisioned-success" className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">School Created Successfully</h3>
                    <p className="text-xs text-slate-500">Autonomous tenant and administrator account are active</p>
                  </div>
                </div>

                {/* Provision Summary Card */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">School Name</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{provisionResult.school.name}</p>
                      <p className="text-xs font-mono text-emerald-700 font-semibold">{provisionResult.school.code}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</span>
                      <p className="text-xs text-slate-800 mt-0.5">
                        {provisionResult.school.address || 'Campus Address'}, {provisionResult.school.state}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Administrator Account</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                      <div>
                        <span className="text-[11px] text-slate-500">Administrator Name:</span>
                        <p className="text-xs font-bold text-slate-900">
                          {provisionResult.administrator?.full_name || adminName || 'School Administrator'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">Login Email:</span>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900">
                            {provisionResult.administrator?.email || adminEmail || provisionResult.school.email}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                provisionResult.administrator?.email || adminEmail || provisionResult.school.email || '',
                                'Email'
                              )
                            }
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Copy email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {provisionResult.initialPassword && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Initial Password</span>
                          <p className="text-xs font-mono font-bold text-slate-800 tracking-wider">
                            {provisionResult.initialPassword}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(provisionResult.initialPassword!, 'Password')}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Status: Active
                      </span>
                      <span className="text-[11px] text-slate-500">WAEC Standard Grading • Academic Session Initialized</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      handleOpenSchool(provisionResult.school);
                    }}
                    className="w-full sm:flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Open School Workspace</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:w-auto px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Create Another School
                  </button>
                </div>
              </div>
            ) : (
              /* Provisioning Form */
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">Provision School Tenant</h3>
                      <p className="text-xs text-slate-500">
                        Register a new institution with autonomous workspace and primary administrator
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreateSchool} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
                  {/* Section 1: School Information */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                      <SchoolIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1. School Information</span>
                    </h4>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        School Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Greenwood International College"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">School Type</label>
                        <select
                          value={schoolType}
                          onChange={(e) => setSchoolType(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                        >
                          <option value="Comprehensive High School (JSS & SSS)">Comprehensive High School (JSS & SSS)</option>
                          <option value="Senior Secondary School">Senior Secondary School</option>
                          <option value="Junior Secondary School">Junior Secondary School</option>
                          <option value="Primary & Nursery School">Primary & Nursery School</option>
                          <option value="K-12 International Academy">K-12 International Academy</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          School Code <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. GIC-LAGOS"
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Official School Email</label>
                        <input
                          type="email"
                          placeholder="info@greenwood.sch.ng"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">School Phone</label>
                        <input
                          type="tel"
                          placeholder="+234 803 000 0000"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Physical Address</label>
                      <input
                        type="text"
                        placeholder="e.g. 15 Education Boulevard, Lekki Phase 1"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">City / LGA</label>
                        <input
                          type="text"
                          placeholder="e.g. Eti-Osa"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                        <select
                          value={newState}
                          onChange={(e) => setNewState(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                        >
                          <option value="Abia">Abia</option>
                          <option value="Abuja (FCT)">Abuja (FCT)</option>
                          <option value="Delta">Delta</option>
                          <option value="Edo">Edo</option>
                          <option value="Enugu">Enugu</option>
                          <option value="Kaduna">Kaduna</option>
                          <option value="Kano">Kano</option>
                          <option value="Lagos">Lagos</option>
                          <option value="Ogun">Ogun</option>
                          <option value="Oyo">Oyo</option>
                          <option value="Rivers">Rivers</option>
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                        <input
                          type="text"
                          disabled
                          value="Nigeria"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 text-slate-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Website <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://greenwood.sch.ng"
                        value={newWebsite}
                        onChange={(e) => setNewWebsite(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Section 2: Primary Administrator Account */}
                  <div className="space-y-3.5 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>2. Primary Administrator Account</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Creates the institutional executive administrator credential for this school's autonomous portal.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Administrator Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. Folashade Adeyemi"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Administrator Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. admin@greenwood.sch.ng"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Administrator Phone</label>
                        <input
                          type="tel"
                          placeholder="+234 802 345 6789"
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">Initial Password</label>
                          <button
                            type="button"
                            onClick={generateSecurePassword}
                            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                          >
                            Generate
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="w-full h-10 px-3 pr-10 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submission */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
                    >
                      <PlusCircle size={16} />
                      <span>{isSubmitting ? 'Provisioning School Tenant...' : 'Provision School Tenant'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decommission School Tenant Confirmation Modal */}
      {schoolToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setSchoolToDelete(null);
                setDeleteConfirmationText('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Decommission School Tenant</h3>
                <p className="text-xs text-slate-500">Permanent platform tenant removal</p>
              </div>
            </div>

            <div className="bg-red-50/80 border border-red-200 rounded-xl p-3.5 space-y-2 text-xs text-red-900">
              <div className="font-semibold flex items-center justify-between">
                <span>{schoolToDelete.name}</span>
                {schoolToDelete.code && <span className="font-mono bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px]">{schoolToDelete.code}</span>}
              </div>
              <p className="text-[11px] text-red-700 leading-relaxed">
                This action will permanently delete this school tenant and purge all scoped academic records (students, classes, staff memberships, grade books, and fee ledgers). This action cannot be undone.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Confirmation Keyword
                </label>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmationText('DELETE')}
                  className="text-[11px] font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                >
                  Quick Fill: DELETE
                </button>
              </div>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE or click Quick Fill above"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSchoolToDelete(null);
                  setDeleteConfirmationText('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSchool}
                disabled={isDeleting}
                className="h-10 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Removing Tenant...' : 'Permanently Delete School'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge Demo Data Confirmation Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative border border-slate-200">
            <button
              type="button"
              onClick={() => setShowPurgeModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Purge Demo & Test Data</h3>
                <p className="text-xs text-slate-500">Database cleanup operation</p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs text-amber-900">
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                This will purge all mock / demo institutions and temporary test runs from the platform. Your real primary school tenant (<strong>Sofiateria academy international</strong>) will remain completely intact.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                disabled={isPurging}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurgeDemoData}
                disabled={isPurging}
                className="h-10 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPurging ? 'Purging Demo Data...' : 'Confirm Purge Demo Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
