import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  FileText,
  Lock,
  Play,
  Search,
  Unlock,
  Video,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AdminAndUserWorkspace } from './components/AdminAndUserWorkspace';
import { ArticleDetailView } from './components/ArticleDetailView';
import { AuthModal } from './components/AuthModal';
import { CourseDetailView } from './components/CourseDetailView';
import { InteractiveAISandbox } from './components/InteractiveAISandbox';
import { ActiveTab, Navbar } from './components/Navbar';
import { PortfolioShowcase } from './components/PortfolioShowcase';
import { SmartImage } from './components/SmartImage';
import { VideoDetailView } from './components/VideoDetailView';
import {
  Article,
  CommentItem,
  Course,
  Enrollment,
  Order,
  PortfolioProject,
  SiteSettings,
  User,
  VideoTutorial,
} from './types/metafekr';
import { updatePageSEO } from './utils/seo';

const HERO_IMAGE = '/src/assets/images/hero_metafekr_institute_1791547314211.jpg';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string | null>(null);
  const [selectedVideoSlug, setSelectedVideoSlug] = useState<string | null>(null);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);

  // Auth & Server Bootstrap State
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('metafekr_token')
  );
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<VideoTutorial[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteTitle: 'متافکر | آکادمی تخصصی آموزش هوش مصنوعی و مهندسی یادگیری ماشین',
    siteDescription:
      'پلتفرم جامع آموزش هوش مصنوعی متافکر شامل دوره های تخصصی پروژه محور، ویدیو های آموزشی رایگان، مقالات علمی و نمونه پروژه های هوش مصنوعی.',
    contactEmail: 'info@metafekr.ir',
    contactPhone: '021-88942100',
    address: 'تهران، بلوار کشاورز، پژوهشکده فناوری های نوین و هوش مصنوعی متافکر',
    zarinpalMerchantConfigured: false,
    defaultCanonicalBase: 'https://metafekr.ir',
    redirects: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Interactive Filtering & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [courseSort, setCourseSort] = useState<'newest' | 'price_asc' | 'hours_desc'>(
    'newest'
  );

  const fetchBootstrapData = useCallback(
    async (overrideToken?: string | null) => {
      const activeToken = overrideToken !== undefined ? overrideToken : token;
      try {
        const res = await fetch('/api/bootstrap', {
          headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
          setCourses(data.courses || []);
          setVideos(data.videos || []);
          setArticles(data.articles || []);
          setPortfolioProjects(data.portfolioProjects || []);
          setEnrollments(data.enrollments || []);
          setOrders(data.orders || []);
          setComments(data.comments || []);
          if (data.siteSettings) {
            setSiteSettings(data.siteSettings);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchBootstrapData();
  }, [fetchBootstrapData]);

  // Update SEO when navigating top-level tabs
  useEffect(() => {
    if (selectedCourseSlug || selectedVideoSlug || selectedArticleSlug) return;
    const origin = window.location.origin;

    if (activeTab === 'home') {
      updatePageSEO({
        title: siteSettings.siteTitle,
        description: siteSettings.siteDescription,
        canonicalPath: '/',
        ogType: 'website',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: 'آکادمی هوش مصنوعی متافکر',
          alternateName: 'MetaFekr AI Education Institute',
          url: origin,
          description: siteSettings.siteDescription,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'تهران',
            streetAddress: siteSettings.address,
            addressCountry: 'IR',
          },
        },
      });
    } else if (activeTab === 'courses') {
      updatePageSEO({
        title: 'دوره های تخصصی هوش مصنوعی و یادگیری عمیق | متافکر',
        description:
          'فهرست دوره های پروژه محور مهندسی مدل های زبانی بزرگ، بینایی ماشین سه بعدی و طراحی ایجنت های هوشمند همراه با جلسات رایگان ابتدایی.',
        canonicalPath: '/courses',
      });
    } else if (activeTab === 'videos') {
      updatePageSEO({
        title: 'ویدیو های آموزشی رایگان هوش مصنوعی | آکادمی متافکر',
        description:
          'آرشیو ویدیو های آموزشی رایگان در حوزه ترنسفورمر، سیستم های RAG، بینایی ماشین و امنیت هوش مصنوعی همراه با متن کامل ویدیو.',
        canonicalPath: '/videos',
      });
    } else if (activeTab === 'articles') {
      updatePageSEO({
        title: 'مقالات علمی و تخصصی مهندسی هوش مصنوعی | متافکر',
        description:
          'مقالات فنی عمیق درباره الگوریتم FlashAttention، معماری Hybrid RAG، کوانتیزاسیون INT8 و بهینه سازی شبکه های عصبی.',
        canonicalPath: '/articles',
      });
    } else if (activeTab === 'portfolio') {
      updatePageSEO({
        title: 'پورتفولیو پروژه های صنعتی و دستاوردهای پژوهشی | متافکر',
        description:
          'نمایشگاه پروژه های عملیاتی پیاده سازی شده در آزمایشگاه هوش مصنوعی متافکر همراه با شاخص های کمی عملکرد و تست زنده مدل.',
        canonicalPath: '/portfolio',
      });
    }
  }, [
    activeTab,
    selectedCourseSlug,
    selectedVideoSlug,
    selectedArticleSlug,
    siteSettings,
  ]);

  const handleSelectTab = (tab: ActiveTab) => {
    setSelectedCourseSlug(null);
    setSelectedVideoSlug(null);
    setSelectedArticleSlug(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCourse = (slug: string) => {
    setSelectedVideoSlug(null);
    setSelectedArticleSlug(null);
    setSelectedCourseSlug(slug);
    setActiveTab('courses');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenVideo = (slug: string) => {
    setSelectedCourseSlug(null);
    setSelectedArticleSlug(null);
    setSelectedVideoSlug(slug);
    setActiveTab('videos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenArticle = (slug: string) => {
    setSelectedCourseSlug(null);
    setSelectedVideoSlug(null);
    setSelectedArticleSlug(slug);
    setActiveTab('articles');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = async (newToken: string, loggedUser: User) => {
    localStorage.setItem('metafekr_token', newToken);
    setToken(newToken);
    setUser(loggedUser);
    await fetchBootstrapData(newToken);
  };

  const handleQuickSwitchRole = async (role: 'student' | 'instructor' | 'admin') => {
    const res = await fetch('/api/auth/quick-switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const data = await res.json();
      await handleAuthSuccess(data.token, data.user);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('metafekr_token');
    setToken(null);
    setUser(null);
    setActiveTab('home');
    fetchBootstrapData(null);
  };

  // Filtered Collections
  const categories = ['all', 'پردازش زبان طبیعی', 'بینایی ماشین', 'ابزارهای هوش مصنوعی'];

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return courses
      .filter((c) => {
        const matchCat =
          selectedCategory === 'all' || c.categoryName === selectedCategory;
        const matchQuery =
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q));
        return matchCat && matchQuery;
      })
      .sort((a, b) => {
        if (courseSort === 'price_asc') {
          return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price);
        }
        if (courseSort === 'hours_desc') {
          return b.durationHours - a.durationHours;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [courses, searchQuery, selectedCategory, courseSort]);

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter((v) => {
      const matchCat =
        selectedCategory === 'all' || v.categoryName === selectedCategory;
      const matchQuery =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [videos, searchQuery, selectedCategory]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter((a) => {
      const matchCat =
        selectedCategory === 'all' || a.categoryName === selectedCategory;
      const matchQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [articles, searchQuery, selectedCategory]);

  const activeCourseObj = useMemo(
    () => courses.find((c) => c.slug === selectedCourseSlug),
    [courses, selectedCourseSlug]
  );

  const activeVideoObj = useMemo(
    () => videos.find((v) => v.slug === selectedVideoSlug),
    [videos, selectedVideoSlug]
  );

  const activeArticleObj = useMemo(
    () => articles.find((a) => a.slug === selectedArticleSlug),
    [articles, selectedArticleSlug]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* 3-Zone Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {loading ? (
          /* Skeleton Loading State */
          <div className="max-w-[1360px] mx-auto px-6 py-16 space-y-8">
            <div className="h-96 rounded-2xl bg-slate-200/70 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-72 rounded-2xl bg-slate-200/70 animate-pulse" />
              <div className="h-72 rounded-2xl bg-slate-200/70 animate-pulse" />
              <div className="h-72 rounded-2xl bg-slate-200/70 animate-pulse" />
            </div>
          </div>
        ) : activeCourseObj ? (
          <CourseDetailView
            course={activeCourseObj}
            user={user}
            token={token}
            enrollment={enrollments.find((e) => e.courseId === activeCourseObj.id)}
            comments={comments}
            onBack={() => setSelectedCourseSlug(null)}
            onRequireAuth={() => setAuthModalOpen(true)}
            onRefreshData={() => fetchBootstrapData()}
          />
        ) : activeVideoObj ? (
          <VideoDetailView
            video={activeVideoObj}
            relatedCourse={courses.find(
              (c) => c.slug === activeVideoObj.relatedCourseSlug
            )}
            comments={comments}
            user={user}
            token={token}
            onBack={() => setSelectedVideoSlug(null)}
            onOpenCourse={handleOpenCourse}
            onRequireAuth={() => setAuthModalOpen(true)}
            onRefreshData={() => fetchBootstrapData()}
          />
        ) : activeArticleObj ? (
          <ArticleDetailView
            article={activeArticleObj}
            relatedCourse={courses.find(
              (c) => c.slug === activeArticleObj.relatedCourseSlug
            )}
            relatedVideo={videos.find(
              (v) => v.slug === activeArticleObj.relatedVideoSlug
            )}
            comments={comments}
            user={user}
            token={token}
            onBack={() => setSelectedArticleSlug(null)}
            onOpenCourse={handleOpenCourse}
            onOpenVideo={handleOpenVideo}
            onRequireAuth={() => setAuthModalOpen(true)}
            onRefreshData={() => fetchBootstrapData()}
          />
        ) : activeTab === 'workspace' && user && token ? (
          <AdminAndUserWorkspace
            user={user}
            token={token}
            courses={courses}
            videos={videos}
            articles={articles}
            enrollments={enrollments}
            orders={orders}
            siteSettings={siteSettings}
            onOpenCourse={handleOpenCourse}
            onQuickSwitchRole={handleQuickSwitchRole}
            onLogout={handleLogout}
            onRefreshData={() => fetchBootstrapData()}
          />
        ) : (
          <>
            {/* HOME VIEW: Split-Screen Hero + Full-Width KPI Row + Marquee + 3 Core Pillars */}
            {activeTab === 'home' && (
              <>
                <section className="bg-white border-b border-slate-200 pt-10 pb-14">
                  <div className="max-w-[1360px] mx-auto px-6">
                    {/* 2-Column Balanced Split Hero */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                      {/* Right Column in RTL: Typographic Hierarchy & Primary CTA */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="lg:col-span-6 flex flex-col justify-between py-2"
                      >
                        <div className="space-y-6">
                          {/* Regional / Institutional Trust Marker belongs in Hero */}
                          <p className="text-xs font-bold text-blue-800 tracking-wide">
                            پژوهشکده و آکادمی تخصصی هوش مصنوعی متافکر · تهران
                          </p>

                          <h1
                            style={{
                              fontSize: 'clamp(2.1rem, 3.6vw, 3.25rem)',
                              textWrap: 'balance',
                            }}
                            className="font-extrabold text-slate-950 leading-[1.2] tracking-tight"
                          >
                            آموزش مهندسی هوش مصنوعی، معماری ترنسفورمر و سیستم های هوشمند در مقیاس صنعتی
                          </h1>

                          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-[62ch]">
                            در متافکر، یادگیری فراتر از تئوری های سطحی است. با ویدیو های آموزشی رایگان، مقالات علمی عمیق و دوره های پروژه محور با مدل فریمیوم، معماری مدل های زبانی بزرگ، بینایی ماشین سه بعدی و ایجنت های خودمختار را از صفر در کد پیاده سازی کنید.
                          </p>
                        </div>

                        <div className="pt-8 space-y-6">
                          <div className="flex flex-wrap items-center gap-4">
                            <button
                              type="button"
                              onClick={() => handleSelectTab('courses')}
                              className="px-6 py-3.5 text-xs sm:text-sm font-bold text-white bg-[#EA580C] hover:bg-orange-700 rounded-xl transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2 cursor-pointer"
                            >
                              <span>مشاهده دوره ها و جلسات رایگان</span>
                              <ArrowLeft className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSelectTab('portfolio')}
                              className="px-5 py-3.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              پورتفولیو پروژه های صنعتی
                            </button>
                          </div>

                          {/* Clean Unboxed Metadata Highlights */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-2">
                            <span>جلسات ابتدایی رایگان برای همه</span>
                            <span aria-hidden="true">·</span>
                            <span>کدهای کامل PyTorch و TensorRT</span>
                            <span aria-hidden="true">·</span>
                            <span>پشتیبانی مستقیم اساتید در هر درس</span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Left Column in RTL: Matching Height Visual Container */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="lg:col-span-6"
                      >
                        <div className="relative h-full min-h-[340px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-950">
                          <SmartImage
                            src={HERO_IMAGE}
                            alt="استودیو تدریس و آزمایشگاه شبکه های عصبی آکادمی هوش مصنوعی متافکر"
                            className="w-full h-full lg:h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mb-2 tabular-nums">
                              <span>آزمایشگاه مرکزی متافکر</span>
                              <span aria-hidden="true">·</span>
                              <span>ارائه معماری شبکه های عصبی عمیق</span>
                            </div>
                            <p className="text-sm sm:text-base font-bold leading-snug max-w-lg">
                              آموزش مبتنی بر پیاده سازی ریاضی و مهندسی نرم افزار؛ از مکانیزم Attention تا استقرار روی سرورهای عملیاتی
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Full-Width 4-Column Quantitative Proof Row Below Hero Split */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-200">
                      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <p className="text-2xl font-extrabold text-slate-900 tabular-nums mb-1">
                          94.6%
                        </p>
                        <p className="text-xs font-semibold text-slate-800">
                          دقت استناد در سامانه های RAG فارسی
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          بر اساس بنچمارک ۴۸ هزار سند حقوقی در ۳ ماه
                        </p>
                      </div>

                      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <p className="text-2xl font-extrabold text-slate-900 tabular-nums mb-1">
                          96 ساعت
                        </p>
                        <p className="text-xs font-semibold text-slate-800">
                          آموزش تخصصی کدنویسی و معماری مدل
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          در ۳ مسیر تخصصی LLM، بینایی ماشین و ایجنت ها
                        </p>
                      </div>

                      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <p className="text-2xl font-extrabold text-slate-900 tabular-nums mb-1">
                          6.2 ms
                        </p>
                        <p className="text-xs font-semibold text-slate-800">
                          زمان استنتاج مدل های بینایی ماشین INT8
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          بهینه سازی شده با موتور NVIDIA TensorRT در آزمایشگاه
                        </p>
                      </div>

                      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <p className="text-2xl font-extrabold text-slate-900 tabular-nums mb-1">
                          100% عملی
                        </p>
                        <p className="text-xs font-semibold text-slate-800">
                          پیش نمایش رایگان جلسات ابتدایی هر دوره
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          بررسی کامل کیفیت تدریس و کدها پیش از ثبت نام
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Subtle Animated Editorial Marquee Section Divider */}
                <div
                  aria-hidden="true"
                  className="bg-slate-900 text-slate-300 py-3 border-b border-slate-800 overflow-hidden select-none"
                >
                  <div className="animate-marquee-rtl flex items-center gap-8 text-xs font-medium whitespace-nowrap">
                    <span>مهندسی مدل های زبانی بزرگ (LLM)</span>
                    <span>·</span>
                    <span>معماری شبکه های ترنسفورمر</span>
                    <span>·</span>
                    <span>فاین تیونینگ بهینه با QLoRA و DPO</span>
                    <span>·</span>
                    <span>بازیابی دانش ترکیبی (Hybrid RAG)</span>
                    <span>·</span>
                    <span>بینایی ماشین سه بعدی و TensorRT</span>
                    <span>·</span>
                    <span>طراحی سیستم های چند ایجنتی خودمختار</span>
                    <span>·</span>
                    <span>مهندسی مدل های زبانی بزرگ (LLM)</span>
                    <span>·</span>
                    <span>معماری شبکه های ترنسفورمر</span>
                    <span>·</span>
                    <span>فاین تیونینگ بهینه با QLoRA و DPO</span>
                    <span>·</span>
                    <span>بازیابی دانش ترکیبی (Hybrid RAG)</span>
                  </div>
                </div>
              </>
            )}

            {/* Shared Search & Category Filter Toolbar for Courses / Videos / Articles */}
            {(activeTab === 'home' ||
              activeTab === 'courses' ||
              activeTab === 'videos' ||
              activeTab === 'articles') && (
              <section className="py-12 border-b border-slate-200">
                <div className="max-w-[1360px] mx-auto px-6">
                  {/* Interactive Search & Filter Controls */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="جستجو در عنوان دوره ها، ویدیوها، مقالات یا مباحث فنی..."
                        aria-label="جستجو در محتوای آموزشی"
                        className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-2 focus:outline-blue-800"
                      />
                    </div>

                    {/* Interactive Segmented Category Filter Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {cat === 'all' ? 'همه گرایش ها' : cat}
                        </button>
                      ))}
                    </div>

                    {(activeTab === 'home' || activeTab === 'courses') && (
                      <div className="flex items-center gap-2 shrink-0">
                        <label
                          htmlFor="course-sort"
                          className="text-xs font-medium text-slate-500 whitespace-nowrap"
                        >
                          مرتب سازی:
                        </label>
                        <select
                          id="course-sort"
                          value={courseSort}
                          onChange={(e) =>
                            setCourseSort(
                              e.target.value as 'newest' | 'price_asc' | 'hours_desc'
                            )
                          }
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-800 font-medium"
                        >
                          <option value="newest">بروزترین دوره ها</option>
                          <option value="price_asc">کمترین شهریه</option>
                          <option value="hours_desc">بیشترین ساعت آموزشی</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* PILLAR 1: COURSES (Shown on Home & Courses Tab) */}
                  {(activeTab === 'home' || activeTab === 'courses') && (
                    <div className="space-y-8">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold text-blue-800 mb-1.5">
                            ۰۱. دوره های تخصصی پروژه محور (مدل فریمیوم)
                          </p>
                          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            مسیرهای مهندسی هوش مصنوعی با جلسات پیش نمایش رایگان
                          </h2>
                        </div>
                        {activeTab === 'home' && (
                          <button
                            type="button"
                            onClick={() => handleSelectTab('courses')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-950 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <span>مشاهده کامل کاتالوگ دوره ها</span>
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {filteredCourses.length === 0 ? (
                        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
                          <p className="text-sm text-slate-600 mb-3">
                            دوره ای مطابق با عبارت جستجو شده یافت نشد.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCategory('all');
                            }}
                            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg cursor-pointer"
                          >
                            نمایش همه دوره ها
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {filteredCourses.map((course) => {
                            const allLessons = course.chapters.flatMap(
                              (ch) => ch.lessons
                            );
                            const freeCount = allLessons.filter((l) => l.isFree).length;
                            const lockedCount = allLessons.length - freeCount;
                            const effectivePrice =
                              course.discountPrice !== null
                                ? course.discountPrice
                                : course.price;

                            return (
                              <div
                                key={course.id}
                                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-400 transition-colors overflow-hidden flex flex-col justify-between"
                              >
                                <div>
                                  <div
                                    onClick={() => handleOpenCourse(course.slug)}
                                    className="aspect-4/3 overflow-hidden bg-slate-900 cursor-pointer relative group"
                                  >
                                    <SmartImage
                                      src={course.thumbnail}
                                      alt={course.thumbnailAlt}
                                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                                    />
                                  </div>

                                  <div className="p-6 space-y-3">
                                    {/* Clean Unboxed Metadata */}
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                                      <span className="font-semibold text-blue-800">
                                        {course.categoryName}
                                      </span>
                                      <span aria-hidden="true">·</span>
                                      <span>سطح {course.level}</span>
                                      <span aria-hidden="true">·</span>
                                      <span>{course.durationHours} ساعت</span>
                                    </div>

                                    <h3
                                      onClick={() => handleOpenCourse(course.slug)}
                                      className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug hover:text-blue-800 transition-colors cursor-pointer"
                                    >
                                      {course.title}
                                    </h3>

                                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                      {course.subtitle}
                                    </p>

                                    {/* Freemium Lesson Breakdown */}
                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 tabular-nums">
                                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                        <Unlock className="w-3.5 h-3.5" />
                                        {freeCount} جلسه اول رایگان
                                      </span>
                                      <span className="inline-flex items-center gap-1 text-slate-500">
                                        <Lock className="w-3.5 h-3.5" />
                                        {lockedCount} جلسه تخصصی
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-4">
                                  <div className="tabular-nums">
                                    <span className="block text-sm font-extrabold text-slate-900">
                                      {effectivePrice.toLocaleString('fa-IR')} تومان
                                    </span>
                                    {course.discountPrice !== null && (
                                      <span className="text-[11px] text-slate-400 line-through">
                                        {course.price.toLocaleString('fa-IR')} تومان
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenCourse(course.slug)}
                                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    مشاهده و پیش نمایش
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PILLAR 2: FREE EDUCATIONAL VIDEOS (Shown on Videos Tab) */}
                  {activeTab === 'videos' && (
                    <div className="space-y-8">
                      <div>
                        <p className="text-xs font-semibold text-blue-800 mb-1.5">
                          آرشیو ویدیو های آموزشی آزاد متافکر
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                          ویدیو های آموزشی رایگان هوش مصنوعی با متن کامل (Transcript)
                        </h1>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredVideos.map((vid) => {
                          const mins = Math.floor(vid.durationSeconds / 60);
                          return (
                            <div
                              key={vid.id}
                              onClick={() => handleOpenVideo(vid.slug)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleOpenVideo(vid.slug);
                                }
                              }}
                              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-400 transition-colors overflow-hidden flex flex-col sm:flex-row cursor-pointer"
                            >
                              <div className="sm:w-56 aspect-video sm:aspect-auto bg-slate-900 shrink-0 relative">
                                <SmartImage
                                  src={vid.thumbnail}
                                  alt={vid.thumbnailAlt}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-5 flex flex-col justify-between flex-1">
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-2 tabular-nums">
                                    <span className="font-semibold text-blue-800">
                                      {vid.categoryName}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span>{mins} دقیقه</span>
                                    <span aria-hidden="true">·</span>
                                    <span>{vid.views.toLocaleString('fa-IR')} بازدید</span>
                                  </div>
                                  <h2 className="text-base font-extrabold text-slate-900 leading-snug mb-2">
                                    {vid.title}
                                  </h2>
                                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                    {vid.description}
                                  </p>
                                </div>
                                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-800">
                                  <span>تماشای رایگان ویدیو و مطالعه متن</span>
                                  <Play className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PILLAR 3: SPECIALIZED ARTICLES (Shown on Articles Tab) */}
                  {activeTab === 'articles' && (
                    <div className="space-y-8">
                      <div>
                        <p className="text-xs font-semibold text-blue-800 mb-1.5">
                          مجله مهندسی و پژوهش های هوش مصنوعی متافکر
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                          مقالات تخصصی، کالبدشکافی الگوریتم ها و راهنماهای پیاده سازی
                        </h1>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {filteredArticles.map((art) => (
                          <div
                            key={art.id}
                            onClick={() => handleOpenArticle(art.slug)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenArticle(art.slug);
                              }
                            }}
                            className="bg-white rounded-2xl border border-slate-200 hover:border-slate-400 transition-colors overflow-hidden flex flex-col justify-between cursor-pointer"
                          >
                            <div>
                              <div className="aspect-4/3 bg-slate-900 overflow-hidden">
                                <SmartImage
                                  src={art.thumbnail}
                                  alt={art.thumbnailAlt}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-6 space-y-3">
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                                  <span className="font-semibold text-blue-800">
                                    {art.categoryName}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>{art.readTimeMinutes} دقیقه مطالعه</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{art.authorName}</span>
                                </div>
                                <h2 className="text-base font-extrabold text-slate-900 leading-snug">
                                  {art.title}
                                </h2>
                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                                  {art.excerpt}
                                </p>
                              </div>
                            </div>
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-800">
                              <span>مطالعه مقاله و مشاهده کدها</span>
                              <ArrowUpLeft className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Interactive Educational AI Sandbox (Shown on Home) */}
            {activeTab === 'home' && (
              <InteractiveAISandbox onExploreCourse={handleOpenCourse} />
            )}

            {/* Portfolio & Alumni Showcase (Shown on Home & Portfolio Tab) */}
            {(activeTab === 'home' || activeTab === 'portfolio') && (
              <PortfolioShowcase
                projects={portfolioProjects}
                onOpenCourse={handleOpenCourse}
              />
            )}

            {/* Home Page Featured Free Videos & Specialized Articles Section */}
            {activeTab === 'home' && (
              <section className="py-16 bg-white border-b border-slate-200">
                <div className="max-w-[1360px] mx-auto px-6 space-y-16">
                  {/* Featured Free Video Tutorials */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                      <div>
                        <p className="text-xs font-semibold text-blue-800 mb-1.5">
                          ۰۲. آموزش های ویدیویی آزاد با اسکیمای VideoObject
                        </p>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          ویدیو های آموزشی رایگان همراه با متن کامل و نکات کلیدی
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectTab('videos')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-950 cursor-pointer"
                      >
                        <span>مشاهده همه ویدیو های آموزشی</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {videos.slice(0, 4).map((vid) => {
                        const mins = Math.floor(vid.durationSeconds / 60);
                        return (
                          <div
                            key={vid.id}
                            onClick={() => handleOpenVideo(vid.slug)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenVideo(vid.slug);
                              }
                            }}
                            className="p-5 rounded-2xl border border-slate-200 hover:border-slate-400 transition-colors flex flex-col sm:flex-row gap-5 items-start cursor-pointer"
                          >
                            <div className="w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0">
                              <SmartImage
                                src={vid.thumbnail}
                                alt={vid.thumbnailAlt}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                                <span className="font-semibold text-blue-800">
                                  {vid.categoryName}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{mins} دقیقه</span>
                                <span aria-hidden="true">·</span>
                                <span>رایگان</span>
                              </div>
                              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                                {vid.title}
                              </h3>
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {vid.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Featured Specialized AI Articles */}
                  <div className="pt-8 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                      <div>
                        <p className="text-xs font-semibold text-blue-800 mb-1.5">
                          ۰۳. مقالات تخصصی و مستندات فنی هوش مصنوعی
                        </p>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          تازه ترین مقالات علمی همراه با نمونه کدهای اجرایی
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectTab('articles')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-950 cursor-pointer"
                      >
                        <span>مشاهده آرشیو مقالات علمی</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {articles.slice(0, 3).map((art) => (
                        <div
                          key={art.id}
                          onClick={() => handleOpenArticle(art.slug)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleOpenArticle(art.slug);
                            }
                          }}
                          className="p-6 rounded-2xl border border-slate-200 hover:border-slate-400 transition-colors flex flex-col justify-between cursor-pointer bg-slate-50/50"
                        >
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                              <span className="font-semibold text-blue-800">
                                {art.categoryName}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{art.readTimeMinutes} دقیقه مطالعه</span>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                              {art.title}
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                              {art.excerpt}
                            </p>
                          </div>
                          <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-900">
                            <span>نویسنده: {art.authorName}</span>
                            <span className="text-blue-800">مطالعه مقاله</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-12">
        <div className="max-w-[1360px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800">
            <div className="md:col-span-5 space-y-3">
              <p className="text-lg font-extrabold text-white">
                متافکر | آکادمی تخصصی آموزش هوش مصنوعی
              </p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                {siteSettings.siteDescription}
              </p>
              <p className="text-xs text-slate-500">{siteSettings.address}</p>
            </div>

            <div className="md:col-span-4 space-y-2.5 text-xs">
              <p className="font-bold text-white mb-2">بخش های اصلی پلتفرم</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectTab('courses')}
                  className="text-right hover:text-white cursor-pointer"
                >
                  دوره های تخصصی
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('videos')}
                  className="text-right hover:text-white cursor-pointer"
                >
                  ویدیو های آموزشی رایگان
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('articles')}
                  className="text-right hover:text-white cursor-pointer"
                >
                  مقالات علمی هوش مصنوعی
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('portfolio')}
                  className="text-right hover:text-white cursor-pointer"
                >
                  پورتفولیو پروژه های صنعتی
                </button>
              </div>
            </div>

            <div className="md:col-span-3 space-y-2 text-xs tabular-nums">
              <p className="font-bold text-white mb-2">ارتباط و زیرساخت سئو</p>
              <p>تلفن: {siteSettings.contactPhone}</p>
              <p className="font-mono">{siteSettings.contactEmail}</p>
              <div className="flex items-center gap-4 pt-2 text-slate-400">
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white underline"
                >
                  sitemap.xml
                </a>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white underline"
                >
                  robots.txt
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              تمامی حقوق علمی و مادی برای آکادمی هوش مصنوعی متافکر محفوظ است.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  user ? handleSelectTab('workspace') : setAuthModalOpen(true)
                }
                className="text-slate-300 hover:text-white font-semibold cursor-pointer"
              >
                {user ? 'ورود به پنل کاربری / مدیریت' : 'ورود اساتید، دانشجویان و مدیران'}
              </button>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
