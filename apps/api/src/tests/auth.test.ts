import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../config/db";
import { cleanDatabase } from "./helpers";

beforeEach(async () => {
  await cleanDatabase();
});

describe("POST /api/auth/register", () => {
  it("registers a new candidate and sends verification email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "alice@example.com",
        password: "Password123",
        name: "Alice",
        role: "CANDIDATE",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("alice@example.com");
  });

  it("rejects duplicate email", async () => {
    await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      password: "Password123",
      name: "Alice",
      role: "CANDIDATE",
    });

    const res = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      password: "Password123",
      name: "Alice 2",
      role: "CANDIDATE",
    });

    // 409: the request is well-formed, it conflicts with existing state.
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Email already registered");
  });

  it("rejects invalid email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "not-an-email",
      password: "Password123",
      name: "Alice",
      role: "CANDIDATE",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns tokens for verified user", async () => {
    await request(app).post("/api/auth/register").send({
      email: "bob@example.com",
      password: "Password123",
      name: "Bob",
      role: "CANDIDATE",
    });

    const token = await prisma.verificationToken.findFirst({
      where: { email: "bob@example.com" },
    });

    await request(app).post("/api/auth/verify-email").send({ token: token?.token });

    const res = await request(app).post("/api/auth/login").send({
      email: "bob@example.com",
      password: "Password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe("bob@example.com");
  });

  it("rejects unverified user", async () => {
    await request(app).post("/api/auth/register").send({
      email: "carol@example.com",
      password: "Password123",
      name: "Carol",
      role: "CANDIDATE",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "carol@example.com",
      password: "Password123",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Please verify your email before logging in");
  });

  it("rejects wrong password", async () => {
    await request(app).post("/api/auth/register").send({
      email: "dave@example.com",
      password: "Password123",
      name: "Dave",
      role: "CANDIDATE",
    });

    const token = await prisma.verificationToken.findFirst({
      where: { email: "dave@example.com" },
    });
    await request(app).post("/api/auth/verify-email").send({ token: token?.token });

    const res = await request(app).post("/api/auth/login").send({
      email: "dave@example.com",
      password: "WrongPassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });
});

describe("GET /api/users/me", () => {
  it("returns current user with valid token", async () => {
    await request(app).post("/api/auth/register").send({
      email: "eve@example.com",
      password: "Password123",
      name: "Eve",
      role: "CANDIDATE",
    });

    const token = await prisma.verificationToken.findFirst({
      where: { email: "eve@example.com" },
    });
    await request(app).post("/api/auth/verify-email").send({ token: token?.token });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "eve@example.com",
      password: "Password123",
    });

    const accessToken = loginRes.body.data.accessToken;

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("eve@example.com");
  });

  it("rejects unauthenticated request", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/dashboard", () => {
  it("allows super admin access", async () => {
    await request(app).post("/api/auth/register").send({
      email: "admin@example.com",
      password: "Password123",
      name: "Admin",
      role: "SUPER_ADMIN",
    });

    const token = await prisma.verificationToken.findFirst({
      where: { email: "admin@example.com" },
    });
    await request(app).post("/api/auth/verify-email").send({ token: token?.token });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "Password123",
    });

    const accessToken = loginRes.body.data.accessToken;

    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });

  it("forbids candidate access", async () => {
    await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "Password123",
      name: "User",
      role: "CANDIDATE",
    });

    const token = await prisma.verificationToken.findFirst({
      where: { email: "user@example.com" },
    });
    await request(app).post("/api/auth/verify-email").send({ token: token?.token });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "user@example.com",
      password: "Password123",
    });

    const accessToken = loginRes.body.data.accessToken;

    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });
});
