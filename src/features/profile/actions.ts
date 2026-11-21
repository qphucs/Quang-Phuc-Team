"use server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { files, tiktokChannels, users } from "@/db/schema";
import { action } from "@/lib/action";
import { AppError } from "@/lib/errors";
import { emit } from "@/lib/realtime";
import { addChannelSchema, removeChannelSchema, setAvatarSchema, updateOwnProfileSchema } from "./schemas";

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

export const setMyAvatar = action({
  schema: setAvatarSchema,
  handler: async (input, { user }) => {
    const [file] = await db.select({ kind: files.kind }).from(files).where(eq(files.id, input.fileId)).limit(1);
    if (!file || file.kind !== "image") throw new AppError("VALIDATION_ERROR", "Hãy chọn một ảnh.");
    await db
      .update(users)
      .set({ image: `/api/files/${input.fileId}` })
      .where(eq(users.id, user.id));
    await emit("member.updated", { id: user.id });
    return { image: `/api/files/${input.fileId}` };
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
