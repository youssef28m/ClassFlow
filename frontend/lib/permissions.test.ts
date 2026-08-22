import { describe, expect, it } from "vitest";
import {
  can,
  canManageUserAccount,
  hasPermission,
  resolveScope,
} from "@/lib/permissions";

describe("can", () => {
  it("grants SUPERADMIN every action on every resource", () => {
    expect(can({ role: "SUPERADMIN" }, "students", "delete")).toBe(true);
    expect(can({ role: "SUPERADMIN" }, "users", "delete")).toBe(true);
    expect(
      can({ role: "SUPERADMIN" }, "paymentsAndExpenses", "manageExpenses"),
    ).toBe(true);
    expect(
      can({ role: "SUPERADMIN" }, "teachersAndSalaries", "manageSalaries"),
    ).toBe(true);
    expect(
      can({ role: "SUPERADMIN" }, "groupsAndSessions", "markAttendance"),
    ).toBe(true);
  });

  it("limits ADMIN to center scope with no center administration", () => {
    expect(can({ role: "ADMIN" }, "users", "create")).toBe(true);
    expect(can({ role: "ADMIN" }, "students", "delete")).toBe(true);
    expect(can({ role: "ADMIN" }, "centers", "read")).toBe(true);
    expect(can({ role: "ADMIN" }, "centers", "update")).toBe(false);
  });

  it("gives MANAGER operations but no user management or payment management", () => {
    expect(can({ role: "MANAGER" }, "students", "create")).toBe(true);
    expect(
      can({ role: "MANAGER" }, "groupsAndSessions", "manageGroups"),
    ).toBe(true);
    expect(
      can({ role: "MANAGER" }, "teachersAndSalaries", "manageSalaries"),
    ).toBe(true);
    expect(can({ role: "MANAGER" }, "users", "read")).toBe(false);
    expect(
      can({ role: "MANAGER" }, "paymentsAndExpenses", "managePayments"),
    ).toBe(false);
  });

  it("keeps ACCOUNTANT finance-focused and read-only on academics", () => {
    expect(
      can({ role: "ACCOUNTANT" }, "paymentsAndExpenses", "managePayments"),
    ).toBe(true);
    expect(
      can({ role: "ACCOUNTANT" }, "teachersAndSalaries", "manageSalaries"),
    ).toBe(true);
    expect(can({ role: "ACCOUNTANT" }, "students", "read")).toBe(true);
    expect(can({ role: "ACCOUNTANT" }, "students", "update")).toBe(false);
    expect(
      can({ role: "ACCOUNTANT" }, "paymentsAndExpenses", "logPayment"),
    ).toBe(false);
    expect(can({ role: "ACCOUNTANT" }, "users", "read")).toBe(false);
  });

  it("restricts RECEPTIONIST to front-desk duties", () => {
    expect(can({ role: "RECEPTIONIST" }, "students", "create")).toBe(true);
    expect(can({ role: "RECEPTIONIST" }, "students", "update")).toBe(true);
    expect(can({ role: "RECEPTIONIST" }, "students", "delete")).toBe(false);
    expect(
      can({ role: "RECEPTIONIST" }, "paymentsAndExpenses", "logPayment"),
    ).toBe(true);
    expect(can({ role: "RECEPTIONIST" }, "paymentsAndExpenses", "read")).toBe(
      false,
    );
    expect(
      can({ role: "RECEPTIONIST" }, "teachersAndSalaries", "readTeachers"),
    ).toBe(true);
    expect(
      can({ role: "RECEPTIONIST" }, "teachersAndSalaries", "manageSalaries"),
    ).toBe(false);
  });

  it("denies missing or unknown actors", () => {
    expect(can(null, "students", "read")).toBe(false);
    expect(can(undefined, "students", "read")).toBe(false);
  });
});

describe("hasPermission", () => {
  it("checks runtime string pairs for config-driven navigation", () => {
    expect(hasPermission({ role: "RECEPTIONIST" }, "students", "read")).toBe(
      true,
    );
    expect(hasPermission({ role: "RECEPTIONIST" }, "users", "read")).toBe(
      false,
    );
    expect(hasPermission(null, "students", "read")).toBe(false);
  });

  it("returns false for actions outside the vocabulary", () => {
    expect(hasPermission({ role: "SUPERADMIN" }, "students", "fly")).toBe(
      false,
    );
  });
});

describe("resolveScope", () => {
  it("resolves SUPERADMIN to global access", () => {
    expect(resolveScope({ role: "SUPERADMIN" })).toBe("all");
  });

  it("resolves every other role to center scope", () => {
    for (const role of ["ADMIN", "MANAGER", "ACCOUNTANT", "RECEPTIONIST"] as const) {
      expect(resolveScope({ role })).toBe("center");
    }
  });
});

describe("canManageUserAccount", () => {
  it("lets SUPERADMIN manage anyone including admins", () => {
    expect(canManageUserAccount({ role: "SUPERADMIN" }, "SUPERADMIN")).toBe(
      true,
    );
  });

  it("lets ADMIN manage strictly lower roles only", () => {
    expect(canManageUserAccount({ role: "ADMIN" }, "MANAGER")).toBe(true);
    expect(canManageUserAccount({ role: "ADMIN" }, "RECEPTIONIST")).toBe(true);
    expect(canManageUserAccount({ role: "ADMIN" }, "ADMIN")).toBe(false);
    expect(canManageUserAccount({ role: "ADMIN" }, "SUPERADMIN")).toBe(false);
  });

  it("denies everyone below ADMIN", () => {
    expect(canManageUserAccount({ role: "MANAGER" }, "RECEPTIONIST")).toBe(
      false,
    );
    expect(canManageUserAccount({ role: "RECEPTIONIST" }, "RECEPTIONIST")).toBe(
      false,
    );
  });
});
