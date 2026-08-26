import { prisma } from '../src/shared/prisma/prisma-client.js';

async function main(): Promise<void> {
  const center = await prisma.center.findFirst({
    where: { active: true },
    select: { id: true },
  });
  if (!center) {
    console.log('No center found');
    return;
  }

  await prisma.expense.deleteMany({ where: { category: 'SALARIES', centerId: center.id } });
  await prisma.teacherSalary.deleteMany({ where: {} });

  const teachers = await prisma.teacher.findMany({
    where: { centerId: center.id },
    select: { id: true, fullName: true },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { group: { centerId: center.id }, active: true },
    select: { id: true, groupId: true },
  });

  const payments = await prisma.payment.findMany({
    where: { enrollmentId: { in: enrollments.map((e) => e.id) } },
    select: { amount: true, enrollmentId: true },
  });

  const groups = await prisma.group.findMany({
    where: { centerId: center.id },
    select: { id: true, teacherId: true },
  });
  const groupTeacher = new Map(groups.map((g) => [g.id, g.teacherId]));
  const enrollGroup = new Map(enrollments.map((e) => [e.id, e.groupId]));

  const teacherSums = new Map<number, number>();
  for (const pay of payments) {
    const groupId = enrollGroup.get(pay.enrollmentId);
    const teacherId = groupId ? groupTeacher.get(groupId) : undefined;
    if (!teacherId) continue;
    teacherSums.set(teacherId, (teacherSums.get(teacherId) ?? 0) + Number(pay.amount));
  }

  for (const teacher of teachers) {
    const total = teacherSums.get(teacher.id) ?? 0;
    if (total === 0) continue;

    const amount = (total * 70) / 100;
    const record = await prisma.teacherSalary.create({
      data: {
        teacherId: teacher.id,
        salaryMonth: 8,
        salaryYear: 2026,
        amount,
        paymentSum: total,
        percentage: 70,
        paymentDate: new Date('2026-08-25'),
        isPaid: true,
      },
    });

    await prisma.expense.create({
      data: {
        category: 'SALARIES',
        amount,
        expenseDate: new Date('2026-08-25'),
        description: teacher.fullName,
        salaryId: record.id,
        centerId: center.id,
      },
    });

    console.log(`${teacher.fullName}: ${total} * 70% = ${amount}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
