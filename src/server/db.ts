import fs from 'fs';
import path from 'path';
import type {
  School,
  AcademicSession,
  UserProfile,
  SchoolUser,
  SchoolClass,
  Subject,
  Student,
  StaffMember,
  AttendanceSession,
  AttendanceRecord,
  SchoolNotice,
  SchoolSettings,
  AuditLog,
  UserRole,
  DashboardStats,
  AcademicTerm,
  AcademicConfig,
  TeacherSubjectAssignment,
  SubjectResult,
  StudentTermRemark,
  StudentReportCard,
  ClassAcademicOverview,
  ResultStatus,
  HomeworkAssignment,
  HomeworkSubmission,
  DirectMessage,
  StudentFeeAccount,
  FeePayment,
  DigitalApproval,
  PaperlessKPIs,
  ParentStudent,
  UserNotification,
  AdminInvitation,
} from '../types/index.ts';
import { getInitialSeedData } from './seed.ts';

export interface DatabaseSchema {
  schools: School[];
  academicSessions: AcademicSession[];
  profiles: UserProfile[];
  schoolUsers: SchoolUser[];
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  staff: StaffMember[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  notices: SchoolNotice[];
  settings: SchoolSettings[];
  auditLogs: AuditLog[];
  // Phase 2: Academic Engine
  academicConfigs: AcademicConfig[];
  teacherSubjectAssignments: TeacherSubjectAssignment[];
  subjectResults: SubjectResult[];
  studentTermRemarks: StudentTermRemark[];
  // Phase 3: Digital Transformation Plan (PDF Spec)
  homework: HomeworkAssignment[];
  directMessages: DirectMessage[];
  feeAccounts: StudentFeeAccount[];
  feePayments: FeePayment[];
  digitalApprovals: DigitalApproval[];
  parentStudents: ParentStudent[];
  userNotifications: UserNotification[];
  adminInvitations: AdminInvitation[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'schoolcore_db.json');

class DatabaseEngine {
  public data: DatabaseSchema;
  private isLoaded = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = {
      schools: [],
      academicSessions: [],
      profiles: [],
      schoolUsers: [],
      classes: [],
      subjects: [],
      students: [],
      staff: [],
      attendanceSessions: [],
      attendanceRecords: [],
      notices: [],
      settings: [],
      auditLogs: [],
      academicConfigs: [],
      teacherSubjectAssignments: [],
      subjectResults: [],
      studentTermRemarks: [],
      homework: [],
      directMessages: [],
      feeAccounts: [],
      feePayments: [],
      digitalApprovals: [],
      parentStudents: [],
      userNotifications: [],
      adminInvitations: [],
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const seed = getInitialSeedData();

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        if (fileContent && fileContent.trim().length > 0) {
          const parsed = JSON.parse(fileContent);

          this.data = {
            schools: parsed.schools || [],
            academicSessions: parsed.academicSessions || [],
            profiles: parsed.profiles || [],
            schoolUsers: parsed.schoolUsers || [],
            classes: parsed.classes || [],
            subjects: parsed.subjects || [],
            students: parsed.students || [],
            staff: parsed.staff || [],
            attendanceSessions: parsed.attendanceSessions || [],
            attendanceRecords: parsed.attendanceRecords || [],
            notices: parsed.notices || [],
            settings: parsed.settings || [],
            auditLogs: parsed.auditLogs || [],
            academicConfigs: parsed.academicConfigs || [],
            teacherSubjectAssignments: parsed.teacherSubjectAssignments || [],
            subjectResults: parsed.subjectResults || [],
            studentTermRemarks: parsed.studentTermRemarks || [],
            homework: parsed.homework || [],
            directMessages: parsed.directMessages || [],
            feeAccounts: parsed.feeAccounts || [],
            feePayments: parsed.feePayments || [],
            digitalApprovals: parsed.digitalApprovals || [],
            parentStudents: parsed.parentStudents || [],
            userNotifications: parsed.userNotifications || [],
            adminInvitations: parsed.adminInvitations || [],
          };
          this.isLoaded = true;
          return;
        }
      }

      this.clearAllData();
    } catch (err) {
      console.error('Error initializing SchoolCore DB, setting to clean state:', err);
      this.clearAllData();
    }
  }

  public clearAllData() {
    this.data = getInitialSeedData();
    this.persistSync();
    this.isLoaded = true;
  }

  public resetToSeed() {
    this.data = getInitialSeedData();
    this.persistSync();
    this.isLoaded = true;
  }

