import { Role } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/modules/auth/services/password.service.js';
import { prisma } from '../src/shared/prisma/prisma-client.js';

const PASSWORD = 'Testpass123';

const DEMO_USERS: Array<{ username: string; role: Role }> = [
  { username: 'test_admin', role: Role.ADMIN },
  { username: 'test_manager', role: Role.MANAGER },
  { username: 'test_accountant', role: Role.ACCOUNTANT },
  { username: 'test_receptionist', role: Role.RECEPTIONIST },
];

async function main(): Promise<void> {
  const existingCenter = await prisma.center.findFirst({ where: { active: true } });
  const center =
    existingCenter ??
    (await prisma.center.create({
      data: {
        name: 'Demo Center',
        address: '123 Demo Street',
        phone: '+201000000000',
      },
    }));
  console.log(`Center: ${center.name} (id=${center.id})`);

  for (const demo of DEMO_USERS) {
    const existing = await prisma.user.findFirst({
      where: { username: demo.username, centerId: center.id },
    });
    if (existing) {
      console.log(`Exists: ${demo.username} (${demo.role})`);
      continue;
    }
    await prisma.user.create({
      data: {
        username: demo.username,
        passwordHash: await hashPassword(PASSWORD),
        role: demo.role,
        centerId: center.id,
      },
    });
    console.log(`Created: ${demo.username} (${demo.role})`);
  }

  console.log(`\nPassword for all test users: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
