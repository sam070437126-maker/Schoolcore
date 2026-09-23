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
} from '../../types/index.ts';

export interface ISchoolsRepository {
  getSchools(): Promise<School[]>;
  getSchoolById(id: string): Promise<School | undefined>;
  getSchoolByGooglePlaceId(placeId: string): Promise<School | undefined>;
  createSchool(school: School): Promise<School>;
  updateSchool(id: string, updates: Partial<School>): Promise<School | undefined>;
  deleteSchool(id: string): Promise<boolean>;
  getAcademicSessions(schoolId: string): Promise<AcademicSession[]>;
  createAcademicSession(session: AcademicSession): Promise<AcademicSession>;
}

export interface IUsersRepository {
  getProfileById(id: string): Promise<UserProfile | undefined>;
  getProfileByEmail(email: string): Promise<UserProfile | undefined>;
  createProfile(profile: UserProfile): Promise<UserProfile>;
  updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined>;
  getSchoolUser(schoolId: string, profileId: string): Promise<SchoolUser | undefined>;
  getSchoolUserById(id: string): Promise<SchoolUser | undefined>;
  getSchoolUsers(schoolId: string): Promise<SchoolUser[]>;
  getSchoolUsersByProfileId(profileId: string): Promise<SchoolUser[]>;
  createSchoolUser(membership: SchoolUser): Promise<SchoolUser>;
  updateSchoolUser(id: string, updates: Partial<SchoolUser>): Promise<SchoolUser | undefined>;
}

export interface IStudentsRepository {
  getStudents(
    schoolId: string,
    filters?: { search?: string; classId?: string; status?: StudentStatus },
    pagination?: { page: number; limit: number }
  ): Promise<{ students: Student[]; total: number; page: number; totalPages: number }>;
  getStudentById(schoolId: string, id: string): Promise<Student | undefined>;
  createStudent(student: Student): Promise<Student>;
  updateStudent(schoolId: string, id: string, updates: Partial<Student>): Promise<Student | undefined>;
}

export interface IClassesRepository {
  getClasses(schoolId: string): Promise<SchoolClass[]>;
  getClassById(schoolId: string, id: string): Promise<SchoolClass | undefined>;
  createClass(cls: SchoolClass): Promise<SchoolClass>;
  updateClass(schoolId: string, id: string, updates: Partial<SchoolClass>): Promise<SchoolClass | undefined>;
  archiveClass(schoolId: string, id: string): Promise<SchoolClass | undefined>;
}

export interface IStaffRepository {
  getStaff(schoolId: string): Promise<StaffMember[]>;
  getStaffById(schoolId: string, id: string): Promise<StaffMember | undefined>;
  getStaffByProfileId(schoolId: string, profileId: string): Promise<StaffMember | undefined>;
  createStaff(staff: StaffMember): Promise<StaffMember>;
  updateStaff(schoolId: string, id: string, updates: Partial<StaffMember>): Promise<StaffMember | undefined>;
}

export interface ISubjectsRepository {
  getSubjects(schoolId: string): Promise<Subject[]>;
  createSubject(subject: Subject): Promise<Subject>;
}

export interface IAttendanceRepository {
  getAttendanceSession(
    schoolId: string,
    classId: string,
    date: string,
    sessionType: 'MORNING' | 'AFTERNOON'
  ): Promise<AttendanceSession | undefined>;
  getAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]>;
  getAttendanceHistory(
    schoolId: string,
    filters?: { classId?: string; startDate?: string; endDate?: string }
  ): Promise<AttendanceSession[]>;
  getStudentAttendanceStats(
    schoolId: string,
    studentId: string
  ): Promise<{ total: number; present: number; absent: number; late: number; rate: number }>;
  saveAttendanceSession(
    sessionData: AttendanceSession,
    records: AttendanceRecord[]
  ): Promise<{ session: AttendanceSession; records: AttendanceRecord[] }>;
}

