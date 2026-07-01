"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, UpdateProfileInput } from "@hireflow/shared";
import { useMyProfile, useUpdateProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

function emptyEducation() {
  return {
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    current: false,
    gpa: "",
  };
}

function emptyExperience() {
  return {
    company: "",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    current: false,
    location: "",
  };
}

function emptyProject() {
  return {
    name: "",
    description: "",
    url: "",
    githubUrl: "",
    startDate: "",
    endDate: "",
  };
}

function emptyCertification() {
  return {
    name: "",
    organization: "",
    issueDate: "",
    expiryDate: "",
    credentialId: "",
    url: "",
  };
}

function emptySkill() {
  return { name: "", proficiency: 1, yearsExperience: 0 };
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      bio: "",
      location: "",
      phone: "",
      linkedIn: "",
      github: "",
      portfolio: "",
      expectedSalary: "",
      noticePeriod: "",
      availableFrom: "",
      remoteOnly: false,
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      skills: [],
    },
  });

  const educationFields = useFieldArray({ control, name: "education" });
  const experienceFields = useFieldArray({ control, name: "experience" });
  const projectFields = useFieldArray({ control, name: "projects" });
  const certificationFields = useFieldArray({ control, name: "certifications" });
  const skillFields = useFieldArray({ control, name: "skills" });

  useEffect(() => {
    if (profile) {
      reset({
        bio: profile.bio || "",
        location: profile.location || "",
        phone: profile.phone || "",
        linkedIn: profile.linkedIn || "",
        github: profile.github || "",
        portfolio: profile.portfolio || "",
        expectedSalary: profile.expectedSalary || "",
        noticePeriod: profile.noticePeriod || "",
        availableFrom: profile.availableFrom ? profile.availableFrom.split("T")[0] : "",
        remoteOnly: profile.remoteOnly || false,
        education: profile.education?.map((e: any) => ({
          ...e,
          startDate: e.startDate ? e.startDate.split("T")[0] : "",
          endDate: e.endDate ? e.endDate.split("T")[0] : "",
        })) || [],
        experience: profile.experience?.map((e: any) => ({
          ...e,
          startDate: e.startDate ? e.startDate.split("T")[0] : "",
          endDate: e.endDate ? e.endDate.split("T")[0] : "",
        })) || [],
        projects: profile.projects?.map((p: any) => ({
          ...p,
          startDate: p.startDate ? p.startDate.split("T")[0] : "",
          endDate: p.endDate ? p.endDate.split("T")[0] : "",
        })) || [],
        certifications: profile.certifications?.map((c: any) => ({
          ...c,
          issueDate: c.issueDate ? c.issueDate.split("T")[0] : "",
          expiryDate: c.expiryDate ? c.expiryDate.split("T")[0] : "",
        })) || [],
        skills: profile.skills?.map((s: any) => ({
          name: s.name,
          proficiency: s.proficiency,
          yearsExperience: s.yearsExperience || 0,
        })) || [],
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      setSaved(false);
      setError(null);
      await updateProfile.mutateAsync(data);
      setSaved(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save profile");
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Candidate Profile</h1>
          <p className="text-muted-foreground">Complete your profile to improve your job matches.</p>
        </div>

        {saved && <p className="rounded-lg bg-green-100 p-3 text-green-800">Profile saved</p>}
        {error && <p className="rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <section className="rounded-lg border p-6 shadow">
            <h2 className="text-xl font-bold">Basic info</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...register("location")} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div>
                <Label htmlFor="linkedIn">LinkedIn</Label>
                <Input id="linkedIn" {...register("linkedIn")} />
              </div>
              <div>
                <Label htmlFor="github">GitHub</Label>
                <Input id="github" {...register("github")} />
              </div>
              <div>
                <Label htmlFor="portfolio">Portfolio</Label>
                <Input id="portfolio" {...register("portfolio")} />
              </div>
              <div>
                <Label htmlFor="expectedSalary">Expected salary</Label>
                <Input id="expectedSalary" {...register("expectedSalary")} />
              </div>
              <div>
                <Label htmlFor="noticePeriod">Notice period</Label>
                <Input id="noticePeriod" {...register("noticePeriod")} />
              </div>
              <div>
                <Label htmlFor="availableFrom">Available from</Label>
                <Input id="availableFrom" type="date" {...register("availableFrom")} />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                {...register("bio")}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input id="remoteOnly" type="checkbox" {...register("remoteOnly")} />
              <Label htmlFor="remoteOnly">Remote only</Label>
            </div>
          </section>

          <section className="rounded-lg border p-6 shadow">
            <h2 className="text-xl font-bold">Skills</h2>
            <div className="mt-4 space-y-3">
              {skillFields.fields.map((field, index) => (
                <div key={field.id} className="grid gap-3 sm:grid-cols-4">
                  <Input placeholder="Skill" {...register(`skills.${index}.name`)} />
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    placeholder="Proficiency 1-5"
                    {...register(`skills.${index}.proficiency`, { valueAsNumber: true })}
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Years"
                    {...register(`skills.${index}.yearsExperience`, { valueAsNumber: true })}
                  />
                  <Button type="button" variant="destructive" onClick={() => skillFields.remove(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => skillFields.append(emptySkill())}>
                Add skill
              </Button>
            </div>
          </section>

          <section className="rounded-lg border p-6 shadow">
            <h2 className="text-xl font-bold">Education</h2>
            <div className="mt-4 space-y-4">
              {educationFields.fields.map((field, index) => (
                <div key={field.id} className="space-y-3 rounded-md border p-3">
                  <Input placeholder="Institution" {...register(`education.${index}.institution`)} />
                  <Input placeholder="Degree" {...register(`education.${index}.degree`)} />
                  <Input placeholder="Field of study" {...register(`education.${index}.fieldOfStudy`)} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input type="date" {...register(`education.${index}.startDate`)} />
                    <Input type="date" {...register(`education.${index}.endDate`)} />
                  </div>
                  <Input placeholder="GPA" {...register(`education.${index}.gpa`)} />
                  <Button type="button" variant="destructive" onClick={() => educationFields.remove(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => educationFields.append(emptyEducation())}>
                Add education
              </Button>
            </div>
          </section>

          <section className="rounded-lg border p-6 shadow">
            <h2 className="text-xl font-bold">Experience</h2>
            <div className="mt-4 space-y-4">
              {experienceFields.fields.map((field, index) => (
                <div key={field.id} className="space-y-3 rounded-md border p-3">
                  <Input placeholder="Company" {...register(`experience.${index}.company`)} />
                  <Input placeholder="Title" {...register(`experience.${index}.title`)} />
                  <Input placeholder="Location" {...register(`experience.${index}.location`)} />
                  <textarea
                    placeholder="Description"
                    {...register(`experience.${index}.description`)}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input type="date" {...register(`experience.${index}.startDate`)} />
                    <Input type="date" {...register(`experience.${index}.endDate`)} />
                  </div>
                  <Button type="button" variant="destructive" onClick={() => experienceFields.remove(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => experienceFields.append(emptyExperience())}>
                Add experience
              </Button>
            </div>
          </section>

          <section className="rounded-lg border p-6 shadow">
            <h2 className="text-xl font-bold">Projects</h2>
            <div className="mt-4 space-y-4">
              {projectFields.fields.map((field, index) => (
                <div key={field.id} className="space-y-3 rounded-md border p-3">
                  <Input placeholder="Project name" {...register(`projects.${index}.name`)} />
                  <textarea
                    placeholder="Description"
                    {...register(`projects.${index}.description`)}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Input placeholder="URL" {...register(`projects.${index}.url`)} />
                  <Input placeholder="GitHub URL" {...register(`projects.${index}.githubUrl`)} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input type="date" {...register(`projects.${index}.startDate`)} />
                    <Input type="date" {...register(`projects.${index}.endDate`)} />
                  </div>
                  <Button type="button" variant="destructive" onClick={() => projectFields.remove(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => projectFields.append(emptyProject())}>
                Add project
              </Button>
            </div>
          </section>

          <section className="rounded-lg border p-6 shadow">
            <h2 className="text-xl font-bold">Certifications</h2>
            <div className="mt-4 space-y-4">
              {certificationFields.fields.map((field, index) => (
                <div key={field.id} className="space-y-3 rounded-md border p-3">
                  <Input placeholder="Certification name" {...register(`certifications.${index}.name`)} />
                  <Input placeholder="Organization" {...register(`certifications.${index}.organization`)} />
                  <Input placeholder="Credential ID" {...register(`certifications.${index}.credentialId`)} />
                  <Input placeholder="URL" {...register(`certifications.${index}.url`)} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input type="date" {...register(`certifications.${index}.issueDate`)} />
                    <Input type="date" {...register(`certifications.${index}.expiryDate`)} />
                  </div>
                  <Button type="button" variant="destructive" onClick={() => certificationFields.remove(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => certificationFields.append(emptyCertification())}>
                Add certification
              </Button>
            </div>
          </section>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </div>
    </div>
  );
}
