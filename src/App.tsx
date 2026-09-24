import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient.ts';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider } from './components/common/Toast.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar, NavTab } from './components/layout/Sidebar.tsx';
import { AuthView } from './components/auth/AuthView.tsx';
import { RoleGuard } from './components/common/RoleGuard.tsx';
import { PublicWebsite } from './components/public/PublicWebsite.tsx';

// Views
import { DashboardView } from './components/views/DashboardView.tsx';
import { StudentsView } from './components/views/StudentsView.tsx';
import { ClassesView } from './components/views/ClassesView.tsx';
import { AttendanceView } from './components/views/AttendanceView.tsx';
import { StaffView } from './components/views/StaffView.tsx';
import { NoticesView } from './components/views/NoticesView.tsx';
import { SettingsView } from './components/views/SettingsView.tsx';
import { AuditView } from './components/views/AuditView.tsx';
import { AcademicsView } from './components/views/AcademicsView.tsx';
import { HomeworkView } from './components/views/HomeworkView.tsx';
import { MessagesView } from './components/views/MessagesView.tsx';
import { FinanceView } from './components/views/FinanceView.tsx';
import { ApprovalsView } from './components/views/ApprovalsView.tsx';
import { SchoolControlRoom } from './components/admin/SchoolControlRoom.tsx';

// Icons for mobile bottom bar
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Bell,
  Menu,
  GraduationCap,
  CreditCard,
  BookOpen,
  MessageSquare,
  FileCheck2
} from 'lucide-react';

const isStandaloneDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as any).standalone === true ||
    window.location.search.includes('source=pwa') ||
    window.location.search.includes('mode=standalone')
  );
};

