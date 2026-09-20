'use server';

import { z } from 'zod';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  teams,
  teamMembers,
  activityLogs,
  type NewUser,
  type NewTeam,
  type NewTeamMember,
  type NewActivityLog,
  ActivityType,
  invitations
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser
} from '@/lib/auth/middleware';

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || ''
  };
  await db.insert(activityLogs).values(newActivity);
}

async function getTeamMemberRole(userId: number, teamId: number) {
  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(
      and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId))
    )
    .limit(1);

  return membership?.role ?? null;
}

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const userWithTeam = await db
    .select({
      user: users,
      team: teams
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  if (userWithTeam.length === 0) {
    return {
      error: 'Invalid email or password. Please try again.',
      email
    };
  }

  const { user: foundUser, team: foundTeam } = userWithTeam[0];

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email
    };
  }

  await Promise.all([
    setSession(foundUser),
    logActivity(foundTeam?.id, foundUser.id, ActivityType.SIGN_IN)
  ]);

  const redirectTo = formData.get('redirect');
  if (
    typeof redirectTo === 'string' &&
    redirectTo.startsWith('/') &&
    !redirectTo.startsWith('//')
  ) {
    redirect(redirectTo);
  }

  redirect('/dashboard');
});

const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(100),
  inviteId: z.string().optional()
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, inviteId } = data;

  let parsedInviteId: number | null = null;
  if (inviteId) {
    if (!/^\d+$/.test(inviteId)) {
      return { error: 'Invalid or expired invitation.', email };
    }

    parsedInviteId = Number(inviteId);
    if (!Number.isSafeInteger(parsedInviteId) || parsedInviteId <= 0) {
      return { error: 'Invalid or expired invitation.', email };
    }

    const [invitation] = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(
          eq(invitations.id, parsedInviteId),
          eq(invitations.email, email),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (!invitation) {
      return { error: 'Invalid or expired invitation.', email };
    }
  }

  const passwordHash = await hashPassword(password);

  let createdUser: User;
  try {
    const result = await db.transaction(async (tx) => {
      const existingUser = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error('USER_EXISTS');
      }

      const newUser: NewUser = {
        email,
        passwordHash,
        role: parsedInviteId ? 'member' : 'owner'
      };
      const [insertedUser] = await tx.insert(users).values(newUser).returning();
      if (!insertedUser) throw new Error('SIGNUP_FAILED');

      let joinedTeamId: number;
      let userRole: string;
      if (parsedInviteId) {
        const [claimedInvitation] = await tx
          .update(invitations)
          .set({ status: 'accepted' })
          .where(
            and(
              eq(invitations.id, parsedInviteId),
              eq(invitations.email, email),
              eq(invitations.status, 'pending')
            )
          )
          .returning({ teamId: invitations.teamId, role: invitations.role });

        if (!claimedInvitation) throw new Error('INVITATION_UNAVAILABLE');
        joinedTeamId = claimedInvitation.teamId;
        userRole = claimedInvitation.role;
      } else {
        const [createdTeam] = await tx
          .insert(teams)
          .values({ name: `${email}'s Team` } satisfies NewTeam)
          .returning({ id: teams.id });
        if (!createdTeam) throw new Error('TEAM_CREATE_FAILED');
        joinedTeamId = createdTeam.id;
        userRole = 'owner';
      }

      await tx.insert(teamMembers).values({
        userId: insertedUser.id,
        teamId: joinedTeamId,
        role: userRole
      } satisfies NewTeamMember);

      await tx.insert(activityLogs).values([
        {
          teamId: joinedTeamId,
          userId: insertedUser.id,
          action: ActivityType.SIGN_UP,
          ipAddress: ''
        },
        {
          teamId: joinedTeamId,
          userId: insertedUser.id,
          action: parsedInviteId
            ? ActivityType.ACCEPT_INVITATION
            : ActivityType.CREATE_TEAM,
          ipAddress: ''
        }
      ] satisfies NewActivityLog[]);

      return { user: insertedUser };
    });

    createdUser = result.user;
  } catch (error) {
    console.error('Sign-up transaction failed', error);
    return { error: 'Failed to create user. Please try again.', email };
  }

  await setSession(createdUser);

  const redirectTo = formData.get('redirect');
  if (
    typeof redirectTo === 'string' &&
    redirectTo.startsWith('/') &&
    !redirectTo.startsWith('//')
  ) {
    redirect(redirectTo);
  }

  redirect('/dashboard');
});

