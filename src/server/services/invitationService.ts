import crypto from 'crypto';
import { db } from '../db.ts';
import { repositories } from '../repositories/index.ts';
import { broadcastRealtimeUpdate } from '../../lib/supabase-realtime.ts';
import { createSessionToken } from '../auth.ts';
import { AdminInvitation, UserProfile, SchoolUser, StaffMember, UserRole } from '../../types/index.ts';

export interface CreateInvitationInput {
  email: string;
  role: UserRole;
  fullName?: string;
  baseUrl?: string;
}

export interface ActorContext {
  id: string;
  full_name: string;
  role: UserRole;
}

export class InvitationService {
  /**
   * Generates a cryptographically secure token and stores an invitation.
   * Automates the transactional invitation email via simulated Edge Function (Resend/SendGrid).
   */
  static async createInvitation(
    schoolId: string,
    input: CreateInvitationInput,
    actor: ActorContext
  ): Promise<AdminInvitation> {
    const email = input.email.trim().toLowerCase();
    const role = input.role;

    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid institutional or personal email address.');
    }

    // 1. Verify that user doesn't already have an active profile
    const existingProfile = await repositories.users.getProfileByEmail(email);
    if (existingProfile) {
      const existingMemberships = await repositories.users.getSchoolUsersByProfileId(existingProfile.id);
      const isMemberOfThisSchool = existingMemberships.some((m) => m.school_id === schoolId);
      if (isMemberOfThisSchool) {
        throw new Error(`A registered user with email "${email}" is already active in this institution.`);
      }
    }

    // 2. Check for existing pending invitation for this school & email
    const allInvites = await repositories.invitations.getInvitations(schoolId);
    const existingInvite = allInvites.find(
      (inv) => inv.email.toLowerCase() === email && (inv.status === 'INVITED' || inv.status === 'PENDING')
    );

    const randomSuffix = crypto.randomBytes(16).toString('hex');
    const token = `inv_tok_${role.toLowerCase()}_${randomSuffix}`;
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours TTL
    const nowIso = new Date().toISOString();

    const host = input.baseUrl || '';
    const inviteLink = `${host}/?invite_token=${token}`;

    let invitation: AdminInvitation;

