import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import prisma from '../helpers/prisma';
import config from '../config';

export const seedAdmin = async () => {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [{ email: config.admin.email }, { role: UserRole.ADMIN }],
      },
    });

    if (existingAdmin) {
      return;
    }

    const hashedPassword = await bcrypt.hash(config.admin.password, config.salt_rounds);

    const admin = await prisma.user.create({
      data: {
        name: config.admin.name,
        email: config.admin.email,
        phone: config.admin.phone,
        password: hashedPassword,
        role: UserRole.ADMIN,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    console.log(`👑 Super Admin account seeded successfully: ${admin.email}`);
  } catch (error: any) {
    console.error('⚠️ Admin seeding notice:', error.message);
  }
};

export default seedAdmin;
