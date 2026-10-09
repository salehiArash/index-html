import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Download,
  FileText,
  HelpCircle,
  Lock,
  MessageSquare,
  PlayCircle,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import {
  CommentItem,
  Course,
  Enrollment,
  Lesson,
  LessonResource,
  User,
} from '../types/metafekr';
import { buildCourseSchema, updatePageSEO } from '../utils/seo';
import { EducationalVideoPlayer } from './EducationalVideoPlayer';
import { SmartImage } from './SmartImage';

interface CourseDetailViewProps {
  course: Course;
  user: User | null;
  token: string | null;
  enrollment?: Enrollment;
  comments: CommentItem[];
  onBack: () => void;
  onRequireAuth: () => void;
  onRefreshData: () => Promise<void>;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  course,
  user,
  token,
  enrollment,
  comments,
  onBack,
  onRequireAuth,
  onRefreshData,
}) => {
  const allLessons = useMemo(
    () => course.chapters.flatMap((ch) => ch.lessons),
    [course.chapters]
  );

  const initialLesson = useMemo(() => {
    if (enrollment?.lastWatchedLessonId) {
      const found = allLessons.find((l) => l.id === enrollment.lastWatchedLessonId);
      if (found) return found;
    }
    return allLessons[0];
  }, [allLessons, enrollment?.lastWatchedLessonId]);

  const [selectedLessonId, setSelectedLessonId] = useState<string>(initialLesson?.id || '');
  const selectedLesson: Lesson | undefined = useMemo(
    () => allLessons.find((l) => l.id === selectedLessonId) || allLessons[0],
    [allLessons, selectedLessonId]
  );

  // Note state
  const [noteInput, setNoteInput] = useState<string>('');
  const [noteStatus, setNoteStatus] = useState<string>('');

  // Coupon & Checkout state
  const [couponCode, setCouponCode] = useState<string>('');
  const [validatedDiscount, setValidatedDiscount] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [couponMessage, setCouponMessage] = useState<string>('');
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [checkoutFeedback, setCheckoutFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Resource download preview state
  const [downloadedResource, setDownloadedResource] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [resourceError, setResourceError] = useState<string>('');

  // Lesson Q&A state
  const [questionText, setQuestionText] = useState<string>('');
  const [questionSubmitting, setQuestionSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const origin = window.location.origin;
    updatePageSEO({
      title: course.seoTitle || course.title,
      description: course.seoDescription || course.description,
      canonicalPath: `/courses/${course.slug}`,
      ogType: 'website',
      jsonLd: buildCourseSchema(course, origin),
    });
  }, [course]);

  useEffect(() => {
    if (selectedLesson && enrollment?.lessonNotes) {
      setNoteInput(enrollment.lessonNotes[selectedLesson.id] || '');
    } else {
      setNoteInput('');
    }
    setNoteStatus('');
    setDownloadedResource(null);
    setResourceError('');
  }, [selectedLesson, enrollment]);

  const totalLessonsCount = allLessons.length;
  const freeLessonsCount = allLessons.filter((l) => l.isFree).length;
  const completedCount = enrollment?.completedLessonIds.length || 0;
  const progressPercent =
    totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

  const isEnrolledOrStaff =
    Boolean(enrollment && enrollment.status === 'active') ||
    user?.role === 'admin' ||
    user?.id === course.instructorId;

  const basePrice = course.discountPrice !== null ? course.discountPrice : course.price;
  const finalPayable = validatedDiscount ? validatedDiscount.finalAmount : basePrice;

  const lessonComments = useMemo(
    () =>
      comments.filter(
        (c) => c.targetType === 'lesson' && c.targetId === selectedLesson?.id
      ),
    [comments, selectedLesson?.id]
  );

  const handleValidateCoupon = async (codeToApply?: string) => {
    const targetCode = (codeToApply ?? couponCode).trim().toUpperCase();
    if (!targetCode) return;
    setCouponCode(targetCode);
    setCouponMessage('در حال بررسی کد تخفیف...');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: targetCode, courseId: course.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setValidatedDiscount(null);
        setCouponMessage(data.error || 'کد تخفیف معتبر نیست.');
        return;
      }
      setValidatedDiscount({
        code: data.coupon.code,
        discountPercent: data.coupon.discountPercent,
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
      });
      setCouponMessage(
        `کد تخفیف ${data.coupon.discountPercent} درصدی با موفقیت اعمال شد.`
      );
    } catch {
      setCouponMessage('خطا در ارتباط با سرور.');
    }
  };

  const handleCheckout = async () => {
    if (!user || !token) {
      onRequireAuth();
      return;
    }
    setCheckoutLoading(true);
    setCheckoutFeedback(null);
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: course.id,
          couponCode: validatedDiscount?.code || couponCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutFeedback({
          type: 'error',
          text: data.error || 'خطا در ثبت سفارش.',
        });
      } else if (
        data.gatewayStatus === 'completed_free' ||
        data.gatewayStatus === 'completed_sandbox'
      ) {
        setCheckoutFeedback({
          type: 'success',
          text: data.message,
        });
        await onRefreshData();
      } else if (data.gatewayStatus === 'redirect_ready' && data.paymentUrl) {
        setCheckoutFeedback({
          type: 'info',
          text: `در حال انتقال به درگاه پرداخت زرین پال... (کد پیگیری: ${data.order.referenceCode})`,
        });
      } else {
        setCheckoutFeedback({
          type: 'info',
          text: `${data.message} (شماره سفارش: ${data.order?.referenceCode})`,
        });
        await onRefreshData();
      }
    } catch {
      setCheckoutFeedback({
        type: 'error',
        text: 'خطا در برقراری ارتباط با سرور پرداخت.',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleToggleComplete = async (lessonId: string) => {
    if (!user || !token) {
      onRequireAuth();
      return;
    }
    const currentlyCompleted = enrollment?.completedLessonIds.includes(lessonId) || false;
    try {
      const res = await fetch('/api/enrollments/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: course.id,
          lessonId,
          completed: !currentlyCompleted,
        }),
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch {
      // ignore
    }
  };

  const handleSaveNote = async () => {
    if (!user || !token || !selectedLesson) {
      onRequireAuth();
      return;
    }
    setNoteStatus('در حال ذخیره یادداشت...');
    try {
      const res = await fetch('/api/enrollments/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: course.id,
          lessonId: selectedLesson.id,
          noteText: noteInput,
        }),
      });
      if (res.ok) {
        setNoteStatus('یادداشت شما در فضای ابری ذخیره شد.');
        await onRefreshData();
      } else {
        const data = await res.json();
        setNoteStatus(data.error || 'خطا در ذخیره یادداشت.');
      }
    } catch {
      setNoteStatus('خطا در ذخیره یادداشت.');
    }
  };

  const handleDownloadResource = async (resItem: LessonResource) => {
    setResourceError('');
    try {
      const response = await fetch(`/api/resources/${resItem.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) {
        setResourceError(data.error || 'دسترسی به این فایل مجاز نیست.');
        return;
      }
      setDownloadedResource({
        title: resItem.title,
        content: data.contentPreview,
      });
    } catch {
      setResourceError('خطا در دریافت فایل پیوست.');
    }
  };

  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token || !selectedLesson) {
      onRequireAuth();
      return;
    }
    if (!questionText.trim()) return;
    setQuestionSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetType: 'lesson',
          targetId: selectedLesson.id,
          content: questionText,
        }),
      });
      if (res.ok) {
        setQuestionText('');
        await onRefreshData();
      }
    } finally {
      setQuestionSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-10">
      {/* Breadcrumb Navigation */}
      <nav aria-label="مسیر صفحه" className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-800 font-medium cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به فهرست دوره ها</span>
        </button>
        <span aria-hidden="true">/</span>
        <span>{course.categoryName}</span>
        <span aria-hidden="true">/</span>
        <span className="text-slate-900 font-semibold truncate max-w-md">{course.title}</span>
      </nav>

      {/* Course Header Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            {/* Unboxed Metadata Discipline */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3 tabular-nums">
              <span className="font-semibold text-blue-800">{course.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>سطح {course.level}</span>
              <span aria-hidden="true">·</span>
              <span>{course.durationHours} ساعت آموزش ویدیویی و پروژه</span>
              <span aria-hidden="true">·</span>
              <span>
                {totalLessonsCount} جلسه ({freeLessonsCount} جلسه اول رایگان)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              {course.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
              {course.subtitle}
            </p>

            {/* Instructor & Access Status */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <SmartImage
                  src={course.instructorAvatar}
                  alt={course.instructorName}
                  className="w-11 h-11 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">{course.instructorName}</p>
                  <p className="text-xs text-slate-500">{course.instructorRole}</p>
                </div>
              </div>

              {enrollment && (
                <div className="flex-1 min-w-[220px] max-w-sm">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5 tabular-nums">
                    <span>پیشرفت شما در دوره</span>
                    <span>
                      {completedCount} از {totalLessonsCount} جلسه ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full bg-emerald-600 transition-all duration-200"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-xl overflow-hidden border border-slate-200 aspect-4/3">
              <SmartImage
                src={course.thumbnail}
                alt={course.thumbnailAlt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Classroom Grid: Video/Lesson Player (8 cols) + Chapter Syllabus & Enrollment (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Main Column: Active Lesson Player & Content */}
        <div className="lg:col-span-8 space-y-8">
          {selectedLesson && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Lesson Status Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  {selectedLesson.isLocked ? (
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Unlock className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <h2 className="text-sm sm:text-base font-bold">
                    جلسه {selectedLesson.order}: {selectedLesson.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 tabular-nums">
                  <span>{selectedLesson.durationMinutes} دقیقه</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {selectedLesson.isFree
                      ? 'پیش نمایش رایگان برای عموم'
                      : selectedLesson.isLocked
                      ? 'قفل شده (ویژه دانشجویان دوره)'
                      : 'دسترسی کامل دانشجو فعال'}
                  </span>
                </div>
              </div>

              {/* Video Player or Locked State */}
              {!selectedLesson.isLocked ? (
                <div>
                  <EducationalVideoPlayer
                    src={selectedLesson.signedStreamUrl || selectedLesson.videoUrl}
                    poster={course.thumbnail}
                    title={selectedLesson.title}
                    summary={selectedLesson.contentSummary}
                    codeSnippet={selectedLesson.codeSnippet}
                    durationMinutes={selectedLesson.durationMinutes}
                  />

                  {/* Lesson Action Bar */}
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        استریم امن با لینک امضاشده سرور (HMAC-SHA256 Signed URL)
                      </span>
                    </div>

                    {isEnrolledOrStaff && (
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(selectedLesson.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          enrollment?.completedLessonIds.includes(selectedLesson.id)
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {enrollment?.completedLessonIds.includes(selectedLesson.id)
                            ? 'این جلسه تکمیل شده است'
                            : 'ثبت به عنوان مشاهده شده'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Lesson Summary, Code Block, Resources & Notes */}
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-2">
                        شرح فنی و نکات کلیدی این جلسه
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {selectedLesson.contentSummary}
                      </p>
                    </div>

                    {selectedLesson.codeSnippet && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Code2 className="w-4 h-4 text-blue-800" />
                            <span>قطعه کد پیاده سازی جلسه (Python / PyTorch)</span>
                          </span>
                        </div>
                        <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                          <code>{selectedLesson.codeSnippet}</code>
                        </pre>
                      </div>
                    )}

                    {/* Downloadable Resources */}
                    {selectedLesson.resources && selectedLesson.resources.length > 0 && (
                      <div className="pt-4 border-t border-slate-200">
                        <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-800" />
                          <span>فایل های پیوست، جزوات و کدهای تمرینی این جلسه</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedLesson.resources.map((resItem) => (
                            <button
                              key={resItem.id}
                              type="button"
                              onClick={() => handleDownloadResource(resItem)}
                              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-700 hover:bg-blue-50/40 transition-colors text-right cursor-pointer"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-900">
                                  {resItem.title}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                                  نوع فایل: {resItem.fileType} · حجم: {resItem.sizeLabel}
                                </p>
                              </div>
                              <Download className="w-4 h-4 text-blue-800 shrink-0" />
                            </button>
                          ))}
                        </div>

                        {resourceError && (
                          <p className="text-xs text-red-600 mt-2">{resourceError}</p>
                        )}

                        {downloadedResource && (
                          <div className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-emerald-400">
                                فایل بازگشایی شده: {downloadedResource.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => setDownloadedResource(null)}
                                className="text-xs text-slate-400 hover:text-white cursor-pointer"
                              >
                                بستن
                              </button>
                            </div>
                            <pre className="text-xs font-mono overflow-x-auto text-slate-300">
                              {downloadedResource.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Student Note-Taking during playback */}
                    <div className="pt-4 border-t border-slate-200">
                      <label
                        htmlFor="lesson-note"
                        className="block text-xs font-bold text-slate-900 mb-2"
                      >
                        یادداشت های شخصی شما در این جلسه:
                      </label>
                      <textarea
                        id="lesson-note"
                        rows={3}
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="نکات مهم یا زمان های کلیدی ویدیو را اینجا بنویسید..."
                        className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-2 focus:outline-blue-800"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500">{noteStatus}</span>
                        <button
                          type="button"
                          onClick={handleSaveNote}
                          className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          ذخیره یادداشت در حساب کاربری
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Locked Lesson Screen (Freemium Protection Enforced by Server) */
                <div className="p-8 sm:p-10 bg-slate-900 text-white">
                  <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold mb-3">
                      <Lock className="w-4 h-4" />
                      <span>محتوای تخصصی قفل شده در سمت سرور (پیش نمایش ۳۰ ثانیه ای)</span>
                    </div>
                    <h3 className="text-xl font-extrabold mb-3">
                      برای مشاهده کامل «{selectedLesson.title}» در دوره ثبت نام کنید
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-6">
                      خلاصه این جلسه: {selectedLesson.contentSummary}
                    </p>
                    <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-200 space-y-2 mb-6">
                      <p className="font-bold text-white">
                        راهنمای تست فوری دسترسی برای ارزیابان:
                      </p>
                      <p>
                        ۱. می توانید در کادر ثبت نام سمت چپ از کد تخفیف بورسیه ۱۰۰ درصدی{' '}
                        <code className="font-mono text-amber-300 px-1.5 py-0.5 bg-slate-950 rounded">
                          GRANT100
                        </code>{' '}
                        استفاده کنید تا سفارش شما به صورت آنی تایید شده و قفل تمامی جلسات باز شود.
                      </p>
                      <p>
                        ۲. یا از دکمه ورود در بالای صفحه به نقش «مدیر کل (Admin)» سوییچ کنید.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleValidateCoupon('GRANT100')}
                        className="px-4 py-2.5 text-xs font-semibold bg-[#EA580C] hover:bg-orange-700 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        اعمال خودکار کد بورسیه GRANT100
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedLessonId(allLessons[0]?.id || '')}
                        className="px-4 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
                      >
                        مشاهده جلسات رایگان ابتدایی
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Course Details: Description, Prerequisites, Learning Outcomes & FAQs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-8">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-3">
                معرفی جامع و اهداف آموزشی دوره
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{course.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">
                  دستاوردها و مهارت های خروجی دوره
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {course.outcomes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">
                  پیش نیازهای علمی و فنی
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {course.prerequisites.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* FAQs Section (Matches Schema.org FAQPage) */}
            {course.faqs && course.faqs.length > 0 && (
              <div className="pt-6 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-800" />
                  <span>پرسش های متداول درباره این دوره</span>
                </h4>
                <div className="space-y-3">
                  {course.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <p className="text-xs font-bold text-slate-900 mb-1.5">{faq.question}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lesson Q&A System */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-800" />
              <span>پرسش و پاسخ علمی این جلسه ({lessonComments.length})</span>
            </h3>

            <form onSubmit={handlePostQuestion} className="mb-6 space-y-3">
              <textarea
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="پرسش فنی یا دیدگاه خود را درباره مطالب این جلسه مطرح کنید..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-2 focus:outline-blue-800"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={questionSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-[#1E40AF] hover:bg-blue-900 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {questionSubmitting ? 'در حال ارسال...' : 'ثبت پرسش در جلسه'}
                </button>
              </div>
            </form>

            {lessonComments.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl border border-slate-200">
                هنوز پرسشی برای این جلسه ثبت نشده است. اولین نفری باشید که سوال خود را مطرح می کند.
              </p>
            ) : (
              <div className="space-y-4">
                {lessonComments.map((cmt) => (
                  <div
                    key={cmt.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-slate-900">{cmt.userName}</span>
                      <span className="tabular-nums">
                        {new Date(cmt.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{cmt.content}</p>
                    {cmt.answer && (
                      <div className="mt-3 pt-3 border-t border-slate-200 bg-white p-3 rounded-lg">
                        <p className="text-[11px] font-bold text-blue-800 mb-1">
                          پاسخ مدرس دوره:
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed">{cmt.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Enrollment / Checkout Card & Chapter Syllabus */}
        <div className="lg:col-span-4 space-y-6">
          {/* Enrollment & Server-Side Checkout Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {isEnrolledOrStaff ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>شما به تمامی جلسات این دوره دسترسی کامل دارید</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تمامی ویدیوها، کدهای منبع و فایل های پیوست این دوره برای حساب کاربری شما باز هستند.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">
                    شهریه ثبت نام و دسترسی دائمی به دوره:
                  </span>
                  <div className="flex items-baseline gap-3 tabular-nums">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {finalPayable.toLocaleString('fa-IR')} تومان
                    </span>
                    {course.discountPrice !== null && (
                      <span className="text-xs text-slate-400 line-through">
                        {course.price.toLocaleString('fa-IR')} تومان
                      </span>
                    )}
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="pt-4 border-t border-slate-100">
                  <label
                    htmlFor="coupon-input"
                    className="block text-xs font-semibold text-slate-700 mb-2"
                  >
                    کد تخفیف یا بورسیه (مانند METAFEKR20 یا GRANT100):
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="coupon-input"
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="کد تخفیف..."
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono uppercase text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleValidateCoupon()}
                      className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 transition-colors cursor-pointer shrink-0"
                    >
                      بررسی کد
                    </button>
                  </div>
                  {couponMessage && (
                    <p className="text-[11px] text-blue-800 mt-1.5">{couponMessage}</p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={checkoutLoading}
                  onClick={handleCheckout}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#EA580C] hover:bg-orange-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {checkoutLoading
                    ? 'در حال ثبت سفارش در سرور...'
                    : finalPayable === 0
                    ? 'تکمیل ثبت نام رایگان با کد بورسیه'
                    : 'ثبت سفارش و نام نویسی در دوره'}
                </button>

                {checkoutFeedback && (
                  <div
                    className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                      checkoutFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : checkoutFeedback.type === 'error'
                        ? 'bg-red-50 text-red-900 border-red-200'
                        : 'bg-blue-50 text-blue-900 border-blue-200'
                    }`}
                  >
                    {checkoutFeedback.text}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Course Chapters & Lessons Syllabus (Freemium Structure) */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                سرفصل ها و جلسات دوره
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {freeLessonsCount} جلسه اول رایگان
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {course.chapters.map((chapter) => (
                <div key={chapter.id} className="p-4">
                  <h4 className="text-xs font-bold text-slate-900 mb-3">
                    {chapter.title}
                  </h4>
                  <div className="space-y-1.5">
                    {chapter.lessons.map((lesson) => {
                      const isSelected = selectedLesson?.id === lesson.id;
                      const isDone = enrollment?.completedLessonIds.includes(lesson.id);
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className={`w-full text-right p-3 rounded-xl border transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-800 text-slate-950'
                              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : lesson.isLocked ? (
                              <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold leading-snug">
                                {lesson.order}. {lesson.title}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 tabular-nums">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {lesson.durationMinutes} دقیقه
                                </span>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={
                                    lesson.isFree
                                      ? 'text-emerald-700 font-semibold'
                                      : lesson.isLocked
                                      ? 'text-slate-500'
                                      : 'text-blue-800 font-semibold'
                                  }
                                >
                                  {lesson.isFree
                                    ? 'رایگان'
                                    : lesson.isLocked
                                    ? 'قفل شده'
                                    : 'باز شده'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
