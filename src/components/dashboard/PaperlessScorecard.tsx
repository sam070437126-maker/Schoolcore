import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { PaperlessKPIs } from '../../types/index.ts';
import { NavTab } from '../layout/Sidebar.tsx';
import {
  Clock,
  FileCheck,
  TrendingUp,
  Leaf,
  ArrowRight,
  BookOpen,
  MessageSquare,
  CreditCard,
} from 'lucide-react';

interface PaperlessScorecardProps {
  onNavigate?: (tab: NavTab, extra?: any) => void;
}

export const PaperlessScorecard: React.FC<PaperlessScorecardProps> = ({ onNavigate }) => {
  const [kpis, setKpis] = useState<PaperlessKPIs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadKpis();
  }, []);

  const loadKpis = async () => {
    try {
      const res = await api.getPaperlessKPIs();
      setKpis(res.kpis);
    } catch {
      // Fallback default targets from PDF specification
      setKpis({
        administrative_time_saved_pct: 90,
        paper_reduction_pct: 75,
        fee_collection_velocity_pct: 32,
        parent_engagement_rate_pct: 88,
        reams_paper_saved: 128,
        cost_saved_naira: 1024000,
        active_parent_users: 32,
        total_parent_users: 36,
        attendance_minutes_saved_daily: 45,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !kpis) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#0a0f1d] text-slate-100 rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700/80">
      {/* Subtle architectural tactile texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, rgba(148, 163, 184, 0.04) 1px, transparent 1px)`,
          backgroundSize: '16px 16px, 32px 32px',
        }}
      />

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950/70 border border-slate-700/80 text-[10px] uppercase font-bold tracking-wider text-emerald-400 mb-2 shadow-inner">
              <span>Institutional Efficiency Index</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
              Paperless Transformation Scorecard
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              SchoolCore institutional impact: eliminating physical paperwork, cutting recurrent costs, and accelerating operations.
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('finance')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/90 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
            >
              <span>View Financial Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1. Admin Time Saved */}
          <div className="bg-slate-950/70 border border-slate-700/80 rounded-xl p-4 space-y-1 shadow-inner backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-bold tracking-wider font-sans">Admin Time Saved</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {kpis.administrative_time_saved_pct}%
            </div>
            <p className="text-[11px] text-slate-400">
              ~{kpis.attendance_minutes_saved_daily}m daily on attendance & report cards
            </p>
          </div>

          {/* 2. Paper & Printing Cost Cut */}
          <div className="bg-slate-950/70 border border-slate-700/80 rounded-xl p-4 space-y-1 shadow-inner backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-bold tracking-wider font-sans">Paper Reduced</span>
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {kpis.paper_reduction_pct}%
            </div>
            <p className="text-[11px] text-slate-400">
              {kpis.reams_paper_saved} reams saved (₦{(kpis.cost_saved_naira / 1000000).toFixed(2)}M)
            </p>
          </div>

          {/* 3. Fee Collection Velocity */}
          <div className="bg-slate-950/70 border border-slate-700/80 rounded-xl p-4 space-y-1 shadow-inner backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-bold tracking-wider font-sans">Collection Speed</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              +{kpis.fee_collection_velocity_pct}%
            </div>
            <p className="text-[11px] text-slate-400">Instant digital receipts & billing</p>
          </div>
        </div>

        {/* Quick Launchpad to digital actions */}
        {onNavigate && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/90 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Quick Digital Actions:</span>
            <button
              onClick={() => onNavigate('homework')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-medium border border-slate-700/80 shadow-xs transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Homework Publisher</span>
            </button>
            <button
              onClick={() => onNavigate('messages')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-medium border border-slate-700/80 shadow-xs transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Parent Messages</span>
            </button>
            <button
              onClick={() => onNavigate('finance')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-medium border border-slate-700/80 shadow-xs transition-all cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Collect & Issue Receipt</span>
            </button>
            <button
              onClick={() => onNavigate('approvals')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-medium border border-slate-700/80 shadow-xs transition-all cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Digital Sick Notes & Slips</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
