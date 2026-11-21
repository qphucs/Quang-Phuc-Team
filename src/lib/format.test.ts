import { describe, expect, it } from "vitest";
import { formatCompact, formatDate, formatNumber, formatRelative, formatTime } from "./format";

describe("format", () => {
  it("formats dates in GMT+7", () => {
    const utcLateNight = new Date("2026-11-21T20:30:00Z"); // 03:30 on 22/11 in Vietnam
    expect(formatDate(utcLateNight)).toBe("22/11/2026");
    expect(formatTime(utcLateNight)).toBe("03:30");
  });

  it("formats numbers the Vietnamese way", () => {
    expect(formatNumber(12500)).toBe("12.500");
    expect(formatCompact(999)).toBe("999");
    expect(formatCompact(1234)).toBe("1,2K");
    expect(formatCompact(3_456_789)).toBe("3,4M");
    expect(formatCompact(1_100_000_000)).toBe("1,1B");
  });

  it("formats relative time", () => {
    const now = new Date("2026-11-21T10:00:00Z");
    expect(formatRelative(new Date("2026-11-21T09:59:30Z"), now)).toBe("Vừa xong");
    expect(formatRelative(new Date("2026-11-01T10:00:00Z"), now)).toBe("01/11/2026");
  });
});
