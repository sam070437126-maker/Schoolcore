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
  AcademicConfig,
  TeacherSubjectAssignment,
  SubjectResult,
  StudentTermRemark,
  HomeworkAssignment,
  DirectMessage,
  StudentFeeAccount,
  FeePayment,
  DigitalApproval,
  ParentStudent,
  UserNotification,
  AdminInvitation,
} from '../types/index.ts';

export interface SeedDataResponse {
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
  academicConfigs: AcademicConfig[];
  teacherSubjectAssignments: TeacherSubjectAssignment[];
  subjectResults: SubjectResult[];
  studentTermRemarks: StudentTermRemark[];
  homework: HomeworkAssignment[];
  directMessages: DirectMessage[];
  feeAccounts: StudentFeeAccount[];
  feePayments: FeePayment[];
  digitalApprovals: DigitalApproval[];
  parentStudents: ParentStudent[];
  userNotifications: UserNotification[];
  adminInvitations: AdminInvitation[];
}

export function getInitialSeedData(): SeedDataResponse {
  const superAdminProfile: UserProfile = {
    id: 'usr-superadmin-samuel',
    email: 'samuelemma466@gmail.com',
    full_name: 'Samuel Emmanuel',
    phone: '+234 800 000 0000',
    password_hash: 'Admin@2026!',
    created_at: new Date().toISOString(),
  };

  const superAdminMembership: SchoolUser = {
    id: 'su-superadmin-samuel',
    school_id: 'global-platform',
    profile_id: 'usr-superadmin-samuel',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    password_set: true,
    first_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  return {
    schools: [],
    academicSessions: [],
    profiles: [superAdminProfile],
    schoolUsers: [superAdminMembership],
    classes: [],
    subjects: [],
    students: [],
    staff: [],
    attendanceSessions: [],
    attendanceRecords: [],
    notices: [],
    settings: [],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        school_id: 'global-platform',
        actor_id: 'usr-superadmin-samuel',
        actor_name: 'Samuel Emmanuel',
        actor_role: 'SUPER_ADMIN',
        action: 'PLATFORM_INITIALIZED',
        entity: 'System',
        entity_id: 'global-platform',
        details: 'SchoolCore Multi-School Platform initialized. Super Master Admin: samuelemma466@gmail.com',
        timestamp: new Date().toISOString(),
      },
    ],
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
}
