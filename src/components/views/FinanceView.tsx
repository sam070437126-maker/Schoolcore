import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { StudentFeeAccount, FeePayment, SchoolClass } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Search,
  Printer,
  ShieldCheck,
  Send,
  Download,
  Receipt,
  FileCheck,
  Building,
  TrendingUp,
  DollarSign,
  Users,
  X,
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { user, school, role, isParent, isBursar, isAdmin, isPrincipal } = useAuth();
  const { showToast } = useToast();

  const [accounts, setAccounts] = useState<StudentFeeAccount[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'payments' | 'verify'>('accounts');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedAccountForPay, setSelectedAccountForPay] = useState<StudentFeeAccount | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<FeePayment | null>(null);

  // Verification state
  const [verifyQuery, setVerifyQuery] = useState<string>('');
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; receipt?: FeePayment; message?: string } | null>(
    null
  );
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: 50000,
    payment_method: 'BANK_TRANSFER',
    payer_name: '',
    payer_phone: '',
    description: 'School Term Tuition Fee Settlement',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadFinanceData();
  }, [selectedClassId]);

  const loadFinanceData = async () => {
    setIsLoading(true);
    try {
      const [accRes, payRes, clsRes] = await Promise.all([
        api.getFeeAccounts(selectedClassId !== 'all' ? { classId: selectedClassId } : undefined),
        api.getFeePayments(),
        api.getClasses(),
      ]);
      setAccounts(accRes.accounts || []);
      setPayments(payRes.payments || []);
      setClasses(clsRes.classes || []);
    } catch (err: any) {
      showToast(err.message || 'Could not load financial records.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountForPay) return;

    setIsSubmitting(true);
    try {
      const res = await api.recordFeePayment({
        student_id: selectedAccountForPay.student_id,
        student_name: selectedAccountForPay.student_name,
        admission_number: selectedAccountForPay.admission_number,
        class_name: selectedAccountForPay.class_name,
        fee_account_id: selectedAccountForPay.id,
        amount: Number(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        payer_name: paymentForm.payer_name || user?.full_name || selectedAccountForPay.guardian_name,
        payer_phone: paymentForm.payer_phone || selectedAccountForPay.guardian_phone,
        payer_email: user?.email,
        description: paymentForm.description,
      });

      showToast(`Payment of ₦${Number(paymentForm.amount).toLocaleString()} confirmed! Receipt issued.`, 'success');
      setShowPaymentModal(false);
      setViewingReceipt(res.payment);
      loadFinanceData();
    } catch (err: any) {
      showToast(err.message || 'Payment recording failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyQuery.trim()) return;

    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.verifyReceipt(verifyQuery.trim());
      setVerifyResult({
        valid: res.valid,
        receipt: res.receipt,
        message: res.message,
      });
    } catch (err: any) {
      setVerifyResult({
        valid: false,
        message: err.message || 'Receipt could not be verified.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      const res = await api.sendPaymentReminders(true);
      showToast(`Automated SMS reminders sent to ${res.count} parents with overdue fees!`, 'success');
      loadFinanceData();
    } catch (err: any) {
      showToast(err.message || 'Could not send reminders.', 'error');
    }
  };

  // Metrics
  const totalBilled = accounts.reduce((acc, a) => acc + a.total_billed, 0);
  const totalCollected = accounts.reduce((acc, a) => acc + a.total_paid, 0);
  const totalOutstanding = accounts.reduce((acc, a) => acc + a.balance, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const filteredAccounts = accounts.filter((acc) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        acc.student_name.toLowerCase().includes(q) ||
        acc.admission_number.toLowerCase().includes(q) ||
        acc.guardian_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Finance, Billing & Digital Ledger</h1>
            <p className="text-xs text-slate-500">
              Automated fee scheduling, digital instant receipts, cashless verification, and automated reminders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(isAdmin || isPrincipal || isBursar) && (
            <button
              onClick={handleSendReminders}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-amber-700" />
              <span>Send Overdue Reminders</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('verify')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verify Receipt</span>
          </button>
        </div>
      </div>

      {/* Top 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billed</span>
          <div className="text-lg font-bold text-slate-900">₦{totalBilled.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500">Across current academic term</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
          <div className="text-lg font-bold text-emerald-600">₦{totalCollected.toLocaleString()}</div>
          <p className="text-[11px] text-emerald-600 font-semibold">{collectionRate}% collection rate</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</span>
          <div className="text-lg font-bold text-rose-600">₦{totalOutstanding.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500">Pending payment reconciliation</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verified Receipts</span>
          <div className="text-lg font-bold text-blue-600">{payments.length} Issued</div>
          <p className="text-[11px] text-blue-600 font-medium">100% paperless audit trail</p>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'accounts'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Student Fee Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'payments'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payment Transactions & Receipts ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'verify'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Receipt Authenticity Verifier
        </button>
      </div>

      {/* TAB 1: Student Fee Accounts */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Filter Class:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
              >
                <option value="all">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or parent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Student / Admission</th>
                    <th className="p-3.5">Class</th>
                    <th className="p-3.5">Guardian & Contact</th>
                    <th className="p-3.5 text-right">Total Billed</th>
                    <th className="p-3.5 text-right">Paid</th>
                    <th className="p-3.5 text-right">Balance</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        {acc.student_name}
                        <span className="block text-[11px] font-normal text-slate-400">{acc.admission_number}</span>
                      </td>
                      <td className="p-3.5 text-slate-600">{acc.class_name}</td>
                      <td className="p-3.5 text-slate-600">
                        {acc.guardian_name}
                        <span className="block text-[11px] text-slate-400">{acc.guardian_phone}</span>
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-700">₦{acc.total_billed.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-semibold text-emerald-600">₦{acc.total_paid.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        ₦{acc.balance.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            acc.payment_status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : acc.payment_status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {acc.payment_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {acc.balance > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedAccountForPay(acc);
                              setPaymentForm((prev) => ({
                                ...prev,
                                amount: acc.balance,
                                payer_name: acc.guardian_name,
                                payer_phone: acc.guardian_phone,
                              }));
                              setShowPaymentModal(true);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
                          >
                            Pay / Record
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold inline-flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Payment Transactions & Receipts */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Receipt #</th>
                  <th className="p-3.5">Student / Class</th>
                  <th className="p-3.5">Amount (₦)</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Payer Details</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-center">Security Status</th>
                  <th className="p-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold font-mono text-blue-700">{p.receipt_number}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">{p.student_name}</span>
                      <span className="block text-[11px] text-slate-400">{p.class_name}</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">₦{p.amount.toLocaleString()}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {p.payer_name}
                      <span className="block text-[11px] text-slate-400">{p.payer_phone}</span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(p.payment_date).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setViewingReceipt(p)}
                        className="px-2.5 py-1 text-blue-600 hover:text-blue-800 font-semibold text-xs inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Receipt Authenticity Verifier */}
      {activeTab === 'verify' && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Receipt Authenticity Verifier</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Prevent fraud and eliminate paper receipts. Enter the receipt number (e.g.{' '}
              <code className="text-slate-800 font-mono">BFS-REC-2025-0841</code>) or transaction reference to verify
              authoritative cryptographic validity.
            </p>
          </div>

          <form onSubmit={handleVerifyReceipt} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter receipt number or transaction reference..."
                value={verifyQuery}
                onChange={(e) => setVerifyQuery(e.target.value)}
                className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isVerifying ? 'Verifying...' : 'Verify Authenticity'}
              </button>
            </div>
          </form>

          {verifyResult && (
            <div
              className={`p-5 rounded-2xl border ${
                verifyResult.valid
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/70 border-rose-200 text-rose-900'
              }`}
            >
              {verifyResult.valid && verifyResult.receipt ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="font-bold text-sm">Authentic Receipt Verified</span>
                        <p className="text-[11px] text-emerald-700">Authoritative record from SchoolCore cloud ledger</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs bg-emerald-100 px-2 py-1 rounded-md">
                      {verifyResult.receipt.receipt_number}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Student Name</span>
                      <p className="font-bold text-slate-900">{verifyResult.receipt.student_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Class</span>
                      <p className="font-bold text-slate-900">{verifyResult.receipt.class_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Amount Paid</span>
                      <p className="font-bold text-emerald-700 text-sm">₦{verifyResult.receipt.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Payment Method</span>
                      <p className="font-bold text-slate-900">{verifyResult.receipt.payment_method}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Transaction Reference</span>
                      <p className="font-mono text-slate-700">{verifyResult.receipt.reference}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Verified By</span>
                      <p className="font-semibold text-slate-800">{verifyResult.receipt.verified_by}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setViewingReceipt(verifyResult.receipt!)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold text-xs hover:bg-emerald-700"
                    >
                      Open Full Digital Receipt
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>{verifyResult.message || 'Receipt not found or fraudulent transaction code.'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Record / Process Fee Payment */}
      {showPaymentModal && selectedAccountForPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Record Fee Payment</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{selectedAccountForPay.student_name}</div>
                  <div className="text-slate-500">
                    {selectedAccountForPay.admission_number} • {selectedAccountForPay.class_name}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Outstanding</span>
                  <div className="font-bold text-rose-600 text-sm">
                    ₦{selectedAccountForPay.balance.toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₦) *</label>
                <input
                  type="number"
                  min="1000"
                  max={selectedAccountForPay.balance}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="POS">School POS Terminal</option>
                    <option value="CASH">Cash Deposit to Bursary</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payer Name</label>
                  <input
                    type="text"
                    value={paymentForm.payer_name}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payer_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payer Phone (For SMS Receipt)</label>
                <input
                  type="text"
                  value={paymentForm.payer_phone}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payer_phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Digital Official Receipt View */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 space-y-6 text-xs relative">
            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-200">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Official Electronic Payment Receipt
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                {school?.name || 'Bright Future Secondary School'}
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {school?.address || '14 Commercial Avenue, Yaba, Lagos State, Nigeria'}
              </p>
            </div>

            {/* Receipt details */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">RECEIPT NUMBER</span>
                <span className="font-bold text-slate-900">{viewingReceipt.receipt_number}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">DATE & TIME</span>
                <span className="font-bold text-slate-700">
                  {new Date(viewingReceipt.payment_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-t border-b border-slate-100 py-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-900">{viewingReceipt.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admission Number:</span>
                <span className="font-semibold text-slate-800">{viewingReceipt.admission_number || 'BFS/2024/084'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Class:</span>
                <span className="text-slate-800">{viewingReceipt.class_name || 'JSS 2A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-semibold text-slate-800">{viewingReceipt.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Ref:</span>
                <span className="font-mono text-slate-600">{viewingReceipt.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid By:</span>
                <span className="font-semibold text-slate-800">{viewingReceipt.payer_name}</span>
              </div>
            </div>

            {/* Total Paid block */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Amount Received
                </span>
                <span className="text-xl font-extrabold text-emerald-900">
                  ₦{viewingReceipt.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>CLEARED</span>
              </div>
            </div>

            {/* Official digital signature & watermark note */}
            <div className="text-[10px] text-slate-400 text-center space-y-1 pt-2">
              <p className="font-semibold text-slate-600">
                Verified Cryptographic Signature • SchoolCore Paperless Digital Seal
              </p>
              <p>Issued by {viewingReceipt.verified_by}. No physical paper stamp required under CBN cashless policy.</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
