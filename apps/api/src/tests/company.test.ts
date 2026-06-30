import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../index";
import { prisma } from "../config/db";

beforeEach(async () => {
  await prisma.companyInvite.deleteMany();
  await prisma.companyMember.deleteMany();
  await prisma.company.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
});

async function registerAndVerify(email: string, role: string) {
  await request(app).post("/api/auth/register").send({
    email,
    password: "Password123",
    name: "Test User",
    role,
  });

  const token = await prisma.verificationToken.findFirst({
    where: { email },
  });

  await request(app).post("/api/auth/verify-email").send({ token: token?.token });

  const loginRes = await request(app).post("/api/auth/login").send({
    email,
    password: "Password123",
  });

  return loginRes.body.data.accessToken;
}

describe("POST /api/companies", () => {
  it("creates a company for a candidate and promotes to company admin", async () => {
    const token = await registerAndVerify("owner@example.com", "CANDIDATE");

    const res = await request(app)
      .post("/api/companies")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Acme Inc",
        slug: "acme-inc",
        website: "https://acme.com",
        description: "We hire great people",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Acme Inc");
    expect(res.body.data.slug).toBe("acme-inc");
  });

  it("rejects duplicate slug", async () => {
    const token = await registerAndVerify("owner2@example.com", "CANDIDATE");

    await request(app)
      .post("/api/companies")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Acme Inc",
        slug: "acme-inc",
      });

    const res = await request(app)
      .post("/api/companies")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Acme Inc 2",
        slug: "acme-inc",
      });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/companies/my", () => {
  it("returns companies the user belongs to", async () => {
    const token = await registerAndVerify("owner3@example.com", "CANDIDATE");

    await request(app)
      .post("/api/companies")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Acme Inc",
        slug: "acme-inc-3",
      });

    const res = await request(app)
      .get("/api/companies/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});

describe("POST /api/companies/:id/invite", () => {
  it("sends an invite to a new user", async () => {
    const token = await registerAndVerify("owner4@example.com", "CANDIDATE");

    const companyRes = await request(app)
      .post("/api/companies")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Acme Inc",
        slug: "acme-inc-4",
      });

    const companyId = companyRes.body.data.id;

    const res = await request(app)
      .post(`/api/companies/${companyId}/invite`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "recruiter@example.com",
        role: "RECRUITER",
      });

    expect(res.status).toBe(200);

    const invite = await prisma.companyInvite.findFirst({
      where: { email: "recruiter@example.com" },
    });

    expect(invite).toBeTruthy();
  });
});

describe("POST /api/companies/accept-invite", () => {
  it("allows a user to accept an invite", async () => {
    const ownerToken = await registerAndVerify("owner5@example.com", "CANDIDATE");

    const companyRes = await request(app)
      .post("/api/companies")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Acme Inc",
        slug: "acme-inc-5",
      });

    const companyId = companyRes.body.data.id;

    await request(app)
      .post(`/api/companies/${companyId}/invite`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        email: "newrecruiter@example.com",
        role: "RECRUITER",
      });

    const invite = await prisma.companyInvite.findFirst({
      where: { email: "newrecruiter@example.com" },
    });

    const recruiterToken = await registerAndVerify("newrecruiter@example.com", "CANDIDATE");

    const res = await request(app)
      .post("/api/companies/accept-invite")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ token: invite?.token });

    expect(res.status).toBe(200);

    const member = await prisma.companyMember.findFirst({
      where: { companyId, user: { email: "newrecruiter@example.com" } },
    });

    expect(member).toBeTruthy();
  });
});
