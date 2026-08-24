import prisma from '../../helpers/prisma';
import CacheService from '../../redis/cache.service';
import { CACHE_KEYS, CACHE_TTL } from '../../constants';
import { EnrollmentStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export class StatService {
  static async getPlatformStats() {
    return CacheService.getOrSet(
      CACHE_KEYS.STATS,
      async () => {
        const [
          totalCourses,
          totalStudentsEnrollments,
          totalMentors,
          totalApprovedReviews,
          milestones,
        ] = await Promise.all([
          prisma.course.count({ where: { isPublished: true } }),
          prisma.enrollment.count({ where: { status: 'APPROVED' } }),
          prisma.mentor.count(),
          prisma.review.count({ where: { isApproved: true } }),
          prisma.milestoneStat.findMany({ orderBy: { order: 'asc' } }),
        ]);

        return {
          totalCourses,
          totalStudents: 15400 + totalStudentsEnrollments, // Platform cumulative base + dynamic
          totalMentors,
          totalReviews: totalApprovedReviews,
          satisfactionRate: 98,
          milestones,
        };
      },
      CACHE_TTL.SHORT
    );
  }

  static async getAdminDashboardAnalytics(
    timeRange: string = '30d',
    startDateParam?: string,
    endDateParam?: string
  ) {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (timeRange === 'custom' && startDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      if (endDateParam) {
        endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (timeRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (timeRange === '60d') {
      startDate.setDate(now.getDate() - 60);
    } else if (timeRange === '90d') {
      startDate.setDate(now.getDate() - 90);
    } else if (timeRange === '1y') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      // 'all'
      startDate = new Date(2020, 0, 1);
    }

    // 1. Overall Aggregated Metric Counts
    const [
      verifiedPaymentsAgg,
      pendingPaymentsAgg,
      totalEnrollments,
      approvedEnrollments,
      pendingEnrollments,
      rejectedEnrollments,
      totalStudents,
      totalCourses,
      totalMentors,
      totalInquiries,
      unreadInquiries,
      allPayments,
      allEnrollments,
      courses,
    ] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.VERIFIED },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.PENDING },
      }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { status: EnrollmentStatus.APPROVED } }),
      prisma.enrollment.count({ where: { status: EnrollmentStatus.PENDING } }),
      prisma.enrollment.count({ where: { status: EnrollmentStatus.REJECTED } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.course.count(),
      prisma.mentor.count(),
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { status: 'UNREAD' } }),
      prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: { enrollment: { include: { course: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.enrollment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: { course: true, payment: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.course.findMany({
        include: {
          _count: { select: { enrollments: true } },
          enrollments: {
            where: { status: EnrollmentStatus.APPROVED },
            select: { totalAmount: true },
          },
        },
      }),
    ]);

    const totalRevenue = verifiedPaymentsAgg._sum.amount || 0;
    const pendingRevenue = pendingPaymentsAgg._sum.amount || 0;

    // 2. Timeline Aggregation (Daily or Monthly bucketing)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isDaily = diffDays <= 65; // Daily bucketing for 65 days or fewer

    const timelineMap: Record<string, { label: string; revenue: number; enrollments: number; pending: number }> = {};

    if (isDaily) {
      const cur = new Date(startDate);
      while (cur <= endDate) {
        const key = cur.toISOString().split('T')[0];
        const label = cur.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
        timelineMap[key] = { label, revenue: 0, enrollments: 0, pending: 0 };
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      const cur = new Date(startDate);
      while (cur <= endDate) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
        const label = cur.toLocaleDateString('bn-BD', { month: 'short', year: 'numeric' });
        if (!timelineMap[key]) {
          timelineMap[key] = { label, revenue: 0, enrollments: 0, pending: 0 };
        }
        cur.setMonth(cur.getMonth() + 1);
      }
    }

    // Populate timeline data from payments and enrollments
    allPayments.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = isDaily
        ? d.toISOString().split('T')[0]
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (timelineMap[key]) {
        if (p.status === PaymentStatus.VERIFIED) {
          timelineMap[key].revenue += p.amount;
        } else if (p.status === PaymentStatus.PENDING) {
          timelineMap[key].pending += p.amount;
        }
      }
    });

    allEnrollments.forEach((e) => {
      const d = new Date(e.createdAt);
      const key = isDaily
        ? d.toISOString().split('T')[0]
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (timelineMap[key]) {
        timelineMap[key].enrollments += 1;
      }
    });

    const revenueTimeline = Object.entries(timelineMap).map(([key, val]) => ({
      date: key,
      label: val.label,
      revenue: val.revenue,
      enrollments: val.enrollments,
      pending: val.pending,
    }));

    // 3. Top Courses & Revenue Distribution
    const topCourses = courses
      .map((c) => {
        const courseRevenue = c.enrollments.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        return {
          id: c.id,
          title: c.title,
          slug: c.slug,
          enrollments: c._count.enrollments,
          revenue: courseRevenue,
          priceBDT: c.priceBDT,
        };
      })
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);

    // 4. Payment Methods Breakdown
    const methodCounts: Record<string, { count: number; totalAmount: number }> = {};
    allPayments.forEach((p) => {
      const m = p.method || 'OTHER';
      if (!methodCounts[m]) {
        methodCounts[m] = { count: 0, totalAmount: 0 };
      }
      methodCounts[m].count += 1;
      if (p.status === PaymentStatus.VERIFIED) {
        methodCounts[m].totalAmount += p.amount;
      }
    });

    const methodColors: Record<string, string> = {
      BKASH: '#e2136e',
      NAGAD: '#f7941d',
      ROCKET: '#8c3494',
      UPAY: '#005baa',
      CARD: '#2563eb',
      BANK_TRANSFER: '#10b981',
    };

    const paymentMethods = Object.entries(methodCounts).map(([method, data]) => ({
      method,
      label:
        method === 'BKASH'
          ? 'বিকাশ (bKash)'
          : method === 'NAGAD'
          ? 'নগদ (Nagad)'
          : method === 'ROCKET'
          ? 'রকেট (Rocket)'
          : method === 'UPAY'
          ? 'উপায় (Upay)'
          : method === 'CARD'
          ? 'কার্ড (Card)'
          : 'ব্যাংক ট্রান্সফার',
      count: data.count,
      totalAmount: data.totalAmount,
      color: methodColors[method] || '#64748b',
    }));

    // 5. Enrollment Status Ratio
    const enrollmentBreakdown = [
      { status: 'APPROVED', label: 'অনুমোদিত (Approved)', count: approvedEnrollments, color: '#10b981' },
      { status: 'PENDING', label: 'পেন্ডিং (Pending)', count: pendingEnrollments, color: '#f59e0b' },
      { status: 'REJECTED', label: 'বাতিল (Rejected)', count: rejectedEnrollments, color: '#ef4444' },
    ];

    return {
      kpis: {
        totalRevenue,
        pendingRevenue,
        totalEnrollments,
        approvedEnrollments,
        pendingEnrollments,
        rejectedEnrollments,
        totalStudents,
        totalCourses,
        totalMentors,
        totalInquiries,
        unreadInquiries,
        conversionRate: totalEnrollments > 0 ? Math.round((approvedEnrollments / totalEnrollments) * 100) : 0,
        averageOrderValue: approvedEnrollments > 0 ? Math.round(totalRevenue / approvedEnrollments) : 0,
      },
      revenueTimeline,
      topCourses,
      paymentMethods,
      enrollmentBreakdown,
      timeRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }
}
