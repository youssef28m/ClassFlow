import { describe, expect, it } from "vitest";
import { currentBillingPeriod } from "@/features/payments/billing-cycle";

describe("currentBillingPeriod", () => {
  it("returns null for PER_SESSION groups", () => {
    expect(currentBillingPeriod("2026-01-10", "PER_SESSION", 7, new Date(Date.UTC(2026, 7, 30)))).toBeNull();
  });

  it("returns the anchor-aligned current period for a monthly group", () => {
    const result = currentBillingPeriod(
      "2026-08-25",
      "MONTHLY",
      7,
      new Date(Date.UTC(2026, 7, 30)),
    );
    expect(result).toEqual({
      periodStart: new Date(Date.UTC(2026, 7, 7)),
      dueDate: new Date(Date.UTC(2026, 8, 7)),
    });
  });

  it("advances to a later period when the anchor date is in the past", () => {
    const result = currentBillingPeriod(
      "2026-01-15",
      "MONTHLY",
      20,
      new Date(Date.UTC(2026, 3, 25)),
    );
    expect(result).toEqual({
      periodStart: new Date(Date.UTC(2026, 3, 20)),
      dueDate: new Date(Date.UTC(2026, 4, 20)),
    });
  });

  it("supports multi-month periods", () => {
    const result = currentBillingPeriod(
      "2026-01-15",
      "TERMLY",
      20,
      new Date(Date.UTC(2026, 7, 30)),
    );
    expect(result).toEqual({
      periodStart: new Date(Date.UTC(2026, 6, 20)),
      dueDate: new Date(Date.UTC(2026, 9, 20)),
    });
  });
});
