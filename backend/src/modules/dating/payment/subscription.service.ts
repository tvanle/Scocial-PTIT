/**
 * Dating Subscription Service
 * Manages subscription tiers, limits, and daily usage
 */

import { PrismaClient, SubscriptionTier, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Subscription limits by tier
export const SUBSCRIPTION_LIMITS: Record<
  'FREE' | 'PREMIUM',
  {
    dailySwipes: number;
    dailySuperLikes: number;
    dailyRewinds: number;
    canSeeLikes: boolean;
    canSeeWhoLikedYou: boolean;
    canRewind: boolean;
  }
> = {
  FREE: {
    dailySwipes: 50,
    dailySuperLikes: 1,
    dailyRewinds: 0,
    canSeeLikes: false,
    canSeeWhoLikedYou: false,
    canRewind: false,
  },
  PREMIUM: {
    dailySwipes: -1, // Unlimited
    dailySuperLikes: 5,
    dailyRewinds: -1, // Unlimited
    canSeeLikes: true,
    canSeeWhoLikedYou: true,
    canRewind: true,
  },
};

// Pricing plans (VND) - Test prices, change to real prices in production
export const PRICING_PLANS = {
  MONTHLY: {
    price: 2000, // Test: 2,000đ (Production: 99,000đ)
    durationDays: 30,
    label: '1 Tháng',
    description: 'Thanh toán hàng tháng',
  },
  QUARTERLY: {
    price: 5000, // Test: 5,000đ (Production: 249,000đ)
    durationDays: 90,
    label: '3 Tháng',
    description: 'Tiết kiệm 16%',
    savings: '16%',
  },
  YEARLY: {
    price: 10000, // Test: 10,000đ (Production: 799,000đ)
    durationDays: 365,
    label: '1 Năm',
    description: 'Tiết kiệm 33%',
    savings: '33%',
  },
} as const;

export type PlanType = keyof typeof PRICING_PLANS;

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: Date | null;
  endDate: Date | null;
  daysRemaining: number | null;
  limits: typeof SUBSCRIPTION_LIMITS.FREE | typeof SUBSCRIPTION_LIMITS.PREMIUM;
}

export interface UsageInfo {
  swipeCount: number;
  superLikeCount: number;
  rewindCount: number;
  swipesRemaining: number;
  superLikesRemaining: number;
  rewindsRemaining: number;
  canSwipe: boolean;
  canSuperLike: boolean;
  canRewind: boolean;
}

/**
 * Get or create subscription for user
 */
export async function getOrCreateSubscription(userId: string) {
  let subscription = await prisma.datingSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    subscription = await prisma.datingSubscription.create({
      data: {
        userId,
        tier: 'FREE',
        status: 'ACTIVE',
      },
    });
  }

  // Check if premium has expired
  if (
    subscription.tier === 'PREMIUM' &&
    subscription.endDate &&
    subscription.endDate < new Date()
  ) {
    subscription = await prisma.datingSubscription.update({
      where: { id: subscription.id },
      data: {
        tier: 'FREE',
        status: 'EXPIRED',
      },
    });
  }

  return subscription;
}

/**
 * Get subscription info with limits
 */
export async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
  const subscription = await getOrCreateSubscription(userId);

  let daysRemaining: number | null = null;
  if (subscription.tier === 'PREMIUM' && subscription.endDate) {
    const now = new Date();
    const diff = subscription.endDate.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return {
    tier: subscription.tier,
    status: subscription.status,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    daysRemaining,
    limits: SUBSCRIPTION_LIMITS[subscription.tier],
  };
}

/**
 * Upgrade subscription to premium
 */
export async function upgradeToPremium(
  userId: string,
  planType: PlanType,
): Promise<void> {
  const plan = PRICING_PLANS[planType];
  const now = new Date();

  // Get current subscription
  const currentSub = await getOrCreateSubscription(userId);

  // Calculate new end date
  let newEndDate: Date;
  if (
    currentSub.tier === 'PREMIUM' &&
    currentSub.endDate &&
    currentSub.endDate > now
  ) {
    // Extend from current end date
    newEndDate = new Date(currentSub.endDate);
    newEndDate.setDate(newEndDate.getDate() + plan.durationDays);
  } else {
    // Start fresh
    newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + plan.durationDays);
  }

  await prisma.datingSubscription.update({
    where: { id: currentSub.id },
    data: {
      tier: 'PREMIUM',
      status: 'ACTIVE',
      startDate: currentSub.tier === 'PREMIUM' ? currentSub.startDate : now,
      endDate: newEndDate,
    },
  });
}

