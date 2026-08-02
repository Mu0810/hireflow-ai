import { Request, Response } from "express";
import { getOrCreateProfile, updateProfile } from "../services/profile.service";
import { sendError } from "../utils/http";

export async function getMyProfile(req: Request, res: Response) {
  try {
    const profile = await getOrCreateProfile(req.user!.userId);
    return res.json({ data: profile });
  } catch (error) {
    return sendError(res, error, "Failed to fetch profile");
  }
}

export async function updateMyProfile(req: Request, res: Response) {
  try {
    const profile = await updateProfile(req.user!.userId, req.body);
    return res.json({ data: profile });
  } catch (error) {
    return sendError(res, error, "Failed to update profile");
  }
}
