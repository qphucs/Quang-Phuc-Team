import { describe, expect, it } from "vitest";
import { can } from "./permissions";

describe("permissions (docs/01-scope.md §3)", () => {
  it("members can use the app but not manage it", () => {
    const member = { role: "member" };
    expect(can(member, "download:use")).toBe(true);
    expect(can(member, "skill:write")).toBe(false);
    expect(can(member, "member:manage")).toBe(false);
  });

  it("admins manage content and members but not other admins", () => {
    const admin = { role: "admin" };
    expect(can(admin, "skill:write")).toBe(true);
    expect(can(admin, "member:manage")).toBe(true);
    expect(can(admin, "admin:manage")).toBe(false);
    expect(can(admin, "system:settings")).toBe(false);
  });

  it("owner can do everything; unknown roles nothing", () => {
    expect(can({ role: "owner" }, "system:settings")).toBe(true);
    expect(can({ role: "hacker" }, "skill:read")).toBe(false);
    expect(can(null, "skill:read")).toBe(false);
  });
});
