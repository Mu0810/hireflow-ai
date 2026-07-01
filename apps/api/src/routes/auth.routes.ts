import { Router } from "express";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { passport } from "../config/passport";
import { generateAccessToken, generateRefreshToken } from "../utils/tokens";
import {
  register,
  verifyEmailHandler,
  login,
  refresh,
  logout,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import {
  registerSchema,
  verifyEmailSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@hireflow/shared";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmailHandler);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordHandler);
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordHandler);

const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: any, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

async function oauthCallback(req: any, res: any) {
  const user = req.user as { userId: string; email: string; role: string };
  const payload = {
    userId: user.userId,
    email: user.email,
    role: user.role,
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.session.create({
    data: {
      userId: user.userId,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_COOKIE_MAX_AGE),
    },
  });

  setRefreshCookie(res, refreshToken);

  const redirectUrl = new URL("/auth/callback", env.WEB_URL);
  redirectUrl.searchParams.set("token", accessToken);
  res.redirect(redirectUrl.toString());
}

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  oauthCallback
);

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/login" }),
  oauthCallback
);

export default router;
