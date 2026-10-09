import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Play,
} from 'lucide-react';
import { CommentItem, Course, User, VideoTutorial } from '../types/metafekr';
import { buildVideoSchema, updatePageSEO } from '../utils/seo';
import { EducationalVideoPlayer } from './EducationalVideoPlayer';

interface VideoDetailViewProps {
  video: VideoTutorial;
  relatedCourse?: Course;
  comments: CommentItem[];
  user: User | null;
  token: string | null;
  onBack: () => void;
  onOpenCourse: (slug: string) => void;
  onRequireAuth: () => void;
  onRefreshData: () => Promise<void>;
}

export const VideoDetailView: React.FC<VideoDetailViewProps> = ({
  video,
  relatedCourse,
  comments,
  user,
  token,
  onBack,
  onOpenCourse,
  onRequireAuth,
  onRefreshData,
}) => {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    updatePageSEO({
      title: video.seoTitle || video.title,
      description: video.seoDescription || video.description,
      canonicalPath: `/videos/${video.slug}`,
      ogType: 'video.other',
      jsonLd: buildVideoSchema(video, window.location.origin),
    });
  }, [video]);

  const videoComments = comments.filter(
    (c) => c.targetType === 'video' && c.targetId === video.id
  );

  const minutes = Math.floor(video.durationSeconds / 60);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) {
      onRequireAuth();
      return;
    }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetType: 'video',
          targetId: video.id,
          content: commentText,
        }),
      });
      if (res.ok) {
        setCommentText('');
        await onRefreshData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav aria-label="مسیر صفحه" className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-800 font-medium cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به ویدیو های آموزشی</span>
        </button>
        <span aria-hidden="true">/</span>
        <span>{video.categoryName}</span>
        <span aria-hidden="true">/</span>
        <span className="text-slate-900 font-semibold truncate max-w-md">{video.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Video Player Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <EducationalVideoPlayer
              src={video.videoUrl}
              poster={video.thumbnail}
              title={video.title}
              summary={video.transcript}
              durationMinutes={minutes}
            />

            <div className="p-6 sm:p-8">
              {/* Unboxed Metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3 tabular-nums">
                <span className="font-semibold text-blue-800">{video.categoryName}</span>
                <span aria-hidden="true">·</span>
                <span>مدرس: {video.instructorName}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {minutes} دقیقه
                </span>
                <span aria-hidden="true">·</span>
                <span>{video.views.toLocaleString('fa-IR')} بازدید</span>
                <span aria-hidden="true">·</span>
                <span>انتشار: {new Date(video.publishedAt).toLocaleDateString('fa-IR')}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3">
                {video.title}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">{video.description}</p>
            </div>
          </div>

          {/* Crawl-Friendly Video Transcript & Key Takeaways (Section 4.3 Video SEO) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>نکات کلیدی این آموزش ویدیویی</span>
              </h2>
              <ul className="space-y-2 text-xs text-slate-700">
                {video.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Play className="w-3.5 h-3.5 text-blue-800 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <h2 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-800" />
                <span>متن کامل ویدیو (Transcript قابل نمایه سازی توسط موتورهای جستجو)</span>
              </h2>
              <p className="text-sm text-slate-600 leading-loose bg-slate-50 p-5 rounded-xl border border-slate-200">
                {video.transcript}
              </p>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-800" />
              <span>دیدگاه ها و پرسش های کاربران ({videoComments.length})</span>
            </h3>
            <form onSubmit={handleSubmitComment} className="mb-6 space-y-3">
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="دیدگاه یا سوال خود درباره این ویدیو را بنویسید..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-[#1E40AF] text-white rounded-lg hover:bg-blue-900 cursor-pointer"
                >
                  ثبت دیدگاه
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {videoComments.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="font-bold text-slate-900">{c.userName}</span>
                    <span className="tabular-nums">
                      {new Date(c.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Internal Linking to Related Course & Schema Info */}
        <div className="lg:col-span-4 space-y-6">
          {relatedCourse && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                <BookOpen className="w-4 h-4" />
                <span>دوره جامع مرتبط با این ویدیو</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                {relatedCourse.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {relatedCourse.subtitle}
              </p>
              <button
                type="button"
                onClick={() => onOpenCourse(relatedCourse.slug)}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#EA580C] hover:bg-orange-700 rounded-xl transition-colors cursor-pointer"
              >
                مشاهده سرفصل ها و جلسات رایگان دوره
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-900">
              مشخصات سئو و داده ساختاریافته (VideoObject)
            </h3>
            <div className="text-xs text-slate-600 space-y-1.5 tabular-nums">
              <p>آدرس کانونیکال: {video.canonicalUrl}</p>
              <p>نوع اسکیما: Schema.org / VideoObject</p>
              <p>وضعیت دسترسی: رایگان و قابل نمایه سازی</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
