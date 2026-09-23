import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { api } from '../../lib/api.ts';
import {
  SchoolClass,
  Subject,
  StaffMember,
  AcademicConfig
} from '../../types/index.ts';
import { ScoreEntrySheet } from '../academics/ScoreEntrySheet.tsx';
import { ClassBroadsheet } from '../academics/ClassBroadsheet.tsx';
import { ReportCardView } from '../academics/ReportCardView.tsx';
import { AcademicSetup } from '../academics/AcademicSetup.tsx';
import {
  BookOpen,
  FileSpreadsheet,
  GraduationCap,
  Settings2,
  CheckCircle2,
  Award
} from 'lucide-react';

export type AcademicSubTab = 'scores' | 'broadsheet' | 'report-card' | 'setup';

interface AcademicsViewProps {
  initialTab?: AcademicSubTab;
  initialClassId?: string;
  initialStudentId?: string;
}

export const AcademicsView: React.FC<AcademicsViewProps> = ({
  initialTab = 'scores',
  initialClassId,
  initialStudentId,
}) => {
  const { role, isTeacher, isAdmin, isPrincipal, isAcademicCoordinator, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const canManageAcademicSetup = isAdmin || isPrincipal || isAcademicCoordinator || isSuperAdmin;

  const [activeTab, setActiveTab] = useState<AcademicSubTab>(initialTab);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | undefined>(
    initialStudentId
  );

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialStudentId) setSelectedStudentForReport(initialStudentId);
  }, [initialStudentId]);

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [academicConfig, setAcademicConfig] = useState<AcademicConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load shared classes, subjects, staff, and config
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      api.getClasses(),
      api.getSubjects ? api.getSubjects() : Promise.resolve({ subjects: [] }),
      api.getStaff(),
      api.getAcademicConfig(),
    ])
      .then(([classesRes, subjectsRes, staffRes, configRes]) => {
        if (!isMounted) return;
        setClasses(classesRes.classes || []);
        setSubjects(subjectsRes.subjects || []);
        setStaffList(staffRes.staff || []);
        setAcademicConfig(configRes.config || null);
      })
      .catch(() => {
        if (isMounted) {
          showToast('Failed to load academic workspace details.', 'error');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenReportCard = (
    studentId: string,
    classId: string,
    term: string,
    sessionId: string
  ) => {
    setSelectedStudentForReport(studentId);
    setActiveTab('report-card');
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2.5" />
        <p className="text-xs font-semibold">Loading academic workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Academic Sub-navigation Bar */}
      <div className="print:hidden bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {/* Continuous Assessment & Score Entry */}
          <button
            id="tab-academic-scores"
            type="button"
            onClick={() => setActiveTab('scores')}
            className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'scores'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Score Sheet (CA & Exams)</span>
          </button>

          {/* Class Broadsheet */}
          <button
            id="tab-academic-broadsheet"
            type="button"
            onClick={() => setActiveTab('broadsheet')}
            className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'broadsheet'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Class Broadsheet</span>
          </button>

          {/* Terminal Report Cards */}
          <button
            id="tab-academic-report-card"
            type="button"
            onClick={() => setActiveTab('report-card')}
            className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'report-card'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Terminal Report Cards</span>
          </button>

          {/* Setup / Allocations (Admin / Principal / Coordinator) */}
          {canManageAcademicSetup && (
            <button
              id="tab-academic-setup"
              type="button"
              onClick={() => setActiveTab('setup')}
              className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'setup'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>Allocations & Grading</span>
            </button>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500 font-medium px-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Phase 2 Academic Engine Active</span>
        </div>
      </div>

      {/* Active Sub-tab Content */}
      {activeTab === 'scores' && (
        <ScoreEntrySheet
          classes={classes}
          subjects={subjects}
          config={academicConfig}
        />
      )}

      {activeTab === 'broadsheet' && (
        <ClassBroadsheet
          classes={classes}
          subjects={subjects}
          onOpenReportCard={handleOpenReportCard}
        />
      )}

      {activeTab === 'report-card' && (
        <ReportCardView
          initialStudentId={selectedStudentForReport}
          classes={classes}
          onBack={() => setActiveTab('broadsheet')}
        />
      )}

      {activeTab === 'setup' && (
        <AcademicSetup
          classes={classes}
          subjects={subjects}
          staffList={staffList}
          config={academicConfig}
          onConfigUpdated={(newCfg) => setAcademicConfig(newCfg)}
        />
      )}
    </div>
  );
};
