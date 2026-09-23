import React, { useState, useEffect } from 'react';
import {
  School,
  ArrowRight,
  Download,
  Check,
  Users,
  ClipboardCheck,
  Bell,
  FileSpreadsheet,
  Coins,
  Smartphone,
  Laptop,
  Apple,
  Play,
  Pause,
  ChevronRight,
  Lock,
  X,
  FileText,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { Live3DBackground } from './Live3DBackground';

interface PublicWebsiteProps {
  onLaunchApp: () => void;
  onOpenRegister?: () => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  onLaunchApp,
  onOpenRegister,
}) => {
  const { isInstallable, platform, installPwa } = usePwaInstall();
  const [activeInstallTab, setActiveInstallTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [modalContent, setModalContent] = useState<'privacy' | 'terms' | null>(null);

  // Sync install tab with detected platform
  useEffect(() => {
    if (platform === 'ios') setActiveInstallTab('ios');
    else if (platform === 'desktop') setActiveInstallTab('desktop');
    else setActiveInstallTab('android');
  }, [platform]);

  // Video / Product Walkthrough Player state (Simulated 48-second product run)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [playbackTime, setPlaybackTime] = useState<number>(8);
  const totalDuration = 48; // 48 seconds total (8s per chapter)

  const videoSteps = [
    {
      id: 0,
      timestamp: '0:00 - 0:08',
      label: 'Sign In',
      heading: 'Secure school workspace login',
      caption: 'Each school gets an autonomous workspace with role-based access for principals, teachers, and bursars.',
    },
    {
      id: 1,
      timestamp: '0:08 - 0:16',
      label: 'Dashboard',
      heading: 'Morning operational pulse',
      caption: 'View today’s attendance percentages, student headcounts, fee collections, and staff presence in real time.',
    },
    {
      id: 2,
      timestamp: '0:16 - 0:24',
      label: 'Students',
      heading: 'Simple student directory',
      caption: 'Organized student profiles with admission numbers, class arms, parent phone numbers, and emergency contacts.',
    },
    {
      id: 3,
      timestamp: '0:24 - 0:32',
      label: 'Roll Call',
      heading: '1-Tap classroom attendance',
      caption: 'Class teachers take attendance on their phone in under 45 seconds. Automatically flags absent students.',
    },
    {
      id: 4,
      timestamp: '0:32 - 0:40',
      label: 'Grades',
      heading: 'WAEC-aligned term grade books',
      caption: 'Record continuous assessments (CA 1 & 2) and exam scores. Automatic calculation of totals, grades, and remarks.',
    },
    {
      id: 5,
      timestamp: '0:40 - 0:48',
      label: 'Fees',
      heading: 'Fee recovery and bank deposits',
      caption: 'Track tuition payments, outstanding student balances, and verified bank transfers with complete audit trails.',
    },
  ];

  // Timer loop for simulated product video
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackTime((prev) => {
        const next = prev + 1;
        if (next >= totalDuration) {
          setCurrentStep(0);
          return 0;
        }
        const stepIndex = Math.floor(next / 8);
        setCurrentStep(stepIndex);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  const seekToStep = (index: number) => {
    setCurrentStep(index);
    setPlaybackTime(index * 8);
  };

  const handleInstallClick = async () => {
    const outcome = await installPwa();
    if (outcome === 'manual_guide') {
      const element = document.getElementById('install-guide');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#0d1627] text-slate-100 selection:bg-emerald-500 selection:text-white font-sans antialiased overflow-x-hidden relative">
      {/* ── Live 3D Movement Background (Interactive 3D orbs & depth waves) ── */}
      <Live3DBackground />

      {/* Radiant ambient glow pools to brighten the overall canvas */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[450px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/2 right-10 w-[550px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-10 left-1/3 w-[650px] h-[400px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* ── Top Navigation Bar (Liquid Glass Style) ── */}
      <header className="sticky top-0 z-50 bg-[#0d1627]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-950/40">
              <School className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                SchoolCore
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-medium">
                Modern School OS
              </span>
            </div>
          </div>

          {/* Section Jump Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button
              onClick={() => scrollToSection('overview')}
              className="hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('capabilities')}
              className="hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="hover:text-emerald-300 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('install-guide')}
              className="hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Install
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/15 rounded-xl text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Install</span>
              </button>
            )}
            <button
              type="button"
              onClick={onLaunchApp}
              className="px-4 sm:px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/40 hover:scale-[1.02]"
            >
              <span>Launch SchoolCore</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── 1. HERO SECTION ── */}
      <section className="relative z-10 pt-14 pb-16 md:pt-20 md:pb-24 border-b border-white/[0.08]">
        {/* CSS selector 2: Container of Hero */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Friendly, human badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>Designed for everyday primary and secondary schools</span>
            </div>

            {/* Confident, human headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              School management,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
                without the complexity.
              </span>
            </h1>

            {/* Warm, clear supporting sentence */}
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              SchoolCore gives school owners, administrators, and teachers one calm, dependable place to manage student records, roll call, report cards, and tuition fees.
            </p>

            {/* Primary & Secondary Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={onLaunchApp}
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/40 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <span>Launch SchoolCore</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('demo')}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 hover:text-white border border-white/20 font-medium rounded-xl text-sm flex items-center justify-center gap-2 backdrop-blur-md transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Watch how it works</span>
              </button>
            </div>

            {/* Practical human proof points */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Zero IT setup
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Works on phones & laptops
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Offline attendance sync
              </span>
            </div>
          </div>

          {/* ── Realistic SchoolCore Application Interface Preview (Liquid Glass) ── */}
          <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
            {/* Liquid frosted glass container */}
            <div className="rounded-2xl bg-slate-900/60 backdrop-blur-2xl border border-white/[0.14] shadow-[0_16px_48px_rgba(0,0,0,0.35)] overflow-hidden relative group">
              {/* Liquid specular reflection line at top */}
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

              {/* CSS selector 1: Desktop Browser / App Window Chrome */}
              <div className="h-11 px-4 bg-white/[0.04] backdrop-blur-xl border-b border-white/[0.1] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-xs" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-xs" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-xs" />
                  <span className="ml-2 text-xs font-semibold text-slate-200">Apex Academy • School Workspace</span>
                </div>

                {/* CSS selector 5: Liquid glass address bar with clean human text */}
                <div className="hidden sm:flex items-center gap-2 px-3.5 py-1 bg-white/[0.08] backdrop-blur-md rounded-full border border-white/15 text-xs text-slate-200 shadow-inner">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-slate-200">Apex Academy Portal • Verified</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-300">Live</span>
                </div>
              </div>

              {/* Main Product Application Screen with liquid glass panels */}
              <div className="p-4 sm:p-6 space-y-6 text-slate-100">
                {/* Header row inside application */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-md">
                      AA
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white">Apex Academy & High School</h2>
                      <p className="text-xs text-slate-300">2026/2027 Academic Session • First Term • WAEC Grading Standard</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold backdrop-blur-md">
                      Active Term
                    </span>
                    <button
                      type="button"
                      onClick={onLaunchApp}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      Open Live Demo
                    </button>
                  </div>
                </div>

                {/* Metric Summary Bar: Liquid Glass Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="p-3.5 bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-md rounded-xl border border-white/[0.1] transition-all">
                    <div className="text-xs text-slate-300 font-medium">Total Students</div>
                    <div className="text-2xl font-bold text-white mt-1">428</div>
                    <div className="text-[11px] text-emerald-300 mt-0.5">Across 14 class arms</div>
                  </div>
                  <div className="p-3.5 bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-md rounded-xl border border-white/[0.1] transition-all">
                    <div className="text-xs text-slate-300 font-medium">Today's Attendance</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">94.8%</div>
                    <div className="text-[11px] text-teal-300 mt-0.5">All 14 classes marked</div>
                  </div>
                  <div className="p-3.5 bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-md rounded-xl border border-white/[0.1] transition-all">
                    <div className="text-xs text-slate-300 font-medium">Tuition Reconciled</div>
                    <div className="text-2xl font-bold text-white mt-1">₦8.45M</div>
                    <div className="text-[11px] text-amber-300 mt-0.5">82% term collection</div>
                  </div>
                  <div className="p-3.5 bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-md rounded-xl border border-white/[0.1] transition-all">
                    <div className="text-xs text-slate-300 font-medium">Teaching Staff</div>
                    <div className="text-2xl font-bold text-white mt-1">32</div>
                    <div className="text-[11px] text-sky-300 mt-0.5">31 signed in today</div>
                  </div>
                </div>

                {/* Two Realistic Workspaces: Liquid Glass Register + Score Card */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Class Attendance Register */}
                  <div className="p-4 bg-white/[0.04] backdrop-blur-xl rounded-xl border border-white/[0.1] space-y-3 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <div>
                        <div className="text-xs font-bold text-white">JSS 2A — Morning Roll Call</div>
                        <div className="text-[11px] text-slate-300">Class Teacher: Mr. K. Okafor</div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold">
                        COMPLETED
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-white/[0.06]">
                        <div>
                          <div className="font-semibold text-slate-100">Adeleke Chioma Blessing</div>
                          <div className="text-[11px] text-slate-400">ADM/2026/014</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-300 font-bold text-[10px]">
                          PRESENT
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-white/[0.06]">
                        <div>
                          <div className="font-semibold text-slate-100">Bello Ibrahim Danladi</div>
                          <div className="text-[11px] text-slate-400">ADM/2026/015</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-300 font-bold text-[10px]">
                          PRESENT
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-white/[0.06]">
                        <div>
                          <div className="font-semibold text-slate-100">Okafor Emmanuel Chukwuma</div>
                          <div className="text-[11px] text-slate-400">ADM/2026/016</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 font-bold text-[10px]">
                          LATE (8:12 AM)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Grade Book & Fee Snapshot */}
                  <div className="p-4 bg-white/[0.04] backdrop-blur-xl rounded-xl border border-white/[0.1] space-y-3 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <div>
                        <div className="text-xs font-bold text-white">Academic Record & Tuition Audit</div>
                        <div className="text-[11px] text-slate-300">WAEC Continuous Assessment (CA)</div>
                      </div>
                      <span className="text-[10px] text-emerald-300 font-medium">Verified</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900/50 border border-white/[0.06] flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-100">Mathematics — SSS 1 Science</div>
                          <div className="text-[11px] text-slate-300">CA 1: 18/20 • CA 2: 17/20 • Exam: 54/60</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400 text-sm">89% • A1</div>
                          <div className="text-[10px] text-emerald-300">Excellent</div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/50 border border-white/[0.06] flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-100">First Term Tuition Fee (₦)</div>
                          <div className="text-[11px] text-slate-300">Zenith Bank Transfer #TRX-94821</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-white text-sm">₦120,000</div>
                          <div className="text-[10px] text-emerald-300 font-semibold">PAID IN FULL</div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/50 border border-white/[0.06] flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-100">PTA Executive Circular</div>
                          <div className="text-[11px] text-slate-300">Sent to 428 parent portal accounts</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-300 font-medium">100% Delivered</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. EDITORIAL INTRODUCTION (Brightened, Human Feel) ── */}
      <section id="overview" className="relative z-10 py-16 md:py-24 border-b border-white/[0.08] bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <span>Built for everyday school operations</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
            Most school software is either too complex to use, or built around spreadsheets that break.
          </h2>
          <p className="text-base sm:text-xl text-slate-200 leading-relaxed max-w-2xl mx-auto font-normal">
            SchoolCore was created to give school heads, teachers, and registrars a reliable, focused platform. It handles admissions, daily roll call, Continuous Assessment, report sheets, and tuition tracking without complicated IT infrastructure or steep learning curves.
          </p>

          {/* Simple 3-column stats with liquid glass cards */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] hover:border-emerald-400/30 transition-all">
              <div className="text-3xl font-extrabold text-white">&lt; 45 sec</div>
              <div className="text-sm font-semibold text-emerald-300 mt-1">Roll Call Speed</div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Teachers mark their whole class on a smartphone without carrying bulky paper registers.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] hover:border-emerald-400/30 transition-all">
              <div className="text-3xl font-extrabold text-white">100% Offline</div>
              <div className="text-sm font-semibold text-emerald-300 mt-1">Classroom Attendance</div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Attendance records cache in the browser locally and sync automatically when internet restores.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] hover:border-emerald-400/30 transition-all">
              <div className="text-3xl font-extrabold text-white">WAEC Aligned</div>
              <div className="text-sm font-semibold text-emerald-300 mt-1">Report Sheets</div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Built-in continuous assessment formulas calculate totals, letter grades (A1–F9), and principal remarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. PRODUCT CAPABILITIES (Liquid Glass Panels, Human Headings) ── */}
      <section id="capabilities" className="relative z-10 py-20 md:py-28 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything your school needs to stay organized.
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              Clear tools designed specifically for secondary and primary school administrators.
            </p>
          </div>

          {/* Capability 01 — Students */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 text-xs font-semibold">
                Students & Bio-data
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Keep student records organized and easy to access.
              </h3>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                Find any student in seconds by name, admission number, or class arm. Maintain accurate guardian contact details, enrollment dates, and historical report sheets in one place.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instant student bio-data search</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Admission numbering & class stream tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Parent and guardian emergency contacts</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-white/[0.12] overflow-hidden shadow-xl">
              <div className="px-5 py-3 bg-white/[0.04] border-b border-white/[0.08] flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" /> Student Directory
                </span>
                <span className="text-xs text-emerald-300 font-semibold">428 Enrolled</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      readOnly
                      value="Adeleke"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900/70 border border-white/[0.1] rounded-xl text-xs sm:text-sm text-white"
                    />
                  </div>
                  <span className="text-xs text-slate-200 px-3 py-2 bg-slate-900/70 border border-white/[0.1] rounded-xl font-medium">
                    JSS 2A
                  </span>
                </div>
                <div className="divide-y divide-white/[0.06] text-xs sm:text-sm">
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Adeleke Chioma Blessing</div>
                      <div className="text-xs text-slate-300">ADM/2026/014 • Guardian: Dr. O. Adeleke (0803 214 9901)</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold">
                      ACTIVE
                    </span>
                  </div>
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Adeleke Femi Joseph</div>
                      <div className="text-xs text-slate-300">ADM/2026/089 • Guardian: Mrs. K. Adeleke (0802 881 2041)</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold">
                      ACTIVE
                    </span>
                  </div>
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Adeleke Samuel Tunde</div>
                      <div className="text-xs text-slate-300">ADM/2026/112 • Guardian: Mr. P. Adeleke (0814 550 3192)</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold">
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 02 — Attendance (Flipped layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1 bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-white/[0.12] overflow-hidden shadow-xl">
              <div className="px-5 py-3 bg-white/[0.04] border-b border-white/[0.08] flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-emerald-400" /> Morning Roll Call Register
                </span>
                <span className="text-xs text-emerald-300 font-semibold">Class JSS 1B</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm p-2.5 rounded-xl bg-slate-900/70 border border-white/[0.08]">
                  <span className="font-medium text-slate-100">Bello Ibrahim Danladi</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs">PRESENT</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">LATE</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">ABSENT</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm p-2.5 rounded-xl bg-slate-900/70 border border-white/[0.08]">
                  <span className="font-medium text-slate-100">Chukwuemeka David</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs">PRESENT</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">LATE</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">ABSENT</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm p-2.5 rounded-xl bg-slate-900/70 border border-white/[0.08]">
                  <span className="font-medium text-slate-100">Danjuma Aisha Grace</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">PRESENT</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">LATE</span>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs shadow-xs">ABSENT</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm p-2.5 rounded-xl bg-slate-900/70 border border-white/[0.08]">
                  <span className="font-medium text-slate-100">Ezekiel Blessing Ngozi</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">PRESENT</span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-xs shadow-xs">LATE</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">ABSENT</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 text-xs font-semibold">
                Classroom Attendance
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Record and review attendance without unnecessary paperwork.
              </h3>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                Teachers take morning roll call on their phone or tablet in seconds. Absentee lists are generated automatically, so school heads know exactly who is in school by 8:30 AM.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1-Tap roll call (Present, Late, Absent)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Works even if classroom Wi-Fi or cellular network drops</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time morning presence summary for principals</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Capability 03 — Records & Grade Books */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 text-xs font-semibold">
                Continuous Assessment & Grades
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Compute continuous assessments and term results accurately.
              </h3>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                Tired of manual score sheets and calculator errors? Enter First CA, Second CA, and Exam scores. SchoolCore computes percentage totals, standard WAEC letter grades (A1 to F9), and generates printable report cards in minutes.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Continuous Assessment (CA 1 & CA 2) + Exam weighting</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automatic WAEC grade computation & remarks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Digital term report card generation for parents</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-white/[0.12] overflow-hidden shadow-xl">
              <div className="px-5 py-3 bg-white/[0.04] border-b border-white/[0.08] flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Term Score Sheet
                </span>
                <span className="text-xs text-slate-300 font-medium">SSS 2 Science • Physics</span>
              </div>
              <div className="p-5 overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-xs text-slate-300 font-semibold">
                      <th className="pb-3">Student</th>
                      <th className="pb-3 text-center">CA 1 (20)</th>
                      <th className="pb-3 text-center">CA 2 (20)</th>
                      <th className="pb-3 text-center">Exam (60)</th>
                      <th className="pb-3 text-center">Total (100)</th>
                      <th className="pb-3 text-right">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-slate-200">
                    <tr>
                      <td className="py-3 font-semibold text-white">Adeleke Chioma</td>
                      <td className="py-3 text-center">19</td>
                      <td className="py-3 text-center">18</td>
                      <td className="py-3 text-center">54</td>
                      <td className="py-3 text-center font-bold text-emerald-400">91%</td>
                      <td className="py-3 text-right font-bold text-emerald-400">A1</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-semibold text-white">Bello Ibrahim</td>
                      <td className="py-3 text-center">16</td>
                      <td className="py-3 text-center">15</td>
                      <td className="py-3 text-center">48</td>
                      <td className="py-3 text-center font-bold text-slate-100">79%</td>
                      <td className="py-3 text-right font-bold text-slate-200">B2</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-semibold text-white">Okafor Emmanuel</td>
                      <td className="py-3 text-center">14</td>
                      <td className="py-3 text-center">16</td>
                      <td className="py-3 text-center">42</td>
                      <td className="py-3 text-center font-bold text-slate-100">72%</td>
                      <td className="py-3 text-right font-bold text-slate-200">B3</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Capability 04 — School Notices & Operations (Flipped layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1 bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-white/[0.12] overflow-hidden shadow-xl">
              <div className="px-5 py-3 bg-white/[0.04] border-b border-white/[0.08] flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" /> Broadcasts & Finance Audit
                </span>
                <span className="text-xs text-slate-300 font-medium">Term Ledger</span>
              </div>
              <div className="p-5 space-y-3.5">
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/[0.08] space-y-1 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Mid-Term Assessment & PTA Circular</span>
                    <span className="text-[11px] text-emerald-300 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20">ALL PARENTS</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Timetable and holiday guidelines dispatched directly to parent portal accounts.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/[0.08] flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <div className="font-bold text-white">Tuition Reconciliation Ledger (₦)</div>
                    <div className="text-xs text-slate-300">Direct bank transfer verified by Bursar</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white text-base">₦120,000</div>
                    <span className="text-xs text-emerald-300 font-semibold">VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 text-xs font-semibold">
                Notices & Finance
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Keep staff and parents informed without paper memos.
              </h3>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                Publish school circulars, exam schedules, and fee notices straight to the parent and staff portals. Save thousands of sheets of printed paper every term.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Targeted notices (All School, Specific Classes, Staff Only)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fee balance reminders and digital payment receipts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero printing and photocopying expenses</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. PRODUCT VIDEO SECTION (Cinematic, Liquid Glass Player) ── */}
      <section id="demo" className="relative z-10 py-20 md:py-28 border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              Interactive Product Demo
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              See SchoolCore in action.
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-normal">
              A quick 48-second walk through the core workflow: Login → Dashboard → Students → Roll Call → Grades → Fee Ledger.
            </p>
          </div>

          {/* Video Player Display Frame with liquid glass styling */}
          <div className="rounded-2xl bg-slate-900/60 backdrop-blur-2xl border border-white/[0.14] shadow-[0_16px_48px_rgba(0,0,0,0.3)] overflow-hidden">
            {/* Step Selection Bar / Scrubber Timeline */}
            <div className="p-3.5 bg-white/[0.04] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
                {videoSteps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => seekToStep(step.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      currentStep === step.id
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-medium text-slate-300">
                  {formatTime(playbackTime)} / {formatTime(totalDuration)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause demo' : 'Resume demo'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Scrubber Progress Bar */}
            <div className="h-1.5 bg-white/[0.06] w-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
                style={{ width: `${(playbackTime / totalDuration) * 100}%` }}
              />
            </div>

            {/* Video Stage Display */}
            <div className="p-5 sm:p-8 space-y-6">
              {/* Caption and Chapter Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                <div>
                  <div className="text-xs font-semibold text-emerald-300">
                    Chapter {currentStep + 1} of 6 • {videoSteps[currentStep].timestamp}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {videoSteps[currentStep].heading}
                  </h3>
                </div>
                <div className="max-w-md text-xs sm:text-sm text-slate-200 bg-white/[0.06] px-4 py-2.5 rounded-xl border border-white/[0.08] backdrop-blur-md">
                  {videoSteps[currentStep].caption}
                </div>
              </div>

              {/* Dynamic UI Screens */}
              <div className="bg-slate-900/80 rounded-xl border border-white/[0.08] p-4 sm:p-6 min-h-[280px] flex flex-col justify-center">
                {currentStep === 0 && (
                  <div className="max-w-md mx-auto w-full space-y-3.5">
                    <div className="text-center space-y-1 pb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold mx-auto shadow-md">
                        <School className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-white text-base">Sign in to Apex Academy Workspace</h4>
                      <p className="text-xs text-slate-300">Tenant ID: <code className="text-emerald-300">apex-academy</code></p>
                    </div>
                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-200">
                        <span className="text-[11px] text-slate-400 block">Staff Email</span>
                        <span className="font-medium">principal@apexacademy.edu.ng</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-200">
                        <span className="text-[11px] text-slate-400 block">Access Level</span>
                        <span className="font-semibold text-emerald-400">Principal / Administrator</span>
                      </div>
                      <button
                        type="button"
                        onClick={onLaunchApp}
                        className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-xs sm:text-sm hover:bg-emerald-500 transition-colors shadow-xs"
                      >
                        Enter School Workspace
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs sm:text-sm pb-2 border-b border-white/[0.08]">
                      <span className="font-bold text-white">Daily Operational Overview</span>
                      <span className="text-emerald-300 font-semibold text-xs">8:45 AM • Live Data</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                      <div className="p-3.5 bg-slate-900 rounded-xl border border-white/[0.08]">
                        <span className="text-slate-300 text-xs">Present Today</span>
                        <div className="text-2xl font-bold text-emerald-400 mt-1">406</div>
                        <span className="text-[11px] text-slate-400">94.8% rate</span>
                      </div>
                      <div className="p-3.5 bg-slate-900 rounded-xl border border-white/[0.08]">
                        <span className="text-slate-300 text-xs">Marked Classes</span>
                        <div className="text-2xl font-bold text-white mt-1">14 / 14</div>
                        <span className="text-[11px] text-emerald-400 font-semibold">100% complete</span>
                      </div>
                      <div className="p-3.5 bg-slate-900 rounded-xl border border-white/[0.08]">
                        <span className="text-slate-300 text-xs">Tuition Logged</span>
                        <div className="text-2xl font-bold text-white mt-1">₦8.45M</div>
                        <span className="text-[11px] text-slate-400">Reconciled</span>
                      </div>
                      <div className="p-3.5 bg-slate-900 rounded-xl border border-white/[0.08]">
                        <span className="text-slate-300 text-xs">Staff Attendance</span>
                        <div className="text-2xl font-bold text-white mt-1">31 / 32</div>
                        <span className="text-[11px] text-slate-400">1 on leave</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <span className="font-bold text-white">Student Directory: JSS 2A Roster</span>
                      <span className="text-slate-300 text-xs">32 Students</span>
                    </div>
                    <div className="divide-y divide-white/[0.06]">
                      <div className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">Adeleke Chioma Blessing</div>
                          <div className="text-xs text-slate-300">ADM/2026/014 • Dr. O. Adeleke</div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">ENROLLED</span>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">Bello Ibrahim Danladi</div>
                          <div className="text-xs text-slate-300">ADM/2026/015 • Alh. B. Danladi</div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">ENROLLED</span>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">Okafor Emmanuel Chukwuma</div>
                          <div className="text-xs text-slate-300">ADM/2026/016 • Mrs. N. Okafor</div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">ENROLLED</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <span className="font-bold text-white">1-Tap Roll Call (Class Teacher: JSS 2A)</span>
                      <span className="text-emerald-300 font-semibold text-xs">Morning Session</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-between">
                        <span className="font-semibold text-white">Adeleke Chioma</span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs">PRESENT</span>
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">LATE</span>
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">ABSENT</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-between">
                        <span className="font-semibold text-white">Bello Ibrahim</span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs">PRESENT</span>
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">LATE</span>
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">ABSENT</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-between">
                        <span className="font-semibold text-white">Okafor Emmanuel</span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">PRESENT</span>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-xs shadow-xs">LATE</span>
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs">ABSENT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <span className="font-bold text-white">Continuous Assessment & WAEC Grades</span>
                      <span className="text-slate-300 text-xs">SSS 1 • Mathematics</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Adeleke Chioma Blessing</div>
                        <div className="text-xs text-slate-300">First CA: 18/20 • Second CA: 17/20 • Exam: 54/60</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-400 text-base">89% • A1</div>
                        <div className="text-[11px] text-emerald-300 font-semibold">EXCELLENT</div>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Bello Ibrahim Danladi</div>
                        <div className="text-xs text-slate-300">First CA: 16/20 • Second CA: 15/20 • Exam: 46/60</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-base">77% • B2</div>
                        <div className="text-[11px] text-slate-300 font-semibold">VERY GOOD</div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <span className="font-bold text-white">Tuition Reconciliation Ledger</span>
                      <span className="text-emerald-300 font-semibold text-xs">Audited Entries</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Adeleke Chioma (JSS 2A)</div>
                        <div className="text-xs text-slate-300">Zenith Bank Transfer Verified • Receipt #RC-10492</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-base">₦120,000</div>
                        <div className="text-[11px] text-emerald-300 font-semibold">PAID IN FULL</div>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Okafor Emmanuel (JSS 2A)</div>
                        <div className="text-xs text-slate-300">Part Payment Verified • Balance: ₦30,000</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-base">₦90,000</div>
                        <div className="text-[11px] text-amber-300 font-semibold">PARTIAL</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. BENEFITS SECTION (CSS selector 3 Target: Human Heading) ── */}
      <section className="relative z-10 py-20 md:py-28 border-b border-white/[0.08] bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            {/* CSS selector 3: Human, natural rounded pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-xs">
              <span>Built for everyday school life</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Designed for real schools, not IT departments.
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-normal">
              Practical advantages that genuinely make school administration easier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] hover:border-emerald-400/30 space-y-2.5 transition-all">
              <h3 className="text-lg font-bold text-white">Simple enough for anyone to use</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                If a teacher knows how to send a WhatsApp message, they can take classroom attendance in under 45 seconds. No lengthy training manuals or technical seminars required.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] hover:border-emerald-400/30 space-y-2.5 transition-all">
              <h3 className="text-lg font-bold text-white">Reliable under poor internet conditions</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                When classroom Wi-Fi or mobile data drops, teachers can still mark the register. The app caches entries locally and quietly synchronizes the moment connectivity returns.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] hover:border-emerald-400/30 space-y-2.5 transition-all">
              <h3 className="text-lg font-bold text-white">Hours saved at the end of each term</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                No more late nights adding continuous assessment scores by hand or copying grades onto paper report cards. Results and rankings compile with one click.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] hover:border-emerald-400/30 space-y-2.5 transition-all">
              <h3 className="text-lg font-bold text-white">Transparent fee reconciliation</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Bursars log and verify bank transfers directly into student ledgers. School owners can see total term recovery and outstanding debtors anytime from their own phone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. INSTALLATION SECTION (CSS selector 4 Target: Human Heading) ── */}
      <section id="install-guide" className="relative z-10 py-20 md:py-28 border-b border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            {/* CSS selector 4: Human, natural rounded pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-xs">
              <span>Quick Setup & Installation</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Take SchoolCore with you.
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-normal">
              SchoolCore is a Progressive Web App (PWA). You can install it straight from your browser onto your Android phone, iPhone, or laptop with zero app-store fees and virtually no storage space.
            </p>
          </div>

          {/* Direct Install Trigger if supported */}
          {isInstallable && (
            <div className="p-5 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-400/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl shadow-lg">
              <div>
                <h4 className="font-bold text-white text-base">One-Click Install Available</h4>
                <p className="text-xs sm:text-sm text-emerald-300">Your current browser supports direct home-screen installation.</p>
              </div>
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-md hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                <span>Install SchoolCore Now</span>
              </button>
            </div>
          )}

          {/* Practical Device Tabs: Liquid Glass Card */}
          <div className="bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-white/[0.12] p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-center gap-2 pb-4 border-b border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveInstallTab('android')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeInstallTab === 'android'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android (Chrome)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveInstallTab('ios')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeInstallTab === 'ios'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Apple className="w-4 h-4" />
                <span>iPhone / iPad (Safari)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveInstallTab('desktop')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeInstallTab === 'desktop'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Desktop (PC & Mac)</span>
              </button>
            </div>

            {activeInstallTab === 'android' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.08] space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">1</span>
                  <div className="font-semibold text-white">Open Chrome Menu</div>
                  <p className="text-slate-300 text-xs">Tap the three-dot menu icon in the top-right corner of Google Chrome.</p>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.08] space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">2</span>
                  <div className="font-semibold text-white">Select "Install App"</div>
                  <p className="text-slate-300 text-xs">Tap "Install app" or "Add to Home screen" in the menu list.</p>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.08] space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">3</span>
                  <div className="font-semibold text-white">Launch from Home</div>
                  <p className="text-slate-300 text-xs">SchoolCore will appear as an app icon on your home screen.</p>
                </div>
              </div>
            )}

            {activeInstallTab === 'ios' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.08] space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">1</span>
                  <div className="font-semibold text-white">Tap Share</div>
                  <p className="text-slate-300 text-xs">Tap the Share icon (square with arrow pointing up) at the bottom of Safari.</p>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.08] space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">2</span>
                  <div className="font-semibold text-white">"Add to Home Screen"</div>
                  <p className="text-slate-300 text-xs">Scroll down and tap "Add to Home Screen".</p>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.08] space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">3</span>
                  <div className="font-semibold text-white">Tap Add</div>
                  <p className="text-slate-300 text-xs">Tap Add in the top-right. SchoolCore opens full-screen without browser bars.</p>
                </div>
              </div>
            )}

            {activeInstallTab === 'desktop' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.08] space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">1</span>
                  <div className="font-semibold text-white">Find Install Icon</div>
                  <p className="text-slate-300 text-xs">Look for the install button (computer/plus icon) on the right side of the address bar.</p>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.08] space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">2</span>
                  <div className="font-semibold text-white">Click Install</div>
                  <p className="text-slate-300 text-xs">Click Install in the prompt to add SchoolCore to your desktop.</p>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.08] space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">3</span>
                  <div className="font-semibold text-white">Independent Window</div>
                  <p className="text-slate-300 text-xs">SchoolCore runs as a clean standalone desktop app that can be pinned to your taskbar.</p>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-xs sm:text-sm text-slate-300">
              <span>Automatic background updates • Zero storage footprint</span>
              <button
                type="button"
                onClick={onLaunchApp}
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Or use directly in browser →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FINAL CLOSING STATEMENT ── */}
      <section className="relative z-10 py-20 md:py-28 border-b border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Your school. One simple control room.
          </h2>
          <p className="text-base sm:text-xl text-slate-300 max-w-xl mx-auto leading-relaxed font-normal">
            Replace vulnerable paper registers and manual spreadsheet calculations with software designed specifically for real school operations.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/50 hover:scale-[1.02]"
            >
              <span>Launch SchoolCore</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 8. FOOTER ── */}
      <footer className="relative z-10 py-12 bg-slate-950/80 backdrop-blur-md text-xs sm:text-sm text-slate-300 border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold">
                <School className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white text-base">SchoolCore</span>
                <span className="text-slate-400 ml-2">Digital School Management</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-300">
              <button
                type="button"
                onClick={() => scrollToSection('overview')}
                className="hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('capabilities')}
                className="hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Capabilities
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('demo')}
                className="hover:text-emerald-300 transition-colors cursor-pointer"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('install-guide')}
                className="hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Install
              </button>
              <button
                type="button"
                onClick={onLaunchApp}
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                School Sign In
              </button>
              <button
                type="button"
                onClick={() => setModalContent('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => setModalContent('terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms
              </button>
            </div>

            <div className="text-slate-400 text-xs">
              © {new Date().getFullYear()} SchoolCore. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy & Terms Modal */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 text-slate-200 relative shadow-2xl max-h-[80vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalContent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">
                {modalContent === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
            </div>
            {modalContent === 'privacy' ? (
              <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p>
                  <strong>Data Protection & School Privacy:</strong> SchoolCore guarantees strict tenant isolation. All student records, continuous assessments, attendance rosters, and financial payment entries remain strictly confidential to your provisioned institution.
                </p>
                <p>
                  We do not sell student or staff data to third-party advertisers. All database storage adheres to strict role-based access controls and encrypted session management.
                </p>
                <p>
                  Schools maintain full ownership of all academic data, report cards, and digital signatures generated through the platform.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p>
                  <strong>Terms of Use:</strong> SchoolCore provides cloud-based institutional software for secondary and primary schools. By accessing SchoolCore, schools agree to maintain lawful record-keeping practices.
                </p>
                <p>
                  Administrators are responsible for managing authorized staff access credentials and preserving the integrity of published report cards and fee accounts.
                </p>
                <p>
                  SchoolCore guarantees maximum platform uptime and automated offline fallback mechanisms for uninterrupted classroom operations.
                </p>
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-right">
              <button
                type="button"
                onClick={() => setModalContent(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
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
