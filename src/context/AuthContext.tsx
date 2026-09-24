import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, School, SchoolUser, StaffMember, UserRole } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../lib/api.ts';
import { broadcastRealtimeUpdate } from '../lib/supabase-realtime.ts';
import { getSupabaseClient } from '../lib/supabaseClient.ts';
import { signInWithGoogleOAuth as performGoogleOAuth, GoogleOAuthOptions } from '../lib/supabaseAuth.ts';

interface AuthContextType {
  user: UserProfile | null;
  school: School | null;
  membership: SchoolUser | null;
  staff: StaffMember | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<any>;
  verifyFirstTimeOtp: (payload: { email: string; otp: string; newPassword?: string }) => Promise<any>;
  signup: (payload: any) => Promise<void>;
  register: (payload: any) => Promise<void>;
  googleLogin: (payload: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
    googleUid?: string;
    idToken?: string;
  }) => Promise<void>;
  signInWithGoogleOAuth: (options?: GoogleOAuthOptions) => Promise<any>;
  registerWithInvitation: (payload: { token: string; fullName: string; password: string }) => Promise<void>;
  demoLogin?: (role: string, schoolId?: string) => Promise<void>;
  switchUser?: (profileId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateSchoolContext: (school: School) => void;
  switchSchoolContext?: (school: School | null) => void;
  enterSchoolWorkspace?: (school: School) => void;
  exitSchoolWorkspace?: () => void;
  isInSchoolWorkspace?: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isTeacher: boolean;
  isPrincipal: boolean;
  isAcademicCoordinator: boolean;
  isRegistrar: boolean;
  isParent: boolean;
  isBursar: boolean;
  isDeveloper: boolean;
  isProductManager: boolean;
  isProductDesigner: boolean;
  isPlatformStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [membership, setMembership] = useState<SchoolUser | null>(null);
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInSchoolWorkspace, setIsInSchoolWorkspace] = useState<boolean>(() => {
    return localStorage.getItem('schoolcore_in_school_workspace') === 'true';
  });

  const refreshAuth = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setSchool(null);
      setMembership(null);
      setStaff(null);
      setIsInSchoolWorkspace(false);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setMembership(data.membership);
      setStaff(data.staff || null);

      // If user is super admin or admin and was inspecting a school workspace
      const savedSchoolId = localStorage.getItem('schoolcore_active_school_id');
      const savedWorkspaceFlag = localStorage.getItem('schoolcore_in_school_workspace') === 'true';

      const userRoleUpper = (data.membership?.role || '').toUpperCase();
      if ((userRoleUpper === 'SUPER_ADMIN' || userRoleUpper === 'ADMIN') && savedWorkspaceFlag && savedSchoolId) {
        try {
          const schRes = await api.getSchools();
          const target = schRes.schools?.find((s) => s.id === savedSchoolId);
          if (target) {
            setSchool(target);
            setIsInSchoolWorkspace(true);
          } else {
            setSchool(data.school);
            setIsInSchoolWorkspace(true);
          }
        } catch {
          setSchool(data.school);
          setIsInSchoolWorkspace(true);
        }
      } else {
        setSchool(data.school);
        if (userRoleUpper !== 'SUPER_ADMIN') {
          setIsInSchoolWorkspace(true);
        }
      }
    } catch (err: any) {
      const isAuthRevoked =
        err?.status === 401 ||
        err?.message?.includes('401') ||
        err?.message?.includes('Invalid or expired') ||
        err?.message?.includes('expired');

      if (isAuthRevoked) {
        console.warn('Session explicitly invalidated by server. Clearing session:', err);
        clearStoredToken();
        setUser(null);
        setSchool(null);
        setMembership(null);
        setStaff(null);
      } else {
        console.warn('Temporary connection notice during session refresh. Retaining active session:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();

    // Listen to Supabase Auth state changes for Google OAuth callbacks / sessions
    const supabase = getSupabaseClient();

    // Check existing session in case already populated by URL hash/code
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email && !getStoredToken()) {
        const u = session.user;
        try {
          const gName = (u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0]) as string;
          const gAvatar = (u.user_metadata?.avatar_url || u.user_metadata?.picture) as string | undefined;
          const res = await api.googleLogin({
            email: u.email,
            fullName: gName,
            avatarUrl: gAvatar,
            googleUid: u.id,
            idToken: session.access_token,
          });
          setStoredToken(res.token);
          setUser(res.user);
          setSchool(res.school);
          setMembership(res.membership);
          setStaff(res.staff || null);
          broadcastRealtimeUpdate('profiles', 'SYNC', { new: res.user, schoolId: res.school.id });
        } catch (e) {
          console.warn('[Supabase Auth Init] Session sync notice:', e);
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user?.email) {
        const u = session.user;
        const currentToken = getStoredToken();
        if (!user || user.email.toLowerCase() !== u.email?.toLowerCase() || !currentToken) {
          try {
            const gName = (u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0]) as string;
            const gAvatar = (u.user_metadata?.avatar_url || u.user_metadata?.picture) as string | undefined;
            const res = await api.googleLogin({
              email: u.email,
              fullName: gName,
              avatarUrl: gAvatar,
              googleUid: u.id,
              idToken: session.access_token,
            });
            setStoredToken(res.token);
            setUser(res.user);
            setSchool(res.school);
            setMembership(res.membership);
            setStaff(res.staff || null);
            broadcastRealtimeUpdate('profiles', 'SYNC', { new: res.user, schoolId: res.school.id });
          } catch (e) {
            console.warn('[Supabase Auth Listener] Auto-sync notice:', e);
          }
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [refreshAuth]);

  const signInWithGoogleOAuth = async (options?: GoogleOAuthOptions) => {
    return performGoogleOAuth(options);
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      if (res.requiresOtp) {
        return res;
      }
      if (res.token && res.user && res.school && res.membership) {
        setStoredToken(res.token);
        setUser(res.user);
        setSchool(res.school);
        setMembership(res.membership);
        setStaff(res.staff || null);
        broadcastRealtimeUpdate('profiles', 'SYNC', { new: res.user, schoolId: res.school.id });
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyFirstTimeOtp = async (payload: { email: string; otp: string; newPassword?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.verifyFirstTimeOtp(payload);
      if (res.token && res.user && res.school && res.membership) {
        setStoredToken(res.token);
        setUser(res.user);
        setSchool(res.school);
        setMembership(res.membership);
        setStaff(res.staff || null);
        broadcastRealtimeUpdate('profiles', 'SYNC', { new: res.user, schoolId: res.school.id });
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (payload: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
    googleUid?: string;
    idToken?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.googleLogin(payload);
      setStoredToken(res.token);
      setUser(res.user);
      setSchool(res.school);
      setMembership(res.membership);
      setStaff(res.staff || null);
      broadcastRealtimeUpdate('profiles', 'SYNC', { new: res.user, schoolId: res.school.id });
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.signup(payload);
      setStoredToken(res.token);
      setUser(res.user);
      setSchool(res.school);
      setMembership(res.membership);
      setStaff(res.staff || null);
      broadcastRealtimeUpdate('profiles', 'INSERT', { new: res.user, schoolId: res.school.id });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      setStoredToken(res.token);
      setUser(res.user);
      setSchool(res.school);
      setMembership(res.membership);
      setStaff(res.staff || null);
      broadcastRealtimeUpdate('profiles', 'INSERT', { new: res.user, schoolId: res.school.id });
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithInvitation = async (payload: { token: string; fullName: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.registerWithInvitation(payload);
      setStoredToken(res.token);
      setUser(res.user);
      setSchool(res.school);
      setMembership(res.membership);
      setStaff(res.staff || null);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async () => {
    throw new Error('Demo accounts have been permanently cleared. Please sign in with your institutional account.');
  };

  const switchUser = async () => {
    throw new Error('Demo accounts have been permanently cleared. Please sign in with your institutional account.');
  };

  const updateSchoolContext = (updatedSchool: School) => {
    setSchool(updatedSchool);
  };

  const switchSchoolContext = (targetSchool: School | null) => {
    if (targetSchool) {
      localStorage.setItem('schoolcore_active_school_id', targetSchool.id);
      localStorage.setItem('schoolcore_in_school_workspace', 'true');
      setSchool(targetSchool);
      setIsInSchoolWorkspace(true);
    } else {
      localStorage.removeItem('schoolcore_active_school_id');
      localStorage.removeItem('schoolcore_in_school_workspace');
      setSchool(null);
      setIsInSchoolWorkspace(false);
    }
  };

  const enterSchoolWorkspace = (targetSchool: School) => {
    switchSchoolContext(targetSchool);
  };

  const exitSchoolWorkspace = () => {
    localStorage.removeItem('schoolcore_in_school_workspace');
    setIsInSchoolWorkspace(false);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('schoolcore_active_school_id');
    localStorage.removeItem('schoolcore_in_school_workspace');
    setIsInSchoolWorkspace(false);
    clearStoredToken();
    setUser(null);
    setSchool(null);
    setMembership(null);
    setStaff(null);
  };

  const role = membership?.role || null;
  const normalizedRole = (role || '').toUpperCase();
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN';
  const isDeveloper = normalizedRole === 'DEVELOPER';
  const isProductManager = normalizedRole === 'PRODUCT_MANAGER';
  const isProductDesigner = normalizedRole === 'PRODUCT_DESIGNER';
  const isPlatformStaff = isDeveloper || isProductManager || isProductDesigner;
  const isAdmin = isSuperAdmin || normalizedRole === 'SCHOOL_ADMIN' || normalizedRole === 'ADMIN' || isPlatformStaff;
  const isPrincipal = normalizedRole === 'PRINCIPAL';
  const isAcademicCoordinator = normalizedRole === 'ACADEMIC_COORDINATOR';
  const isRegistrar = normalizedRole === 'REGISTRAR';
  const isTeacher = normalizedRole === 'TEACHER';
  const isParent = normalizedRole === 'PARENT';
  const isBursar = normalizedRole === 'BURSAR';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        school,
        membership,
        staff,
        role,
        isLoading,
        isAuthenticated,
        login,
        verifyFirstTimeOtp,
        signup,
        register,
        googleLogin,
        signInWithGoogleOAuth,
        registerWithInvitation,
        demoLogin,
        switchUser,
        logout,
        refreshAuth,
        updateSchoolContext,
        switchSchoolContext,
        enterSchoolWorkspace,
        exitSchoolWorkspace,
        isInSchoolWorkspace,
        isAdmin,
        isSuperAdmin,
        isTeacher,
        isPrincipal,
        isAcademicCoordinator,
        isRegistrar,
        isParent,
        isBursar,
        isDeveloper,
        isProductManager,
        isProductDesigner,
        isPlatformStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
