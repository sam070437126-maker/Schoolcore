import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NavTab } from '../layout/Sidebar.tsx';
import { PaperlessScorecard } from './PaperlessScorecard.tsx';
import { DashboardStats } from '../../types/index.ts';
import {
  Calendar,
  BookOpen,
  Award,
  Layers,
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sliders,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

interface AcademicCoordinatorDashboardProps {
  stats: DashboardStats | null;
  onNavigate: (tab: NavTab, extra?: any) => void;
  todayFormatted: string;
}

export const AcademicCoordinatorDashboard: React.FC<AcademicCoordinatorDashboardProps> = ({
  stats,
  onNavigate,
  todayFormatted,
}) => {
  const { user, school } = useAuth();

  return (
    <div id="academic-coordinator-dashboard" className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#1e1035] text-white p-6 rounded-2xl shadow-md border border-slate-700/80">
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
                <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Date:</span>
                <span>{todayFormatted}</span>
              </span>
              <span className="w-px h-3 bg-slate-700/80" />
              <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold font-sans">
                Curriculum Session
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Academic Operations Desk — {user?.full_name || 'Academic Coordinator'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Curriculum oversight, assessment structures, teacher-subject allocations, and terminal results quality control for <strong className="text-white font-semibold">{school?.name}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('academics', { academicTab: 'broadsheet' })}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Review Broadsheet</span>
            </button>
            <button
              onClick={() => onNavigate('classes')}
              className="px-3.5 py-2 bg-purple-900/80 hover:bg-purple-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-purple-700 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Classes & Curriculum</span>
            </button>
          </div>
        </div>
      </div>

      {/* Academic Operations KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigate('academics', { academicTab: 'scores' })}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Students</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.total_students ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Enrolled learners</div>
        </div>

        <div
          onClick={() => onNavigate('classes')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Arms</span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.total_classes ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active academic registers</div>
        </div>

        <div
          onClick={() => onNavigate('academics', { academicTab: 'scores' })}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Teachers</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{stats?.total_staff ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Faculty instructors</div>
        </div>

        <div
          onClick={() => onNavigate('academics', { academicTab: 'broadsheet' })}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attendance Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{stats?.attendance_percentage != null ? `${stats.attendance_percentage}%` : '0%'}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Daily roll-call metric</div>
        </div>
      </div>

      {/* Paperless Scorecard */}
      <PaperlessScorecard onNavigate={onNavigate} />

      {/* Academic Coordination Launchpad */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('academics', { academicTab: 'broadsheet' })}
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-300 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900">Term Broadsheets & Quality Check</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Audit continuous assessment scores, grade point distributions, and teacher remarks before Principal approval.
          </p>
        </button>

        <button
          onClick={() => onNavigate('classes')}
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-300 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900">Subject Allocation & Teachers</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Map faculty teachers to specific class arms and subjects to guarantee accurate score entry permissions.
          </p>
        </button>

        <button
          onClick={() => onNavigate('academics', { academicTab: 'report-cards' })}
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-300 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900">Official Report Cards Publishing</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Publish verified electronic terminal result sheets accessible instantly by parents without printing paper cards.
          </p>
        </button>
      </div>
    </div>
  );
};
