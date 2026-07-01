import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from "passport-github2";
import { UserRole, User } from "@prisma/client";
import { prisma } from "./db";
import { env } from "./env";

// Passport's OAuth2 "verified" callback. Typed inline because `passport-oauth2`
// is only a transitive dependency and isn't directly resolvable here.
type OAuthVerifyCallback = (error: unknown, user?: Express.User | false) => void;

/**
 * Maps a Prisma user record to the shape stored on `req.user`
 * (see src/types/express.d.ts). Keeping a single shape across the JWT and
 * OAuth flows lets controllers rely on `req.user.userId` consistently.
 */
function toSessionUser(user: User): Express.User {
  return { userId: user.id, email: user.email, role: user.role };
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
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

      return done(null, toSessionUser(user));
    }
    )
  );
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: `${env.API_URL}/api/auth/github/callback`,
      },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: GitHubProfile,
      done: OAuthVerifyCallback
    ) => {
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

      return done(null, toSessionUser(user));
    }
    )
  );
}

passport.serializeUser((user, done) => done(null, user.userId));
passport.deserializeUser(async (id: string, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user ? toSessionUser(user) : null);
});

export { passport };
