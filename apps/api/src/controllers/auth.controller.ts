import { Request, Response } from "express";
import {
  registerUser,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
} from "../services/auth.service";
import { env } from "../config/env";
import { sendError } from "../utils/http";

const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

export async function register(req: Request, res: Response) {
  try {
    const result = await registerUser(req.body);
    return res.status(201).json({
      message: "Registration successful. Please verify your email.",
      data: result,
    });
  } catch (error) {
    return sendError(res, error, "Registration failed");
  }
}

export async function verifyEmailHandler(req: Request, res: Response) {
  try {
    const { token } = req.body;
    await verifyEmail(token);
    return res.json({ message: "Email verified successfully" });
  } catch (error) {
    return sendError(res, error, "Verification failed");
  }
}

export async function login(req: Request, res: Response) {
  try {
    const result = await loginUser(req.body);
    setRefreshCookie(res, result.refreshToken);
    return res.json({
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    return sendError(res, error, "Login failed", 401);
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }
    const result = await refreshAccessToken(refreshToken);
    return res.json({ data: result });
  } catch (error) {
    return sendError(res, error, "Refresh failed", 401);
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (refreshToken) {
      await logoutUser(refreshToken);
    }
    res.clearCookie("refreshToken");
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    return sendError(res, error, "Logout failed");
  }
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  try {
    await forgotPassword(req.body.email);
    return res.json({ message: "If an account exists, a reset email has been sent" });
  } catch (error) {
    return sendError(res, error, "Request failed");
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const { token, password } = req.body;
    await resetPassword(token, password);
    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    return sendError(res, error, "Reset failed");
  }
}