  private persistSync() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist DB to disk:', err);
    }
  }

  public persist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.persistSync();
      this.saveTimeout = null;
    }, 100);
  }

  public save() {
    this.persist();
  }

  // --- Multi-tenant queries & writes ---

  public getSchools(): School[] {
    return this.data.schools;
  }

  public getSchoolById(schoolId: string): School | undefined {
    if (schoolId === 'global-platform') {
      return {
        id: 'global-platform',
        name: 'SchoolCore Global Network',
        code: 'SC-GLOBAL',
        phone: '+234 800 000 0000',
        email: 'samuelemma466@gmail.com',
        address: 'National Headquarters, Abuja',
        state: 'Federation',
        country: 'Nigeria',
        current_term: 'FIRST_TERM',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString(),
      };
    }
    return this.data.schools.find((s) => s.id === schoolId);
  }

  public getSchoolByGooglePlaceId(placeId: string): School | undefined {
    return this.data.schools.find((s) => s.google_place_id === placeId);
  }

  public createSchool(school: School): School {
    this.data.schools.push(school);
    this.persist();
    return school;
  }

  public updateSchool(schoolId: string, updates: Partial<School>): School | undefined {
    const idx = this.data.schools.findIndex((s) => s.id === schoolId);
    if (idx === -1) return undefined;
    this.data.schools[idx] = { ...this.data.schools[idx], ...updates, updated_at: new Date().toISOString() };
    this.persist();
    return this.data.schools[idx];
  }

  public deleteSchool(schoolId: string): boolean {
    const idx = this.data.schools.findIndex((s) => s.id === schoolId);
    if (idx !== -1) {
      this.data.schools.splice(idx, 1);
    }
    // Cascade cleanup of school-scoped data
    this.data.academicSessions = this.data.academicSessions.filter((x) => x.school_id !== schoolId);
    this.data.schoolUsers = this.data.schoolUsers.filter((x) => x.school_id !== schoolId);
    this.data.classes = this.data.classes.filter((x) => x.school_id !== schoolId);
    this.data.subjects = this.data.subjects.filter((x) => x.school_id !== schoolId);
    this.data.students = this.data.students.filter((x) => x.school_id !== schoolId);
    this.data.staff = this.data.staff.filter((x) => x.school_id !== schoolId);
    this.data.attendanceSessions = this.data.attendanceSessions.filter((x) => x.school_id !== schoolId);
    this.data.attendanceRecords = this.data.attendanceRecords.filter((x) => x.school_id !== schoolId);
    this.data.notices = this.data.notices.filter((x) => x.school_id !== schoolId);
    this.data.settings = this.data.settings.filter((x) => x.school_id !== schoolId);
    this.data.academicConfigs = this.data.academicConfigs.filter((x) => x.school_id !== schoolId);
    this.data.teacherSubjectAssignments = this.data.teacherSubjectAssignments.filter((x) => x.school_id !== schoolId);
    this.data.subjectResults = this.data.subjectResults.filter((x) => x.school_id !== schoolId);
    this.data.studentTermRemarks = this.data.studentTermRemarks.filter((x) => x.school_id !== schoolId);
    this.data.homework = this.data.homework.filter((x) => x.school_id !== schoolId);
    this.data.feeAccounts = this.data.feeAccounts.filter((x) => x.school_id !== schoolId);
    this.data.feePayments = this.data.feePayments.filter((x) => x.school_id !== schoolId);
    this.data.digitalApprovals = this.data.digitalApprovals.filter((x) => x.school_id !== schoolId);
    this.data.adminInvitations = (this.data.adminInvitations || []).filter((x) => x.school_id !== schoolId);
    this.persist();
    return true;
  }

  // --- Profiles & Users ---

  public getProfiles(): UserProfile[] {
    return this.data.profiles;
  }

  public getProfileByEmail(email: string): UserProfile | undefined {
    return this.data.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }

  public getProfileById(id: string): UserProfile | undefined {
    return this.data.profiles.find((p) => p.id === id);
  }

  public createProfile(profile: UserProfile): UserProfile {
    this.data.profiles.push(profile);
    this.persist();
    return profile;
  }

  public updateProfile(id: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const idx = this.data.profiles.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.data.profiles[idx] = { ...this.data.profiles[idx], ...updates };
    this.persist();
    return this.data.profiles[idx];
  }

  public getSchoolUser(schoolId: string, profileId: string): SchoolUser | undefined {
    return this.data.schoolUsers.find((su) => su.school_id === schoolId && su.profile_id === profileId);
  }

  public getSchoolUsersByProfileId(profileId: string): SchoolUser[] {
    return this.data.schoolUsers.filter((su) => su.profile_id === profileId);
  }

  public getSchoolUsers(schoolId: string): (SchoolUser & { profile?: UserProfile })[] {
    return this.data.schoolUsers
      .filter((su) => su.school_id === schoolId)
      .map((su) => ({
        ...su,
        profile: this.getProfileById(su.profile_id),
      }));
  }

  public createSchoolUser(schoolUser: SchoolUser): SchoolUser {
    this.data.schoolUsers.push(schoolUser);
    this.persist();
    return schoolUser;
  }

  public getSchoolUserById(id: string): SchoolUser | undefined {
    return this.data.schoolUsers.find((su) => su.id === id);
  }

  public updateSchoolUser(id: string, updates: Partial<SchoolUser>): SchoolUser | undefined {
    const idx = this.data.schoolUsers.findIndex((su) => su.id === id);
    if (idx === -1) return undefined;
    this.data.schoolUsers[idx] = { ...this.data.schoolUsers[idx], ...updates };
    this.persist();
    return this.data.schoolUsers[idx];
  }

  public getParentStudents(schoolId: string, parentProfileId?: string, studentId?: string): ParentStudent[] {
    if (!this.data.parentStudents) this.data.parentStudents = [];
    return this.data.parentStudents.filter((ps) => {
      if (ps.school_id !== schoolId) return false;
      if (parentProfileId && ps.parent_profile_id !== parentProfileId) return false;
      if (studentId && ps.student_id !== studentId) return false;
      return true;
    });
  }

  public createParentStudent(relation: ParentStudent): ParentStudent {
    if (!this.data.parentStudents) this.data.parentStudents = [];
    // Prevent duplicate entries
    const existing = this.data.parentStudents.find(
      (ps) => ps.school_id === relation.school_id &&
              ps.parent_profile_id === relation.parent_profile_id &&
              ps.student_id === relation.student_id
    );
    if (existing) return existing;
    this.data.parentStudents.push(relation);
    this.persist();
    return relation;
  }

  // --- Academic Sessions ---

  public getAcademicSessions(schoolId: string): AcademicSession[] {
    return this.data.academicSessions.filter((a) => a.school_id === schoolId);
  }

  public createAcademicSession(session: AcademicSession): AcademicSession {
    if (session.is_current) {
      this.data.academicSessions.forEach((s) => {
        if (s.school_id === session.school_id) s.is_current = false;
      });
    }
    this.data.academicSessions.push(session);
    this.persist();
    return session;
  }

  // --- Classes ---

  public getClasses(schoolId: string): SchoolClass[] {
    const list = this.data.classes.filter((c) => c.school_id === schoolId);
    return list.map((c) => {
      const studentCount = this.data.students.filter((s) => s.school_id === schoolId && s.current_class_id === c.id && s.status === 'ACTIVE').length;
      return { ...c, student_count: studentCount };
    });
  }

  public getClassById(schoolId: string, classId: string): SchoolClass | undefined {
    const cls = this.data.classes.find((c) => c.school_id === schoolId && c.id === classId);
    if (!cls) return undefined;
    const studentCount = this.data.students.filter((s) => s.school_id === schoolId && s.current_class_id === cls.id && s.status === 'ACTIVE').length;
    return { ...cls, student_count: studentCount };
  }

  public createClass(cls: SchoolClass): SchoolClass {
    this.data.classes.push(cls);
    this.persist();
    return cls;
  }

  public updateClass(schoolId: string, classId: string, updates: Partial<SchoolClass>): SchoolClass | undefined {
    const idx = this.data.classes.findIndex((c) => c.school_id === schoolId && c.id === classId);
    if (idx === -1) return undefined;
    this.data.classes[idx] = { ...this.data.classes[idx], ...updates };
    this.persist();
    return this.getClassById(schoolId, classId);
  }

  public archiveClass(schoolId: string, classId: string): boolean {
    const cls = this.data.classes.find((c) => c.school_id === schoolId && c.id === classId);
    if (!cls) return false;
    cls.status = 'ARCHIVED';
    this.persist();
    return true;
  }

  // --- Subjects ---

  public getSubjects(schoolId: string): Subject[] {
    return this.data.subjects.filter((s) => s.school_id === schoolId);
  }

  public createSubject(sub: Subject): Subject {
    this.data.subjects.push(sub);
    this.persist();
    return sub;
  }

  // --- Students ---

  public getStudents(
    schoolId: string,
    options: {
      search?: string;
      classId?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): { students: Student[]; total: number; page: number; totalPages: number } {
    let list = this.data.students.filter((s) => s.school_id === schoolId);

    if (options.status && options.status !== 'ALL') {
      list = list.filter((s) => s.status === options.status);
    }

    if (options.classId && options.classId !== 'ALL') {
      list = list.filter((s) => s.current_class_id === options.classId);
    }

    if (options.search && options.search.trim().length > 0) {
      const q = options.search.toLowerCase().trim();
      list = list.filter((s) => {
        const fullName = `${s.first_name} ${s.middle_name || ''} ${s.last_name}`.toLowerCase();
        const adm = (s.admission_number || '').toLowerCase();
        const gName = (s.guardian_name || '').toLowerCase();
        return fullName.includes(q) || adm.includes(q) || gName.includes(q);
      });
    }

    // Sort by name or class
    list.sort((a, b) => a.last_name.localeCompare(b.last_name));

    const total = list.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 20);
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    // Attach class names
    const enriched = paginated.map((s) => {
      const cls = s.current_class_id ? this.data.classes.find((c) => c.id === s.current_class_id) : undefined;
      return {
        ...s,
        current_class_name: cls ? cls.name : s.current_class_name || 'Unassigned',
      };
    });

    return {
      students: enriched,
      total,
      page,
      totalPages,
    };
  }

  public getStudentById(schoolId: string, studentId: string): Student | undefined {
    const s = this.data.students.find((item) => item.school_id === schoolId && item.id === studentId);
    if (!s) return undefined;
    const cls = s.current_class_id ? this.data.classes.find((c) => c.id === s.current_class_id) : undefined;
    return {
      ...s,
      current_class_name: cls ? cls.name : s.current_class_name || 'Unassigned',
    };
  }

  public createStudent(student: Student): Student {
    this.data.students.push(student);
    this.persist();
    return student;
  }

  public updateStudent(schoolId: string, studentId: string, updates: Partial<Student>): Student | undefined {
    const idx = this.data.students.findIndex((s) => s.school_id === schoolId && s.id === studentId);
    if (idx === -1) return undefined;
    this.data.students[idx] = {
      ...this.data.students[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.getStudentById(schoolId, studentId);
  }

  public archiveStudent(schoolId: string, studentId: string): boolean {
    const s = this.data.students.find((item) => item.school_id === schoolId && item.id === studentId);
    if (!s) return false;
    s.status = 'INACTIVE';
    s.updated_at = new Date().toISOString();
    this.persist();
    return true;
  }

  // --- Staff ---

  public getStaff(schoolId: string): StaffMember[] {
    return this.data.staff.filter((stf) => stf.school_id === schoolId);
  }

  public getStaffById(schoolId: string, staffId: string): StaffMember | undefined {
    return this.data.staff.find((stf) => stf.school_id === schoolId && stf.id === staffId);
  }

  public getStaffByProfileId(schoolId: string, profileId: string): StaffMember | undefined {
    return this.data.staff.find((stf) => stf.school_id === schoolId && stf.profile_id === profileId);
  }

  public createStaff(member: StaffMember): StaffMember {
    this.data.staff.push(member);
    this.persist();
    return member;
  }

  public updateStaff(schoolId: string, staffId: string, updates: Partial<StaffMember>): StaffMember | undefined {
    const idx = this.data.staff.findIndex((stf) => stf.school_id === schoolId && stf.id === staffId);
    if (idx === -1) return undefined;
    this.data.staff[idx] = { ...this.data.staff[idx], ...updates };
    this.persist();
    return this.data.staff[idx];
  }

  // --- Attendance ---

  public getAttendanceSession(
    schoolId: string,
    classId: string,
    date: string,
    sessionType: 'MORNING' | 'AFTERNOON' = 'MORNING'
  ): { session?: AttendanceSession; records: AttendanceRecord[] } {
    const session = this.data.attendanceSessions.find(
      (a) => a.school_id === schoolId && a.class_id === classId && a.date === date && a.session_type === sessionType
    );
    if (!session) {
      return { records: [] };
    }
    const records = this.data.attendanceRecords.filter((r) => r.session_id === session.id);
    return { session, records };
  }

  public saveAttendanceSession(
    schoolId: string,
    classId: string,
    date: string,
    markedById: string,
    markedByName: string,
    records: Array<{ student_id: string; status: 'PRESENT' | 'ABSENT' | 'LATE'; remarks?: string }>,
    notes?: string,
    sessionType: 'MORNING' | 'AFTERNOON' = 'MORNING'
  ): { session: AttendanceSession; records: AttendanceRecord[] } {
    const cls = this.data.classes.find((c) => c.id === classId);
    const existingIdx = this.data.attendanceSessions.findIndex(
      (a) => a.school_id === schoolId && a.class_id === classId && a.date === date && a.session_type === sessionType
    );

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    records.forEach((r) => {
      if (r.status === 'PRESENT') presentCount++;
      else if (r.status === 'ABSENT') absentCount++;
      else if (r.status === 'LATE') lateCount++;
    });

    let sessionId: string;
    let session: AttendanceSession;

    if (existingIdx >= 0) {
      sessionId = this.data.attendanceSessions[existingIdx].id;
      session = {
        ...this.data.attendanceSessions[existingIdx],
        marked_by_id: markedById,
        marked_by_name: markedByName,
        status: 'SUBMITTED',
        total_students: records.length,
        present_count: presentCount,
        absent_count: absentCount,
        late_count: lateCount,
        notes: notes || this.data.attendanceSessions[existingIdx].notes,
        updated_at: new Date().toISOString(),
      };
      this.data.attendanceSessions[existingIdx] = session;
      // Remove old records for this session
      this.data.attendanceRecords = this.data.attendanceRecords.filter((r) => r.session_id !== sessionId);
    } else {
      sessionId = `att-ses-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      session = {
        id: sessionId,
        school_id: schoolId,
        class_id: classId,
        class_name: cls ? cls.name : 'Class',
        date,
        session_type: sessionType,
        marked_by_id: markedById,
        marked_by_name: markedByName,
        status: 'SUBMITTED',
        total_students: records.length,
        present_count: presentCount,
        absent_count: absentCount,
        late_count: lateCount,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.attendanceSessions.push(session);
    }

    const newRecords: AttendanceRecord[] = records.map((r) => {
      const student = this.data.students.find((s) => s.id === r.student_id);
      return {
        id: `att-rec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        session_id: sessionId,
        student_id: r.student_id,
        student_name: student ? `${student.first_name} ${student.last_name}` : 'Student',
        admission_number: student?.admission_number,
        school_id: schoolId,
        status: r.status,
        remarks: r.remarks,
        created_at: new Date().toISOString(),
      };
    });

    this.data.attendanceRecords.push(...newRecords);
    this.persist();
    return { session, records: newRecords };
  }

  public getAttendanceHistory(
    schoolId: string,
    options: { classId?: string; limit?: number } = {}
  ): AttendanceSession[] {
    let list = this.data.attendanceSessions.filter((s) => s.school_id === schoolId);
    if (options.classId && options.classId !== 'ALL') {
      list = list.filter((s) => s.class_id === options.classId);
    }
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list.slice(0, options.limit || 30);
  }

  public getStudentAttendanceStats(schoolId: string, studentId: string): { total: number; present: number; absent: number; late: number; rate: number } {
    const records = this.data.attendanceRecords.filter((r) => r.school_id === schoolId && r.student_id === studentId);
    const total = records.length;
    if (total === 0) {
      return { total: 0, present: 0, absent: 0, late: 0, rate: 100 };
    }
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const rate = Math.round(((present + late * 0.5) / total) * 100);
    return { total, present, absent, late, rate };
  }

  // --- Notices ---

  public getNotices(schoolId: string, role?: UserRole): SchoolNotice[] {
    let list = this.data.notices.filter((n) => n.school_id === schoolId && n.status !== 'ARCHIVED');
    if (role === 'TEACHER') {
      list = list.filter((n) => n.audience === 'EVERYONE' || n.audience === 'TEACHERS');
    }
    list.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    return list;
  }

  public createNotice(notice: SchoolNotice): SchoolNotice {
    this.data.notices.push(notice);
    this.persist();
    return notice;
  }

  public updateNotice(schoolId: string, noticeId: string, updates: Partial<SchoolNotice>): SchoolNotice | undefined {
    const idx = this.data.notices.findIndex((n) => n.school_id === schoolId && n.id === noticeId);
    if (idx === -1) return undefined;
    this.data.notices[idx] = { ...this.data.notices[idx], ...updates };
    this.persist();
    return this.data.notices[idx];
  }

  public archiveNotice(schoolId: string, noticeId: string): boolean {
    const notice = this.data.notices.find((n) => n.school_id === schoolId && n.id === noticeId);
    if (!notice) return false;
    notice.status = 'ARCHIVED';
    this.persist();
    return true;
  }

  // --- Settings ---

  public getSettings(schoolId: string): SchoolSettings {
    let set = this.data.settings.find((s) => s.school_id === schoolId);
    if (!set) {
      set = {
        id: `set-${Date.now()}`,
        school_id: schoolId,
        attendance_grace_period_mins: 15,
        low_bandwidth_mode: false,
        school_motto: 'Striving for Knowledge and Excellence',
        academic_year: '2025/2026',
        current_term: 'First Term',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.settings.push(set);
      this.persist();
    }
    return set;
  }

  public updateSettings(schoolId: string, updates: Partial<SchoolSettings>): SchoolSettings {
    const idx = this.data.settings.findIndex((s) => s.school_id === schoolId);
    if (idx >= 0) {
      this.data.settings[idx] = {
        ...this.data.settings[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
    } else {
      const newSet: SchoolSettings = {
        id: `set-${Date.now()}`,
        school_id: schoolId,
        attendance_grace_period_mins: 15,
        low_bandwidth_mode: false,
        academic_year: '2025/2026',
        current_term: 'First Term',
        ...updates,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.settings.push(newSet);
    }
    this.persist();
    return this.getSettings(schoolId);
  }

  // --- Audit Logs ---

  public addAuditLog(entry: {
    school_id: string;
    actor_id: string;
    actor_name: string;
    actor_role: string;
    action: string;
    entity: string;
    entity_id?: string;
    details: string;
  }): AuditLog {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...entry,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // Keep max 500 logs in memory/disk
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.persist();
    return log;
  }

  public getAuditLogs(schoolId: string, limit = 50): AuditLog[] {
    return this.data.auditLogs.filter((a) => a.school_id === schoolId).slice(0, limit);
  }

  // --- Dashboard Aggregations ---

  public getDashboardStats(schoolId: string, userProfileId: string, role: UserRole): DashboardStats {
    const activeStudents = this.data.students.filter((s) => s.school_id === schoolId && s.status === 'ACTIVE');
    const totalStudents = activeStudents.length;
    const activeStaff = this.data.staff.filter((s) => s.school_id === schoolId && s.status === 'ACTIVE');
    const totalStaff = activeStaff.length;
    const activeClasses = this.data.classes.filter((c) => c.school_id === schoolId && c.status === 'ACTIVE');
    const totalClasses = activeClasses.length;

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = this.data.attendanceSessions.filter((a) => a.school_id === schoolId && a.date === todayStr);

    const markedClasses = todaySessions.length;
    let presentToday = 0;
    let absentToday = 0;
    let lateToday = 0;

    todaySessions.forEach((s) => {
      presentToday += s.present_count;
      absentToday += s.absent_count;
      lateToday += s.late_count;
    });

    const totalMarkedRecords = presentToday + absentToday + lateToday;
    const ratePercentage = totalMarkedRecords > 0 ? Math.round(((presentToday + lateToday * 0.5) / totalMarkedRecords) * 100) : 0;

    const recentActivity = this.getAuditLogs(schoolId, 10);
    const importantNotices = this.getNotices(schoolId, role).slice(0, 5);

    let teacherTodayClasses: any[] = [];

    if (role === 'TEACHER') {
      const staffMember = this.getStaffByProfileId(schoolId, userProfileId);
      const assignedClassIds = staffMember?.assigned_classes || [];
      const teacherClasses = activeClasses.filter(
        (c) => c.class_teacher_id === staffMember?.id || assignedClassIds.includes(c.id)
      );

      teacherTodayClasses = teacherClasses.map((cls, idx) => {
        const studentCount = activeStudents.filter((s) => s.current_class_id === cls.id).length;
        const isMarked = todaySessions.some((ts) => ts.class_id === cls.id);
        const periods = ['8:30 AM', '10:15 AM', '11:45 AM', '1:30 PM'];
        return {
          class_id: cls.id,
          class_name: cls.name,
          level: cls.level,
          subject: (cls.subjects && cls.subjects[0]) || (staffMember?.assigned_subjects && staffMember.assigned_subjects[0]) || 'General Class',
          time: periods[idx % periods.length],
          student_count: studentCount,
          attendance_marked_today: isMarked,
        };
      });
    }

    return {
      total_students: totalStudents,
      total_staff: totalStaff,
      total_classes: totalClasses,
      attendance_today: {
        marked_classes: markedClasses,
        total_classes: totalClasses,
        present: presentToday,
        absent: absentToday,
        late: lateToday,
        rate_percentage: ratePercentage,
      },
      recent_activity: recentActivity,
      important_notices: importantNotices,
      teacher_today_classes: teacherTodayClasses,
    };
  }

  // ==========================================
  // PHASE 2: ACADEMIC ENGINE METHODS
  // ==========================================

  // --- Academic Configuration ---

  public getAcademicConfig(schoolId: string): AcademicConfig {
    let config = this.data.academicConfigs.find((c) => c.school_id === schoolId);
    if (!config) {
      config = {
        id: `cfg-${schoolId}`,
        school_id: schoolId,
        assessment_components: [
          { id: 'comp-ca1', name: 'Continuous Assessment 1 (Test)', code: 'ca1', max_score: 10, weight_percentage: 10 },
          { id: 'comp-ca2', name: 'Continuous Assessment 2 (Assignment)', code: 'ca2', max_score: 10, weight_percentage: 10 },
          { id: 'comp-ca3', name: 'Continuous Assessment 3 (Project/Mid-Term)', code: 'ca3', max_score: 20, weight_percentage: 20 },
          { id: 'comp-exam', name: 'Terminal Examination', code: 'exam', max_score: 60, weight_percentage: 60 },
        ],
        grading_scale: [
          { id: 'grd-a', grade: 'A', min_score: 75, max_score: 100, remark: 'Excellent', gpa_point: 5.0 },
          { id: 'grd-b', grade: 'B', min_score: 65, max_score: 74, remark: 'Very Good', gpa_point: 4.0 },
          { id: 'grd-c', grade: 'C', min_score: 50, max_score: 64, remark: 'Credit', gpa_point: 3.0 },
          { id: 'grd-d', grade: 'D', min_score: 45, max_score: 49, remark: 'Pass', gpa_point: 2.0 },
          { id: 'grd-e', grade: 'E', min_score: 40, max_score: 44, remark: 'Fair Pass', gpa_point: 1.0 },
          { id: 'grd-f', grade: 'F', min_score: 0, max_score: 39, remark: 'Fail', gpa_point: 0.0 },
        ],
        pass_mark: 50,
        allow_teacher_submit: true,
        require_coordinator_review: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.academicConfigs.push(config);
      this.persist();
    }
    return config;
  }

  public updateAcademicConfig(schoolId: string, updates: Partial<AcademicConfig>): AcademicConfig {
    const idx = this.data.academicConfigs.findIndex((c) => c.school_id === schoolId);
    if (idx >= 0) {
      this.data.academicConfigs[idx] = {
        ...this.data.academicConfigs[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
    } else {
      const config = this.getAcademicConfig(schoolId);
      this.data.academicConfigs.push({ ...config, ...updates, updated_at: new Date().toISOString() });
    }
    this.persist();
    return this.getAcademicConfig(schoolId);
  }

  // --- Authoritative Calculation Pipeline ---

  public calculateGradeAndRemark(
    schoolId: string,
    ca1: number | null,
    ca2: number | null,
    ca3: number | null,
    exam: number | null
  ): { total_score: number | null; percentage: number | null; grade: string | null; remark: string | null } {
    const hasAnyScore = ca1 !== null || ca2 !== null || ca3 !== null || exam !== null;
    if (!hasAnyScore) {
      return { total_score: null, percentage: null, grade: null, remark: null };
    }

    const config = this.getAcademicConfig(schoolId);
    const score1 = typeof ca1 === 'number' ? Math.max(0, ca1) : 0;
    const score2 = typeof ca2 === 'number' ? Math.max(0, ca2) : 0;
    const score3 = typeof ca3 === 'number' ? Math.max(0, ca3) : 0;
    const scoreExam = typeof exam === 'number' ? Math.max(0, exam) : 0;

    const total = score1 + score2 + score3 + scoreExam;
    const maxTotal = config.assessment_components.reduce((acc, c) => acc + c.max_score, 0) || 100;
    const percentage = Math.round((total / maxTotal) * 100 * 10) / 10;

    let matchedGrade: string = 'F';
    let matchedRemark: string = 'Fail';

    for (const item of config.grading_scale) {
      if (percentage >= item.min_score && percentage <= item.max_score) {
        matchedGrade = item.grade;
        matchedRemark = item.remark;
        break;
      }
    }

    return {
      total_score: total,
      percentage,
      grade: matchedGrade,
      remark: matchedRemark,
    };
  }

  // --- Teacher Subject Assignments ---

  public getTeacherSubjectAssignments(
    schoolId: string,
    options: { teacherId?: string; classId?: string; subjectId?: string; sessionId?: string } = {}
  ): TeacherSubjectAssignment[] {
    return this.data.teacherSubjectAssignments.filter((a) => {
      if (a.school_id !== schoolId) return false;
      if (options.teacherId && a.teacher_id !== options.teacherId) return false;
      if (options.classId && a.class_id !== options.classId) return false;
      if (options.subjectId && a.subject_id !== options.subjectId) return false;
      if (options.sessionId && a.academic_session_id !== options.sessionId) return false;
      return true;
    });
  }

  public createTeacherSubjectAssignment(assignment: TeacherSubjectAssignment): TeacherSubjectAssignment {
    // Check duplicate
    const existing = this.data.teacherSubjectAssignments.find(
      (a) =>
        a.school_id === assignment.school_id &&
        a.class_id === assignment.class_id &&
        a.subject_id === assignment.subject_id &&
        a.academic_session_id === assignment.academic_session_id
    );
    if (existing) {
      existing.teacher_id = assignment.teacher_id;
      existing.teacher_name = assignment.teacher_name;
      this.persist();
      return existing;
    }
    this.data.teacherSubjectAssignments.push(assignment);
    this.persist();
    return assignment;
  }

  public deleteTeacherSubjectAssignment(schoolId: string, assignmentId: string): boolean {
    const initialLen = this.data.teacherSubjectAssignments.length;
    this.data.teacherSubjectAssignments = this.data.teacherSubjectAssignments.filter(
      (a) => !(a.school_id === schoolId && a.id === assignmentId)
    );
    if (this.data.teacherSubjectAssignments.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Subject Results & Scoring ---

  public getSubjectResults(
    schoolId: string,
    filters: {
      classId?: string;
      subjectId?: string;
      sessionId?: string;
      term?: AcademicTerm;
      studentId?: string;
      teacherId?: string;
      status?: ResultStatus;
    } = {}
  ): SubjectResult[] {
    return this.data.subjectResults.filter((r) => {
      if (r.school_id !== schoolId) return false;
      if (filters.classId && r.class_id !== filters.classId) return false;
      if (filters.subjectId && r.subject_id !== filters.subjectId) return false;
      if (filters.sessionId && r.academic_session_id !== filters.sessionId) return false;
      if (filters.term && r.term !== filters.term) return false;
      if (filters.studentId && r.student_id !== filters.studentId) return false;
      if (filters.teacherId && r.teacher_id !== filters.teacherId) return false;
      if (filters.status && r.status !== filters.status) return false;
      return true;
    });
  }

  public getSubjectResultById(schoolId: string, resultId: string): SubjectResult | undefined {
    return this.data.subjectResults.find((r) => r.school_id === schoolId && r.id === resultId);
  }

  public saveSubjectResultsBatch(
    schoolId: string,
    params: {
      classId: string;
      subjectId: string;
      sessionId: string;
      term: AcademicTerm;
      teacherId: string;
      teacherName: string;
      status: ResultStatus;
      entries: Array<{
        studentId: string;
        ca1: number | null;
        ca2: number | null;
        ca3: number | null;
        exam: number | null;
        teacherRemark?: string;
      }>;
    }
  ): { count: number; results: SubjectResult[] } {
    const cls = this.getClassById(schoolId, params.classId);
    const sub = this.data.subjects.find((s) => s.school_id === schoolId && s.id === params.subjectId);
    const session = this.data.academicSessions.find((s) => s.school_id === schoolId && s.id === params.sessionId);

    const savedResults: SubjectResult[] = [];
    const now = new Date().toISOString();

    for (const entry of params.entries) {
      const student = this.getStudentById(schoolId, entry.studentId);
      if (!student) continue;

      const calc = this.calculateGradeAndRemark(schoolId, entry.ca1, entry.ca2, entry.ca3, entry.exam);

      // Find existing
      const existingIdx = this.data.subjectResults.findIndex(
        (r) =>
          r.school_id === schoolId &&
          r.class_id === params.classId &&
          r.subject_id === params.subjectId &&
          r.academic_session_id === params.sessionId &&
          r.term === params.term &&
          r.student_id === entry.studentId
      );

      let record: SubjectResult;

      if (existingIdx >= 0) {
        const existing = this.data.subjectResults[existingIdx];
        // If already published and user is trying to overwrite without authorized status update, check
        record = {
          ...existing,
          teacher_id: params.teacherId,
          teacher_name: params.teacherName,
          ca1_score: entry.ca1,
          ca2_score: entry.ca2,
          ca3_score: entry.ca3,
          exam_score: entry.exam,
          total_score: calc.total_score,
          percentage: calc.percentage,
          grade: calc.grade,
          remark: calc.remark,
          teacher_subject_remark: entry.teacherRemark || existing.teacher_subject_remark,
          status: params.status,
          submitted_at: params.status === 'SUBMITTED' ? now : existing.submitted_at,
          published_at: params.status === 'PUBLISHED' ? now : existing.published_at,
          updated_at: now,
        };
        this.data.subjectResults[existingIdx] = record;
      } else {
        record = {
          id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          school_id: schoolId,
          academic_session_id: params.sessionId,
          academic_session_name: session?.name || 'Current Session',
          term: params.term,
          class_id: params.classId,
          class_name: cls?.name || 'Class',
          subject_id: params.subjectId,
          subject_name: sub?.name || 'Subject',
          subject_code: sub?.code,
          student_id: entry.studentId,
          student_name: `${student.first_name} ${student.last_name}`,
          admission_number: student.admission_number,
          teacher_id: params.teacherId,
          teacher_name: params.teacherName,
          ca1_score: entry.ca1,
          ca2_score: entry.ca2,
          ca3_score: entry.ca3,
          exam_score: entry.exam,
          total_score: calc.total_score,
          percentage: calc.percentage,
          grade: calc.grade,
          remark: calc.remark,
          teacher_subject_remark: entry.teacherRemark || '',
          status: params.status,
          submitted_at: params.status === 'SUBMITTED' ? now : undefined,
          published_at: params.status === 'PUBLISHED' ? now : undefined,
          created_at: now,
          updated_at: now,
        };
        this.data.subjectResults.push(record);
      }
      savedResults.push(record);
    }

    this.persist();
    return { count: savedResults.length, results: savedResults };
  }

  public updateResultsStatusBatch(
    schoolId: string,
    params: {
      classId: string;
      subjectId?: string;
      sessionId: string;
      term: AcademicTerm;
      targetStatus: ResultStatus;
    }
  ): number {
    let updatedCount = 0;
    const now = new Date().toISOString();

    this.data.subjectResults.forEach((r) => {
      if (
        r.school_id === schoolId &&
        r.class_id === params.classId &&
        r.academic_session_id === params.sessionId &&
        r.term === params.term &&
        (!params.subjectId || r.subject_id === params.subjectId)
      ) {
        r.status = params.targetStatus;
        if (params.targetStatus === 'SUBMITTED') r.submitted_at = now;
        if (params.targetStatus === 'REVIEWED') r.reviewed_at = now;
        if (params.targetStatus === 'PUBLISHED') r.published_at = now;
        r.updated_at = now;
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      this.persist();
    }
    return updatedCount;
  }

  public calculateGrade(score: number, schoolId: string): { grade: string; remark: string } {
    const config = this.getAcademicConfig(schoolId);
    for (const item of config.grading_scale) {
      if (score >= item.min_score && score <= item.max_score) {
        return { grade: item.grade, remark: item.remark };
      }
    }
    return { grade: 'F', remark: 'Fail' };
  }

  // --- Student Term Remarks ---

  public getStudentTermRemark(
    schoolId: string,
    studentId: string,
    sessionId: string,
    term: AcademicTerm
  ): StudentTermRemark | undefined {
    return this.data.studentTermRemarks.find(
      (r) =>
        r.school_id === schoolId &&
        r.student_id === studentId &&
        r.academic_session_id === sessionId &&
        r.term === term
    );
  }

  public saveStudentTermRemark(
    schoolId: string,
    params: {
      studentId: string;
      sessionId: string;
      term: AcademicTerm;
      formTeacherRemark?: string;
      principalRemark?: string;
      nextTermResumptionDate?: string;
    }
  ): StudentTermRemark {
    const existingIdx = this.data.studentTermRemarks.findIndex(
      (r) =>
        r.school_id === schoolId &&
        r.student_id === params.studentId &&
        r.academic_session_id === params.sessionId &&
        r.term === params.term
    );

    const now = new Date().toISOString();
    let remark: StudentTermRemark;

    if (existingIdx >= 0) {
      remark = {
        ...this.data.studentTermRemarks[existingIdx],
        form_teacher_remark:
          params.formTeacherRemark !== undefined
            ? params.formTeacherRemark
            : this.data.studentTermRemarks[existingIdx].form_teacher_remark,
        principal_remark:
          params.principalRemark !== undefined
            ? params.principalRemark
            : this.data.studentTermRemarks[existingIdx].principal_remark,
        next_term_resumption_date:
          params.nextTermResumptionDate !== undefined
            ? params.nextTermResumptionDate
            : this.data.studentTermRemarks[existingIdx].next_term_resumption_date,
        updated_at: now,
      };
      this.data.studentTermRemarks[existingIdx] = remark;
    } else {
      remark = {
        id: `rmk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        school_id: schoolId,
        student_id: params.studentId,
        academic_session_id: params.sessionId,
        term: params.term,
        form_teacher_remark: params.formTeacherRemark || '',
        principal_remark: params.principalRemark || '',
        next_term_resumption_date: params.nextTermResumptionDate || '',
        updated_at: now,
      };
      this.data.studentTermRemarks.push(remark);
    }

    this.persist();
    return remark;
  }

  // --- Student Academic Profile & Report Card ---

  public getStudentAcademicHistory(
    schoolId: string,
    studentId: string
  ): Array<{
    session: AcademicSession;
    term: AcademicTerm;
    results: SubjectResult[];
    average: number;
    total_subjects: number;
    status: ResultStatus;
  }> {
    const studentResults = this.data.subjectResults.filter(
      (r) => r.school_id === schoolId && r.student_id === studentId
    );

    const groups: Map<string, SubjectResult[]> = new Map();

    studentResults.forEach((r) => {
      const key = `${r.academic_session_id}__${r.term}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    });

    const history: Array<any> = [];

    groups.forEach((results, key) => {
      const [sessionId, termStr] = key.split('__');
      const session = this.data.academicSessions.find((s) => s.id === sessionId) || {
        id: sessionId,
        school_id: schoolId,
        name: 'Historical Session',
        start_date: '',
        end_date: '',
        is_current: false,
        created_at: '',
      };

      const validScores = results.filter((r) => r.percentage !== null);
      const totalScore = validScores.reduce((acc, r) => acc + (r.percentage || 0), 0);
      const average = validScores.length > 0 ? Math.round((totalScore / validScores.length) * 10) / 10 : 0;
      const isAllPublished = results.every((r) => r.status === 'PUBLISHED');

      history.push({
        session,
        term: termStr as AcademicTerm,
        results,
        average,
        total_subjects: results.length,
        status: isAllPublished ? 'PUBLISHED' : results[0]?.status || 'DRAFT',
      });
    });

    return history.sort((a, b) => b.session.name.localeCompare(a.session.name));
  }

  public getStudentReportCard(
    schoolId: string,
    studentId: string,
    sessionId: string,
    term: AcademicTerm
  ): StudentReportCard | null {
    const student = this.getStudentById(schoolId, studentId);
    const school = this.getSchoolById(schoolId);
    const session = this.data.academicSessions.find((s) => s.school_id === schoolId && s.id === sessionId);

    if (!student || !school || !session) return null;

    const classId = student.current_class_id;
    const cls = classId ? this.getClassById(schoolId, classId) : undefined;
    if (!cls) return null;

    // Get subject results for this student, session, term
    const subjectResults = this.data.subjectResults.filter(
      (r) =>
        r.school_id === schoolId &&
        r.student_id === studentId &&
        r.academic_session_id === sessionId &&
        r.term === term
    );

    // Calculate class ranks among all students in this class
    const classmates = this.data.students.filter(
      (s) => s.school_id === schoolId && s.current_class_id === cls.id && s.status === 'ACTIVE'
    );

    const classmatesAverages: Array<{ studentId: string; avg: number }> = [];

    classmates.forEach((cm) => {
      const cmResults = this.data.subjectResults.filter(
        (r) =>
          r.school_id === schoolId &&
          r.student_id === cm.id &&
          r.academic_session_id === sessionId &&
          r.term === term &&
          r.percentage !== null
      );
      if (cmResults.length > 0) {
        const sum = cmResults.reduce((acc, r) => acc + (r.percentage || 0), 0);
        classmatesAverages.push({ studentId: cm.id, avg: sum / cmResults.length });
      }
    });

    classmatesAverages.sort((a, b) => b.avg - a.avg);
    const studentRankIdx = classmatesAverages.findIndex((c) => c.studentId === student.id);
    const classRank = studentRankIdx >= 0 ? studentRankIdx + 1 : undefined;

    // Summary calculation
    const validScores = subjectResults.filter((r) => r.total_score !== null);
    const totalScoreObtained = validScores.reduce((acc, r) => acc + (r.total_score || 0), 0);
    const maxPossibleScore = validScores.length * 100;
    const averagePercentage = validScores.length > 0 ? Math.round((totalScoreObtained / validScores.length) * 10) / 10 : 0;

    const config = this.getAcademicConfig(schoolId);
    let overallGrade = 'F';
    for (const item of config.grading_scale) {
      if (averagePercentage >= item.min_score && averagePercentage <= item.max_score) {
        overallGrade = item.grade;
        break;
      }
    }

    const passedSubjects = subjectResults.filter((r) => (r.percentage || 0) >= config.pass_mark).length;
    const failedSubjects = subjectResults.filter((r) => r.percentage !== null && (r.percentage || 0) < config.pass_mark).length;

    // Attendance records summary
    const attendanceRecords = this.data.attendanceRecords.filter(
      (r) => r.school_id === schoolId && r.student_id === studentId
    );
    const totalSessions = attendanceRecords.length;
    const presentSessions = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const absentSessions = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
    const lateSessions = attendanceRecords.filter((r) => r.status === 'LATE').length;
    const attendanceRate = totalSessions > 0 ? Math.round(((presentSessions + lateSessions * 0.5) / totalSessions) * 100) : 100;

    // Remarks
    const termRemark = this.getStudentTermRemark(schoolId, studentId, sessionId, term);
    const formTeacher = cls.class_teacher_id ? this.getStaffById(schoolId, cls.class_teacher_id) : undefined;
    const principal = this.data.staff.find((s) => s.school_id === schoolId && s.role === 'PRINCIPAL');

    const isPublished = subjectResults.length > 0 && subjectResults.every((r) => r.status === 'PUBLISHED');

    return {
      student,
      school,
      academic_session: session,
      term,
      class: cls,
      subject_results: subjectResults,
      summary: {
        total_subjects_offered: subjectResults.length,
        total_score_obtained: totalScoreObtained,
        max_possible_score: maxPossibleScore,
        average_percentage: averagePercentage,
        overall_grade: overallGrade,
        class_rank: classRank,
        class_size: classmates.length,
        passed_subjects: passedSubjects,
        failed_subjects: failedSubjects,
      },
      attendance: {
        total_sessions: totalSessions,
        present_sessions: presentSessions,
        absent_sessions: absentSessions,
        late_sessions: lateSessions,
        attendance_rate: attendanceRate,
      },
      remarks: {
        form_teacher_name: formTeacher?.full_name || 'Class Teacher',
        form_teacher_remark: termRemark?.form_teacher_remark || (averagePercentage >= 70 ? 'An outstanding performance with exceptional dedication.' : averagePercentage >= 50 ? 'Good work this term, with steady improvements.' : 'Needs more focus and diligent study in key subjects.'),
        principal_name: principal?.full_name || 'Dr. Amina Bello (Principal)',
        principal_remark: termRemark?.principal_remark || (averagePercentage >= 70 ? 'Excellent academic standard achieved. Commended for diligence.' : averagePercentage >= 50 ? 'Satisfactory academic term. Encouraged to strive higher.' : 'Advised to attend extra tutorials next term.'),
        next_term_begins: termRemark?.next_term_resumption_date || 'January 12, 2026',
      },
      is_published: isPublished,
      generated_at: new Date().toISOString(),
    };
  }

  // --- Class Academic Overview ---

  public getClassAcademicOverview(
    schoolId: string,
    classId: string,
    sessionId: string,
    term: AcademicTerm
  ): ClassAcademicOverview | null {
    const cls = this.getClassById(schoolId, classId);
    if (!cls) return null;

    const classStudents = this.data.students.filter(
      (s) => s.school_id === schoolId && s.current_class_id === classId && s.status === 'ACTIVE'
    );
    const totalStudents = classStudents.length;

    // Subjects in this class
    const classSubjects = cls.subjects || [];
    const assignments = this.getTeacherSubjectAssignments(schoolId, { classId, sessionId });

    const results = this.data.subjectResults.filter(
      (r) =>
        r.school_id === schoolId &&
        r.class_id === classId &&
        r.academic_session_id === sessionId &&
        r.term === term
    );

    let draftCount = 0;
    let submittedCount = 0;
    let reviewedCount = 0;
    let publishedCount = 0;

    results.forEach((r) => {
      if (r.status === 'DRAFT') draftCount++;
      else if (r.status === 'SUBMITTED') submittedCount++;
      else if (r.status === 'REVIEWED') reviewedCount++;
      else if (r.status === 'PUBLISHED') publishedCount++;
    });

    const validScores = results.filter((r) => r.percentage !== null);
    const totalScoreSum = validScores.reduce((acc, r) => acc + (r.percentage || 0), 0);
    const classAverage = validScores.length > 0 ? Math.round((totalScoreSum / validScores.length) * 10) / 10 : 0;

    // Top performer calculation
    const studentAverages: Array<{ studentId: string; name: string; avg: number }> = [];
    classStudents.forEach((st) => {
      const stResults = results.filter((r) => r.student_id === st.id && r.percentage !== null);
      if (stResults.length > 0) {
        const sum = stResults.reduce((acc, r) => acc + (r.percentage || 0), 0);
        studentAverages.push({
          studentId: st.id,
          name: `${st.first_name} ${st.last_name}`,
          avg: Math.round((sum / stResults.length) * 10) / 10,
        });
      }
    });

    studentAverages.sort((a, b) => b.avg - a.avg);
    const topPerformer = studentAverages.length > 0
      ? { student_id: studentAverages[0].studentId, student_name: studentAverages[0].name, average: studentAverages[0].avg }
      : undefined;

    // Build subjects summary
    const subjectsSummary = classSubjects.map((subName) => {
      const subObj = this.data.subjects.find((s) => s.school_id === schoolId && s.name.toLowerCase() === subName.toLowerCase());
      const subId = subObj?.id || `sub-${subName.toLowerCase().replace(/\s+/g, '-')}`;
      const assignment = assignments.find((a) => a.subject_id === subId || a.subject_name?.toLowerCase() === subName.toLowerCase());

      const subResults = results.filter((r) => r.subject_id === subId || r.subject_name?.toLowerCase() === subName.toLowerCase());
      const enteredCount = subResults.filter((r) => r.total_score !== null).length;
      const subScores = subResults.filter((r) => r.percentage !== null);
      const subAvg = subScores.length > 0 ? Math.round((subScores.reduce((acc, r) => acc + (r.percentage || 0), 0) / subScores.length) * 10) / 10 : 0;

      let subStatus: ResultStatus = 'DRAFT';
      if (subResults.length > 0) {
        if (subResults.every((r) => r.status === 'PUBLISHED')) subStatus = 'PUBLISHED';
        else if (subResults.every((r) => r.status === 'REVIEWED' || r.status === 'PUBLISHED')) subStatus = 'REVIEWED';
        else if (subResults.every((r) => r.status === 'SUBMITTED')) subStatus = 'SUBMITTED';
      }

      return {
        subject_id: subId,
        subject_name: subName,
        teacher_name: assignment?.teacher_name || 'Unassigned',
        assigned_teacher_id: assignment?.teacher_id,
        entered_count: enteredCount,
        total_count: totalStudents,
        average_score: subAvg,
        status: subStatus,
      };
    });

    // Subject objects list for table columns
    const subjectsList = classSubjects.map((subName) => {
      const subObj = this.data.subjects.find(
        (s) => s.school_id === schoolId && s.name.toLowerCase() === subName.toLowerCase()
      );
      return {
        id: subObj?.id || `sub-${subName.toLowerCase().replace(/\s+/g, '-')}`,
        name: subName,
        code: subObj?.code || subName.substring(0, 3).toUpperCase(),
      };
    });

    // Student-by-student Broadsheet Matrix with real positions and marks
    const broadsheet = classStudents.map((st) => {
      const stResults = results.filter((r) => r.student_id === st.id);
      const scoresMap: Record<string, { total: number; grade: string; remark?: string }> = {};
      let totalScore = 0;
      let subjectCount = 0;

      subjectsList.forEach((sub) => {
        const res = stResults.find(
          (r) => r.subject_id === sub.id || r.subject_name.toLowerCase() === sub.name.toLowerCase()
        );
        if (res && res.total_score !== null) {
          scoresMap[sub.id] = {
            total: res.total_score,
            grade: res.grade,
            remark: res.remark,
          };
          totalScore += res.total_score;
          subjectCount++;
        }
      });

      const avg = subjectCount > 0 ? Math.round((totalScore / subjectCount) * 10) / 10 : 0;
      const grade = this.calculateGrade(avg, schoolId);

      return {
        student_id: st.id,
        student_name: `${st.first_name} ${st.last_name}`,
        admission_number: st.admission_number,
        scores: scoresMap,
        total_score: totalScore,
        average_percentage: avg,
        grade: grade.grade,
        rank: 0,
      };
    });

    // Sort descending by total score to calculate positions/ranks
    broadsheet.sort((a, b) => b.total_score - a.total_score);
    broadsheet.forEach((item, index) => {
      item.rank = index + 1;
    });

    return {
      class_id: classId,
      class_name: cls.name,
      level: cls.level,
      total_students: totalStudents,
      total_subjects: classSubjects.length,
      results_status: {
        draft_count: draftCount,
        submitted_count: submittedCount,
        reviewed_count: reviewedCount,
        published_count: publishedCount,
      },
      class_average: classAverage,
      top_performer: topPerformer,
      subjects_summary: subjectsSummary,
      subjects: subjectsList,
      broadsheet,
    };
  }

  // =========================================================================
  // DIGITAL TRANSFORMATION PLAN METHODS (PDF SPECIFICATION)
  // =========================================================================

  // --- 1. HOMEWORK & LEARNING RESOURCES PUBLISHER ---
  public getHomework(schoolId: string, classId?: string, teacherId?: string): HomeworkAssignment[] {
    return (this.data.homework || []).filter((h) => {
      if (h.school_id !== schoolId) return false;
      if (classId && h.class_id !== classId) return false;
      if (teacherId && h.teacher_id !== teacherId) return false;
      return true;
    });
  }

  public createHomework(hw: HomeworkAssignment): HomeworkAssignment {
    if (!this.data.homework) this.data.homework = [];
    this.data.homework.unshift(hw);
    this.persist();
    return hw;
  }

  public submitHomework(
    schoolId: string,
    homeworkId: string,
    submission: HomeworkSubmission
  ): HomeworkAssignment | undefined {
    const hw = (this.data.homework || []).find((h) => h.id === homeworkId && h.school_id === schoolId);
    if (!hw) return undefined;

    const existingIndex = hw.submissions.findIndex((s) => s.student_id === submission.student_id);
    if (existingIndex >= 0) {
      hw.submissions[existingIndex] = { ...hw.submissions[existingIndex], ...submission };
    } else {
      hw.submissions.push(submission);
    }

    this.persist();
    return hw;
  }

  // --- 2. PARENT-TEACHER DIRECT MESSAGING HUB ---
  public getMessages(schoolId: string, userId: string): DirectMessage[] {
    return (this.data.directMessages || [])
      .filter((m) => m.school_id === schoolId && (m.sender_id === userId || m.recipient_id === userId))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public sendMessage(msg: DirectMessage): DirectMessage {
    if (!this.data.directMessages) this.data.directMessages = [];
    this.data.directMessages.push(msg);
    this.persist();
    return msg;
  }

  public markMessageRead(schoolId: string, messageId: string, userId: string): DirectMessage | undefined {
    const msg = (this.data.directMessages || []).find(
      (m) => m.id === messageId && m.school_id === schoolId && m.recipient_id === userId
    );
    if (!msg) return undefined;
    msg.status = 'READ';
    msg.read_at = new Date().toISOString();
    this.persist();
    return msg;
  }

  // --- 3. FINANCE, BILLING & DIGITAL LEDGER ---
  public getFeeAccounts(schoolId: string, classId?: string, studentId?: string): StudentFeeAccount[] {
    return (this.data.feeAccounts || []).filter((f) => {
      if (f.school_id !== schoolId) return false;
      if (classId && f.class_id !== classId) return false;
      if (studentId && f.student_id !== studentId) return false;
      return true;
    });
  }

  public getFeeAccountByStudent(schoolId: string, studentId: string): StudentFeeAccount | undefined {
    return (this.data.feeAccounts || []).find((f) => f.school_id === schoolId && f.student_id === studentId);
  }

  public recordFeePayment(payment: FeePayment): { payment: FeePayment; feeAccount?: StudentFeeAccount } {
    if (!this.data.feePayments) this.data.feePayments = [];
    this.data.feePayments.unshift(payment);

    let feeAccount = (this.data.feeAccounts || []).find(
      (f) => f.student_id === payment.student_id && f.school_id === payment.school_id
    );

    if (feeAccount) {
      feeAccount.total_paid += payment.amount;
      feeAccount.balance = Math.max(0, feeAccount.total_billed - feeAccount.total_paid);
      feeAccount.payment_status = feeAccount.balance <= 0 ? 'PAID' : 'PARTIAL';
      feeAccount.updated_at = new Date().toISOString();
    }

    this.persist();
    return { payment, feeAccount };
  }

  public sendPaymentReminders(schoolId: string, overdueOnly = true): { count: number; notifiedParents: string[] } {
    const accounts = (this.data.feeAccounts || []).filter((f) => {
      if (f.school_id !== schoolId) return false;
      return overdueOnly ? f.payment_status === 'OVERDUE' || f.payment_status === 'UNPAID' : f.balance > 0;
    });

    const notified: string[] = [];
    const now = new Date().toISOString();
    accounts.forEach((acc) => {
      acc.last_reminder_sent = now;
      notified.push(`${acc.guardian_name} (${acc.student_name} - ₦${acc.balance.toLocaleString()})`);
    });

    this.persist();
    return { count: accounts.length, notifiedParents: notified };
  }

  public getFeePayments(schoolId: string, studentId?: string): FeePayment[] {
    return (this.data.feePayments || []).filter((p) => {
      if (p.school_id !== schoolId) return false;
      if (studentId && p.student_id !== studentId) return false;
      return true;
    });
  }

  public verifyReceipt(schoolId: string, query: string): FeePayment | undefined {
    const q = query.trim().toUpperCase();
    return (this.data.feePayments || []).find(
      (p) =>
        p.school_id === schoolId &&
        (p.receipt_number.toUpperCase() === q ||
          p.reference.toUpperCase() === q ||
          p.id.toUpperCase() === q)
    );
  }

  // --- 4. DIGITAL APPROVALS & ABSENCE REPORTING ---
  public getDigitalApprovals(
    schoolId: string,
    studentId?: string,
    parentId?: string,
    classId?: string
  ): DigitalApproval[] {
    return (this.data.digitalApprovals || []).filter((a) => {
      if (a.school_id !== schoolId) return false;
      if (studentId && a.student_id !== studentId) return false;
      if (parentId && a.parent_id !== parentId) return false;
      if (classId && a.class_id !== classId) return false;
      return true;
    });
  }

  public createDigitalApproval(approval: DigitalApproval): DigitalApproval {
    if (!this.data.digitalApprovals) this.data.digitalApprovals = [];
    this.data.digitalApprovals.unshift(approval);
    this.persist();
    return approval;
  }

  public updateDigitalApprovalStatus(
    schoolId: string,
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'SIGNED',
    signatureName?: string,
    teacherNotes?: string
  ): DigitalApproval | undefined {
    const item = (this.data.digitalApprovals || []).find((a) => a.id === id && a.school_id === schoolId);
    if (!item) return undefined;

    item.status = status;
    item.updated_at = new Date().toISOString();
    if (signatureName) {
      item.signature_name = signatureName;
      item.signed_at = new Date().toISOString();
    }
    if (teacherNotes) {
      item.teacher_notes = teacherNotes;
    }

    this.persist();
    return item;
  }

  // --- 5. PAPERLESS TRANSFORMATION KPIS (PAGE 6 OF SPEC) ---
  public getPaperlessKPIs(schoolId: string): PaperlessKPIs {
    const accounts = (this.data.feeAccounts || []).filter((a) => a.school_id === schoolId);
    const totalBilled = accounts.reduce((acc, curr) => acc + curr.total_billed, 0);
    const totalPaid = accounts.reduce((acc, curr) => acc + curr.total_paid, 0);
    const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 83;

    return {
      administrative_time_saved_pct: 90, // Target: 90%
      paper_reduction_pct: 75, // Target: 75%
      fee_collection_velocity_pct: 32, // Target: 30%+
      parent_engagement_rate_pct: 88, // Target: >85%
      reams_paper_saved: 128,
      cost_saved_naira: 1024000,
      active_parent_users: 32,
      total_parent_users: 36,
      attendance_minutes_saved_daily: 45,
    };
  }

  // --- 6. PRE-STORED QUALITATIVE TEACHER COMMENTS LIBRARY (PAGE 3 OF SPEC) ---
  public getQualitativeCommentsLibrary(): Record<string, string[]> {
    return {
      EXCELLENT: [
        'Exhibits exceptional mastery and analytical precision in all subject tasks.',
        'Consistently attentive, disciplined, and models exemplary leadership in class.',
        'Demonstrates superior critical thinking and problem-solving capability.',
        'A brilliant student who inspires peers and maintains peak academic dedication.',
      ],
      VERY_GOOD: [
        'Shows commendable understanding and active participation in class discussions.',
        'Works with diligence, curiosity, and thorough attention to assigned problems.',
        'Displays strong mathematical logic and methodical step-by-step reasoning.',
        'Shows great improvement in geometry, algebra, and continuous assessment tasks.',
      ],
      GOOD: [
        'A steady worker with good potential; regular revision will yield even higher results.',
        'Demonstrates satisfactory comprehension; encourage more proactive class participation.',
        'Has made solid progress this term; keep building study stamina.',
      ],
      NEEDS_IMPROVEMENT: [
        'Needs to improve punctuality, classroom focus, and timely assignment turnaround.',
        'Would benefit significantly from supervised evening study hours and extra practice.',
        'Has potential but gets easily distracted during lessons; needs closer monitoring.',
      ],
    };
  }
  // --- 7. ADMINISTRATIVE INVITATION ENGINE ---
  public getAdminInvitations(schoolId: string): AdminInvitation[] {
    if (!this.data.adminInvitations) this.data.adminInvitations = [];
    return this.data.adminInvitations
      .filter((inv) => inv.school_id === schoolId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getAdminInvitationById(schoolId: string, id: string): AdminInvitation | undefined {
    if (!this.data.adminInvitations) this.data.adminInvitations = [];
    return this.data.adminInvitations.find((inv) => inv.school_id === schoolId && inv.id === id);
  }

  public getAdminInvitationByToken(token: string): AdminInvitation | undefined {
    if (!this.data.adminInvitations) this.data.adminInvitations = [];
    return this.data.adminInvitations.find((inv) => inv.invitation_token === token);
  }

  public createAdminInvitation(invite: AdminInvitation): AdminInvitation {
    if (!this.data.adminInvitations) this.data.adminInvitations = [];
    this.data.adminInvitations.push(invite);
    this.save();
    return invite;
  }

  public updateAdminInvitation(id: string, updates: Partial<AdminInvitation>): AdminInvitation | undefined {
    if (!this.data.adminInvitations) this.data.adminInvitations = [];
    const index = this.data.adminInvitations.findIndex((inv) => inv.id === id);
    if (index === -1) return undefined;
    this.data.adminInvitations[index] = {
      ...this.data.adminInvitations[index],
      ...updates,
    };
    this.save();
    return this.data.adminInvitations[index];
  }

  public deleteAdminInvitation(id: string): boolean {
    if (!this.data.adminInvitations) return false;
    const initialLen = this.data.adminInvitations.length;
    this.data.adminInvitations = this.data.adminInvitations.filter((inv) => inv.id !== id);
    if (this.data.adminInvitations.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new DatabaseEngine();

