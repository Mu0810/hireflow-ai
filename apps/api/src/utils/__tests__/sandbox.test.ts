/**
 * Tests for the out-of-process code sandbox.
 *
 * These deliberately include a real `vm` escape attempt. The point is not that
 * the escape fails — it does not, and it is not supposed to — but that escaping
 * now lands somewhere worthless: a process with no environment, a capped heap,
 * and a short life.
 *
 * No database is required, so this suite runs standalone.
 */
import { describe, it, expect } from "vitest";
import { runJavaScriptTests } from "../sandbox";

const one = (input: string, expectedOutput: string) => [{ input, expectedOutput }];

describe("runJavaScriptTests", () => {
  it("passes a correct solution", async () => {
    const outcome = await runJavaScriptTests(
      "function solution(n) { return n * 2; }",
      one("21", "42")
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.results[0]).toEqual({ ok: true, actualOutput: "42" });
  });

  it("runs every test case in one child process", async () => {
    const outcome = await runJavaScriptTests("function solution(n) { return n + 1; }", [
      { input: "1", expectedOutput: "2" },
      { input: "2", expectedOutput: "3" },
      { input: "3", expectedOutput: "4" },
    ]);

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.results.map((r) => r.actualOutput)).toEqual(["2", "3", "4"]);
  });

  it("reports a wrong answer without failing the run", async () => {
    const outcome = await runJavaScriptTests(
      "function solution(n) { return n; }",
      one("21", "42")
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.results[0]?.actualOutput).toBe("21"); // caller compares to expectedOutput
  });

  it("isolates a throwing test case", async () => {
    const outcome = await runJavaScriptTests(
      "function solution(n) { if (n === 2) throw new Error('boom'); return n; }",
      [
        { input: "1", expectedOutput: "1" },
        { input: "2", expectedOutput: "2" },
        { input: "3", expectedOutput: "3" },
      ]
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.results[0]?.ok).toBe(true);
    expect(outcome.results[1]?.ok).toBe(false);
    expect(outcome.results[1]?.error).toContain("boom");
    expect(outcome.results[2]?.ok).toBe(true);
  });

  it("rejects code that defines no solution function", async () => {
    const outcome = await runJavaScriptTests("const x = 1;", one("1", "1"));

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.error).toContain("solution");
  });

  it("reports a syntax error instead of crashing", async () => {
    const outcome = await runJavaScriptTests("function solution( {{{", one("1", "1"));

    expect(outcome.ok).toBe(false);
  });

  it("rejects an async solution rather than serialising a promise", async () => {
    const outcome = await runJavaScriptTests(
      "async function solution(n) { return n; }",
      one("1", "1")
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.results[0]?.ok).toBe(false);
    expect(outcome.results[0]?.error).toContain("Asynchronous");
  });

  it("kills an infinite loop, which vm's timeout could not do reliably", async () => {
    const outcome = await runJavaScriptTests(
      "function solution() { while (true) {} }",
      one("1", "1")
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.error).toMatch(/timed out/i);
  }, 15_000);

  it("survives submitted code calling process.exit", async () => {
    // In-process this terminated the API server. Here it ends only the child.
    const outcome = await runJavaScriptTests(
      "function solution() { process.exit(1); }",
      one("1", "1")
    );

    expect(outcome.ok).toBe(false);
  });

  it("exposes no secrets even when the submission escapes to process.env", async () => {
    // A textbook vm escape. It succeeds in reaching `process` — the containment
    // is that the child was spawned with env: {}, so there is nothing there.
    const outcome = await runJavaScriptTests(
      `function solution() {
         const p = this.constructor.constructor("return process")();
         return Object.keys(p.env);
       }`,
      one("1", "[]")
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    const keys: string[] = JSON.parse(outcome.results[0]?.actualOutput ?? "[]");
    expect(keys).not.toContain("DATABASE_URL");
    expect(keys).not.toContain("JWT_ACCESS_SECRET");
    expect(keys).not.toContain("JWT_REFRESH_SECRET");
  });

  it("does not leak the API's own working directory", async () => {
    const outcome = await runJavaScriptTests("function solution() { return process.cwd(); }", one("1", '""'));

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.results[0]?.actualOutput).not.toContain("apps/api");
  });

  it("contains a memory bomb instead of exhausting the API heap", async () => {
    const outcome = await runJavaScriptTests(
      `function solution() {
         const a = [];
         for (;;) a.push(new Array(1e6).fill(7));
         return a.length;
       }`,
      one("1", "0")
    );

    // Either the heap cap kills the child or the wall clock does; both are
    // contained, and neither takes the API process down.
    expect(outcome.ok).toBe(false);
  }, 20_000);
});
