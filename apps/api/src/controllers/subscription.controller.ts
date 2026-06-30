import { Request, Response } from "express";
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
    const subscription = await getCompanySubscription(req.user!.userId, req.params.companyId);
    return res.json({ data: subscription });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch subscription";
    return res.status(400).json({ error: message });
  }
}

export async function updateCompanySubscriptionHandler(req: Request, res: Response) {
  try {
    const subscription = await updateCompanySubscription(
      req.user!.userId,
      req.params.companyId,
      req.body
    );
    return res.json({ data: subscription });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update subscription";
    return res.status(400).json({ error: message });
  }
}

export async function createReferralHandler(req: Request, res: Response) {
  try {
    const referral = await createReferral(req.user!.userId, req.body);
    return res.status(201).json({ data: referral });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create referral";
    return res.status(400).json({ error: message });
  }
}

export async function getMyReferralsHandler(req: Request, res: Response) {
  try {
    const referrals = await getMyReferrals(req.user!.userId);
    return res.json({ data: referrals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch referrals";
    return res.status(400).json({ error: message });
  }
}

export async function getCompanyReferralsHandler(req: Request, res: Response) {
  try {
    const referrals = await getCompanyReferrals(req.user!.userId, req.params.companyId);
    return res.json({ data: referrals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch referrals";
    return res.status(400).json({ error: message });
  }
}

export async function updateReferralHandler(req: Request, res: Response) {
  try {
    const referral = await updateReferral(req.user!.userId, req.params.id, req.body);
    return res.json({ data: referral });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update referral";
    return res.status(400).json({ error: message });
  }
}
