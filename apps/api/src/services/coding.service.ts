import { CodingSubmissionStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { CreateCodingTestInput, SubmitCodingTestInput, TestResult } from "@hireflow/shared";
import { runJavaScriptTests } from "../utils/sandbox";
import { ConflictError, ForbiddenError, NotFoundError } from "../utils/errors";

export async function createCodingTest(userId: string, input: CreateCodingTestInput) {
  const job = await prisma.job.findUnique({
    where: { id: input.jobId },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  const member = await prisma.companyMember.findFirst({
    where: {
      companyId: job.companyId,
      userId,
      role: { in: ["OWNER", "ADMIN", "RECRUITER"] },
    },
  });

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  return prisma.codingTest.create({
    data: {
      jobId: input.jobId,
      title: input.title,
      description: input.description,
      timeLimitMinutes: input.timeLimitMinutes,
      language: input.language,
      starterCode: input.starterCode || null,
      testCases: JSON.stringify(input.testCases),
      createdById: userId,
    },
  });
}

export async function getJobCodingTests(userId: string, jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  const member = await prisma.companyMember.findFirst({
    where: { companyId: job.companyId, userId },
  });

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  return prisma.codingTest.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCodingTest(userId: string, testId: string) {
  const test = await prisma.codingTest.findUnique({
    where: { id: testId },
    include: { job: true },
  });

  if (!test) {
    throw new NotFoundError("Test not found");
  }

  const member = await prisma.companyMember.findFirst({
    where: { companyId: test.job.companyId, userId },
  });

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  return {
    ...test,
    testCases: JSON.parse(test.testCases),
  };
}

export async function startSubmission(userId: string, testId: string) {
  const test = await prisma.codingTest.findUnique({
    where: { id: testId },
    include: { job: true },
  });

  if (!test) {
    throw new NotFoundError("Test not found");
  }

  const existing = await prisma.codingSubmission.findUnique({
    where: { testId_candidateId: { testId, candidateId: userId } },
  });

  if (existing) {
    return existing;
  }

  return prisma.codingSubmission.create({
    data: {
      testId,
      candidateId: userId,
      code: test.starterCode || "",
    },
  });
}

export async function submitCodingTest(userId: string, input: SubmitCodingTestInput) {
  const submission = await prisma.codingSubmission.findUnique({
    where: { testId_candidateId: { testId: input.testId, candidateId: userId } },
    include: { test: true },
  });

  if (!submission) {
    throw new NotFoundError("Submission not found");
  }

  if (submission.submittedAt) {
    throw new ConflictError("Test already submitted");
  }

  const testCases = JSON.parse(submission.test.language === "JAVASCRIPT" ? submission.test.testCases : "[]");
  const results: TestResult[] = [];
  let passed = 0;

  if (submission.test.language === "JAVASCRIPT") {
    // Executed in a separate, environment-stripped, heap-capped process that is
    // SIGKILLed on timeout. See src/utils/sandbox.ts for why in-process `vm`
    // evaluation was unsafe.
    const outcome = await runJavaScriptTests(input.code, testCases);

    if (!outcome.ok) {
      // A whole-run failure (timeout, no `solution` function, syntax error) is
      // reported against every case, so the candidate sees a complete result set.
      for (const tc of testCases) {
        results.push({
          passed: false,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          error: outcome.error,
        });
      }
    } else {
      testCases.forEach((tc: { input: string; expectedOutput: string }, i: number) => {
        const caseResult = outcome.results[i];

        if (!caseResult || !caseResult.ok) {
          results.push({
            passed: false,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            error: caseResult?.error ?? "No result was produced for this test case.",
          });
          return;
        }

        const actualOutput = caseResult.actualOutput;
        const isPass = actualOutput === tc.expectedOutput;
        if (isPass) passed++;

        results.push({
          passed: isPass,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput,
        });
      });
    }
  } else {
    results.push({
      passed: false,
      input: "",
      expectedOutput: "",
      error: "Language not supported yet",
    });
  }

  const score = testCases.length > 0 ? (passed / testCases.length) * 100 : 0;
  const status = passed === testCases.length ? CodingSubmissionStatus.PASSED : CodingSubmissionStatus.FAILED;

  return prisma.codingSubmission.update({
    where: { id: submission.id },
    data: {
      code: input.code,
      status,
      score,
      results: JSON.stringify(results),
      submittedAt: new Date(),
    },
  });
}

export async function getMySubmissions(userId: string, jobId: string) {
  return prisma.codingSubmission.findMany({
    where: { candidateId: userId, test: { jobId } },
    include: { test: { select: { id: true, title: true } } },
    orderBy: { startedAt: "desc" },
  });
}

export async function getTestSubmissions(userId: string, testId: string) {
  const test = await prisma.codingTest.findUnique({
    where: { id: testId },
    include: { job: true },
  });

  if (!test) {
    throw new NotFoundError("Test not found");
  }

  const member = await prisma.companyMember.findFirst({
    where: { companyId: test.job.companyId, userId },
  });

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  return prisma.codingSubmission.findMany({
    where: { testId },
    include: { candidate: { select: { id: true, name: true, email: true } } },
    orderBy: { startedAt: "desc" },
  });
}
