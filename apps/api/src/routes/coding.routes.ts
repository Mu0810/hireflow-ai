import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createCodingTestHandler,
  getJobCodingTestsHandler,
  getCodingTestHandler,
  startSubmissionHandler,
  submitCodingTestHandler,
  getMySubmissionsHandler,
  getTestSubmissionsHandler,
} from "../controllers/coding.controller";
import { createCodingTestSchema, submitCodingTestSchema } from "@hireflow/shared";

const router = Router();

router.post("/tests", authenticate, validate(createCodingTestSchema), createCodingTestHandler);
router.get("/jobs/:jobId/tests", authenticate, getJobCodingTestsHandler);
router.get("/tests/:id", authenticate, getCodingTestHandler);
router.post("/tests/:id/start", authenticate, startSubmissionHandler);
router.post("/tests/:id/submit", authenticate, validate(submitCodingTestSchema), submitCodingTestHandler);
router.get("/jobs/:jobId/submissions", authenticate, getMySubmissionsHandler);
router.get("/tests/:id/submissions", authenticate, getTestSubmissionsHandler);

export default router;
