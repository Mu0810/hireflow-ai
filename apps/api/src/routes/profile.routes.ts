import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { getMyProfile, updateMyProfile } from "../controllers/profile.controller";
import { updateProfileSchema } from "@hireflow/shared";

const router = Router();

router.get("/me", authenticate, getMyProfile);
router.patch("/me", authenticate, validate(updateProfileSchema), updateMyProfile);

export default router;
