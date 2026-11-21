"use server";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { action } from "@/lib/action";
import { getOwnerSettings, setBooleanSetting, SETTING_KEYS } from "@/lib/settings";

export const getOwnerSettingsAction = action({
  schema: z.object({}),
  permission: "system:settings",
  handler: () => getOwnerSettings(),
});

export const setTrendAutoPublishAction = action({
  schema: z.object({ value: z.boolean() }),
  permission: "system:settings",
  handler: async (input, { user }) => {
    await setBooleanSetting(SETTING_KEYS.trendAutoPublish, input.value);
    await writeAudit({
      actorId: user.id,
      action: "settings.trend_auto_publish",
      targetType: "setting",
      targetId: SETTING_KEYS.trendAutoPublish,
      meta: { value: input.value },
    });
    return { value: input.value };
  },
});
