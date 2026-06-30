import { prisma } from "../config/db";

export async function getCompanyAnalytics(userId: string, companyId: string) {
  const member = await prisma.companyMember.findFirst({
    where: { companyId, userId },
  });

  if (!member) {
    throw new Error("Access denied");
  }

  const [
    totalJobs,
    totalApplications,
    applicationsByStatus,
    avgAiMatchScore,
    totalInterviews,
    recentApplications,
  ] = await Promise.all([
    prisma.job.count({ where: { companyId } }),
    prisma.application.count({
      where: { job: { companyId } },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { job: { companyId } },
      _count: { status: true },
    }),
    prisma.application.aggregate({
      where: { job: { companyId }, aiMatchScore: { not: null } },
      _avg: { aiMatchScore: true },
    }),
    prisma.interview.count({
      where: { application: { job: { companyId } } },
    }),
    prisma.application.findMany({
      where: { job: { companyId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, title: true } },
      },
    }),
  ]);

  return {
    totalJobs,
    totalApplications,
    applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>),
    averageAiMatchScore: avgAiMatchScore._avg.aiMatchScore || 0,
    totalInterviews,
    recentApplications,
  };
}

export async function getAdminAnalytics(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Access denied");
  }

  const [
    totalUsers,
    totalCompanies,
    totalJobs,
    totalApplications,
    totalInterviews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.interview.count(),
  ]);

  return {
    totalUsers,
    totalCompanies,
    totalJobs,
    totalApplications,
    totalInterviews,
  };
}
