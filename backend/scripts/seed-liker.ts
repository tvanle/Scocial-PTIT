import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const LIKER_EMAIL = 'liker@ptit.edu.vn';
const LIKER_PASSWORD = 'Liker@123';
const LIKER_NAME = 'Nguyễn Siêu Like';
const LIKER_STUDENT_ID = 'B99DC999';

async function main() {
  const passwordHash = await bcrypt.hash(LIKER_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: LIKER_EMAIL },
    update: {},
    create: {
      email: LIKER_EMAIL,
      password: passwordHash,
      fullName: LIKER_NAME,
      studentId: LIKER_STUDENT_ID,
      isVerified: true,
      isEmailVerified: true,
      dateOfBirth: new Date('2002-05-15'),
      gender: 'MALE',
    },
  });

  console.log(`User: ${user.id} (${LIKER_EMAIL})`);

  const profile = await prisma.datingProfile.upsert({
    where: { userId: user.id },
    update: { isActive: true },
    create: {
      userId: user.id,
      bio: 'Tôi thích tất cả mọi người!',
      isActive: true,
    },
  });

  console.log(`Dating profile: ${profile.id}`);

  const allProfiles = await prisma.datingProfile.findMany({
    where: {
      userId: { not: user.id },
      isActive: true,
    },
    select: { userId: true },
  });

  console.log(`Found ${allProfiles.length} active dating profiles to like`);

  let created = 0;
  let skipped = 0;

  for (const target of allProfiles) {
    try {
      await prisma.datingSwipe.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: user.id,
            toUserId: target.userId,
          },
        },
        update: { action: 'LIKE' },
        create: {
          fromUserId: user.id,
          toUserId: target.userId,
          action: 'LIKE',
        },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  console.log(`\nDone! Liked ${created} profiles, skipped ${skipped}`);
  console.log(`\n--- Account ---`);
  console.log(`Email:    ${LIKER_EMAIL}`);
  console.log(`Password: ${LIKER_PASSWORD}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
