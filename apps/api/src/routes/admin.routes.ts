import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const router = Router();

router.get("/dashboard", authenticate, authorize("SUPER_ADMIN"), (_req, res) => {
  return res.json({ message: "Admin dashboard data" });
});

export default router;