export async function signOut() {
  const user = await getUser();
  if (user) {
    const userWithTeam = await getUserWithTeam(user.id);
    await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_OUT);
  }
  (await cookies()).delete('session');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        error: 'Current password is incorrect.'
      };
    }

    if (currentPassword === newPassword) {
      return {
        error: 'New password must be different from the current password.'
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        error: 'New password and confirmation password do not match.'
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD)
    ]);

    return {
      success: 'Password updated successfully.'
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100)
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        error: 'Incorrect password. Account deletion failed.'
      };
    }

    const userWithTeam = await getUserWithTeam(user.id);

    await logActivity(
      userWithTeam?.teamId,
      user.id,
      ActivityType.DELETE_ACCOUNT
    );

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')` // Ensure email uniqueness
      })
      .where(eq(users.id, user.id));

    if (userWithTeam?.teamId) {
      await db
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.userId, user.id),
            eq(teamMembers.teamId, userWithTeam.teamId)
          )
        );
    }

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email address')
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), sql`${users.id} <> ${user.id}`))
      .limit(1);

    if (existingUser) {
      return { name, error: 'That email address is already in use.' };
    }

    await Promise.all([
      db
        .update(users)
        .set({ name, email, updatedAt: new Date() })
        .where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT)
    ]);

    return { name, success: 'Account updated successfully.' };
  }
);

const removeTeamMemberSchema = z.object({
  memberId: z.number()
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const actorRole = await getTeamMemberRole(user.id, userWithTeam.teamId);
    if (actorRole !== 'owner' && actorRole !== 'admin') {
      return { error: 'Only team owners or admins can remove members.' };
    }

    const [target] = await db
      .select({ userId: teamMembers.userId, role: teamMembers.role })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.id, memberId),
          eq(teamMembers.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (!target) {
      return { error: 'Team member not found.' };
    }

    if (target.userId === user.id || target.role === 'owner') {
      return { error: 'The team owner cannot be removed.' };
    }

    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.id, memberId),
          eq(teamMembers.teamId, userWithTeam.teamId)
        )
      );

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.REMOVE_TEAM_MEMBER
    );

    return { success: 'Team member removed successfully' };
  }
);

const inviteTeamMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(255),
  role: z.enum(['member', 'owner'])
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const actorRole = await getTeamMemberRole(user.id, userWithTeam.teamId);
    if (actorRole !== 'owner' && actorRole !== 'admin') {
      return { error: 'Only team owners or admins can invite members.' };
    }

    if (role === 'owner' && actorRole !== 'owner') {
      return { error: 'Only the team owner can invite another owner.' };
    }

    const existingMember = await db
      .select()
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(
        and(eq(users.email, email), eq(teamMembers.teamId, userWithTeam.teamId))
      )
      .limit(1);

    if (existingMember.length > 0) {
      return { error: 'User is already a member of this team' };
    }

    // Check if there's an existing invitation
    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.teamId, userWithTeam.teamId),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return { error: 'An invitation has already been sent to this email' };
    }

    // Create a new invitation
    await db.insert(invitations).values({
      teamId: userWithTeam.teamId,
      email,
      role,
      invitedBy: user.id,
      status: 'pending'
    });

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.INVITE_TEAM_MEMBER
    );

    // TODO: Send invitation email and include ?inviteId={id} to sign-up URL
    // await sendInvitationEmail(email, userWithTeam.team.name, role)

    return { success: 'Invitation sent successfully' };
  }
);
