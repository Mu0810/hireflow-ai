import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createInterviewHandler,
  getInterviewHandler,
  getMyInterviewsHandler,
  updateInterviewHandler,
  sendMessageHandler,
} from "../controllers/interview.controller";
import {
  createInterviewSchema,
  updateInterviewSchema,
  sendMessageSchema,
} from "@hireflow/shared";

const router = Router();

router.post("/", authenticate, validate(createInterviewSchema), createInterviewHandler);
router.get("/my", authenticate, getMyInterviewsHandler);
router.get("/:id", authenticate, getInterviewHandler);
router.patch("/:id", authenticate, validate(updateInterviewSchema), updateInterviewHandler);
router.post("/messages", authenticate, validate(sendMessageSchema), sendMessageHandler);

export default router;
