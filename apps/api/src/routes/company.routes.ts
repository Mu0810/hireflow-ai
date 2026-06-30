import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createCompanyHandler,
  getMyCompaniesHandler,
  getCompanyHandler,
  updateCompanyHandler,
  inviteMemberHandler,
  acceptInviteHandler,
  removeMemberHandler,
  updateMemberRoleHandler,
} from "../controllers/company.controller";
import {
  createCompanySchema,
  updateCompanySchema,
  inviteMemberSchema,
  acceptInviteSchema,
  updateMemberRoleSchema,
} from "@hireflow/shared";

const router = Router();

router.post("/", authenticate, validate(createCompanySchema), createCompanyHandler);
router.get("/my", authenticate, getMyCompaniesHandler);
router.get("/:id", authenticate, getCompanyHandler);
router.patch("/:id", authenticate, validate(updateCompanySchema), updateCompanyHandler);
router.post("/:id/invite", authenticate, validate(inviteMemberSchema), inviteMemberHandler);
router.post("/accept-invite", authenticate, validate(acceptInviteSchema), acceptInviteHandler);
router.delete("/:id/members/:memberId", authenticate, removeMemberHandler);
router.patch("/:id/members/role", authenticate, validate(updateMemberRoleSchema), updateMemberRoleHandler);

export default router;
