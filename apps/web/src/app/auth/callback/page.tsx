"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    localStorage.setItem("accessToken", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    api
      .get("/api/users/me")
      .then((res) => {
        setAuth(res.data.data, token);
        router.push("/dashboard");
      })
      .catch(() => {
        router.push("/login");
      });
  }, [token, router, setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Completing sign in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p>Completing sign in...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
