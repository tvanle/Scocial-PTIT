/**
 * Shared dating utilities.
 */

/** Tính tuổi từ ngày sinh (YYYY-MM-DD hoặc ISO string). */
export function calculateAge(dob: string | null | undefined): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/** Trích năm học từ mã SV (ví dụ "B20DCCC123" -> 3). */
export function extractYear(studentId: string | null | undefined): number | null {
  if (!studentId) return null;
  const match = studentId.match(/[A-Z](\d{2})/);
  if (!match) return null;
  const startYear = 2000 + parseInt(match[1], 10);
  return new Date().getFullYear() - startYear + 1;
}