/**
 * Get today's usage for user
 */
export async function getDailyUsage(userId: string): Promise<UsageInfo> {
  const subscription = await getOrCreateSubscription(userId);
  const limits = SUBSCRIPTION_LIMITS[subscription.tier];

  // Get today's date (start of day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get or create daily usage
  let usage = await prisma.datingUsageDaily.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (!usage) {
    usage = await prisma.datingUsageDaily.create({
      data: {
        userId,
        date: today,
        swipeCount: 0,
        superLikeCount: 0,
        rewindCount: 0,
      },
    });
  }

  const swipesRemaining =
    limits.dailySwipes === -1 ? -1 : Math.max(0, limits.dailySwipes - usage.swipeCount);
  const superLikesRemaining =
    limits.dailySuperLikes === -1
      ? -1
      : Math.max(0, limits.dailySuperLikes - usage.superLikeCount);
  const rewindsRemaining =
    limits.dailyRewinds === -1
      ? -1
      : Math.max(0, limits.dailyRewinds - usage.rewindCount);

  return {
    swipeCount: usage.swipeCount,
    superLikeCount: usage.superLikeCount,
    rewindCount: usage.rewindCount,
    swipesRemaining,
    superLikesRemaining,
    rewindsRemaining,
    canSwipe: limits.dailySwipes === -1 || usage.swipeCount < limits.dailySwipes,
    canSuperLike:
      limits.dailySuperLikes === -1 || usage.superLikeCount < limits.dailySuperLikes,
    canRewind: limits.canRewind && (limits.dailyRewinds === -1 || usage.rewindCount < limits.dailyRewinds),
  };
}

/**
 * Increment swipe count
 */
export async function incrementSwipeCount(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.datingUsageDaily.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    create: {
      userId,
      date: today,
      swipeCount: 1,
      superLikeCount: 0,
    },
    update: {
      swipeCount: { increment: 1 },
    },
  });
}

/**
 * Increment super like count
 */
export async function incrementSuperLikeCount(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.datingUsageDaily.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    create: {
      userId,
      date: today,
      swipeCount: 0,
      superLikeCount: 1,
    },
    update: {
      superLikeCount: { increment: 1 },
    },
  });
}

/**
 * Increment rewind count
 */
export async function incrementRewindCount(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.datingUsageDaily.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    create: {
      userId,
      date: today,
      swipeCount: 0,
      superLikeCount: 0,
      rewindCount: 1,
    },
    update: {
      rewindCount: { increment: 1 },
    },
  });
}

/**
 * Check if user can see who liked them
 */
export async function canSeeLikes(userId: string): Promise<boolean> {
  const subscription = await getOrCreateSubscription(userId);
  return SUBSCRIPTION_LIMITS[subscription.tier].canSeeLikes;
}

/**
 * Check if user can rewind
 */
export async function canRewind(userId: string): Promise<boolean> {
  const subscription = await getOrCreateSubscription(userId);
  return SUBSCRIPTION_LIMITS[subscription.tier].canRewind;
}

/**
 * Get pricing plans for display
 */
export function getPricingPlans() {
  return Object.entries(PRICING_PLANS).map(([key, plan]) => ({
    type: key as PlanType,
    ...plan,
    formattedPrice: formatVND(plan.price),
    monthlyPrice: formatVND(Math.round(plan.price / (plan.durationDays / 30))),
  }));
}

/**
 * Format VND currency
 */
function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export default {
  getOrCreateSubscription,
  getSubscriptionInfo,
  upgradeToPremium,
  getDailyUsage,
  incrementSwipeCount,
  incrementSuperLikeCount,
  incrementRewindCount,
  canSeeLikes,
  canRewind,
  getPricingPlans,
  SUBSCRIPTION_LIMITS,
  PRICING_PLANS,
};
