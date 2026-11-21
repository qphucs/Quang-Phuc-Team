/** 🔒 Realtime event names (docs/03-conventions.md §8). No server imports: safe for client components. */
export const EVENT_CHANNEL = "events";

export const EVENT_TYPES = ["member.created", "member.updated", "skill.updated", "learning.updated"] as const;
export type EventType = (typeof EVENT_TYPES)[number];
