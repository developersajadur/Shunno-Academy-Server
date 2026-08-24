import prisma from '../helpers/prisma';

/**
 * Generates a guaranteed unique Student ID in format SA-YYYY-XXXXXX
 * Example: SA-2026-489123
 */
export async function generateUniqueStudentId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  let isUnique = false;
  let studentId = '';

  while (!isUnique) {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit number
    studentId = `SA-${currentYear}-${randomNum}`;

    const existing = await prisma.user.findUnique({
      where: { studentId },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return studentId;
}

