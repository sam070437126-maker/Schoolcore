import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../../firebaseClient.ts';
import { db } from '../../db.ts';
import { MemoryInvitationsRepository } from '../memory/memoryRepositories.ts';
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
  AcademicTerm,
  NoticeAudience,
} from '../../../types/index.ts';

// ----------------------------------------------------
// 1. SCHOOLS REPOSITORY
// ----------------------------------------------------
export class FirebaseSchoolsRepository implements ISchoolsRepository {
  async getSchools(): Promise<School[]> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'schools');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as School);
      }
    } catch (err: any) {
      console.warn('[FirebaseSchoolsRepository.getSchools] read fallback:', err.message);
    }
    return db.getSchools();
  }

  async getSchoolById(id: string): Promise<School | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'schools', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as School;
      }
    } catch (err: any) {
      console.warn('[FirebaseSchoolsRepository.getSchoolById] read fallback:', err.message);
    }
    return db.getSchoolById(id);
  }

  async getSchoolByGooglePlaceId(placeId: string): Promise<School | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'schools');
      const q = query(colRef, where('google_place_id', '==', placeId), firestoreLimit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as School;
      }
    } catch (err: any) {
      // fallback
    }
    return db.getSchoolByGooglePlaceId(placeId);
  }

  async createSchool(school: School): Promise<School> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'schools', school.id);
      await setDoc(docRef, school);
    } catch (err: any) {
      console.warn('[FirebaseSchoolsRepository.createSchool] Firestore write error:', err.message);
    }
    return db.createSchool(school);
  }

  async updateSchool(id: string, updates: Partial<School>): Promise<School | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'schools', id);
      await updateDoc(docRef, { ...updates, updated_at: new Date().toISOString() });
    } catch (err: any) {
      console.warn('[FirebaseSchoolsRepository.updateSchool] Firestore write error:', err.message);
    }
    return db.updateSchool(id, updates);
  }

  async deleteSchool(id: string): Promise<boolean> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'schools', id);
      await deleteDoc(docRef);
    } catch (err: any) {
      console.warn('[FirebaseSchoolsRepository.deleteSchool] Firestore delete error:', err.message);
    }
    db.deleteSchool(id);
    return true;
  }

  async getAcademicSessions(schoolId: string): Promise<AcademicSession[]> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'academicSessions');
      const q = query(colRef, where('school_id', '==', schoolId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as AcademicSession);
      }
    } catch (err: any) {
      // fallback
    }
    return db.getAcademicSessions(schoolId);
  }

  async createAcademicSession(session: AcademicSession): Promise<AcademicSession> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'academicSessions', session.id);
      await setDoc(docRef, session);
    } catch (err: any) {
      console.warn('[FirebaseSchoolsRepository.createAcademicSession] error:', err.message);
    }
    return db.createAcademicSession(session);
  }
}

// ----------------------------------------------------
// 2. USERS REPOSITORY
// ----------------------------------------------------
export class FirebaseUsersRepository implements IUsersRepository {
  async getProfileById(id: string): Promise<UserProfile | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'profiles', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (err: any) {
      // fallback
    }
    return db.getProfileById(id);
  }

  async getProfileByEmail(email: string): Promise<UserProfile | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'profiles');
      const q = query(colRef, where('email', '==', email), firestoreLimit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as UserProfile;
      }
    } catch (err: any) {
      // fallback
    }
    return db.getProfileByEmail(email);
  }

  async createProfile(profile: UserProfile): Promise<UserProfile> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'profiles', profile.id);
      await setDoc(docRef, profile);
    } catch (err: any) {
      console.warn('[FirebaseUsersRepository.createProfile] error:', err.message);
    }
    return db.createProfile(profile);
  }

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'profiles', id);
      await updateDoc(docRef, updates);
    } catch (err: any) {
      console.warn('[FirebaseUsersRepository.updateProfile] error:', err.message);
    }
    return db.updateProfile(id, updates);
  }

  async getSchoolUser(schoolId: string, profileId: string): Promise<SchoolUser | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'schoolUsers');
      const q = query(
        colRef,
        where('school_id', '==', schoolId),
        where('profile_id', '==', profileId),
        firestoreLimit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as SchoolUser;
      }
    } catch (err: any) {
      // fallback
    }
    return db.getSchoolUser(schoolId, profileId);
  }

  async getSchoolUsers(schoolId: string): Promise<SchoolUser[]> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'schoolUsers');
      const q = query(colRef, where('school_id', '==', schoolId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as SchoolUser);
      }
    } catch (err: any) {
      // fallback
    }
    return db.getSchoolUsers(schoolId);
  }

  async getSchoolUsersByProfileId(profileId: string): Promise<SchoolUser[]> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'schoolUsers');
      const q = query(colRef, where('profile_id', '==', profileId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as SchoolUser);
      }
    } catch (err: any) {
      // fallback
    }
    return db.getSchoolUsersByProfileId(profileId);
  }

  async getSchoolUserById(id: string): Promise<SchoolUser | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'schoolUsers', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as SchoolUser;
      }
    } catch (err: any) {
      // fallback
    }
    return db.getSchoolUserById(id);
  }

  async createSchoolUser(membership: SchoolUser): Promise<SchoolUser> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'schoolUsers', membership.id);
      await setDoc(docRef, membership);
    } catch (err: any) {
      console.warn('[FirebaseUsersRepository.createSchoolUser] error:', err.message);
    }
    return db.createSchoolUser(membership);
  }

  async updateSchoolUser(id: string, updates: Partial<SchoolUser>): Promise<SchoolUser | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'schoolUsers', id);
      await updateDoc(docRef, updates);
    } catch (err: any) {
      // fallback
    }
    return db.updateSchoolUser(id, updates);
  }
}

