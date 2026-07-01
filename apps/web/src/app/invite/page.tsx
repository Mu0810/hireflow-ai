"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAcceptInvite } from "@/hooks/use-companies";
import Link from "next/link";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { mutateAsync: acceptInvite } = useAcceptInvite();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing invite token");
      return;
    }

    acceptInvite(token)
      .then(() => {
        setStatus("success");
        setMessage("You've joined the company. Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard"), 2000);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.error || "Failed to accept invite");
      });
  }, [token, router, acceptInvite]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">
          {status === "loading" ? "Accepting invite..." : status === "success" ? "Welcome!" : "Error"}
        </h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
        {status === "error" && (
          <Link href="/dashboard" className="mt-4 inline-block text-primary underline">
            Go to dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
