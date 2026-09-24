import { broadcastRealtimeUpdate } from './supabase-realtime.ts';
import {
  UserProfile,
  School,
  SchoolUser,
  StaffMember,
  Student,
  SchoolClass,
  Subject,
  AttendanceSession,
  AttendanceRecord,
  SchoolNotice,
  SchoolSettings,
  AuditLog,
  DashboardStats,
  DiscoveredSchoolPlace,
  SchoolVerificationDifference,
  HomeworkAssignment,
  HomeworkSubmission,
  DirectMessage,
  StudentFeeAccount,
  FeePayment,
  DigitalApproval,
  PaperlessKPIs,
  UserNotification,
  LinkGuardianPayload,
  AdminInvitation,
  UserRole,
} from '../types/index.ts';

const TOKEN_KEY = 'schoolcore_token';
const PERSISTENT_DEVICE_KEY = 'schoolcore_persistent_device_auth';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(PERSISTENT_DEVICE_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PERSISTENT_DEVICE_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PERSISTENT_DEVICE_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 3, delayMs = 350): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const activeSchoolId = localStorage.getItem('schoolcore_active_school_id');
  if (activeSchoolId && !headers['x-school-id']) {
    headers['x-school-id'] = activeSchoolId;
  }

  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'A network error occurred. Please check your connection and try again.');
      }

      return data as T;
    } catch (err: any) {
      lastError = err;
      const isNetworkError =
        err?.name === 'TypeError' ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('Load failed');

      if (isNetworkError && attempt < retries) {
        // Wait briefly for dev server or connection to stabilize
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(1.5, attempt)));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export const api = {
  // Auth
  getDemoUsers: () => request<{ users: any[] }>('/auth/demo-users'),
  login: (email: string, password: string) =>
    request<{
      requiresOtp?: boolean;
      email?: string;
      fullName?: string;
      role?: UserRole;
      token?: string;
      user?: UserProfile;
      school?: School;
      membership?: SchoolUser;
      staff?: StaffMember;
      message?: string;
    }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  verifyFirstTimeOtp: (payload: { email: string; otp: string; newPassword?: string }) =>
    request<{ token: string; user: UserProfile; school: School; membership: SchoolUser; staff?: StaffMember; message: string }>(
      '/auth/verify-first-time-otp',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  // Admin User Provisioning & OTP
  getAdminUsers: () =>
    request<{ users: any[] }>('/admin/users'),
  createAdminUser: (payload: {
    email: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    initial_password?: string;
    linked_student_ids?: string[];
    relationship?: string;
    department?: string;
    job_title?: string;
  }) =>
    request<{ user: UserProfile; membership: SchoolUser; staff?: any; otpCode: string; temporaryPassword: string; message: string }>(
      '/admin/users',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  regenerateUserOtp: (membershipId: string) =>
    request<{ success: boolean; otpCode: string; expiresAt: string; message: string }>(
      `/admin/users/${membershipId}/regenerate-otp`,
      { method: 'POST' }
    ),
  activateUser: (membershipId: string) =>
    request<{ success: boolean; membership: SchoolUser; message: string }>(
      `/admin/users/${membershipId}/activate`,
      { method: 'POST' }
    ),
  deleteUser: (membershipId: string) =>
    request<{ success: boolean; message: string }>(
      `/admin/users/${membershipId}`,
      { method: 'DELETE' }
    ),
  switchDemo: (profileId: string) =>
    request<{ token: string; user: UserProfile; school: School; membership: SchoolUser; staff?: StaffMember }>(
      '/auth/switch-demo',
      { method: 'POST', body: JSON.stringify({ profileId }) }
    ),
  // Institutional Invitations & Hardened Registration
  verifyInvitation: (token: string) =>
    request<{ valid: boolean; invitation?: AdminInvitation; schoolName?: string; schoolId?: string; reason?: string }>(
      `/invitations/verify/${encodeURIComponent(token)}`
    ),
  registerWithInvitation: (payload: { token: string; fullName: string; password: string }) =>
    request<{ token: string; user: UserProfile; school: School; membership: SchoolUser; staff?: StaffMember }>(
      '/auth/register-invite',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  getInvitations: () =>
    request<{ invitations: AdminInvitation[] }>('/invitations'),
  createInvitation: (payload: { email: string; role: UserRole; fullName?: string }) =>
    request<{ invitation: AdminInvitation; message: string }>('/invitations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resendInvitation: (id: string) =>
    request<{ invitation: AdminInvitation; message: string }>(`/invitations/${id}/resend`, {
      method: 'POST',
    }),
  revokeInvitation: (id: string) =>
    request<{ success: boolean; message: string }>(`/invitations/${id}`, {
      method: 'DELETE',
    }),
  googleLogin: (payload: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
    googleUid?: string;
    idToken?: string;
  }) =>
    request<{ token: string; user: UserProfile; school: School; membership: SchoolUser; staff?: StaffMember }>(
      '/auth/google',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  register: (payload: {
    email: string;
    password?: string;
    full_name?: string;
    fullName?: string;
    school_name?: string;
    schoolName?: string;
    role?: string;
    phone?: string;
    token?: string;
  }) =>
    request<{ token: string; user: UserProfile; school: School; membership: SchoolUser; staff?: StaffMember }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  signup: (payload: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    school_name: string;
    school_phone?: string;
    school_state?: string;
    school_address?: string;
    school_website?: string;
    school_lga?: string;
    google_place_id?: string;
    google_maps_uri?: string;
    latitude?: number;
    longitude?: number;
    location_source?: string;
  }) =>
    request<{ token: string; user: UserProfile; school: School; membership: SchoolUser; staff?: StaffMember }>(
      '/auth/signup',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  getMe: () =>
    request<{ user: UserProfile; school: School; membership: SchoolUser; staff?: StaffMember }>('/auth/me'),
  updateProfile: (payload: { full_name: string; phone?: string; avatar_url?: string }) =>
    request<{ user: UserProfile; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  changePassword: (payload: { current_password: string; new_password: string; confirm_password: string }) =>
    request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getMemberships: () => request<{ memberships: any[] }>('/auth/memberships'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  // Supabase Database & Security Protocols Status
  getDatabaseStatus: () =>
    request<{
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
    }>('/database/status'),
  getMigrationSql: async (): Promise<string> => {
    const res = await fetch('/api/database/migration-sql');
    if (!res.ok) throw new Error('Failed to fetch migration SQL');
    return res.text();
  },
  getCoreMigrationSql: async (): Promise<string> => {
    const res = await fetch('/api/database/core-migration-sql');
    if (!res.ok) throw new Error('Failed to fetch core migration SQL');
    return res.text();
  },
  getSeedSql: async (): Promise<string> => {
    const res = await fetch('/api/database/seed-sql');
    if (!res.ok) throw new Error('Failed to fetch seed SQL');
    return res.text();
  },
  syncToSupabase: () =>
    request<{ ok: boolean; message: string; syncedCounts: Record<string, number>; errors: string[] }>(
      '/database/sync-to-supabase',
      { method: 'POST' }
    ),

  // Dashboard
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),

  // Students
  getStudents: (params: { search?: string; classId?: string; status?: string; page?: number; limit?: number; scope?: string }) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.classId) query.append('classId', params.classId);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.scope) query.append('scope', params.scope);
    return request<{ students: Student[]; total: number; page: number; totalPages: number }>(`/students?${query.toString()}`);
  },
  getStudentById: (id: string) =>
    request<{ student: Student; attendanceStats: { total: number; present: number; absent: number; late: number; rate: number } }>(
      `/students/${id}`
    ),
  createStudent: async (student: Partial<Student>) => {
    const res = await request<{ message: string; student: Student }>('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
    broadcastRealtimeUpdate('students', 'INSERT', { new: res.student });
    return res;
  },
  updateStudent: async (id: string, updates: Partial<Student>) => {
    const res = await request<{ message: string; student: Student }>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    broadcastRealtimeUpdate('students', 'UPDATE', { new: res.student });
    return res;
  },
  changeStudentStatus: async (id: string, status: string) => {
    const res = await request<{ message: string; student: Student }>(`/students/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    broadcastRealtimeUpdate('students', 'UPDATE', { new: res.student });
    return res;
  },

  // Classes
  getClasses: async () => {
    const res = await request<any>('/classes');
    const classes: SchoolClass[] = Array.isArray(res) ? res : res?.classes || [];
    return { classes };
  },
  getClassById: async (id: string) => {
    const res = await request<any>(`/classes/${id}`);
    const cls: SchoolClass = res?.class || res;
    const students: Student[] = res?.students || res?.student_list || [];
    return { class: cls, students };
  },
  createClass: async (cls: Partial<SchoolClass>) => {
    const res = await request<{ message: string; class: SchoolClass }>('/classes', {
      method: 'POST',
      body: JSON.stringify(cls),
    });
    broadcastRealtimeUpdate('classes', 'INSERT', { new: res.class });
    return res;
  },
  updateClass: async (id: string, updates: Partial<SchoolClass>) => {
    const res = await request<{ message: string; class: SchoolClass }>(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    broadcastRealtimeUpdate('classes', 'UPDATE', { new: res.class });
    return res;
  },
  archiveClass: async (id: string) => {
    const res = await request<{ message: string }>(`/classes/${id}/archive`, { method: 'POST' });
    broadcastRealtimeUpdate('classes', 'DELETE', { old: { id } });
    return res;
  },

  // Subjects
  getSubjects: async () => {
    const res = await request<any>('/subjects');
    const subjects: Subject[] = Array.isArray(res) ? res : res?.subjects || [];
    return { subjects };
  },

  // Staff
  getStaff: async () => {
    const res = await request<any>('/staff');
    const staff: StaffMember[] = Array.isArray(res) ? res : res?.staff || [];
    return { staff };
  },
  createStaff: (member: Partial<StaffMember>) =>
    request<{ message: string; staff: StaffMember }>('/staff', {
      method: 'POST',
      body: JSON.stringify(member),
    }),
  updateStaff: (id: string, updates: Partial<StaffMember>) =>
    request<{ message: string; staff: StaffMember }>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Attendance
  getAttendanceSession: (params: { classId: string; date?: string; sessionType?: string } | string, dateParam?: string) => {
    let classId = '';
    let date = '';
    let sessionType = '';
    if (typeof params === 'object') {
      classId = params.classId;
      date = params.date || '';
      sessionType = params.sessionType || '';
    } else {
      classId = params;
      date = dateParam || '';
    }
    const query = new URLSearchParams({ classId });
    if (date) query.append('date', date);
    if (sessionType) query.append('sessionType', sessionType);
    return request<{
      date: string;
      classId: string;
      session?: AttendanceSession & { remarks?: string };
      records: AttendanceRecord[];
      students: Student[];
    }>(`/attendance/session?${query.toString()}`);
  },
  saveAttendanceSession: async (payload: {
    classId?: string;
    class_id?: string;
    date: string;
    records: Array<{ student_id: string; status: 'PRESENT' | 'ABSENT' | 'LATE'; remarks?: string }>;
    notes?: string;
    remarks?: string;
    sessionType?: string;
    session_type?: string;
  }) => {
    const body = {
      classId: payload.classId || payload.class_id,
      date: payload.date,
      records: payload.records,
      notes: payload.notes || payload.remarks || '',
      sessionType: (payload.sessionType || payload.session_type || 'MORNING').includes('AFTERNOON') ? 'AFTERNOON' : 'MORNING',
    };
    const res = await request<{ message: string; session: AttendanceSession; records: AttendanceRecord[] }>('/attendance/session', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    broadcastRealtimeUpdate('attendance_records', 'INSERT', { new: res.records });
    broadcastRealtimeUpdate('attendance_sessions', 'INSERT', { new: res.session });
    return res;
  },
  getAttendanceHistory: async (classId?: string) => {
    const query = new URLSearchParams();
    if (classId) query.append('classId', classId);
    const res = await request<any>(`/attendance/history?${query.toString()}`);
    const history: AttendanceSession[] = Array.isArray(res) ? res : res?.history || [];
    return { history };
  },

  // Notices
  getNotices: async (audience?: string) => {
    const query = new URLSearchParams();
    if (audience && audience !== 'ALL') query.append('audience', audience);
    const res = await request<any>(`/notices?${query.toString()}`);
    const notices: SchoolNotice[] = Array.isArray(res) ? res : res?.notices || [];
    return { notices };
  },
  createNotice: async (notice: Partial<SchoolNotice>) => {
    const res = await request<{ message: string; notice: SchoolNotice }>('/notices', {
      method: 'POST',
      body: JSON.stringify(notice),
    });
    broadcastRealtimeUpdate('notices', 'INSERT', { new: res.notice });
    return res;
  },
  updateNotice: async (id: string, updates: Partial<SchoolNotice>) => {
    const res = await request<{ message: string; notice: SchoolNotice }>(`/notices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    broadcastRealtimeUpdate('notices', 'UPDATE', { new: res.notice });
    return res;
  },
  deleteNotice: async (id: string) => {
    const res = await request<{ message: string }>(`/notices/${id}/archive`, { method: 'POST' });
    broadcastRealtimeUpdate('notices', 'DELETE', { old: { id } });
    return res;
  },
  archiveNotice: async (id: string) => {
    const res = await request<{ message: string }>(`/notices/${id}/archive`, { method: 'POST' });
    broadcastRealtimeUpdate('notices', 'DELETE', { old: { id } });
    return res;
  },

  // Settings
  getSettings: () =>
    request<{
      settings: SchoolSettings & { attendance_late_cutoff_time?: string; enable_afternoon_session?: boolean };
      school: School & { current_session?: string; lga?: string };
      sessions: any[];
      subjects: any[];
      schoolUsers: any[];
    }>('/settings'),
  updateSettings: (payload: any) =>
    request<{ message: string; settings: SchoolSettings; school: School }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Google Places School Discovery & Reverification
  getPlacesStatus: () => request<{ configured: boolean }>('/places/status'),
  searchPlaces: (query: string, state?: string) => {
    const params = new URLSearchParams();
    params.append('query', query);
    if (state) params.append('state', state);
    return request<{
      places: DiscoveredSchoolPlace[];
      source: 'google' | 'sandbox';
      attribution: string;
      warning?: string;
    }>(`/places/search?${params.toString()}`);
  },
  getPlaceDetails: (placeId: string) =>
    request<{ place: DiscoveredSchoolPlace; attribution: string }>(`/places/details/${encodeURIComponent(placeId)}`),
  verifySchoolWithGoogle: (googlePlaceId?: string) =>
    request<{
      school: School;
      google_place: DiscoveredSchoolPlace;
      differences: SchoolVerificationDifference[];
      attribution: string;
    }>('/schools/verify-google', {
      method: 'POST',
      body: JSON.stringify({ google_place_id: googlePlaceId }),
    }),
  syncSchoolWithGoogle: (googlePlaceId: string, fieldsToApply: string[]) =>
    request<{
      message: string;
      school: School;
    }>('/schools/sync-google', {
      method: 'POST',
      body: JSON.stringify({ google_place_id: googlePlaceId, fields_to_apply: fieldsToApply }),
    }),
  getSchools: () => request<{ schools: School[] }>('/schools'),
  createSchool: (data: {
    name: string;
    code?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    lga?: string;
    school_type?: string;
    website?: string;
    logo_url?: string;
    admin_name?: string;
    admin_email?: string;
    admin_phone?: string;
    admin_password?: string;
    admin_role?: string;
  }) =>
    request<{
      school: School;
      session: any;
      administrator?: { id: string; full_name: string; email: string; role: string; status: string };
      message?: string;
    }>('/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteSchool: (schoolId: string) =>
    request<{ success: boolean; message: string }>(`/schools/${schoolId}`, {
      method: 'DELETE',
    }),
  purgeDemoData: () =>
    request<{ success: boolean; message: string; deletedCounts: Record<string, number> }>(
      '/super-admin/purge-demo-data',
      { method: 'POST' }
    ),
  updateSchoolStatus: (schoolId: string, status: 'ACTIVE' | 'SUSPENDED') =>
    request<{ school: School; message: string }>(`/schools/${schoolId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getAcademicSessions: () =>
    request<{ sessions: any[] }>('/academic-sessions'),
  createAcademicSession: (payload: { name: string; start_date?: string; end_date?: string; is_current?: boolean }) =>
    request<{ success: boolean; session: any }>('/academic-sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Audit Logs
  getAuditLogs: async (limit?: number) => {
    const query = new URLSearchParams();
    if (limit) query.append('limit', limit.toString());
    const res = await request<any>(`/audit-logs?${query.toString()}`);
    const logs: AuditLog[] = Array.isArray(res) ? res : res?.logs || [];
    return { logs };
  },

  // Academic Engine (Phase 2)
  getAcademicConfig: () => request<{ config: any }>('/academics/config'),
  updateAcademicConfig: (updates: any) =>
    request<{ message: string; config: any }>('/academics/config', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  getTeacherSubjectAssignments: (params?: { teacherId?: string; classId?: string; subjectId?: string; sessionId?: string }) => {
    const query = new URLSearchParams();
    if (params?.teacherId) query.append('teacherId', params.teacherId);
    if (params?.classId) query.append('classId', params.classId);
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    if (params?.sessionId) query.append('sessionId', params.sessionId);
    return request<{ assignments: any[] }>(`/academics/assignments?${query.toString()}`);
  },
  assignTeacherSubject: (payload: { teacher_id: string; class_id: string; subject_id: string; academic_session_id?: string }) =>
    request<{ message: string; assignment: any }>('/academics/assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteTeacherSubjectAssignment: (id: string) =>
    request<{ message: string }>(`/academics/assignments/${id}`, { method: 'DELETE' }),

  getSubjectResults: (params: { classId?: string; subjectId?: string; sessionId?: string; term?: string; studentId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params.classId) query.append('classId', params.classId);
    if (params.subjectId) query.append('subjectId', params.subjectId);
    if (params.sessionId) query.append('sessionId', params.sessionId);
    if (params.term) query.append('term', params.term);
    if (params.studentId) query.append('studentId', params.studentId);
    if (params.status) query.append('status', params.status);
    return request<{ results: any[] }>(`/academics/results?${query.toString()}`);
  },
  saveSubjectResultsBatch: (payload: {
    classId: string;
    subjectId: string;
    sessionId: string;
    term: string;
    status: 'DRAFT' | 'SUBMITTED';
    entries: Array<{ studentId: string; ca1?: number | null; ca2?: number | null; ca3?: number | null; exam?: number | null; teacherComment?: string }>;
  }) =>
    request<{ message: string; count: number; results: any[] }>('/academics/results/batch', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateResultsStatus: (payload: { classId: string; subjectId?: string; sessionId: string; term: string; targetStatus: string }) =>
    request<{ message: string; count: number }>('/academics/results/status', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getStudentReportCard: (studentId: string, sessionId?: string, term?: string) => {
    const query = new URLSearchParams();
    if (sessionId) query.append('sessionId', sessionId);
    if (term) query.append('term', term);
    return request<{ reportCard: any }>(`/academics/student/${studentId}/report-card?${query.toString()}`);
  },
  getStudentAcademicHistory: (studentId: string) =>
    request<{ history: any[] }>(`/academics/student/${studentId}/history`),
  saveStudentRemarks: (studentId: string, payload: { sessionId: string; term: string; formTeacherRemark?: string; principalRemark?: string; nextTermResumptionDate?: string }) =>
    request<{ message: string; remark: any }>(`/academics/student/${studentId}/remarks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getClassAcademicOverview: (classId: string, sessionId?: string, term?: string) => {
    const query = new URLSearchParams();
    if (sessionId) query.append('sessionId', sessionId);
    if (term) query.append('term', term);
    return request<{ overview: any }>(`/academics/class/${classId}/overview?${query.toString()}`);
  },

  // ----------------------------------------------------
  // DIGITAL TRANSFORMATION PLAN API CALLS (PDF SPEC)
  // ----------------------------------------------------

  // Homework & Learning Resources Publisher
  getHomework: (params?: { classId?: string; teacherId?: string }) => {
    const query = new URLSearchParams();
    if (params?.classId) query.append('classId', params.classId);
    if (params?.teacherId) query.append('teacherId', params.teacherId);
    return request<{ homework: HomeworkAssignment[] }>(`/homework?${query.toString()}`);
  },
  createHomework: (payload: {
    class_id: string;
    class_name: string;
    subject_id: string;
    subject_name: string;
    title: string;
    instructions: string;
    attachments?: Array<{ title: string; url: string; type: string }>;
    due_date: string;
    total_marks: number;
  }) =>
    request<{ message: string; homework: HomeworkAssignment }>('/homework', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitHomework: (
    homeworkId: string,
    payload: { student_id: string; student_name?: string; attachment_url?: string; feedback?: string }
  ) =>
    request<{ message: string; homework: HomeworkAssignment }>(`/homework/${homeworkId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  gradeHomework: (
    homeworkId: string,
    payload: { student_id: string; score: number; feedback?: string }
  ) =>
    request<{ message: string; homework: HomeworkAssignment }>(`/homework/${homeworkId}/grade`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Parent-Teacher Direct Messaging Hub
  getMessages: () => request<{ messages: DirectMessage[] }>('/messages'),
  sendMessage: (payload: {
    recipient_id: string;
    recipient_name?: string;
    recipient_role?: string;
    subject: string;
    message: string;
    class_id?: string;
    class_name?: string;
  }) =>
    request<{ message: string; data: DirectMessage }>('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  markMessageRead: (id: string) =>
    request<{ message: string; data: DirectMessage }>(`/messages/${id}/read`, {
      method: 'POST',
    }),

  // Finance, Billing & Verifiable Digital Receipts
  getFeeAccounts: (params?: { classId?: string; studentId?: string }) => {
    const query = new URLSearchParams();
    if (params?.classId) query.append('classId', params.classId);
    if (params?.studentId) query.append('studentId', params.studentId);
    return request<{ accounts: StudentFeeAccount[] }>(`/finance/accounts?${query.toString()}`);
  },
  getFeeAccountByStudent: (studentId: string) =>
    request<{ account: StudentFeeAccount }>(`/finance/accounts/${studentId}`),
  recordFeePayment: (payload: {
    student_id: string;
    student_name: string;
    admission_number?: string;
    class_name?: string;
    fee_account_id?: string;
    amount: number;
    payment_method: string;
    payer_name?: string;
    payer_phone?: string;
    payer_email?: string;
    description?: string;
  }) =>
    request<{ message: string; payment: FeePayment; account?: StudentFeeAccount }>('/finance/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getFeePayments: (studentId?: string) => {
    const query = studentId ? `?studentId=${studentId}` : '';
    return request<{ payments: FeePayment[] }>(`/finance/payments${query}`);
  },
  verifyReceipt: (query: string) =>
    request<{ valid: boolean; message: string; receipt?: FeePayment }>('/finance/verify-receipt', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  sendPaymentReminders: (overdueOnly = true) =>
    request<{ message: string; count: number; notified: string[] }>('/finance/reminders', {
      method: 'POST',
      body: JSON.stringify({ overdueOnly }),
    }),

  // Digital Approvals & Absence Reporting
  getDigitalApprovals: (params?: { studentId?: string; parentId?: string; classId?: string }) => {
    const query = new URLSearchParams();
    if (params?.studentId) query.append('studentId', params.studentId);
    if (params?.parentId) query.append('parentId', params.parentId);
    if (params?.classId) query.append('classId', params.classId);
    return request<{ approvals: DigitalApproval[] }>(`/approvals?${query.toString()}`);
  },
  createDigitalApproval: (payload: {
    type: 'SICK_NOTE' | 'LEAVE_OF_ABSENCE' | 'FIELD_TRIP' | 'POLICY_CONSENT';
    student_id: string;
    student_name: string;
    class_id?: string;
    class_name?: string;
    title: string;
    details: string;
    dates?: string;
    signature_name?: string;
  }) =>
    request<{ message: string; approval: DigitalApproval }>('/approvals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateDigitalApprovalStatus: (
    id: string,
    payload: {
      status: 'APPROVED' | 'REJECTED' | 'SIGNED';
      signature_name?: string;
      teacher_notes?: string;
    }
  ) =>
    request<{ message: string; approval: DigitalApproval }>(`/approvals/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Paperless KPIs & Comments Library
  getPaperlessKPIs: () => request<{ kpis: PaperlessKPIs }>('/analytics/paperless-kpis'),
  getCommentsLibrary: () => request<{ library: Record<string, string[]> }>('/academics/comments-library'),

  // Granular Family Notifications & Relational Linking
  getUserNotifications: () =>
    request<{ notifications: UserNotification[]; unreadCount: number; familyGroupIds: string[] }>(
      '/notifications'
    ),
  markNotificationRead: (id: string) =>
    request<{ success: boolean; notification: UserNotification }>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllNotificationsRead: () =>
    request<{ success: boolean; markedCount: number }>('/notifications/mark-all-read', {
      method: 'PUT',
    }),
  getFamilyGuardians: () =>
    request<{ family_group_id: string; student: any; guardians: any[] }>('/family/guardians'),
  linkCoGuardian: (payload: LinkGuardianPayload) =>
    request<{ success: boolean; message: string; linkedGuardian: any }>('/family/link-guardian', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Demo DB reset
  resetDemoDatabase: () => request<{ message: string }>('/system/reset-demo', { method: 'POST' }),
};
