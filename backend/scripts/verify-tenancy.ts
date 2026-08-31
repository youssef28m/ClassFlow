import { createApp } from '../src/app.js';
import { hashPassword } from '../src/modules/auth/services/password.service.js';
import { prisma } from '../src/shared/prisma/prisma-client.js';

const PASSWORD = 'password123';

let passed = 0;
let failed = 0;

function ok(condition: boolean, message: string): void {
  if (condition) {
    passed += 1;
    console.log(`  PASS: ${message}`);
  } else {
    failed += 1;
    console.error(`  FAIL: ${message}`);
  }
}

async function request(
  baseUrl: string,
  path: string,
  token: string | null,
  init: RequestInit = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, body };
}

async function login(baseUrl: string, username: string, centerId?: number): Promise<string> {
  const { status, body } = await request(baseUrl, '/api/auth/login', null, {
    method: 'POST',
    body: JSON.stringify({ username, password: PASSWORD, centerId }),
  });
  if (status !== 200) {
    throw new Error(`Login failed for ${username}: ${status} ${JSON.stringify(body)}`);
  }
  return body.accessToken as string;
}

async function cleanup(): Promise<void> {
  const testCenters = await prisma.center.findMany({
    where: { name: { startsWith: 'Test Center ' } },
    select: { id: true },
  });
  const centerIds = testCenters.map((c) => c.id);

  if (centerIds.length > 0) {
    await prisma.student.deleteMany({ where: { centerId: { in: centerIds } } });
    await prisma.teacher.deleteMany({ where: { centerId: { in: centerIds } } });
    await prisma.user.deleteMany({ where: { centerId: { in: centerIds } } });
  }
  await prisma.user.deleteMany({ where: { username: 'root' } });
  if (centerIds.length > 0) {
    await prisma.center.deleteMany({ where: { id: { in: centerIds } } });
  }
}

