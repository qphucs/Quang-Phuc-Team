/**
 * Creates the first owner account.
 * Run: pnpm seed            (username defaults to "owner")
 *      pnpm seed -- phuc    (custom username)
 * A random temporary password is printed once; it must be changed at first sign-in.
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth, toSyntheticEmail } from "@/lib/auth";

async function main() {
  const username = (process.argv[2] ?? "owner").toLowerCase();

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  if (existing.length > 0) {
    console.log(`Tài khoản "${username}" đã tồn tại — bỏ qua.`);
    return;
  }

  const password = randomBytes(9).toString("base64url"); // 12 chars
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);

  const user = await ctx.internalAdapter.createUser(
    {
      name: "Quang Phúc",
      email: toSyntheticEmail(username),
      emailVerified: true,
      username,
      displayUsername: username,
      role: "owner",
      mustChangePassword: true,
    },
    { method: "admin" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: hash,
  });

  console.log("\n✅ Đã tạo tài khoản chủ team");
  console.log(`   Tên đăng nhập : ${username}`);
  console.log(`   Mật khẩu tạm  : ${password}`);
  console.log("   (Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên)\n");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
