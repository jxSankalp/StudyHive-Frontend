// src/types/index.ts
export interface Note {
  _id: string;
  name: string;
  content: string;
  createdBy: {
    _id: string;
    username: string;
    email: string;
  } | null;
  chat: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  tags: string[];
}

export type Meeting = {
  /** Stream call_id — used as the route parameter for /meeting/:id */
  id: string;
  /** Supabase UUID — used for status-update API calls */
  meetingDbId?: string;
  name: string;
  participants: number;
  status: "active" | "scheduled" | "ended";
  scheduledTime: string;
  duration: string;
  durationMinutes?: number;
  description: string;
  scheduledAt: string;
  canManage?: boolean;
};

export type WorkspaceTask = {
  id: string;
  chatId: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueAt: string | null;
  assigneeId: string | null;
  createdById: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; username: string; email?: string; photo?: string | null } | null;
  createdBy: { id: string; username: string; email?: string; photo?: string | null } | null;
};

export type CalendarEventColor = "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet";

export interface CalendarEvent {
  id: string;
  chatId: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  color: CalendarEventColor;
  meetingId: string | null;
  workspace: { id: string; name: string };
  meeting: { id: string; callId: string; name: string; status: string } | null;
  createdById: string | null;
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Whiteboard = {
  _id: string;
  title: string;
  groupId: string;
  createdBy: {
    _id: string;
    username?: string;
  } | null;
  data: unknown;
  createdAt: string;
  updatedAt: string;
};

export interface Group {
  _id: string;
  chatName: string;
  description: string;
  icon?: string;
  usercount: number;
  lastMessage: string;
  color?: string;
}

export interface CreateGroupModalProps {
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  onGroupCreated: () => void;
}

export interface IUser {
  _id: string;
  username: string;
  email: string;
}

export interface ApiProfile {
  id: string;
  username: string;
  email: string;
  photo?: string | null;
}

export interface ApiChatMember {
  user_id: string;
  role?: "owner" | "admin" | "member";
  joined_at?: string;
  profiles: ApiProfile | null;
}

export interface ApiChat {
  id: string;
  chat_name: string;
  description?: string | null;
  group_admin_id?: string | null;
  chat_members?: ApiChatMember[];
  messages?: { id: string; content: string; created_at: string } | null;
}
