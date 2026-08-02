import { Request, Response } from "express";
import { sendError } from "../utils/http";
import {
  getMyNotifications,
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notification.service";

export async function getMyNotificationsHandler(req: Request, res: Response) {
  try {
    const notifications = await getMyNotifications(req.user!.userId);
    return res.json({ data: notifications });
  } catch (error) {
    return sendError(res, error, "Failed to fetch notifications");
  }
}

export async function getUnreadNotificationsHandler(req: Request, res: Response) {
  try {
    const notifications = await getUnreadNotifications(req.user!.userId);
    return res.json({ data: notifications });
  } catch (error) {
    return sendError(res, error, "Failed to fetch notifications");
  }
}

export async function markNotificationReadHandler(req: Request, res: Response) {
  try {
    const notification = await markNotificationRead(req.user!.userId, req.params.id as string);
    return res.json({ data: notification });
  } catch (error) {
    return sendError(res, error, "Failed to mark notification read");
  }
}

export async function markAllNotificationsReadHandler(req: Request, res: Response) {
  try {
    await markAllNotificationsRead(req.user!.userId);
    return res.json({ data: { success: true } });
  } catch (error) {
    return sendError(res, error, "Failed to mark notifications read");
  }
}
