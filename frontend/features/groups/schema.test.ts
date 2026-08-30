import { describe, expect, it } from "vitest";
import {
  groupFormSchema,
  toGroupFormValues,
  toGroupPayload,
  type GroupFormValues,
} from "@/features/groups/schema";

const VALID_FORM = {
  teacherId: "5",
  name: "Physics A",
  subject: "Physics",
  room: "Room 2",
  fee: "150",
  paymentType: "MONTHLY",
  maxStudents: "20",
  billingAnchorDay: "10",
} as const satisfies GroupFormValues;

describe("groupFormSchema", () => {
  it("accepts a minimal valid form", () => {
    expect(groupFormSchema.safeParse(VALID_FORM).success).toBe(true);
  });

  it("requires teacher, name, subject, room, fee and maxStudents", () => {
    const required = ["teacherId", "name", "subject", "room", "fee", "maxStudents"] as const;
    for (const field of required) {
      const parsed = groupFormSchema.safeParse({ ...VALID_FORM, [field]: "" });
      expect(parsed.success).toBe(false);
    }
  });

  it("validates fee format and amount", () => {
    for (const fee of ["abc", "1.234", "-5", "0"]) {
      expect(groupFormSchema.safeParse({ ...VALID_FORM, fee }).success).toBe(false);
    }
    expect(groupFormSchema.safeParse({ ...VALID_FORM, fee: "99.99" }).success).toBe(true);
  });

  it("enforces maxStudents bounds", () => {
    expect(groupFormSchema.safeParse({ ...VALID_FORM, maxStudents: "0" }).success).toBe(false);
    expect(groupFormSchema.safeParse({ ...VALID_FORM, maxStudents: "501" }).success).toBe(false);
    expect(groupFormSchema.safeParse({ ...VALID_FORM, maxStudents: "20.5" }).success).toBe(false);
    expect(groupFormSchema.safeParse({ ...VALID_FORM, maxStudents: "500" }).success).toBe(true);
  });

  it("rejects an unknown payment type", () => {
    expect(
      groupFormSchema.safeParse({ ...VALID_FORM, paymentType: "WEEKLY" }).success,
    ).toBe(false);
  });

  it("maps form values to the API payload with numeric fields", () => {
    const payload = toGroupPayload(VALID_FORM);
    expect(payload).toEqual({
      teacherId: 5,
      name: "Physics A",
      subject: "Physics",
      room: "Room 2",
      fee: "150",
      paymentType: "MONTHLY",
      maxStudents: 20,
      billingAnchorDay: 10,
    });
  });

  it("enforces billingAnchorDay bounds", () => {
    expect(groupFormSchema.safeParse({ ...VALID_FORM, billingAnchorDay: "0" }).success).toBe(false);
    expect(groupFormSchema.safeParse({ ...VALID_FORM, billingAnchorDay: "29" }).success).toBe(false);
    expect(groupFormSchema.safeParse({ ...VALID_FORM, billingAnchorDay: "1" }).success).toBe(true);
    expect(groupFormSchema.safeParse({ ...VALID_FORM, billingAnchorDay: "28" }).success).toBe(true);
  });

  it("round-trips a DTO into editable values", () => {
    const values = toGroupFormValues({
      id: 3,
      teacherId: 7,
      name: "Math B",
      subject: "Math",
      room: "Room 1",
      fee: "200.00",
      paymentType: "TERMLY",
      maxStudents: 15,
      billingAnchorDay: 10,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    });
    expect(values.teacherId).toBe("7");
    expect(values.fee).toBe("200.00");
    expect(values.maxStudents).toBe("15");
    expect(values.billingAnchorDay).toBe("10");
    expect(groupFormSchema.safeParse(values).success).toBe(true);
  });
});
