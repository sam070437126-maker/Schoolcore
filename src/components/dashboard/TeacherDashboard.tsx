import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NavTab } from '../layout/Sidebar.tsx';
import { PaperlessScorecard } from './PaperlessScorecard.tsx';
import { DashboardStats } from '../../types/index.ts';
import {
  Calendar,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Clock,
  CheckCircle2,
  Users,
  ChevronRight,
  Send,
  Bell,
  Activity,
  Plus
} from 'lucide-react';

interface TeacherDashboardProps {
  stats: DashboardStats | null;
  onNavigate: (tab: NavTab, extra?: any) => void;
  todayFormatted: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  stats,
  onNavigate,
  todayFormatted,
}) => {
  const { user, school } = useAuth();

  return (
    <div id="teacher-dashboard" className="space-y-6">
      {/* Teacher Greeting Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#06241b] text-white p-6 rounded-2xl shadow-md border border-slate-700/80">
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
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Date:</span>
                <span>{todayFormatted}</span>
              </span>
              <span className="w-px h-3 bg-slate-700/80" />
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold font-sans">
                Academic Session
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Good day, {user?.full_name || 'Teacher'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Here is your academic and classroom teaching workspace for <strong className="text-white font-semibold">{school?.name}</strong>. Enter continuous assessment marks, take daily roll call, and post assignments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="teacher-enter-scores-top-btn"
              onClick={() => onNavigate('academics', { academicTab: 'scores' })}
              className="px-3.5 py-2 bg-emerald-700/90 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-emerald-500/50 shadow-xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-200" />
              <span>Enter Scores</span>
            </button>
            <button
              id="teacher-top-att-btn"
              onClick={() => onNavigate('attendance')}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700/90 transition-colors cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-slate-300" />
              <span>Roll Call</span>
            </button>
          </div>
        </div>
      </div>

      {/* Paperless Scorecard */}
      <PaperlessScorecard onNavigate={onNavigate} />

      {/* Teacher Academic Workload Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigate('classes')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">My Classes</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.teacher_academics?.total_assigned_classes ?? stats?.teacher_today_classes?.length ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Assigned arms</div>
        </div>

        <div
          onClick={() => onNavigate('academics', { academicTab: 'scores' })}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">My Subjects</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.teacher_academics?.total_assigned_subjects ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Assigned curriculum</div>
        </div>

        <div
          onClick={() => onNavigate('academics', { academicTab: 'scores' })}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Draft Results</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {stats?.teacher_academics?.pending_draft_results ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pending submission</div>
        </div>

        <div
          onClick={() => onNavigate('academics', { academicTab: 'broadsheet' })}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {(stats?.teacher_academics?.submitted_results ?? 0) + (stats?.teacher_academics?.published_results ?? 2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Verified & active</div>
        </div>
      </div>

      {/* Teacher Today's Classes List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Your Classes Today</h3>
            <p className="text-xs text-slate-500">Scheduled classroom teaching periods & roll calls</p>
          </div>
          <button
            id="teacher-take-att-btn"
            onClick={() => onNavigate('attendance')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Open Attendance Register</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {stats?.teacher_today_classes && stats.teacher_today_classes.length > 0 ? (
            stats.teacher_today_classes.map((c) => (
              <div
                key={c.class_id}
                id={`teacher-class-${c.class_id}`}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {c.level}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{c.class_name}</h4>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded font-medium">
                        {c.subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {c.time}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {c.student_count} Students
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('attendance', { classId: c.class_id })}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Roll Call
                  </button>
                  <button
                    onClick={() => onNavigate('academics', { academicTab: 'scores', classId: c.class_id })}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Enter Scores
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              No classes scheduled for today.
            </div>
          )}
        </div>
      </div>

      {/* Teacher Quick Tools & Notices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Teaching Actions</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onNavigate('homework')}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 mb-1" />
              <div className="font-bold text-xs text-slate-900">Assign Homework</div>
              <div className="text-[10px] text-slate-500">Digital tasks & readings</div>
            </button>

            <button
              onClick={() => onNavigate('messages')}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4 text-blue-600 mb-1" />
              <div className="font-bold text-xs text-slate-900">Message Parents</div>
              <div className="text-[10px] text-slate-500">Class broadcast or direct</div>
            </button>

            <button
              onClick={() => onNavigate('classes')}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-purple-600 mb-1" />
              <div className="font-bold text-xs text-slate-900">Class Rosters</div>
              <div className="text-[10px] text-slate-500">View enrolled students</div>
            </button>

            <button
              onClick={() => onNavigate('academics', { academicTab: 'broadsheet' })}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4 text-amber-600 mb-1" />
              <div className="font-bold text-xs text-slate-900">Broadsheet</div>
              <div className="text-[10px] text-slate-500">Class mark sheets</div>
            </button>
          </div>
        </div>

        {/* Notices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              <span>Staff Bulletins</span>
            </h3>
            <button
              onClick={() => onNavigate('notices')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {stats?.important_notices && stats.important_notices.length > 0 ? (
              stats.important_notices.slice(0, 2).map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 truncate">{n.title}</span>
                    {n.priority === 'HIGH' || n.priority === 'URGENT' ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                        {n.priority}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No announcements right now.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
