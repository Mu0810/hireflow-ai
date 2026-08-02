import { Request, Response } from "express";
import { sendError } from "../utils/http";
import { CompanyMemberRole } from "@prisma/client";
import {
  createCompany,
  getUserCompanies,
  getCompanyById,
  updateCompany,
  inviteMember,
  acceptInvite,
  removeMember,
  updateMemberRole,
} from "../services/company.service";

export async function createCompanyHandler(req: Request, res: Response) {
  try {
    const company = await createCompany(req.user!.userId, req.body);
    return res.status(201).json({ data: company });
  } catch (error) {
    return sendError(res, error, "Failed to create company");
  }
}

export async function getMyCompaniesHandler(req: Request, res: Response) {
  try {
    const companies = await getUserCompanies(req.user!.userId);
    return res.json({ data: companies });
  } catch (error) {
    return sendError(res, error, "Failed to fetch companies");
  }
}

export async function getCompanyHandler(req: Request, res: Response) {
  try {
    const company = await getCompanyById(req.params.id as string, req.user!.userId);
    return res.json({ data: company });
  } catch (error) {
    return sendError(res, error, "Failed to fetch company", 404);
  }
}

export async function updateCompanyHandler(req: Request, res: Response) {
  try {
    const company = await updateCompany(req.params.id as string, req.user!.userId, req.body);
    return res.json({ data: company });
  } catch (error) {
    return sendError(res, error, "Failed to update company");
  }
}

export async function inviteMemberHandler(req: Request, res: Response) {
  try {
    await inviteMember(req.params.id as string, req.user!.userId, req.body);
    return res.json({ message: "Invitation sent" });
  } catch (error) {
    return sendError(res, error, "Failed to send invite");
  }
}

export async function acceptInviteHandler(req: Request, res: Response) {
  try {
    await acceptInvite(req.body.token, req.user!.userId);
    return res.json({ message: "Invite accepted" });
  } catch (error) {
    return sendError(res, error, "Failed to accept invite");
  }
}

export async function removeMemberHandler(req: Request, res: Response) {
  try {
    await removeMember(req.params.id as string, req.params.memberId as string, req.user!.userId);
    return res.json({ message: "Member removed" });
  } catch (error) {
    return sendError(res, error, "Failed to remove member");
  }
}

export async function updateMemberRoleHandler(req: Request, res: Response) {
  try {
    await updateMemberRole(req.params.id as string, req.user!.userId, req.body.memberId, req.body.role as CompanyMemberRole);
    return res.json({ message: "Role updated" });
  } catch (error) {
    return sendError(res, error, "Failed to update role");
  }
}
