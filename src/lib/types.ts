export type EventType = "meetup" | "hackathon" | "workshop" | "lecture" | "networking";
export type EventStatus =
  | "draft" | "published" | "registration_open" | "registration_closed" | "ongoing" | "completed" | "cancelled";
export type TicketStatus = "registered" | "waitlisted" | "checked_in" | "cancelled" | "no_show";

export interface CampusEvent {
  id: string;
  slug: string;
  title: string;
  event_type: EventType;
  status: EventStatus;
  venue_id: string;
  organizer_user_id: string;
  start_time: string;
  end_time: string;
  capacity_limit: number;
  waitlist_enabled: boolean;
  version: number;
  free_spots: number;
  description: string;
  tags: string[];
  cover: string;
  venue_name: string;
  venue_address: string;
  registered_count: number;
  waitlist_count: number;
  checked_in_count: number;
  my_ticket?: { id: string; status: TicketStatus } | null;
  can_manage?: boolean;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Ticket {
  id: string;
  ticket_code: string;
  event_id: string;
  user_id: string;
  status: TicketStatus;
  created_at: string;
  qr_payload: string | null;
  event_title: string;
  event_start_time: string;
  event_end_time: string;
  event_cover: string;
  venue_name: string;
  waitlist_position: number | null;
}

export interface ScheduleItem {
  id: string;
  event_id: string;
  title: string;
  room: string;
  start_time: string;
  end_time: string;
  speaker_user_id?: string | null;
  speaker_name?: string | null;
  in_my_schedule: boolean;
}

export interface MyScheduleItem {
  id: string;
  event_id: string;
  event_title: string;
  title: string;
  room: string;
  start_time: string;
  end_time: string;
  speaker_name?: string | null;
  conflicts_with: string[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "attendee" | "team_lead" | "speaker" | "volunteer" | "organizer" | "admin";
  created_at?: string;
}

export interface Profile extends User {
  tickets_total: number;
  tickets_active: number;
  favourites: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  session_id: string;
  user: User;
}

export interface Session {
  id: string;
  user_agent: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  current: boolean;
}

export interface EventStats {
  event_id: string;
  capacity_limit: number;
  registered: number;
  checked_in: number;
  waitlisted: number;
  cancelled: number;
  free_spots: number;
  fill_rate: number;
  scans: Record<string, number>;
  checkins_by_hour: { hour: string; count: number }[];
}

export interface Attendee {
  id: string;
  ticket_code: string;
  status: TicketStatus;
  created_at: string;
  full_name: string;
  email: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  total_capacity: number;
}

export interface ChatItem {
  kind: "event" | "ticket" | "session";
  id: string;
  title: string;
  start_time: string;
  status?: string;
  free_spots?: number;
  event_title?: string;
  room?: string;
  venue_name?: string;
}

export interface ChatResponse {
  reply: string;
  intent: string;
  items: ChatItem[];
  suggestions: string[];
  tool: string | null;
}

export interface ApiProblem {
  status: number;
  code: string;
  message: string;
  errors?: Record<string, string>;
}
