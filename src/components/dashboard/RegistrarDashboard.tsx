import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NavTab } from '../layout/Sidebar.tsx';
import { PaperlessScorecard } from './PaperlessScorecard.tsx';
import { DashboardStats } from '../../types/index.ts';
import {
  Calendar,
  Users,
  UserPlus,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  FolderOpen,
  Printer,
  FileCheck2
} from 'lucide-react';

interface RegistrarDashboardProps {
  stats: DashboardStats | null;
  onNavigate: (tab: NavTab, extra?: any) => void;
  todayFormatted: string;
}

export const RegistrarDashboard: React.FC<RegistrarDashboardProps> = ({
  stats,
  onNavigate,
  todayFormatted,
}) => {
  const { user, school } = useAuth();

  return (
    <div id="registrar-dashboard" className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#042127] text-white p-6 rounded-2xl shadow-md border border-slate-700/80">
        {/* Subtle architectural tactile texture overlay */}
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
                <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Date:</span>
                <span>{todayFormatted}</span>
              </span>
              <span className="w-px h-3 bg-slate-700/80" />
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold font-sans">
                Registry Session
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Admissions & Records Desk — {user?.full_name || 'Registrar'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Student admissions, digital enrollment dossiers, transfer records, and institutional registers for <strong className="text-white font-semibold">{school?.name}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="registrar-admit-btn"
              onClick={() => onNavigate('students', { openCreateModal: true })}
              className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Admit New Student</span>
            </button>
            <button
              onClick={() => onNavigate('students')}
              className="px-3.5 py-2 bg-cyan-900/80 hover:bg-cyan-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-cyan-700 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Registrar Enrollment KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-cyan-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</span>
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.total_students ?? 0}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Active student records</div>
        </div>

        <div
          onClick={() => onNavigate('students', { openCreateModal: true })}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-cyan-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Classes</span>
            <UserPlus className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-cyan-700 mt-2">{stats?.total_classes ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Configured arms</div>
        </div>

        <div
          onClick={() => onNavigate('approvals')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Staff</span>
            <FileCheck2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{stats?.total_staff ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Assigned educators</div>
        </div>

        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attendance Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{stats?.attendance_percentage != null ? `${stats.attendance_percentage}%` : '0%'}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Average roll-call rate</div>
        </div>
      </div>

      {/* Paperless Scorecard */}
      <PaperlessScorecard onNavigate={onNavigate} />

      {/* Registrar Operational Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('students', { openCreateModal: true })}
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-300 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900">Digital Admissions Intake</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Register new students with official admission numbers, parent contact info, medical emergency notes, and previous school history.
          </p>
        </button>

        <button
          onClick={() => onNavigate('students')}
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-300 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900">Student Dossiers & Status</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Manage status changes (Active, Suspended, Transferred, Graduated) and export official student profile dossiers.
          </p>
        </button>

        <button
          onClick={() => onNavigate('approvals')}
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-300 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900">Official Absence Records & Slips</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Archive signed digital permission slips, parent absence declarations, and verified medical sick notes.
          </p>
        </button>
      </div>
    </div>
  );
};
