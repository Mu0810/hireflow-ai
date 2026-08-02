/**
 * Runs candidate-submitted JavaScript out of process.
 *
 * WHY NOT `vm.runInNewContext`
 * ---------------------------
 * This previously used `vm.runInNewContext(code, sandbox, { timeout: 2000 })`.
 * Node's `vm` module is explicitly not a security boundary, and in-process
 * evaluation failed in four separate ways:
 *
 *   1. Escape. `this.constructor.constructor("return process")()` is a
 *      well-known one-liner that reaches the real `process` object from inside a
 *      `vm` context. From there a submission could read `process.env` — which in
 *      this app holds `DATABASE_URL`, `JWT_ACCESS_SECRET` and
 *      `JWT_REFRESH_SECRET`.
 *   2. Denial of service. `process.exit()` in submitted code terminated the API
 *      server itself.
 *   3. Unstoppable loops. The `timeout` option interrupts synchronous script
 *      execution, but a submission that schedules async work escapes it.
 *   4. Memory exhaustion. Submitted code allocated against the API's own heap.
 *
 * WHAT THIS DOES INSTEAD
 * ----------------------
 * All test cases for a submission run in a single short-lived child process:
 *
 *   - `env: {}` — the child inherits no environment, so an escape finds no
 *     database URL and no signing secrets.
 *   - `--max-old-space-size` caps the child's heap, so an allocation bomb kills
 *     the child rather than the API.
 *   - `cwd` is the OS temp directory, not the application root.
 *   - A wall-clock timeout SIGKILLs the child. Unlike `vm`'s timeout this stops
 *     async work and infinite loops, because the whole process goes away.
 *   - `process.exit()` in submitted code ends only the child.
 *
 * The child is spawned via `process.execPath` with `-e`, so there is no separate
 * runner file to resolve. That matters because this package runs from `src` via
 * tsx in development and from `dist` in production, and a file path would differ
 * between the two.
 *
 * REMAINING RISK — READ BEFORE EXPOSING THIS PUBLICLY
 * --------------------------------------------------
 * This contains the blast radius; it is not a true sandbox. The child still runs
 * as the same OS user on the same host, so it can open network connections and
 * read files that user can read. Running genuinely untrusted code safely needs
 * OS-level isolation: a container per submission, gVisor, seccomp, or a hosted
 * execution service. This module is the seam where that would be swapped in —
 * the exported function signature would not change.
 */
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

export interface SandboxTestCase {
  input: string;
  expectedOutput: string;
}

export interface SandboxCaseResult {
  ok: boolean;
  actualOutput?: string;
  error?: string;
}

export type SandboxOutcome =
  | { ok: true; results: SandboxCaseResult[] }
  | { ok: false; error: string };

/** Per-test-case budget, matching the previous vm timeout. */
const MS_PER_CASE = 2_000;
/** Ceiling regardless of case count, so one submission cannot occupy a worker forever. */
const MAX_TOTAL_MS = 30_000;
const HEAP_MB = 64;
/** Guards against a submission printing megabytes to stdout. */
const MAX_OUTPUT_BYTES = 1_000_000;

/**
 * Executed inside the child. Reads `{ code, testCases }` as JSON on stdin and
 * writes a single JSON object to stdout.
 *
 * `new Function` is used deliberately: the process boundary is the containment
 * mechanism, so there is nothing to gain from also evaluating indirectly here.
 */
const BOOTSTRAP = `
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { raw += chunk; });
process.stdin.on("end", () => {
  const say = (payload) => process.stdout.write(JSON.stringify(payload));
  const messageOf = (e) => (e && e.message ? String(e.message) : String(e));
  try {
    const { code, testCases } = JSON.parse(raw);
    const solution = new Function(
      code + "\\nreturn typeof solution === 'function' ? solution : null;"
    )();
    if (typeof solution !== "function") {
      return say({ ok: false, error: "Your code must define a function named 'solution'." });
    }
    const results = [];
    for (const tc of testCases) {
      try {
        const value = solution(JSON.parse(tc.input));
        if (value && typeof value.then === "function") {
          results.push({ ok: false, error: "Asynchronous solutions are not supported." });
        } else {
          results.push({ ok: true, actualOutput: JSON.stringify(value) });
        }
      } catch (e) {
        results.push({ ok: false, error: messageOf(e) });
      }
    }
    say({ ok: true, results });
  } catch (e) {
    say({ ok: false, error: messageOf(e) });
  }
});
`;

export function runJavaScriptTests(
  code: string,
  testCases: SandboxTestCase[]
): Promise<SandboxOutcome> {
  const budgetMs = Math.min(MAX_TOTAL_MS, MS_PER_CASE * Math.max(1, testCases.length));

  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(process.execPath, [`--max-old-space-size=${HEAP_MB}`, "-e", BOOTSTRAP], {
        // No inherited environment: an escape must not find DATABASE_URL or the JWT secrets.
        env: {},
        cwd: tmpdir(),
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err) {
      return resolve({
        ok: false,
        error: err instanceof Error ? err.message : "Failed to start the execution sandbox.",
      });
    }

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (outcome: SandboxOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGKILL");
      resolve(outcome);
    };

    const timer = setTimeout(() => {
      finish({ ok: false, error: `Execution timed out after ${budgetMs}ms.` });
    }, budgetMs);

    child.stdout.on("data", (d: Buffer) => {
      if (stdout.length < MAX_OUTPUT_BYTES) stdout += d.toString("utf8");
    });
    child.stderr.on("data", (d: Buffer) => {
      if (stderr.length < MAX_OUTPUT_BYTES) stderr += d.toString("utf8");
    });

    child.on("error", (err) => {
      finish({ ok: false, error: err.message });
    });

    child.on("close", () => {
      if (settled) return;
      clearTimeout(timer);
      settled = true;

      const trimmed = stdout.trim();
      if (!trimmed) {
        // No stdout means the child died before reporting: a heap-cap kill, a
        // process.exit() in submitted code, or a syntax error at parse time.
        resolve({
          ok: false,
          error: stderr.trim().split("\n").pop() || "Execution failed without producing output.",
        });
        return;
      }

      try {
        resolve(JSON.parse(trimmed) as SandboxOutcome);
      } catch {
        resolve({ ok: false, error: "The execution sandbox returned an unreadable result." });
      }
    });

    child.stdin.on("error", () => {
      finish({ ok: false, error: "Failed to send code to the execution sandbox." });
    });
    child.stdin.end(JSON.stringify({ code, testCases }));
  });
}
