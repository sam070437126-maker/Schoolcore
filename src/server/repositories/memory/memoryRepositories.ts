import { db } from '../../db.ts';
import {
  ISchoolsRepository,
  IUsersRepository,
  IStudentsRepository,
  IClassesRepository,
  IStaffRepository,
  ISubjectsRepository,
  IAttendanceRepository,
  INoticesRepository,
  ISettingsRepository,
  IAuditLogsRepository,
  IDashboardService,
  IAcademicsRepository,
  IInvitationsRepository,
  IRepositories,
} from '../types.ts';
import {
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
  StudentStatus,
  AcademicConfig,
  TeacherSubjectAssignment,
  SubjectResult,
  StudentTermRemark,
  StudentReportCard,
  ClassAcademicOverview,
  ResultStatus,
  DashboardStats,
  AdminInvitation,
} from '../../../types/index.ts';

export class MemorySchoolsRepository implements ISchoolsRepository {
  async getSchools(): Promise<School[]> {
    return db.getSchools();
  }
  async getSchoolById(id: string): Promise<School | undefined> {
    return db.getSchoolById(id);
  }
  async getSchoolByGooglePlaceId(placeId: string): Promise<School | undefined> {
    return db.getSchoolByGooglePlaceId(placeId);
  }
  async createSchool(school: School): Promise<School> {
    return db.createSchool(school);
  }
  async updateSchool(id: string, updates: Partial<School>): Promise<School | undefined> {
    return db.updateSchool(id, updates);
  }
  async deleteSchool(id: string): Promise<boolean> {
    return db.deleteSchool(id);
  }
  async getAcademicSessions(schoolId: string): Promise<AcademicSession[]> {
    return db.getAcademicSessions(schoolId);
  }
  async createAcademicSession(session: AcademicSession): Promise<AcademicSession> {
    return db.createAcademicSession(session);
  }
}

export class MemoryUsersRepository implements IUsersRepository {
  async getProfileById(id: string): Promise<UserProfile | undefined> {
    return db.getProfileById(id);
  }
  async getProfileByEmail(email: string): Promise<UserProfile | undefined> {
    return db.getProfileByEmail(email);
  }
  async createProfile(profile: UserProfile): Promise<UserProfile> {
    return db.createProfile(profile);
  }
  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    return db.updateProfile(id, updates);
  }
  async getSchoolUser(schoolId: string, profileId: string): Promise<SchoolUser | undefined> {
    return db.getSchoolUser(schoolId, profileId);
  }
  async getSchoolUserById(id: string): Promise<SchoolUser | undefined> {
    return db.getSchoolUserById(id);
  }
  async getSchoolUsers(schoolId: string): Promise<SchoolUser[]> {
    return db.getSchoolUsers(schoolId);
  }
  async getSchoolUsersByProfileId(profileId: string): Promise<SchoolUser[]> {
    return db.getSchoolUsersByProfileId(profileId);
  }
  async createSchoolUser(membership: SchoolUser): Promise<SchoolUser> {
    return db.createSchoolUser(membership);
  }
  async updateSchoolUser(id: string, updates: Partial<SchoolUser>): Promise<SchoolUser | undefined> {
    return db.updateSchoolUser(id, updates);
  }
}

export class MemoryStudentsRepository implements IStudentsRepository {
  async getStudents(
    schoolId: string,
    filters?: { search?: string; classId?: string; status?: StudentStatus },
    pagination?: { page: number; limit: number }
  ): Promise<{ students: Student[]; total: number; page: number; totalPages: number }> {
    return db.getStudents(schoolId, { ...filters, ...pagination });
  }
  async getStudentById(schoolId: string, id: string): Promise<Student | undefined> {
    return db.getStudentById(schoolId, id);
  }
  async createStudent(student: Student): Promise<Student> {
    return db.createStudent(student);
  }
  async updateStudent(schoolId: string, id: string, updates: Partial<Student>): Promise<Student | undefined> {
    return db.updateStudent(schoolId, id, updates);
  }
}

export class MemoryClassesRepository implements IClassesRepository {
  async getClasses(schoolId: string): Promise<SchoolClass[]> {
    return db.getClasses(schoolId);
  }
  async getClassById(schoolId: string, id: string): Promise<SchoolClass | undefined> {
    return db.getClassById(schoolId, id);
  }
  async createClass(cls: SchoolClass): Promise<SchoolClass> {
    return db.createClass(cls);
  }
  async updateClass(schoolId: string, id: string, updates: Partial<SchoolClass>): Promise<SchoolClass | undefined> {
    return db.updateClass(schoolId, id, updates);
  }
  async archiveClass(schoolId: string, id: string): Promise<SchoolClass | undefined> {
    const success = db.archiveClass(schoolId, id);
    if (!success) return undefined;
    return db.getClassById(schoolId, id);
  }
}

