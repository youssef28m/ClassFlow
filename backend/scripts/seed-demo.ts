import {
  DayOfWeek,
  PaymentMethod,
  PaymentType,
  StudentStatus,
} from '../src/generated/prisma/client.js';
import { prisma } from '../src/shared/prisma/prisma-client.js';

const FIRST_NAMES = [
  'أحمد',
  'مريم',
  'عمر',
  'نور',
  'يوسف',
  'سلمى',
  'كريم',
  'ليلى',
  'حسن',
  'فرح',
  'آدم',
  'جنى',
  'مصطفى',
  'هناء',
  'زياد',
  'ملك',
  'طارق',
  'ريم',
  'خالد',
  'آية',
];

const LAST_NAMES = [
  'محمد',
  'علي',
  'حسن',
  'إبراهيم',
  'محمود',
  'سيد',
  'فتحي',
  'ياسين',
  'عادل',
  'نبيل',
];

const SCHOOLS = ['مدرسة النور', 'مدرسة المستقبل اللغوية', 'الأكاديمية الحديثة'];

const GRADES = [
  'الصف الرابع',
  'الصف الخامس',
  'الصف السادس',
  'الأول الإعدادي',
  'الثاني الإعدادي',
  'الثالث الإعدادي',
];

const TEACHERS = [
  { fullName: 'منى عبد الرحمن', specialization: 'الرياضيات' },
  { fullName: 'شريف كمال', specialization: 'الفيزياء' },
  { fullName: 'هبة فاروق', specialization: 'الكيمياء' },
  { fullName: 'عمرو السيد', specialization: 'اللغة الإنجليزية' },
];

const GROUPS = [
  {
    name: 'الرياضيات أ',
    subject: 'الرياضيات',
    room: 'قاعة 101',
    fee: '450.00',
    paymentType: PaymentType.MONTHLY,
    maxStudents: 15,
  },
  {
    name: 'الرياضيات ب',
    subject: 'الرياضيات',
    room: 'قاعة 101',
    fee: '450.00',
    paymentType: PaymentType.MONTHLY,
    maxStudents: 15,
  },
  {
    name: 'الفيزياء أ',
    subject: 'الفيزياء',
    room: 'معمل 1',
    fee: '500.00',
    paymentType: PaymentType.TERMLY,
    maxStudents: 12,
  },
  {
    name: 'الكيمياء أ',
    subject: 'الكيمياء',
    room: 'معمل 2',
    fee: '500.00',
    paymentType: PaymentType.TERMLY,
    maxStudents: 12,
  },
  {
    name: 'محادثة إنجليزية',
    subject: 'اللغة الإنجليزية',
    room: 'قاعة 203',
    fee: '80.00',
    paymentType: PaymentType.PER_SESSION,
    maxStudents: 20,
  },
  {
    name: 'رياضيات ثانوية',
    subject: 'الرياضيات',
    room: 'قاعة 102',
    fee: '6000.00',
    paymentType: PaymentType.YEARLY,
    maxStudents: 10,
  },
];

const SLOTS: Array<{ day: DayOfWeek; start: string; end: string }> = [
  { day: DayOfWeek.SATURDAY, start: '15:00', end: '17:00' },
  { day: DayOfWeek.MONDAY, start: '16:30', end: '18:30' },
  { day: DayOfWeek.SUNDAY, start: '10:00', end: '12:00' },
  { day: DayOfWeek.TUESDAY, start: '14:00', end: '16:00' },
  { day: DayOfWeek.WEDNESDAY, start: '17:00', end: '19:00' },
  { day: DayOfWeek.THURSDAY, start: '11:00', end: '13:00' },
];

const WEEKDAY_TO_JS: Record<DayOfWeek, number> = {
  [DayOfWeek.SUNDAY]: 0,
  [DayOfWeek.MONDAY]: 1,
  [DayOfWeek.TUESDAY]: 2,
  [DayOfWeek.WEDNESDAY]: 3,
  [DayOfWeek.THURSDAY]: 4,
  [DayOfWeek.FRIDAY]: 5,
  [DayOfWeek.SATURDAY]: 6,
};

const PAST_OCCURRENCES = 3;

let rngSeed = 42;
function random(): number {
  rngSeed = (rngSeed * 1103515245 + 12345) % 2147483648;
  return rngSeed / 2147483648;
}

