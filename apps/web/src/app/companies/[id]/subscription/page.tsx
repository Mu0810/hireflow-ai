"use client";

import { useParams } from "next/navigation";
import {
  useCompanySubscription,
  useUpdateCompanySubscription,
} from "@/hooks/use-subscriptions";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function CompanySubscriptionPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const { data: subscription, isLoading } = useCompanySubscription(companyId);
  const updateSubscription = useUpdateCompanySubscription(companyId);
  const [plan, setPlan] = useState<"FREE" | "STARTER" | "PRO">("FREE");
  const [expiresAt, setExpiresAt] = useState("");

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  async function handleUpdate() {
    await updateSubscription.mutateAsync({
      plan,
      expiresAt: expiresAt || undefined,
    });
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Subscription</h1>

        <div className="mt-6 rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="text-2xl font-bold">{subscription?.plan || "FREE"}</p>
              <p className="text-sm text-muted-foreground">
                Status: {subscription?.status || "ACTIVE"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Change plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as any)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="FREE">Free</option>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Expiration date</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button onClick={handleUpdate} disabled={updateSubscription.isPending}>
              {updateSubscription.isPending ? "Updating..." : "Update subscription"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
