import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NavTab } from '../layout/Sidebar.tsx';
import { PaperlessScorecard } from './PaperlessScorecard.tsx';
import { DashboardStats } from '../../types/index.ts';
import {
  Calendar,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Users,
  ShieldCheck,
  FileCheck2,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  Bell
} from 'lucide-react';

interface PrincipalDashboardProps {
  stats: DashboardStats | null;
  onNavigate: (tab: NavTab, extra?: any) => void;
  todayFormatted: string;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({
  stats,
  onNavigate,
  todayFormatted,
}) => {
  const { user, school } = useAuth();

  return (
    <div id="principal-dashboard" className="space-y-6">
      {/* Principal Executive Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#111827] text-white p-6 rounded-2xl shadow-md border border-slate-700/80">
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
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Date:</span>
                <span>{todayFormatted}</span>
              </span>
              <span className="w-px h-3 bg-slate-700/80" />
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold font-sans">
                Executive Session
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Executive Oversight — {user?.full_name || 'Principal'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Supervision, teacher roll call compliance, terminal result approvals, and operational oversight for <strong className="text-white">{school?.name}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('academics', { academicTab: 'broadsheet' })}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Approve Results</span>
            </button>
            <button
              onClick={() => onNavigate('approvals')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Review Approvals</span>
            </button>
          </div>
        </div>
      </div>

      {/* Institutional Oversight Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">School Attendance</span>
            <ClipboardCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.attendance_today?.rate_percentage || 94}%
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {stats?.attendance_today?.present || 172} students in school today
          </div>
        </div>

        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Teacher Roll Call</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.attendance_today?.marked_classes || 5} / {stats?.total_classes || 6}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Class registers submitted</div>
        </div>

        <div
          onClick={() => onNavigate('academics', { academicTab: 'broadsheet' })}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Awaiting Approval</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">2</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Classes ready for sign-off</div>
        </div>

        <div
          onClick={() => onNavigate('approvals')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signed Slips</span>
            <FileCheck2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">28</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Parent digital permissions</div>
        </div>
      </div>

      {/* Paperless Scorecard */}
      <PaperlessScorecard onNavigate={onNavigate} />

      {/* Principal Oversight Action Centers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('academics', { academicTab: 'broadsheet' })}
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900">Academic Results Approval</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Review teacher submitted continuous assessment and examination mark sheets before authorizing publication to parents.
          </p>
        </button>

        <button
          onClick={() => onNavigate('attendance')}
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900">Teacher Daily Roll Call Compliance</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Inspect which teachers have recorded morning roll call and flag any delayed registers in real-time.
          </p>
        </button>

        <button
          onClick={() => onNavigate('audit')}
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900">Administrative Audit Trail</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Inspect immutable audit logs of grade changes, staff logins, fee modifications, and system events.
          </p>
        </button>
      </div>
    </div>
  );
};
