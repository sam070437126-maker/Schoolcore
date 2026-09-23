# SchoolCore — Lightweight Digital Operating System for Secondary Schools

**SchoolCore** is a lightweight digital operating system for secondary schools designed to operate reliably in real-world environments with low-end Android smartphones, older office computers, and unstable internet connections.

---

## Product Vision & Design Principles

1. **School-Centric Architecture**: Students and parents do not need personal smartphones for the school to experience the benefits of digital administration.
2. **Low-Bandwidth First**: Minimal bundle sizes, server-rendered data payloads, paginated records, and zero heavy video or excessive client transitions.
3. **Multi-Tenant Isolation**: Strict PostgreSQL Row Level Security (RLS) policies and tenant ID verification ensuring School A can never access School B records.
4. **Real Persistence**: Every student admission, class assignment, roll call attendance mark, notice publication, and setting mutation is saved into durable storage and persists across reloads.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Node.js & Express (API layer with full RBAC authentication & authorization)
- **Database & Security**: PostgreSQL 15+ Schema with Row Level Security (RLS) policies & UUID identifiers (`supabase/migrations/`)
- **Persistence**: ACID-compliant JSON store (`.data/schoolcore_db.json`) syncing directly with Postgres schemas

---

## V1 Core Modules

1. **Authentication & Multi-Tenant Onboarding**:
   - Secure login, new school registration, role-aware navigation, and session tokens.
