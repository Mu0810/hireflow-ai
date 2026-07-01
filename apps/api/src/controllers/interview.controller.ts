import { Request, Response } from "express";
import {
  createInterview,
  getInterview,
  getMyInterviews,
  updateInterview,
  sendMessage,
} from "../services/interview.service";

export async function createInterviewHandler(req: Request, res: Response) {
  try {
    const interview = await createInterview(req.user!.userId, req.body);
    return res.status(201).json({ data: interview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to schedule interview";
    return res.status(400).json({ error: message });
  }
}

export async function getInterviewHandler(req: Request, res: Response) {
  try {
    const interview = await getInterview(req.user!.userId, req.params.id as string);
    return res.json({ data: interview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch interview";
    return res.status(400).json({ error: message });
  }
}

export async function getMyInterviewsHandler(req: Request, res: Response) {
  try {
    const interviews = await getMyInterviews(req.user!.userId);
    return res.json({ data: interviews });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch interviews";
    return res.status(400).json({ error: message });
  }
}

export async function updateInterviewHandler(req: Request, res: Response) {
  try {
    const interview = await updateInterview(req.user!.userId, req.params.id as string, req.body);
    return res.json({ data: interview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update interview";
    return res.status(400).json({ error: message });
  }
}

export async function sendMessageHandler(req: Request, res: Response) {
  try {
    const message = await sendMessage(req.user!.userId, req.body);
    return res.status(201).json({ data: message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send message";
    return res.status(400).json({ error: message });
  }
}
