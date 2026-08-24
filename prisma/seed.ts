import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient, CourseMode, CourseLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Load .env from the server root (one directory up from prisma/)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const prisma = new PrismaClient();

// ── Read & validate required seed credentials from .env ──────────────────────
const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Shunno Super Admin';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_PHONE    = process.env.ADMIN_PHONE;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_PHONE) {
  console.error('❌ Seed aborted: ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_PHONE must be set in .env');
  process.exit(1);
}

async function main() {
  console.log('🌱 Starting Shunno Academy database seeding...');

  // 1. Seed Super Admin
  const adminPassword = await bcrypt.hash(ADMIN_PASSWORD!, 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL! },
    update: {},
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL!,
      phone: ADMIN_PHONE!,
      password: adminPassword,
      role: 'ADMIN',
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });
  console.log(`✅ Admin seeded: ${admin.email}`);

  // 2. Seed Categories
  const categoriesData = [
    { name: 'Digital Marketing', bengaliName: 'ডিজিটাল মার্কেটিং', slug: 'digital-marketing', order: 1 },
    { name: 'Graphics Design', bengaliName: 'গ্রাফিক্স ডিজাইন', slug: 'graphics-design', order: 2 },
    { name: 'English Communication', bengaliName: 'ইংরেজি ভাষা', slug: 'english', order: 3 },
    { name: 'Search Engine Optimization', bengaliName: 'এসইও ও ট্রাফিক', slug: 'seo', order: 4 },
    { name: 'Artificial Intelligence', bengaliName: 'আর্টিফিশিয়াল ইন্টেলিজেন্স', slug: 'ai', order: 5 },
    { name: 'Web & App Development', bengaliName: 'ওয়েব ডেভেলপমেন্ট', slug: 'web-development', order: 6 },
  ];

  const categoriesMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoriesMap.set(cat.slug, created.id);
  }
  console.log(`✅ ${categoriesMap.size} Categories seeded`);

  // 3. Seed Mentors
  const mentorsData = [
    {
      name: 'মেহেদী হাসান শুভ',
      englishName: 'Mehedi Hasan Shuvo',
      designation: 'Lead Digital Marketer & Strategist',
      specialization: 'ডিজিটাল মার্কেটিং ও গ্রোথ হ্যাকিং',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      accentGradient: 'from-blue-600 to-indigo-600',
      experience: '৮+ বছর অভিজ্ঞতা',
      totalStudents: 3200,
      rating: 4.95,
      order: 1,
    },
    {
      name: 'ফাহিম আহমেদ রিয়াদ',
      englishName: 'Fahim Ahmed Riyad',
      designation: 'Senior Brand & UI/UX Designer',
      specialization: 'গ্রাফিক্স ও ইউআই/ইউএক্স ডিজাইন',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
      accentGradient: 'from-emerald-600 to-teal-500',
      experience: '৭+ বছর অভিজ্ঞতা',
      totalStudents: 2800,
      rating: 4.9,
      order: 2,
    },
    {
      name: 'মোহাম্মদ সৌরভ আহমেদ',
      englishName: 'Md. Sourav Ahmed',
      designation: 'English Communication Coach',
      specialization: 'স্পোকেন ইংলিশ ও ক্লায়েন্ট কমিউনিকেশন',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
      accentGradient: 'from-amber-600 to-orange-500',
      experience: '১০+ বছর অভিজ্ঞতা',
      totalStudents: 4100,
      rating: 4.92,
      order: 3,
    },
    {
      name: 'মো: মাসুদ রানা',
      englishName: 'Md. Masud Rana',
      designation: 'SEO Consultant & Data Architect',
      specialization: 'টেকনিক্যাল ও প্রোগ্রামাটিক এসইও',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
      accentGradient: 'from-sky-600 to-blue-700',
      experience: '৯+ বছর অভিজ্ঞতা',
      totalStudents: 2100,
      rating: 4.96,
      order: 4,
    },
  ];

  const mentorsMap = new Map<string, string>();
  for (const mentor of mentorsData) {
    const existing = await prisma.mentor.findFirst({ where: { englishName: mentor.englishName } });
    if (existing) {
      mentorsMap.set(mentor.englishName, existing.id);
    } else {
      const created = await prisma.mentor.create({ data: mentor });
      mentorsMap.set(mentor.englishName, created.id);
    }
  }
  console.log(`✅ ${mentorsMap.size} Mentors ready`);

  // 4. Seed Courses
  const courses = [
    {
      title: 'Mastering Digital Marketing (Online) Course',
      bengaliTitle: 'মাস্টারিং ডিজিটাল মার্কেটিং (অনলাইন)',
      slug: 'mastering-digital-marketing-online',
      categorySlug: 'digital-marketing',
      mentorName: 'Mehedi Hasan Shuvo',
      mode: CourseMode.Online,
      priceBDT: 24999,
      originalPriceBDT: 30000,
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
      accentColor: 'from-blue-600 to-cyan-500',
      duration: '৪ মাস (৪৮টি লাইভ ক্লাস)',
      totalLectures: 48,
      rating: 4.9,
      totalStudents: 1420,
      badge: 'জনপ্রিয়',
      level: CourseLevel.ALL_LEVELS,
      language: 'বাংলা',
      enrollmentDeadline: new Date('2026-09-05T23:59:59+06:00'),
      overview: 'ডিজিটাল মার্কেটিং এর আধুনিক সব টেকনিক ও স্ট্র্যাটেজি শিখুন একেবারে শূন্য থেকে অ্যাডভান্সড লেভেল পর্যন্ত।',
      learningOutcomes: [
        'ফেসবুক ও ইনস্টাগ্রাম অ্যাড ম্যানেজারের অ্যাডভান্সড অডিয়েন্স টার্গেটিং',
        'গুগল সার্চ ও ডিসপ্লে ক্যাম্পেইন তৈরি ও রিটার্গেটিং সেটআপ',
        'হাই-কনভার্টিং সেলস ফানেল ও লিড জেনারেশন স্ট্র্যাটেজি তৈরি',
      ],
      requirements: ['কম্পিউটার বা ল্যাপটপ এবং স্থিতিশীল ইন্টারনেট সংযোগ'],
      targetAudience: ['যারা ফ্রিল্যান্সিং মার্কেটপ্লেসে ডিজিটাল মার্কেটার হতে চান'],
      faqs: [{ question: 'ক্লাস কীভাবে হবে?', answer: 'জুম লাইভ ক্লাসের মাধ্যমে।' }],
    },
    {
      title: 'Mastering Digital Marketing (Offline) Course',
      bengaliTitle: 'মাস্টারিং ডিজিটাল মার্কেটিং (অফলাইন)',
      slug: 'mastering-digital-marketing-offline',
      categorySlug: 'digital-marketing',
      mentorName: 'Mehedi Hasan Shuvo',
      mode: CourseMode.Offline,
      priceBDT: 27500,
      originalPriceBDT: 35000,
      thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop',
      accentColor: 'from-indigo-600 to-purple-600',
      duration: '৪ মাস (ল্যাব সেশন সহ)',
      totalLectures: 52,
      rating: 4.95,
      totalStudents: 850,
      badge: 'ক্যাম্পাস কোর্স',
      level: CourseLevel.ALL_LEVELS,
      language: 'বাংলা',
      enrollmentDeadline: new Date('2026-09-08T23:59:59+06:00'),
      overview: 'শূন্য একাডেমির বনানী ক্যাম্পাসে সরাসরি বসে মেন্টরের উপস্থিতিতে হাতে-কলমে ল্যাব প্র্যাকটিস সহ অফলাইন ব্যাচ।',
      learningOutcomes: ['আধুনিক হাই-টেক কম্পিউটার ল্যাবে সরাসরি লাইভ ক্যাম্পেইন রান ও অপটিমাইজেশন'],
      requirements: ['ক্লাসে উপস্থিত থাকার মানসিকতা (বনানী ক্যাম্পাস, ঢাকা)'],
      targetAudience: ['যারা সরাসরি ক্লাসরুম ও ল্যাব লার্নিং পছন্দ করেন'],
      faqs: [{ question: 'শিডিউল কী?', answer: 'সপ্তাহে ২ দিন ল্যাব ক্লাস।' }],
    },
    {
      title: 'All-in-One Graphic Design Guide',
      bengaliTitle: 'অল-ইন-ওয়ান গ্রাফিক ডিজাইন গাইড',
      slug: 'all-in-one-graphic-design-guide',
      categorySlug: 'graphics-design',
      mentorName: 'Fahim Ahmed Riyad',
      mode: CourseMode.Online,
      priceBDT: 28500,
      originalPriceBDT: 36000,
      thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop',
      accentColor: 'from-teal-600 to-emerald-500',
      duration: '৩.৫ মাস (প্রজেক্ট বেসড)',
      totalLectures: 40,
      rating: 4.88,
      totalStudents: 1980,
      badge: 'টপ রেটেড',
      level: CourseLevel.BEGINNER,
      language: 'বাংলা',
      enrollmentDeadline: new Date('2026-09-02T23:59:59+06:00'),
      overview: 'অ্যাডোবি ফটোশপ, ইলাস্ট্রেটর ও ফিগমা ব্যবহার করে প্রফেশনাল লোগো, ব্র্যান্ড আইডেন্টিটি, সোশ্যাল মিডিয়া ডিজাইন শিখুন।',
      learningOutcomes: ['লোগো ডিজাইন, ব্র্যান্ডিং গাইডলাইন ও স্টাইল গাইড তৈরি'],
      requirements: ['গ্রাফিক্স সফটওয়্যার চালানোর উপযোগী কম্পিউটার'],
      targetAudience: ['ডিজাইনাররা যারা আন্তর্জাতিক মার্কেটপ্লেসে কাজ করতে চান'],
      faqs: [{ question: 'সফটওয়্যার কীভাবে পাব?', answer: 'ভর্তির পর টেকনিক্যাল টিম সাপোর্ট দেবে।' }],
    },
    {
      title: 'Spoken English Course (Online)',
      bengaliTitle: 'স্পোকেন ইংলিশ কোর্স (অনলাইন)',
      slug: 'spoken-english-course-online',
      categorySlug: 'english',
      mentorName: 'Md. Sourav Ahmed',
      mode: CourseMode.Online,
      priceBDT: 13800,
      originalPriceBDT: 18000,
      thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop',
      accentColor: 'from-amber-600 to-orange-500',
      duration: '৩ মাস (স্পিকিং ক্লাব সহ)',
      totalLectures: 36,
      rating: 4.92,
      totalStudents: 2340,
      badge: 'লাইভ ইন্টারঅ্যাক্টিভ',
      level: CourseLevel.ALL_LEVELS,
      language: 'বাংলা ও ইংরেজি',
      enrollmentDeadline: new Date('2026-08-30T23:59:59+06:00'),
      overview: 'ভয় আর জড়তা কাটিয়ে অনর্গল ও আত্মবিশ্বাসের সাথে ইংরেজিতে কথা বলুন। ক্লায়েন্ট মিটিংয়ের স্পেশাল প্র্যাকটিস।',
      learningOutcomes: ['ইংরেজি বলার সময় জড়তা ও দ্বিধাবোধ দূর করে স্বাভাবিক ফ্লুয়েন্সি অর্জন'],
      requirements: ['বেসিক ইংরেজি পড়া ও বোঝার সামান্য জ্ঞান'],
      targetAudience: ['ফ্রিল্যান্সার, চাকরিপ্রার্থী ও শিক্ষার্থী'],
      faqs: [{ question: 'স্পিকিং ক্লাবে কীভাবে প্র্যাকটিস হয়?', answer: 'সপ্তাহে ৩ দিন গ্রুপে ও পার্টনারের সাথে লাইভ কথা বলা।' }],
    },
    {
      title: 'Become an SEO Strategist',
      bengaliTitle: 'প্রফেশনাল এসইও স্ট্র্যাটেজিস্ট',
      slug: 'become-an-seo-strategist',
      categorySlug: 'seo',
      mentorName: 'Md. Masud Rana',
      mode: CourseMode.Online,
      priceBDT: 35000,
      originalPriceBDT: 42000,
      thumbnail: 'https://images.unsplash.com/photo-1571721795195-a2ca2d3370a9?q=80&w=800&auto=format&fit=crop',
      accentColor: 'from-sky-600 to-blue-700',
      duration: '৪ মাস (লাইভ কেস স্টাডি)',
      totalLectures: 44,
      rating: 4.96,
      totalStudents: 1120,
      badge: 'হাই ডিমান্ড',
      level: CourseLevel.INTERMEDIATE,
      language: 'বাংলা',
      enrollmentDeadline: new Date('2026-09-06T23:59:59+06:00'),
      overview: 'গুগলের প্রথম পেজে ওয়েবসাইট র‍্যাংক করানোর মাস্টার স্ট্র্যাটেজি। টেকনিক্যাল এসইও ও ব্যাকলিংক বিল্ডিং।',
      learningOutcomes: ['গভীর কি-ওয়ার্ড রিসার্চ ও সার্চ ইনটেন্ট ম্যাপিং'],
      requirements: ['কম্পিউটার ও ব্রাউজিং সম্পর্কে ভালো ধারণা'],
      targetAudience: ['এসইও প্রফেশনালস, ব্লগার ও অ্যাফিলিয়েট মার্কেটার্স'],
      faqs: [{ question: 'লাইভ সাইট দিয়ে দেখাবেন?', answer: 'হ্যাঁ, লাইভ কেস স্টাডি দিয়ে শেখানো হবে।' }],
    },
    {
      title: 'Skill to Business with AI 2.0',
      bengaliTitle: 'স্কিল টু বিজনেস উইথ এআই ২.০',
      slug: 'skill-to-business-with-ai',
      categorySlug: 'ai',
      mentorName: 'Mehedi Hasan Shuvo',
      mode: CourseMode.Online,
      priceBDT: 35000,
      originalPriceBDT: 45000,
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
      accentColor: 'from-violet-600 to-indigo-600',
      duration: '৩ মাস (হাতে-কলমে প্র্যাকটিস)',
      totalLectures: 38,
      rating: 4.98,
      totalStudents: 1650,
      badge: 'লেটেস্ট ট্রেন্ড',
      level: CourseLevel.ALL_LEVELS,
      language: 'বাংলা',
      enrollmentDeadline: new Date('2026-09-04T23:59:59+06:00'),
      overview: 'ChatGPT, Midjourney, Claude ও Make.com ব্যবহার করে কাজের গতি ১০ গুণ বাড়ান এবং অটোমেটেড এআই বিজনেস তৈরি করুন।',
      learningOutcomes: ['অ্যাডভান্সড প্রম্পট ইঞ্জিনিয়ারিং ও নো-কোড এআই অটোমেশন'],
      requirements: ['নতুন প্রযুক্তি শেখার আগ্রহ'],
      targetAudience: ['উদ্যোক্তা, ফ্রিল্যান্সার ও কন্টেন্ট ক্রিয়েটররা'],
      faqs: [{ question: 'কোডিং না জানলে হবে?', answer: 'হ্যাঁ, পুরো কোর্সটি নো-কোড ফ্রেমে।' }],
    },
  ];

  for (const c of courses) {
    const categoryId = categoriesMap.get(c.categorySlug);
    const mentorId = mentorsMap.get(c.mentorName);
    if (!categoryId) continue;

    const { categorySlug: _, mentorName: __, ...courseData } = c;

    await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        ...courseData,
        categoryId,
        mentorId,
      },
      create: {
        ...courseData,
        categoryId,
        mentorId,
        modules: {
          create: [
            {
              moduleNumber: 1,
              title: `${c.bengaliTitle} ওরিয়েন্টেশন ও ফান্ডামেন্টালস`,
              description: 'কোর্সের বেসিক পরিচিতি ও মূল বিষয়বস্তু।',
              lecturesCount: 4,
              lectures: {
                create: [
                  { title: 'কোর্স রোডম্যাপ ও গাইডলাইন', duration: '১ ঘণ্টা ৩০ মিনিট', isPreview: true, order: 1 },
                  { title: 'প্র্যাকটিক্যাল সেটআপ ও টুলস ইন্ট্রোডাকশন', duration: '১ ঘণ্টা ২০ মিনিট', isPreview: false, order: 2 },
                ],
              },
            },
          ],
        },
      },
    });
  }
  console.log(`✅ ${courses.length} Courses seeded with curriculum`);

  // 5. Seed Milestone Stats
  const stats = [
    { key: 'active_students', value: '১৫,০০০+', numericValue: 15400, label: 'সফল গ্র্যাজুয়েট ও শিক্ষার্থী', order: 1 },
    { key: 'course_count', value: '১২+', numericValue: 12, label: 'প্রফেশনাল স্কিল কোর্স', order: 2 },
    { key: 'mentors', value: '২৫+', numericValue: 25, label: 'ইন্ডাস্ট্রি এক্সপার্ট মেন্টর', order: 3 },
    { key: 'success_rate', value: '৯৮%', numericValue: 98, label: 'সন্তুষ্টি ও ক্যারিয়ার সাফল্য', order: 4 },
  ];

  for (const s of stats) {
    await prisma.milestoneStat.upsert({
      where: { key: s.key },
      update: s,
      create: s,
    });
  }
  console.log(`✅ Milestone stats seeded`);

  console.log('🎉 Shunno Academy database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

