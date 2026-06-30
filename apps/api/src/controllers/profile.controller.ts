import { Request, Response } from "express";
import { getOrCreateProfile, updateProfile } from "../services/profile.service";

export async function getMyProfile(req: Request, res: Response) {
  try {
    const profile = await getOrCreateProfile(req.user!.userId);
    return res.json({ data: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile";
    return res.status(400).json({ error: message });
  }
}

export async function updateMyProfile(req: Request, res: Response) {
  try {
    const profile = await updateProfile(req.user!.userId, req.body);
    return res.json({ data: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return res.status(400).json({ error: message });
  }
}
