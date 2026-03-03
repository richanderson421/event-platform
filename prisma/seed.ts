import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@platform.test' },
    update: {},
    create: { email: 'admin@platform.test', displayName: 'PlatformAdmin', globalRole: 'PLATFORM_ADMIN' }
  });

  const to = await prisma.user.upsert({
    where: { email: 'to@store.test' },
    update: {},
    create: { email: 'to@store.test', displayName: 'StoreTO' }
  });

  const player = await prisma.user.upsert({
    where: { email: 'player@store.test' },
    update: {},
    create: { email: 'player@store.test', displayName: 'PlayerOne' }
  });

  const org = await prisma.organization.upsert({
    where: { name: 'Downtown LGS' },
    update: {},
    create: { name: 'Downtown LGS', createdById: to.id, description: 'Seed organization' }
  });

  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: to.id } },
    update: {},
    create: { organizationId: org.id, userId: to.id, role: 'ORG_ADMIN', userType: 'TO' }
  });

  const event = await prisma.event.create({
    data: {
      organizationId: org.id,
      createdById: to.id,
      type: 'LEAGUE',
      name: 'Friday Night League',
      visibility: 'PUBLIC',
      registrationMode: 'APPROVAL_REQUIRED',
      pairingsRequireApproval: true,
      leagueConfig: {
        create: {
          matchesPerPeriod: 1,
          periodLengthDays: 7,
          numberOfPeriods: 8,
          scoringWin: 3,
          scoringTie: 1,
          scoringLoss: 0
        }
      }
    }
  });

  await prisma.registration.create({
    data: { eventId: event.id, playerId: player.id, status: 'PENDING' }
  });

  console.log({ admin: admin.email, org: org.name, event: event.name });
}

main().finally(() => prisma.$disconnect());
