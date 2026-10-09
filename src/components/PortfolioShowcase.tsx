import React, { useEffect, useState } from 'react';
import { ArrowUpLeft, Cpu, Play, Sparkles, Terminal, X } from 'lucide-react';
import { PortfolioProject } from '../types/metafekr';
import { SmartImage } from './SmartImage';

interface PortfolioShowcaseProps {
  projects: PortfolioProject[];
  onOpenCourse: (slug: string) => void;
}

interface CohortMember {
  id: string;
  name: string;
  rollNumber: string;
  discipline: string;
  cohort: string;
  avatar: string;
  highlight: string;
  bio: string;
  awards: string[];
  projectSlug: string;
}

const COHORT_MEMBERS: CohortMember[] = [
  {
    id: 'mem-1',
    name: 'آرمان فرهادی',
    rollNumber: 'MF-1404-812',
    discipline: 'مهندسی مدل های زبانی بزرگ',
    cohort: 'ورودی پاییز ۱۴۰۴',
    avatar: '/src/assets/images/avatar_lead_instructor_1791547360351.jpg',
    highlight: 'طراح موتور بازیابی حقوقی ParsLegal-RAG با دقت استناد ۹۴.۶ درصد',
    bio: 'پژوهشگر ارشد پردازش زبان طبیعی و فارغ التحصیل ممتاز دوره مهندسی ترنسفورمر در آکادمی متافکر. تمرکز اصلی او بر کاهش توهم زایی مدل های زبانی در اسناد مالی و حقوقی فارسی است.',
    awards: [
      'رتبه اول پروژه پایانی دوره چهارم مهندسی LLM متافکر',
      'استقرار موفق سامانه RAG در ۳ سازمان حقوقی با بیش از ۴۸ هزار سند',
    ],
    projectSlug: 'parslegal-rag-enterprise-search',
  },
  {
    id: 'mem-2',
    name: 'نگار سرافراز',
    rollNumber: 'MF-1404-609',
    discipline: 'بینایی ماشین و سیستم های نهفته',
    cohort: 'ورودی تابستان ۱۴۰۴',
    avatar: '/src/assets/images/course_computer_vision_1791547339304.jpg',
    highlight: 'بهینه سازی شبکه تشخیص عیوب سطحی با TensorRT و نرخ ۷۵ قطعه در دقیقه',
    bio: 'مهندس بینایی ماشین صنعتی و متخصص کوانتیزاسیون شبکه های عصبی روی پردازنده های NVIDIA Jetson برای خطوط تولید خودروسازی.',
    awards: [
      'کاهش ۷۸ درصدی ضایعات برگشتی خط مونتاژ در ۶ ماه نخست استقرار',
      'نگارش مقاله تخصصی کالیبراسیون INT8 در مجله فنی متافکر',
    ],
    projectSlug: 'realtime-optical-defect-inspection',
  },
  {
    id: 'mem-3',
    name: 'سهراب کاظمی',
    rollNumber: 'MF-1404-734',
    discipline: 'معماری سیستم های چند ایجنتی',
    cohort: 'ورودی زمستان ۱۴۰۴',
    avatar: '/src/assets/images/course_ai_agents_workflow_1791547349625.jpg',
    highlight: 'کاهش ۶۲ درصدی زمان تشخیص ریشه خطا (MTTD) در زیرساخت ابری',
    bio: 'معمار سیستم های توزیع شده و طراح چارچوب های تصمیم یار خودکار مبتنی بر گراف حالت برای تیم های مهندسی قابلیت اطمینان سایت (SRE).',
    awards: [
      'برگزیده بخش نوآوری صنعتی آکادمی هوش مصنوعی متافکر',
      'پیاده سازی گاردریل امنیتی ایجنت های متصل به دیتابیس سازمانی',
    ],
    projectSlug: 'multi-agent-cloud-incident-rca',
  },
];

