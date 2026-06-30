import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../index";
import { prisma } from "../config/db";

beforeEach(async () => {
  await prisma.candidateSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.education.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.project.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.candidateProfile.deleteMany();
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

describe("GET /api/profiles/me", () => {
  it("creates and returns a profile for the current user", async () => {
    const token = await registerAndVerify("candidate@example.com", "CANDIDATE");

    const res = await request(app)
      .get("/api/profiles/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBeDefined();
    expect(res.body.data.skills).toEqual([]);
  });
});

describe("PATCH /api/profiles/me", () => {
  it("updates profile with nested data", async () => {
    const token = await registerAndVerify("candidate2@example.com", "CANDIDATE");

    const res = await request(app)
      .patch("/api/profiles/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bio: "Full-stack developer",
        location: "Bangalore",
        skills: [{ name: "React", proficiency: 4, yearsExperience: 3 }],
        education: [
          {
            institution: "VTU",
            degree: "B.E.",
            fieldOfStudy: "Computer Science",
            startDate: "2018-08-01",
            current: true,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.bio).toBe("Full-stack developer");
    expect(res.body.data.skills.length).toBe(1);
    expect(res.body.data.skills[0].name).toBe("react");
    expect(res.body.data.education.length).toBe(1);
  });
});