    if (existingInvite) {
      // Refresh existing invitation
      const updated = await repositories.invitations.updateInvitation(existingInvite.id, {
        invitation_token: token,
        invite_link: inviteLink,
        role,
        expires_at: expiresAt,
        status: 'INVITED',
        invited_by_id: actor.id,
        invited_by_name: actor.full_name,
      });
      invitation = updated!;
    } else {
      const newInvite: AdminInvitation = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        school_id: schoolId,
        email,
        role,
        status: 'INVITED',
        invited_by_id: actor.id,
        invited_by_name: actor.full_name,
        invitation_token: token,
        invite_link: inviteLink,
        expires_at: expiresAt,
        created_at: nowIso,
      };
      invitation = await repositories.invitations.createInvitation(newInvite);
    }

    // 3. Automated Edge Function Email Dispatch Simulation (Resend/SendGrid)
    const school = await repositories.schools.getSchoolById(schoolId);
    const schoolName = school?.name || 'SchoolCore';

    console.info(`\n[EMAIL] ==================== SUPABASE EDGE FUNCTION (RESEND) ====================`);
    console.info(`[Invitation Dispatch] To: ${email}`);
    console.info(`[Subject] Invitation to join ${schoolName} as ${role}`);
    console.info(`[From] ${schoolName} Portal <invitations@schoolcore.ng>`);
    console.info(`[One-Time Link] ${inviteLink}`);
    console.info(`[Expires] 72 Hours (${new Date(expiresAt).toUTCString()})`);
    console.info(`============================================================================\n`);

    // 4. Audit Log
    await repositories.auditLogs.addAuditLog({
      school_id: schoolId,
      actor_id: actor.id,
      actor_name: actor.full_name,
      actor_role: actor.role,
      action: 'ADMIN_INVITATION_SENT',
      entity: 'AdminInvitation',
      entity_id: invitation.id,
      details: `Dispatched institutional invite to ${email} with role ${role} (Valid for 72h)`,
    });

    // 5. Broadcast Realtime
    broadcastRealtimeUpdate('invitations', 'INSERT', {
      new: invitation,
      schoolId,
    });

    return invitation;
  }

  /**
   * Validates a one-time invitation token without consuming it.
   */
  static async verifyInvitationToken(token: string): Promise<{
    valid: boolean;
    invitation?: AdminInvitation;
    schoolName?: string;
    schoolId?: string;
    reason?: string;
  }> {
    if (!token || token.trim().length === 0) {
      return { valid: false, reason: 'Missing invitation verification token.' };
    }

    const invitation = await repositories.invitations.getInvitationByToken(token.trim());
    if (!invitation) {
      return { valid: false, reason: 'Invalid or unrecognized invitation token. Please check the link or contact your school.' };
    }

    if (invitation.status === 'JOINED') {
      return {
        valid: false,
        reason: 'This invitation has already been accepted and activated. Please sign in with your credentials.',
      };
    }

    if (invitation.status === 'EXPIRED' || new Date(invitation.expires_at).getTime() < Date.now()) {
      if (invitation.status !== 'EXPIRED') {
        await repositories.invitations.updateInvitation(invitation.id, { status: 'EXPIRED' });
      }
      return {
        valid: false,
        reason: 'This invitation link has expired. Please contact your school administrator to request a new invitation.',
      };
    }

    const school = await repositories.schools.getSchoolById(invitation.school_id);

    return {
      valid: true,
      invitation,
      schoolName: school?.name || 'SchoolCore',
      schoolId: invitation.school_id,
    };
  }

  /**
   * Completes the invitation registration:
   * - Validates token.
   * - Decouples public sign-up: aborts if invitation is invalid or missing.
   * - Hydrates user credentials into active `profiles`, `schoolUsers`, and `staff` tables.
   * - Marks invitation as `JOINED`.
   * - Produces a fresh authenticated session.
   */
  static async acceptInvitation(
    token: string,
    fullName: string,
    password: string
  ): Promise<{
    token: string;
    user: UserProfile;
    school: any;
    membership: SchoolUser;
    staff?: StaffMember;
  }> {
    const verification = await this.verifyInvitationToken(token);
    if (!verification.valid || !verification.invitation) {
      throw new Error(verification.reason || 'Invitation validation failed.');
    }

    const invite = verification.invitation;
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      throw new Error('Please enter your complete full name.');
    }
    if (!password || password.length < 6) {
      throw new Error('Please choose a password with at least 6 characters.');
    }

    const nowIso = new Date().toISOString();
    const schoolId = invite.school_id;
    const school = await repositories.schools.getSchoolById(schoolId);
    if (!school) {
      throw new Error('Associated school record not found.');
    }

    // 1. Create Profile
    const profileId = `usr-inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newProfile: UserProfile = {
      id: profileId,
      email: invite.email.toLowerCase(),
      full_name: trimmedName,
      password_hash: password,
      created_at: nowIso,
    };

    const createdProfile = await repositories.users.createProfile(newProfile);

    // 2. Hydrate School User Role
    const membershipId = `schusr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const membership: SchoolUser = {
      id: membershipId,
      school_id: schoolId,
      profile_id: profileId,
      role: invite.role,
      status: 'ACTIVE',
      created_at: nowIso,
    };

    const createdMembership = await repositories.users.createSchoolUser(membership);

    // 3. Hydrate Staff Record if Role is Teacher, Bursar, or Administrative
    let createdStaff: StaffMember | undefined = undefined;
    if (
      invite.role === 'TEACHER' ||
      invite.role === 'BURSAR' ||
      invite.role === 'SCHOOL_ADMIN' ||
      invite.role === 'PRINCIPAL'
    ) {
      const staffId = `stf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const staffRecord: StaffMember = {
        id: staffId,
        school_id: schoolId,
        profile_id: profileId,
        employee_id: `STF/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
        full_name: trimmedName,
        email: invite.email.toLowerCase(),
        phone: '+234 800 000 0000',
        role: invite.role,
        status: 'ACTIVE',
        created_at: nowIso,
      };
      createdStaff = await repositories.staff.createStaff(staffRecord);
    }

    // 4. Update Invitation to JOINED
    await repositories.invitations.updateInvitation(invite.id, {
      status: 'JOINED',
      joined_at: nowIso,
    });

    // 5. Generate Session Token
    const sessionToken = createSessionToken(profileId, schoolId);

    // 6. Record Audit Log
    await repositories.auditLogs.addAuditLog({
      school_id: schoolId,
      actor_id: profileId,
      actor_name: trimmedName,
      actor_role: invite.role,
      action: 'INVITATION_HYDRATED',
      entity: 'AdminInvitation',
      entity_id: invite.id,
      details: `Account successfully verified and activated as ${invite.role} via secure invitation link`,
    });

    // 7. Broadcast Realtime
    broadcastRealtimeUpdate('invitations', 'UPDATE', {
      new: { ...invite, status: 'JOINED', joined_at: nowIso },
      schoolId,
    });

    return {
      token: sessionToken,
      user: createdProfile,
      school,
      membership: createdMembership,
      staff: createdStaff,
    };
  }

  /**
   * Resends an invitation with refreshed expiry and new secure link.
   */
  static async resendInvitation(
    schoolId: string,
    invitationId: string,
    actor: ActorContext,
    baseUrl?: string
  ): Promise<AdminInvitation> {
    const invite = await repositories.invitations.getInvitationById(schoolId, invitationId);
    if (!invite) {
      throw new Error('Invitation record could not be found.');
    }

    const randomSuffix = crypto.randomBytes(16).toString('hex');
    const token = `inv_tok_${invite.role.toLowerCase()}_${randomSuffix}`;
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const host = baseUrl || '';
    const inviteLink = `${host}/?invite_token=${token}`;

    const updated = await repositories.invitations.updateInvitation(invite.id, {
      invitation_token: token,
      invite_link: inviteLink,
      expires_at: expiresAt,
      status: 'INVITED',
      invited_by_id: actor.id,
      invited_by_name: actor.full_name,
    });

    const school = await repositories.schools.getSchoolById(schoolId);
    const schoolName = school?.name || 'SchoolCore';

    console.info(`\n[EMAIL] ==================== SUPABASE EDGE FUNCTION (RESEND) ====================`);
    console.info(`[Invitation Re-dispatch] To: ${invite.email}`);
    console.info(`[Subject] Reminded: Invitation to join ${schoolName} as ${invite.role}`);
    console.info(`[One-Time Link] ${inviteLink}`);
    console.info(`[Expires] 72 Hours (${new Date(expiresAt).toUTCString()})`);
    console.info(`============================================================================\n`);

    await repositories.auditLogs.addAuditLog({
      school_id: schoolId,
      actor_id: actor.id,
      actor_name: actor.full_name,
      actor_role: actor.role,
      action: 'ADMIN_INVITATION_RESENT',
      entity: 'AdminInvitation',
      entity_id: invite.id,
      details: `Re-sent institutional invite to ${invite.email} with refreshed 72h token`,
    });

    broadcastRealtimeUpdate('invitations', 'UPDATE', {
      new: updated,
      schoolId,
    });

    return updated!;
  }

  /**
   * Revokes or deletes a pending invitation.
   */
  static async revokeInvitation(
    schoolId: string,
    invitationId: string,
    actor: ActorContext
  ): Promise<boolean> {
    const invite = await repositories.invitations.getInvitationById(schoolId, invitationId);
    if (!invite) return false;

    const success = await repositories.invitations.deleteInvitation(invitationId);

    if (success) {
      await repositories.auditLogs.addAuditLog({
        school_id: schoolId,
        actor_id: actor.id,
        actor_name: actor.full_name,
        actor_role: actor.role,
        action: 'ADMIN_INVITATION_REVOKED',
        entity: 'AdminInvitation',
        entity_id: invitationId,
        details: `Revoked pending invitation for ${invite.email} (${invite.role})`,
      });

      broadcastRealtimeUpdate('invitations', 'DELETE', {
        old: invite,
        schoolId,
      });
    }

    return success;
  }
}
