import { Role } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/modules/auth/services/password.service.js';
import { prisma } from '../src/shared/prisma/prisma-client.js';

async function main(): Promise<void> {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Usage: npm run create:superadmin -- <username> <password>');
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findFirst({
    where: { username, centerId: null },
  });
  if (existing) {
    console.error(`SUPERADMIN user "${username}" already exists`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, passwordHash, role: Role.SUPERADMIN, centerId: null },
  });

  console.log(`Created SUPERADMIN: ${user.username} (id=${user.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
