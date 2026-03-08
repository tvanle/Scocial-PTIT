import { DatingPreferences, Gender } from '@prisma/client';

interface CandidateData {
  userId: string;
  bio: string | null;
  latitude: number | null;
  longitude: number | null;
  photos: { url: string }[];
  user: {
    id: string;
    fullName: string | null;
    dateOfBirth: Date | null;
    gender: Gender | null;
    studentId: string | null;
    lastActiveAt: Date | null;
  };
  lifestyle: {
    education: string | null;
  } | null;
}

interface ScoredCandidate extends CandidateData {
  score: number;
}

interface ScoringContext {
  preferences: DatingPreferences | null;
  myStudentId: string | null;
  myLatitude: number | null;
  myLongitude: number | null;
}

const SCORING_CONFIG = {
  weights: {
    ageMatch: 30,
    genderMatch: 20,
    majorMatch: 20,
    sameYear: 10,
    profileCompleteness: 10,
    recentActivity: 10,
  },

  fallback: {
    noPref: 0.5,
    noData: 0.3,
    weakMatch: 0.1,
  },

  completeness: {
    photosGood: 3,
    photosMin: 1,
    photosGoodScore: 0.4,
    photosMinScore: 0.2,
    bioGoodLength: 20,
    bioGoodScore: 0.3,
    bioMinScore: 0.1,
    educationScore: 0.15,
    fullNameScore: 0.15,
  },

  activity: {
    recentHours: 1,
    dayHours: 24,
    threeDaysHours: 72,
    weekHours: 168,
    dayDecay: 0.7,
    threeDaysDecay: 0.4,
    weekDecay: 0.2,
  },

  studentIdPattern: /[A-Z](\d{2})/,
} as const;

function extractAcademicYear(studentId: string | null): number | null {
  if (!studentId) return null;
  const match = studentId.match(SCORING_CONFIG.studentIdPattern);
  return match ? parseInt(match[1], 10) : null;
}

function calculateAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

function scoreAgeMatch(dob: Date | null, prefs: DatingPreferences): number {
  const w = SCORING_CONFIG.weights.ageMatch;
  if (!dob) return w * SCORING_CONFIG.fallback.noPref;

  const age = calculateAge(dob);
  const { ageMin, ageMax } = prefs;

  if (age < ageMin || age > ageMax) return 0;

  const center = (ageMin + ageMax) / 2;
  const halfRange = (ageMax - ageMin) / 2 || 1;
  const distFromCenter = Math.abs(age - center);
  return w * (1 - distFromCenter / (halfRange + 1));
}

function scoreGenderMatch(gender: Gender | null, prefs: DatingPreferences): number {
  const w = SCORING_CONFIG.weights.genderMatch;
  if (!prefs.gender) return w * SCORING_CONFIG.fallback.noPref;
  return gender === prefs.gender ? w : 0;
}

function scoreMajorMatch(
  education: string | null,
  preferredMajors: string[],
): number {
  const w = SCORING_CONFIG.weights.majorMatch;
  if (preferredMajors.length === 0) return w * SCORING_CONFIG.fallback.noPref;
  if (!education) return 0;

  const eduLower = education.toLowerCase();
  const matched = preferredMajors.some((m) => eduLower.includes(m.toLowerCase()));
  return matched ? w : w * SCORING_CONFIG.fallback.weakMatch;
}

function scoreSameYear(
  candidateStudentId: string | null,
  myStudentId: string | null,
  sameYearOnly: boolean,
): number {
  const w = SCORING_CONFIG.weights.sameYear;
  if (!sameYearOnly) return w * SCORING_CONFIG.fallback.noPref;

  const myYear = extractAcademicYear(myStudentId);
  const theirYear = extractAcademicYear(candidateStudentId);

  if (!myYear || !theirYear) return w * SCORING_CONFIG.fallback.noData;
  return myYear === theirYear ? w : 0;
}

function scoreProfileCompleteness(candidate: CandidateData): number {
  let completeness = 0;
  const w = SCORING_CONFIG.weights.profileCompleteness;
  const cfg = SCORING_CONFIG.completeness;

  if (candidate.photos.length >= cfg.photosGood) completeness += cfg.photosGoodScore;
  else if (candidate.photos.length >= cfg.photosMin) completeness += cfg.photosMinScore;

  if (candidate.bio && candidate.bio.length >= cfg.bioGoodLength) completeness += cfg.bioGoodScore;
  else if (candidate.bio) completeness += cfg.bioMinScore;

  if (candidate.lifestyle?.education) completeness += cfg.educationScore;
  if (candidate.user.fullName) completeness += cfg.fullNameScore;

  return w * Math.min(completeness, 1);
}

function scoreRecentActivity(lastActiveAt: Date | null): number {
  const w = SCORING_CONFIG.weights.recentActivity;
  if (!lastActiveAt) return 0;

  const hoursSinceActive = (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60);
  const cfg = SCORING_CONFIG.activity;

  if (hoursSinceActive <= cfg.recentHours) return w;
  if (hoursSinceActive <= cfg.dayHours) return w * cfg.dayDecay;
  if (hoursSinceActive <= cfg.threeDaysHours) return w * cfg.threeDaysDecay;
  if (hoursSinceActive <= cfg.weekHours) return w * cfg.weekDecay;
  return 0;
}

export function scoreCandidates(
  candidates: CandidateData[],
  context: ScoringContext,
): ScoredCandidate[] {
  const { preferences, myStudentId } = context;

  if (!preferences) {
    return candidates.map((c) => ({ ...c, score: 0 }));
  }

  return candidates
    .map((candidate) => {
      const score =
        scoreAgeMatch(candidate.user.dateOfBirth, preferences) +
        scoreGenderMatch(candidate.user.gender, preferences) +
        scoreMajorMatch(
          candidate.lifestyle?.education ?? null,
          preferences.preferredMajors ?? [],
        ) +
        scoreSameYear(
          candidate.user.studentId,
          myStudentId,
          preferences.sameYearOnly ?? false,
        ) +
        scoreProfileCompleteness(candidate) +
        scoreRecentActivity(candidate.user.lastActiveAt);

      return { ...candidate, score };
    })
    .sort((a, b) => b.score - a.score);
}