2. **Role-Aware Dashboards**:
   - **Administrator/Principal**: Real-time stats (students, faculty, class streams, today's attendance metrics, audit feed, notices).
   - **Teacher Workspace**: Assigned classes, period roll call indicators, 1-click attendance taking.
3. **Student Directory & Management**:
   - Full CRUD: Add, edit, view profile, archive/deactivate, search by name/admission number, class filters, status filters, and server-side pagination.
4. **Classroom & Stream Management**:
   - Create class arms (`JSS 1A` to `SS 3C`), assign form teachers, associate subjects, view rosters, and launch attendance registers.
5. **Classroom Attendance Register**:
   - Touch-friendly roll call for mobile phones: Mark All Present, status toggles (Present / Absent / Late), per-student remarks, session notes, and audit history.
6. **Faculty & Staff Directory**:
   - Staff records with employee IDs, contact phone/email, assigned roles, and teaching streams.
7. **School Notices & Bulletins**:
   - Target audience announcements (*Everyone*, *Teachers*, *Students*, *Parents*) with priority indicators (*Normal*, *High*, *Urgent*).
8. **Institutional Settings**:
   - School profile, academic session & term selector, morning roll-call cutoff times, and low-bandwidth modes.
9. **Audit Trail**:
   - Immutable audit logging for logins, student mutations, class creations, attendance submissions, and settings changes.

---

## Getting Started

### 1. Installation
\`\`\`bash
npm install
\`\`\`

### 2. Environment Configuration
Copy `.env.example` to `.env`:
\`\`\`env
# Optional Supabase integration keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

### 3. Start Development Server
\`\`\`bash
npm run dev
\`\`\`
The application will be running on \`http://0.0.0.0:3000\`.

### 4. Build for Production
\`\`\`bash
npm run build
npm start
\`\`\`

---

## Demo Accounts & Pre-Loaded Seed Data

The database comes pre-seeded with **Bright Future Secondary School** (and a secondary test tenant **Excel Academy** to verify cross-school isolation):

| Role | Name | Email | Password | Assigned Context |
| :--- | :--- | :--- | :--- | :--- |
| **School Administrator** | Alhaji Ibrahim Danjuma | `admin@brightfuture.sch.ng` | `password123` | Full school administration |
| **Principal** | Dr. Amina Bello | `principal@brightfuture.sch.ng` | `password123` | Institutional oversight & notices |
| **Teacher (Maths)** | Mr. Samuel Adewale | `samuel@brightfuture.sch.ng` | `password123` | Form Teacher: `JSS 2A`, `SS 1A` |
| **Teacher (English)** | Mrs. Chioma Eze | `chioma@brightfuture.sch.ng` | `password123` | Form Teacher: `JSS 1A`, `SS 3A` |
| **Tenant B Admin** | Pastor Emmanuel Okon | `admin@excelacademy.sch.ng` | `password123` | School B (Tenant isolation test) |

*You can also use the 1-Click Role Switcher on the Sign In page for rapid verification.*

---

## Database Schema & RLS Architecture

The complete production PostgreSQL DDL and Row Level Security policies are located in `supabase/migrations/20260901_schoolcore_schema.sql`.

Key tables include:
- `schools`
- `academic_sessions`
- `profiles`
- `school_users` (Roles: `SUPER_ADMIN`, `SCHOOL_ADMIN`, `PRINCIPAL`, `TEACHER`, `BURSAR`, `ACADEMIC_COORDINATOR`)
- `classes`
- `subjects`
- `students`
- `staff`
- `attendance_sessions`
- `attendance_records`
- `notices`
- `school_settings`
- `audit_logs`
- `academic_configs`
- `teacher_subject_assignments`
- `subject_results`
- `student_term_remarks`

---

## Authoritative REST API Reference

All protected endpoints require an `Authorization: Bearer <session-token>` header and enforce strict tenant-isolation via authenticated school session contexts.

### Authentication & Tenant Onboarding
| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns user profile, active school context, role, and bearer token. |
| `POST` | `/api/auth/register-school` | Public | Multi-tenant onboarding: Provisions school entity, initial academic session, administrator profile, default class arms, and core subject register. |
| `GET` | `/api/auth/me` | Authenticated | Re-validates bearer token and returns current user, school, and role profile. |

### Dashboard & Analytics
| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | All Roles | Computes live real-time metrics: enrolled students, faculty count, registered class arms, and today's attendance tallies. |

### Student Management
| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | All Roles | Paginated student directory with search (name / admission number), class filter, and status filter. |
| `GET` | `/api/students/:id` | All Roles | Retrieves detailed student record and cumulative roll-call statistics. |
| `POST` | `/api/students` | Admin, Principal | Enrolls a new student with institutional prefix formatting and duplicate admission number guards. |
| `PUT` | `/api/students/:id` | Admin, Principal | Updates demographic, guardian, house, and assigned class information. |
| `PATCH` | `/api/students/:id/status` | Admin, Principal | Updates lifecycle status (`ACTIVE`, `INACTIVE`, `GRADUATED`, `TRANSFERRED`, `SUSPENDED`). |

### Classes & Classroom Arms
| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/classes` | All Roles | Retrieves all active class streams for the school's current academic session. |
| `GET` | `/api/classes/:id` | All Roles | Retrieves class details and full active student register roster. |
| `POST` | `/api/classes` | Admin, Principal | Creates a new class stream (e.g., `JSS 1A`, `SS 2 Science`) and links designated form teacher. |
| `PUT` | `/api/classes/:id` | Admin, Principal | Updates class name, arm, capacity, or form teacher assignment. |
| `DELETE` | `/api/classes/:id` | Admin | Archives class stream while preserving historical student memberships. |
| `GET` | `/api/subjects` | All Roles | Retrieves school curriculum subject list. |

### Staff & Faculty Management
| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/staff` | All Roles | Retrieves faculty roster with assigned roles, contact details, and assigned class streams. |
| `POST` | `/api/staff` | Admin, Principal | Registers new faculty member, provisions authentication user profile, and binds school permissions. |
| `PUT` | `/api/staff/:id` | Admin, Principal | Updates faculty credentials, contact info, assigned classes, or operational status. |

### Daily Attendance Engine
| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/attendance` | All Roles | Retrieves classroom roll call sheet for a given class ID, date, and session type (`MORNING`/`AFTERNOON`). |
| `POST` | `/api/attendance` | Teacher, Admin | Submits batch student roll call statuses (`PRESENT`, `ABSENT`, `LATE`) and optional remarks; verifies teacher class assignment. |
| `GET` | `/api/attendance/history` | All Roles | Returns historical roll call audit records filtered by class. |

### School Bulletins & Notices
| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notices` | All Roles | Retrieves published school notices filtered by target audience and user role. |
| `POST` | `/api/notices` | Admin, Principal | Publishes an official announcement with priority tags and optional expiration timestamp. |
| `DELETE` | `/api/notices/:id` | Admin | Archives notice bulletin. |

### Academic Assessment & Results Engine
| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/academics/config` | All Roles | Retrieves CA weightings, exam ratio, grading bands (A1-F9), and minimum pass threshold. |
| `PUT` | `/api/academics/config` | Admin, Principal, Coordinator | Configures institutional assessment scoring schemes and grade cutoffs. |
| `GET` | `/api/academics/assignments` | All Roles | Lists teacher subject assignments across class arms and sessions. |
| `POST` | `/api/academics/assignments` | Admin, Principal, Coordinator | Binds a teacher to a specific subject in a specific class arm. |
| `DELETE` | `/api/academics/assignments/:id` | Admin, Principal, Coordinator | Unassigns teacher from subject and class stream. |
| `GET` | `/api/academics/results` | All Roles | Retrieves scoresheet for a class, subject, session, and term with automated grade computation. |
| `POST` | `/api/academics/results` | Teacher, Admin, Coordinator | Batch saves scores (`CA1`, `CA2`, `CA3`, `EXAM`) and subject remarks; enforces teacher authorization checks. |
| `POST` | `/api/academics/results/status` | Admin, Principal, Coordinator | Transition scoresheet status through review pipeline (`DRAFT` → `SUBMITTED` → `REVIEWED` → `PUBLISHED`). |
| `GET` | `/api/academics/report-card/:studentId` | All Roles | Compiles official terminal report card with subject aggregates, class position, attendance stats, and remarks. |
| `POST` | `/api/academics/remarks` | Teacher, Admin, Principal | Records terminal form teacher remarks, principal comments, and next-term resumption dates. |
| `GET` | `/api/academics/class-overview/:classId` | All Roles | Computes class broadsheet summary, ranking, and subject pass rates. |

### Institutional Settings & Places Grounding
| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | Admin, Principal | Returns school metadata, academic sessions, curriculum subjects, and user access matrix. |
| `PUT` | `/api/settings` | Admin | Updates institutional preferences, roll call cutoff times, contact info, and low-bandwidth toggles. |
| `GET` | `/api/places/search` | Admin, Principal | Queries Google Places API to search for verified secondary school records and official addresses. |
| `GET` | `/api/places/details` | Admin, Principal | Fetches official Google Place metadata, website, telephone, and geo-coordinates. |
| `POST` | `/api/places/sync-school` | Admin | Synchronizes institutional profile with verified Google Places data and geo-coordinates. |

### Audit Trail & System Utilities
| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/audit-logs` | Admin | Retrieves immutable system event trail with actor names, timestamps, IP context, and diff details. |
| `POST` | `/api/system/reset-demo` | Public (Dev/Demo) | Resets authoritative repository to pristine sample baseline with full relational verification. |

---

## Roadmap & Future Phases

- **Phase 2 — Academic Engine**: *[Completed & Operational]* Continuous assessment (CA1, CA2, CA3), exam grading, terminal broadsheets, report cards, teacher remarks, and subject-level faculty assignments.
- **Phase 3 — Finance & Bursary**: Tuition fee schedules, automated invoice generation, bank payment verification, printed receipts, debtor registers, and financial statement summaries.
- **Phase 4 — Parent & Community Communication**: SMS gateway integration for offline parents, broadcast circulars, automated absence alerts, and parent portal access.
- **Phase 5 — Operational Logistics**: Student disciplinary records, staff leave management, digital document vaults, and inventory tracking.
- **Phase 6 — Smart School Analytics**: Multi-term attendance trends, academic early-warning triggers for at-risk students, and automated inspection reporting.
