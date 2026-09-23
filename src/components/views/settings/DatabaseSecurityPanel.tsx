import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api.ts';
import { useToast } from '../../common/Toast.tsx';
import {
  Database,
  Shield,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Table,
  Lock,
  Layers,
  Code2,
  Server,
  FileCode2,
  Check,
  X,
} from 'lucide-react';

interface DatabaseStatus {
  configured: boolean;
  projectUrl: string;
  projectRef: string;
  databaseMode: string;
  health: {
    ok: boolean;
    connected: boolean;
    tablesReady: boolean;
    tablesCount?: number;
    projectRef: string;
    message: string;
    latencyMs?: number;
  };
  schemaFile: string;
  seedFile: string;
  tablesDefined: number;
  tables: string[];
  securityProtocols: string[];
}

export const DatabaseSecurityPanel: React.FC = () => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [migrationSql, setMigrationSql] = useState<string>('');
  const [coreSql, setCoreSql] = useState<string>('');
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeSqlTab, setActiveSqlTab] = useState<'core' | 'migration' | 'seed'>('core');
  const [seedSql, setSeedSql] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await api.syncToSupabase();
      if (res.ok) {
        showToast('Successfully synchronized institutional data to Supabase!');
        setSyncFeedback(res.message);
        fetchStatus();
      } else {
        showToast(res.message, 'info');
        setSyncFeedback(res.message);
      }
    } catch (err: any) {
      showToast('Sync error: ' + err.message, 'error');
      setSyncFeedback(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const data = await api.getDatabaseStatus();
      setStatus(data);
    } catch (err: any) {
      showToast('Could not fetch Supabase status: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStatus();
  };

  const handleOpenSqlModal = async (type: 'core' | 'migration' | 'seed') => {
    setActiveSqlTab(type);
    setIsSqlModalOpen(true);
    try {
      if (type === 'core' && !coreSql) {
        const sql = await api.getCoreMigrationSql();
        setCoreSql(sql);
      } else if (type === 'migration' && !migrationSql) {
        const sql = await api.getMigrationSql();
        setMigrationSql(sql);
      } else if (type === 'seed' && !seedSql) {
        const sql = await api.getSeedSql();
        setSeedSql(sql);
      }
    } catch (err: any) {
      showToast('Failed to load SQL: ' + err.message, 'error');
    }
  };

  const handleCopySql = () => {
    const textToCopy =
      activeSqlTab === 'core'
        ? coreSql
        : activeSqlTab === 'migration'
        ? migrationSql
        : seedSql;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    showToast(
      `${
        activeSqlTab === 'core'
          ? 'Core Tables'
          : activeSqlTab === 'migration'
          ? 'Full Migration'
          : 'Seed'
      } SQL copied to clipboard!`
    );
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs animate-pulse">
        Checking Supabase PostgreSQL connection & security protocols...
      </div>
    );
  }

  const isConnected = status?.health?.connected ?? false;
  const tablesReady = status?.health?.tablesReady ?? false;

  return (
    <div id="database-security-panel" className="space-y-6">
      {/* 1. Connection Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                Supabase PostgreSQL Backend
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {isConnected ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {isConnected ? 'ONLINE & CONNECTED' : 'DISCONNECTED'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Authoritative institutional cloud database with Row-Level Security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-db-status-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking...' : 'Refresh Status'}</span>
            </button>
            <a
              id="open-supabase-dashboard-link"
              href="https://supabase.com/dashboard/project/vpkxkmglbzqyfgvoizjs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <span>Supabase Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Status Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">Project Reference</span>
            <span className="font-mono font-bold text-slate-800 text-xs">
              {status?.projectRef || 'vpkxkmglbzqyfgvoizjs'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">Active Database Mode</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-600" />
              {status?.databaseMode?.toUpperCase() || 'SUPABASE'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">Connection Latency</span>
            <span className="font-semibold text-slate-800">
              {status?.health?.latencyMs !== undefined ? `${status.health.latencyMs} ms` : 'Active'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">Tables Defined</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {status?.tablesDefined || 23} Production Relations
            </span>
          </div>
        </div>

        {/* Notice Box */}
        <div className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
          tablesReady
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          {tablesReady ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Code2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-semibold">
              {tablesReady
                ? 'Supabase Database Active & Synced'
                : 'Schema Migration & RLS Security Protocols Ready'}
            </p>
            <p className="text-[11px] opacity-90 leading-relaxed">
              {status?.health?.message ||
                'All database tables and multi-tenant security policies are defined according to Supabase best practices.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. SQL Migration & Schema Scripts Action Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileCode2 className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-slate-900 text-sm">Database Schema & Seeding Tools</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The complete SQL migration script defines all 23 database tables, indexes, multi-tenant helper functions,
          and Row-Level Security (RLS) policies. You can inspect or copy the script directly to execute in the
          Supabase SQL Editor.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            id="view-core-sql-btn"
            onClick={() => handleOpenSqlModal('core')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Code2 className="w-4 h-4" />
            <span>View Core Tables SQL (profiles, students, classes, attendance, staff, notices)</span>
          </button>

          <button
            id="view-migration-sql-btn"
            onClick={() => handleOpenSqlModal('migration')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Code2 className="w-4 h-4" />
            <span>View Full Schema (23 Tables + RLS)</span>
          </button>

          <button
            id="view-seed-sql-btn"
            onClick={() => handleOpenSqlModal('seed')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-200 transition-colors"
          >
            <Database className="w-4 h-4 text-slate-600" />
            <span>View / Copy Seed Data SQL</span>
          </button>

          <button
            id="sync-to-supabase-btn"
            onClick={handleSyncToSupabase}
            disabled={isSyncing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Sync Local School Data to Supabase'}</span>
          </button>
        </div>

        {syncFeedback && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono">
            {syncFeedback}
          </div>
        )}
      </div>

      {/* 3. Defined Database Relations Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">23 Defined Database Tables</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            PostgreSQL public schema
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {[
            { name: 'schools', desc: 'Multi-tenant institutional root' },
            { name: 'academic_sessions', desc: 'School calendar years & active sessions' },
            { name: 'profiles', desc: 'Global user identity & login credentials' },
            { name: 'school_users', desc: 'Tenant memberships & RBAC role access' },
            { name: 'classes', desc: 'Classrooms, arms, and capacity limits' },
            { name: 'subjects', desc: 'Core & elective subject definitions' },
            { name: 'students', desc: 'Student enrollment & bio profiles' },
            { name: 'staff', desc: 'Staff directory & employment profiles' },
            { name: 'attendance_sessions', desc: 'Morning / afternoon roll-call headers' },
            { name: 'attendance_records', desc: 'Individual student attendance marks' },
            { name: 'notices', desc: 'Announcements & broadcast notices' },
            { name: 'school_settings', desc: 'Late cutoff & device configurations' },
            { name: 'audit_logs', desc: 'Immutable append-only security logs' },
            { name: 'academic_configs', desc: 'Term grading scales & CA weights' },
            { name: 'teacher_subject_assignments', desc: 'Subject teacher mapping' },
            { name: 'subject_results', desc: 'Continuous assessments & exam marks' },
            { name: 'student_term_remarks', desc: 'Principal & teacher term remarks' },
            { name: 'homework', desc: 'Digital homework assignments' },
            { name: 'homework_submissions', desc: 'Student submissions & grading' },
            { name: 'direct_messages', desc: 'Internal multi-tenant direct messages' },
            { name: 'fee_accounts', desc: 'Student tuition & ledger balances' },
            { name: 'fee_payments', desc: 'Payment transactions & receipts' },
            { name: 'digital_approvals', desc: 'Administrative requisition workflows' },
          ].map((t) => (
            <div
              key={t.name}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-start gap-2 text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-mono font-bold text-slate-800 block truncate">
                  public.{t.name}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {t.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Security Protocols Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Shield className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-slate-900 text-sm">Security Protocols & RLS Safeguards</h3>
        </div>

        <div className="space-y-2.5 text-xs text-slate-700">
          {[
            {
              title: 'Multi-Tenant Isolation via public.get_user_school_id()',
              desc: 'Cross-tenant data bleeding is prevented at the database engine level. Queries cannot access rows belonging to other institutions.',
            },
            {
              title: 'Row Level Security (RLS) on all 23 Relations',
              desc: 'Every single table has Row Level Security enabled. Unauthenticated or unpermitted access is rejected by PostgreSQL with code 42501.',
            },
            {
              title: 'Optimized (SELECT auth.uid()) Subqueries',
              desc: 'Adheres to Supabase performance best practices by wrapping auth calls in initPlan subqueries, avoiding per-row re-evaluation.',
            },
            {
              title: 'SECURITY DEFINER Functions with Explicit search_path',
              desc: 'Protected against search-path injection vulnerabilities by explicitly specifying search_path = public on all helper routines.',
            },
            {
              title: 'Immutable Append-Only Audit Trail',
              desc: 'All security events (logins, student enrollments, result publications, settings updates) write to audit_logs without update/delete permissions.',
            },
          ].map((sec, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100">
              <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">{sec.title}</span>
                <span className="text-[11px] text-slate-600 block mt-0.5">{sec.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SQL Modal */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {activeSqlTab === 'core'
                        ? 'SchoolCore Core Tables SQL (profiles, students, classes, attendance, staff, notices)'
                        : activeSqlTab === 'migration'
                        ? 'SchoolCore Full Schema & RLS Migration (23 Tables)'
                        : 'SchoolCore Idempotent Seed SQL'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Copy and paste into your Supabase SQL Editor to execute
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="copy-sql-modal-btn"
                    onClick={handleCopySql}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy SQL'}</span>
                  </button>
                  <button
                    id="close-sql-modal-btn"
                    onClick={() => setIsSqlModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex gap-2 border-b border-slate-200/80 -mb-4 pb-2">
                <button
                  onClick={() => handleOpenSqlModal('core')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    activeSqlTab === 'core'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  Core Tables (6 Tables + RLS)
                </button>
                <button
                  onClick={() => handleOpenSqlModal('migration')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    activeSqlTab === 'migration'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  Full Schema (23 Tables)
                </button>
                <button
                  onClick={() => handleOpenSqlModal('seed')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    activeSqlTab === 'seed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  Seed Data
                </button>
              </div>
            </div>

            {/* SQL Content */}
            <div className="p-4 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-slate-200 select-all whitespace-pre leading-relaxed">
              {activeSqlTab === 'core'
                ? coreSql || 'Loading Core Tables SQL...'
                : activeSqlTab === 'migration'
                ? migrationSql || 'Loading Full Schema SQL migration...'
                : seedSql || 'Loading seed SQL...'}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
              <span>Target: Supabase PostgreSQL 15+</span>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
