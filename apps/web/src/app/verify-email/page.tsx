"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token");
      return;
    }

    api
      .post("/api/auth/verify-email", { token })
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified. You can now sign in.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.error || "Verification failed");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">
          {status === "loading" ? "Verifying..." : status === "success" ? "Verified" : "Error"}
        </h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
        {status === "success" && (
          <Link href="/login" className="mt-4 inline-block text-primary underline">
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
