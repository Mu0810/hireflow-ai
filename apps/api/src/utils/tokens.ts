import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// `expiresIn` comes from env as a plain string (e.g. "15m"), while
// @types/jsonwebtoken expects the narrower `number | StringValue` type.
const accessTokenOptions: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
};

const refreshTokenOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
};

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, accessTokenOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshTokenOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
