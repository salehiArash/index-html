import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Globe,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import {
  Article,
  Course,
  Enrollment,
  Order,
  SEOAuditIssue,
  SiteSettings,
  User,
  VideoTutorial,
} from '../types/metafekr';

interface AdminAndUserWorkspaceProps {
  user: User;
  token: string;
  courses: Course[];
  videos: VideoTutorial[];
  articles: Article[];
  enrollments: Enrollment[];
  orders: Order[];
  siteSettings: SiteSettings;
  onOpenCourse: (slug: string) => void;
  onQuickSwitchRole: (role: 'student' | 'instructor' | 'admin') => Promise<void>;
  onLogout: () => void;
  onRefreshData: () => Promise<void>;
}

type AdminSubTab =
  | 'my_learning'
  | 'courses_crud'
  | 'videos_crud'
  | 'articles_crud'
  | 'orders_payments'
  | 'users_roles'
  | 'seo_audit';

export const AdminAndUserWorkspace: React.FC<AdminAndUserWorkspaceProps> = ({
  user,
  token,
  courses,
  videos,
  articles,
  enrollments,
  orders,
  siteSettings,
  onOpenCourse,
  onQuickSwitchRole,
  onLogout,
  onRefreshData,
}) => {
  const isStaff = user.role === 'admin' || user.role === 'instructor';
  const [subTab, setSubTab] = useState<AdminSubTab>(
    isStaff ? 'courses_crud' : 'my_learning'
  );

  // Admin overview full data
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>(orders);
  const [seoIssues, setSeoIssues] = useState<SEOAuditIssue[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  // Course Editor Form State
  const [courseForm, setCourseForm] = useState({
    id: '',
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    categoryName: 'پردازش زبان طبیعی',
    level: 'پیشرفته' as 'مقدماتی' | 'متوسط' | 'پیشرفته',
    durationHours: 24,
    price: 3500000,
    discountPrice: 2800000,
    seoTitle: '',
    seoDescription: '',
    thumbnailAlt: '',
    firstLessonSummary: '',
    status: 'published' as 'published' | 'draft' | 'archived',
  });

  // Video Editor Form State
  const [videoForm, setVideoForm] = useState({
    id: '',
    title: '',
    slug: '',
    description: '',
    categoryName: 'پردازش زبان طبیعی',
    durationSeconds: 1500,
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    transcript: '',
    thumbnailAlt: '',
    seoTitle: '',
    seoDescription: '',
    status: 'published' as 'published' | 'draft',
  });

  // Article Editor Form State
  const [articleForm, setArticleForm] = useState({
    id: '',
    title: '',
    slug: '',
    excerpt: '',
    categoryName: 'پردازش زبان طبیعی',
    readTimeMinutes: 8,
    mainHeading: '',
    mainBody: '',
    codeBlock: '',
    thumbnailAlt: '',
    seoTitle: '',
    seoDescription: '',
    relatedCourseSlug: 'llm-engineering-transformers',
    status: 'published' as 'published' | 'draft' | 'archived',
  });

  // Site Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    siteTitle: siteSettings.siteTitle,
    siteDescription: siteSettings.siteDescription,
    contactEmail: siteSettings.contactEmail,
    contactPhone: siteSettings.contactPhone,
    address: siteSettings.address,
    newRedirectFrom: '',
    newRedirectTo: '',
  });

  const loadAdminData = async () => {
    if (!isStaff) return;
    try {
      const [overviewRes, seoRes] = await Promise.all([
        fetch('/api/admin/overview', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/seo/audit'),
      ]);
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setAdminUsers(data.users || []);
        setAdminOrders(data.orders || []);
      }
      if (seoRes.ok) {
        const seoData = await seoRes.json();
        setSeoIssues(seoData.issues || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isStaff) {
      loadAdminData();
    } else {
      setSubTab('my_learning');
    }
  }, [user.role, token]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 5000);
  };

  // Auto-generate SEO draft helper (Section 4.6 Intelligent SEO Automation)
  const handleAutoGenerateCourseSEO = () => {
    if (!courseForm.title) return;
    const autoSlug = courseForm.slug || `ai-course-${Date.now().toString().slice(-4)}`;
    setCourseForm((prev) => ({
      ...prev,
      slug: autoSlug,
      seoTitle: `${prev.title.slice(0, 42)} | آکادمی متافکر`,
      seoDescription: (prev.description || prev.subtitle || prev.title).slice(0, 150),
      thumbnailAlt: `تصویر شاخص دوره ${prev.title} در آکادمی هوش مصنوعی متافکر`,
    }));
    showToast('پیشنهاد هوشمند عنوان سئو، توضیحات متا و متن جایگزین تصویر تولید شد.');
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseForm),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'خطا در ذخیره دوره.');
        return;
      }
      showToast('دوره با موفقیت در پایگاه داده سرور ذخیره شد.');
      setCourseForm({
        id: '',
        title: '',
        slug: '',
        subtitle: '',
        description: '',
        categoryName: 'پردازش زبان طبیعی',
        level: 'پیشرفته',
        durationHours: 24,
        price: 3500000,
        discountPrice: 2800000,
        seoTitle: '',
        seoDescription: '',
        thumbnailAlt: '',
        firstLessonSummary: '',
        status: 'published',
      });
      await onRefreshData();
      await loadAdminData();
    } catch {
      showToast('خطا در ارتباط با سرور.');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      showToast('دوره از سامانه حذف شد.');
      await onRefreshData();
      await loadAdminData();
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(videoForm),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'خطا در ثبت ویدیو.');
      return;
    }
    showToast('ویدیوی آموزشی با موفقیت منتشر شد.');
    setVideoForm({
      id: '',
      title: '',
      slug: '',
      description: '',
      categoryName: 'پردازش زبان طبیعی',
      durationSeconds: 1500,
      videoUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      transcript: '',
      thumbnailAlt: '',
      seoTitle: '',
      seoDescription: '',
      status: 'published',
    });
    await onRefreshData();
    await loadAdminData();
  };

  const handleDeleteVideo = async (id: string) => {
    const res = await fetch(`/api/admin/videos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      showToast('ویدیو حذف شد.');
      await onRefreshData();
      await loadAdminData();
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(articleForm),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'خطا در ذخیره مقاله.');
      return;
    }
    showToast('مقاله تخصصی با موفقیت ذخیره و منتشر شد.');
    setArticleForm({
      id: '',
      title: '',
      slug: '',
      excerpt: '',
      categoryName: 'پردازش زبان طبیعی',
      readTimeMinutes: 8,
      mainHeading: '',
      mainBody: '',
      codeBlock: '',
      thumbnailAlt: '',
      seoTitle: '',
      seoDescription: '',
      relatedCourseSlug: 'llm-engineering-transformers',
      status: 'published',
    });
    await onRefreshData();
    await loadAdminData();
  };

  const handleDeleteArticle = async (id: string) => {
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      showToast('مقاله حذف شد.');
      await onRefreshData();
      await loadAdminData();
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: 'paid' | 'refunded' | 'failed'
  ) => {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast(
        status === 'paid'
          ? 'پرداخت سفارش تایید شد و دسترسی دانشجو به دوره فعال گردید.'
          : 'وضعیت سفارش به مسترد شده تغییر یافت و دسترسی دوره لغو شد.'
      );
      await onRefreshData();
      await loadAdminData();
    }
  };

  const handleUpdateUserRole = async (
    targetUserId: string,
    role: 'admin' | 'instructor' | 'student'
  ) => {
    const res = await fetch(`/api/admin/users/${targetUserId}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      showToast('نقش کاربر با موفقیت بروزرسانی شد.');
      await loadAdminData();
    }
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedRedirects = [...siteSettings.redirects];
    if (
      settingsForm.newRedirectFrom.trim().startsWith('/') &&
      settingsForm.newRedirectTo.trim().startsWith('/')
    ) {
      updatedRedirects.push({
        id: `red-${Date.now()}`,
        fromPath: settingsForm.newRedirectFrom.trim(),
        toPath: settingsForm.newRedirectTo.trim(),
        statusCode: 301,
      });
    }

    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        siteTitle: settingsForm.siteTitle,
        siteDescription: settingsForm.siteDescription,
        contactEmail: settingsForm.contactEmail,
        contactPhone: settingsForm.contactPhone,
        address: settingsForm.address,
        redirects: updatedRedirects,
      }),
    });

    if (res.ok) {
      setSettingsForm((prev) => ({ ...prev, newRedirectFrom: '', newRedirectTo: '' }));
      showToast('تنظیمات کلان سایت و قوانین ریدایرکت ۳۰۱ ذخیره شدند.');
      await onRefreshData();
      await loadAdminData();
    }
  };

  const totalRevenue = adminOrders
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + o.finalAmount, 0);

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-10">
      {/* Top Workspace Bar with Role Switcher & User Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1 tabular-nums">
            <span className="font-bold text-blue-800">
              {user.role === 'admin'
                ? 'مدیر کل سامانه (Super Admin)'
                : user.role === 'instructor'
                ? 'پنل مدرس آکادمی'
                : 'پنل کاربری دانشجو'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{user.email}</span>
            {user.rollNumber && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{user.rollNumber}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            خوش آمدید، {user.name}
          </h1>
        </div>

        {/* Interactive Role Switcher for Testing RBAC */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 px-2">
              تغییر سریع نقش (تست دسترسی ها):
            </span>
            <button
              type="button"
              onClick={() => onQuickSwitchRole('student')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                user.role === 'student'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              دانشجو
            </button>
            <button
              type="button"
              onClick={() => onQuickSwitchRole('instructor')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                user.role === 'instructor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مدرس
            </button>
            <button
              type="button"
              onClick={() => onQuickSwitchRole('admin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                user.role === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مدیر کل (Admin)
            </button>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950 text-emerald-200 border border-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            بستن
          </button>
        </div>
      )}

      {/* KPI Metrics Row for Staff (Tabular Numerals) */}
      {isStaff && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">
              مجموع فروش تایید شده (تومان)
            </span>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {totalRevenue.toLocaleString('fa-IR')}
            </p>
            <span className="text-[11px] text-emerald-700 mt-1 block">
              {adminOrders.filter((o) => o.status === 'paid').length} تراکنش موفق
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">دوره های منتشر شده</span>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {courses.length} دوره تخصصی
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              مدل فریمیوم با قفل سرور فعال
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">
              ویدیوها و مقالات علمی
            </span>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {videos.length} ویدیو · {articles.length} مقاله
            </p>
            <span className="text-[11px] text-blue-800 mt-1 block">
              اسکیمای VideoObject و TechArticle فعال
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">کاربران ثبت شده</span>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {adminUsers.length || 3} کاربر فعال
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              کنترل دسترسی مبتنی بر نقش (RBAC)
            </span>
          </div>
        </div>
      )}

      {/* Workspace Layout: Sidebar Navigation + Main Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5">
          <button
            type="button"
            onClick={() => setSubTab('my_learning')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              subTab === 'my_learning'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>دوره های من و گواهینامه ها</span>
          </button>

          {isStaff && (
            <>
              <button
                type="button"
                onClick={() => setSubTab('courses_crud')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  subTab === 'courses_crud'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>مدیریت دوره های آموزشی</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('videos_crud')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  subTab === 'videos_crud'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>مدیریت ویدیو های رایگان</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('articles_crud')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  subTab === 'articles_crud'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>مدیریت مقالات تخصصی</span>
              </button>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <button
                type="button"
                onClick={() => setSubTab('orders_payments')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  subTab === 'orders_payments'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>سفارش ها و تراکنش ها</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('users_roles')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  subTab === 'users_roles'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>کاربران و سطوح دسترسی</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('seo_audit')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  subTab === 'seo_audit'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>موتور سئو، ریدایرکت و نقشه سایت</span>
              </button>
            </>
          )}
        </aside>

        {/* Main Workspace Viewport */}
        <div className="lg:col-span-9 space-y-8">
          {/* TAB 1: Student Enrolled Courses, Progress, Notes & Orders */}
          {subTab === 'my_learning' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-extrabold text-slate-900 mb-4">
                  دوره های ثبت نام شده من ({enrollments.length})
                </h2>

                {enrollments.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-600 mb-3">
                      شما هنوز در هیچ دوره ای ثبت نام نکرده اید.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenCourse(courses[0]?.slug || '')}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#1E40AF] rounded-lg cursor-pointer"
                    >
                      مشاهده دوره های تخصصی
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrollments.map((enr) => {
                      const course = courses.find((c) => c.id === enr.courseId);
                      if (!course) return null;
                      const totalLessons = course.chapters.reduce(
                        (acc, ch) => acc + ch.lessons.length,
                        0
                      );
                      const doneCount = enr.completedLessonIds.length;
                      const pct =
                        totalLessons > 0 ? Math.round((doneCount / totalLessons) * 100) : 0;

                      return (
                        <div
                          key={enr.id}
                          className="p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                              <span className="text-emerald-700 font-semibold">
                                وضعیت دسترسی: {enr.status === 'active' ? 'فعال' : 'لغو شده'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>
                                تاریخ ثبت نام:{' '}
                                {new Date(enr.enrolledAt).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900">
                              {course.title}
                            </h3>
                            <div className="max-w-md">
                              <div className="flex justify-between text-xs text-slate-600 mb-1 tabular-nums">
                                <span>پیشرفت جلسات</span>
                                <span>
                                  {doneCount} از {totalLessons} ({pct}%)
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${pct}%` }}
                                  className="h-full bg-emerald-600"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {pct >= 60 && (
                              <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                                <Award className="w-4 h-4 text-amber-600" />
                                <span>واجد شرایط گواهی</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenCourse(course.slug)}
                              className="px-4 py-2 text-xs font-bold text-white bg-[#1E40AF] hover:bg-blue-900 rounded-lg cursor-pointer"
                            >
                              ورود به کلاس درس
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* User Order History */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-base font-extrabold text-slate-900 mb-4">
                  سوابق سفارش ها و تراکنش های من
                </h2>
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-500">هنوز سفارشی ثبت نشده است.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2.5 px-3">کد پیگیری</th>
                          <th className="py-2.5 px-3">عنوان دوره</th>
                          <th className="py-2.5 px-3">مبلغ نهایی (تومان)</th>
                          <th className="py-2.5 px-3">وضعیت</th>
                          <th className="py-2.5 px-3">تاریخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 tabular-nums">
                        {orders.map((ord) => (
                          <tr key={ord.id}>
                            <td className="py-3 px-3 font-mono font-semibold">
                              {ord.referenceCode}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-900">
                              {ord.courseTitle}
                            </td>
                            <td className="py-3 px-3">
                              {ord.finalAmount.toLocaleString('fa-IR')}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`font-semibold ${
                                  ord.status === 'paid'
                                    ? 'text-emerald-700'
                                    : ord.status === 'pending'
                                    ? 'text-amber-700'
                                    : 'text-red-700'
                                }`}
                              >
                                {ord.status === 'paid'
                                  ? 'پرداخت شده'
                                  : ord.status === 'pending'
                                  ? 'در انتظار پرداخت'
                                  : 'مسترد / لغو شده'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500">
                              {new Date(ord.createdAt).toLocaleDateString('fa-IR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Course Management CRUD */}
          {subTab === 'courses_crud' && isStaff && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    ایجاد یا ویرایش دوره آموزشی (متصل به پایگاه داده سرور)
                  </h2>
                  <button
                    type="button"
                    onClick={handleAutoGenerateCourseSEO}
                    className="px-3.5 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer"
                  >
                    تولید خودکار متادیتای سئو از محتوا
                  </button>
                </div>

                <form onSubmit={handleSaveCourse} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        عنوان دوره:
                      </label>
                      <input
                        type="text"
                        required
                        value={courseForm.title}
                        onChange={(e) =>
                          setCourseForm({ ...courseForm, title: e.target.value })
                        }
                        placeholder="مثال: مهندسی شبکه های عصبی گراف در پایتون"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        نامک لاتین (Slug یکتا در URL):
                      </label>
                      <input
                        type="text"
                        required
                        value={courseForm.slug}
                        onChange={(e) =>
                          setCourseForm({ ...courseForm, slug: e.target.value })
                        }
                        placeholder="graph-neural-networks-python"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      زیرعنوان کوتاه دوره:
                    </label>
                    <input
                      type="text"
                      value={courseForm.subtitle}
                      onChange={(e) =>
                        setCourseForm({ ...courseForm, subtitle: e.target.value })
                      }
                      placeholder="آموزش عملی از مبانی تئوری تا پیاده سازی صنعتی..."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        دسته بندی:
                      </label>
                      <select
                        value={courseForm.categoryName}
                        onChange={(e) =>
                          setCourseForm({ ...courseForm, categoryName: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                      >
                        <option value="پردازش زبان طبیعی">پردازش زبان طبیعی</option>
                        <option value="بینایی ماشین">بینایی ماشین</option>
                        <option value="ابزارهای هوش مصنوعی">ابزارهای هوش مصنوعی</option>
                        <option value="یادگیری ماشین">یادگیری ماشین</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        سطح دشواری:
                      </label>
                      <select
                        value={courseForm.level}
                        onChange={(e) =>
                          setCourseForm({
                            ...courseForm,
                            level: e.target.value as 'مقدماتی' | 'متوسط' | 'پیشرفته',
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                      >
                        <option value="مقدماتی">مقدماتی</option>
                        <option value="متوسط">متوسط</option>
                        <option value="پیشرفته">پیشرفته</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        شهریه اصلی (تومان):
                      </label>
                      <input
                        type="number"
                        value={courseForm.price}
                        onChange={(e) =>
                          setCourseForm({
                            ...courseForm,
                            price: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        شهریه با تخفیف (تومان):
                      </label>
                      <input
                        type="number"
                        value={courseForm.discountPrice}
                        onChange={(e) =>
                          setCourseForm({
                            ...courseForm,
                            discountPrice: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      توضیحات کامل دوره:
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={courseForm.description}
                      onChange={(e) =>
                        setCourseForm({ ...courseForm, description: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        عنوان سئو (SEO Title):
                      </label>
                      <input
                        type="text"
                        value={courseForm.seoTitle}
                        onChange={(e) =>
                          setCourseForm({ ...courseForm, seoTitle: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        متن جایگزین تصویر شاخص (Alt Text):
                      </label>
                      <input
                        type="text"
                        value={courseForm.thumbnailAlt}
                        onChange={(e) =>
                          setCourseForm({ ...courseForm, thumbnailAlt: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E40AF] hover:bg-blue-900 rounded-xl cursor-pointer"
                    >
                      ذخیره و انتشار دوره در سرور
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Courses List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-base font-extrabold text-slate-900 mb-4">
                  فهرست دوره های موجود ({courses.length})
                </h3>
                <div className="divide-y divide-slate-100">
                  {courses.map((c) => (
                    <div
                      key={c.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{c.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 tabular-nums">
                          <span className="font-mono">{c.canonicalUrl}</span>
                          <span aria-hidden="true">·</span>
                          <span>{c.categoryName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{(c.discountPrice ?? c.price).toLocaleString('fa-IR')} تومان</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setCourseForm({
                              id: c.id,
                              title: c.title,
                              slug: c.slug,
                              subtitle: c.subtitle,
                              description: c.description,
                              categoryName: c.categoryName,
                              level: c.level,
                              durationHours: c.durationHours,
                              price: c.price,
                              discountPrice: c.discountPrice ?? c.price,
                              seoTitle: c.seoTitle,
                              seoDescription: c.seoDescription,
                              thumbnailAlt: c.thumbnailAlt,
                              firstLessonSummary: '',
                              status: c.status,
                            })
                          }
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                        >
                          ویرایش
                        </button>
                        {user.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            aria-label="حذف دوره"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Video Management CRUD */}
          {subTab === 'videos_crud' && isStaff && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
                <h2 className="text-lg font-extrabold text-slate-900 mb-6">
                  افزودن ویدیوی آموزشی جدید با اسکیمای VideoObject
                </h2>
                <form onSubmit={handleSaveVideo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        عنوان ویدیو:
                      </label>
                      <input
                        type="text"
                        required
                        value={videoForm.title}
                        onChange={(e) =>
                          setVideoForm({ ...videoForm, title: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        نامک لاتین (Slug):
                      </label>
                      <input
                        type="text"
                        required
                        value={videoForm.slug}
                        onChange={(e) =>
                          setVideoForm({ ...videoForm, slug: e.target.value })
                        }
                        placeholder="intro-to-lora-finetuning"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      توضیحات ویدیو:
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={videoForm.description}
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, description: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      متن کامل ویدیو (Transcript جهت سئوی ویدیو):
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={videoForm.transcript}
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, transcript: e.target.value })
                      }
                      placeholder="متن کامل صحبت های مدرس در ویدیو را وارد نمایید..."
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E40AF] hover:bg-blue-900 rounded-xl cursor-pointer"
                    >
                      انتشار ویدیوی آموزشی
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-base font-extrabold text-slate-900 mb-4">
                  ویدیوهای منتشر شده ({videos.length})
                </h3>
                <div className="divide-y divide-slate-100">
                  {videos.map((v) => (
                    <div
                      key={v.id}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{v.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {v.canonicalUrl}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(v.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        aria-label="حذف ویدیو"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Article Management CRUD */}
          {subTab === 'articles_crud' && isStaff && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
                <h2 className="text-lg font-extrabold text-slate-900 mb-6">
                  انتشار مقاله علمی جدید (همراه با تولید خودکار فهرست مطالب و قطعه کد)
                </h2>
                <form onSubmit={handleSaveArticle} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        عنوان مقاله:
                      </label>
                      <input
                        type="text"
                        required
                        value={articleForm.title}
                        onChange={(e) =>
                          setArticleForm({ ...articleForm, title: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        نامک لاتین (Slug):
                      </label>
                      <input
                        type="text"
                        required
                        value={articleForm.slug}
                        onChange={(e) =>
                          setArticleForm({ ...articleForm, slug: e.target.value })
                        }
                        placeholder="speculative-decoding-guide"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      خلاصه مدیریتی مقاله (Excerpt & Meta Description):
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={articleForm.excerpt}
                      onChange={(e) =>
                        setArticleForm({ ...articleForm, excerpt: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      سرتیتر بخش اصلی (Heading H2):
                    </label>
                    <input
                      type="text"
                      required
                      value={articleForm.mainHeading}
                      onChange={(e) =>
                        setArticleForm({ ...articleForm, mainHeading: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      متن کامل بخش:
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={articleForm.mainBody}
                      onChange={(e) =>
                        setArticleForm({ ...articleForm, mainBody: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      قطعه کد فنی مقاله (اختیاری - Python/PyTorch):
                    </label>
                    <textarea
                      rows={3}
                      value={articleForm.codeBlock}
                      onChange={(e) =>
                        setArticleForm({ ...articleForm, codeBlock: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E40AF] hover:bg-blue-900 rounded-xl cursor-pointer"
                    >
                      ذخیره و انتشار مقاله
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-base font-extrabold text-slate-900 mb-4">
                  مقالات منتشر شده ({articles.length})
                </h3>
                <div className="divide-y divide-slate-100">
                  {articles.map((a) => (
                    <div
                      key={a.id}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{a.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {a.canonicalUrl}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteArticle(a.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        aria-label="حذف مقاله"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Orders & Payment Verification */}
          {subTab === 'orders_payments' && user.role === 'admin' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    مدیریت سفارش ها، تایید پرداخت و کنترل دسترسی دوره ها
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    تایید هر سفارش به صورت خودکار و Idempotent دسترسی دانشجو به جلسات قفل شده را فعال می کند و استرداد وجه دسترسی را لغو می نماید.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-3 px-3">کد سفارش</th>
                      <th className="py-3 px-3">دانشجو</th>
                      <th className="py-3 px-3">دوره</th>
                      <th className="py-3 px-3">مبلغ (تومان)</th>
                      <th className="py-3 px-3">وضعیت</th>
                      <th className="py-3 px-3">عملیات مدیر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {adminOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td className="py-3.5 px-3 font-mono font-bold">
                          {ord.referenceCode}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="block font-bold text-slate-900">
                            {ord.userName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {ord.userEmail}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 max-w-xs truncate">
                          {ord.courseTitle}
                        </td>
                        <td className="py-3.5 px-3 font-bold">
                          {ord.finalAmount.toLocaleString('fa-IR')}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`font-bold ${
                              ord.status === 'paid'
                                ? 'text-emerald-700'
                                : ord.status === 'pending'
                                ? 'text-amber-700'
                                : 'text-red-700'
                            }`}
                          >
                            {ord.status === 'paid'
                              ? 'تایید شده (Paid)'
                              : ord.status === 'pending'
                              ? 'در انتظار پرداخت'
                              : 'مسترد شده'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            {ord.status !== 'paid' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, 'paid')}
                                className="px-2.5 py-1 rounded bg-emerald-700 text-white font-semibold hover:bg-emerald-800 cursor-pointer"
                              >
                                تایید و فعال سازی دوره
                              </button>
                            )}
                            {ord.status === 'paid' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateOrderStatus(ord.id, 'refunded')
                                }
                                className="px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200 font-semibold hover:bg-red-100 cursor-pointer"
                              >
                                استرداد و لغو دسترسی
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: User & Role Management */}
          {subTab === 'users_roles' && user.role === 'admin' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-extrabold text-slate-900 mb-6">
                مدیریت کاربران و سطوح دسترسی (RBAC)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-3 px-3">نام کاربر</th>
                      <th className="py-3 px-3">ایمیل</th>
                      <th className="py-3 px-3">گرایش تخصصی</th>
                      <th className="py-3 px-3">نقش فعلی</th>
                      <th className="py-3 px-3">تغییر نقش</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {u.name}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-600">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">{u.discipline}</td>
                        <td className="py-3.5 px-3 font-semibold text-blue-800">
                          {u.role}
                        </td>
                        <td className="py-3.5 px-3">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleUpdateUserRole(
                                u.id,
                                e.target.value as 'admin' | 'instructor' | 'student'
                              )
                            }
                            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs bg-white"
                          >
                            <option value="student">دانشجو (student)</option>
                            <option value="instructor">مدرس (instructor)</option>
                            <option value="admin">مدیر کل (admin)</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: Technical SEO Audit, Sitemap, Robots & 301 Redirects */}
          {subTab === 'seo_audit' && user.role === 'admin' && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      موتور ممیزی خودکار سئو فنی و محتوایی (Real-Time SEO Audit)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      بررسی خودکار طول عنوان سئو، توضیحات متا، متن جایگزین تصاویر، غنای محتوا و اسکیماهای Schema.org
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="/sitemap.xml"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <span>مشاهده sitemap.xml</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="/robots.txt"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg border border-slate-200"
                    >
                      <span>مشاهده robots.txt</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="space-y-3">
                  {seoIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {issue.severity === 'good' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-slate-900">
                            {issue.entityTitle}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            ({issue.slug})
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">{issue.message}</p>
                        <p className="text-[11px] text-slate-500">
                          پیشنهاد: {issue.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Site Settings & 301 Redirect Manager */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-800" />
                  <span>تنظیمات سئوی سراسری و مدیریت ریدایرکت های ۳۰۱</span>
                </h3>
                <form onSubmit={handleSaveSiteSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      عنوان پیش فرض سایت:
                    </label>
                    <input
                      type="text"
                      value={settingsForm.siteTitle}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, siteTitle: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      توضیحات متای پیش فرض:
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.siteDescription}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          siteDescription: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        افزودن مسیر قدیم (From Path - ریدایرکت ۳۰۱):
                      </label>
                      <input
                        type="text"
                        value={settingsForm.newRedirectFrom}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            newRedirectFrom: e.target.value,
                          })
                        }
                        placeholder="/legacy-ai-course"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        مسیر مقصد جدید (To Path):
                      </label>
                      <input
                        type="text"
                        value={settingsForm.newRedirectTo}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            newRedirectTo: e.target.value,
                          })
                        }
                        placeholder="/courses/llm-engineering-transformers"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E40AF] hover:bg-blue-900 rounded-xl cursor-pointer"
                    >
                      ذخیره تنظیمات سئو و ریدایرکت ها
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
