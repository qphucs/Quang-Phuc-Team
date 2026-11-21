/**
 * Background worker: runs the trend scan at 06:00 and 18:00 (Vietnam time).
 * Run: pnpm worker  (keep this terminal open while the team uses the web app locally)
 */
import cron from "node-cron";
import { runScan } from "@/features/trends/service";
import { db } from "@/db";

const SCHEDULE = "0 6,18 * * *";

const task = cron.schedule(
  SCHEDULE,
  async () => {
    const started = new Date().toISOString();
    console.log(`[worker] trend scan start ${started}`);
    try {
      const results = await runScan();
      if (results.length === 0) console.log("[worker] không có nguồn tự động nào được bật");
      for (const r of results) console.log(`[worker] ${r.source}: ${r.ok ? "ok" : "lỗi"} (+${r.created})`);
    } catch (error) {
      console.error("[worker] scan failed", error);
    }
  },
  { timezone: "Asia/Ho_Chi_Minh" },
);

console.log(`[worker] đang chạy, lịch quét: ${SCHEDULE} (giờ Việt Nam)`);

const shutdown = () => {
  task.stop();
  void db.$client.end().finally(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
