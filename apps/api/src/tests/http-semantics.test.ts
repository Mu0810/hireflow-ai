/**
 * Verifies that failures map to meaningful HTTP status codes.
 *
 * Before typed errors existed, every service failure returned 400 — a missing
 * resource, a permissions problem and a malformed body were indistinguishable.
 * These tests pin the distinction so it cannot silently regress.
 */
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../config/db";
import { cleanDatabase } from "./helpers";

beforeEach(async () => {
  await cleanDatabase();
});

async function registerAndVerify(email: string, role = "CANDIDATE") {
  await request(app)
    .post("/api/auth/register")
    .send({ email, password: "Password123", name: "Test User", role });

  const token = await prisma.verificationToken.findFirst({ where: { email } });
  await request(app).post("/api/auth/verify-email").send({ token: token?.token });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password123" });

  return loginRes.body.data.accessToken as string;
}

describe("unmatched routes", () => {
  it("returns a JSON 404 rather than Express's default HTML page", async () => {
    const res = await request(app).get("/api/definitely-not-a-route");

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.error).toContain("Cannot GET");
  });

  it("returns 404 for an unknown method on a known prefix", async () => {
    const res = await request(app).delete("/api/jobs");

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe("status codes reflect the kind of failure", () => {
  it("returns 404 when the referenced resource does not exist", async () => {
    const token = await registerAndVerify("editor@example.com");

    // This handler's fallback status was 400, so a missing job previously
    // reported "Job not found" with a 400. It is now driven by NotFoundError.
    const res = await request(app)
      .patch("/api/jobs/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Job not found");
  });

  it("returns 409 when the request conflicts with current state", async () => {
    const token = await registerAndVerify("applicant@example.com");

    const res = await request(app)
      .post("/api/jobs/apply")
      .set("Authorization", `Bearer ${token}`)
      .send({ jobId: "00000000-0000-0000-0000-000000000000" });

    // applyToJob treats "missing" and "not open" alike: the job is not
    // available to apply to, which is a state conflict.
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Job not available");
  });

  it("returns 403 when authenticated but not permitted", async () => {
    const ownerToken = await registerAndVerify("owner2@example.com");
    const outsiderToken = await registerAndVerify("outsider@example.com");

    const created = await request(app)
      .post("/api/companies")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Globex", slug: "globex" });

    expect(created.status).toBe(201);

    const res = await request(app)
      .patch(`/api/companies/${created.body.data.id}`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send({ name: "Globex Renamed" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Access denied");
  });

  it("still returns 400 for a schema validation failure", async () => {
    const token = await registerAndVerify("validator@example.com");

    const res = await request(app)
      .post("/api/companies")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("still returns 401 without credentials", async () => {
    const res = await request(app).get("/api/companies/my");

    expect(res.status).toBe(401);
  });
});
