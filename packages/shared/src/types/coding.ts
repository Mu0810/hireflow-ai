export type CodingLanguage = "JAVASCRIPT" | "PYTHON" | "TYPESCRIPT";
export type CodingSubmissionStatus = "PENDING" | "PASSED" | "FAILED" | "ERROR";

export interface CodingTestCase {
  input: string;
  expectedOutput: string;
}

export interface CodingTest {
  id: string;
  jobId: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  language: CodingLanguage;
  starterCode: string | null;
  testCases: CodingTestCase[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodingSubmission {
  id: string;
  testId: string;
  candidateId: string;
  code: string;
  status: CodingSubmissionStatus;
  score: number | null;
  results: TestResult[] | null;
  startedAt: string;
  submittedAt: string | null;
}

export interface TestResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  error?: string;
}
