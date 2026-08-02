import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createJobHandler,
  getOpenJobsHandler,
  getJobHandler,
  updateJobHandler,
  applyToJobHandler,
  getMyApplicationsHandler,
  getJobApplicationsHandler,
  updateApplicationStatusHandler,
} from "../controllers/job.controller";
import {
  screenApplicationHandler,
  getApplicationScreeningHandler,
} from "../controllers/screening.controller";
import {
  createJobSchema,
  updateJobSchema,
  applyToJobSchema,
  updateApplicationStatusSchema,
} from "@hireflow/shared";

const router = Router();

// Express matches routes in registration order, so every literal path segment
// must be registered BEFORE "/:id". Otherwise a request to
// PATCH /api/jobs/applications/status is captured by "/:id" with id="applications".

// --- Literal paths ---
router.get("/", getOpenJobsHandler);
router.post("/", authenticate, validate(createJobSchema), createJobHandler);
router.get("/my", authenticate, getMyApplicationsHandler);
router.post("/apply", authenticate, validate(applyToJobSchema), applyToJobHandler);
router.patch(
  "/applications/status",
  authenticate,
  validate(updateApplicationStatusSchema),
  updateApplicationStatusHandler
);
router.post("/applications/:id/screen", authenticate, screenApplicationHandler);
router.get("/applications/:id/screen", authenticate, getApplicationScreeningHandler);

// --- Parameterised paths ---
router.get("/:id", authenticate, getJobHandler);
router.patch("/:id", authenticate, validate(updateJobSchema), updateJobHandler);
router.get("/:id/applications", authenticate, getJobApplicationsHandler);

export default router;
