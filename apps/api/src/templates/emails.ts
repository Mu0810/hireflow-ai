import { env } from "../config/env";

export function verificationEmailHtml(token: string): string {
  const link = `${env.WEB_URL}/verify-email?token=${token}`;
  return `
    <h1>Verify your email</h1>
    <p>Click the link below to verify your email address:</p>
    <a href="${link}">${link}</a>
    <p>This link expires in 24 hours.</p>
  `;
}

export function passwordResetEmailHtml(token: string): string {
  const link = `${env.WEB_URL}/reset-password?token=${token}`;
  return `
    <h1>Reset your password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${link}">${link}</a>
    <p>This link expires in 1 hour.</p>
  `;
}
