import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { passport } from "./config/passport";
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

const app = express();

app.use(helmet());
app.use(passport.initialize());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: env.WEB_URL,
    credentials: true,
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

export { app };
