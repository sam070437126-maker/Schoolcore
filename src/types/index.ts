export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'SCHOOL_ADMIN' 
  | 'PRINCIPAL' 
  | 'TEACHER' 
  | 'BURSAR' 
  | 'ACADEMIC_COORDINATOR'
  | 'REGISTRAR'
  | 'PARENT';

export type Role = UserRole;
export type AcademicTerm = 'FIRST_TERM' | 'SECOND_TERM' | 'THIRD_TERM';
export type AttendanceSessionType = 'MORNING' | 'AFTERNOON' | 'MORNING_ROLL_CALL' | 'AFTERNOON_ROLL_CALL';

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'SUSPENDED';
export type ClassStatus = 'ACTIVE' | 'ARCHIVED';
export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';
export type NoticeAudience = 'EVERYONE' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | 'CLASS';
export type NoticePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type NoticeStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
export type Gender = 'MALE' | 'FEMALE';
export type ResultStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'PUBLISHED';

export interface School {
  id: string;
  name: string;
  code: string;
  motto?: string;
  logo_url?: string;
  phone: string;
  email?: string;
  address: string;
  state: string;
  country: string;
  website?: string;
  lga?: string;
  latitude?: number;
  longitude?: number;
  google_place_id?: string;
  google_maps_uri?: string;
  location_source?: 'google_places' | 'manual' | string;
  last_verified_at?: string;
  current_session_id?: string;
  current_term: 'FIRST_TERM' | 'SECOND_TERM' | 'THIRD_TERM';
  status?: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export interface DiscoveredSchoolPlace {
  google_place_id: string;
  name: string;
  formatted_address: string;
  phone?: string;
  website?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  google_maps_uri?: string;
  business_status?: string;
  state?: string;
  lga?: string;
  already_registered?: boolean;
  is_already_registered?: boolean;
  existing_school_name?: string;
  registered_school_name?: string;
  existing_school_code?: string;
}

export interface SchoolVerificationDifference {
  field: string;
  label: string;
  currentVal?: string;
  googleVal?: string;
  current_value?: string;
  google_value?: string;
  is_different?: boolean;
}

export interface AcademicSession {
  id: string;
  school_id: string;
  name: string; // e.g. "2025/2026"
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  password_hash?: string;
  created_at: string;
}

export type SchoolUserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_ACTIVATION';

export interface SchoolUser {
  id: string;
  school_id: string;
  profile_id: string;
  role: UserRole;
  status: SchoolUserStatus;
  created_at: string;
  profile?: UserProfile;
  school?: School;
  otp_code?: string;
  otp_expires_at?: string;
  first_login_at?: string;
  linked_student_ids?: string[];
  password_set?: boolean;
  admin_activation_code?: string;
  code_sent_to_admin_at?: string;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  name: string; // e.g. "JSS 2A"
  level: string; // e.g. "JSS 2"
  arm: string; // e.g. "A"
  class_teacher_id?: string; // staff_id
  class_teacher_name?: string;
  academic_session_id?: string;
  capacity?: number;
  student_count?: number;
  status: ClassStatus;
  subjects?: string[];
  created_at: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code: string;
  category?: 'CORE' | 'ELECTIVE' | 'VOCATIONAL';
  created_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  admission_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: Gender;
  date_of_birth: string;
  current_class_id?: string;
  current_class_name?: string;
  house?: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  guardian_relationship?: string;
  address: string;
  admission_date: string;
  status: StudentStatus;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassStudent {
  id: string;
  school_id: string;
  class_id: string;
  student_id: string;
  academic_session_id: string;
  joined_at: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'PROMOTED';
}

export interface StaffMember {
  id: string;
  school_id: string;
  profile_id?: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  qualification?: string;
  specialization?: string;
  assigned_classes?: string[]; // class_ids
  assigned_subjects?: string[]; // subject names or ids
  status: StaffStatus;
  created_at: string;
}

export interface AttendanceSession {
  id: string;
  school_id: string;
  class_id: string;
  class_name?: string;
  date: string; // YYYY-MM-DD
  session_type: 'MORNING' | 'AFTERNOON';
  marked_by_id: string;
  marked_by_name?: string;
  status: 'SUBMITTED' | 'DRAFT';
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name?: string;
  admission_number?: string;
  school_id: string;
  status: AttendanceStatus;
  remarks?: string;
  remark?: string;
  created_at: string;
}

export interface AttendanceJournalEntry {
  id: string;
  school_id: string;
  session_id: string;
  class_id: string;
  class_name: string;
  date: string;
  session_type: 'MORNING' | 'AFTERNOON';
  marked_by_id: string;
  marked_by_name: string;
  present_count: number;
  absent_count: number;
  late_count: number;
  total_students: number;
  attendance_rate: number;
  snapshot_records: {
    student_id: string;
    student_name: string;
    status: AttendanceStatus;
  }[];
  cryptographic_hash: string;
  created_at: string;
}

export interface AdminInvitation {
  id: string;
  school_id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  status: 'PENDING' | 'INVITED' | 'JOINED' | 'EXPIRED';
  invited_by_id: string;
  invited_by_name?: string;
  invitation_token: string;
  invite_link?: string;
  expires_at: string;
  created_at: string;
  joined_at?: string;
}

export interface SchoolNotice {
  id: string;
  school_id: string;
  author_id: string;
  author_name?: string;
  author_role?: string;
  title: string;
  message: string;
  audience: NoticeAudience;
  target_class_id?: string;
  target_class_name?: string;
  priority: NoticePriority;
  published_at: string;
  expires_at?: string;
  status: NoticeStatus;
  created_at: string;
}

export interface SchoolSettings {
  id: string;
  school_id: string;
  attendance_grace_period_mins: number;
  low_bandwidth_mode: boolean;
  school_motto?: string;
  academic_year: string;
  academic_year_label?: string;
  grading_system?: string;
  auto_generate_admission_numbers?: boolean;
  default_student_status?: string;
  current_term: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  school_id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity: string;
  entity_id?: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  total_students: number;
  total_staff: number;
  total_classes: number;
  attendance_percentage?: number;
  attendance_today: {
    marked_classes: number;
    total_classes: number;
    present: number;
    absent: number;
    late: number;
    rate_percentage: number;
  };
  recent_activity: AuditLog[];
  important_notices: SchoolNotice[];
  teacher_today_classes?: Array<{
    class_id: string;
    class_name: string;
    level: string;
    subject: string;
    time: string;
    student_count: number;
    attendance_marked_today: boolean;
  }>;
  teacher_academics?: {
    total_assigned_classes: number;
    total_assigned_subjects: number;
    pending_draft_results: number;
    submitted_results: number;
    published_results: number;
  };
}

export interface CurrentAuthContext {
  user: UserProfile;
  school: School;
  membership: SchoolUser;
  staff?: StaffMember;
  allMemberships?: SchoolUser[];
}

// ==========================================
// PHASE 2: ACADEMIC ENGINE TYPES
// ==========================================

export interface AssessmentComponent {
  id: string;
  name: string; // e.g. "CA 1 (Test 1)", "CA 2 (Assignment)", "CA 3 (Project)", "Examination"
  code: 'ca1' | 'ca2' | 'ca3' | 'exam';
  max_score: number; // e.g. 10, 10, 20, 60
  weight_percentage: number;
}

export interface GradingScaleItem {
  id: string;
  grade: string; // "A", "B", "C", "D", "E", "F"
  min_score: number;
  max_score: number;
  remark: string; // "Excellent", "Very Good", "Good", "Fair", "Pass", "Fail"
  gpa_point?: number;
}

export interface AcademicConfig {
  id: string;
  school_id: string;
  assessment_components: AssessmentComponent[];
  grading_scale: GradingScaleItem[];
  pass_mark: number; // e.g. 50
  ca1_max?: number;
  ca2_max?: number;
  ca3_max?: number;
  exam_max?: number;
  remark_templates?: any;
  allow_teacher_submit: boolean;
  require_coordinator_review: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherSubjectAssignment {
  id: string;
  school_id: string;
  teacher_id: string; // staff_id
  teacher_name?: string;
  class_id: string;
  class_name?: string;
  subject_id: string;
  subject_name?: string;
  academic_session_id: string;
  created_at: string;
}

export interface SubjectResult {
  id: string;
  school_id: string;
  academic_session_id: string;
  academic_session_name?: string;
  term: AcademicTerm;
  class_id: string;
  class_name?: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  student_id: string;
  student_name?: string;
  admission_number?: string;
  teacher_id: string;
  teacher_name?: string;
  entered_by_id?: string;
  entered_by_name?: string;
  ca1_score: number | null; // e.g., /10
  ca2_score: number | null; // e.g., /10
  ca3_score: number | null; // e.g., /20
  exam_score: number | null; // e.g., /60
  total_score: number | null; // 0 - 100
  percentage: number | null;
  grade: string | null; // "A", "B", "C", "D", "E", "F"
  remark: string | null; // "Excellent", etc.
  teacher_subject_remark?: string | null;
  status: ResultStatus; // DRAFT | SUBMITTED | REVIEWED | PUBLISHED
  submitted_at?: string;
  reviewed_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentTermRemark {
  id: string;
  school_id: string;
  student_id: string;
  academic_session_id: string;
  term: AcademicTerm;
  form_teacher_remark?: string;
  form_teacher_id?: string;
  principal_remark?: string;
  principal_id?: string;
  next_term_fees?: number;
  next_term_resumption_date?: string;
  created_at?: string;
  updated_at: string;
}

export interface StudentReportCard {
  student: Student;
  school: School;
  academic_session: AcademicSession;
  term: AcademicTerm;
  class: SchoolClass;
  subject_results: SubjectResult[];
  summary: {
    total_subjects_offered: number;
    total_score_obtained: number;
    max_possible_score: number;
    average_percentage: number;
    overall_grade: string;
    class_rank?: number;
    class_size: number;
    passed_subjects: number;
    failed_subjects: number;
  };
  attendance: {
    total_sessions: number;
    present_sessions: number;
    absent_sessions: number;
    late_sessions: number;
    attendance_rate: number;
  };
  remarks: {
    form_teacher_name?: string;
    form_teacher_remark?: string;
    principal_name?: string;
    principal_remark?: string;
    next_term_begins?: string;
  };
  is_published: boolean;
  generated_at: string;
}

export interface ClassAcademicOverview {
  class_id: string;
  class_name: string;
  level: string;
  total_students: number;
  total_subjects: number;
  results_status: {
    draft_count: number;
    submitted_count: number;
    reviewed_count: number;
    published_count: number;
  };
  class_average?: number;
  top_performer?: {
    student_id: string;
    student_name: string;
    average: number;
  };
  subjects_summary: Array<{
    subject_id: string;
    subject_name: string;
    teacher_name?: string;
    assigned_teacher_id?: string;
    entered_count: number;
    total_count: number;
    average_score: number;
    status: ResultStatus;
  }>;
  subjects?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  broadsheet?: Array<{
    student_id: string;
    student_name: string;
    admission_number: string;
    scores: Record<string, { total: number; grade: string; remark?: string }>;
    total_score: number;
    average_percentage: number;
    grade: string;
    rank: number;
  }>;
}

// ==========================================
// DIGITAL TRANSFORMATION PLAN TYPES (PDF SPEC)
// ==========================================

export interface HomeworkSubmission {
  student_id: string;
  student_name: string;
  status: 'SUBMITTED' | 'OVERDUE' | 'GRADED' | 'PENDING';
  submitted_at?: string;
  score?: number;
  max_score?: number;
  feedback?: string;
  attachment_url?: string;
}

export interface HomeworkAssignment {
  id: string;
  school_id: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  instructions: string;
  attachments?: Array<{ name: string; type: string; url?: string }>;
  due_date: string;
  total_marks: number;
  status: 'ACTIVE' | 'ARCHIVED';
  submissions: HomeworkSubmission[];
  created_at: string;
}

export interface DirectMessage {
  id: string;
  school_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  recipient_id: string;
  recipient_name: string;
  recipient_role: string;
  class_id?: string;
  class_name?: string;
  subject?: string;
  message: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  created_at: string;
  read_at?: string;
}

export interface FeeItem {
  name: string;
  amount: number;
  category: 'TUITION' | 'BOOKS' | 'UNIFORM' | 'BUS' | 'LAB' | 'OTHER';
  is_paid: boolean;
}

export interface StudentFeeAccount {
  id: string;
  school_id: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  class_id: string;
  class_name: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  academic_session: string;
  term: AcademicTerm;
  items: FeeItem[];
  total_billed: number;
  total_paid: number;
  balance: number;
  payment_status: 'PAID' | 'PARTIAL' | 'OVERDUE' | 'UNPAID';
  last_reminder_sent?: string;
  created_at: string;
  updated_at: string;
}

export interface FeePayment {
  id: string;
  receipt_number: string;
  school_id: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  class_name: string;
  fee_account_id: string;
  amount: number;
  payment_method: 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
  reference: string;
  payer_name: string;
  payer_phone: string;
  payer_email?: string;
  description: string;
  payment_date: string;
  status: 'VERIFIED' | 'PENDING';
  verified_by?: string;
  created_at: string;
}

export interface DigitalApproval {
  id: string;
  school_id: string;
  type: 'SICK_NOTE' | 'LEAVE_REQUEST' | 'FIELD_TRIP_PERMISSION' | 'POLICY_ACKNOWLEDGMENT';
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  parent_id: string;
  parent_name: string;
  parent_phone: string;
  title: string;
  details: string;
  dates?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SIGNED';
  signed_at?: string;
  signature_name?: string;
  teacher_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaperlessKPIs {
  administrative_time_saved_pct: number; // Target 90%
  paper_reduction_pct: number; // Target 75%
  fee_collection_velocity_pct: number; // Target 30%
  parent_engagement_rate_pct: number; // Target >85%
  reams_paper_saved: number;
  cost_saved_naira: number;
  active_parent_users: number;
  total_parent_users: number;
  attendance_minutes_saved_daily: number;
}

// ----------------------------------------------------
// Granular Notification & Relational Linking System
// ----------------------------------------------------

export type GuardianType = 'PRIMARY' | 'SECONDARY';

export interface ParentStudent {
  id: string;
  school_id: string;
  parent_profile_id: string;
  student_id: string;
  guardian_type: GuardianType;
  family_group_id: string;
  relationship?: string; // e.g., 'Father', 'Mother', 'Legal Guardian'
  is_emergency_contact?: boolean;
  created_at: string;
  updated_at?: string;
  // Optional enriched fields
  student?: Student;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
}

export type NotificationCategory = 'ACADEMIC' | 'ATTENDANCE' | 'ANNOUNCEMENT' | 'FEE' | 'EMERGENCY';

export interface UserNotification {
  id: string;
  school_id: string;
  user_id?: string;
  family_group_id?: string;
  child_id?: string;
  child_name?: string;
  title: string;
  content: string;
  category: NotificationCategory;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  source_notice_id?: string;
  read_at?: string | null;
  created_at: string;
}

export interface FamilyGroupSummary {
  family_group_id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  guardians: Array<{
    profile_id: string;
    name: string;
    email: string;
    phone: string;
    guardian_type: GuardianType;
    relationship: string;
    is_current_user: boolean;
  }>;
  pending_invites?: Array<{
    id: string;
    invite_code: string;
    invited_email?: string;
    created_at: string;
    expires_at: string;
  }>;
}

export interface LinkGuardianPayload {
  family_group_id: string;
  guardian_name: string;
  guardian_email: string;
  guardian_phone: string;
  relationship: string;
  guardian_type?: GuardianType;
}