// ----------------------------------------------------
// 3. STUDENTS REPOSITORY
// ----------------------------------------------------
export class FirebaseStudentsRepository implements IStudentsRepository {
  async getStudents(
    schoolId: string,
    filters?: { search?: string; classId?: string; status?: StudentStatus },
    pagination?: { page: number; limit: number }
  ): Promise<{ students: Student[]; total: number; page: number; totalPages: number }> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'students');
      const q = query(colRef, where('school_id', '==', schoolId));
      const snap = await getDocs(q);

      if (!snap.empty) {
        let students = snap.docs.map((d) => d.data() as Student);

        if (filters?.classId) {
          students = students.filter((s) => s.current_class_id === filters.classId);
        }
        if (filters?.status) {
          students = students.filter((s) => s.status === filters.status);
        }
        if (filters?.search) {
          const term = filters.search.toLowerCase();
          students = students.filter(
            (s) =>
              s.first_name.toLowerCase().includes(term) ||
              s.last_name.toLowerCase().includes(term) ||
              s.admission_number.toLowerCase().includes(term)
          );
        }

        const total = students.length;
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const totalPages = Math.ceil(total / limit) || 1;
        const start = (page - 1) * limit;
        const paginated = students.slice(start, start + limit);

        return { students: paginated, total, page, totalPages };
      }
    } catch (err: any) {
      console.warn('[FirebaseStudentsRepository.getStudents] fallback:', err.message);
    }
    return db.getStudents(schoolId, { ...filters, ...pagination });
  }

  async getStudentById(schoolId: string, id: string): Promise<Student | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'students', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Student;
        if (data.school_id === schoolId) return data;
      }
    } catch (err: any) {
      // fallback
    }
    return db.getStudentById(schoolId, id);
  }

  async createStudent(student: Student): Promise<Student> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'students', student.id);
      await setDoc(docRef, student);
    } catch (err: any) {
      console.warn('[FirebaseStudentsRepository.createStudent] error:', err.message);
    }
    return db.createStudent(student);
  }

  async updateStudent(schoolId: string, id: string, updates: Partial<Student>): Promise<Student | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'students', id);
      await updateDoc(docRef, { ...updates, updated_at: new Date().toISOString() });
    } catch (err: any) {
      console.warn('[FirebaseStudentsRepository.updateStudent] error:', err.message);
    }
    return db.updateStudent(schoolId, id, updates);
  }
}

// ----------------------------------------------------
// 4. CLASSES REPOSITORY
// ----------------------------------------------------
export class FirebaseClassesRepository implements IClassesRepository {
  async getClasses(schoolId: string): Promise<SchoolClass[]> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'classes');
      const q = query(colRef, where('school_id', '==', schoolId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as SchoolClass);
      }
    } catch (err: any) {
      // fallback
    }
    return db.getClasses(schoolId);
  }

  async getClassById(schoolId: string, id: string): Promise<SchoolClass | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'classes', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as SchoolClass;
        if (data.school_id === schoolId) return data;
      }
    } catch (err: any) {
      // fallback
    }
    return db.getClassById(schoolId, id);
  }

  async createClass(cls: SchoolClass): Promise<SchoolClass> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'classes', cls.id);
      await setDoc(docRef, cls);
    } catch (err: any) {
      console.warn('[FirebaseClassesRepository.createClass] error:', err.message);
    }
    return db.createClass(cls);
  }

  async updateClass(schoolId: string, id: string, updates: Partial<SchoolClass>): Promise<SchoolClass | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'classes', id);
      await updateDoc(docRef, { ...updates, updated_at: new Date().toISOString() });
    } catch (err: any) {
      console.warn('[FirebaseClassesRepository.updateClass] error:', err.message);
    }
    return db.updateClass(schoolId, id, updates);
  }

  async archiveClass(schoolId: string, id: string): Promise<SchoolClass | undefined> {
    const success = db.archiveClass(schoolId, id);
    if (!success) return undefined;
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'classes', id);
      await updateDoc(docRef, { status: 'ARCHIVED', updated_at: new Date().toISOString() });
    } catch (err: any) {
      // ignore
    }
    return db.getClassById(schoolId, id);
  }
}

// ----------------------------------------------------
// 5. STAFF REPOSITORY
// ----------------------------------------------------
export class FirebaseStaffRepository implements IStaffRepository {
  async getStaff(schoolId: string): Promise<StaffMember[]> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'staff');
      const q = query(colRef, where('school_id', '==', schoolId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as StaffMember);
      }
    } catch (err: any) {
      // fallback
    }
    return db.getStaff(schoolId);
  }

  async getStaffById(schoolId: string, id: string): Promise<StaffMember | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'staff', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as StaffMember;
        if (data.school_id === schoolId) return data;
      }
    } catch (err: any) {
      // fallback
    }
    return db.getStaffById(schoolId, id);
  }

  async getStaffByProfileId(schoolId: string, profileId: string): Promise<StaffMember | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'staff');
      const q = query(
        colRef,
        where('school_id', '==', schoolId),
        where('profile_id', '==', profileId),
        firestoreLimit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as StaffMember;
      }
    } catch (err: any) {
      // fallback
    }
    return db.getStaffByProfileId(schoolId, profileId);
  }

  async createStaff(staff: StaffMember): Promise<StaffMember> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'staff', staff.id);
      await setDoc(docRef, staff);
    } catch (err: any) {
      console.warn('[FirebaseStaffRepository.createStaff] error:', err.message);
    }
    return db.createStaff(staff);
  }

  async updateStaff(schoolId: string, id: string, updates: Partial<StaffMember>): Promise<StaffMember | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'staff', id);
      await updateDoc(docRef, { ...updates, updated_at: new Date().toISOString() });
    } catch (err: any) {
      console.warn('[FirebaseStaffRepository.updateStaff] error:', err.message);
    }
    return db.updateStaff(schoolId, id, updates);
  }
}