function timeToDate(time: string): Date {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

function occurrenceDates(day: DayOfWeek, weeksAhead: number): string[] {
  const today = new Date();
  const target = WEEKDAY_TO_JS[day];
  const cursor = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  let offset = 0;
  while (new Date(cursor - offset * 86_400_000).getUTCDay() !== target) offset += 1;
  const dates: string[] = [];
  for (let index = 0; index < PAST_OCCURRENCES; index += 1) {
    dates.push(new Date(cursor - (offset + index * 7) * 86_400_000).toISOString().slice(0, 10));
  }
  if (weeksAhead > 0) {
    dates.push(
      new Date(cursor - offset * 86_400_000 + weeksAhead * 7 * 86_400_000)
        .toISOString()
        .slice(0, 10),
    );
  }
  return dates;
}

async function main(): Promise<void> {
  const center = await prisma.center.findFirst({
    where: { active: true },
    orderBy: { id: 'asc' },
    select: { id: true, name: true },
  });
  if (!center)
    throw new Error('No active center exists. Create or activate a center before seeding.');

  console.log(`Seeding demo data into "${center.name}" (id=${center.id})…`);

  await prisma.$transaction([
    prisma.attendance.deleteMany({ where: { session: { group: { centerId: center.id } } } }),
    prisma.session.deleteMany({ where: { group: { centerId: center.id } } }),
    prisma.groupSchedule.deleteMany({ where: { group: { centerId: center.id } } }),
    prisma.payment.deleteMany({ where: { enrollment: { group: { centerId: center.id } } } }),
    prisma.enrollment.deleteMany({ where: { group: { centerId: center.id } } }),
    prisma.group.deleteMany({ where: { centerId: center.id } }),
    prisma.student.deleteMany({ where: { centerId: center.id } }),
    prisma.teacher.deleteMany({ where: { centerId: center.id } }),
  ]);

  const teachers = await Promise.all(
    TEACHERS.map((teacher) =>
      prisma.teacher.create({
        data: {
          ...teacher,
          phone: `+20100000000${TEACHERS.indexOf(teacher)}`,
          centerId: center.id,
        },
      }),
    ),
  );

  const students = await Promise.all(
    Array.from({ length: 40 }, (_, index) =>
      prisma.student.create({
        data: {
          fullName:
            `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(index / 2) % LAST_NAMES.length]} ${index > 19 ? 'الأصغر' : ''}`.trim(),
          phone: `+201${String(100000000 + index).slice(1)}`,
          parentPhone: `+201${String(200000000 + index).slice(1)}`,
          grade: GRADES[index % GRADES.length],
          school: SCHOOLS[index % SCHOOLS.length],
          joinDate: new Date(Date.UTC(2026, index % 8, (index % 27) + 1)),
          status: index === 39 ? StudentStatus.INACTIVE : StudentStatus.ACTIVE,
          centerId: center.id,
        },
      }),
    ),
  );

  const activeStudents = students.filter((student) => student.status === StudentStatus.ACTIVE);

  const createdGroups = await Promise.all(
    GROUPS.map((group, index) =>
      prisma.group.create({
        data: {
          ...group,
          teacherId: teachers[index % teachers.length].id,
          centerId: center.id,
          schedules: {
            create: [
              {
                dayOfWeek: SLOTS[index].day,
                startTime: timeToDate(SLOTS[index].start),
                endTime: timeToDate(SLOTS[index].end),
              },
              {
                dayOfWeek: SLOTS[(index + 3) % SLOTS.length].day,
                startTime: timeToDate(SLOTS[(index + 2) % SLOTS.length].start),
                endTime: timeToDate(SLOTS[(index + 2) % SLOTS.length].end),
              },
            ],
          },
        },
        include: { schedules: true },
      }),
    ),
  );

  const enrollments = [];
  for (const [groupIndex, group] of createdGroups.entries()) {
    for (let seat = 0; seat < 10; seat += 1) {
      const student = activeStudents[(groupIndex * 7 + seat) % activeStudents.length];
      const existing = enrollments.some(
        (enrollment) => enrollment.studentId === student.id && enrollment.groupId === group.id,
      );
      if (existing) continue;
      enrollments.push(
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            groupId: group.id,
            active: !(groupIndex === 0 && seat > 7),
          },
        }),
      );
    }
  }

  const enrollmentsByGroup = new Map<number, typeof enrollments>();
  for (const enrollment of enrollments) {
    if (!enrollment.active) continue;
    const list = enrollmentsByGroup.get(enrollment.groupId) ?? [];
    list.push(enrollment);
    enrollmentsByGroup.set(enrollment.groupId, list);
  }

  const groupsById = new Map(createdGroups.map((group) => [group.id, group]));
  const now = new Date();
  let paymentCount = 0;
  for (const [index, enrollment] of enrollments.entries()) {
    if (!enrollment.active) continue;
    const group = groupsById.get(enrollment.groupId);
    if (!group) continue;
    const monthsAgo =
      group.paymentType === PaymentType.MONTHLY
        ? 1
        : group.paymentType === PaymentType.TERMLY
          ? 2
          : group.paymentType === PaymentType.YEARLY
            ? 4
            : null;
    const dates: Date[] = [];
    if (monthsAgo !== null) {
      dates.push(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 5)));
    } else if (random() > 0.4) {
      dates.push(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 3)));
    }
    for (const paymentDate of dates) {
      await prisma.payment.create({
        data: {
          enrollmentId: enrollment.id,
          amount: group.fee,
          paymentDate,
          paymentMethod: index % 3 === 0 ? PaymentMethod.CARD : PaymentMethod.CASH,
        },
      });
      paymentCount += 1;
    }
  }

  let sessionCount = 0;
  let recordCount = 0;
  for (const group of createdGroups) {
    for (const schedule of group.schedules) {
      for (const [index, date] of occurrenceDates(schedule.dayOfWeek, 1).entries()) {
        const upcoming = index === PAST_OCCURRENCES;
        const session = await prisma.session.create({
          data: {
            groupId: group.id,
            scheduleId: schedule.id,
            sessionDate: new Date(`${date}T00:00:00.000Z`),
            completed: !upcoming,
          },
        });
        sessionCount += 1;
        if (upcoming) continue;
        for (const enrollment of enrollmentsByGroup.get(group.id) ?? []) {
          const present = random() > 0.15;
          await prisma.attendance.create({
            data: {
              sessionId: session.id,
              enrollmentId: enrollment.id,
              status: present ? 'PRESENT' : 'ABSENT',
            },
          });
          recordCount += 1;
        }
      }
    }
  }

  console.log(
    [
      `Teachers: ${teachers.length}`,
      `Students: ${students.length} (${activeStudents.length} active)`,
      `Groups: ${createdGroups.length}`,
      `Enrollments: ${enrollments.length}`,
      `Payments: ${paymentCount}`,
      `Sessions: ${sessionCount}`,
      `Attendance records: ${recordCount}`,
    ].join('\n'),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
