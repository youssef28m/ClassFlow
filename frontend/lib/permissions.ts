import type { AuthUser, UserRole } from "@/types/auth";

export const RESOURCES = [
  "centers",
  "users",
  "students",
  "teachersAndSalaries",
  "groupsAndSessions",
  "paymentsAndExpenses",
] as const;

export type Resource = (typeof RESOURCES)[number];

export const RESOURCE_ACTIONS = {
  centers: ["read", "create", "update", "delete"],
  users: ["read", "create", "update", "delete"],
  students: ["read", "create", "update", "delete"],
  teachersAndSalaries: [
    "readTeachers",
    "createTeacher",
    "updateTeacher",
    "deleteTeacher",
    "manageSalaries",
  ],
  groupsAndSessions: [
    "read",
    "manageGroups",
    "manageSchedules",
    "manageSessions",
    "markAttendance",
  ],
  paymentsAndExpenses: [
    "read",
    "logPayment",
    "managePayments",
    "createExpense",
    "manageExpenses",
  ],
} as const satisfies Record<Resource, readonly string[]>;

export type ActionsOf<R extends Resource> = (typeof RESOURCE_ACTIONS)[R][number];

export type Scope = "all" | "center";

interface GrantOf<R extends Resource> {
  scope: Scope;
  actions: readonly ActionsOf<R>[];
}

type PermissionTable = Record<UserRole, { [R in Resource]?: GrantOf<R> }>;

export const PERMISSIONS: PermissionTable = {
  SUPERADMIN: {
    centers: { scope: "all", actions: ["read", "create", "update", "delete"] },
    users: { scope: "all", actions: ["read", "create", "update", "delete"] },
    students: { scope: "all", actions: ["read", "create", "update", "delete"] },
    teachersAndSalaries: {
      scope: "all",
      actions: [
        "readTeachers",
        "createTeacher",
        "updateTeacher",
        "deleteTeacher",
        "manageSalaries",
      ],
    },
    groupsAndSessions: {
      scope: "all",
      actions: ["read", "manageGroups", "manageSchedules", "manageSessions", "markAttendance"],
    },
    paymentsAndExpenses: {
      scope: "all",
      actions: ["read", "logPayment", "managePayments", "createExpense", "manageExpenses"],
    },
  },

  ADMIN: {
    centers: { scope: "center", actions: ["read"] },
    users: { scope: "center", actions: ["read", "create", "update", "delete"] },
    students: { scope: "center", actions: ["read", "create", "update", "delete"] },
    teachersAndSalaries: {
      scope: "center",
      actions: [
        "readTeachers",
        "createTeacher",
        "updateTeacher",
        "deleteTeacher",
        "manageSalaries",
      ],
    },
    groupsAndSessions: {
      scope: "center",
      actions: ["read", "manageGroups", "manageSchedules", "manageSessions", "markAttendance"],
    },
    paymentsAndExpenses: {
      scope: "center",
      actions: ["read", "logPayment", "managePayments", "createExpense", "manageExpenses"],
    },
  },

  MANAGER: {
    centers: { scope: "center", actions: ["read"] },
    students: { scope: "center", actions: ["read", "create", "update", "delete"] },
    teachersAndSalaries: {
      scope: "center",
      actions: [
        "readTeachers",
        "createTeacher",
        "updateTeacher",
        "deleteTeacher",
        "manageSalaries",
      ],
    },
    groupsAndSessions: {
      scope: "center",
      actions: ["read", "manageGroups", "manageSchedules", "manageSessions", "markAttendance"],
    },
    paymentsAndExpenses: { scope: "center", actions: ["read", "createExpense"] },
  },

  ACCOUNTANT: {
    students: { scope: "center", actions: ["read"] },
    teachersAndSalaries: {
      scope: "center",
      actions: ["readTeachers", "manageSalaries"],
    },
    groupsAndSessions: { scope: "center", actions: ["read"] },
    paymentsAndExpenses: {
      scope: "center",
      actions: ["read", "managePayments", "createExpense", "manageExpenses"],
    },
  },

  RECEPTIONIST: {
    students: { scope: "center", actions: ["read", "create", "update"] },
    teachersAndSalaries: { scope: "center", actions: ["readTeachers"] },
    groupsAndSessions: { scope: "center", actions: ["read", "markAttendance"] },
    paymentsAndExpenses: { scope: "center", actions: ["logPayment"] },
  },
};

export function can<R extends Resource>(
  actor: Pick<AuthUser, "role"> | null | undefined,
  resource: R,
  action: ActionsOf<R>,
): boolean {
  if (!actor) return false;
  return PERMISSIONS[actor.role][resource]?.actions.includes(action) === true;
}

export function hasPermission(
  actor: Pick<AuthUser, "role"> | null | undefined,
  resource: Resource,
  action: string,
): boolean {
  if (!actor) return false;
  const grant = PERMISSIONS[actor.role][resource];
  return grant?.actions.includes(action as never) === true;
}

export function resolveScope(actor: Pick<AuthUser, "role">): Scope {
  for (const grant of Object.values(PERMISSIONS[actor.role])) {
    if (grant) return grant.scope;
  }
  return "center";
}

const ROLE_RANK: Record<UserRole, number> = {
  SUPERADMIN: 4,
  ADMIN: 3,
  MANAGER: 2,
  ACCOUNTANT: 1,
  RECEPTIONIST: 0,
};

export function canManageUserAccount(
  actor: Pick<AuthUser, "role">,
  targetRole: UserRole,
): boolean {
  if (actor.role === "SUPERADMIN") return true;
  if (actor.role === "ADMIN") return ROLE_RANK[targetRole] < ROLE_RANK.ADMIN;
  return false;
}
