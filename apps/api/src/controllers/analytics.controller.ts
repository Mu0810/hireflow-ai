import { Request, Response } from "express";
import { getCompanyAnalytics, getAdminAnalytics } from "../services/analytics.service";

export async function getCompanyAnalyticsHandler(req: Request, res: Response) {
  try {
    const analytics = await getCompanyAnalytics(req.user!.userId, req.params.companyId);
    return res.json({ data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch analytics";
    return res.status(400).json({ error: message });
  }
}

export async function getAdminAnalyticsHandler(req: Request, res: Response) {
  try {
    const analytics = await getAdminAnalytics(req.user!.userId);
    return res.json({ data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch analytics";
    return res.status(400).json({ error: message });
  }
}