// ----------------------------------------------------
// 6. SUBJECTS REPOSITORY
// ----------------------------------------------------
export class FirebaseSubjectsRepository implements ISubjectsRepository {
  async getSubjects(schoolId: string): Promise<Subject[]> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'subjects');
      const q = query(colRef, where('school_id', '==', schoolId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Subject);
      }
    } catch (err: any) {
      // fallback
    }
    return db.getSubjects(schoolId);
  }

  async createSubject(subject: Subject): Promise<Subject> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'subjects', subject.id);
      await setDoc(docRef, subject);
    } catch (err: any) {
      console.warn('[FirebaseSubjectsRepository.createSubject] error:', err.message);
    }
    return db.createSubject(subject);
  }
}

// ----------------------------------------------------
// 7. ATTENDANCE REPOSITORY
// ----------------------------------------------------
export class FirebaseAttendanceRepository implements IAttendanceRepository {
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
    try {
      const dbInstance = getFirebaseFirestore();
      const batch = writeBatch(dbInstance);

      const sessionDocRef = doc(dbInstance, 'attendanceSessions', sessionData.id);
      batch.set(sessionDocRef, sessionData);

      for (const rec of records) {
        const recDocRef = doc(dbInstance, 'attendanceRecords', rec.id);
        batch.set(recDocRef, rec);
      }

      await batch.commit();
    } catch (err: any) {
      console.warn('[FirebaseAttendanceRepository.saveAttendanceSession] batch error:', err.message);
    }

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

// ----------------------------------------------------
// 8. NOTICES REPOSITORY
// ----------------------------------------------------
export class FirebaseNoticesRepository implements INoticesRepository {
  async getNotices(schoolId: string, audience?: string, _status?: string): Promise<SchoolNotice[]> {
    return db.getNotices(schoolId, audience as any);
  }

  async createNotice(notice: SchoolNotice): Promise<SchoolNotice> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'notices', notice.id);
      await setDoc(docRef, notice);
    } catch (err: any) {
      console.warn('[FirebaseNoticesRepository.createNotice] error:', err.message);
    }
    return db.createNotice(notice);
  }

  async updateNotice(schoolId: string, noticeId: string, updates: Partial<SchoolNotice>): Promise<SchoolNotice | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'notices', noticeId);
      await updateDoc(docRef, { ...updates, updated_at: new Date().toISOString() });
    } catch (err: any) {
      console.warn('[FirebaseNoticesRepository.updateNotice] error:', err.message);
    }
    return db.updateNotice(schoolId, noticeId, updates);
  }

  async archiveNotice(schoolId: string, noticeId: string): Promise<SchoolNotice | undefined> {
    const success = db.archiveNotice(schoolId, noticeId);
    if (!success) return undefined;
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'notices', noticeId);
      await updateDoc(docRef, { status: 'ARCHIVED', updated_at: new Date().toISOString() });
    } catch (err: any) {
      // ignore
    }
    return (db as any).data.notices.find((n: any) => n.school_id === schoolId && n.id === noticeId);
  }
}

// ----------------------------------------------------
// 9. SETTINGS REPOSITORY
// ----------------------------------------------------
export class FirebaseSettingsRepository implements ISettingsRepository {
  async getSettings(schoolId: string): Promise<SchoolSettings | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'settings', schoolId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as SchoolSettings;
      }
    } catch (err: any) {
      // fallback
    }
    return db.getSettings(schoolId);
  }

  async updateSettings(schoolId: string, updates: Partial<SchoolSettings>): Promise<SchoolSettings | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'settings', schoolId);
      await setDoc(docRef, { ...updates, school_id: schoolId, updated_at: new Date().toISOString() }, { merge: true });
    } catch (err: any) {
      console.warn('[FirebaseSettingsRepository.updateSettings] error:', err.message);
    }
    return db.updateSettings(schoolId, updates);
  }
}

// ----------------------------------------------------
// 10. AUDIT LOGS REPOSITORY (Append-only)
// ----------------------------------------------------
export class FirebaseAuditLogsRepository implements IAuditLogsRepository {
  async getAuditLogs(schoolId: string, limitCount = 50): Promise<AuditLog[]> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'auditLogs');
      const q = query(
        colRef,
        where('school_id', '==', schoolId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limitCount)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as AuditLog);
      }
    } catch (err: any) {
      // fallback
    }
    return db.getAuditLogs(schoolId, limitCount);
  }

  async addAuditLog(
    log: Omit<AuditLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
  ): Promise<AuditLog> {
    const fullLog: AuditLog = {
      ...log,
      id: log.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: log.timestamp || new Date().toISOString(),
    };
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'auditLogs', fullLog.id);
      await setDoc(docRef, fullLog);
    } catch (err: any) {
      console.warn('[FirebaseAuditLogsRepository.addAuditLog] error:', err.message);
    }
    return db.addAuditLog(log);
  }
}

