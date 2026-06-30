import { prisma } from "../config/db";
import { UpdateProfileInput } from "@hireflow/shared";

export async function getOrCreateProfile(userId: string) {
  let profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      education: { orderBy: { startDate: "desc" } },
      experience: { orderBy: { startDate: "desc" } },
      projects: { orderBy: { createdAt: "desc" } },
      certifications: { orderBy: { issueDate: "desc" } },
      skills: {
        include: { skill: true },
      },
    },
  });

  if (!profile) {
    profile = await prisma.candidateProfile.create({
      data: { userId },
      include: {
        education: true,
        experience: true,
        projects: true,
        certifications: true,
        skills: { include: { skill: true } },
      },
    });
  }

  return {
    ...profile,
    skills: profile.skills.map((s: any) => ({
      id: s.id,
      name: s.skill.name,
      proficiency: s.proficiency,
      yearsExperience: s.yearsExperience,
    })),
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const {
    education,
    experience,
    projects,
    certifications,
    skills,
    availableFrom,
    ...base
  } = input;

  const profile = await prisma.candidateProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...base,
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
    },
    update: {
      ...base,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
    },
    include: {
      education: true,
      experience: true,
      projects: true,
      certifications: true,
      skills: { include: { skill: true } },
    },
  });

  if (education !== undefined) {
    await prisma.education.deleteMany({ where: { profileId: profile.id } });
    if (education.length > 0) {
      await prisma.education.createMany({
        data: education.map((e) => ({
          ...e,
          profileId: profile.id,
          startDate: new Date(e.startDate),
          fieldOfStudy: e.fieldOfStudy || null,
          endDate: e.endDate ? new Date(e.endDate) : null,
          gpa: e.gpa || null,
        })),
      });
    }
  }

  if (experience !== undefined) {
    await prisma.experience.deleteMany({ where: { profileId: profile.id } });
    if (experience.length > 0) {
      await prisma.experience.createMany({
        data: experience.map((e) => ({
          ...e,
          profileId: profile.id,
          startDate: new Date(e.startDate),
          description: e.description || null,
          endDate: e.endDate ? new Date(e.endDate) : null,
          location: e.location || null,
        })),
      });
    }
  }

  if (projects !== undefined) {
    await prisma.project.deleteMany({ where: { profileId: profile.id } });
    if (projects.length > 0) {
      await prisma.project.createMany({
        data: projects.map((p) => ({
          ...p,
          profileId: profile.id,
          description: p.description || null,
          url: p.url || null,
          githubUrl: p.githubUrl || null,
          startDate: p.startDate ? new Date(p.startDate) : null,
          endDate: p.endDate ? new Date(p.endDate) : null,
        })),
      });
    }
  }

  if (certifications !== undefined) {
    await prisma.certification.deleteMany({ where: { profileId: profile.id } });
    if (certifications.length > 0) {
      await prisma.certification.createMany({
        data: certifications.map((c) => ({
          ...c,
          profileId: profile.id,
          issueDate: new Date(c.issueDate),
          expiryDate: c.expiryDate ? new Date(c.expiryDate) : null,
          credentialId: c.credentialId || null,
          url: c.url || null,
        })),
      });
    }
  }

  if (skills !== undefined) {
    await prisma.candidateSkill.deleteMany({ where: { profileId: profile.id } });
    if (skills.length > 0) {
      for (const s of skills) {
        const skill = await prisma.skill.upsert({
          where: { name: s.name.toLowerCase() },
          create: { name: s.name.toLowerCase() },
          update: {},
        });

        await prisma.candidateSkill.create({
          data: {
            profileId: profile.id,
            skillId: skill.id,
            proficiency: s.proficiency,
            yearsExperience: s.yearsExperience ?? null,
          },
        });
      }
    }
  }

  return getOrCreateProfile(userId);
}

export async function updateResumeUrl(userId: string, resumeUrl: string) {
  return prisma.candidateProfile.upsert({
    where: { userId },
    create: { userId, resumeUrl },
    update: { resumeUrl },
  });
}
