import { StudentStatus } from '../src/generated/prisma/client.js';
import { prisma } from '../src/shared/prisma/prisma-client.js';

const FIRST_NAMES = [
  'Ahmed',
  'Mariam',
  'Omar',
  'Nour',
  'Youssef',
  'Salma',
  'Karim',
  'Laila',
  'Hassan',
  'Farah',
  'Adam',
  'Jana',
  'Mostafa',
  'Hana',
  'Ziad',
  'Malak',
  'Tarek',
  'Reem',
  'Khaled',
  'Aya',
];

const LAST_NAMES = [
  'Mohamed',
  'Ali',
  'Hassan',
  'Ibrahim',
  'Mahmoud',
  'Sayed',
  'Fathy',
  'Yassin',
  'Adel',
  'Nabil',
];

async function main(): Promise<void> {
  const center = await prisma.center.findFirst({
    where: { active: true },
    orderBy: { id: 'asc' },
    select: { id: true, name: true },
  });
  if (!center)
    throw new Error('No active center exists. Create or activate a center before seeding.');

  const students = Array.from({ length: 40 }, (_, index) => ({
    fullName: `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(index / 2) % LAST_NAMES.length]}`,
    phone: `+201${String(100000000 + index).slice(1)}`,
    parentPhone: `+201${String(200000000 + index).slice(1)}`,
    grade: `Grade ${(index % 6) + 4}`,
    school: ['Al Noor School', 'Future Language School', 'Modern Academy'][index % 3],
    joinDate: new Date(Date.UTC(2026, index % 8, (index % 27) + 1)),
    status: index % 12 === 0 ? StudentStatus.INACTIVE : StudentStatus.ACTIVE,
    notes: index % 5 === 0 ? 'Seeded demo record' : null,
    centerId: center.id,
  }));

  const result = await prisma.student.createMany({ data: students, skipDuplicates: true });
  console.log(`Seeded ${result.count} students for ${center.name} (id=${center.id}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
