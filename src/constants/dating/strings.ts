export const DATING_STRINGS = {
    titleStart: 'PTIT ',
    titleHighlight: 'Connect',
    buttonText: 'Bắt đầu',
    footerText: 'Dành riêng cho sinh viên Học viện Công nghệ\nBưu chính Viễn thông',
  onboardingStep1Title: 'Find Your Perfect Match',
  onboardingStep1Description:
    'Find students who share your interests and major. Like a profile to connect—if they like you back, it\'s a match!',
  onboardingNext: 'Next',
  onboardingStep1Of3: 'Step 1 of 3',

  profileSetupTitle: 'Profile Setup',
  profileSetupAboutYou: 'About You',
  profileSetupStep2Of3: 'Step 2 of 3',
  profileSetupPhotos: 'Photos',
  profileSetupPhotosHint: 'Add at least 2 photos to continue',
  profileSetupMainPhoto: 'Main Photo',
  profileSetupBio: 'Bio',
  profileSetupBioPlaceholder:
    "Tell us a bit about yourself, your hobbies, or what you're looking for...",
  profileSetupBioCounter: (current: number, max: number) => `${current} / ${max}`,
  profileSetupInterests: 'Interests',
  profileSetupContinue: 'Continue',

  preferencesStep3Of3: 'Step 3 of 3',
  preferencesTitle: 'Dating Preferences',
  preferencesFindMatch: 'Find your match',
  preferencesFindMatchHint: "Fine-tune who you'd like to meet on PTIT Connect.",
  preferencesAgeRange: 'Age Range',
  preferencesAgeDisplay: (min: number, max: number) =>
    max >= 30 ? `${min} - 30+` : `${min} - ${max}`,
  preferencesPreferredMajors: 'Preferred Major(s)',
  preferencesSelectMajor: 'Select major',
  preferencesAllMajorsSelected: 'All majors selected',
  preferencesSameYearOnly: 'Same Year Only',
  preferencesSameYearHint:
    'Only show people from your own academic year (e.g., K21).',
  preferencesPrivacyTitle: 'Privacy Note:',
  preferencesPrivacyBody:
    'Your preferences are private and used solely to provide better matches. Other users cannot see your specific filters.',
  preferencesFinish: 'Finish',
  preferencesRemoveMajor: (major: string) => `Remove ${major}`,
};
