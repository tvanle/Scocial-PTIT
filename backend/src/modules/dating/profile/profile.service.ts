import { prisma } from '../../../config/database';
import { AppError } from '../../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../shared/constants';
import {
  CreateDatingProfileInput,
  UpdateDatingProfileInput,
  AddPhotoInput,
  UpdatePromptsInput,
  UpdateLifestyleInput,
  UpdatePreferencesInput,
  validateAge,
} from './profile.schema';

// Reusable Prisma select constants
const PROFILE_BASE_SELECT = {
  id: true,
  userId: true,
  bio: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const PHOTO_SELECT = {
  id: true,
  url: true,
  order: true,
  createdAt: true,
} as const;

const PROMPT_SELECT = {
  id: true,
  question: true,
  answer: true,
  order: true,
  createdAt: true,
  updatedAt: true,
} as const;

const LIFESTYLE_SELECT = {
  id: true,
  education: true,
  job: true,
  smoking: true,
  drinking: true,
  exercise: true,
  height: true,
  religion: true,
  updatedAt: true,
} as const;

const PREFERENCES_SELECT = {
  id: true,
  ageMin: true,
  ageMax: true,
  maxDistance: true,
  gender: true,
  updatedAt: true,
} as const;

export class ProfileService {
  // Check if user is 18+
  private async validateUserAge(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dateOfBirth: true },
    });

    if (!user || !user.dateOfBirth) {
      throw new AppError(ERROR_MESSAGES.AGE_TOO_YOUNG, HTTP_STATUS.BAD_REQUEST);
    }

    if (!validateAge(user.dateOfBirth)) {
      throw new AppError(ERROR_MESSAGES.AGE_TOO_YOUNG, HTTP_STATUS.BAD_REQUEST);
    }
  }

  // Ensure profile exists and belongs to user, return profileId
  private async getProfileIdByUserId(userId: string): Promise<string> {
    const profile = await prisma.datingProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new AppError(ERROR_MESSAGES.DATING_PROFILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return profile.id;
  }

  // Create dating profile
  async createProfile(userId: string, data: CreateDatingProfileInput) {
    await this.validateUserAge(userId);

    const existing = await prisma.datingProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existing) {
      throw new AppError(ERROR_MESSAGES.DATING_PROFILE_EXISTS, HTTP_STATUS.CONFLICT);
    }

    const profile = await prisma.datingProfile.create({
      data: {
        userId,
        bio: data.bio,
        preferences: {
          create: {
            ageMin: 18,
            ageMax: 99,
          },
        },
      },
      select: PROFILE_BASE_SELECT,
    });

    return profile;
  }

  // Update profile
  async updateProfile(userId: string, data: UpdateDatingProfileInput) {
    await this.getProfileIdByUserId(userId);

    const updated = await prisma.datingProfile.update({
      where: { userId },
      data,
      select: PROFILE_BASE_SELECT,
    });

    return updated;
  }

  // Get profile by userId (public view, with block check)
  async getProfileByUserId(currentUserId: string, targetUserId: string) {
    // Block check
    const blockExists = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: currentUserId, blockedUserId: targetUserId },
          { blockerId: targetUserId, blockedUserId: currentUserId },
        ],
      },
      select: { id: true },
    });

    if (blockExists) {
      throw new AppError(ERROR_MESSAGES.BLOCKED_USER, HTTP_STATUS.FORBIDDEN);
    }

    const profile = await prisma.datingProfile.findUnique({
      where: { userId: targetUserId },
      select: {
        userId: true,
        bio: true,
        isActive: true,
        photos: {
          select: { id: true, url: true, order: true },
          orderBy: { order: 'asc' },
        },
        prompts: {
          select: { id: true, question: true, answer: true, order: true },
          orderBy: { order: 'asc' },
        },
        lifestyle: {
          select: LIFESTYLE_SELECT,
        },
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            dateOfBirth: true,
            gender: true,
          },
        },
      },
    });

    if (!profile || !profile.isActive) {
      throw new AppError(ERROR_MESSAGES.DATING_PROFILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return profile;
  }

  // Get my profile
  async getMyProfile(userId: string) {
    const profile = await prisma.datingProfile.findUnique({
      where: { userId },
      select: {
        ...PROFILE_BASE_SELECT,
        photos: {
          select: PHOTO_SELECT,
          orderBy: { order: 'asc' },
        },
        prompts: {
          select: PROMPT_SELECT,
          orderBy: { order: 'asc' },
        },
        lifestyle: {
          select: LIFESTYLE_SELECT,
        },
        preferences: {
          select: PREFERENCES_SELECT,
        },
      },
    });

    if (!profile) {
      throw new AppError(ERROR_MESSAGES.DATING_PROFILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return profile;
  }

  // Add photo
  async addPhoto(userId: string, data: AddPhotoInput) {
    const profileId = await this.getProfileIdByUserId(userId);

    // Check max photos (6)
    const photoCount = await prisma.datingProfilePhoto.count({
      where: { profileId },
    });

    if (photoCount >= 6) {
      throw new AppError(ERROR_MESSAGES.MAX_PHOTOS_EXCEEDED, HTTP_STATUS.BAD_REQUEST);
    }

    // Determine order
    const existingPhotos = await prisma.datingProfilePhoto.findMany({
      where: { profileId },
      select: { order: true },
    });
    const existingOrders: number[] = existingPhotos.map((p) => p.order);

    let order: number;
    if (data.order !== undefined) {
      // Check for duplicate order
      if (existingOrders.includes(data.order)) {
        throw new AppError(ERROR_MESSAGES.DUPLICATE_PHOTO_ORDER, HTTP_STATUS.CONFLICT);
      }
      order = data.order;
    } else {
      // Auto-assign next order
      order = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0;
    }

    const photo = await prisma.datingProfilePhoto.create({
      data: {
        profileId,
        url: data.url,
        order,
      },
      select: PHOTO_SELECT,
    });

    return photo;
  }

  // Delete photo
  async deletePhoto(userId: string, photoId: string) {
    const profileId = await this.getProfileIdByUserId(userId);

    // Check if photo exists and belongs to profile
    const photo = await prisma.datingProfilePhoto.findFirst({
      where: {
        id: photoId,
        profileId,
      },
      select: { id: true },
    });

    if (!photo) {
      throw new AppError(ERROR_MESSAGES.PHOTO_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check total photos count
    const photoCount = await prisma.datingProfilePhoto.count({
      where: { profileId },
    });

    if (photoCount <= 1) {
      throw new AppError(ERROR_MESSAGES.MIN_PHOTOS_REQUIRED, HTTP_STATUS.BAD_REQUEST);
    }

    await prisma.datingProfilePhoto.delete({
      where: { id: photoId },
    });
  }

  // Update prompts (transactional)
  async updatePrompts(userId: string, data: UpdatePromptsInput) {
    const profileId = await this.getProfileIdByUserId(userId);

    // Transaction: delete old + create new
    await prisma.$transaction(async (tx) => {
      await tx.datingProfilePrompt.deleteMany({
        where: { profileId },
      });

      if (data.prompts && data.prompts.length > 0) {
        await tx.datingProfilePrompt.createMany({
          data: data.prompts.map((prompt, index) => ({
            profileId,
            question: prompt.question,
            answer: prompt.answer,
            order: index,
          })),
        });
      }
    });

    // Return updated prompts
    const prompts = await prisma.datingProfilePrompt.findMany({
      where: { profileId },
      select: PROMPT_SELECT,
      orderBy: { order: 'asc' },
    });

    return prompts;
  }

  // Update lifestyle
  async updateLifestyle(userId: string, data: UpdateLifestyleInput) {
    const profileId = await this.getProfileIdByUserId(userId);

    const lifestyle = await prisma.datingProfileLifestyle.upsert({
      where: { profileId },
      create: {
        profileId,
        ...data,
      },
      update: data,
      select: LIFESTYLE_SELECT,
    });

    return lifestyle;
  }

  // Update preferences
  async updatePreferences(userId: string, data: UpdatePreferencesInput) {
    const profileId = await this.getProfileIdByUserId(userId);

    const preferences = await prisma.datingPreferences.upsert({
      where: { profileId },
      create: {
        profileId,
        ...data,
      },
      update: data,
      select: PREFERENCES_SELECT,
    });

    return preferences;
  }
}

export const profileService = new ProfileService();
