export type UserRole = 'admin' | 'instructor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  discipline?: string;
  rollNumber?: string;
  bio?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface LessonResource {
  id: string;
  title: string;
  fileType: 'PDF' | 'CODE' | 'DATASET';
  sizeLabel: string;
  downloadUrl: string;
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  durationMinutes: number;
  isFree: boolean;
  type: 'video' | 'article' | 'lab';
  videoUrl?: string;
  signedStreamUrl?: string;
  previewSeconds?: number;
  contentSummary: string;
  codeSnippet?: string;
  resources?: LessonResource[];
  isLocked?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface CourseFAQ {
  question: string;
  answer: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  instructorId: string;
  instructorName: string;
  instructorRole: string;
  instructorBio: string;
  instructorAvatar: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  level: 'مقدماتی' | 'متوسط' | 'پیشرفته';
  durationHours: number;
  price: number;
  discountPrice: number | null;
  thumbnail: string;
  thumbnailAlt: string;
  status: 'published' | 'draft' | 'archived';
  prerequisites: string[];
  outcomes: string[];
  audience: string[];
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  chapters: Chapter[];
  faqs: CourseFAQ[];
  updatedAt: string;
}

export interface VideoTutorial {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  durationSeconds: number;
  videoUrl: string;
  thumbnail: string;
  thumbnailAlt: string;
  transcript: string;
  keyTakeaways: string[];
  isPremium: boolean;
  status: 'published' | 'draft';
  publishedAt: string;
  views: number;
  instructorName: string;
  relatedCourseSlug?: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
}

export interface ArticleSection {
  id: string;
  heading: string;
  body: string;
  codeBlock?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  sections: ArticleSection[];
  authorName: string;
  authorRole: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  readTimeMinutes: number;
  thumbnail: string;
  thumbnailAlt: string;
  status: 'published' | 'draft' | 'archived';
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  relatedCourseSlug?: string;
  relatedVideoSlug?: string;
  ratingAvg: number;
  ratingCount: number;
}

export interface PortfolioProject {
  id: string;
  title: string;
  slug: string;
  studentName: string;
  rollNumber: string;
  cohort: string;
  discipline: string;
  summary: string;
  problemStatement: string;
  architectureDetails: string;
  outcomeMetric: string;
  technologies: string[];
  thumbnail: string;
  thumbnailAlt: string;
  colSpan: 1 | 2;
  relatedCourseSlug: string;
  interactiveDemoConfig: {
    inputPrompt: string;
    modelName: string;
    tokenLatencyMs: number;
    accuracyScore: string;
    sampleOutput: string;
  };
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'revoked' | 'expired';
  enrolledAt: string;
  expiresAt: string;
  completedLessonIds: string[];
  lastWatchedLessonId?: string;
  lessonNotes: Record<string, string>;
}

export interface Order {
  id: string;
  referenceCode: string;
  userId: string;
  userEmail: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string;
  gateway: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  authority?: string;
  refId?: string;
  createdAt: string;
  paidAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt: string;
}

export interface CommentItem {
  id: string;
  targetType: 'lesson' | 'article' | 'video';
  targetId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: string;
  answer?: string;
}

export interface RedirectRule {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302;
}

export interface SEOAuditIssue {
  id: string;
  entityType: 'course' | 'article' | 'video' | 'site';
  entityTitle: string;
  slug: string;
  severity: 'good' | 'warning' | 'error';
  message: string;
  recommendation: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  zarinpalMerchantConfigured: boolean;
  defaultCanonicalBase: string;
  redirects: RedirectRule[];
}
