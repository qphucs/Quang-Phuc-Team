"use server";
import { action } from "@/lib/action";
import { addManualTrend, listFeed, listQueue, setTrendPinned, setTrendStatus, toggleSavedTrend } from "./service";
import {
  addTrendSchema,
  feedSchema,
  queueSchema,
  savedTrendSchema,
  trendPinSchema,
  trendStatusSchema,
} from "./schemas";

export const addTrendAction = action({
  schema: addTrendSchema,
  permission: "trend:approve",
  handler: (input, { user }) => addManualTrend(user, input),
});

export const setTrendStatusAction = action({
  schema: trendStatusSchema,
  permission: "trend:approve",
  handler: (input, { user }) => setTrendStatus(user, input.id, input.status),
});

export const setTrendPinAction = action({
  schema: trendPinSchema,
  permission: "trend:approve",
  handler: (input, { user }) => setTrendPinned(user, input.id, input.pinned),
});

export const listTrendFeedAction = action({
  schema: feedSchema,
  permission: "trend:read",
  handler: (input, { user }) => listFeed(input, user.id),
});

export const listTrendQueueAction = action({
  schema: queueSchema,
  permission: "trend:approve",
  handler: (input) => listQueue(input.status),
});

export const toggleSavedTrendAction = action({
  schema: savedTrendSchema,
  permission: "trend:read",
  handler: (input, { user }) => toggleSavedTrend(user.id, input.trendId),
});
