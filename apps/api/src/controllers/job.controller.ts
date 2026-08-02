import { Request, Response } from "express";
import { sendError } from "../utils/http";
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
    return sendError(res, error, "Failed to create job");
  }
}

export async function getCompanyJobsHandler(req: Request, res: Response) {
  try {
    const jobs = await getCompanyJobs(req.params.companyId as string, req.user!.userId);
    return res.json({ data: jobs });
  } catch (error) {
    return sendError(res, error, "Failed to fetch jobs");
  }
}

export async function getOpenJobsHandler(_req: Request, res: Response) {
  try {
    const jobs = await getOpenJobs();
    return res.json({ data: jobs });
  } catch (error) {
    return sendError(res, error, "Failed to fetch jobs");
  }
}

export async function getJobHandler(req: Request, res: Response) {
  try {
    const job = await getJobById(req.params.id as string, req.user?.userId);
    return res.json({ data: job });
  } catch (error) {
    return sendError(res, error, "Failed to fetch job", 404);
  }
}

export async function updateJobHandler(req: Request, res: Response) {
  try {
    const job = await updateJob(req.user!.userId, req.params.id as string, req.body);
    return res.json({ data: job });
  } catch (error) {
    return sendError(res, error, "Failed to update job");
  }
}

export async function applyToJobHandler(req: Request, res: Response) {
  try {
    const application = await applyToJob(req.user!.userId, req.body);
    return res.status(201).json({ data: application });
  } catch (error) {
    return sendError(res, error, "Failed to apply");
  }
}

export async function getMyApplicationsHandler(req: Request, res: Response) {
  try {
    const applications = await getMyApplications(req.user!.userId);
    return res.json({ data: applications });
  } catch (error) {
    return sendError(res, error, "Failed to fetch applications");
  }
}

export async function getJobApplicationsHandler(req: Request, res: Response) {
  try {
    const applications = await getJobApplications(req.user!.userId, req.params.id as string);
    return res.json({ data: applications });
  } catch (error) {
    return sendError(res, error, "Failed to fetch applications");
  }
}

export async function updateApplicationStatusHandler(req: Request, res: Response) {
  try {
    const { applicationId, status } = req.body;
    const application = await updateApplicationStatus(req.user!.userId, applicationId, status as ApplicationStatus);
    return res.json({ data: application });
  } catch (error) {
    return sendError(res, error, "Failed to update application");
  }
}
