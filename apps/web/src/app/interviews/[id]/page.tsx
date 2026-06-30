"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useInterview, useSendMessage } from "@/hooks/use-interviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InterviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: interview, isLoading } = useInterview(id);
  const sendMessage = useSendMessage(id);
  const [content, setContent] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    await sendMessage.mutateAsync({ interviewId: id, content });
    setContent("");
  }

  if (isLoading) {
    return <div className="p-8">Loading interview...</div>;
  }

  if (!interview) {
    return <div className="p-8">Interview not found</div>;
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">{interview.application.job.title}</h1>
        <p className="text-muted-foreground">
          {interview.application.job.company.name} · {" "}
          {interview.application.candidate.name || interview.application.candidate.email}
        </p>
        <p className="mt-2">
          {new Date(interview.scheduledAt).toLocaleString()} · {interview.durationMinutes} min ·{" "}
          {interview.type} · {interview.status}
        </p>
        {interview.notes && (
          <p className="mt-2 text-muted-foreground">{interview.notes}</p>
        )}

        <div className="mt-8 rounded-lg border p-6">
          <h2 className="text-xl font-bold">Messages</h2>
          <div className="mt-4 space-y-3">
            {interview.messages?.map((message: any) => (
              <div
                key={message.id}
                className={`rounded-lg p-3 ${
                  message.senderId === interview.createdById
                    ? "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                    : "bg-muted max-w-[80%]"
                }`}
              >
                <p className="text-sm font-medium">{message.sender.name || message.sender.email}</p>
                <p>{message.content}</p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
            {interview.messages?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
            )}
          </div>

          <form onSubmit={handleSend} className="mt-4 flex gap-2">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a message..."
            />
            <Button type="submit" disabled={sendMessage.isPending}>
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
