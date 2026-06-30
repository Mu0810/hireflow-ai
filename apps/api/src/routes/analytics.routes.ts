import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getCompanyAnalyticsHandler,
  getAdminAnalyticsHandler,
} from "../controllers/analytics.controller";

const router = Router();

router.get("/companies/:companyId", authenticate, getCompanyAnalyticsHandler);
router.get("/admin", authenticate, getAdminAnalyticsHandler);

export default router;