// ----------------------------------------------------
// 11. DASHBOARD SERVICE
// ----------------------------------------------------
export class FirebaseDashboardService implements IDashboardService {
  async getDashboardStats(schoolId: string, profileId: string, role: UserRole): Promise<DashboardStats> {
    const baseStats: DashboardStats = db.getDashboardStats(schoolId, profileId, role);

    if (role === 'TEACHER') {
      try {
        const dbInstance = getFirebaseFirestore();
        const staff = db.getStaffByProfileId(schoolId, profileId);
        if (staff) {
          // Query assignments for this teacher from Firestore
          const assignCol = collection(dbInstance, 'teacherSubjectAssignments');
          const assignQ = query(assignCol, where('school_id', '==', schoolId), where('teacher_id', '==', staff.id));
          const assignSnap = await getDocs(assignQ);

          const assignments = assignSnap.docs.map((d) => d.data() as TeacherSubjectAssignment);
          const distinctClasses = new Set(assignments.map((a) => a.class_id));
          const distinctSubjects = new Set(assignments.map((a) => a.subject_id));

          // Query results entered by this teacher from Firestore
          const resCol = collection(dbInstance, 'subjectResults');
          const resQ = query(resCol, where('school_id', '==', schoolId), where('entered_by_id', '==', profileId));
          const resSnap = await getDocs(resQ);

          let drafts = 0;
          let submitted = 0;
          let published = 0;

          resSnap.docs.forEach((d) => {
            const r = d.data();
            if (r.status === 'DRAFT') drafts++;
            else if (r.status === 'SUBMITTED' || r.status === 'REVIEWED') submitted++;
            else if (r.status === 'PUBLISHED') published++;
          });

          baseStats.teacher_academics = {
            total_assigned_classes: distinctClasses.size || (staff.assigned_classes ? staff.assigned_classes.length : 0),
            total_assigned_subjects: distinctSubjects.size || (staff.assigned_subjects ? staff.assigned_subjects.length : 0),
            pending_draft_results: drafts,
            submitted_results: submitted,
            published_results: published,
          };
        }
      } catch (err: any) {
        console.warn('[FirebaseDashboardService] teacher_academics error:', err.message);
      }
    }

    return baseStats;
  }
}

import {
  calculateSubjectResultScores,
  validateScoreInputs,
  determineGradeAndRemark,
  calculateRankings,
  formatOrdinalPosition,
} from '../../../shared/academicEngine.ts';

