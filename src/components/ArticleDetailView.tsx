import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Clock,
  Code2,
  List,
  MessageSquare,
  Video,
} from 'lucide-react';
import {
  Article,
  CommentItem,
  Course,
  User,
  VideoTutorial,
} from '../types/metafekr';
import { buildArticleSchema, updatePageSEO } from '../utils/seo';
import { SmartImage } from './SmartImage';

interface ArticleDetailViewProps {
  article: Article;
  relatedCourse?: Course;
  relatedVideo?: VideoTutorial;
  comments: CommentItem[];
  user: User | null;
  token: string | null;
  onBack: () => void;
  onOpenCourse: (slug: string) => void;
  onOpenVideo: (slug: string) => void;
  onRequireAuth: () => void;
  onRefreshData: () => Promise<void>;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({
  article,
  relatedCourse,
  relatedVideo,
  comments,
  user,
  token,
  onBack,
  onOpenCourse,
  onOpenVideo,
  onRequireAuth,
  onRefreshData,
}) => {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    updatePageSEO({
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      canonicalPath: `/articles/${article.slug}`,
      ogType: 'article',
      jsonLd: buildArticleSchema(article, window.location.origin),
    });
  }, [article]);

  const articleComments = comments.filter(
    (c) => c.targetType === 'article' && c.targetId === article.id
  );

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
          targetType: 'article',
          targetId: article.id,
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
          <span>بازگشت به مقالات تخصصی</span>
        </button>
        <span aria-hidden="true">/</span>
        <span>{article.categoryName}</span>
        <span aria-hidden="true">/</span>
        <span className="text-slate-900 font-semibold truncate max-w-md">{article.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Article Manuscript (8 Cols) */}
        <article className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 space-y-8">
          <header className="space-y-4 border-b border-slate-200 pb-6">
            {/* Unboxed Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
              <span className="font-semibold text-blue-800">{article.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>نویسنده: {article.authorName}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readTimeMinutes} دقیقه مطالعه
              </span>
              <span aria-hidden="true">·</span>
              <span>انتشار: {new Date(article.publishedAt).toLocaleDateString('fa-IR')}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {article.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {article.excerpt}
            </p>
          </header>

          <div className="rounded-xl overflow-hidden border border-slate-200 aspect-16/9">
            <SmartImage
              src={article.thumbnail}
              alt={article.thumbnailAlt}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Automatic Table of Contents (Section 3.2 & 4.2) */}
          <nav
            aria-label="فهرست مطالب مقاله"
            className="p-5 rounded-xl bg-slate-50 border border-slate-200"
          >
            <h2 className="text-xs font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              <List className="w-4 h-4 text-blue-800" />
              <span>فهرست سرتیترهای مقاله</span>
            </h2>
            <ol className="space-y-2 text-xs text-blue-800 font-medium list-decimal list-inside">
              {article.sections.map((sec) => (
                <li key={sec.id}>
                  <a href={`#${sec.id}`} className="hover:underline">
                    {sec.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Article Sections with Logical Heading Hierarchy */}
          <div className="space-y-8">
            {article.sections.map((sec, idx) => (
              <section key={sec.id} id={sec.id} className="space-y-4 scroll-mt-24">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {idx + 1}. {sec.heading}
                </h2>
                <p className="text-sm sm:text-base text-slate-700 leading-loose">
                  {sec.body}
                </p>
                {sec.codeBlock && (
                  <div className="pt-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                      <Code2 className="w-4 h-4 text-blue-800" />
                      <span>پیاده سازی فنی در پایتون:</span>
                    </div>
                    <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                      <code>{sec.codeBlock}</code>
                    </pre>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Comments Section */}
          <div className="pt-8 border-t border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-800" />
              <span>دیدگاه های علمی خوانندگان ({articleComments.length})</span>
            </h3>
            <form onSubmit={handleSubmitComment} className="mb-6 space-y-3">
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="تحلیل یا پرسش خود را درباره این مقاله بنویسید..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-[#1E40AF] text-white rounded-lg hover:bg-blue-900 cursor-pointer"
                >
                  ارسال دیدگاه
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {articleComments.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="font-bold text-slate-900">{c.userName}</span>
                    <span className="tabular-nums">
                      {new Date(c.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* Right Sidebar: Internal Links to Related Courses & Videos (Section 4.2 Article SEO) */}
        <aside className="lg:col-span-4 space-y-6">
          {relatedCourse && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                <BookOpen className="w-4 h-4" />
                <span>پیشنهاد یادگیری عمیق تر (لینک داخلی دوره)</span>
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
                ورود به صفحه دوره و جلسات رایگان
              </button>
            </div>
          )}

          {relatedVideo && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Video className="w-4 h-4 text-blue-800" />
                <span>ویدیوی آموزشی مکمل این مقاله</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {relatedVideo.title}
              </h3>
              <button
                type="button"
                onClick={() => onOpenVideo(relatedVideo.slug)}
                className="w-full py-2 px-4 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                تماشای رایگان ویدیو
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
