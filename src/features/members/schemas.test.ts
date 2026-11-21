import { describe, expect, it } from "vitest";
import { createMemberSchema, updateMemberSchema } from "./schemas";
import { generateTempPassword } from "@/lib/temp-password";

describe("createMemberSchema", () => {
  it("accepts a valid member and normalizes the username", () => {
    const parsed = createMemberSchema.parse({ username: "  MinhAnh.01 ", name: "Minh Anh" });
    expect(parsed.username).toBe("minhanh.01");
    expect(parsed.role).toBe("member");
  });

  it("rejects usernames with spaces or accents", () => {
    expect(createMemberSchema.safeParse({ username: "minh anh", name: "A" }).success).toBe(false);
    expect(createMemberSchema.safeParse({ username: "minhánh", name: "A" }).success).toBe(false);
  });

  it("rejects short usernames and empty names", () => {
    expect(createMemberSchema.safeParse({ username: "ab", name: "A" }).success).toBe(false);
    expect(createMemberSchema.safeParse({ username: "abc", name: "   " }).success).toBe(false);
  });
});

describe("updateMemberSchema", () => {
  it("requires a UUID id", () => {
    expect(updateMemberSchema.safeParse({ id: "not-a-uuid", name: "A" }).success).toBe(false);
  });
});

describe("generateTempPassword", () => {
  it("produces 10 readable characters without look-alikes", () => {
    const pw = generateTempPassword();
    expect(pw).toHaveLength(10);
    expect(pw).toMatch(/^[a-zA-Z2-9]+$/);
    expect(pw).not.toMatch(/[0O1lI]/);
  });
});
