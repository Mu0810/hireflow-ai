import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { UserRole } from "@prisma/client";
import { prisma } from "./db";
import { env } from "./env";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: `${env.API_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error("No email from Google"));
      }

      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            emailVerified: true,
            role: UserRole.CANDIDATE,
          },
        });
      }

      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: profile.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          provider: "google",
          providerAccountId: profile.id,
        },
      });

      return done(null, user);
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID || "",
      clientSecret: env.GITHUB_CLIENT_SECRET || "",
      callbackURL: `${env.API_URL}/api/auth/github/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;

      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: profile.displayName || profile.username,
            avatarUrl: profile.photos?.[0]?.value,
            emailVerified: true,
            role: UserRole.CANDIDATE,
          },
        });
      }

      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "github",
            providerAccountId: profile.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          provider: "github",
          providerAccountId: profile.id,
        },
      });

      return done(null, user);
    }
  )
);

passport.serializeUser((user, done) => done(null, (user as any).id));
passport.deserializeUser(async (id: string, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});

export { passport };
