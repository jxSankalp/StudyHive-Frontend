// src/types/index.ts
export interface Note {
  _id: string;
  name: string;
  content: string;
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
  chat: string;
  createdAt: string;
  updatedAt: string;
}

export type Meeting = {
  id: string;
  name: string;
  participants: number;
  status: "active" | "scheduled" | "ended";
  scheduledTime: string;
  duration: string;
};

export type Whiteboard = {
  _id: string;
  title: string;
  groupId: string;
  createdBy: {
    _id: string;
    username: string;
  };
  data: any;
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
  color: string;
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