async function main(): Promise<void> {
  await cleanup();

  const centerA = await prisma.center.create({
    data: { name: 'Test Center A', address: 'A St', phone: '111' },
  });
  const centerB = await prisma.center.create({
    data: { name: 'Test Center B', address: 'B St', phone: '222' },
  });
  const centerC = await prisma.center.create({
    data: { name: 'Test Center C', address: 'C St', phone: '333' },
  });

  const adminHash = await hashPassword(PASSWORD);

  await prisma.user.create({
    data: { username: 'admin', passwordHash: adminHash, role: 'ADMIN', centerId: centerA.id },
  });
  await prisma.user.create({
    data: { username: 'admin', passwordHash: adminHash, role: 'ADMIN', centerId: centerB.id },
  });
  await prisma.user.create({
    data: { username: 'user-c', passwordHash: adminHash, role: 'ADMIN', centerId: centerC.id },
  });
  await prisma.user.create({
    data: { username: 'root', passwordHash: adminHash, role: 'SUPERADMIN', centerId: null },
  });

  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Failed to bind ephemeral server');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const tokenA = await login(baseUrl, 'admin', centerA.id);
    const tokenB = await login(baseUrl, 'admin', centerB.id);
    const tokenC = await login(baseUrl, 'user-c', centerC.id);
    const tokenRoot = await login(baseUrl, 'root');
    console.log('Setup: logged in as center A admin, center B admin, center C user, SUPERADMIN');

    ok(tokenA !== tokenB, 'two centers may each have a user named "admin" (per-center username uniqueness)');

    const duplicate = await request(baseUrl, `/api/centers/${centerA.id}/users`, tokenRoot, {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: PASSWORD }),
    });
    ok(duplicate.status === 409, `registering a duplicate "admin" in center A returns 409 (got ${duplicate.status})`);

    const newUser = await request(baseUrl, `/api/centers/${centerA.id}/users`, tokenRoot, {
      method: 'POST',
      body: JSON.stringify({ username: 'manager-x', password: PASSWORD, role: 'MANAGER' }),
    });
    ok(newUser.status === 201 && newUser.body.role === 'MANAGER', 'SUPERADMIN can create a MANAGER user for a center');

    const createStudentA = await request(baseUrl, '/api/students', tokenA, {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Alice A',
        phone: '100',
        grade: '5',
        address: 'Addr',
        joinDate: '2026-01-01',
        centerId: 9999,
      }),
    });
    const studentAId = createStudentA.body.id as number;
    ok(createStudentA.status === 201, `center A admin can create a student (got ${createStudentA.status})`);

    const storedStudentA = await prisma.student.findUniqueOrThrow({ where: { id: studentAId } });
    ok(storedStudentA.centerId === centerA.id, 'student stored with token center (body centerId=9999 ignored)');

    const createTeacherA = await request(baseUrl, '/api/teachers', tokenA, {
      method: 'POST',
      body: JSON.stringify({ fullName: 'Mr A', phone: '200', specialization: 'Math', salary: 500 }),
    });
    const teacherAId = createTeacherA.body.id as number;
    ok(createTeacherA.status === 201, `center A admin can create a teacher (got ${createTeacherA.status})`);

    const createStudentB = await request(baseUrl, '/api/students', tokenB, {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Bob B',
        phone: '101',
        grade: '6',
        address: 'Addr',
        joinDate: '2026-02-01',
      }),
    });
    const studentBId = createStudentB.body.id as number;
    ok(createStudentB.status === 201, `center B admin can create a student (got ${createStudentB.status})`);

    const crossGet = await request(baseUrl, `/api/students/${studentAId}`, tokenB);
    ok(crossGet.status === 404, `center B cannot fetch center A student by id (got ${crossGet.status})`);

    const crossPatch = await request(baseUrl, `/api/students/${studentAId}`, tokenB, {
      method: 'PATCH',
      body: JSON.stringify({ fullName: 'Hacked' }),
    });
    ok(crossPatch.status === 404, `center B cannot update center A student (got ${crossPatch.status})`);

    const crossDelete = await request(baseUrl, `/api/students/${studentAId}`, tokenB, {
      method: 'DELETE',
    });
    ok(crossDelete.status === 404, `center B cannot delete center A student (got ${crossDelete.status})`);

    const crossTeacherGet = await request(baseUrl, `/api/teachers/${teacherAId}`, tokenB);
    ok(crossTeacherGet.status === 404, `center B cannot fetch center A teacher by id (got ${crossTeacherGet.status})`);

    const afterCross = await prisma.student.findUnique({ where: { id: studentAId } });
    ok(afterCross !== null, 'center A student still exists after center B attempted write');

    const ignoredQuery = await request(baseUrl, `/api/students?centerId=${centerB.id}`, tokenA);
    const ignoredItems = ignoredQuery.body.items as Array<{ id: number }>;
    ok(
      ignoredQuery.status === 200 &&
        ignoredItems.every((s) => s.id === studentAId) &&
        !ignoredItems.some((s) => s.id === studentBId),
      'non-SUPERADMIN centerId query param is ignored (still scoped to own center)',
    );

    const allStudents = await request(baseUrl, '/api/students', tokenRoot);
    const allIds = (allStudents.body.items as Array<{ id: number }>).map((s) => s.id);
    ok(
      allStudents.status === 200 && allIds.includes(studentAId) && allIds.includes(studentBId),
      'SUPERADMIN can list students across all centers',
    );

    const centerAScope = await request(baseUrl, `/api/students?centerId=${centerA.id}`, tokenRoot);
    const centerAIds = (centerAScope.body.items as Array<{ id: number }>).map((s) => s.id);
    ok(
      centerAScope.status === 200 && centerAIds.includes(studentAId) && !centerAIds.includes(studentBId),
      'SUPERADMIN can scope list to a single center via centerId query',
    );

    const superCreate = await request(baseUrl, `/api/students?centerId=${centerB.id}`, tokenRoot, {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Carol Super',
        phone: '102',
        grade: '7',
        address: 'Addr',
        joinDate: '2026-03-01',
      }),
    });
    const superStudentId = superCreate.body.id as number;
    const storedSuperStudent = await prisma.student.findUnique({ where: { id: superStudentId } });
    ok(
      superCreate.status === 201 && storedSuperStudent?.centerId === centerB.id,
      'SUPERADMIN can create a student into an explicit center via centerId query',
    );

    const superNoCenter = await request(baseUrl, '/api/students', tokenRoot, {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'No Center',
        phone: '103',
        grade: '7',
        address: 'Addr',
        joinDate: '2026-03-01',
      }),
    });
    ok(superNoCenter.status === 400, `SUPERADMIN write without centerId returns 400 (got ${superNoCenter.status})`);

    const deactivate = await request(baseUrl, `/api/centers/${centerC.id}/deactivate`, tokenRoot, {
      method: 'PATCH',
    });
    ok(deactivate.status === 200 && deactivate.body.active === false, 'SUPERADMIN can deactivate a center');

    const loginBlocked = await request(baseUrl, '/api/auth/login', null, {
      method: 'POST',
      body: JSON.stringify({ username: 'user-c', password: PASSWORD, centerId: centerC.id }),
    });
    ok(loginBlocked.status === 403, `login for deactivated center is blocked (got ${loginBlocked.status})`);

    const apiBlocked = await request(baseUrl, '/api/students', tokenC);
    ok(apiBlocked.status === 403, `authenticated requests for deactivated center are blocked (got ${apiBlocked.status})`);
  } finally {
    server.close();
    await cleanup();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
