import { z } from 'zod';

// ============ Zod Schemas ============

export const userSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  name: z.string().min(2),
  avatar: z.string().url().optional(),
  createdAt: z.string().datetime(),
});

export const groupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  emoji: z.string().optional(),
  memberIds: z.array(z.string().uuid()),
  adminIds: z.array(z.string().uuid()),
  createdAt: z.string().datetime(),
});

export const messageSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string(),
  imageUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
});

export const rsvpStatusSchema = z.enum(['going', 'maybe', 'cant']);

export const rsvpSchema = z.object({
  userId: z.string().uuid(),
  status: rsvpStatusSchema,
});

export const eventSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  locationCoords: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  dateTime: z.string().datetime(),
  rsvps: z.array(rsvpSchema),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
});

// ============ Inferred Types ============

export type User = z.infer<typeof userSchema>;
export type Group = z.infer<typeof groupSchema>;
export type Message = z.infer<typeof messageSchema>;
export type RSVPStatus = z.infer<typeof rsvpStatusSchema>;
export type RSVP = z.infer<typeof rsvpSchema>;
export type Event = z.infer<typeof eventSchema>;

// ============ Navigation Types ============

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  PhoneInput: undefined;
  OTPVerify: { phone: string };
  CreateProfile: undefined;
};

export type MainTabParamList = {
  Chats: undefined;
  Events: undefined;
  Profile: undefined;
};

export type ChatStackParamList = {
  GroupList: undefined;
  Chat: { groupId: string };
  GroupSettings: { groupId: string };
  CreateGroup: undefined;
};

export type EventStackParamList = {
  EventList: undefined;
  EventDetail: { eventId: string };
  CreateEvent: { groupId?: string };
};

// ============ API Types ============

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