export class MemoryStaffRepository implements IStaffRepository {
  async getStaff(schoolId: string): Promise<StaffMember[]> {
    return db.getStaff(schoolId);
  }
  async getStaffById(schoolId: string, id: string): Promise<StaffMember | undefined> {
    return db.getStaffById(schoolId, id);
  }
  async getStaffByProfileId(schoolId: string, profileId: string): Promise<StaffMember | undefined> {
    return db.getStaffByProfileId(schoolId, profileId);
  }
  async createStaff(staff: StaffMember): Promise<StaffMember> {
    return db.createStaff(staff);
  }
  async updateStaff(schoolId: string, id: string, updates: Partial<StaffMember>): Promise<StaffMember | undefined> {
    return db.updateStaff(schoolId, id, updates);
  }
}

export class MemorySubjectsRepository implements ISubjectsRepository {
  async getSubjects(schoolId: string): Promise<Subject[]> {
    return db.getSubjects(schoolId);
  }
  async createSubject(subject: Subject): Promise<Subject> {
    return db.createSubject(subject);
  }
}

export class MemoryAttendanceRepository implements IAttendanceRepository {
  async getAttendanceSession(
    schoolId: string,
    classId: string,
    date: string,
    sessionType: 'MORNING' | 'AFTERNOON' = 'MORNING'
  ): Promise<AttendanceSession | undefined> {
    const res = db.getAttendanceSession(schoolId, classId, date, sessionType);
    return res.session;
  }

  async getAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
    const all = (db as any).data?.attendanceRecords || [];
    return all.filter((r: any) => r.session_id === sessionId);
  }

  async getAttendanceHistory(
    schoolId: string,
    filters?: { classId?: string; startDate?: string; endDate?: string }
  ): Promise<AttendanceSession[]> {
    return db.getAttendanceHistory(schoolId, filters);
  }

  async getStudentAttendanceStats(
    schoolId: string,
    studentId: string
  ): Promise<{ total: number; present: number; absent: number; late: number; rate: number }> {
    return db.getStudentAttendanceStats(schoolId, studentId);
  }

  async saveAttendanceSession(
    sessionData: AttendanceSession,
    records: AttendanceRecord[]
  ): Promise<{ session: AttendanceSession; records: AttendanceRecord[] }> {
    return db.saveAttendanceSession(
      sessionData.school_id,
      sessionData.class_id,
      sessionData.date,
      sessionData.marked_by_id,
      sessionData.marked_by_name || '',
      records.map((r) => ({
        student_id: r.student_id,
        status: r.status as 'PRESENT' | 'ABSENT' | 'LATE',
        remarks: r.remarks || r.remark,
      })),
      '',
      sessionData.session_type
    );
  }
}

export class MemoryNoticesRepository implements INoticesRepository {
  async getNotices(schoolId: string, audience?: string, status?: string): Promise<SchoolNotice[]> {
    return db.getNotices(schoolId, audience as any);
  }
  async createNotice(notice: SchoolNotice): Promise<SchoolNotice> {
    return db.createNotice(notice);
  }
  async updateNotice(schoolId: string, noticeId: string, updates: Partial<SchoolNotice>): Promise<SchoolNotice | undefined> {
    return db.updateNotice(schoolId, noticeId, updates);
  }
  async archiveNotice(schoolId: string, noticeId: string): Promise<SchoolNotice | undefined> {
    const success = db.archiveNotice(schoolId, noticeId);
    if (!success) return undefined;
    return (db as any).data.notices.find((n: any) => n.school_id === schoolId && n.id === noticeId);
  }
}

export class MemorySettingsRepository implements ISettingsRepository {
  async getSettings(schoolId: string): Promise<SchoolSettings | undefined> {
    return db.getSettings(schoolId);
  }
  async updateSettings(schoolId: string, updates: Partial<SchoolSettings>): Promise<SchoolSettings | undefined> {
    return db.updateSettings(schoolId, updates);
  }
}

export class MemoryAuditLogsRepository implements IAuditLogsRepository {
  async getAuditLogs(schoolId: string, limit?: number): Promise<AuditLog[]> {
    return db.getAuditLogs(schoolId, limit);
  }
  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<AuditLog> {
    return db.addAuditLog(log);
  }
}

export class MemoryDashboardService implements IDashboardService {
  async getDashboardStats(schoolId: string, profileId: string, role: UserRole): Promise<DashboardStats> {
    return db.getDashboardStats(schoolId, profileId, role);
  }
}

