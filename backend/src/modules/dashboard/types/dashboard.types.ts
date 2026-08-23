export interface TodaySessionDTO {
  id: number;
  groupId: number;
  groupName: string;
  room: string;
  teacherName: string | null;
  startTime: string;
  endTime: string;
  completed: boolean;
  expectedCount: number;
  presentCount: number;
}

export interface AttendanceTrendPointDTO {
  date: string;
  present: number;
  total: number;
}

export interface MonthCollectedDTO {
  total: string;
  count: number;
}

export interface OverdueStudentDTO {
  studentId: number;
  groupId: number;
  studentName: string;
  groupName: string;
  fee: string;
  dueDate: string;
  daysOverdue: number;
}

export interface OverdueStudentsDTO {
  items: OverdueStudentDTO[];
  total: number;
}

export interface MonthlyRevenuePointDTO {
  month: string;
  total: string;
}

export interface DashboardOverviewDTO {
  monthlyRevenue: MonthlyRevenuePointDTO[] | null;
  todaySessions: TodaySessionDTO[];
  attendanceTrend: AttendanceTrendPointDTO[];
  monthCollected: MonthCollectedDTO | null;
  overdueStudents: OverdueStudentsDTO | null;
}

export const TREND_DAYS = 28;

function toTimeLabel(value: Date): string {
  return value.toISOString().slice(11, 16);
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

interface SessionWithAttendance {
  id: number;
  groupId: number;
  completed: boolean;
  sessionDate: Date;
  schedule: { startTime: Date; endTime: Date };
  group: {
    name: string;
    room: string;
    teacher: { fullName: string } | null;
  };
  attendanceRecords: Array<{ status: 'PRESENT' | 'ABSENT' }>;
}

export function toTodaySessionDTO(session: SessionWithAttendance): TodaySessionDTO {
  const presentCount = session.attendanceRecords.filter(
    (record) => record.status === 'PRESENT',
  ).length;
  return {
    id: session.id,
    groupId: session.groupId,
    groupName: session.group.name,
    room: session.group.room,
    teacherName: session.group.teacher?.fullName ?? null,
    startTime: toTimeLabel(session.schedule.startTime),
    endTime: toTimeLabel(session.schedule.endTime),
    completed: session.completed,
    expectedCount: session.attendanceRecords.length,
    presentCount,
  };
}

export function buildTrend(
  sessions: Array<Pick<SessionWithAttendance, 'sessionDate' | 'attendanceRecords'>>,
  trendStartUtcMs: number,
  days: number,
): AttendanceTrendPointDTO[] {
  const buckets = new Map<string, AttendanceTrendPointDTO>();
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(trendStartUtcMs + offset * 86_400_000);
    buckets.set(toIsoDate(date), { date: toIsoDate(date), present: 0, total: 0 });
  }
  for (const session of sessions) {
    const bucket = buckets.get(toIsoDate(session.sessionDate));
    if (!bucket) continue;
    for (const record of session.attendanceRecords) {
      bucket.total += 1;
      if (record.status === 'PRESENT') bucket.present += 1;
    }
  }
  return [...buckets.values()];
}
