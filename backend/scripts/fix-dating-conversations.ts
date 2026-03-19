import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.datingMatch.findMany({
    select: { id: true, userAId: true, userBId: true },
  });

  console.log(`Found ${matches.length} dating matches`);

  let fixed = 0;
  let alreadyOk = 0;
  let created = 0;

  for (const match of matches) {
    const [participantAId, participantBId] = [match.userAId, match.userBId].sort();

    const datingConv = await prisma.conversation.findFirst({
      where: {
        context: 'DATING',
        participants: {
          every: {
            userId: { in: [match.userAId, match.userBId] },
          },
        },
        AND: [
          { participants: { some: { userId: match.userAId } } },
          { participants: { some: { userId: match.userBId } } },
        ],
      },
      select: { id: true },
    });

    if (datingConv) {
      alreadyOk++;
      continue;
    }

    // Find SOCIAL/default conversation between these 2 users
    const socialConv = await prisma.conversation.findFirst({
      where: {
        context: 'SOCIAL',
        type: 'PRIVATE',
        AND: [
          { participants: { some: { userId: match.userAId } } },
          { participants: { some: { userId: match.userBId } } },
        ],
      },
      select: { id: true },
    });

    if (socialConv) {
      // Update existing social conv to dating
      await prisma.conversation.update({
        where: { id: socialConv.id },
        data: {
          context: 'DATING',
          participantAId,
          participantBId,
        },
      });
      fixed++;
      console.log(`Fixed conversation ${socialConv.id} -> DATING context`);
    } else {
      // No conversation exists at all, create one
      const conv = await prisma.conversation.create({
        data: {
          type: 'PRIVATE',
          context: 'DATING',
          participantAId,
          participantBId,
        },
      });

      await prisma.conversationParticipant.createMany({
        data: [
          { conversationId: conv.id, userId: match.userAId },
          { conversationId: conv.id, userId: match.userBId },
        ],
      });
      created++;
      console.log(`Created DATING conversation ${conv.id} for match ${match.id}`);
    }
  }

  console.log(`\nDone!`);
  console.log(`Already OK: ${alreadyOk}`);
  console.log(`Fixed (SOCIAL -> DATING): ${fixed}`);
  console.log(`Created new: ${created}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
