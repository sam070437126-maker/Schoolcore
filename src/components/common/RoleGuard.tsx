import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NavTab } from '../layout/Sidebar.tsx';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles?: string[];
  tabName: string;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  tabName,
  onNavigateHome,
  children,
}) => {
  const { role, isSuperAdmin, isAdmin } = useAuth();

  const normalizedRole = (role || '').toUpperCase();
  const isEffectiveAdmin =
    isSuperAdmin ||
    isAdmin ||
    normalizedRole === 'ADMIN' ||
    normalizedRole === 'SCHOOL_ADMIN' ||
    normalizedRole === 'SUPER_ADMIN' ||
    normalizedRole === 'DEVELOPER' ||
    normalizedRole === 'PRODUCT_MANAGER' ||
    normalizedRole === 'PRODUCT_DESIGNER';

  // Super Admin and Admin role users have unrestricted CRUD permissions across school workspaces
  if (isEffectiveAdmin) {
    return <>{children}</>;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toUpperCase());
    const isAllowed =
      normalizedAllowedRoles.includes(normalizedRole) ||
      (normalizedAllowedRoles.includes('ADMIN') && (normalizedRole === 'ADMIN' || normalizedRole === 'SCHOOL_ADMIN')) ||
      (normalizedAllowedRoles.includes('SCHOOL_ADMIN') && (normalizedRole === 'ADMIN' || normalizedRole === 'SCHOOL_ADMIN'));

    if (!isAllowed) {
      return (
        <div id="role-guard-blocked" className="p-8 max-w-lg mx-auto text-center bg-white border border-slate-200 rounded-2xl shadow-xs mt-10 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Feature Access Separated</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The <strong>{tabName}</strong> module is separated for other operational roles and is not assigned to your current role (<span className="font-semibold text-slate-900">{role}</span>).
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to My Workspace</span>
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
