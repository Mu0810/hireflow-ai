import { Request, Response } from "express";
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
    const message = error instanceof Error ? error.message : "Failed to fetch notifications";
    return res.status(400).json({ error: message });
  }
}

export async function getUnreadNotificationsHandler(req: Request, res: Response) {
  try {
    const notifications = await getUnreadNotifications(req.user!.userId);
    return res.json({ data: notifications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch notifications";
    return res.status(400).json({ error: message });
  }
}

export async function markNotificationReadHandler(req: Request, res: Response) {
  try {
    const notification = await markNotificationRead(req.user!.userId, req.params.id);
    return res.json({ data: notification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark notification read";
    return res.status(400).json({ error: message });
  }
}

export async function markAllNotificationsReadHandler(req: Request, res: Response) {
  try {
    await markAllNotificationsRead(req.user!.userId);
    return res.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark notifications read";
    return res.status(400).json({ error: message });
  }
}
