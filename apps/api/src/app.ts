import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { passport } from "./config/passport";
import { rateLimiter, authRateLimiter } from "./middleware/rate-limiter";
import { AppError } from "./utils/errors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import companyRoutes from "./routes/company.routes";
import profileRoutes from "./routes/profile.routes";
import jobRoutes from "./routes/job.routes";
import codingRoutes from "./routes/coding.routes";
import interviewRoutes from "./routes/interview.routes";
import notificationRoutes from "./routes/notification.routes";
import analyticsRoutes from "./routes/analytics.routes";
import subscriptionRoutes from "./routes/subscription.routes";

const app = express();

app.use(helmet());
app.use(passport.initialize() as unknown as express.RequestHandler);
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(rateLimiter());
app.use(
  cors({
    origin: env.WEB_URL,
    credentials: true,
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRateLimiter(), authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Unmatched routes. Without this, Express falls back to its default handler and
// answers an API call with an HTML error page, which a JSON client cannot parse.
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

// Terminal error handler. An AppError is a deliberate, user-facing failure and
// carries its own status code. Anything else is unexpected: log it server-side
// and return a generic 500 rather than leaking internals to the client.
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }

    console.error(err instanceof Error ? err.stack : err);
    return res.status(500).json({ error: "Internal server error" });
  }
);

export { app };
