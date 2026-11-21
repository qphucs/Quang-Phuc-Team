import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

/** 🔒 Known settings keys. Add a key here before reading it anywhere. */
export const SETTING_KEYS = {
  trendAutoPublish: "trend_auto_publish",
} as const;

const DEFAULTS = {
  [SETTING_KEYS.trendAutoPublish]: false,
} as const;

export async function getBooleanSetting(key: (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]): Promise<boolean> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return typeof row?.value === "boolean" ? row.value : DEFAULTS[key];
}

export async function setBooleanSetting(key: (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS], value: boolean) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

export async function getOwnerSettings() {
  return {
    trendAutoPublish: await getBooleanSetting(SETTING_KEYS.trendAutoPublish),
  };
}
