import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { prisma } from "../config/db";

const router = Router();

router.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ data: user });
});

export default router;