export class MemoryAcademicsRepository implements IAcademicsRepository {
  async getAcademicConfig(schoolId: string): Promise<AcademicConfig | undefined> {
    return db.getAcademicConfig(schoolId);
  }
  async updateAcademicConfig(schoolId: string, updates: Partial<AcademicConfig>): Promise<AcademicConfig | undefined> {
    return db.updateAcademicConfig(schoolId, updates);
  }
  async getTeacherSubjectAssignments(
    schoolId: string,
    filters?: { teacherId?: string; classId?: string; subjectId?: string }
  ): Promise<TeacherSubjectAssignment[]> {
    return db.getTeacherSubjectAssignments(schoolId, filters);
  }
  async createTeacherSubjectAssignment(assignment: TeacherSubjectAssignment): Promise<TeacherSubjectAssignment> {
    return db.createTeacherSubjectAssignment(assignment);
  }
  async deleteTeacherSubjectAssignment(schoolId: string, id: string): Promise<boolean> {
    return db.deleteTeacherSubjectAssignment(schoolId, id);
  }
  async getSubjectResults(
    schoolId: string,
    filters: { classId: string; subjectId: string; term: string; sessionId?: string }
  ): Promise<SubjectResult[]> {
    return db.getSubjectResults(schoolId, filters as any);
  }
  async saveSubjectResultsBatch(schoolId: string, results: SubjectResult[]): Promise<SubjectResult[]> {
    const list = (db as any).data.subjectResults as SubjectResult[];
    for (const r of results) {
      const idx = list.findIndex(
        (existing) =>
          existing.school_id === schoolId &&
          existing.student_id === r.student_id &&
          existing.subject_id === r.subject_id &&
          existing.academic_session_id === r.academic_session_id &&
          existing.term === r.term
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...r, updated_at: new Date().toISOString() };
      } else {
        list.push(r);
      }
    }
    (db as any).save();
    return results;
  }
  async updateResultsStatusBatch(schoolId: string, resultIds: string[], status: ResultStatus): Promise<SubjectResult[]> {
    const list = (db as any).data.subjectResults as SubjectResult[];
    const updated: SubjectResult[] = [];
    for (const r of list) {
      if (r.school_id === schoolId && resultIds.includes(r.id)) {
        r.status = status;
        r.updated_at = new Date().toISOString();
        updated.push(r);
      }
    }
    (db as any).save();
    return updated;
  }
  async getStudentTermRemark(
    schoolId: string,
    studentId: string,
    term: string,
    sessionId?: string
  ): Promise<StudentTermRemark | undefined> {
    const ses = sessionId || 'ses-2025-2026';
    return db.getStudentTermRemark(schoolId, studentId, ses, term as any);
  }
  async saveStudentTermRemark(remark: StudentTermRemark): Promise<StudentTermRemark> {
    const list = (db as any).data.studentTermRemarks as StudentTermRemark[];
    const idx = list.findIndex(
      (r) =>
        r.school_id === remark.school_id &&
        r.student_id === remark.student_id &&
        r.academic_session_id === remark.academic_session_id &&
        r.term === remark.term
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...remark, updated_at: new Date().toISOString() };
    } else {
      list.push(remark);
    }
    (db as any).save();
    return remark;
  }
  async getStudentAcademicHistory(schoolId: string, studentId: string): Promise<any> {
    return db.getStudentAcademicHistory(schoolId, studentId);
  }
  async getStudentReportCard(
    schoolId: string,
    studentId: string,
    term: string,
    sessionId?: string
  ): Promise<StudentReportCard | null> {
    const ses = sessionId || 'ses-2025-2026';
    return db.getStudentReportCard(schoolId, studentId, ses, term as any);
  }
  async getClassAcademicOverview(
    schoolId: string,
    classId: string,
    term: string,
    sessionId?: string
  ): Promise<ClassAcademicOverview> {
    const ses = sessionId || 'ses-2025-2026';
    return db.getClassAcademicOverview(schoolId, classId, ses, term as any);
  }
}

export class MemoryInvitationsRepository implements IInvitationsRepository {
  async getInvitations(schoolId: string): Promise<AdminInvitation[]> {
    return db.getAdminInvitations(schoolId);
  }
  async getInvitationById(schoolId: string, id: string): Promise<AdminInvitation | undefined> {
    return db.getAdminInvitationById(schoolId, id);
  }
  async getInvitationByToken(token: string): Promise<AdminInvitation | undefined> {
    return db.getAdminInvitationByToken(token);
  }
  async createInvitation(invitation: AdminInvitation): Promise<AdminInvitation> {
    return db.createAdminInvitation(invitation);
  }
  async updateInvitation(id: string, updates: Partial<AdminInvitation>): Promise<AdminInvitation | undefined> {
    return db.updateAdminInvitation(id, updates);
  }
  async deleteInvitation(id: string): Promise<boolean> {
    return db.deleteAdminInvitation(id);
  }
}

export function createMemoryRepositories(): IRepositories {
  return {
    schools: new MemorySchoolsRepository(),
    users: new MemoryUsersRepository(),
    students: new MemoryStudentsRepository(),
    classes: new MemoryClassesRepository(),
    staff: new MemoryStaffRepository(),
    subjects: new MemorySubjectsRepository(),
    attendance: new MemoryAttendanceRepository(),
    notices: new MemoryNoticesRepository(),
    settings: new MemorySettingsRepository(),
    auditLogs: new MemoryAuditLogsRepository(),
    dashboard: new MemoryDashboardService(),
    academics: new MemoryAcademicsRepository(),
    invitations: new MemoryInvitationsRepository(),
  };
}
