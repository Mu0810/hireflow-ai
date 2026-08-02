import { Request, Response } from "express";
import { getCompanyAnalytics, getAdminAnalytics } from "../services/analytics.service";
import { sendError } from "../utils/http";

export async function getCompanyAnalyticsHandler(req: Request, res: Response) {
  try {
    const analytics = await getCompanyAnalytics(req.user!.userId, req.params.companyId as string);
    return res.json({ data: analytics });
  } catch (error) {
    return sendError(res, error, "Failed to fetch analytics");
  }
}

export async function getAdminAnalyticsHandler(req: Request, res: Response) {
  try {
    const analytics = await getAdminAnalytics(req.user!.userId);
    return res.json({ data: analytics });
  } catch (error) {
    return sendError(res, error, "Failed to fetch analytics");
  }
}
