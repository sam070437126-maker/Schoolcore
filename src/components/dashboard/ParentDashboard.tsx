import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NavTab } from '../layout/Sidebar.tsx';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Bell,
  Users,
  ClipboardCheck,
  ChevronRight,
  School,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useRealtimeSubscription } from '../../lib/supabase-realtime.ts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card.tsx';
import { Button } from '../ui/button.tsx';
import { FamilyNotificationStream } from '../FamilyNotificationStream.tsx';
import { FamilyGuardiansCard } from '../FamilyGuardiansCard.tsx';
import { SchoolLocationMap } from '../SchoolLocationMap.tsx';

interface ParentDashboardProps {
  onNavigate: (tab: NavTab, extra?: any) => void;
  todayFormatted: string;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  onNavigate,
  todayFormatted,
}) => {
  const { user, school } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [familyGroupId, setFamilyGroupId] = useState<string | undefined>(undefined);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);

  const loadParentData = async () => {
    try {
      // Fetch child record
      const studentRes = await api.getStudents({ limit: 1 });
      if (studentRes.students && studentRes.students.length > 0) {
        const child = studentRes.students[0];
        setStudent(child);
        const childDetails = await api.getStudentById(child.id);
        if (childDetails.attendanceStats) {
          setAttendanceStats(childDetails.attendanceStats);
        }
      }

      // Fetch family linkage
      try {
        const famRes = await api.getFamilyGuardians();
        if (famRes?.family_group_id) {
          setFamilyGroupId(famRes.family_group_id);
        }
        if (famRes?.student && !student) {
          setStudent(famRes.student);
        }
      } catch {
        // No family group linked yet
      }

      // Fetch published notices
      const noticesRes = await api.getNotices('EVERYONE');
      const allNotices = noticesRes.notices || [];
      setRecentNotices(allNotices.slice(0, 4));
    } catch (err) {
      console.warn('Could not load parent dashboard data:', err);
    }
  };

  useEffect(() => {
    loadParentData();
  }, []);

  // Subscribe to real-time attendance and notice updates
  useRealtimeSubscription('attendance', () => {
    loadParentData();
  });
  useRealtimeSubscription('notices', () => {
    loadParentData();
  });

  return (
    <div id="parent-dashboard" className="space-y-6">
      {/* Welcome Greeting Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#07251d] text-white p-6 rounded-2xl shadow-md border border-slate-700/80">
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
                Parent Portal
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome, {user?.full_name || 'Parent / Guardian'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Parent Portal for <strong className="text-white font-semibold">{student ? `${student.first_name} ${student.last_name}` : 'Tunde Adeyemi'}</strong> {student?.class_name ? `(${student.class_name})` : ''} at {school?.name || 'SchoolCore'}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              id="parent-view-child-btn"
              onClick={() => onNavigate('students')}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Users className="w-4 h-4" />
              View Child Profile
            </Button>
            <Button
              id="parent-view-attendance-btn"
              onClick={() => onNavigate('attendance')}
              size="sm"
              variant="outline"
              className="bg-slate-800/90 hover:bg-slate-800 text-slate-100 border-slate-700 hover:text-white"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              Attendance History
            </Button>
          </div>
        </div>
      </div>

      {/* Child Real-Time Attendance & Enrolment KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          id="parent-kpi-attendance-rate"
          onClick={() => onNavigate('attendance')}
          className="p-4 cursor-pointer hover:border-emerald-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Attendance Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {attendanceStats ? `${attendanceStats.attendanceRate}%` : '96%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Verified roll calls
          </div>
        </Card>

        <Card
          id="parent-kpi-sessions-present"
          onClick={() => onNavigate('attendance')}
          className="p-4 cursor-pointer hover:border-blue-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Days Present</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-2">
            {attendanceStats ? attendanceStats.presentDays : '48'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Recorded this academic term</div>
        </Card>

        <Card
          id="parent-kpi-days-absent"
          onClick={() => onNavigate('attendance')}
          className="p-4 cursor-pointer hover:border-amber-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Days Absent</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">
            {attendanceStats ? attendanceStats.absentDays : '2'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {attendanceStats ? `${attendanceStats.lateDays} late entries` : '1 late entry'}
          </div>
        </Card>

        <Card
          id="parent-kpi-child-class"
          onClick={() => onNavigate('students')}
          className="p-4 cursor-pointer hover:border-purple-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Enrolled Class</span>
            <School className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2 truncate">
            {student?.class_name || 'JSS 2A'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            Adm: {student?.admission_number || 'BFS/2024/084'}
          </div>
        </Card>
      </div>

      {/* Child Information Card & Verified Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Child Snapshot */}
        <Card className="lg:col-span-1 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Enrolled Child Snapshot</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Active Student
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0">
              {student ? `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}` : 'TA'}
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900">
                {student ? `${student.first_name} ${student.middle_name || ''} ${student.last_name}` : 'Tunde Adeyemi'}
              </h4>
              <p className="text-xs text-slate-500">
                Admission No: <strong className="text-slate-700">{student?.admission_number || 'BFS/2024/084'}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Class: <strong className="text-slate-700">{student?.class_name || 'JSS 2A'}</strong>
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Gender:</span>
              <span className="font-medium text-slate-900">{student?.gender || 'MALE'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>House:</span>
              <span className="font-medium text-slate-900">{student?.house || 'Blue House (Nelson Mandela)'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Registered Guardian:</span>
              <span className="font-medium text-slate-900">{student?.guardian_name || user?.full_name || 'Dr. Babatunde Adeyemi'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Guardian Phone:</span>
              <span className="font-medium text-slate-900">{student?.guardian_phone || '08023456789'}</span>
            </div>
          </div>

          <Button
            id="parent-view-full-profile-btn"
            onClick={() => onNavigate('students')}
            variant="outline"
            size="sm"
            className="w-full mt-2"
          >
            <span>View Complete Child Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Card>

        {/* Real-time School Notices & Announcements */}
        <Card className="lg:col-span-2 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <span>Recent School Notices</span>
              </h3>
              <p className="text-xs text-slate-500">Official bulletins from school administration</p>
            </div>
            <button
              onClick={() => onNavigate('notices')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All Notices</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentNotices.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No recent announcements published at this time.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentNotices.slice(0, 3).map((notice) => (
                <div key={notice.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      notice.priority === 'HIGH' || notice.priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {notice.priority || 'NORMAL'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {notice.published_at ? new Date(notice.published_at).toLocaleDateString('en-GB') : 'Recent'}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900">{notice.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{notice.content || notice.message}</p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Official communications from {school?.name || 'SchoolCore'}
            </span>
            <button
              onClick={() => onNavigate('notices')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              Read full notices →
            </button>
          </div>
        </Card>
      </div>

      {/* Granular Family Broadcasts & Co-Guardian Relational Unit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FamilyNotificationStream
          familyGroupId={familyGroupId}
          childName={student ? (student.first_name ? `${student.first_name} ${student.last_name}` : student.name) : undefined}
        />

        <div className="space-y-6">
          <FamilyGuardiansCard
            familyGroupId={familyGroupId}
            onGuardianLinked={loadParentData}
          />

          {school && (
            <SchoolLocationMap
              schoolName={school.name}
              address={school.address || ''}
              phone={school.phone || ''}
              className="h-56 w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
};
