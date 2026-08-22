import { describe, expect, it } from "vitest";
import {
  loginFormSchema,
  toLoginCredentials,
} from "@/features/auth/schema";

describe("loginFormSchema", () => {
  it("accepts username and password without centerId", () => {
    const result = loginFormSchema.safeParse({
      username: " receptionist1 ",
      password: "secret",
      centerId: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe("receptionist1");
    }
  });

  it("rejects blank or oversized usernames", () => {
    expect(
      loginFormSchema.safeParse({ username: "   ", password: "x" }).success,
    ).toBe(false);
    expect(
      loginFormSchema.safeParse({ username: "a".repeat(51), password: "x" })
        .success,
    ).toBe(false);
  });

  it("requires a password within the backend limit", () => {
    expect(loginFormSchema.safeParse({ username: "u", password: "" }).success).toBe(
      false,
    );
    expect(
      loginFormSchema.safeParse({ username: "u", password: "p".repeat(129) })
        .success,
    ).toBe(false);
  });

  it("allows empty or numeric-string centerId and rejects anything else", () => {
    const ok = loginFormSchema.safeParse({
      username: "u",
      password: "p",
      centerId: "42",
    });
    expect(ok.success).toBe(true);

    const empty = loginFormSchema.safeParse({
      username: "u",
      password: "p",
      centerId: "",
    });
    expect(empty.success).toBe(true);

    expect(
      loginFormSchema.safeParse({ username: "u", password: "p", centerId: "abc" })
        .success,
    ).toBe(false);
    expect(
      loginFormSchema.safeParse({ username: "u", password: "p", centerId: "1.5" })
        .success,
    ).toBe(false);
  });
});

describe("toLoginCredentials", () => {
  it("maps an empty centerId to undefined and trims the username", () => {
    expect(
      toLoginCredentials({ username: " admin1 ", password: "pw", centerId: "" }),
    ).toEqual({ username: "admin1", password: "pw", centerId: undefined });
  });

  it("converts a filled centerId to a number", () => {
    expect(
      toLoginCredentials({ username: "u", password: "p", centerId: "7" }),
    ).toEqual({ username: "u", password: "p", centerId: 7 });
  });
});
