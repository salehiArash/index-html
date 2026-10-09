import { Article, Course, VideoTutorial } from '../types/metafekr';

export function updatePageSEO(params: {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article' | 'video.other';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}) {
  const fullTitle = params.title.includes('متافکر')
    ? params.title
    : `${params.title} | آکادمی هوش مصنوعی متافکر`;

  document.title = fullTitle;

  const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
    let el = document.querySelector(selector) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('meta[name="description"]', 'name', 'description', params.description);
  setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
  setMeta('meta[property="og:description"]', 'property', 'og:description', params.description);
  setMeta('meta[property="og:type"]', 'property', 'og:type', params.ogType || 'website');
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', params.description);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://metafekr.ir';
  const canonicalUrl = `${origin}${params.canonicalPath || '/'}`;

  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  const existingScript = document.getElementById('metafekr-jsonld');
  if (existingScript) {
    existingScript.remove();
  }

  if (params.jsonLd) {
    const script = document.createElement('script');
    script.id = 'metafekr-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(params.jsonLd);
    document.head.appendChild(script);
  }
}

export function buildCourseSchema(course: Course, baseOrigin: string) {
  const effectivePrice = course.discountPrice !== null ? course.discountPrice : course.price;
  const schemas: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.title,
      description: course.seoDescription || course.description,
      provider: {
        '@type': 'EducationalOrganization',
        name: 'آکادمی هوش مصنوعی متافکر',
        sameAs: baseOrigin,
      },
      instructor: {
        '@type': 'Person',
        name: course.instructorName,
        jobTitle: course.instructorRole,
      },
      educationalLevel: course.level,
      inLanguage: 'fa',
      offers: {
        '@type': 'Offer',
        price: effectivePrice,
        priceCurrency: 'IRT',
        availability: 'https://schema.org/InStock',
        url: `${baseOrigin}/courses/${course.slug}`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'خانه',
          item: baseOrigin,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'دوره های آموزشی',
          item: `${baseOrigin}/courses`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: course.title,
          item: `${baseOrigin}/courses/${course.slug}`,
        },
      ],
    },
  ];

  if (course.faqs && course.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: course.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return schemas;
}

export function buildVideoSchema(video: VideoTutorial, baseOrigin: string) {
  const minutes = Math.floor(video.durationSeconds / 60);
  const seconds = video.durationSeconds % 60;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: video.title,
      description: video.seoDescription || video.description,
      thumbnailUrl: [video.thumbnail.startsWith('http') ? video.thumbnail : `${baseOrigin}${video.thumbnail}`],
      uploadDate: video.publishedAt,
      duration: `PT${minutes}M${seconds}S`,
      contentUrl: video.videoUrl,
      inLanguage: 'fa',
      publisher: {
        '@type': 'EducationalOrganization',
        name: 'آکادمی هوش مصنوعی متافکر',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'خانه', item: baseOrigin },
        { '@type': 'ListItem', position: 2, name: 'ویدیو های آموزشی', item: `${baseOrigin}/videos` },
        { '@type': 'ListItem', position: 3, name: video.title, item: `${baseOrigin}/videos/${video.slug}` },
      ],
    },
  ];
}

export function buildArticleSchema(article: Article, baseOrigin: string) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: article.title,
      description: article.seoDescription || article.excerpt,
      image: [article.thumbnail.startsWith('http') ? article.thumbnail : `${baseOrigin}${article.thumbnail}`],
      datePublished: article.publishedAt,
      author: {
        '@type': 'Person',
        name: article.authorName,
        jobTitle: article.authorRole,
      },
      publisher: {
        '@type': 'EducationalOrganization',
        name: 'آکادمی هوش مصنوعی متافکر',
      },
      inLanguage: 'fa',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'خانه', item: baseOrigin },
        { '@type': 'ListItem', position: 2, name: 'مقالات تخصصی', item: `${baseOrigin}/articles` },
        { '@type': 'ListItem', position: 3, name: article.title, item: `${baseOrigin}/articles/${article.slug}` },
      ],
    },
  ];
}
