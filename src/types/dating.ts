
export type DatingSmokingDrinkingExercise = 'NEVER' | 'SOMETIMES' | 'REGULARLY';
export type DatingGenderPreference = 'MALE' | 'FEMALE' | 'OTHER';
export type SwipeAction = 'LIKE' | 'PASS';

// --- Shared: user snippet in dating responses ---

export interface DatingUserSnippet {
  id: string;
  fullName: string;
  avatar: string | null;
  dateOfBirth: string;
  gender: string | null;
}

// --- Profile: entities ---

export interface DatingPhoto {
  id: string;
  url: string;
  order: number;
  createdAt: string;
}

export interface DatingPrompt {
  id: string;
  question: string;
  answer: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatingLifestyle {
  id: string;
  education: string | null;
  job: string | null;
  smoking: DatingSmokingDrinkingExercise | null;
  drinking: DatingSmokingDrinkingExercise | null;
  exercise: DatingSmokingDrinkingExercise | null;
  height: number | null;
  religion: string | null;
  updatedAt: string;
}

export interface DatingPreferences {
  id: string;
  ageMin: number;
  ageMax: number;
  maxDistance: number | null;
  gender: DatingGenderPreference | null;
  updatedAt: string;
}

export interface DatingProfile {
  id: string;
  userId: string;
  bio: string;
  isActive: boolean;
  photos: DatingPhoto[];
  prompts: DatingPrompt[];
  lifestyle: DatingLifestyle | null;
  preferences: DatingPreferences | null;
  user?: DatingUserSnippet;
  createdAt: string;
  updatedAt: string;
}

// --- Profile: request bodies ---

export interface CreateDatingProfileInput {
  bio: string;
}

export interface UpdateDatingProfileInput {
  bio?: string;
  isActive?: boolean;
}

export interface AddPhotoInput {
  url: string;
  order?: number;
}

export interface DatingPromptItem {
  question: string;
  answer: string;
}

export interface UpdatePromptsInput {
  prompts?: DatingPromptItem[];
}

export interface UpdateLifestyleInput {
  education?: string;
  job?: string;
  smoking?: DatingSmokingDrinkingExercise;
  drinking?: DatingSmokingDrinkingExercise;
  exercise?: DatingSmokingDrinkingExercise;
  height?: number;
  religion?: string;
}

export interface UpdatePreferencesInput {
  ageMin: number;
  ageMax: number;
  maxDistance?: number;
  gender?: DatingGenderPreference;
  preferredMajors?: string[];
  sameYearOnly?: boolean;
}

// --- Discovery ---

export interface DiscoveryCard {
  userId: string;
  bio: string;
  photos: Array<{ url: string; order?: number }>;
  user: DatingUserSnippet & {
    studentId?: string | null;
    lastActiveAt?: string | null;
  };
  lifestyle?: { education: string | null } | null;
}

export interface DiscoveryQuery {
  page?: string;
  limit?: string;
}

// --- Swipe ---

export interface SwipeInput {
  targetUserId: string;
  action: SwipeAction;
}

/** Backend response for POST /dating/swipe */
export interface DatingSwipe {
  id: string;
  fromUserId: string;
  toUserId: string;
  action: SwipeAction;
  createdAt: string;
}

export interface SwipeResponse {
  swipe: DatingSwipe;
  matched: boolean;
  match: MatchItem | null;
}

// --- Match ---

export interface MatchItem {
  id: string;
  matchedUser: DatingUserSnippet;
  createdAt: string;
}

export interface MatchDetail extends MatchItem {}

export interface MatchQuery {
  page?: string;
  limit?: string;
}

// --- Location ---

export interface UpdateLocationInput {
  latitude: number;
  longitude: number;
}

export interface NearbyQuery {
  distance?: string;
  page?: string;
  limit?: string;
}

/** Flat shape returned by GET /dating/location/nearby (matches backend) */
export interface NearbyUserCard {
  userId: string;
  fullName: string | null;
  avatar: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bio: string | null;
  firstPhotoUrl: string | null;
  distance: number;
}
