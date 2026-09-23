import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PWAInstallButton } from '../common/PWAInstallButton.tsx';
import {
  School as SchoolIcon,
  LogOut,
  Menu,
  Globe,
} from 'lucide-react';

interface HeaderProps {
  onOpenSidebar?: () => void;
  onToggleSidebar?: () => void;
  onOpenAuthModal?: () => void;
  onViewWebsite?: () => void;
  activeTab?: string;
  onSelectTab?: (tab: any, extra?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onToggleSidebar,
  onOpenAuthModal,
  onViewWebsite,
  activeTab,
  onSelectTab,
}) => {
  const { user, school, membership, logout, isSuperAdmin, isInSchoolWorkspace, exitSchoolWorkspace } = useAuth();

  return (
    <header id="main-header" className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
      {/* Left side: Mobile Menu Button + School Brand */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="mobile-menu-toggle"
          onClick={onOpenSidebar || onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            <SchoolIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {school?.name || 'SchoolCore'}
              </h1>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                {school?.current_term?.replace('_', ' ') || 'First Term'}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate hidden xs:block">
              {school?.code ? `${school.code} • ` : ''}Lightweight Operations OS
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Profile Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {isSuperAdmin && isInSchoolWorkspace && school && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-semibold text-emerald-800 truncate max-w-[150px]">{school.name}</span>
            <button
              type="button"
              onClick={() => exitSchoolWorkspace?.()}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 underline cursor-pointer ml-1"
              title="Return to platform control"
            >
              Exit
            </button>
          </div>
        )}
        {onViewWebsite && (
          <button
            type="button"
            onClick={onViewWebsite}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="View public SchoolCore website"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Public Site</span>
          </button>
        )}
        <PWAInstallButton />

        {/* User Account / Sign in button */}
        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{user.full_name}</p>
              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                {membership?.role?.replace('_', ' ') || 'USER'}
              </span>
            </div>
            <button
              id="logout-btn"
              onClick={logout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            id="open-auth-btn"
            onClick={onOpenAuthModal}
            className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            Sign In / Onboard
          </button>
        )}
      </div>
    </header>
  );
};
