import { Request, Response } from "express";
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
    const message = error instanceof Error ? error.message : "Failed to create test";
    return res.status(400).json({ error: message });
  }
}

export async function getJobCodingTestsHandler(req: Request, res: Response) {
  try {
    const tests = await getJobCodingTests(req.user!.userId, req.params.jobId);
    return res.json({ data: tests });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch tests";
    return res.status(400).json({ error: message });
  }
}

export async function getCodingTestHandler(req: Request, res: Response) {
  try {
    const test = await getCodingTest(req.user!.userId, req.params.id);
    return res.json({ data: test });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch test";
    return res.status(400).json({ error: message });
  }
}

export async function startSubmissionHandler(req: Request, res: Response) {
  try {
    const submission = await startSubmission(req.user!.userId, req.params.id);
    return res.json({ data: submission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start test";
    return res.status(400).json({ error: message });
  }
}

export async function submitCodingTestHandler(req: Request, res: Response) {
  try {
    const submission = await submitCodingTest(req.user!.userId, req.body);
    return res.json({ data: submission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit test";
    return res.status(400).json({ error: message });
  }
}

export async function getMySubmissionsHandler(req: Request, res: Response) {
  try {
    const submissions = await getMySubmissions(req.user!.userId, req.params.jobId);
    return res.json({ data: submissions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch submissions";
    return res.status(400).json({ error: message });
  }
}

export async function getTestSubmissionsHandler(req: Request, res: Response) {
  try {
    const submissions = await getTestSubmissions(req.user!.userId, req.params.id);
    return res.json({ data: submissions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch submissions";
    return res.status(400).json({ error: message });
  }
}
