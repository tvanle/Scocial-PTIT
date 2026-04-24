/**
 * Auto Liker Bot
 *
 * Script tao user tu dong like tat ca moi nguoi
 * Va polling lien tuc de like user moi
 *
 * Usage: npx tsx scripts/auto-liker-bot.ts
 * Stop: Ctrl+C
 */

import { PrismaClient, SwipeAction, FrequencyLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Bot config
const BOT_EMAIL = 'auto-liker@ptit.edu.vn';
const BOT_PASSWORD = 'AutoLiker@123';
const BOT_NAME = 'Nguyen Minh Tu';
const BOT_STUDENT_ID = 'B21DCCN001';
const BOT_BIO = 'Sinh vien CNTT nam 3, thich doc sach va kham pha nhung dieu moi. Dang tim kiem mot nguoi ban dong hanh tren hanh trinh cuoc song.';

// Bot full profile data
const BOT_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';
const BOT_PHOTOS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=1000&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&h=1000&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&h=1000&fit=crop&crop=face',
];

const BOT_PROMPTS = [
  {
    question: 'Dieu gi khien ban hanh phuc nhat?',
    answer: 'Duoc ngoi cafe va doc sach vao buoi sang som, hoac di dao cung ban be vao cuoi tuan. Nhung khoanh khac binh yen nhu vay khien minh cam thay song that y nghia.',
  },
  {
    question: 'Buoi hen ho ly tuong cua ban?',
    answer: 'Di an toi o quan nho am cung, roi di dao bo Ho Tay ngam hoang hon. Khong can gi qua cau ky, chi can co nguoi de tro chuyen va chia se.',
  },
  {
    question: 'Dieu ban dang tim kiem?',
    answer: 'Mot nguoi ban chan thanh, co the cung nhau truong thanh. Khong can hoan hao, chi can la chinh minh va ton trong nhau.',
  },
];

const BOT_LIFESTYLE = {
  education: 'Dai hoc - PTIT',
  job: 'Sinh vien nam 3',
  height: 175,
  smoking: FrequencyLevel.NEVER,
  drinking: FrequencyLevel.SOMETIMES,
  exercise: FrequencyLevel.REGULARLY,
  religion: 'Khong',
};

// Polling interval (ms)
const POLL_INTERVAL = 10000; // 10 seconds

// Track liked users to avoid re-processing
const likedUserIds = new Set<string>();

async function createOrGetBotUser() {
  const passwordHash = await bcrypt.hash(BOT_PASSWORD, 10);

  // Create/update user with full info
  const user = await prisma.user.upsert({
    where: { email: BOT_EMAIL },
    update: {
      isActive: true,
      lastActiveAt: new Date(),
      fullName: BOT_NAME,
      avatar: BOT_AVATAR,
      bio: BOT_BIO,
    },
    create: {
      email: BOT_EMAIL,
      password: passwordHash,
      fullName: BOT_NAME,
      studentId: BOT_STUDENT_ID,
      avatar: BOT_AVATAR,
      bio: BOT_BIO,
      isVerified: true,
      isEmailVerified: true,
      dateOfBirth: new Date('2003-05-15'),
      gender: 'MALE',
      faculty: 'Cong nghe thong tin',
      className: 'D21CQCN01-B',
    },
  });

  console.log(`Bot User: ${BOT_NAME}`);
  console.log(`User ID: ${user.id}`);
  console.log(`Email: ${BOT_EMAIL}`);
  console.log(`Password: ${BOT_PASSWORD}`);
  console.log('');

  // Create dating profile
  const profile = await prisma.datingProfile.upsert({
    where: { userId: user.id },
    update: {
      isActive: true,
      bio: BOT_BIO,
      latitude: 21.0285,
      longitude: 105.8542,
      locationUpdatedAt: new Date(),
    },
    create: {
      userId: user.id,
      bio: BOT_BIO,
      isActive: true,
      latitude: 21.0285, // Ha Noi - PTIT
      longitude: 105.8542,
      locationUpdatedAt: new Date(),
    },
  });

  // Delete old photos and add new ones
  await prisma.datingProfilePhoto.deleteMany({
    where: { profileId: profile.id },
  });

  for (let i = 0; i < BOT_PHOTOS.length; i++) {
    await prisma.datingProfilePhoto.create({
      data: {
        profileId: profile.id,
        url: BOT_PHOTOS[i],
        order: i,
      },
    });
  }
  console.log(`Added ${BOT_PHOTOS.length} photos`);

  // Delete old prompts and add new ones
  await prisma.datingProfilePrompt.deleteMany({
    where: { profileId: profile.id },
  });

  for (let i = 0; i < BOT_PROMPTS.length; i++) {
    await prisma.datingProfilePrompt.create({
      data: {
        profileId: profile.id,
        question: BOT_PROMPTS[i].question,
        answer: BOT_PROMPTS[i].answer,
        order: i,
      },
    });
  }
  console.log(`Added ${BOT_PROMPTS.length} prompts`);

  // Create/update lifestyle
  await prisma.datingProfileLifestyle.upsert({
    where: { profileId: profile.id },
    update: {
      education: BOT_LIFESTYLE.education,
      job: BOT_LIFESTYLE.job,
      height: BOT_LIFESTYLE.height,
      smoking: BOT_LIFESTYLE.smoking,
      drinking: BOT_LIFESTYLE.drinking,
      exercise: BOT_LIFESTYLE.exercise,
      religion: BOT_LIFESTYLE.religion,
    },
    create: {
      profileId: profile.id,
      education: BOT_LIFESTYLE.education,
      job: BOT_LIFESTYLE.job,
      height: BOT_LIFESTYLE.height,
      smoking: BOT_LIFESTYLE.smoking,
      drinking: BOT_LIFESTYLE.drinking,
      exercise: BOT_LIFESTYLE.exercise,
      religion: BOT_LIFESTYLE.religion,
    },
  });
  console.log(`Added lifestyle info`);

  // Create preferences (gender: null = all genders)
  await prisma.datingPreferences.upsert({
    where: { profileId: profile.id },
    update: {},
    create: {
      profileId: profile.id,
      gender: null, // null = show all genders
      ageMin: 18,
      ageMax: 30,
      maxDistance: 100,
    },
  });
  console.log(`Added preferences`);

  // Create subscription (unlimited)
  await prisma.datingSubscription.upsert({
    where: { userId: user.id },
    update: {
      tier: 'PREMIUM',
      status: 'ACTIVE',
      endDate: new Date('2099-12-31'),
    },
    create: {
      userId: user.id,
      tier: 'PREMIUM',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date('2099-12-31'),
    },
  });

  console.log(`\nDating Profile ID: ${profile.id}`);
  console.log(`Subscription: PREMIUM (unlimited)`);
  console.log('');

  return user;
}

