import { Request, Response } from "express";
import { screenApplication, getApplicationScreening } from "../services/screening.service";

export async function screenApplicationHandler(req: Request, res: Response) {
  try {
    const application = await screenApplication(req.user!.userId, req.params.id);
    return res.json({ data: application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to screen application";
    return res.status(400).json({ error: message });
  }
}

export async function getApplicationScreeningHandler(req: Request, res: Response) {
  try {
    const screening = await getApplicationScreening(req.user!.userId, req.params.id);
    return res.json({ data: screening });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch screening";
    return res.status(400).json({ error: message });
  }
}
