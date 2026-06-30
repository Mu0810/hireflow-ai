import { UserRole } from "@prisma/client";
import { prisma } from "../config/db";
import { hashPassword, verifyPassword } from "../utils/password";
import { sendEmail } from "../utils/email";
import { verificationEmailHtml, passwordResetEmailHtml } from "../templates/emails";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens";
import { RegisterInput, LoginInput } from "@hireflow/shared";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      role: input.role as UserRole,
      passwordHash,
    },
  });

  const verificationToken = await prisma.verificationToken.create({
    data: {
      email: user.email,
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  await sendEmail({
    to: user.email,
    subject: "Verify your HireFlow AI account",
    html: verificationEmailHtml(verificationToken.token),
  });

  return { userId: user.id, email: user.email };
}

export async function verifyEmail(token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new Error("Invalid or expired token");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: true },
    }),
    prisma.verificationToken.delete({
      where: { token },
    }),
  ]);

  return { success: true };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.passwordHash) {
    throw new Error("Invalid credentials");
  }

  if (!user.emailVerified) {
    throw new Error("Please verify your email before logging in");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new Error("Invalid or expired refresh token");
  }

  const payload = verifyRefreshToken(refreshToken);
  const accessToken = generateAccessToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  });

  return { accessToken };
}

export async function logoutUser(refreshToken: string) {
  await prisma.session.delete({
    where: { refreshToken },
  });
  return { success: true };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { success: true };
  }

  const existing = await prisma.passwordReset.findFirst({
    where: { email },
  });

  if (existing) {
    await prisma.passwordReset.delete({ where: { id: existing.id } });
  }

  const resetToken = await prisma.passwordReset.create({
    data: {
      email,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
    },
  });

  await sendEmail({
    to: email,
    subject: "Reset your HireFlow AI password",
    html: passwordResetEmailHtml(resetToken.token),
  });

  return { success: true };
}

export async function resetPassword(token: string, password: string) {
  const record = await prisma.passwordReset.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new Error("Invalid or expired token");
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { passwordHash },
    }),
    prisma.passwordReset.delete({ where: { token } }),
  ]);

  return { success: true };
}
