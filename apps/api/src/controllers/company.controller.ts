import { Request, Response } from "express";
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
    const message = error instanceof Error ? error.message : "Failed to create company";
    return res.status(400).json({ error: message });
  }
}

export async function getMyCompaniesHandler(req: Request, res: Response) {
  try {
    const companies = await getUserCompanies(req.user!.userId);
    return res.json({ data: companies });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch companies";
    return res.status(400).json({ error: message });
  }
}

export async function getCompanyHandler(req: Request, res: Response) {
  try {
    const company = await getCompanyById(req.params.id, req.user!.userId);
    return res.json({ data: company });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch company";
    return res.status(404).json({ error: message });
  }
}

export async function updateCompanyHandler(req: Request, res: Response) {
  try {
    const company = await updateCompany(req.params.id, req.user!.userId, req.body);
    return res.json({ data: company });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update company";
    return res.status(400).json({ error: message });
  }
}

export async function inviteMemberHandler(req: Request, res: Response) {
  try {
    await inviteMember(req.params.id, req.user!.userId, req.body);
    return res.json({ message: "Invitation sent" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send invite";
    return res.status(400).json({ error: message });
  }
}

export async function acceptInviteHandler(req: Request, res: Response) {
  try {
    await acceptInvite(req.body.token, req.user!.userId);
    return res.json({ message: "Invite accepted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept invite";
    return res.status(400).json({ error: message });
  }
}

export async function removeMemberHandler(req: Request, res: Response) {
  try {
    await removeMember(req.params.id, req.params.memberId, req.user!.userId);
    return res.json({ message: "Member removed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove member";
    return res.status(400).json({ error: message });
  }
}

export async function updateMemberRoleHandler(req: Request, res: Response) {
  try {
    await updateMemberRole(req.params.id, req.user!.userId, req.body.memberId, req.body.role as CompanyMemberRole);
    return res.json({ message: "Role updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update role";
    return res.status(400).json({ error: message });
  }
}
