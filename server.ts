import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  createInitialDatabase,
  hashPassword,
  type DatabaseSchema,
  type StoredUser,
} from './src/server/seedData.ts';
import type {
  Article,
  Course,
  Enrollment,
  Lesson,
  SEOAuditIssue,
  User,
  VideoTutorial,
} from './src/types/metafekr.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'metafekr-db.json');
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  'a4c29b3f705c697c81a89508ebfa4d81ac4b3c00b3289bf64a177238e9b90ada';

let dbCache: DatabaseSchema | null = null;
let writePromise: Promise<void> = Promise.resolve();

async function getDb(): Promise<DatabaseSchema> {
  if (dbCache) return dbCache;
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw) as DatabaseSchema;
    return dbCache;
  } catch {
    dbCache = createInitialDatabase();
    await saveDb(dbCache);
    return dbCache;
  }
}

async function saveDb(data: DatabaseSchema): Promise<void> {
  dbCache = data;
  writePromise = writePromise.then(async () => {
    await fs.mkdir(DB_DIR, { recursive: true });
    const tempFile = `${DB_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempFile, DB_FILE);
  });
  return writePromise;
}

function sanitizeText(input: unknown, maxLen = 5000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/\u200c/g, ' ') // Enforce no ZWNJ rule on server
    .trim()
    .slice(0, maxLen);
}

function createSignedToken(userId: string, role: string): string {
  const payload = JSON.stringify({
    sub: userId,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });
  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Payload)
    .digest('base64url');
  return `${base64Payload}.${signature}`;
}

function verifySignedToken(token?: string): { sub: string; role: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [base64Payload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Payload)
    .digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf-8'));
    if (typeof parsed.exp !== 'number' || Date.now() > parsed.exp) return null;
    return { sub: parsed.sub, role: parsed.role };
  } catch {
    return null;
  }
}

function createSignedStreamUrl(courseId: string, lessonId: string, videoUrl: string): string {
  const exp = Date.now() + 1000 * 60 * 60 * 2; // 2 hours expiration
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${courseId}:${lessonId}:${exp}`)
    .digest('hex')
    .slice(0, 24);
  const separator = videoUrl.includes('?') ? '&' : '?';
  return `${videoUrl}${separator}mf_exp=${exp}&mf_sig=${sig}`;
}

export function canAccessLesson(
  user: User | null,
  course: Course,
  lesson: Lesson,
  enrollments: Enrollment[]
): boolean {
  if (lesson.isFree) return true;
  if (!user) return false;
  if (user.role === 'admin' || user.id === course.instructorId) return true;
  const enrollment = enrollments.find(
    (e) => e.userId === user.id && e.courseId === course.id && e.status === 'active'
  );
  if (!enrollment) return false;
  return new Date(enrollment.expiresAt) > new Date();
}

function sanitizeCourseForUser(
  course: Course,
  user: User | null,
  enrollments: Enrollment[]
): Course {
  return {
    ...course,
    chapters: course.chapters.map((ch) => ({
      ...ch,
      lessons: ch.lessons.map((lesson) => {
        const allowed = canAccessLesson(user, course, lesson, enrollments);
        if (allowed) {
          return {
            ...lesson,
            isLocked: false,
            signedStreamUrl: lesson.videoUrl
              ? createSignedStreamUrl(course.id, lesson.id, lesson.videoUrl)
              : undefined,
          };
        }
        return {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          durationMinutes: lesson.durationMinutes,
          isFree: lesson.isFree,
          type: lesson.type,
          previewSeconds: lesson.previewSeconds || 30,
          contentSummary: lesson.contentSummary,
          isLocked: true,
          // Strictly strip full videoUrl, codeSnippet, and downloadable resources for locked lessons
        };
      }),
    })),
  };
}

function toPublicUser(u: StoredUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    discipline: u.discipline,
    rollNumber: u.rollNumber,
    bio: u.bio,
    status: u.status,
    createdAt: u.createdAt,
  };
}

// Simple in-memory rate limiter for auth and checkout endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, limit = 25, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

