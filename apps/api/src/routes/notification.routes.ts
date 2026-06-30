import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getMyNotificationsHandler,
  getUnreadNotificationsHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler,
} from "../controllers/notification.controller";

const router = Router();

router.get("/", authenticate, getMyNotificationsHandler);
router.get("/unread", authenticate, getUnreadNotificationsHandler);
router.patch("/:id/read", authenticate, markNotificationReadHandler);
router.patch("/read-all", authenticate, markAllNotificationsReadHandler);

export default router;
