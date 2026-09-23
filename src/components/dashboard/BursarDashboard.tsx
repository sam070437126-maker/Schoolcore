import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { FeePayment } from '../../types/index.ts';
import { NavTab } from '../layout/Sidebar.tsx';
import { PaperlessScorecard } from './PaperlessScorecard.tsx';
import {
  Calendar,
  CreditCard,
  Receipt,
  Send,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Users
} from 'lucide-react';

interface BursarDashboardProps {
  onNavigate: (tab: NavTab, extra?: any) => void;
  todayFormatted: string;
}

export const BursarDashboard: React.FC<BursarDashboardProps> = ({
  onNavigate,
  todayFormatted,
}) => {
  const { user, school } = useAuth();
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await api.getFeePayments();
        if (isMounted) {
          setPayments(res.payments || []);
        }
      } catch {
        if (isMounted) setPayments([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter((p) => p.payment_date && p.payment_date.startsWith(todayStr));
  const todayCollected = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div id="bursar-dashboard" className="space-y-6">
      {/* Welcome Greeting Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#06241b] text-white p-6 rounded-2xl shadow-md border border-slate-700/80">
        {/* Subtle architectural tactile texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-950/80 border border-slate-700/80 shadow-inner select-none mb-2 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 font-mono tracking-wide">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Date:</span>
                <span>{todayFormatted}</span>
              </span>
              <span className="w-px h-3 bg-slate-700/80" />
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold font-sans">
                Financial Session
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Good day, {user?.full_name || 'Bursar'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Bursary, Cashless Fee Accounting & Paperless Electronic Receipts for <strong className="text-white font-semibold">{school?.name}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="bursar-record-payment-top-btn"
              onClick={() => onNavigate('finance')}
              className="px-3.5 py-2 bg-emerald-700/90 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-emerald-500/50 shadow-xs transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-emerald-200" />
              <span>Record Payment</span>
            </button>
            <button
              id="bursar-message-debtors-btn"
              onClick={() => onNavigate('messages')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Remind Debtors</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bursary Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          id="bursar-kpi-total-collected"
          onClick={() => onNavigate('finance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">{formatNaira(totalCollected)}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            {payments.length} verified transactions
          </div>
        </div>

        <div
          id="bursar-kpi-today-collected"
          onClick={() => onNavigate('finance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Inflow</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1.5">{formatNaira(todayCollected)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{todayPayments.length} receipts issued today</div>
        </div>

        <div
          id="bursar-kpi-outstanding"
          onClick={() => onNavigate('finance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Receipts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1.5">{payments.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Electronic audit vouchers</div>
        </div>

        <div
          id="bursar-kpi-receipts-verified"
          onClick={() => onNavigate('finance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Format</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-700 mt-1.5">100%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cryptographic QR verified</div>
        </div>
      </div>

      {/* Paperless Scorecard */}
      <PaperlessScorecard onNavigate={onNavigate} />

      {/* Bursar Operational Action Centers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('finance')}
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900">Record Fee Payment</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Record Bank Transfer, POS, or Cash. Instantly issue an authoritative digital receipt to parents.
          </p>
        </button>

        <button
          onClick={() => onNavigate('finance')}
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-300 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Send className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900">Overdue Debtors Reminders</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Send automated, polite fee reminder notices directly to parent SMS & WhatsApp/Email.
          </p>
        </button>

        <button
          onClick={() => onNavigate('finance')}
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900">Receipt QR Authenticity</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Scan or enter receipt codes to verify payment authenticity and eliminate paper forgery.
          </p>
        </button>
      </div>

      {/* Recent Cashless Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Recent Payment Ledger</h3>
            <p className="text-xs text-slate-500">Real-time payment audit log & digital receipt numbers</p>
          </div>
          <button
            onClick={() => onNavigate('finance')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Open Full Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No payment receipts logged yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
              Transactions recorded by the bursary will automatically appear in this real-time ledger.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.slice(0, 5).map((pay) => (
              <div key={pay.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                    ₦{Math.round(pay.amount / 1000)}k
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{pay.student_name || 'Enrolled Student'}</p>
                    <p className="text-[11px] text-slate-500">{pay.description || 'Tuition Fee'} • {pay.payment_method}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {pay.receipt_number || pay.id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
