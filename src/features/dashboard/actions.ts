"use server";
import { z } from "zod";
import { action } from "@/lib/action";
import { getDashboard } from "./service";

export const getDashboardAction = action({
  schema: z.object({}),
  permission: "member:manage",
  handler: () => getDashboard(),
});
