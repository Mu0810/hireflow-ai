export type InterviewType = "PHONE" | "VIDEO" | "IN_PERSON";
export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface Interview {
  id: string;
  applicationId: string;
  scheduledAt: string;
  durationMinutes: number;
  type: InterviewType;
  status: InterviewStatus;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewWithDetails extends Interview {
  application: {
    id: string;
    candidate: {
      id: string;
      name: string | null;
      email: string;
    };
    job: {
      id: string;
      title: string;
      company: {
        id: string;
        name: string;
      };
    };
  };
  messages: Message[];
}

export interface Message {
  id: string;
  interviewId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
}