const MainApp: React.FC = () => {
  const {
    isAuthenticated,
    isLoading,
    isTeacher,
    isParent,
    isBursar,
    isAcademicCoordinator,
    isRegistrar,
    isPrincipal,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [navigationExtra, setNavigationExtra] = useState<any>(null);

  // Public website vs Authentication view toggle
  const [showAuthView, setShowAuthView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      const hash = window.location.hash;
      return (
        search.includes('view=auth') ||
        search.includes('auth=1') ||
        search.includes('token=') ||
        search.includes('mode=') ||
        hash.includes('login') ||
        hash.includes('register')
      );
    }
    return false;
  });

  const [viewPublicSite, setViewPublicSite] = useState<boolean>(false);

  const handleNavigate = (tab: NavTab, extra?: any) => {
    setActiveTab(tab);
    setNavigationExtra(extra || null);
  };

  const isInstalledApp = isStandaloneDevice();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400">Loading SchoolCore workspace...</p>
      </div>
    );
  }

  // When unauthenticated:
  // - If running as installed WebApp on device: ALWAYS show WebApp login / activation, NEVER the public website
  // - If browsed on public browser: show Public Website by default (with instant Launch / Sign In toggle)
  if (!isAuthenticated) {
    if (isInstalledApp || showAuthView) {
      return (
        <AuthView
          onBackToWebsite={isInstalledApp ? undefined : () => setShowAuthView(false)}
        />
      );
    }
    return (
      <PublicWebsite
        onLaunchApp={() => setShowAuthView(true)}
        onOpenRegister={() => setShowAuthView(true)}
      />
    );
  }

  // If authenticated user chose to preview public website
  if (viewPublicSite) {
    return (
      <div className="relative">
        <div className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-white">
          <span className="text-slate-400 font-medium">Viewing SchoolCore Public Website</span>
          <button
            onClick={() => setViewPublicSite(false)}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Return to School Workspace →
          </button>
        </div>
        <PublicWebsite
          onLaunchApp={() => setViewPublicSite(false)}
          onOpenRegister={() => setViewPublicSite(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        onOpenSidebar={() => setSidebarOpen(true)}
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        onViewWebsite={() => setViewPublicSite(true)}
      />

      {/* Main Body with Sidebar + Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Scrollable View Area */}
        <main
          id="main-content-viewport"
          className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 lg:pb-8 max-w-7xl mx-auto w-full"
        >
          {activeTab === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}

          {activeTab === 'control_room' && (
            <RoleGuard
              allowedRoles={['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN']}
              tabName="School Operations Control Room"
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              <SchoolControlRoom onNavigate={handleNavigate} />
            </RoleGuard>
          )}

          {activeTab === 'students' && (
            <RoleGuard
              allowedRoles={['ADMIN', 'PRINCIPAL', 'TEACHER', 'ACADEMIC_COORDINATOR', 'REGISTRAR', 'PARENT']}
              tabName="Students & Admissions"
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              <StudentsView
                initialOpenCreate={navigationExtra?.openCreateModal}
              />
            </RoleGuard>
          )}

          {activeTab === 'classes' && (
            <RoleGuard
              allowedRoles={['ADMIN', 'PRINCIPAL', 'TEACHER', 'ACADEMIC_COORDINATOR', 'REGISTRAR']}
              tabName="Classes & Arms"
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              <ClassesView
                onNavigate={handleNavigate}
                initialOpenCreate={navigationExtra?.openCreateModal}
              />
            </RoleGuard>
          )}

          {activeTab === 'attendance' && (
            <RoleGuard
              allowedRoles={['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT']}
              tabName="Attendance"
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              <AttendanceView initialClassId={navigationExtra?.classId} />
            </RoleGuard>
          )}

          {activeTab === 'academics' && (
            <RoleGuard
              allowedRoles={['ADMIN', 'PRINCIPAL', 'TEACHER', 'ACADEMIC_COORDINATOR']}
              tabName="Academics & Reports"
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              <AcademicsView
                initialTab={navigationExtra?.academicTab}
                initialClassId={navigationExtra?.classId}
                initialStudentId={navigationExtra?.studentId}
              />
            </RoleGuard>
          )}

          {activeTab === 'homework' && (
            <RoleGuard
              allowedRoles={['ADMIN', 'PRINCIPAL', 'TEACHER', 'ACADEMIC_COORDINATOR']}
              tabName="Homework & Resources"
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              <HomeworkView initialClassId={navigationExtra?.classId} />
            </RoleGuard>
          )}

          {activeTab === 'messages' && (
            <RoleGuard
              allowedRoles={['ADMIN', 'PRINCIPAL', 'TEACHER', 'BURSAR']}
              tabName="Direct Messaging"
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              <MessagesView />
            </RoleGuard>
          )}

          {activeTab === 'finance' && (
            <RoleGuard
              allowedRoles={['ADMIN', 'PRINCIPAL', 'BURSAR']}
              tabName="Bursary & Fees"
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              <FinanceView />
            </RoleGuard>
          )}

          {activeTab === 'approvals' && (
            <RoleGuard
              allowedRoles={['ADMIN', 'PRINCIPAL', 'REGISTRAR']}
              tabName="Digital Approvals & Slips"
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              <ApprovalsView />
            </RoleGuard>
          )}

          {activeTab === 'staff' && (
            <RoleGuard
              allowedRoles={['ADMIN', 'PRINCIPAL']}
              tabName="Staff & Faculty"
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              <StaffView initialOpenCreate={navigationExtra?.openCreateModal} />
            </RoleGuard>
          )}

          {activeTab === 'notices' && (
            <NoticesView initialOpenCreate={navigationExtra?.openCreateModal} />
          )}

          {activeTab === 'settings' && (
            <RoleGuard
              allowedRoles={['ADMIN', 'PRINCIPAL']}
              tabName="School Settings"
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              <SettingsView />
            </RoleGuard>
          )}

          {activeTab === 'audit' && (
            <RoleGuard
              allowedRoles={['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN']}
              tabName="Audit Logs"
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              <AuditView />
            </RoleGuard>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar - Mature Textured Dark Foundation */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-30 bg-[#0c1322]/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around lg:hidden shadow-2xl text-slate-400"
      >
        <button
          onClick={() => handleNavigate('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        {isParent ? (
          <>
            <button
              onClick={() => handleNavigate('students')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'students' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span>My Child</span>
            </button>
            <button
              onClick={() => handleNavigate('attendance')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'attendance' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardCheck className="w-5 h-5 mb-0.5" />
              <span>Attendance</span>
            </button>
            <button
              onClick={() => handleNavigate('notices')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'notices' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-5 h-5 mb-0.5" />
              <span>Notices</span>
            </button>
          </>
        ) : isBursar ? (
          <>
            <button
              onClick={() => handleNavigate('finance')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'finance' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-5 h-5 mb-0.5" />
              <span>Fee Ledger</span>
            </button>
            <button
              onClick={() => handleNavigate('messages')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'messages' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-5 h-5 mb-0.5" />
              <span>Messages</span>
            </button>
            <button
              onClick={() => handleNavigate('notices')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'notices' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-5 h-5 mb-0.5" />
              <span>Notices</span>
            </button>
          </>
        ) : isTeacher ? (
          <>
            <button
              onClick={() => handleNavigate('attendance')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'attendance' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardCheck className="w-5 h-5 mb-0.5" />
              <span>Roll Call</span>
            </button>
            <button
              onClick={() => handleNavigate('classes')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'classes' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-5 h-5 mb-0.5" />
              <span>Classes</span>
            </button>
            <button
              onClick={() => handleNavigate('homework')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'homework' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span>Homework</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleNavigate('attendance')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'attendance' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardCheck className="w-5 h-5 mb-0.5" />
              <span>Attendance</span>
            </button>
            <button
              onClick={() => handleNavigate('students')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'students' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span>Students</span>
            </button>
            <button
              onClick={() => handleNavigate('notices')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'notices' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-5 h-5 mb-0.5" />
              <span>Notices</span>
            </button>
          </>
        )}

        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <MainApp />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
