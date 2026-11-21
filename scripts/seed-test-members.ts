/**
 * Creates 5 test member accounts (thanhvien1 … thanhvien5) for local testing.
 * Run: pnpm seed:members
 * Existing usernames are skipped. Temporary passwords are printed once.
 */
import { createMemberRecord } from "@/features/members/service";
import { AppError } from "@/lib/errors";
import { db } from "@/db";

const TEST_MEMBERS = [
  { username: "thanhvien1", name: "Minh Anh" },
  { username: "thanhvien2", name: "Bình An" },
  { username: "thanhvien3", name: "Thu Hà" },
  { username: "thanhvien4", name: "Đức Huy" },
  { username: "thanhvien5", name: "Lan Chi" },
] as const;

async function main() {
  console.log("\nTài khoản thử:");
  for (const member of TEST_MEMBERS) {
    try {
      const created = await createMemberRecord({ ...member, role: "member", actorId: null });
      console.log(`  ✅ ${created.username}  mật khẩu tạm: ${created.tempPassword}`);
    } catch (error) {
      if (error instanceof AppError && error.code === "CONFLICT") {
        console.log(`  ↪ ${member.username} đã có, bỏ qua`);
      } else {
        throw error;
      }
    }
  }
  console.log("");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