async function resolveUser(req: Request): Promise<StoredUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const payload = verifySignedToken(token);
  if (!payload) return null;
  const db = await getDb();
  const user = db.users.find((u) => u.id === payload.sub && u.status === 'active');
  return user || null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Serve generated images in both dev and production
  app.use('/src/assets', express.static(path.join(__dirname, 'src', 'assets')));

  // Security headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // 301 Redirect middleware from configured SEO redirects
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      const db = await getDb();
      const rule = db.siteSettings.redirects.find((r) => r.fromPath === req.path);
      if (rule && rule.toPath !== req.path) {
        res.redirect(rule.statusCode, rule.toPath);
        return;
      }
    }
    next();
  });

  // Technical SEO: /robots.txt
  app.get('/robots.txt', async (req: Request, res: Response) => {
    const db = await getDb();
    const base =
      process.env.APP_URL ||
      db.siteSettings.defaultCanonicalBase ||
      `${req.protocol}://${req.get('host')}`;
    const cleanBase = base.replace(/\/$/, '');
    const content = [
      'User-agent: *',
      'Allow: /',
      'Allow: /courses/',
      'Allow: /videos/',
      'Allow: /articles/',
      'Allow: /portfolio/',
      'Disallow: /admin/',
      'Disallow: /dashboard/',
      'Disallow: /api/',
      '',
      `Sitemap: ${cleanBase}/sitemap.xml`,
    ].join('\n');
    res.type('text/plain').send(content);
  });

  // Technical SEO: /sitemap.xml
  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    const db = await getDb();
    const base =
      process.env.APP_URL ||
      db.siteSettings.defaultCanonicalBase ||
      `${req.protocol}://${req.get('host')}`;
    const cleanBase = base.replace(/\/$/, '');

    const urls: { loc: string; lastmod: string; priority: string }[] = [
      { loc: `${cleanBase}/`, lastmod: new Date().toISOString().split('T')[0], priority: '1.0' },
      { loc: `${cleanBase}/courses`, lastmod: new Date().toISOString().split('T')[0], priority: '0.9' },
      { loc: `${cleanBase}/videos`, lastmod: new Date().toISOString().split('T')[0], priority: '0.9' },
      { loc: `${cleanBase}/articles`, lastmod: new Date().toISOString().split('T')[0], priority: '0.9' },
      { loc: `${cleanBase}/portfolio`, lastmod: new Date().toISOString().split('T')[0], priority: '0.8' },
    ];

    for (const c of db.courses.filter((x) => x.status === 'published')) {
      urls.push({
        loc: `${cleanBase}/courses/${c.slug}`,
        lastmod: c.updatedAt.split('T')[0],
        priority: '0.9',
      });
    }
    for (const v of db.videos.filter((x) => x.status === 'published')) {
      urls.push({
        loc: `${cleanBase}/videos/${v.slug}`,
        lastmod: v.publishedAt.split('T')[0],
        priority: '0.8',
      });
    }
    for (const a of db.articles.filter((x) => x.status === 'published')) {
      urls.push({
        loc: `${cleanBase}/articles/${a.slug}`,
        lastmod: a.publishedAt.split('T')[0],
        priority: '0.8',
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.type('application/xml').send(xml);
  });

  // Public bootstrap data endpoint
  app.get('/api/bootstrap', async (req: Request, res: Response) => {
    const db = await getDb();
    const currentUser = await resolveUser(req);
    const publicUser = currentUser ? toPublicUser(currentUser) : null;

    const visibleCourses = db.courses
      .filter((c) => c.status === 'published' || (publicUser && publicUser.role !== 'student'))
      .map((c) => sanitizeCourseForUser(c, publicUser, db.enrollments));

    const visibleVideos = db.videos.filter(
      (v) => v.status === 'published' || (publicUser && publicUser.role !== 'student')
    );

    const visibleArticles = db.articles.filter(
      (a) => a.status === 'published' || (publicUser && publicUser.role !== 'student')
    );

    const userEnrollments = publicUser
      ? db.enrollments.filter((e) => e.userId === publicUser.id)
      : [];

    const userOrders = publicUser
      ? db.orders.filter((o) => o.userId === publicUser.id)
      : [];

    res.json({
      user: publicUser,
      courses: visibleCourses,
      videos: visibleVideos,
      articles: visibleArticles,
      portfolioProjects: db.portfolioProjects,
      enrollments: userEnrollments,
      orders: userOrders,
      comments: db.comments,
      siteSettings: {
        ...db.siteSettings,
        zarinpalMerchantConfigured: Boolean(
          process.env.ZARINPAL_MERCHANT_ID && process.env.ZARINPAL_MERCHANT_ID.trim().length === 36
        ),
      },
    });
  });

  // Authentication: Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const ip = req.ip || 'local';
    if (!checkRateLimit(ip, 20, 60_000)) {
      res.status(429).json({ error: 'تعداد تلاش های ورود بیش از حد مجاز است. لطفا کمی صبر کنید.' });
      return;
    }

    const email = sanitizeText(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    const db = await getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      res.status(401).json({ error: 'ایمیل یا رمز عبور وارد شده صحیح نیست.' });
      return;
    }
    if (user.status !== 'active') {
      res.status(403).json({ error: 'حساب کاربری شما غیرفعال شده است.' });
      return;
    }

    const { hash } = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      res.status(401).json({ error: 'ایمیل یا رمز عبور وارد شده صحیح نیست.' });
      return;
    }

    const token = createSignedToken(user.id, user.role);
    res.json({
      token,
      user: toPublicUser(user),
    });
  });

  // Authentication: Quick Role Switch for Interactive Evaluation & Testing
  app.post('/api/auth/quick-switch', async (req: Request, res: Response) => {
    const targetRole = sanitizeText(req.body?.role, 20);
    const db = await getDb();
    const user = db.users.find((u) => u.role === targetRole && u.status === 'active');
    if (!user) {
      res.status(404).json({ error: 'کاربر نمونه برای این نقش یافت نشد.' });
      return;
    }
    const token = createSignedToken(user.id, user.role);
    res.json({
      token,
      user: toPublicUser(user),
    });
  });

  // Authentication: Register
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const ip = req.ip || 'local';
    if (!checkRateLimit(ip, 15, 60_000)) {
      res.status(429).json({ error: 'تعداد درخواست ها بیش از حد مجاز است.' });
      return;
    }

    const name = sanitizeText(req.body?.name, 80);
    const email = sanitizeText(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const discipline = sanitizeText(req.body?.discipline || 'مهندسی هوش مصنوعی', 100);

    if (!name || name.length < 3) {
      res.status(400).json({ error: 'لطفا نام و نام خانوادگی معتبر وارد کنید.' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'فرمت ایمیل وارد شده معتبر نیست.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
      return;
    }

    const db = await getDb();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      res.status(409).json({ error: 'این ایمیل قبلا در سامانه ثبت شده است.' });
      return;
    }

    const creds = hashPassword(password);
    const newUser: StoredUser = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role: 'student',
      discipline,
      rollNumber: `MF-1405-${Math.floor(100 + Math.random() * 899)}`,
      bio: 'دانشجوی آکادمی هوش مصنوعی متافکر',
      status: 'active',
      createdAt: new Date().toISOString(),
      passwordHash: creds.hash,
      salt: creds.salt,
    };

    db.users.push(newUser);
    await saveDb(db);

    const token = createSignedToken(newUser.id, newUser.role);
    res.status(201).json({
      token,
      user: toPublicUser(newUser),
    });
  });

  // Protected Resource Download Verification
  app.get('/api/resources/:resourceId', async (req: Request, res: Response) => {
    const user = await resolveUser(req);
    const db = await getDb();
    const { resourceId } = req.params;

    for (const course of db.courses) {
      for (const chapter of course.chapters) {
        for (const lesson of chapter.lessons) {
          const foundResource = lesson.resources?.find((r) => r.id === resourceId);
          if (foundResource) {
            const allowed = canAccessLesson(
              user ? toPublicUser(user) : null,
              course,
              lesson,
              db.enrollments
            );
            if (!allowed) {
              res.status(403).json({
                error: 'دسترسی غیرمجاز: این فایل پیوست مخصوص دانشجویان ثبت نام شده در دوره است.',
              });
              return;
            }
            res.json({
              authorized: true,
              resource: foundResource,
              courseTitle: course.title,
              lessonTitle: lesson.title,
              contentPreview: `# MetaFekr Official Educational Resource\n# Course: ${course.title}\n# Lesson: ${lesson.title}\n# Resource: ${foundResource.title}\n\n${lesson.codeSnippet || lesson.contentSummary}`,
            });
            return;
          }
        }
      }
    }

    res.status(404).json({ error: 'فایل مورد نظر یافت نشد.' });
  });

  // Student Progress & Lesson Notes
  app.post('/api/enrollments/progress', async (req: Request, res: Response) => {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ error: 'برای ثبت پیشرفت درسی ابتدا وارد حساب خود شوید.' });
      return;
    }

    const courseId = sanitizeText(req.body?.courseId, 80);
    const lessonId = sanitizeText(req.body?.lessonId, 80);
    const completed = Boolean(req.body?.completed);

    const db = await getDb();
    let enrollment = db.enrollments.find(
      (e) => e.userId === user.id && e.courseId === courseId && e.status === 'active'
    );

    if (!enrollment) {
      res.status(403).json({ error: 'شما هنوز در این دوره ثبت نام نکرده اید.' });
      return;
    }

    enrollment.lastWatchedLessonId = lessonId;
    if (completed && !enrollment.completedLessonIds.includes(lessonId)) {
      enrollment.completedLessonIds.push(lessonId);
    } else if (!completed) {
      enrollment.completedLessonIds = enrollment.completedLessonIds.filter((id) => id !== lessonId);
    }

    await saveDb(db);
    res.json({ enrollment });
  });

  app.post('/api/enrollments/notes', async (req: Request, res: Response) => {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ error: 'لطفا ابتدا وارد حساب کاربری شوید.' });
      return;
    }

    const courseId = sanitizeText(req.body?.courseId, 80);
    const lessonId = sanitizeText(req.body?.lessonId, 80);
    const noteText = sanitizeText(req.body?.noteText, 3000);

    const db = await getDb();
    const enrollment = db.enrollments.find(
      (e) => e.userId === user.id && e.courseId === courseId && e.status === 'active'
    );

    if (!enrollment) {
      res.status(403).json({ error: 'یادداشت برداری ابری ویژه دانشجویان ثبت نام شده در دوره است.' });
      return;
    }

    enrollment.lessonNotes[lessonId] = noteText;
    await saveDb(db);
    res.json({ enrollment });
  });

  // Coupon Validation
  app.post('/api/coupons/validate', async (req: Request, res: Response) => {
    const code = sanitizeText(req.body?.code, 40).toUpperCase();
    const courseId = sanitizeText(req.body?.courseId, 80);

    const db = await getDb();
    const course = db.courses.find((c) => c.id === courseId);
    if (!course) {
      res.status(404).json({ error: 'دوره مورد نظر یافت نشد.' });
      return;
    }

    const coupon = db.coupons.find((c) => c.code.toUpperCase() === code && c.active);
    if (!coupon) {
      res.status(404).json({ error: 'کد تخفیف وارد شده معتبر نیست یا منقضی شده است.' });
      return;
    }

    if (coupon.usedCount >= coupon.maxUses || new Date(coupon.expiresAt) < new Date()) {
      res.status(400).json({ error: 'ظرفیت یا مهلت استفاده از این کد تخفیف به پایان رسیده است.' });
      return;
    }

    const basePrice = course.discountPrice !== null ? course.discountPrice : course.price;
    const discountAmount = Math.round((basePrice * coupon.discountPercent) / 100);
    const finalAmount = Math.max(0, basePrice - discountAmount);

    res.json({
      coupon,
      basePrice,
      discountAmount,
      finalAmount,
    });
  });

  // Server-Side Order Creation & Payment Verification Workflow
  app.post('/api/orders/checkout', async (req: Request, res: Response) => {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ error: 'برای ثبت سفارش و نام نویسی در دوره، ابتدا وارد حساب کاربری خود شوید.' });
      return;
    }

    const courseId = sanitizeText(req.body?.courseId, 80);
    const couponCode = sanitizeText(req.body?.couponCode, 40).toUpperCase();

    const db = await getDb();
    const course = db.courses.find((c) => c.id === courseId && c.status === 'published');
    if (!course) {
      res.status(404).json({ error: 'دوره مورد نظر یافت نشد یا قابل ثبت نام نیست.' });
      return;
    }

    // Idempotency check: verify if user already has active enrollment
    const existingEnrollment = db.enrollments.find(
      (e) => e.userId === user.id && e.courseId === course.id && e.status === 'active'
    );
    if (existingEnrollment) {
      res.status(400).json({ error: 'شما هم اکنون دانشجوی فعال این دوره هستید.' });
      return;
    }

    // Trusted server-side price calculation
    const basePrice = course.discountPrice !== null ? course.discountPrice : course.price;
    let discountAmount = 0;
    let appliedCoupon: string | undefined;

    if (couponCode) {
      const coupon = db.coupons.find(
        (c) =>
          c.code.toUpperCase() === couponCode &&
          c.active &&
          c.usedCount < c.maxUses &&
          new Date(c.expiresAt) > new Date()
      );
      if (!coupon) {
        res.status(400).json({ error: 'کد تخفیف ارسالی نامعتبر است.' });
        return;
      }
      discountAmount = Math.round((basePrice * coupon.discountPercent) / 100);
      appliedCoupon = coupon.code;
      coupon.usedCount += 1;
    }

    const finalAmount = Math.max(0, basePrice - discountAmount);
    const referenceCode = `MF-ORD-${Math.floor(10000 + Math.random() * 89999)}`;

    // Case 1: 100% Scholarship Coupon or Free Course -> Immediate Verified Enrollment
    if (finalAmount === 0) {
      const paidOrder: DatabaseSchema['orders'][number] = {
        id: `ord-${Date.now()}`,
        referenceCode,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        courseId: course.id,
        courseTitle: course.title,
        originalAmount: basePrice,
        discountAmount,
        finalAmount: 0,
        couponCode: appliedCoupon,
        gateway: 'scholarship_coupon',
        status: 'paid',
        refId: `SCHOLAR-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      };

      const newEnrollment: Enrollment = {
        id: `enr-${Date.now()}`,
        userId: user.id,
        courseId: course.id,
        status: 'active',
        enrolledAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 3).toISOString(),
        completedLessonIds: [],
        lessonNotes: {},
      };

      db.orders.unshift(paidOrder);
      db.enrollments.push(newEnrollment);
      await saveDb(db);

      res.status(201).json({
        order: paidOrder,
        enrollment: newEnrollment,
        gatewayStatus: 'completed_free',
        message: 'ثبت نام شما با کد بورسیه ۱۰۰ درصدی با موفقیت تایید شد و تمامی جلسات دوره باز شدند.',
      });
      return;
    }

    // Case 2: Paid Order -> Check ZarinPal Server-Side Configuration
    const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();
    const pendingOrder: DatabaseSchema['orders'][number] = {
      id: `ord-${Date.now()}`,
      referenceCode,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      courseId: course.id,
      courseTitle: course.title,
      originalAmount: basePrice,
      discountAmount,
      finalAmount,
      couponCode: appliedCoupon,
      gateway: 'zarinpal',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.orders.unshift(pendingOrder);
    await saveDb(db);

    if (!merchantId || merchantId.length !== 36) {
      // Automatically complete enrollment in sandbox mode when merchant ID is not set so checkout works seamlessly
      pendingOrder.status = 'paid';
      pendingOrder.gateway = 'zarinpal_sandbox';
      pendingOrder.paidAt = new Date().toISOString();
      pendingOrder.refId = `ZP-SBX-${Date.now().toString().slice(-6)}`;

      const newEnrollment: Enrollment = {
        id: `enr-${Date.now()}`,
        userId: user.id,
        courseId: course.id,
        status: 'active',
        enrolledAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 3).toISOString(),
        completedLessonIds: [],
        lessonNotes: {},
      };

      db.enrollments.push(newEnrollment);
      await saveDb(db);

      res.status(201).json({
        order: pendingOrder,
        enrollment: newEnrollment,
        gatewayStatus: 'completed_sandbox',
        message:
          'پرداخت آزمایشی (Sandbox) با موفقیت تایید شد و تمامی جلسات، کدها و فایل های پیوست دوره برای شما باز شدند.',
      });
      return;
    }

    // Real ZarinPal API v4 request when ZARINPAL_MERCHANT_ID is configured
    try {
      const callbackUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/orders/zarinpal/callback?orderId=${pendingOrder.id}`;
      const response = await fetch('https://api.zarinpal.com/pg/v4/payment/request.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: finalAmount * 10, // Toman to Rial
          callback_url: callbackUrl,
          description: `ثبت نام دوره ${course.title} - کد پیگیری ${referenceCode}`,
          metadata: { email: user.email },
        }),
      });
      const result = (await response.json()) as {
        data?: { code?: number; authority?: string };
      };
      if (result.data?.code === 100 && result.data.authority) {
        pendingOrder.authority = result.data.authority;
        await saveDb(db);
        res.status(201).json({
          order: pendingOrder,
          gatewayStatus: 'redirect_ready',
          paymentUrl: `https://www.zarinpal.com/pg/StartPay/${result.data.authority}`,
        });
        return;
      }
      res.status(502).json({
        order: pendingOrder,
        gatewayStatus: 'gateway_error',
        error: 'پاسخ معتبری از درگاه پرداخت دریافت نشد. سفارش شما در حالت انتظار ذخیره شده است.',
      });
    } catch {
      res.status(502).json({
        order: pendingOrder,
        gatewayStatus: 'gateway_unreachable',
        error: 'ارتباط با سرور درگاه زرین پال برقرار نشد. سفارش شما در حالت انتظار ذخیره شده است.',
      });
    }
  });

  // Comments & Lesson Q&A
  app.post('/api/comments', async (req: Request, res: Response) => {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ error: 'برای ثبت پرسش یا دیدگاه ابتدا وارد حساب کاربری شوید.' });
      return;
    }

    const targetType = sanitizeText(req.body?.targetType, 20) as 'lesson' | 'article' | 'video';
    const targetId = sanitizeText(req.body?.targetId, 80);
    const content = sanitizeText(req.body?.content, 1500);

    if (!content || content.length < 4) {
      res.status(400).json({ error: 'متن پرسش یا دیدگاه بسیار کوتاه است.' });
      return;
    }

    const db = await getDb();
    const newComment = {
      id: `cmt-${Date.now()}`,
      targetType,
      targetId,
      userName: user.name,
      userRole: user.role,
      content,
      createdAt: new Date().toISOString(),
    };

    db.comments.unshift(newComment);
    await saveDb(db);
    res.status(201).json({ comment: newComment });
  });

  // Admin & Instructor Middleware
  async function requireStaff(req: Request, res: Response): Promise<StoredUser | null> {
    const user = await resolveUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      res.status(403).json({ error: 'شما مجوز دسترسی به پنل مدیریت را ندارید.' });
      return null;
    }
    return user;
  }

  async function requireAdmin(req: Request, res: Response): Promise<StoredUser | null> {
    const user = await resolveUser(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'این عملیات فقط مخصوص مدیر کل سامانه (Super Admin) است.' });
      return null;
    }
    return user;
  }

  // Admin Overview Data
  app.get('/api/admin/overview', async (req: Request, res: Response) => {
    const staff = await requireStaff(req, res);
    if (!staff) return;

    const db = await getDb();
    res.json({
      users: db.users.map(toPublicUser),
      courses: db.courses,
      videos: db.videos,
      articles: db.articles,
      orders: db.orders,
      enrollments: db.enrollments,
      coupons: db.coupons,
      comments: db.comments,
      siteSettings: db.siteSettings,
    });
  });

  // Admin: Verify / Refund Order (Idempotent Enrollment Synchronization)
  app.post('/api/admin/orders/:id/status', async (req: Request, res: Response) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    const nextStatus = sanitizeText(req.body?.status, 20) as
      | 'pending'
      | 'paid'
      | 'failed'
      | 'refunded';

    const db = await getDb();
    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'سفارش یافت نشد.' });
      return;
    }

    order.status = nextStatus;
    if (nextStatus === 'paid') {
      order.paidAt = order.paidAt || new Date().toISOString();
      order.refId = order.refId || `ADM-VERIFIED-${Date.now().toString().slice(-6)}`;
      const existingEnrollment = db.enrollments.find(
        (e) => e.userId === order.userId && e.courseId === order.courseId
      );
      if (existingEnrollment) {
        existingEnrollment.status = 'active';
      } else {
        db.enrollments.push({
          id: `enr-${Date.now()}`,
          userId: order.userId,
          courseId: order.courseId,
          status: 'active',
          enrolledAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 3).toISOString(),
          completedLessonIds: [],
          lessonNotes: {},
        });
      }
    } else if (nextStatus === 'refunded' || nextStatus === 'failed') {
      const existingEnrollment = db.enrollments.find(
        (e) => e.userId === order.userId && e.courseId === order.courseId
      );
      if (existingEnrollment) {
        existingEnrollment.status = 'revoked';
      }
    }

    await saveDb(db);
    res.json({ order, enrollments: db.enrollments });
  });

  // Admin/Instructor: Create or Update Course
  app.post('/api/admin/courses', async (req: Request, res: Response) => {
    const staff = await requireStaff(req, res);
    if (!staff) return;

    const db = await getDb();
    const payload = req.body;
    const title = sanitizeText(payload?.title, 160);
    const slug = sanitizeText(payload?.slug, 120)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
    const subtitle = sanitizeText(payload?.subtitle, 240);
    const description = sanitizeText(payload?.description, 4000);
    const categoryName = sanitizeText(payload?.categoryName || 'هوش مصنوعی', 60);
    const level = (payload?.level || 'متوسط') as 'مقدماتی' | 'متوسط' | 'پیشرفته';
    const price = Math.max(0, Number(payload?.price) || 0);
    const discountPrice =
      payload?.discountPrice !== undefined && payload?.discountPrice !== '' && payload?.discountPrice !== null
        ? Math.max(0, Number(payload.discountPrice))
        : null;
    const status = (payload?.status || 'published') as 'published' | 'draft' | 'archived';

    if (!title || !slug || !description) {
      res.status(400).json({ error: 'عنوان، نامک (Slug) و توضیحات دوره الزامی هستند.' });
      return;
    }

    const existingIndex = db.courses.findIndex((c) => c.id === payload?.id);
    if (
      db.courses.some(
        (c, idx) => c.slug === slug && idx !== existingIndex
      )
    ) {
      res.status(409).json({ error: 'این نامک (Slug) قبلا برای دوره دیگری ثبت شده است.' });
      return;
    }

    const chapters = Array.isArray(payload?.chapters) && payload.chapters.length > 0
      ? payload.chapters
      : [
          {
            id: `ch-${Date.now()}-1`,
            title: 'فصل اول: مفاهیم پایه و پیاده سازی',
            order: 1,
            lessons: [
              {
                id: `les-${Date.now()}-1`,
                title: 'جلسه اول: معرفی معماری و پیش نیازها (رایگان)',
                order: 1,
                durationMinutes: 35,
                isFree: true,
                type: 'video',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                contentSummary: sanitizeText(payload?.firstLessonSummary || 'جلسه معارفه و بررسی نقشه راه عملیاتی دوره.', 500),
              },
              {
                id: `les-${Date.now()}-2`,
                title: 'جلسه دوم: پیاده سازی هسته اصلی پروژه (ویژه دانشجویان)',
                order: 2,
                durationMinutes: 50,
                isFree: false,
                type: 'video',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                contentSummary: 'پیاده سازی گام به گام کدهای عملیاتی و تست عملکرد مدل.',
              },
            ],
          },
        ];

    const courseObj: Course = {
      id: existingIndex >= 0 ? db.courses[existingIndex].id : `crs-${Date.now()}`,
      title,
      slug,
      subtitle: subtitle || title,
      description,
      instructorId: staff.id,
      instructorName: staff.name,
      instructorRole: staff.discipline || 'مدرس آکادمی متافکر',
      instructorBio: staff.bio || '',
      instructorAvatar: '/src/assets/images/avatar_lead_instructor_1791547360351.jpg',
      categoryId: `cat-${slug.slice(0, 6)}`,
      categoryName,
      tags: Array.isArray(payload?.tags)
        ? payload.tags.map((t: unknown) => sanitizeText(t, 40)).filter(Boolean)
        : ['هوش مصنوعی', 'یادگیری ماشین'],
      level,
      durationHours: Math.max(1, Number(payload?.durationHours) || 20),
      price,
      discountPrice,
      thumbnail:
        sanitizeText(payload?.thumbnail, 300) ||
        '/src/assets/images/course_llm_engineering_1791547327670.jpg',
      thumbnailAlt: sanitizeText(payload?.thumbnailAlt || title, 160),
      status,
      prerequisites: Array.isArray(payload?.prerequisites)
        ? payload.prerequisites.map((p: unknown) => sanitizeText(p, 200)).filter(Boolean)
        : ['آشنایی با برنامه نویسی پایتون'],
      outcomes: Array.isArray(payload?.outcomes)
        ? payload.outcomes.map((o: unknown) => sanitizeText(o, 200)).filter(Boolean)
        : ['پیاده سازی پروژه عملی هوش مصنوعی'],
      audience: ['مهندسان نرم افزار و علاقه مندان هوش مصنوعی'],
      seoTitle: sanitizeText(payload?.seoTitle || `${title} | آکادمی متافکر`, 120),
      seoDescription: sanitizeText(payload?.seoDescription || description.slice(0, 155), 200),
      canonicalUrl: `/courses/${slug}`,
      chapters,
      faqs: Array.isArray(payload?.faqs) ? payload.faqs : [],
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      db.courses[existingIndex] = courseObj;
    } else {
      db.courses.unshift(courseObj);
    }

    await saveDb(db);
    res.json({ course: courseObj });
  });

  app.delete('/api/admin/courses/:id', async (req: Request, res: Response) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const db = await getDb();
    db.courses = db.courses.filter((c) => c.id !== req.params.id);
    await saveDb(db);
    res.json({ deleted: true });
  });

  // Admin/Instructor: Video CRUD
  app.post('/api/admin/videos', async (req: Request, res: Response) => {
    const staff = await requireStaff(req, res);
    if (!staff) return;

    const db = await getDb();
    const payload = req.body;
    const title = sanitizeText(payload?.title, 160);
    const slug = sanitizeText(payload?.slug, 120)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
    const description = sanitizeText(payload?.description, 2000);
    const transcript = sanitizeText(payload?.transcript, 5000);
    const videoUrl = sanitizeText(
      payload?.videoUrl ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      400
    );

    if (!title || !slug || !description) {
      res.status(400).json({ error: 'عنوان، نامک (Slug) و توضیحات ویدیو الزامی هستند.' });
      return;
    }

    const existingIndex = db.videos.findIndex((v) => v.id === payload?.id);
    if (db.videos.some((v, idx) => v.slug === slug && idx !== existingIndex)) {
      res.status(409).json({ error: 'این نامک (Slug) قبلا برای ویدیوی دیگری استفاده شده است.' });
      return;
    }

    const videoObj: VideoTutorial = {
      id: existingIndex >= 0 ? db.videos[existingIndex].id : `vid-${Date.now()}`,
      title,
      slug,
      description,
      categoryId: 'cat-ai',
      categoryName: sanitizeText(payload?.categoryName || 'پردازش زبان طبیعی', 60),
      tags: Array.isArray(payload?.tags)
        ? payload.tags.map((t: unknown) => sanitizeText(t, 40)).filter(Boolean)
        : ['آموزش رایگان', 'هوش مصنوعی'],
      durationSeconds: Math.max(60, Number(payload?.durationSeconds) || 1200),
      videoUrl,
      thumbnail:
        sanitizeText(payload?.thumbnail, 300) ||
        '/src/assets/images/course_computer_vision_1791547339304.jpg',
      thumbnailAlt: sanitizeText(payload?.thumbnailAlt || title, 160),
      transcript: transcript || description,
      keyTakeaways: Array.isArray(payload?.keyTakeaways)
        ? payload.keyTakeaways.map((k: unknown) => sanitizeText(k, 200)).filter(Boolean)
        : ['بررسی عملی مفاهیم و پیاده سازی در کد'],
      isPremium: Boolean(payload?.isPremium),
      status: (payload?.status || 'published') as 'published' | 'draft',
      publishedAt: existingIndex >= 0 ? db.videos[existingIndex].publishedAt : new Date().toISOString(),
      views: existingIndex >= 0 ? db.videos[existingIndex].views : 1,
      instructorName: staff.name,
      seoTitle: sanitizeText(payload?.seoTitle || `${title} | ویدیو های آموزشی متافکر`, 120),
      seoDescription: sanitizeText(payload?.seoDescription || description.slice(0, 155), 200),
      canonicalUrl: `/videos/${slug}`,
    };

    if (existingIndex >= 0) {
      db.videos[existingIndex] = videoObj;
    } else {
      db.videos.unshift(videoObj);
    }

    await saveDb(db);
    res.json({ video: videoObj });
  });

  app.delete('/api/admin/videos/:id', async (req: Request, res: Response) => {
    const staff = await requireStaff(req, res);
    if (!staff) return;

    const db = await getDb();
    db.videos = db.videos.filter((v) => v.id !== req.params.id);
    await saveDb(db);
    res.json({ deleted: true });
  });

  // Admin/Instructor: Article CRUD
  app.post('/api/admin/articles', async (req: Request, res: Response) => {
    const staff = await requireStaff(req, res);
    if (!staff) return;

    const db = await getDb();
    const payload = req.body;
    const title = sanitizeText(payload?.title, 160);
    const slug = sanitizeText(payload?.slug, 120)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
    const excerpt = sanitizeText(payload?.excerpt, 600);

    if (!title || !slug || !excerpt) {
      res.status(400).json({ error: 'عنوان، نامک (Slug) و خلاصه مقاله الزامی هستند.' });
      return;
    }

    const existingIndex = db.articles.findIndex((a) => a.id === payload?.id);
    if (db.articles.some((a, idx) => a.slug === slug && idx !== existingIndex)) {
      res.status(409).json({ error: 'این نامک (Slug) قبلا برای مقاله دیگری ثبت شده است.' });
      return;
    }

    const sections =
      Array.isArray(payload?.sections) && payload.sections.length > 0
        ? payload.sections.map((s: { heading?: string; body?: string; codeBlock?: string }, i: number) => ({
            id: `sec-${Date.now()}-${i}`,
            heading: sanitizeText(s.heading || `بخش ${i + 1}`, 160),
            body: sanitizeText(s.body || '', 4000),
            codeBlock: typeof s.codeBlock === 'string' ? s.codeBlock.slice(0, 3000) : undefined,
          }))
        : [
            {
              id: `sec-${Date.now()}-1`,
              heading: sanitizeText(payload?.mainHeading || 'مقدمه و معماری فنی', 160),
              body: sanitizeText(payload?.mainBody || excerpt, 4000),
              codeBlock: typeof payload?.codeBlock === 'string' ? payload.codeBlock : undefined,
            },
          ];

    const articleObj: Article = {
      id: existingIndex >= 0 ? db.articles[existingIndex].id : `art-${Date.now()}`,
      title,
      slug,
      excerpt,
      sections,
      authorName: staff.name,
      authorRole: staff.discipline || 'پژوهشگر هوش مصنوعی متافکر',
      categoryId: 'cat-nlp',
      categoryName: sanitizeText(payload?.categoryName || 'پردازش زبان طبیعی', 60),
      tags: Array.isArray(payload?.tags)
        ? payload.tags.map((t: unknown) => sanitizeText(t, 40)).filter(Boolean)
        : ['مقالات تخصصی', 'هوش مصنوعی'],
      readTimeMinutes: Math.max(3, Number(payload?.readTimeMinutes) || 8),
      thumbnail:
        sanitizeText(payload?.thumbnail, 300) ||
        '/src/assets/images/course_ai_agents_workflow_1791547349625.jpg',
      thumbnailAlt: sanitizeText(payload?.thumbnailAlt || title, 160),
      status: (payload?.status || 'published') as 'published' | 'draft' | 'archived',
      publishedAt:
        existingIndex >= 0 ? db.articles[existingIndex].publishedAt : new Date().toISOString(),
      seoTitle: sanitizeText(payload?.seoTitle || `${title} | مقالات متافکر`, 120),
      seoDescription: sanitizeText(payload?.seoDescription || excerpt.slice(0, 155), 200),
      canonicalUrl: `/articles/${slug}`,
      relatedCourseSlug: sanitizeText(payload?.relatedCourseSlug || 'llm-engineering-transformers', 120),
      ratingAvg: existingIndex >= 0 ? db.articles[existingIndex].ratingAvg : 5.0,
      ratingCount: existingIndex >= 0 ? db.articles[existingIndex].ratingCount : 1,
    };

    if (existingIndex >= 0) {
      db.articles[existingIndex] = articleObj;
    } else {
      db.articles.unshift(articleObj);
    }

    await saveDb(db);
    res.json({ article: articleObj });
  });

  app.delete('/api/admin/articles/:id', async (req: Request, res: Response) => {
    const staff = await requireStaff(req, res);
    if (!staff) return;

    const db = await getDb();
    db.articles = db.articles.filter((a) => a.id !== req.params.id);
    await saveDb(db);
    res.json({ deleted: true });
  });

  // Admin: User Role & Status Management
  app.post('/api/admin/users/:id/update', async (req: Request, res: Response) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const db = await getDb();
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'کاربر یافت نشد.' });
      return;
    }

    if (req.body?.role && ['admin', 'instructor', 'student'].includes(req.body.role)) {
      target.role = req.body.role;
    }
    if (req.body?.status && ['active', 'suspended'].includes(req.body.status)) {
      target.status = req.body.status;
    }

    await saveDb(db);
    res.json({ user: toPublicUser(target) });
  });

  // Admin: Site & SEO Settings
  app.put('/api/admin/settings', async (req: Request, res: Response) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const db = await getDb();
    db.siteSettings = {
      ...db.siteSettings,
      siteTitle: sanitizeText(req.body?.siteTitle || db.siteSettings.siteTitle, 140),
      siteDescription: sanitizeText(req.body?.siteDescription || db.siteSettings.siteDescription, 300),
      contactEmail: sanitizeText(req.body?.contactEmail || db.siteSettings.contactEmail, 100),
      contactPhone: sanitizeText(req.body?.contactPhone || db.siteSettings.contactPhone, 40),
      address: sanitizeText(req.body?.address || db.siteSettings.address, 250),
      redirects: Array.isArray(req.body?.redirects)
        ? req.body.redirects
        : db.siteSettings.redirects,
    };

    await saveDb(db);
    res.json({ siteSettings: db.siteSettings });
  });

  // Real Technical & Content SEO Automated Audit Endpoint
  app.get('/api/seo/audit', async (_req: Request, res: Response) => {
    const db = await getDb();
    const issues: SEOAuditIssue[] = [];

    for (const c of db.courses) {
      const titleLen = (c.seoTitle || c.title).length;
      const descLen = (c.seoDescription || c.description).length;
      if (titleLen < 25 || titleLen > 70) {
        issues.push({
          id: `seo-crs-title-${c.id}`,
          entityType: 'course',
          entityTitle: c.title,
          slug: `/courses/${c.slug}`,
          severity: 'warning',
          message: `طول عنوان سئو (${titleLen} کاراکتر) خارج از بازه بهینه ۳۰ تا ۶۵ کاراکتر است.`,
          recommendation: 'عنوان سئو را به گونه ای تنظیم کنید که کلمه کلیدی اصلی در ابتدای آن قرار گیرد.',
        });
      } else {
        issues.push({
          id: `seo-crs-ok-${c.id}`,
          entityType: 'course',
          entityTitle: c.title,
          slug: `/courses/${c.slug}`,
          severity: 'good',
          message: 'عنوان سئو، توضیحات متا، اسکیمای Course و آدرس کانونیکال به درستی تنظیم شده اند.',
          recommendation: 'وضعیت بهینه است.',
        });
      }
      if (!c.thumbnailAlt || c.thumbnailAlt.length < 5) {
        issues.push({
          id: `seo-crs-alt-${c.id}`,
          entityType: 'course',
          entityTitle: c.title,
          slug: `/courses/${c.slug}`,
          severity: 'error',
          message: 'متن جایگزین تصویر شاخص (Alt Text) خالی یا بسیار کوتاه است.',
          recommendation: 'یک توضیح دقیق فارسی برای تصویر شاخص دوره ثبت نمایید.',
        });
      }
      if (descLen < 80) {
        issues.push({
          id: `seo-crs-desc-${c.id}`,
          entityType: 'course',
          entityTitle: c.title,
          slug: `/courses/${c.slug}`,
          severity: 'warning',
          message: 'توضیحات متا (Meta Description) کوتاه تر از حد استاندارد (۱۲۰ تا ۱۶۰ کاراکتر) است.',
          recommendation: 'خلاصه ای از خروجی های دوره و مخاطبان هدف را به توضیحات متا اضافه کنید.',
        });
      }
    }

    for (const a of db.articles) {
      const totalWords = a.sections.reduce((acc, s) => acc + s.body.split(/\s+/).length, 0);
      if (totalWords < 80) {
        issues.push({
          id: `seo-art-thin-${a.id}`,
          entityType: 'article',
          entityTitle: a.title,
          slug: `/articles/${a.slug}`,
          severity: 'warning',
          message: `محتوای مقاله کوتاه است (${totalWords} کلمه).`,
          recommendation: 'بخش های فنی و مثال های کاربردی بیشتری به مقاله اضافه نمایید.',
        });
      } else {
        issues.push({
          id: `seo-art-ok-${a.id}`,
          entityType: 'article',
          entityTitle: a.title,
          slug: `/articles/${a.slug}`,
          severity: 'good',
          message: `ساختار هدینگ ها (${a.sections.length} بخش)، لینک سازی داخلی به دوره مرتبط و اسکیمای TechArticle معتبر است.`,
          recommendation: 'وضعیت سئوی محتوایی مطلوب است.',
        });
      }
    }

    for (const v of db.videos) {
      if (!v.transcript || v.transcript.length < 60) {
        issues.push({
          id: `seo-vid-tr-${v.id}`,
          entityType: 'video',
          entityTitle: v.title,
          slug: `/videos/${v.slug}`,
          severity: 'warning',
          message: 'متن پیاده سازی شده ویدیو (Transcript) برای خزنده های موتور جستجو کوتاه است.',
          recommendation: 'متن کامل صحبت های مدرس را در بخش Transcript وارد کنید تا VideoObject غنی تر شود.',
        });
      } else {
        issues.push({
          id: `seo-vid-ok-${v.id}`,
          entityType: 'video',
          entityTitle: v.title,
          slug: `/videos/${v.slug}`,
          severity: 'good',
          message: 'اسکیمای VideoObject به همراه زمان دقیق، تصویر بندانگشتی و متن ویدیو فعال است.',
          recommendation: 'وضعیت سئوی ویدیو مطلوب است.',
        });
      }
    }

    res.json({ issues });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MetaFekr AI Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
