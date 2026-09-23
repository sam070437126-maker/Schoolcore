import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { useToast } from '../common/Toast.tsx';
import { SchoolClass, Subject } from '../../types/index.ts';
import {
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowUpDown
} from 'lucide-react';

interface ClassBroadsheetProps {
  classes: SchoolClass[];
  subjects: Subject[];
  onOpenReportCard: (studentId: string, classId: string, term: string, sessionId: string) => void;
}

export const ClassBroadsheet: React.FC<ClassBroadsheetProps> = ({
  classes,
  subjects,
  onOpenReportCard,
}) => {
  const { showToast } = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedTerm, setSelectedTerm] = useState<'FIRST_TERM' | 'SECOND_TERM' | 'THIRD_TERM'>('FIRST_TERM');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('ses-2025-2026');

  const [overview, setOverview] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedClassId) return;

    let isMounted = true;
    setIsLoading(true);

    api
      .getClassAcademicOverview(selectedClassId, selectedSessionId, selectedTerm)
      .then((res) => {
        if (isMounted) {
          setOverview(res.overview);
        }
      })
      .catch(() => {
        if (isMounted) {
          showToast('Failed to load broadsheet summary.', 'error');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedClassId, selectedTerm, selectedSessionId]);

  const handlePrint = () => {
    window.print();
  };

  const selectedClass = (classes || []).find((c) => c.id === selectedClassId);
  const matrixStudents = overview?.broadsheet || [];
  const subjectsInOverview: Array<{ id: string; name: string; code: string }> =
    overview?.subjects || [];

  return (
    <div className="space-y-4 text-xs">
      {/* Selector and Filter Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Class Master Broadsheet & Performance Matrix</span>
          </h2>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Consolidated subject marks, class positions, averages, and pass/fail summary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class select */}
          <select
            id="broadsheet-class-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium text-xs focus:outline-emerald-500"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Term select */}
          <select
            id="broadsheet-term-select"
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value as any)}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium text-xs focus:outline-emerald-500"
          >
            <option value="FIRST_TERM">First Term</option>
            <option value="SECOND_TERM">Second Term</option>
            <option value="THIRD_TERM">Third Term</option>
          </select>

          {/* Print button */}
          <button
            id="btn-print-broadsheet"
            onClick={handlePrint}
            className="py-1.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Class Metric Highlights */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Total Students</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {overview.total_students || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Enrolled in {selectedClass?.name}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Class Average</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {overview.class_average ? `${overview.class_average}%` : '-'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Across registered subjects</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Highest Average</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {overview.highest_average ? `${overview.highest_average}%` : '-'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Top class performer</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Overall Pass Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {overview.pass_rate !== undefined ? `${overview.pass_rate}%` : '-'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Passing credit benchmark</div>
          </div>
        </div>
      )}

      {/* Broadsheet Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-slate-700 text-xs">
          <div className="font-semibold">
            {selectedClass?.name} Master Broadsheet &bull; {selectedTerm.replace('_', ' ')}
          </div>
          <div className="text-[11px] text-slate-500">
            {matrixStudents.length} Students &bull; {subjectsInOverview.length} Subjects Evaluated
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Compiling broadsheet records...</p>
          </div>
        ) : matrixStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No score records found for this term.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Teachers must enter Continuous Assessment or Examination marks in the Score Sheet tab.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                  <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Student Particulars</th>
                  {subjectsInOverview.map((sub) => (
                    <th
                      key={sub.id}
                      className="py-2.5 px-2 text-center min-w-[75px] font-mono text-[10px]"
                      title={sub.name}
                    >
                      <div className="truncate max-w-[70px] mx-auto">{sub.code || sub.name}</div>
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-center font-bold text-slate-900 w-16">Total</th>
                  <th className="py-2.5 px-2 text-center font-bold text-emerald-800 w-16">Avg %</th>
                  <th className="py-2.5 px-2 text-center font-bold w-14">Grade</th>
                  <th className="py-2.5 px-3 text-center w-24">Report Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrixStudents.map((stu: any, idx: number) => {
                  const isPass = stu.average_percentage >= 50;
                  return (
                    <tr
                      key={stu.student_id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/30' : ''
                      }`}
                    >
                      {/* Rank / Position */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600">
                        {stu.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                            1
                          </span>
                        ) : stu.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">
                            2
                          </span>
                        ) : stu.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 text-xs font-bold">
                            3
                          </span>
                        ) : (
                          <span>{stu.rank || idx + 1}</span>
                        )}
                      </td>

                      {/* Student Info */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{stu.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {stu.admission_number}
                        </div>
                      </td>

                      {/* Subject Scores */}
                      {subjectsInOverview.map((sub) => {
                        const score = stu.scores?.[sub.id];
                        return (
                          <td
                            key={sub.id}
                            className="py-2 px-2 text-center font-mono text-[11px]"
                          >
                            {score !== undefined && score !== null ? (
                              <span
                                className={`font-semibold ${
                                  score >= 50 ? 'text-slate-800' : 'text-rose-700 font-bold'
                                }`}
                              >
                                {score}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Score */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                        {stu.total_score || '-'}
                      </td>

                      {/* Average Percentage */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold">
                        <span className={isPass ? 'text-emerald-700' : 'text-rose-700'}>
                          {stu.average_percentage ? `${stu.average_percentage}%` : '-'}
                        </span>
                      </td>

                      {/* Overall Grade */}
                      <td className="py-2.5 px-2 text-center font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                            stu.overall_grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : stu.overall_grade === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : stu.overall_grade === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {stu.overall_grade || '-'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          id={`btn-card-${stu.student_id}`}
                          onClick={() =>
                            onOpenReportCard(
                              stu.student_id,
                              selectedClassId,
                              selectedTerm,
                              selectedSessionId
                            )
                          }
                          className="py-1 px-2 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded border border-emerald-300 transition-colors"
                        >
                          View Card
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
