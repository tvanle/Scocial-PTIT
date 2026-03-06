export const DATING_MAJOR_OPTIONS = [
  'Information Technology',
  'Software Engineering',
  'Data Science',
  'Multimedia Technology',
  'Business Administration',
  'Telecommunications',
] as const;

export type DatingMajorOption = (typeof DATING_MAJOR_OPTIONS)[number];
