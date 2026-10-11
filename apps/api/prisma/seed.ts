import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.ts';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://vmuser:vmpass@localhost:5433/vmdb';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const users = [
  { email: 'admin@ifx.test', name: 'Admin', role: 'ADMIN' as const, password: 'Admin123!' },
  { email: 'client@ifx.test', name: 'Client', role: 'CLIENT' as const, password: 'Client123!' },
];

for (const user of users) {
  const passwordHash = await hash(user.password, 10);
  await prisma.user.upsert({
    where: { email: user.email },
    update: { name: user.name, role: user.role, passwordHash },
    create: { email: user.email, name: user.name, role: user.role, passwordHash },
  });
  console.log(`[seed] usuario ${user.email} (${user.role}) listo`);
}

await prisma.$disconnect();
