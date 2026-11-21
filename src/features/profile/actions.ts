"use server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tiktokChannels, users } from "@/db/schema";
import { action } from "@/lib/action";
import { AppError } from "@/lib/errors";
import { emit } from "@/lib/realtime";
import { addChannelSchema, removeChannelSchema, updateOwnProfileSchema } from "./schemas";

/** Any signed-in member edits their own profile. */
export const updateOwnProfile = action({
  schema: updateOwnProfileSchema,
  handler: async (input, { user }) => {
    await db
      .update(users)
      .set({ name: input.name, phone: input.phone ? input.phone : null })
      .where(eq(users.id, user.id));
    await emit("member.updated", { id: user.id });
    return { id: user.id };
  },
});

export const listMyChannels = action({
  schema: z.object({}),
  handler: async (_input, { user }) =>
    db
      .select({ id: tiktokChannels.id, username: tiktokChannels.username, url: tiktokChannels.url })
      .from(tiktokChannels)
      .where(eq(tiktokChannels.userId, user.id))
      .orderBy(asc(tiktokChannels.createdAt)),
});

export const addMyChannel = action({
  schema: addChannelSchema,
  handler: async (input, { user }) => {
    const handle = input.username.replace(/^@/, "");
    const [existing] = await db
      .select({ id: tiktokChannels.id })
      .from(tiktokChannels)
      .where(and(eq(tiktokChannels.userId, user.id), eq(tiktokChannels.username, handle)))
      .limit(1);
    if (existing) throw new AppError("CONFLICT", "Kênh này đã có trong danh sách của bạn.");

    const [row] = await db
      .insert(tiktokChannels)
      .values({ userId: user.id, username: handle, url: `https://www.tiktok.com/@${handle}` })
      .returning({ id: tiktokChannels.id, username: tiktokChannels.username, url: tiktokChannels.url });
    return row;
  },
});

export const removeMyChannel = action({
  schema: removeChannelSchema,
  handler: async (input, { user }) => {
    await db.delete(tiktokChannels).where(and(eq(tiktokChannels.id, input.id), eq(tiktokChannels.userId, user.id)));
    return { id: input.id };
  },
});
