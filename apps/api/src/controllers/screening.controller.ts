import { Request, Response } from "express";
import { screenApplication, getApplicationScreening } from "../services/screening.service";
import { sendError } from "../utils/http";

export async function screenApplicationHandler(req: Request, res: Response) {
  try {
    const application = await screenApplication(req.user!.userId, req.params.id as string);
    return res.json({ data: application });
  } catch (error) {
    return sendError(res, error, "Failed to screen application");
  }
}

export async function getApplicationScreeningHandler(req: Request, res: Response) {
  try {
    const screening = await getApplicationScreening(req.user!.userId, req.params.id as string);
    return res.json({ data: screening });
  } catch (error) {
    return sendError(res, error, "Failed to fetch screening");
  }
}
