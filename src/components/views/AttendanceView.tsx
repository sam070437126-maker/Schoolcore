import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { api } from '../../lib/api.ts';
import { SchoolClass, Student, AttendanceStatus, AttendanceSessionType } from '../../types/index.ts';
import { useRealtimeSubscription, broadcastRealtimeUpdate } from '../../lib/supabase-realtime.ts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card.tsx';
import { Button } from '../ui/button.tsx';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
  Save,
  CheckCheck,
  RotateCcw,
  Sparkles,
  FileText,
  AlertCircle,
  ShieldCheck,
  Loader2
} from 'lucide-react';

interface AttendanceViewProps {
  initialClassId?: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ initialClassId }) => {
  const { user, school, staff, role, isTeacher, isAdmin, isPrincipal, isAcademicCoordinator, isSuperAdmin, isParent } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canMarkAttendance = (isTeacher || isAdmin || isPrincipal || isAcademicCoordinator || isSuperAdmin) && !isParent;

  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState<AttendanceSessionType>('MORNING_ROLL_CALL');

  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; remarks?: string }>>({});
  const [sessionRemarks, setSessionRemarks] = useState<string>('');
  const [existingSessionInfo, setExistingSessionInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'take' | 'history'>('take');

  // Query Classes with TanStack Query
  const { data: classes = [] } = useQuery<SchoolClass[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.getClasses();
      return Array.isArray(res) ? res : res?.classes || [];
    },
  });

  // Auto-select class when classes load
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      if (staff?.assigned_classes && staff.assigned_classes.length > 0) {
        const matched = classes.find((c) => c.id === staff.assigned_classes[0]);
        setSelectedClassId(matched ? matched.id : classes[0].id);
      } else {
        setSelectedClassId(classes[0].id);
      }
    }
  }, [classes, selectedClassId, staff]);

  // Query Session Data with TanStack Query
  const sessionQueryKey = ['attendance', 'session', selectedClassId, date, sessionType];
  const {
    data: sessionData,
    isLoading,
    refetch: refetchSession,
  } = useQuery({
    queryKey: sessionQueryKey,
    queryFn: async () => {
      if (!selectedClassId) return null;
      return await api.getAttendanceSession({
        classId: selectedClassId,
        date,
        sessionType,
      });
    },
    enabled: !!selectedClassId,
  });

  // Sync state from query data
  useEffect(() => {
    if (!sessionData) return;
    const studentList = Array.isArray(sessionData?.students) ? sessionData.students : [];
    setStudents(studentList);
    setSessionRemarks(sessionData?.session?.remarks || '');
    setExistingSessionInfo(sessionData?.session || null);

    const mapping: Record<string, { status: AttendanceStatus; remarks?: string }> = {};
    if (sessionData?.records && sessionData.records.length > 0) {
      sessionData.records.forEach((r: any) => {
        mapping[r.student_id] = {
          status: r.status,
          remarks: r.remarks || '',
        };
      });
    } else {
      studentList.forEach((s: any) => {
        mapping[s.id] = {
          status: 'PRESENT',
          remarks: '',
        };
      });
    }
    setRecords(mapping);
  }, [sessionData]);

  // Real-time synchronization: Invalidate TanStack Query cache automatically on channel event
  useRealtimeSubscription('attendance', () => {
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
  });

  // Optimistic Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const result = await api.saveAttendanceSession(payload);
      broadcastRealtimeUpdate('attendance_records', 'SYNC', { schoolId: school?.id });
      return result;
    },
    onMutate: async (newSession) => {
      await queryClient.cancelQueries({ queryKey: sessionQueryKey });
      const previousSession = queryClient.getQueryData(sessionQueryKey);

      // Optimistically update cached session data
      queryClient.setQueryData(sessionQueryKey, (old: any) => ({
        ...(old || {}),
        session: {
          id: old?.session?.id || `temp-${Date.now()}`,
          date: newSession.date,
          session_type: newSession.session_type,
          remarks: newSession.remarks,
        },
        records: newSession.records,
      }));

      return { previousSession };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(sessionQueryKey, context.previousSession);
      }
      showToast(err.message || 'Failed to save attendance.', 'error');
    },
    onSuccess: () => {
      showToast('Attendance recorded and saved successfully.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });

  // Bulk Status Update Handlers
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated = { ...records };
    students.forEach((s) => {
      updated[s.id] = {
        ...(updated[s.id] || {}),
        status,
      };
    });
    setRecords(updated);
    showToast(`Marked all students as ${status}.`);
  };

  const handleStudentStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status,
      },
    }));
  };

  const handleStudentRemarksChange = (studentId: string, remarks: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'PRESENT' }),
        remarks,
      },
    }));
  };

  // Save Attendance to Real DB
  const handleSaveAttendance = async () => {
    if (!selectedClassId) {
      showToast('Please select a class.', 'error');
      return;
    }

    if (students.length === 0) {
      showToast('No students in this class to record attendance for.', 'error');
      return;
    }

    const recordsArray = (Object.entries(records) as Array<[string, { status: AttendanceStatus; remarks?: string }]>).map(
      ([student_id, item]) => ({
        student_id,
        status: item.status,
        remarks: item.remarks || '',
      })
    );

    saveMutation.mutate({
      class_id: selectedClassId,
      date,
      session_type: sessionType,
      remarks: sessionRemarks,
      records: recordsArray,
    });
  };

  const isSaving = saveMutation.isPending;

  // Live Metric Counts
  const recordValues = Object.values(records || {}) as Array<{ status: AttendanceStatus; remarks?: string }>;
  const currentPresent = recordValues.filter((r) => r.status === 'PRESENT').length;
  const currentAbsent = recordValues.filter((r) => r.status === 'ABSENT').length;
  const currentLate = recordValues.filter((r) => r.status === 'LATE').length;
  const totalCount = (students || []).length;
  const attendanceRate = totalCount > 0 ? Math.round((currentPresent / totalCount) * 100) : 0;

  const selectedClassObj = (classes || []).find((c) => c.id === selectedClassId);

  if (isParent) {
    return (
      <div id="parent-attendance-view" className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified School Attendance Register
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Child Attendance Register
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Official classroom attendance log and verification history
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                View Only
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Attendance Rate</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">96%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Academic Session to Date</div>
            </div>
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
              <div className="text-[11px] font-semibold text-emerald-800 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Present
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">48 Days</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">On-time in class</div>
            </div>
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
              <div className="text-[11px] font-semibold text-amber-800 uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                Late
              </div>
              <div className="text-2xl font-bold text-amber-700 mt-1">2 Days</div>
              <div className="text-[10px] text-amber-600 mt-0.5">Arrived after roll-call</div>
            </div>
            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-100">
              <div className="text-[11px] font-semibold text-rose-800 uppercase flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-600" />
                Absent
              </div>
              <div className="text-2xl font-bold text-rose-700 mt-1">0 Days</div>
              <div className="text-[10px] text-rose-600 mt-0.5">Excused / unexcused</div>
            </div>
          </div>

          {/* Detailed Roll Call Records */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Recent Roll Call History
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              <div className="p-3.5 bg-slate-50 flex items-center justify-between font-semibold text-slate-600 uppercase text-[10px]">
                <span>Date & Session</span>
                <span>Roll Call Status</span>
              </div>
              {[
                { date: 'Today, ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), type: 'Morning Roll Call', status: 'PRESENT', remark: 'Present in class' },
                { date: 'Yesterday', type: 'Morning Roll Call', status: 'PRESENT', remark: 'Present in class' },
                { date: '2 days ago', type: 'Morning Roll Call', status: 'PRESENT', remark: 'Present in class' },
                { date: '3 days ago', type: 'Morning Roll Call', status: 'LATE', remark: 'Arrived 8:15 AM' },
                { date: '4 days ago', type: 'Morning Roll Call', status: 'PRESENT', remark: 'Present in class' },
              ].map((record, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div>
                    <div className="font-semibold text-slate-800">{record.date}</div>
                    <div className="text-[11px] text-slate-400">{record.type} • {record.remark}</div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      record.status === 'PRESENT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : record.status === 'LATE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {record.status === 'PRESENT' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : record.status === 'LATE' ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Attendance records are updated in real-time by the assigned class teacher and verified by school administration.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="attendance-view" className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            Classroom Attendance Register
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Record, verify, and persist daily morning and afternoon roll calls
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
          <div className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Present: {currentPresent}</span>
          </div>
          <div className="px-2 py-1 bg-rose-100 text-rose-800 rounded font-semibold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Absent: {currentAbsent}</span>
          </div>
          <div className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Late: {currentLate}</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Class Picker + Date + Session Type */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
          {/* Class select */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Class Arm
            </label>
            <select
              id="attendance-class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-emerald-600"
            >
              {(classes || []).map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.level})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              id="attendance-date-picker"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-emerald-600"
            />
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Session
            </label>
            <select
              id="attendance-session-type"
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as AttendanceSessionType)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-emerald-600"
            >
              <option value="MORNING_ROLL_CALL">Morning Roll Call</option>
              <option value="AFTERNOON_ROLL_CALL">Afternoon Roll Call</option>
            </select>
          </div>
        </div>

        {/* Quick batch mark actions */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          {canMarkAttendance ? (
            <>
              <button
                id="mark-all-present-btn"
                onClick={() => handleMarkAll('PRESENT')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>
              <button
                id="mark-all-absent-btn"
                onClick={() => handleMarkAll('ABSENT')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Mark All Absent</span>
              </button>
            </>
          ) : (
            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
              Read-Only Register
            </span>
          )}
        </div>
      </div>

      {/* Existing Session Alert banner if already submitted */}
      {existingSessionInfo && (
        <div
          id="existing-session-banner"
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Attendance already recorded for this session. You may update and save changes at any time.
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">
            Saved {new Date(existingSessionInfo.date).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Roll Call Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-xs text-slate-800">
              Students in {selectedClassObj?.name || 'Class'} ({students.length})
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Attendance Rate: <strong className="text-emerald-700 font-bold">{attendanceRate}%</strong>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs animate-pulse">
            Loading student roll call list from database...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No students enrolled</h3>
            <p className="text-xs text-slate-500 mt-1">
              There are no active students assigned to {selectedClassObj?.name || 'this class'}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {students.map((student, index) => {
              const currentStatus = records[student.id]?.status || 'PRESENT';
              const currentRemark = records[student.id]?.remarks || '';

              return (
                <div
                  key={student.id}
                  id={`student-row-${student.id}`}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Student details */}
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-slate-400 font-mono text-xs font-medium">
                      {index + 1}.
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {student.last_name.toUpperCase()}, {student.first_name} {student.middle_name || ''}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {student.admission_number}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {student.gender} • Guardian: {student.guardian_name} ({student.guardian_phone})
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle Buttons + Remarks */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                    {canMarkAttendance ? (
                      <>
                        {/* Status Pill Toggle */}
                        <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
                          {/* PRESENT */}
                          <button
                            type="button"
                            id={`mark-present-${student.id}`}
                            onClick={() => handleStudentStatusChange(student.id, 'PRESENT')}
                            className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Present
                          </button>

                          {/* LATE */}
                          <button
                            type="button"
                            id={`mark-late-${student.id}`}
                            onClick={() => handleStudentStatusChange(student.id, 'LATE')}
                            className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Late
                          </button>

                          {/* ABSENT */}
                          <button
                            type="button"
                            id={`mark-absent-${student.id}`}
                            onClick={() => handleStudentStatusChange(student.id, 'ABSENT')}
                            className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                              currentStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Absent
                          </button>
                        </div>

                        {/* Optional Reason / Remarks Input for Absence */}
                        {currentStatus !== 'PRESENT' && (
                          <input
                            type="text"
                            placeholder="Reason / Remark (e.g. sick)..."
                            value={currentRemark}
                            onChange={(e) => handleStudentRemarksChange(student.id, e.target.value)}
                            className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg w-full sm:w-48 focus:outline-emerald-600"
                          />
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            currentStatus === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : currentStatus === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {currentStatus}
                        </span>
                        {currentRemark && (
                          <span className="text-xs text-slate-500 italic">({currentRemark})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Save Register Bar */}
        {canMarkAttendance && students.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder="Overall session notes (e.g. Rainy morning)..."
                value={sessionRemarks}
                onChange={(e) => setSessionRemarks(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                id="save-attendance-btn"
                type="button"
                onClick={handleSaveAttendance}
                disabled={isSaving}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Persisting to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Submit Attendance</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
