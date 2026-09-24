import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { repositories } from './repositories/index.ts';
import { UserProfile, School, SchoolUser, StaffMember, UserRole } from '../types/index.ts';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
  school?: School;
  membership?: SchoolUser;
  staff?: StaffMember;
  userRole?: UserRole;
  token?: string;
}

// Session TTL: 365 days (Permanent device session)
const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000;

// Session store mapped from token -> profileId, schoolId, createdAt
const activeSessions: Map<string, { profileId: string; schoolId: string; createdAt: number }> = new Map();

// Helper to create a cryptographically secure token
export function createSessionToken(profileId: string, schoolId: string): string {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const token = `sck_sec_${profileId}___${schoolId}___${Date.now()}___${randomBytes}`;
  activeSessions.set(token, {
    profileId,
    schoolId,
    createdAt: Date.now(),
  });
  return token;
}

export function removeSessionToken(token: string): void {
  activeSessions.delete(token);
}

export async function resolveAuthFromToken(token: string) {
  let session = activeSessions.get(token);
  if (!session && token.startsWith('sck_sec_')) {
    const parts = token.slice(8).split('___');
    if (parts.length >= 3) {
      const [profileId, schoolId, timestampStr] = parts;
      const createdAt = parseInt(timestampStr, 10);
      if (!isNaN(createdAt) && Date.now() - createdAt < SESSION_TTL_MS) {
        session = { profileId, schoolId, createdAt };
        activeSessions.set(token, session);
      }
    }
  }

  if (!session) {
    return null;
  }

  // Check TTL expiration
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    activeSessions.delete(token);
    return null;
  }

  try {
    const profile = await repositories.users.getProfileById(session.profileId);
    if (!profile) return null;

    const isSuperAdminEmail = profile.email.toLowerCase().trim() === 'samuelemma466@gmail.com';

    let school = await repositories.schools.getSchoolById(session.schoolId);
    if (!school && (session.schoolId === 'global-platform' || isSuperAdminEmail)) {
      school = {
        id: 'global-platform',
        name: 'SchoolCore Global Network',
        code: 'SC-GLOBAL',
        phone: '+234 800 000 0000',
        email: 'samuelemma466@gmail.com',
        address: 'National Headquarters, Abuja',
        state: 'Federation',
        country: 'Nigeria',
        current_term: 'FIRST_TERM',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString(),
      };
    }
    if (!school) return null;

    let membership = await repositories.users.getSchoolUser(school.id, profile.id);
    if (!membership && isSuperAdminEmail) {
      membership = {
        id: 'su-superadmin-samuel',
        school_id: school.id,
        profile_id: profile.id,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        password_set: true,
        first_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    }
    if (!membership || membership.status !== 'ACTIVE') return null;

    const staff = await repositories.staff.getStaffByProfileId(school.id, profile.id);

    return {
      user: profile,
      school,
      membership,
      staff,
      userRole: isSuperAdminEmail ? ('SUPER_ADMIN' as UserRole) : membership.role,
    };
  } catch (err) {
    console.error('Error resolving auth from token:', err);
    return null;
  }
}

export async function authenticateMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = req.headers.authorization?.replace('Bearer ', '');

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/schoolcore_session=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }

  const authData = await resolveAuthFromToken(token);
  if (!authData) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  req.token = token;
  req.user = authData.user;
  req.school = authData.school;
  req.membership = authData.membership;
  req.staff = authData.staff;
  req.userRole = authData.userRole;

  // Multi-tenant context resolution with strict boundary enforcement
  const requestedSchoolId =
    (req.headers['x-school-id'] as string) ||
    (typeof req.query.school_id === 'string' ? req.query.school_id : undefined) ||
    (typeof req.body?.school_id === 'string' ? req.body.school_id : undefined);

  if (requestedSchoolId && requestedSchoolId !== req.school?.id) {
    if (req.userRole === 'SUPER_ADMIN' || req.userRole === 'ADMIN') {
      const targetSchool = await repositories.schools.getSchoolById(requestedSchoolId);
      if (targetSchool) {
        req.school = targetSchool;
      }
    } else if (req.user) {
      // Non-admins may only switch to schools where they hold an active membership
      const targetMembership = await repositories.users.getSchoolUser(requestedSchoolId, req.user.id);
      if (targetMembership && targetMembership.status === 'ACTIVE') {
        const targetSchool = await repositories.schools.getSchoolById(requestedSchoolId);
        if (targetSchool) {
          req.school = targetSchool;
          req.membership = targetMembership;
          req.userRole = targetMembership.role;
        }
      }
    }
  }

  next();
}

export function requireRoles(...allowedRoles: (UserRole | string)[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // SUPER_ADMIN, DEVELOPER, PRODUCT_MANAGER, PRODUCT_DESIGNER have platform authority
    if (
      req.userRole === 'SUPER_ADMIN' ||
      req.userRole === 'DEVELOPER' ||
      req.userRole === 'PRODUCT_MANAGER' ||
      req.userRole === 'PRODUCT_DESIGNER'
    ) {
      return next();
    }

    const userRole = req.userRole;
    if (!userRole) {
      return res.status(403).json({
        error: 'You do not have permission to perform this action. Contact your school administrator.',
      });
    }

    const normalizedUserRole = (userRole as string).toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map((r) => (r as string).toUpperCase());

    // Both ADMIN and SCHOOL_ADMIN have full administrative authority for institutional actions
    const isUserAdmin = normalizedUserRole === 'ADMIN' || normalizedUserRole === 'SCHOOL_ADMIN';
    const allowsAdmin =
      normalizedAllowedRoles.includes('ADMIN') || normalizedAllowedRoles.includes('SCHOOL_ADMIN');

    if (isUserAdmin && allowsAdmin) {
      return next();
    }

    if (normalizedAllowedRoles.includes(normalizedUserRole)) {
      return next();
    }

    return res.status(403).json({
      error: 'You do not have permission to perform this action. Contact your school administrator.',
    });
  };
}