export interface INoticesRepository {
  getNotices(schoolId: string, audience?: string, status?: string): Promise<SchoolNotice[]>;
  createNotice(notice: SchoolNotice): Promise<SchoolNotice>;
  updateNotice(schoolId: string, noticeId: string, updates: Partial<SchoolNotice>): Promise<SchoolNotice | undefined>;
  archiveNotice(schoolId: string, noticeId: string): Promise<SchoolNotice | undefined>;
}

export interface ISettingsRepository {
  getSettings(schoolId: string): Promise<SchoolSettings | undefined>;
  updateSettings(schoolId: string, updates: Partial<SchoolSettings>): Promise<SchoolSettings | undefined>;
}

export interface IAuditLogsRepository {
  getAuditLogs(schoolId: string, limit?: number): Promise<AuditLog[]>;
  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<AuditLog>;
}

export interface IDashboardService {
  getDashboardStats(schoolId: string, profileId: string, role: UserRole): Promise<DashboardStats>;
}

export interface IAcademicsRepository {
  getAcademicConfig(schoolId: string): Promise<AcademicConfig | undefined>;
  updateAcademicConfig(schoolId: string, updates: Partial<AcademicConfig>): Promise<AcademicConfig | undefined>;
  getTeacherSubjectAssignments(
    schoolId: string,
    filters?: { teacherId?: string; classId?: string; subjectId?: string; sessionId?: string }
  ): Promise<TeacherSubjectAssignment[]>;
  createTeacherSubjectAssignment(assignment: TeacherSubjectAssignment): Promise<TeacherSubjectAssignment>;
  deleteTeacherSubjectAssignment(schoolId: string, id: string): Promise<boolean>;
  getSubjectResults(
    schoolId: string,
    filters: { classId: string; subjectId: string; term: string; sessionId?: string; studentId?: string }
  ): Promise<SubjectResult[]>;
  saveSubjectResultsBatch(schoolId: string, results: SubjectResult[]): Promise<SubjectResult[]>;
  updateResultsStatusBatch(schoolId: string, resultIds: string[], status: ResultStatus): Promise<SubjectResult[]>;
  getStudentTermRemark(
    schoolId: string,
    studentId: string,
    term: string,
    sessionId?: string
  ): Promise<StudentTermRemark | undefined>;
  saveStudentTermRemark(remark: StudentTermRemark): Promise<StudentTermRemark>;
  getStudentAcademicHistory(schoolId: string, studentId: string): Promise<any>;
  getStudentReportCard(
    schoolId: string,
    studentId: string,
    term: string,
    sessionId?: string
  ): Promise<StudentReportCard | null>;
  getClassAcademicOverview(
    schoolId: string,
    classId: string,
    term: string,
    sessionId?: string
  ): Promise<ClassAcademicOverview>;
}

export interface IInvitationsRepository {
  getInvitations(schoolId: string): Promise<AdminInvitation[]>;
  getInvitationById(schoolId: string, id: string): Promise<AdminInvitation | undefined>;
  getInvitationByToken(token: string): Promise<AdminInvitation | undefined>;
  createInvitation(invitation: AdminInvitation): Promise<AdminInvitation>;
  updateInvitation(id: string, updates: Partial<AdminInvitation>): Promise<AdminInvitation | undefined>;
  deleteInvitation(id: string): Promise<boolean>;
}

export interface IRepositories {
  schools: ISchoolsRepository;
  users: IUsersRepository;
  students: IStudentsRepository;
  classes: IClassesRepository;
  staff: IStaffRepository;
  subjects: ISubjectsRepository;
  attendance: IAttendanceRepository;
  notices: INoticesRepository;
  settings: ISettingsRepository;
  auditLogs: IAuditLogsRepository;
  dashboard: IDashboardService;
  academics: IAcademicsRepository;
  invitations: IInvitationsRepository;
}
