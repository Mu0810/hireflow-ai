import { Request, Response } from "express";
import { sendError } from "../utils/http";
import {
  getCompanySubscription,
  updateCompanySubscription,
  createReferral,
  getMyReferrals,
  getCompanyReferrals,
  updateReferral,
} from "../services/subscription.service";

export async function getCompanySubscriptionHandler(req: Request, res: Response) {
  try {
    const subscription = await getCompanySubscription(req.user!.userId, req.params.companyId as string);
    return res.json({ data: subscription });
  } catch (error) {
    return sendError(res, error, "Failed to fetch subscription");
  }
}

export async function updateCompanySubscriptionHandler(req: Request, res: Response) {
  try {
    const subscription = await updateCompanySubscription(
      req.user!.userId,
      req.params.companyId as string,
      req.body
    );
    return res.json({ data: subscription });
  } catch (error) {
    return sendError(res, error, "Failed to update subscription");
  }
}

export async function createReferralHandler(req: Request, res: Response) {
  try {
    const referral = await createReferral(req.user!.userId, req.body);
    return res.status(201).json({ data: referral });
  } catch (error) {
    return sendError(res, error, "Failed to create referral");
  }
}

export async function getMyReferralsHandler(req: Request, res: Response) {
  try {
    const referrals = await getMyReferrals(req.user!.userId);
    return res.json({ data: referrals });
  } catch (error) {
    return sendError(res, error, "Failed to fetch referrals");
  }
}

export async function getCompanyReferralsHandler(req: Request, res: Response) {
  try {
    const referrals = await getCompanyReferrals(req.user!.userId, req.params.companyId as string);
    return res.json({ data: referrals });
  } catch (error) {
    return sendError(res, error, "Failed to fetch referrals");
  }
}

export async function updateReferralHandler(req: Request, res: Response) {
  try {
    const referral = await updateReferral(req.user!.userId, req.params.id as string, req.body);
    return res.json({ data: referral });
  } catch (error) {
    return sendError(res, error, "Failed to update referral");
  }
}
