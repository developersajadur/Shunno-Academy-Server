import prisma from '../../helpers/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { EnrollmentStatus, UserRole } from '@prisma/client';
import {
  ICreateModulePayload,
  IUpdateModulePayload,
  ICreateLecturePayload,
  IUpdateLecturePayload,
} from './courseModule.interface';

export class CourseModuleService {
  // ---------------- MODULES ----------------
  static async createModule(payload: ICreateModulePayload) {
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: payload.courseId }, { slug: payload.courseId }],
      },
    });

    if (!course) {
      throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
    }

    const lastModule = await prisma.courseModule.findFirst({
      where: { courseId: course.id },
      orderBy: { order: 'desc' },
    });

    const order = payload.order ?? (lastModule ? lastModule.order + 1 : 1);

    const module = await prisma.courseModule.create({
      data: {
        courseId: course.id,
        moduleNumber: payload.moduleNumber,
        title: payload.title,
        description: payload.description,
        order,
      },
      include: {
        lectures: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return module;
  }

  static async updateModule(id: string, payload: IUpdateModulePayload) {
    const existing = await prisma.courseModule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Module not found');
    }

    const updated = await prisma.courseModule.update({
      where: { id },
      data: payload,
      include: {
        lectures: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return updated;
  }

  static async deleteModule(id: string) {
    const existing = await prisma.courseModule.findUnique({
      where: { id },
      include: { lectures: true },
    });

    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Module not found');
    }

    const lecturesToDeleteCount = existing.lectures.length;

    await prisma.$transaction(async (tx: any) => {
      await tx.courseLecture.deleteMany({
        where: { moduleId: id },
      });

      await tx.courseModule.delete({
        where: { id },
      });

      if (lecturesToDeleteCount > 0) {
        await tx.course.update({
          where: { id: existing.courseId },
          data: {
            totalLectures: {
              decrement: lecturesToDeleteCount,
            },
          },
        });
      }
    });

    return { message: 'Module deleted successfully' };
  }

  static async getModulesByCourseId(
    courseIdOrSlug: string,
    userId?: string,
    userRole?: UserRole
  ) {
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            englishName: true,
            designation: true,
            avatar: true,
          },
        },
      },
    });

    if (!course) {
      throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
    }

    // Check if user has approved enrollment or is admin/staff
    let isAuthorized = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;

    if (!isAuthorized && userId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: userId,
          courseId: course.id,
          status: EnrollmentStatus.APPROVED,
        },
      });
      if (enrollment) {
        isAuthorized = true;
      }
    }

    const modules = await prisma.courseModule.findMany({
      where: { courseId: course.id },
      include: {
        lectures: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ moduleNumber: 'asc' }, { order: 'asc' }],
    });

    // If not authorized (not enrolled & not admin), redact private video URLs for non-preview lectures
    const sanitizedModules = modules.map((mod: any) => ({
      ...mod,
      lectures: mod.lectures.map((lec: any) => ({
        ...lec,
        videoUrl: isAuthorized || lec.isPreview ? lec.videoUrl : null,
        isLocked: !isAuthorized && !lec.isPreview,
      })),
    }));

    return {
      course: {
        id: course.id,
        title: course.title,
        bengaliTitle: course.bengaliTitle,
        slug: course.slug,
        thumbnail: course.thumbnail,
        duration: course.duration,
        totalLectures: course.totalLectures,
        mentor: course.mentor,
      },
      isAuthorized,
      modules: sanitizedModules,
    };
  }

  // ---------------- LECTURES / CLASSES ----------------
  static async createLecture(payload: ICreateLecturePayload) {
    const module = await prisma.courseModule.findUnique({
      where: { id: payload.moduleId },
    });

    if (!module) {
      throw new AppError(httpStatus.NOT_FOUND, 'Module not found');
    }

    const lastLecture = await prisma.courseLecture.findFirst({
      where: { moduleId: payload.moduleId },
      orderBy: { order: 'desc' },
    });

    const order = payload.order ?? (lastLecture ? lastLecture.order + 1 : 1);

    const lecture = await prisma.$transaction(async (tx: any) => {
      const lec = await tx.courseLecture.create({
        data: {
          moduleId: payload.moduleId,
          title: payload.title,
          duration: payload.duration,
          videoUrl: payload.videoUrl,
          isPreview: payload.isPreview ?? false,
          order,
        },
      });

      await tx.courseModule.update({
        where: { id: payload.moduleId },
        data: {
          lecturesCount: {
            increment: 1,
          },
        },
      });

      await tx.course.update({
        where: { id: module.courseId },
        data: {
          totalLectures: {
            increment: 1,
          },
        },
      });

      return lec;
    });

    return lecture;
  }

  static async updateLecture(id: string, payload: IUpdateLecturePayload) {
    const existing = await prisma.courseLecture.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Lecture not found');
    }

    const updated = await prisma.courseLecture.update({
      where: { id },
      data: {
        title: payload.title,
        duration: payload.duration,
        videoUrl: payload.videoUrl,
        isPreview: payload.isPreview,
        order: payload.order,
      },
    });

    return updated;
  }

  static async deleteLecture(id: string) {
    const existing = await prisma.courseLecture.findUnique({
      where: { id },
      include: {
        module: true,
      },
    });

    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Lecture not found');
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.courseLecture.delete({
        where: { id },
      });

      await tx.courseModule.update({
        where: { id: existing.moduleId },
        data: {
          lecturesCount: {
            decrement: 1,
          },
        },
      });

      await tx.course.update({
        where: { id: existing.module.courseId },
        data: {
          totalLectures: {
            decrement: 1,
          },
        },
      });
    });

    return { message: 'Lecture deleted successfully' };
  }
}