async function loadExistingLikes(botUserId: string) {
  const existingSwipes = await prisma.datingSwipe.findMany({
    where: { fromUserId: botUserId },
    select: { toUserId: true },
  });

  for (const swipe of existingSwipes) {
    likedUserIds.add(swipe.toUserId);
  }

  console.log(`Loaded ${likedUserIds.size} existing likes into memory`);
}

async function likeUser(botUserId: string, targetUserId: string): Promise<boolean> {
  try {
    await prisma.datingSwipe.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: botUserId,
          toUserId: targetUserId,
        },
      },
      update: { action: SwipeAction.LIKE },
      create: {
        fromUserId: botUserId,
        toUserId: targetUserId,
        action: SwipeAction.LIKE,
      },
    });

    // Check for mutual like -> create match
    const mutualLike = await prisma.datingSwipe.findFirst({
      where: {
        fromUserId: targetUserId,
        toUserId: botUserId,
        action: { in: [SwipeAction.LIKE, SwipeAction.SUPER_LIKE] },
      },
    });

    if (mutualLike) {
      // Create match
      const [userAId, userBId] = botUserId < targetUserId
        ? [botUserId, targetUserId]
        : [targetUserId, botUserId];

      await prisma.datingMatch.upsert({
        where: {
          userAId_userBId: { userAId, userBId },
        },
        update: {},
        create: { userAId, userBId },
      });

      return true; // Matched!
    }

    return false;
  } catch (error) {
    console.error(`Error liking user ${targetUserId}:`, error);
    return false;
  }
}

async function likeAllProfiles(botUserId: string) {
  const profiles = await prisma.datingProfile.findMany({
    where: {
      userId: {
        not: botUserId,
        notIn: Array.from(likedUserIds),
      },
      isActive: true,
    },
    select: {
      userId: true,
      user: {
        select: { fullName: true },
      },
    },
  });

  if (profiles.length === 0) {
    return { liked: 0, matched: 0 };
  }

  let liked = 0;
  let matched = 0;

  for (const profile of profiles) {
    const isMatch = await likeUser(botUserId, profile.userId);
    likedUserIds.add(profile.userId);
    liked++;

    if (isMatch) {
      matched++;
      console.log(`  MATCH! with ${profile.user.fullName}`);
    } else {
      console.log(`  Liked: ${profile.user.fullName}`);
    }
  }

  return { liked, matched };
}

async function pollForNewUsers(botUserId: string) {
  console.log('\n========================================');
  console.log('AUTO LIKER BOT - Polling for new users...');
  console.log('Press Ctrl+C to stop');
  console.log('========================================\n');

  let totalLiked = 0;
  let totalMatched = 0;

  // Initial like all
  console.log('Initial scan...');
  const initial = await likeAllProfiles(botUserId);
  totalLiked += initial.liked;
  totalMatched += initial.matched;
  console.log(`\nInitial: Liked ${initial.liked}, Matched ${initial.matched}`);

  // Polling loop
  const poll = async () => {
    const result = await likeAllProfiles(botUserId);

    if (result.liked > 0) {
      totalLiked += result.liked;
      totalMatched += result.matched;
      console.log(`\n[${new Date().toLocaleTimeString()}] New users: Liked ${result.liked}, Matched ${result.matched}`);
      console.log(`Total: Liked ${totalLiked}, Matched ${totalMatched}`);
    }
  };

  // Set interval
  const intervalId = setInterval(poll, POLL_INTERVAL);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n========================================');
    console.log('Shutting down Auto Liker Bot...');
    console.log(`Final stats: Liked ${totalLiked}, Matched ${totalMatched}`);
    console.log('========================================\n');
    clearInterval(intervalId);
    await prisma.$disconnect();
    process.exit(0);
  });

  // Keep process alive
  console.log(`\nPolling every ${POLL_INTERVAL / 1000} seconds...`);
}

async function main() {
  console.log('\n========================================');
  console.log('       AUTO LIKER BOT - STARTUP');
  console.log('========================================\n');

  // Create or get bot user
  const botUser = await createOrGetBotUser();

  // Load existing likes
  await loadExistingLikes(botUser.id);

  // Start polling
  await pollForNewUsers(botUser.id);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
