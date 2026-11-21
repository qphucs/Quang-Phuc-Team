"use server";
import { z } from "zod";
import { action } from "@/lib/action";
import { listMyNotifications, markAllRead, unreadCount } from "./service";

export const listNotificationsAction = action({
  schema: z.object({}),
  permission: "skill:read",
  handler: (_input, { user }) => listMyNotifications(user.id),
});

export const unreadCountAction = action({
  schema: z.object({}),
  permission: "skill:read",
  handler: (_input, { user }) => unreadCount(user.id),
});

export const markAllReadAction = action({
  schema: z.object({}),
  permission: "skill:read",
  handler: (_input, { user }) => markAllRead(user.id),
});
