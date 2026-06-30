import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createJobHandler,
  getCompanyJobsHandler,
  getOpenJobsHandler,
  getJobHandler,
  updateJobHandler,
  applyToJobHandler,
  getMyApplicationsHandler,
  getJobApplicationsHandler,
  updateApplicationStatusHandler,
} from "../controllers/job.controller";
import {
  createJobSchema,
  updateJobSchema,
  applyToJobSchema,
  updateApplicationStatusSchema,
} from "@hireflow/shared";

const router = Router();

router.get("/", getOpenJobsHandler);
router.get("/my", authenticate, getMyApplicationsHandler);
router.get("/:id", authenticate, getJobHandler);
router.patch("/:id", authenticate, validate(updateJobSchema), updateJobHandler);
router.get("/:id/applications", authenticate, getJobApplicationsHandler);
router.post("/", authenticate, validate(createJobSchema), createJobHandler);
router.post("/apply", authenticate, validate(applyToJobSchema), applyToJobHandler);
router.patch("/applications/status", authenticate, validate(updateApplicationStatusSchema), updateApplicationStatusHandler);

export default router;