export const PortfolioShowcase: React.FC<PortfolioShowcaseProps> = ({
  projects,
  onOpenCourse,
}) => {
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [selectedMember, setSelectedMember] = useState<CohortMember | null>(null);
  const [demoRunning, setDemoRunning] = useState<boolean>(false);
  const [demoOutputShown, setDemoOutputShown] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
        setSelectedMember(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenProjectModal = (proj: PortfolioProject) => {
    setSelectedProject(proj);
    setDemoRunning(false);
    setDemoOutputShown(true);
  };

  const handleRunLiveDemo = () => {
    setDemoRunning(true);
    setDemoOutputShown(false);
    setTimeout(() => {
      setDemoRunning(false);
      setDemoOutputShown(true);
    }, 180);
  };

  return (
    <section className="py-14 bg-[#F8FAFC] border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-6 space-y-16">
        {/* Part 1: Dynamic Bento Grid of Institute & Student AI Portfolio Projects */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold text-blue-800 mb-2">
                پورتفولیو و سامانه های عملیاتی آزمایشگاه متافکر
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                پروژه های صنعتی پیاده سازی شده توسط پژوهشگران و فارغ التحصیلان
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              بر روی هر پروژه کلیک کنید تا معماری فنی، شاخص های کمی عملکرد و محیط تست استنتاج مدل را مشاهده نمایید.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {projects.map((proj, index) => {
              const isWide = proj.colSpan === 2 || index === 0;
              return (
                <div
                  key={proj.id}
                  onClick={() => handleOpenProjectModal(proj)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenProjectModal(proj);
                    }
                  }}
                  className={`${
                    isWide ? 'lg:col-span-2' : 'lg:col-span-1'
                  } group bg-white rounded-2xl border border-slate-200 hover:border-slate-400 transition-all duration-150 overflow-hidden flex flex-col justify-between cursor-pointer text-right`}
                >
                  <div>
                    <div
                      className={`relative overflow-hidden bg-slate-950 ${
                        isWide ? 'aspect-16/9 sm:aspect-21/9' : 'aspect-4/3'
                      }`}
                    >
                      <SmartImage
                        src={proj.thumbnail}
                        alt={proj.thumbnailAlt}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-5">
                        <div className="text-white">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mb-1 tabular-nums">
                            <span>{proj.discipline}</span>
                            <span aria-hidden="true">·</span>
                            <span>{proj.studentName}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{proj.rollNumber}</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-extrabold leading-snug">
                            {proj.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {proj.summary}
                      </p>

                      {/* Quantitative Claim-to-Proof Adjacency */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="block text-[11px] text-slate-500 mb-1">
                          نتیجه کمی ثبت شده در محیط عملیاتی:
                        </span>
                        <p className="text-xs font-bold text-slate-900 tabular-nums">
                          {proj.outcomeMetric}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Clean Unboxed Metadata Footer */}
                  <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="truncate">{proj.technologies.join(' · ')}</div>
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-800 shrink-0 group-hover:translate-x-[-2px] transition-transform">
                      <span>بررسی معماری و تست مدل</span>
                      <ArrowUpLeft className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Part 2: 3-in-a-Row Student & Alumni Cohort Directory */}
        <div className="pt-8 border-t border-slate-200">
          <div className="mb-8">
            <p className="text-xs font-semibold text-blue-800 mb-2">
              دایرکتوری پژوهشگران و فارغ التحصیلان برتر متافکر
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              کارنامه علمی و دستاوردهای مهندسان دوره های تخصصی
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COHORT_MEMBERS.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedMember(member);
                  }
                }}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-400 p-6 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <SmartImage
                      src={member.avatar}
                      alt={member.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 aspect-square"
                    />
                    <div className="min-w-0">
                      <h4 className="text-base font-extrabold text-slate-900 truncate">
                        {member.name}
                      </h4>
                      {/* Unboxed Metadata with · separators */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1 tabular-nums">
                        <span className="font-mono">{member.rollNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span>{member.cohort}</span>
                      </div>
                      <p className="text-xs text-blue-800 font-medium mt-1 truncate">
                        {member.discipline}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {member.highlight}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>مشاهده رزومه پژوهشی و جوایز</span>
                  <ArrowUpLeft className="w-4 h-4 text-blue-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal 1: Fullscreen Portfolio Case Study & Interactive Model Sandbox */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-project-title"
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden border border-slate-200 shadow-xl my-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-300 tabular-nums">
                <span>پروژه صنعتی متافکر</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{selectedProject.rollNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="بستن پنجره"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto">
              <div>
                <h3
                  id="modal-project-title"
                  className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2"
                >
                  {selectedProject.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>پژوهشگر: {selectedProject.studentName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedProject.cohort}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedProject.discipline}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 mb-1.5">
                    مسئله و چالش صنعتی
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedProject.problemStatement}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 mb-1.5">
                    معماری فنی پیاده سازی شده
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedProject.architectureDetails}
                  </p>
                </div>
              </div>

              {/* Interactive Inference Sandbox inside the Portfolio Modal */}
              <div className="p-5 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                    <Terminal className="w-4 h-4" />
                    <span>تست تعاملی خروجی مدل: {selectedProject.interactiveDemoConfig.modelName}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono tabular-nums">
                    Latency: {selectedProject.interactiveDemoConfig.tokenLatencyMs}ms ·{' '}
                    {selectedProject.interactiveDemoConfig.accuracyScore}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    ورودی نمونه آزمایشی (Input Prompt / Frame):
                  </span>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200">
                    {selectedProject.interactiveDemoConfig.inputPrompt}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleRunLiveDemo}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-600 text-white transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{demoRunning ? 'در حال استنتاج...' : 'اجرای مجدد استنتاج مدل'}</span>
                  </button>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {selectedProject.outcomeMetric}
                  </span>
                </div>

                {demoOutputShown && (
                  <div className="p-3.5 rounded-lg bg-slate-900/90 border border-emerald-800/70 text-xs text-emerald-200 leading-relaxed">
                    <strong className="block text-emerald-400 mb-1">
                      خروجی استنتاج مدل:
                    </strong>
                    {selectedProject.interactiveDemoConfig.sampleOutput}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  فناوری ها: {selectedProject.technologies.join(' · ')}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const slug = selectedProject.relatedCourseSlug;
                      setSelectedProject(null);
                      onOpenCourse(slug);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#EA580C] hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
                  >
                    مشاهده دوره آموزشی این پروژه
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    بستن
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Student / Researcher Cohort Profile Expansion */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-member-name"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden border border-slate-200 shadow-xl">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                پروفایل علمی پژوهشگر متافکر
              </span>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                aria-label="بستن"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4">
                <SmartImage
                  src={selectedMember.avatar}
                  alt={selectedMember.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h3
                    id="modal-member-name"
                    className="text-xl font-extrabold text-slate-900"
                  >
                    {selectedMember.name}
                  </h3>
                  <p className="text-xs text-blue-800 font-semibold mt-1">
                    {selectedMember.discipline}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 tabular-nums">
                    شماره پرونده: {selectedMember.rollNumber} · {selectedMember.cohort}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {selectedMember.bio}
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-800" />
                  <span>دستاوردها و رتبه های ثبت شده</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  {selectedMember.awards.map((aw, i) => (
                    <li key={i}>{aw}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const matched = projects.find(
                      (p) => p.slug === selectedMember.projectSlug
                    );
                    setSelectedMember(null);
                    if (matched) handleOpenProjectModal(matched);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1E40AF] hover:bg-blue-900 rounded-lg cursor-pointer"
                >
                  مشاهده پروژه ثبت شده
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
