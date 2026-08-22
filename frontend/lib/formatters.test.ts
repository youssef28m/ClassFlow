import { describe, expect, it } from "vitest";
import { formatDate, humanizeEnum } from "@/lib/formatters";

describe("formatDate", () => {
  it("formats ISO timestamps deterministically in UTC", () => {
    expect(formatDate("2025-09-01T00:00:00.000Z")).toBe("1 Sept 2025");
    expect(formatDate(new Date("2025-12-31T00:00:00.000Z"))).toBe(
      "31 Dec 2025",
    );
  });

  it("returns an em dash for invalid input", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });
});

describe("humanizeEnum", () => {
  it("converts SCREAMING_SNAKE_CASE to readable labels", () => {
    expect(humanizeEnum("ACTIVE")).toBe("Active");
    expect(humanizeEnum("PER_SESSION")).toBe("Per session");
    expect(humanizeEnum("INACTIVE")).toBe("Inactive");
  });
});
