import { Request, Response } from "express";
import { sendError } from "../utils/http";
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
    return sendError(res, error, "Failed to schedule interview");
  }
}

export async function getInterviewHandler(req: Request, res: Response) {
  try {
    const interview = await getInterview(req.user!.userId, req.params.id as string);
    return res.json({ data: interview });
  } catch (error) {
    return sendError(res, error, "Failed to fetch interview");
  }
}

export async function getMyInterviewsHandler(req: Request, res: Response) {
  try {
    const interviews = await getMyInterviews(req.user!.userId);
    return res.json({ data: interviews });
  } catch (error) {
    return sendError(res, error, "Failed to fetch interviews");
  }
}

export async function updateInterviewHandler(req: Request, res: Response) {
  try {
    const interview = await updateInterview(req.user!.userId, req.params.id as string, req.body);
    return res.json({ data: interview });
  } catch (error) {
    return sendError(res, error, "Failed to update interview");
  }
}

export async function sendMessageHandler(req: Request, res: Response) {
  try {
    const message = await sendMessage(req.user!.userId, req.body);
    return res.status(201).json({ data: message });
  } catch (error) {
    return sendError(res, error, "Failed to send message");
  }
}
