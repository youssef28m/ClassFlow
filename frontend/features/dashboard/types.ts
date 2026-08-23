export interface TodaySession {
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

export interface AttendanceTrendPoint {
  date: string;
  present: number;
  total: number;
}

export interface MonthCollected {
  total: string;
  count: number;
}

export interface OverdueStudent {
  studentId: number;
  groupId: number;
  studentName: string;
  groupName: string;
  fee: string;
  dueDate: string;
  daysOverdue: number;
}

export interface OverdueStudents {
  items: OverdueStudent[];
  total: number;
}

export interface DashboardOverview {
  todaySessions: TodaySession[];
  attendanceTrend: AttendanceTrendPoint[];
  monthCollected: MonthCollected | null;
  overdueStudents: OverdueStudents | null;
}
