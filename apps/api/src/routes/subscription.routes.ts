import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  getCompanySubscriptionHandler,
  updateCompanySubscriptionHandler,
  createReferralHandler,
  getMyReferralsHandler,
  getCompanyReferralsHandler,
  updateReferralHandler,
} from "../controllers/subscription.controller";
import {
  createReferralSchema,
  updateReferralSchema,
  updateSubscriptionSchema,
} from "@hireflow/shared";

const router = Router();

router.get("/companies/:companyId", authenticate, getCompanySubscriptionHandler);
router.patch(
  "/companies/:companyId",
  authenticate,
  validate(updateSubscriptionSchema),
  updateCompanySubscriptionHandler
);
router.post("/referrals", authenticate, validate(createReferralSchema), createReferralHandler);
router.get("/referrals/my", authenticate, getMyReferralsHandler);
router.get("/referrals/companies/:companyId", authenticate, getCompanyReferralsHandler);
router.patch("/referrals/:id", authenticate, validate(updateReferralSchema), updateReferralHandler);

export default router;
