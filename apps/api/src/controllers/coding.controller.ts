import { Request, Response } from "express";
import { sendError } from "../utils/http";
import {
  createCodingTest,
  getJobCodingTests,
  getCodingTest,
  startSubmission,
  submitCodingTest,
  getMySubmissions,
  getTestSubmissions,
} from "../services/coding.service";

export async function createCodingTestHandler(req: Request, res: Response) {
  try {
    const test = await createCodingTest(req.user!.userId, req.body);
    return res.status(201).json({ data: test });
  } catch (error) {
    return sendError(res, error, "Failed to create test");
  }
}

export async function getJobCodingTestsHandler(req: Request, res: Response) {
  try {
    const tests = await getJobCodingTests(req.user!.userId, req.params.jobId as string);
    return res.json({ data: tests });
  } catch (error) {
    return sendError(res, error, "Failed to fetch tests");
  }
}

export async function getCodingTestHandler(req: Request, res: Response) {
  try {
    const test = await getCodingTest(req.user!.userId, req.params.id as string);
    return res.json({ data: test });
  } catch (error) {
    return sendError(res, error, "Failed to fetch test");
  }
}

export async function startSubmissionHandler(req: Request, res: Response) {
  try {
    const submission = await startSubmission(req.user!.userId, req.params.id as string);
    return res.json({ data: submission });
  } catch (error) {
    return sendError(res, error, "Failed to start test");
  }
}

export async function submitCodingTestHandler(req: Request, res: Response) {
  try {
    const submission = await submitCodingTest(req.user!.userId, req.body);
    return res.json({ data: submission });
  } catch (error) {
    return sendError(res, error, "Failed to submit test");
  }
}

export async function getMySubmissionsHandler(req: Request, res: Response) {
  try {
    const submissions = await getMySubmissions(req.user!.userId, req.params.jobId as string);
    return res.json({ data: submissions });
  } catch (error) {
    return sendError(res, error, "Failed to fetch submissions");
  }
}

export async function getTestSubmissionsHandler(req: Request, res: Response) {
  try {
    const submissions = await getTestSubmissions(req.user!.userId, req.params.id as string);
    return res.json({ data: submissions });
  } catch (error) {
    return sendError(res, error, "Failed to fetch submissions");
  }
}
