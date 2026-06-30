import { Request, Response } from "express";
import { ApplicationStatus } from "@prisma/client";
import {
  createJob,
  getCompanyJobs,
  getOpenJobs,
  getJobById,
  updateJob,
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
} from "../services/job.service";

export async function createJobHandler(req: Request, res: Response) {
  try {
    const job = await createJob(req.user!.userId, req.body);
    return res.status(201).json({ data: job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create job";
    return res.status(400).json({ error: message });
  }
}

export async function getCompanyJobsHandler(req: Request, res: Response) {
  try {
    const jobs = await getCompanyJobs(req.params.companyId, req.user!.userId);
    return res.json({ data: jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch jobs";
    return res.status(400).json({ error: message });
  }
}

export async function getOpenJobsHandler(_req: Request, res: Response) {
  try {
    const jobs = await getOpenJobs();
    return res.json({ data: jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch jobs";
    return res.status(400).json({ error: message });
  }
}

export async function getJobHandler(req: Request, res: Response) {
  try {
    const job = await getJobById(req.params.id, req.user?.userId);
    return res.json({ data: job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch job";
    return res.status(404).json({ error: message });
  }
}

export async function updateJobHandler(req: Request, res: Response) {
  try {
    const job = await updateJob(req.user!.userId, req.params.id, req.body);
    return res.json({ data: job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update job";
    return res.status(400).json({ error: message });
  }
}

export async function applyToJobHandler(req: Request, res: Response) {
  try {
    const application = await applyToJob(req.user!.userId, req.body);
    return res.status(201).json({ data: application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply";
    return res.status(400).json({ error: message });
  }
}

export async function getMyApplicationsHandler(req: Request, res: Response) {
  try {
    const applications = await getMyApplications(req.user!.userId);
    return res.json({ data: applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch applications";
    return res.status(400).json({ error: message });
  }
}

export async function getJobApplicationsHandler(req: Request, res: Response) {
  try {
    const applications = await getJobApplications(req.user!.userId, req.params.id);
    return res.json({ data: applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch applications";
    return res.status(400).json({ error: message });
  }
}

export async function updateApplicationStatusHandler(req: Request, res: Response) {
  try {
    const { applicationId, status } = req.body;
    const application = await updateApplicationStatus(req.user!.userId, applicationId, status as ApplicationStatus);
    return res.json({ data: application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update application";
    return res.status(400).json({ error: message });
  }
}