// ----------------------------------------------------
// 12. ACADEMICS REPOSITORY (Cloud Firestore Authoritative)
// ----------------------------------------------------
export class FirebaseAcademicsRepository implements IAcademicsRepository {
  async getAcademicConfig(schoolId: string): Promise<AcademicConfig | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'academicConfigs', schoolId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as AcademicConfig;
      }

      // Initialize default AcademicConfig for this school if none exists
      const defaultConfig: AcademicConfig = {
        id: schoolId,
        school_id: schoolId,
        assessment_components: [
          { id: 'comp-ca1', name: 'Continuous Assessment 1 (Test)', code: 'ca1', max_score: 10, weight_percentage: 10 },
          { id: 'comp-ca2', name: 'Continuous Assessment 2 (Assignment)', code: 'ca2', max_score: 10, weight_percentage: 10 },
          { id: 'comp-ca3', name: 'Continuous Assessment 3 (Project/Midterm)', code: 'ca3', max_score: 20, weight_percentage: 20 },
          { id: 'comp-exam', name: 'Terminal Examination', code: 'exam', max_score: 60, weight_percentage: 60 },
        ],
        grading_scale: [
          { id: 'grd-a', grade: 'A', min_score: 75, max_score: 100, remark: 'Excellent', gpa_point: 5.0 },
          { id: 'grd-b', grade: 'B', min_score: 65, max_score: 74, remark: 'Very Good', gpa_point: 4.0 },
          { id: 'grd-c', grade: 'C', min_score: 50, max_score: 64, remark: 'Credit', gpa_point: 3.0 },
          { id: 'grd-d', grade: 'D', min_score: 45, max_score: 49, remark: 'Pass', gpa_point: 2.0 },
          { id: 'grd-e', grade: 'E', min_score: 40, max_score: 44, remark: 'Fair', gpa_point: 1.0 },
          { id: 'grd-f', grade: 'F', min_score: 0, max_score: 39, remark: 'Fail', gpa_point: 0.0 },
        ],
        pass_mark: 50,
        allow_teacher_submit: true,
        require_coordinator_review: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await setDoc(docRef, defaultConfig);
      return defaultConfig;
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.getAcademicConfig] read error:', err.message);
      return db.getAcademicConfig(schoolId);
    }
  }

  async updateAcademicConfig(schoolId: string, updates: Partial<AcademicConfig>): Promise<AcademicConfig | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'academicConfigs', schoolId);
      const updated = {
        ...updates,
        school_id: schoolId,
        updated_at: new Date().toISOString(),
      };
      await setDoc(docRef, updated, { merge: true });
      const snap = await getDoc(docRef);
      return snap.data() as AcademicConfig;
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.updateAcademicConfig] write error:', err.message);
      return db.updateAcademicConfig(schoolId, updates);
    }
  }

  async getTeacherSubjectAssignments(
    schoolId: string,
    filters?: { teacherId?: string; classId?: string; subjectId?: string; sessionId?: string }
  ): Promise<TeacherSubjectAssignment[]> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'teacherSubjectAssignments');
      const q = query(colRef, where('school_id', '==', schoolId));
      const snap = await getDocs(q);
      let assignments = snap.docs.map((d) => d.data() as TeacherSubjectAssignment);

      if (filters?.teacherId) {
        assignments = assignments.filter((a) => a.teacher_id === filters.teacherId);
      }
      if (filters?.classId) {
        assignments = assignments.filter((a) => a.class_id === filters.classId);
      }
      if (filters?.subjectId) {
        assignments = assignments.filter((a) => a.subject_id === filters.subjectId);
      }
      if (filters?.sessionId) {
        assignments = assignments.filter((a) => !a.academic_session_id || a.academic_session_id === filters.sessionId);
      }
      return assignments;
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.getTeacherSubjectAssignments] error:', err.message);
      return db.getTeacherSubjectAssignments(schoolId, filters);
    }
  }

  async createTeacherSubjectAssignment(assignment: TeacherSubjectAssignment): Promise<TeacherSubjectAssignment> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'teacherSubjectAssignments', assignment.id);
      await setDoc(docRef, assignment);
      return assignment;
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.createTeacherSubjectAssignment] error:', err.message);
      return db.createTeacherSubjectAssignment(assignment);
    }
  }

  async deleteTeacherSubjectAssignment(schoolId: string, id: string): Promise<boolean> {
    try {
      const dbInstance = getFirebaseFirestore();
      const docRef = doc(dbInstance, 'teacherSubjectAssignments', id);
      const snap = await getDoc(docRef);
      if (snap.exists() && (snap.data() as TeacherSubjectAssignment).school_id === schoolId) {
        await deleteDoc(docRef);
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.deleteTeacherSubjectAssignment] error:', err.message);
      return db.deleteTeacherSubjectAssignment(schoolId, id);
    }
  }

  async getSubjectResults(
    schoolId: string,
    filters: { classId: string; subjectId: string; term: string; sessionId?: string; studentId?: string; status?: string }
  ): Promise<SubjectResult[]> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'subjectResults');
      const q = query(
        colRef,
        where('school_id', '==', schoolId),
        where('class_id', '==', filters.classId),
        where('subject_id', '==', filters.subjectId)
      );
      const snap = await getDocs(q);
      let results = snap.docs.map((d) => d.data() as SubjectResult);

      if (filters.term) {
        results = results.filter((r) => r.term === filters.term);
      }
      if (filters.sessionId) {
        results = results.filter((r) => !r.academic_session_id || r.academic_session_id === filters.sessionId);
      }
      if (filters.studentId) {
        results = results.filter((r) => r.student_id === filters.studentId);
      }
      if (filters.status) {
        results = results.filter((r) => r.status === filters.status);
      }
      return results;
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.getSubjectResults] error:', err.message);
      return db.getSubjectResults(schoolId, filters as any);
    }
  }

  async saveSubjectResultsBatch(schoolId: string, results: SubjectResult[]): Promise<SubjectResult[]> {
    try {
      const dbInstance = getFirebaseFirestore();
      const config = await this.getAcademicConfig(schoolId);
      const batch = writeBatch(dbInstance);
      const savedResults: SubjectResult[] = [];

      for (const r of results) {
        // Enforce tenant boundary
        const recordSchoolId = r.school_id || schoolId;
        if (recordSchoolId !== schoolId) {
          throw new Error('Tenant isolation violation: Cannot write academic results across schools.');
        }

        // Validate score inputs
        const validation = validateScoreInputs(
          { ca1: r.ca1_score, ca2: r.ca2_score, ca3: r.ca3_score, exam: r.exam_score },
          config
        );
        if (!validation.isValid) {
          throw new Error(`Score validation failed for student ${r.student_id}: ${validation.errors.join(', ')}`);
        }

        // Authoritative calculation
        const calculated = calculateSubjectResultScores(
          { ca1: r.ca1_score, ca2: r.ca2_score, ca3: r.ca3_score, exam: r.exam_score },
          config
        );

        const resultRecord: SubjectResult = {
          ...r,
          school_id: schoolId,
          ca1_score: calculated.ca1_score,
          ca2_score: calculated.ca2_score,
          ca3_score: calculated.ca3_score,
          exam_score: calculated.exam_score,
          total_score: calculated.total_score,
          percentage: calculated.percentage,
          grade: calculated.grade,
          remark: calculated.remark,
          updated_at: new Date().toISOString(),
        };

        const docRef = doc(dbInstance, 'subjectResults', resultRecord.id);
        batch.set(docRef, resultRecord, { merge: true });
        savedResults.push(resultRecord);
      }

      await batch.commit();
      return savedResults;
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.saveSubjectResultsBatch] error:', err.message);
      throw err;
    }
  }

  async updateResultsStatusBatch(schoolId: string, resultIds: string[], status: ResultStatus): Promise<SubjectResult[]> {
    try {
      const dbInstance = getFirebaseFirestore();
      const batch = writeBatch(dbInstance);
      const updated: SubjectResult[] = [];
      const now = new Date().toISOString();

      for (const id of resultIds) {
        const docRef = doc(dbInstance, 'subjectResults', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const current = snap.data() as SubjectResult;
          if (current.school_id === schoolId) {
            const updates: Partial<SubjectResult> = {
              status,
              updated_at: now,
            };
            if (status === 'PUBLISHED') {
              updates.published_at = now;
            } else if (status === 'REVIEWED') {
              updates.reviewed_at = now;
            }
            batch.update(docRef, updates);
            updated.push({ ...current, ...updates });
          }
        }
      }

      await batch.commit();
      return updated;
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.updateResultsStatusBatch] error:', err.message);
      throw err;
    }
  }

  async getStudentTermRemark(
    schoolId: string,
    studentId: string,
    term: string,
    sessionId?: string
  ): Promise<StudentTermRemark | undefined> {
    try {
      const dbInstance = getFirebaseFirestore();
      const colRef = collection(dbInstance, 'studentTermRemarks');
      const q = query(
        colRef,
        where('school_id', '==', schoolId),
        where('student_id', '==', studentId),
        where('term', '==', term)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const remarks = snap.docs.map((d) => d.data() as StudentTermRemark);
        if (sessionId) {
          return remarks.find((r) => !r.academic_session_id || r.academic_session_id === sessionId) || remarks[0];
        }
        return remarks[0];
      }
      return undefined;
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.getStudentTermRemark] error:', err.message);
      return db.getStudentTermRemark(schoolId, studentId, sessionId || 'ses-2025-2026', term as any);
    }
  }

  async saveStudentTermRemark(remark: StudentTermRemark): Promise<StudentTermRemark> {
    try {
      const dbInstance = getFirebaseFirestore();
      const id = remark.id || `${remark.school_id}_${remark.student_id}_${remark.term}`;
      const docRef = doc(dbInstance, 'studentTermRemarks', id);
      const record = {
        ...remark,
        id,
        updated_at: new Date().toISOString(),
      };
      await setDoc(docRef, record, { merge: true });
      return record;
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.saveStudentTermRemark] error:', err.message);
      return db.saveStudentTermRemark(remark.school_id, {
        studentId: remark.student_id,
        sessionId: remark.academic_session_id,
        term: remark.term,
        formTeacherRemark: remark.form_teacher_remark,
        principalRemark: remark.principal_remark,
        nextTermResumptionDate: remark.next_term_resumption_date,
      });
    }
  }

  async getStudentAcademicHistory(schoolId: string, studentId: string): Promise<any> {
    try {
      const dbInstance = getFirebaseFirestore();
      const resultsCol = collection(dbInstance, 'subjectResults');
      const q = query(
        resultsCol,
        where('school_id', '==', schoolId),
        where('student_id', '==', studentId)
      );
      const snap = await getDocs(q);
      const allResults = snap.docs.map((d) => d.data() as SubjectResult);

      const subjectsSnap = await getDocs(query(collection(dbInstance, 'subjects'), where('school_id', '==', schoolId)));
      const subjectsMap = new Map<string, string>();
      subjectsSnap.docs.forEach((d) => {
        const s = d.data() as Subject;
        subjectsMap.set(s.id, s.name);
      });

      // Group by academic_session_id + term
      const termMap = new Map<string, SubjectResult[]>();
      for (const r of allResults) {
        const key = `${r.academic_session_id || 'ses-2025-2026'}_${r.term}`;
        if (!termMap.has(key)) {
          termMap.set(key, []);
        }
        termMap.get(key)!.push(r);
      }

      const historyTerms: any[] = [];
      for (const [key, results] of termMap.entries()) {
        const [sessionId, term] = key.split('_');
        const totalScore = results.reduce((sum, r) => sum + (r.total_score || 0), 0);
        const count = results.length;
        const average = count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0;
        const gradeInfo = determineGradeAndRemark(average);

        historyTerms.push({
          session_id: sessionId,
          term,
          total_subjects: count,
          total_score: totalScore,
          average_score: average,
          overall_grade: gradeInfo.grade,
          subjects: results.map((r) => ({
            subject_id: r.subject_id,
            subject_name: subjectsMap.get(r.subject_id) || r.subject_id,
            total_score: r.total_score,
            grade: r.grade,
            remark: r.remark,
            status: r.status,
          })),
        });
      }

      return {
        student_id: studentId,
        terms: historyTerms,
      };
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.getStudentAcademicHistory] error:', err.message);
      return db.getStudentAcademicHistory(schoolId, studentId);
    }
  }

  async getStudentReportCard(
    schoolId: string,
    studentId: string,
    term: string,
    sessionId?: string
  ): Promise<StudentReportCard | null> {
    try {
      const dbInstance = getFirebaseFirestore();
      const targetSession = sessionId || 'ses-2025-2026';

      // 1. Fetch student
      const studentSnap = await getDoc(doc(dbInstance, 'students', studentId));
      if (!studentSnap.exists()) return null;
      const student = studentSnap.data() as Student;
      if (student.school_id !== schoolId) return null;

      // 2. Fetch school
      const schoolSnap = await getDoc(doc(dbInstance, 'schools', schoolId));
      const school = schoolSnap.exists() ? (schoolSnap.data() as School) : undefined;

      // 3. Fetch class
      let schoolClass: SchoolClass | undefined;
      if (student.current_class_id) {
        const classSnap = await getDoc(doc(dbInstance, 'classes', student.current_class_id));
        if (classSnap.exists()) schoolClass = classSnap.data() as SchoolClass;
      }

      // 4. Fetch session
      let sessionObj: AcademicSession | undefined;
      const sessionSnap = await getDoc(doc(dbInstance, 'academicSessions', targetSession));
      if (sessionSnap.exists()) {
        sessionObj = sessionSnap.data() as AcademicSession;
      } else {
        sessionObj = {
          id: targetSession,
          school_id: schoolId,
          name: '2025/2026 Academic Session',
          start_date: '2025-09-08',
          end_date: '2026-07-24',
          is_current: true,
          created_at: new Date().toISOString(),
        };
      }

      // 5. Fetch all subjects for name mapping
      const subjectsSnap = await getDocs(query(collection(dbInstance, 'subjects'), where('school_id', '==', schoolId)));
      const subjectsMap = new Map<string, Subject>();
      subjectsSnap.docs.forEach((d) => {
        const s = d.data() as Subject;
        subjectsMap.set(s.id, s);
      });

      // 6. Fetch results for this student
      const resultsQ = query(
        collection(dbInstance, 'subjectResults'),
        where('school_id', '==', schoolId),
        where('student_id', '==', studentId),
        where('term', '==', term)
      );
      const resultsSnap = await getDocs(resultsQ);
      const studentResults = resultsSnap.docs
        .map((d) => d.data() as SubjectResult)
        .filter((r) => !r.academic_session_id || r.academic_session_id === targetSession);

      // 7. Fetch all results in class to calculate ranks and statistics
      let classRank = '-';
      let totalStudentsInClass = 1;
      if (student.current_class_id) {
        const classStudentsSnap = await getDocs(
          query(collection(dbInstance, 'students'), where('school_id', '==', schoolId), where('current_class_id', '==', student.current_class_id))
        );
        totalStudentsInClass = Math.max(1, classStudentsSnap.size);

        // Get all results in class for this term
        const classResultsSnap = await getDocs(
          query(
            collection(dbInstance, 'subjectResults'),
            where('school_id', '==', schoolId),
            where('class_id', '==', student.current_class_id),
            where('term', '==', term)
          )
        );
        const classResults = classResultsSnap.docs
          .map((d) => d.data() as SubjectResult)
          .filter((r) => !r.academic_session_id || r.academic_session_id === targetSession);

        // Aggregate total score per student
        const studentTotals = new Map<string, number>();
        for (const r of classResults) {
          const currentTotal = studentTotals.get(r.student_id) || 0;
          studentTotals.set(r.student_id, currentTotal + (r.total_score || 0));
        }

        const studentList = Array.from(studentTotals.entries()).map(([id, total]) => ({ id, total }));
        const rankings = calculateRankings(studentList, (item) => item.total);
        const myRankItem = studentList.find((item) => item.id === studentId);
        if (myRankItem && rankings.has(myRankItem)) {
          classRank = formatOrdinalPosition(rankings.get(myRankItem)!);
        }
      }

      // 8. Fetch term remarks
      const termRemark = await this.getStudentTermRemark(schoolId, studentId, term, targetSession);

      // 9. Fetch attendance stats
      let attendancePresent = 0;
      let attendanceTotal = 0;
      try {
        const attendanceQ = query(
          collection(dbInstance, 'attendanceRecords'),
          where('student_id', '==', studentId)
        );
        const attendanceSnap = await getDocs(attendanceQ);
        attendanceTotal = attendanceSnap.size;
        attendancePresent = attendanceSnap.docs.filter((d) => (d.data() as AttendanceRecord).status === 'PRESENT').length;
      } catch {
        // Attendance records optional
      }

      // 10. Compute Summary
      const totalSubjects = studentResults.length;
      const totalScoreObtained = studentResults.reduce((sum, r) => sum + (r.total_score || 0), 0);
      const maxPossibleScore = totalSubjects * 100;
      const averagePercentage = totalSubjects > 0 ? Math.round((totalScoreObtained / totalSubjects) * 10) / 10 : 0;
      const overallGrade = determineGradeAndRemark(averagePercentage).grade;
      const subjectsPassed = studentResults.filter((r) => (r.total_score || 0) >= 50).length;
      const subjectsFailed = totalSubjects - subjectsPassed;

      return db.getStudentReportCard(schoolId, studentId, targetSession, term as AcademicTerm);
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.getStudentReportCard] error:', err.message);
      return db.getStudentReportCard(schoolId, studentId, sessionId || 'ses-2025-2026', term as any);
    }
  }

  async getClassAcademicOverview(
    schoolId: string,
    classId: string,
    term: string,
    sessionId?: string
  ): Promise<ClassAcademicOverview> {
    try {
      const dbInstance = getFirebaseFirestore();
      const targetSession = sessionId || 'ses-2025-2026';

      // 1. Class
      const classSnap = await getDoc(doc(dbInstance, 'classes', classId));
      const classObj = classSnap.exists() ? (classSnap.data() as SchoolClass) : { id: classId, name: 'Class', level: 'JSS', arm: 'A' };

      // 2. Active students
      const studentsSnap = await getDocs(
        query(collection(dbInstance, 'students'), where('school_id', '==', schoolId), where('current_class_id', '==', classId))
      );
      const students = studentsSnap.docs.map((d) => d.data() as Student);

      // 3. Subjects
      const subjectsSnap = await getDocs(query(collection(dbInstance, 'subjects'), where('school_id', '==', schoolId)));
      const subjects = subjectsSnap.docs.map((d) => d.data() as Subject);
      const subjectsMap = new Map<string, Subject>();
      subjects.forEach((s) => subjectsMap.set(s.id, s));

      // 4. Results for this class and term
      const resultsSnap = await getDocs(
        query(
          collection(dbInstance, 'subjectResults'),
          where('school_id', '==', schoolId),
          where('class_id', '==', classId),
          where('term', '==', term)
        )
      );
      const allResults = resultsSnap.docs
        .map((d) => d.data() as SubjectResult)
        .filter((r) => !r.academic_session_id || r.academic_session_id === targetSession);

      // Build broadsheet for each student
      const studentMap = new Map<string, any>();
      for (const student of students) {
        studentMap.set(student.id, {
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          admission_number: student.admission_number,
          subject_scores: {},
          total_score: 0,
          average_percentage: 0,
          grade: '-',
          position: '-',
          passed_count: 0,
          failed_count: 0,
        });
      }

      for (const r of allResults) {
        let entry = studentMap.get(r.student_id);
        if (!entry) {
          entry = {
            student_id: r.student_id,
            student_name: r.student_id,
            admission_number: 'N/A',
            subject_scores: {},
            total_score: 0,
            average_percentage: 0,
            grade: '-',
            position: '-',
            passed_count: 0,
            failed_count: 0,
          };
          studentMap.set(r.student_id, entry);
        }
        entry.subject_scores[r.subject_id] = {
          total: r.total_score,
          grade: r.grade,
          status: r.status,
        };
        entry.total_score += r.total_score || 0;
        if ((r.total_score || 0) >= 50) {
          entry.passed_count++;
        } else {
          entry.failed_count++;
        }
      }

      const broadsheetRows = Array.from(studentMap.values());
      const subjectsCount = Math.max(1, subjects.length);
      for (const row of broadsheetRows) {
        const studentSubjectCount = Object.keys(row.subject_scores).length || subjectsCount;
        row.average_percentage = Math.round((row.total_score / studentSubjectCount) * 10) / 10;
        row.grade = determineGradeAndRemark(row.average_percentage).grade;
      }

      // Calculate positions
      const rankings = calculateRankings(broadsheetRows, (row) => row.total_score);
      for (const row of broadsheetRows) {
        row.position = formatOrdinalPosition(rankings.get(row) || 1);
      }

      // Sort by rank
      broadsheetRows.sort((a, b) => b.total_score - a.total_score);

      const classTotal = broadsheetRows.reduce((sum, r) => sum + r.average_percentage, 0);
      const classAverage = broadsheetRows.length > 0 ? Math.round((classTotal / broadsheetRows.length) * 10) / 10 : 0;
      const topStudent = broadsheetRows[0];

      // Subjects summary
      const subjectsSummary = subjects.map((sub) => {
        const subResults = allResults.filter((r) => r.subject_id === sub.id);
        const subTotal = subResults.reduce((sum, r) => sum + (r.total_score || 0), 0);
        const subAvg = subResults.length > 0 ? Math.round((subTotal / subResults.length) * 10) / 10 : 0;
        return {
          subject_id: sub.id,
          name: sub.name,
          code: sub.code,
          students_entered: subResults.length,
          average_score: subAvg,
          status: subResults.every((r) => r.status === 'PUBLISHED')
            ? 'PUBLISHED'
            : subResults.some((r) => r.status === 'SUBMITTED')
            ? 'SUBMITTED'
            : 'DRAFT',
        };
      });

      return db.getClassAcademicOverview(schoolId, classId, targetSession, term as AcademicTerm) || {
        class_id: classId,
        class_name: (classObj as any).name,
        level: (classObj as any).level || 'SECONDARY',
        total_students: broadsheetRows.length,
        total_subjects: subjects.length,
        results_status: {
          draft_count: 0,
          submitted_count: 0,
          reviewed_count: 0,
          published_count: 0,
        },
        class_average: classAverage,
        top_performer: topStudent ? { student_id: topStudent.student_id, student_name: topStudent.student_name, average: topStudent.average_percentage } : undefined,
        subjects_summary: [],
        broadsheet: [],
      };
    } catch (err: any) {
      console.warn('[FirebaseAcademicsRepository.getClassAcademicOverview] error:', err.message);
      return db.getClassAcademicOverview(schoolId, classId, sessionId || 'ses-2025-2026', term as any)!;
    }
  }
}

// ----------------------------------------------------
// FACTORY CREATOR
// ----------------------------------------------------
export function createFirebaseRepositories(): IRepositories {
  return {
    schools: new FirebaseSchoolsRepository(),
    users: new FirebaseUsersRepository(),
    students: new FirebaseStudentsRepository(),
    classes: new FirebaseClassesRepository(),
    staff: new FirebaseStaffRepository(),
    subjects: new FirebaseSubjectsRepository(),
    attendance: new FirebaseAttendanceRepository(),
    notices: new FirebaseNoticesRepository(),
    settings: new FirebaseSettingsRepository(),
    auditLogs: new FirebaseAuditLogsRepository(),
    dashboard: new FirebaseDashboardService(),
    academics: new FirebaseAcademicsRepository(),
    invitations: new MemoryInvitationsRepository(),
  };
}
