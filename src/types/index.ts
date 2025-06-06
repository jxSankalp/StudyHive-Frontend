// src/types/index.ts
export type Note = {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  author: string;
};

export type Meeting = {
  id: string;
  name: string;
  participants: number;
  status: "active" | "scheduled" | "ended";
  scheduledTime: string;
  duration: string;
};

export type Whiteboard = {
  id: string;
  title: string;
  lastModified: string;
  collaborators: number;
  thumbnail: string;
};
  

export interface Group {
  id: string;
  name: string;
  description: string;
  icon?: string; // or LucideIcon if you use icon components directly
  members: number;
  lastMessage: string;
  color: string;
}
