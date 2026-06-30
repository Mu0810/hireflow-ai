"use client";

import { Button } from "@/components/ui/button";

export function OAuthButtons() {
  const googleUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
  const githubUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`;

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        type="button"
        onClick={() => (window.location.href = googleUrl)}
      >
        Google
      </Button>
      <Button
        variant="outline"
        type="button"
        onClick={() => (window.location.href = githubUrl)}
      >
        GitHub
      </Button>
    </div>
  );
}
