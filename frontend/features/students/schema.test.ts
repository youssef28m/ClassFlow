import { describe, expect, it } from "vitest";
import {
  studentFormSchema,
  toStudentFormValues,
  toStudentPayload,
} from "@/features/students/schema";
import type { Student } from "@/features/students/types";

const VALID_FORM = {
  fullName: "Ahmed Mohamed",
  phone: "",
  parentPhone: "0100000000",
  grade: "Grade 7",
  school: "",
  joinDate: "2026-08-23",
  status: "ACTIVE",
  notes: "",
} as const;

describe("studentFormSchema", () => {
  it("accepts a minimal valid form", () => {
    expect(studentFormSchema.safeParse(VALID_FORM).success).toBe(true);
  });

  it("requires fullName, grade and joinDate", () => {
    const required = ["fullName", "grade", "joinDate"] as const;
    for (const field of required) {
      const parsed = studentFormSchema.safeParse({ ...VALID_FORM, [field]: "" });
      expect(parsed.success).toBe(false);
    }
  });

  it("enforces backend length limits", () => {
    expect(
      studentFormSchema.safeParse({
        ...VALID_FORM,
        fullName: "a".repeat(101),
      }).success,
    ).toBe(false);
    expect(
      studentFormSchema.safeParse({ ...VALID_FORM, notes: "n".repeat(501) })
        .success,
    ).toBe(false);
    expect(
      studentFormSchema.safeParse({ ...VALID_FORM, notes: "n".repeat(500) })
        .success,
    ).toBe(true);
  });

  it("rejects unparseable join dates", () => {
    expect(
      studentFormSchema.safeParse({ ...VALID_FORM, joinDate: "not-a-date" })
        .success,
    ).toBe(false);
  });

  it("rejects unknown statuses", () => {
    expect(
      studentFormSchema.safeParse({ ...VALID_FORM, status: "EXPELLED" })
        .success,
    ).toBe(false);
  });
});

describe("toStudentPayload", () => {
  it("maps empty optional strings to null so the backend clears them", () => {
    const payload = toStudentPayload({ ...VALID_FORM });
    expect(payload.phone).toBeNull();
    expect(payload.school).toBeNull();
    expect(payload.notes).toBeNull();
    expect(payload.parentPhone).toBe("0100000000");
  });
});

describe("toStudentFormValues", () => {
  it("round-trips a student DTO into form shape", () => {
    const student = {
      id: 1,
      fullName: "Sara Ali",
      phone: null,
      parentPhone: "0111111111",
      grade: "Grade 5",
      school: "El-Nasr",
      joinDate: "2026-08-23T00:00:00.000Z",
      status: "INACTIVE",
      notes: null,
      createdAt: "2026-08-23T00:00:00.000Z",
      updatedAt: "2026-08-23T00:00:00.000Z",
    } as Student;

    const values = toStudentFormValues(student);
    expect(values.phone).toBe("");
    expect(values.notes).toBe("");
    expect(values.joinDate).toBe("2026-08-23");
    expect(studentFormSchema.safeParse(values).success).toBe(true);
  });
});
