import crypto from 'crypto';
import type {
  Article,
  CommentItem,
  Coupon,
  Course,
  Enrollment,
  Order,
  PortfolioProject,
  SiteSettings,
  User,
  VideoTutorial,
} from '../types/metafekr.ts';

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  courses: Course[];
  videos: VideoTutorial[];
  articles: Article[];
  portfolioProjects: PortfolioProject[];
  enrollments: Enrollment[];
  orders: Order[];
  coupons: Coupon[];
  comments: CommentItem[];
  siteSettings: SiteSettings;
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash, salt: actualSalt };
}

export const HERO_STUDIO_IMAGE = '/src/assets/images/hero_metafekr_institute_1791547314211.jpg';
export const COURSE_LLM_IMAGE = '/src/assets/images/course_llm_engineering_1791547327670.jpg';
export const COURSE_CV_IMAGE = '/src/assets/images/course_computer_vision_1791547339304.jpg';
export const COURSE_AGENTS_IMAGE = '/src/assets/images/course_ai_agents_workflow_1791547349625.jpg';
export const INSTRUCTOR_AVATAR = '/src/assets/images/avatar_lead_instructor_1791547360351.jpg';

export function createInitialDatabase(): DatabaseSchema {
  const adminCreds = hashPassword('MetaFekrAdmin2026!');
  const instCreds = hashPassword('MetaFekrInst2026!');
  const studentCreds = hashPassword('MetaFekrStudent2026!');

  const users: StoredUser[] = [
    {
      id: 'usr-admin-1',
      name: 'دکتر افسانه رادمهر',
      email: 'admin@metafekr.ir',
      role: 'admin',
      discipline: 'معماری سیستم های هوشمند و یادگیری عمیق',
      rollNumber: 'MF-ADM-01',
      bio: 'مدیر علمی آکادمی هوش مصنوعی متافکر و پژوهشگر ارشد پردازش زبان طبیعی با بیش از ۱۲ سال سابقه تدریس دانشگاهی و صنعتی.',
      status: 'active',
      createdAt: '2025-01-10T08:00:00.000Z',
      passwordHash: adminCreds.hash,
      salt: adminCreds.salt,
    },
    {
      id: 'usr-inst-1',
      name: 'مهندس کسری بهرامی',
      email: 'instructor@metafekr.ir',
      role: 'instructor',
      discipline: 'مهندسی بینایی ماشین و سیستم های نهفته',
      rollNumber: 'MF-INS-04',
      bio: 'مدرس ارشد بینایی ماشین و طراح پایپ لاین های پردازش تصویر بی درنگ در صنایع رباتیک و اتوماسیون.',
      status: 'active',
      createdAt: '2025-02-01T10:00:00.000Z',
      passwordHash: instCreds.hash,
      salt: instCreds.salt,
    },
    {
      id: 'usr-stu-1',
      name: 'آرمان فرهادی',
      email: 'student@metafekr.ir',
      role: 'student',
      discipline: 'مهندسی مدل های زبانی بزرگ',
      rollNumber: 'MF-1404-812',
      bio: 'پژوهشگر و دانشجوی دوره های تخصصی مهندسی مدل های زبانی و سیستم های بازیابی دانش در متافکر.',
      status: 'active',
      createdAt: '2025-09-15T12:30:00.000Z',
      passwordHash: studentCreds.hash,
      salt: studentCreds.salt,
    },
  ];

  const courses: Course[] = [
    {
      id: 'crs-llm-1',
      title: 'مهندسی مدل های زبانی بزرگ و معماری ترنسفورمر در مقیاس صنعتی',
      slug: 'llm-engineering-transformers',
      subtitle: 'از پیاده سازی مکانیزم توجه در PyTorch تا استقرار سیستم های RAG و فاین تیونینگ بهینه با QLoRA',
      description:
        'این دوره جامع برای مهندسان نرم افزار و پژوهشگران هوش مصنوعی طراحی شده است که می خواهند فراتر از فراخوانی ساده API عمل کنند. در این دوره، معماری ترنسفورمر را از پایه پیاده سازی می کنید، دیتاست های فارسی را توکنایز و پاکسازی می نمایید، و مدل های زبانی را با تکنیک های LoRA و QLoRA روی سرورهای اختصاصی آموزش داده و مستقر می سازید.',
      instructorId: 'usr-admin-1',
      instructorName: 'دکتر افسانه رادمهر',
      instructorRole: 'دکترای هوش مصنوعی و مدیر علمی متافکر',
      instructorBio:
        'پژوهشگر ارشد مدل های زبانی بزرگ و نویسنده بیش از ۳۰ مقاله علمی در حوزه پردازش زبان طبیعی فارسی و بهینه سازی شبکه های عصبی.',
      instructorAvatar: INSTRUCTOR_AVATAR,
      categoryId: 'cat-nlp',
      categoryName: 'پردازش زبان طبیعی',
      tags: ['ترنسفورمر', 'مدل زبانی بزرگ', 'PyTorch', 'RAG', 'Fine-Tuning'],
      level: 'پیشرفته',
      durationHours: 38,
      price: 4800000,
      discountPrice: 3840000,
      thumbnail: COURSE_LLM_IMAGE,
      thumbnailAlt: 'دیاگرام سه بعدی معماری شبکه عصبی ترنسفورمر و فضای برداری در دوره متافکر',
      status: 'published',
      prerequisites: [
        'تسلط بر برنامه نویسی پایتون و کتابخانه NumPy',
        'آشنایی با مفاهیم پایه جبر خطی، مشتق گیری و احتمال',
        'تجربه کار مقدماتی با چارچوب PyTorch',
      ],
      outcomes: [
        'پیاده سازی کامل Multi-Head Self-Attention و Positional Encoding از صفر در PyTorch',
        'طراحی و بهینه سازی پایپ لاین RAG با پایگاه های داده برداری و ارزیابی دقت بازیابی',
        'فاین تیونینگ مدل های ۷ تا ۱۴ میلیارد پارامتری روی داده های تخصصی فارسی با QLoRA',
        'استقرار مدل با vLLM و کاهش تاخیر پاسخ دهی تا ۶۵ درصد در محیط عملیاتی',
      ],
      audience: [
        'مهندسان یادگیری ماشین و توسعه دهندگان بک اند',
        'پژوهشگران دانشگاهی در گرایش هوش مصنوعی و پردازش زبان طبیعی',
        'مدیران فنی که قصد استقرار مدل های زبانی بومی در سازمان خود را دارند',
      ],
      seoTitle: 'دوره مهندسی مدل های زبانی بزرگ (LLM) و ترنسفورمر | آکادمی متافکر',
      seoDescription:
        'آموزش پروژه محور معماری ترنسفورمر، فاین تیونینگ مدل های زبانی با QLoRA و پیاده سازی سیستم های RAG در پایتون و PyTorch.',
      canonicalUrl: '/courses/llm-engineering-transformers',
      updatedAt: '2026-09-20T14:00:00.000Z',
      chapters: [
        {
          id: 'ch-llm-1',
          title: 'فصل اول: مبانی ریاضی و پیاده سازی معماری ترنسفورمر',
          order: 1,
          lessons: [
            {
              id: 'les-llm-101',
              title: 'کالبدشکافی مکانیزم Self-Attention و محاسبات ماتریسی QKV',
              order: 1,
              durationMinutes: 42,
              isFree: true,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
              previewSeconds: 180,
              contentSummary:
                'در این جلسه رایگان، نحوه تبدیل توکن ها به بردارهای Query، Key و Value را به صورت ریاضی و تصویری بررسی کرده و ضرایب توجه مقیاس بندی شده را در پایتون پیاده سازی می کنیم.',
              codeSnippet: `import torch
import torch.nn as nn
import math

class ScaledDotProductAttention(nn.Module):
    def __init__(self, d_k: int):
        super().__init__()
        self.scale = math.sqrt(d_k)

    def forward(self, q: torch.Tensor, k: torch.Tensor, v: torch.Tensor, mask=None):
        scores = torch.matmul(q, k.transpose(-2, -1)) / self.scale
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        attn_weights = torch.softmax(scores, dim=-1)
        return torch.matmul(attn_weights, v), attn_weights`,
              resources: [
                {
                  id: 'res-101-1',
                  title: 'جزوه فرمولاسیون ماتریسی مکانیزم توجه',
                  fileType: 'PDF',
                  sizeLabel: '2.4 MB',
                  downloadUrl: '/api/resources/res-101-1',
                },
                {
                  id: 'res-101-2',
                  title: 'نوت بوک پیاده سازی Self-Attention در PyTorch',
                  fileType: 'CODE',
                  sizeLabel: '148 KB',
                  downloadUrl: '/api/resources/res-101-2',
                },
              ],
            },
            {
              id: 'les-llm-102',
              title: 'مهندسی توکنایزر BPE برای زبان فارسی و مدیریت چالش های نویسشی',
              order: 2,
              durationMinutes: 36,
              isFree: true,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
              previewSeconds: 180,
              contentSummary:
                'بررسی الگوریتم Byte-Pair Encoding و نحوه نرمال سازی متون فارسی برای کاهش طول دنباله توکن ها و افزایش سرعت استنتاج مدل زبانی.',
              codeSnippet: `from tokenizers import Tokenizer, models, pre_tokenizers, trainers

tokenizer = Tokenizer(models.BPE(unk_token="[UNK]"))
tokenizer.pre_tokenizer = pre_tokenizers.Whitespace()
trainer = trainers.BpeTrainer(vocab_size=32000, special_tokens=["[PAD]", "[UNK]", "[CLS]", "[SEP]"])`,
              resources: [
                {
                  id: 'res-102-1',
                  title: 'کد کامل آموزش توکنایزر اختصاصی فارسی',
                  fileType: 'CODE',
                  sizeLabel: '95 KB',
                  downloadUrl: '/api/resources/res-102-1',
                },
              ],
            },
            {
              id: 'les-llm-103',
              title: 'پیاده سازی RoPE (Rotary Position Embedding) و FlashAttention',
              order: 3,
              durationMinutes: 55,
              isFree: false,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
              previewSeconds: 30,
              contentSummary:
                'آموزش کامل کدگذاری موقعیت چرخشی (RoPE) در مدل های خانواده Llama و نحوه بهینه سازی مصرف حافظه GPU با الگوریتم FlashAttention.',
              resources: [
                {
                  id: 'res-103-1',
                  title: 'سورس کد کامل لایه RoPE و بنچمارک حافظه',
                  fileType: 'CODE',
                  sizeLabel: '310 KB',
                  downloadUrl: '/api/resources/res-103-1',
                },
              ],
            },
          ],
        },
        {
          id: 'ch-llm-2',
          title: 'فصل دوم: فاین تیونینگ بهینه (PEFT / QLoRA) و هم ترازی مدل',
          order: 2,
          lessons: [
            {
              id: 'les-llm-201',
              title: 'کوانتیزاسیون ۴ بیتی NormalFloat (NF4) و آموزش با QLoRA',
              order: 4,
              durationMinutes: 64,
              isFree: false,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4',
              previewSeconds: 30,
              contentSummary:
                'نحوه فاین تیون کردن مدل ۸ میلیارد پارامتری روی یک کارت گرافیک ۱۶ گیگابایتی با حفظ ۹۹ درصد دقت مدل اصلی.',
              resources: [
                {
                  id: 'res-201-1',
                  title: 'اسکریپت آموزش QLoRA با کتابخانه PEFT و BitsAndBytes',
                  fileType: 'CODE',
                  sizeLabel: '420 KB',
                  downloadUrl: '/api/resources/res-201-1',
                },
              ],
            },
            {
              id: 'les-llm-202',
              title: 'هم ترازی ترجیحات انسانی با الگوریتم DPO (Direct Preference Optimization)',
              order: 5,
              durationMinutes: 48,
              isFree: false,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
              previewSeconds: 30,
              contentSummary:
                'ساخت دیتاست جفت های ترجیحی (Chosen / Rejected) و اجرای حلقه آموزش DPO برای کاهش توهم زایی (Hallucination) در پاسخ های تخصصی.',
              resources: [
                {
                  id: 'res-202-1',
                  title: 'نمونه دیتاست استاندارد DPO فارسی',
                  fileType: 'DATASET',
                  sizeLabel: '5.8 MB',
                  downloadUrl: '/api/resources/res-202-1',
                },
              ],
            },
          ],
        },
        {
          id: 'ch-llm-3',
          title: 'فصل سوم: سیستم های RAG پیشرفته و استقرار عملیاتی',
          order: 3,
          lessons: [
            {
              id: 'les-llm-301',
              title: 'جستجوی ترکیبی (Hybrid Search)، بازرتبه بندی (Reranking) و استقرار با vLLM',
              order: 6,
              durationMinutes: 70,
              isFree: false,
              type: 'lab',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
              previewSeconds: 30,
              contentSummary:
                'ترکیب الگوریتم BM25 با جستجوی برداری تراکمی، اعمال مدل Cross-Encoder Reranker و سروینگ مدل با PagedAttention در vLLM.',
              resources: [
                {
                  id: 'res-301-1',
                  title: 'پروژه کامل میکروسرویس RAG آماده استقرار با Docker',
                  fileType: 'CODE',
                  sizeLabel: '1.9 MB',
                  downloadUrl: '/api/resources/res-301-1',
                },
              ],
            },
          ],
        },
      ],
      faqs: [
        {
          question: 'آیا جلسات ابتدایی دوره قبل از ثبت نام قابل مشاهده هستند؟',
          answer:
            'بله، دو جلسه نخست فصل اول به همراه کدهای مربوطه به صورت کاملا رایگان برای تمامی کاربران باز است تا پیش از ثبت نام با کیفیت تدریس و عمق فنی مطالب آشنا شوید.',
        },
        {
          question: 'برای اجرای تمرین های فاین تیونینگ به چه سخت افزاری نیاز دارم؟',
          answer:
            'تمامی نوت بوک های دوره به گونه ای تنظیم شده اند که روی Google Colab رایگان (کارت گرافیک T4 با ۱۶ گیگابایت حافظه) یا سرورهای ابری استاندارد قابل اجرا باشند.',
        },
        {
          question: 'آیا پس از خرید دوره به آپدیت های بعدی دسترسی خواهم داشت؟',
          answer:
            'بله، دسترسی دانشجویان به محتوای دوره، کدهای تمرینی و جلسات تکمیلی به صورت دائمی است و شامل پشتیبانی مستقیم پرسش و پاسخ در زیر هر درس می باشد.',
        },
      ],
    },
    {
      id: 'crs-cv-2',
      title: 'بینایی ماشین پیشرفته، تشخیص اشیا بی درنگ و بازسازی سه بعدی',
      slug: 'advanced-computer-vision-3d',
      subtitle: 'طراحی سیستم های بینایی صنعتی، ردیابی چندگانه اشیا و بهینه سازی مدل های تصویری با TensorRT',
      description:
        'در این دوره عملیاتی، معماری های مدرن تشخیص اشیا، قطعه بندی معنایی تصویر (Segmentation)، تخمین عمق تک چشمی و بهینه سازی مدل برای پردازنده های لبه (Edge Devices) را با پروژه های واقعی خط تولید و پایش هوشمند پیاده سازی می کنید.',
      instructorId: 'usr-inst-1',
      instructorName: 'مهندس کسری بهرامی',
      instructorRole: 'مدرس ارشد بینایی ماشین و سیستم های نهفته',
      instructorBio:
        'طراح سیستم های کنترل کیفیت بصری در خطوط تولید صنعتی و متخصص بهینه سازی شبکه های کانولوشنی و ویژن ترنسفورمر روی سخت افزارهای NVIDIA Jetson.',
      instructorAvatar: INSTRUCTOR_AVATAR,
      categoryId: 'cat-cv',
      categoryName: 'بینایی ماشین',
      tags: ['بینایی ماشین', 'تشخیص اشیا', 'TensorRT', 'ViT', 'OpenCV'],
      level: 'پیشرفته',
      durationHours: 32,
      price: 4200000,
      discountPrice: 3360000,
      thumbnail: COURSE_CV_IMAGE,
      thumbnailAlt: 'سیستم اپتیکی سنجش عمق و شبکه هندسی سه بعدی در آزمایشگاه بینایی ماشین متافکر',
      status: 'published',
      prerequisites: [
        'آشنایی با پایتون و کتابخانه OpenCV',
        'درک مفاهیم شبکه های عصبی کانولوشنی (CNN)',
      ],
      outcomes: [
        'آموزش مدل های تشخیص و بخش بندی اشیا روی دیتاست های صنعتی سفارشی',
        'پیاده سازی الگوریتم ردیابی چند شیء (ByteTrack) در جریان های ویدیویی زنده',
        'تبدیل مدل های PyTorch به ONNX و موتور TensorRT با افزایش سرعت ۴ برابری',
      ],
      audience: [
        'مهندسان رباتیک، اتوماسیون صنعتی و اینترنت اشیا',
        'پژوهشگران پردازش تصویر و ویدیو',
      ],
      seoTitle: 'دوره بینایی ماشین پیشرفته و بهینه سازی TensorRT | آکادمی متافکر',
      seoDescription:
        'آموزش عملی تشخیص اشیا بی درنگ، ویژن ترنسفورمر، ردیابی ویدیویی و استقرار مدل های بینایی ماشین روی سخت افزارهای صنعتی.',
      canonicalUrl: '/courses/advanced-computer-vision-3d',
      updatedAt: '2026-09-18T11:20:00.000Z',
      chapters: [
        {
          id: 'ch-cv-1',
          title: 'فصل اول: معماری های ویژن ترنسفورمر و تشخیص دقیق اشیا',
          order: 1,
          lessons: [
            {
              id: 'les-cv-101',
              title: 'مقایسه عملیاتی شبکه های CNN مدرن و Vision Transformers (ViT)',
              order: 1,
              durationMinutes: 38,
              isFree: true,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
              previewSeconds: 180,
              contentSummary:
                'بررسی نحوه تقسیم تصویر به پچ های ۱۶ در ۱۶ و تحلیل Inductive Bias در شبکه های کانولوشنی در برابر مکانیزم توجه سراسری در ViT.',
              codeSnippet: `import torch
import torch.nn as nn

class PatchEmbedding(nn.Module):
    def __init__(self, img_size=224, patch_size=16, in_chans=3, embed_dim=768):
        super().__init__()
        self.proj = nn.Conv2d(in_chans, embed_dim, kernel_size=patch_size, stride=patch_size)

    def forward(self, x):
        x = self.proj(x).flatten(2).transpose(1, 2)
        return x`,
              resources: [
                {
                  id: 'res-cv-101',
                  title: 'نوت بوک مقایسه دقت و سرعت ViT و ConvNeXt',
                  fileType: 'CODE',
                  sizeLabel: '215 KB',
                  downloadUrl: '/api/resources/res-cv-101',
                },
              ],
            },
            {
              id: 'les-cv-102',
              title: 'مهندسی داده های تصویری، برچسب گذاری دقیق و تکنیک های Augmentation پیشرفته',
              order: 2,
              durationMinutes: 44,
              isFree: true,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
              previewSeconds: 180,
              contentSummary:
                'پیاده سازی تکنیک های Mosaic و MixUp برای افزایش مقاومت مدل در برابر تغییرات نور محیطی و زاویه دوربین در محیط های صنعتی.',
            },
            {
              id: 'les-cv-103',
              title: 'قطعه بندی دقیق اشیا با معماری Segment Anything (SAM 2)',
              order: 3,
              durationMinutes: 52,
              isFree: false,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
              previewSeconds: 30,
              contentSummary:
                'استفاده از مدل های بنیادین قطعه بندی تصویر برای استخراج ماسک دقیق قطعات صنعتی بدون نیاز به هزاران نمونه آموزشی.',
            },
          ],
        },
        {
          id: 'ch-cv-2',
          title: 'فصل دوم: ردیابی ویدیویی و شتاب دهی سخت افزاری با TensorRT',
          order: 2,
          lessons: [
            {
              id: 'les-cv-201',
              title: 'ردیابی چندگانه اشیا با فیلتر کالمن و الگوریتم ByteTrack',
              order: 4,
              durationMinutes: 49,
              isFree: false,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4',
              previewSeconds: 30,
              contentSummary:
                'حفظ شناسه یکتای اشیا در زمان انسداد دید (Occlusion) و شمارش دقیق در جریان های ویدیویی ۶۰ فریم بر ثانیه.',
            },
            {
              id: 'les-cv-202',
              title: 'کوانتیزاسیون INT8 و کامپایل مدل با NVIDIA TensorRT',
              order: 5,
              durationMinutes: 61,
              isFree: false,
              type: 'lab',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
              previewSeconds: 30,
              contentSummary:
                'کالیبراسیون لایه ها در دقت INT8 و کاهش زمان استنتاج از ۲۸ میلی ثانیه به ۶ میلی ثانیه روی کارت گرافیک.',
            },
          ],
        },
      ],
      faqs: [
        {
          question: 'آیا در این دوره نحوه کار با دوربین های صنعتی و جریان های RTSP آموزش داده می شود؟',
          answer:
            'بله، در فصل دوم نحوه دریافت پایدار جریان ویدیویی RTSP با مدیریت صف فریم ها و پردازش ناهمگام به طور کامل پیاده سازی می شود.',
        },
      ],
    },
    {
      id: 'crs-agt-3',
      title: 'طراحی ایجنت های هوشمند خودمختار و اتوماسیون فرآیندهای سازمانی',
      slug: 'autonomous-ai-agents-production',
      subtitle: 'معماری گراف های تصمیم گیری، فراخوانی ابزارها (Tool Calling)، حافظه بلندمدت و ارزیابی پایداری ایجنت ها',
      description:
        'در این دوره کاربردی، نحوه طراحی سیستم های چند ایجنتی (Multi-Agent Systems) قابل اعتماد را می آموزید؛ سیستم هایی که می توانند پایگاه های داده را جستجو کنند، کد اجرا نمایند، گزارش های تحلیلی بسازند و با رعایت محدودیت های امنیتی در فرآیندهای واقعی کسب و کار عمل کنند.',
      instructorId: 'usr-admin-1',
      instructorName: 'دکتر افسانه رادمهر',
      instructorRole: 'دکترای هوش مصنوعی و مدیر علمی متافکر',
      instructorBio:
        'پژوهشگر ارشد مدل های زبانی بزرگ و معمار سیستم های تصمیم یار هوشمند سازمانی.',
      instructorAvatar: INSTRUCTOR_AVATAR,
      categoryId: 'cat-tools',
      categoryName: 'ابزارهای هوش مصنوعی',
      tags: ['ایجنت هوشمند', 'Tool Calling', 'اتوماسیون', 'معماری نرم افزار'],
      level: 'متوسط',
      durationHours: 26,
      price: 3400000,
      discountPrice: 2720000,
      thumbnail: COURSE_AGENTS_IMAGE,
      thumbnailAlt: 'ماژول های پردازشی متصل با مسیرهای فیبر نوری نماد معماری چند ایجنتی در متافکر',
      status: 'published',
      prerequisites: [
        'آشنایی با زبان پایتون یا تایپ اسکریپت و مفاهیم وب سرویس های REST',
      ],
      outcomes: [
        'پیاده سازی الگوی ReAct (استدلال و عمل) بدون وابستگی به فریم ورک های سنگین',
        'مدیریت حافظه کوتاه مدت و بلندمدت ایجنت با ساختار گراف و دیتابیس برداری',
        'ایجاد گاردریل های امنیتی برای جلوگیری از Prompt Injection و اجرای دستورات غیرمجاز',
      ],
      audience: [
        'توسعه دهندگان فول استک و مهندسان نرم افزار',
        'معماران سیستم و کارشناسان اتوماسیون فرآیند',
      ],
      seoTitle: 'دوره طراحی ایجنت های هوشمند هوش مصنوعی (AI Agents) | آکادمی متافکر',
      seoDescription:
        'آموزش عملی ساخت ایجنت های هوشمند چندگانه، فراخوانی ابزار، مدیریت حافظه و استقرار امن ایجنت های هوش مصنوعی در سازمان.',
      canonicalUrl: '/courses/autonomous-ai-agents-production',
      updatedAt: '2026-09-25T09:15:00.000Z',
      chapters: [
        {
          id: 'ch-agt-1',
          title: 'فصل اول: معماری ReAct و فراخوانی ساختاریافته ابزارها',
          order: 1,
          lessons: [
            {
              id: 'les-agt-101',
              title: 'معماری حلقه ادراک، استدلال و عمل در ایجنت های مدرن',
              order: 1,
              durationMinutes: 34,
              isFree: true,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
              previewSeconds: 180,
              contentSummary:
                'بررسی تفاوت زنجیره های خطی (Chains) با گراف های تصمیم گیری پویا و نحوه تضمین خروجی JSON معتبر در فراخوانی توابع.',
            },
            {
              id: 'les-agt-102',
              title: 'پیاده سازی Function Calling امن و اعتبارسنجی اسکیما',
              order: 2,
              durationMinutes: 41,
              isFree: true,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
              previewSeconds: 180,
              contentSummary:
                'نحوه اتصال ایجنت به پایگاه داده SQL و سرویس های داخلی با کنترل دسترسی سطح فیلد و مدیریت خطاهای زمان اجرا.',
            },
            {
              id: 'les-agt-103',
              title: 'هماهنگی سیستم های چند ایجنتی (Supervisor & Worker Pattern)',
              order: 3,
              durationMinutes: 53,
              isFree: false,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
              previewSeconds: 30,
              contentSummary:
                'طراحی ایجنت ناظر برای تقسیم وظایف پیچیده بین ایجنت های تحلیلگر داده، نویسنده گزارش و بازبین کیفیت.',
            },
          ],
        },
        {
          id: 'ch-agt-2',
          title: 'فصل دوم: امنیت، ارزیابی کمی و استقرار در محیط عملیاتی',
          order: 2,
          lessons: [
            {
              id: 'les-agt-201',
              title: 'مقابله با حملات Indirect Prompt Injection در ایجنت های متصل به وب',
              order: 4,
              durationMinutes: 46,
              isFree: false,
              type: 'video',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4',
              previewSeconds: 30,
              contentSummary:
                'جداسازی زمینه دستور از داده های خارجی و پیاده سازی تایید انسانی (Human-in-the-Loop) برای عملیات حساس.',
            },
            {
              id: 'les-agt-202',
              title: 'مانیتورینگ تله متری توکن ها، کش معنایی و کنترل هزینه',
              order: 5,
              durationMinutes: 40,
              isFree: false,
              type: 'lab',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
              previewSeconds: 30,
              contentSummary:
                'پیاده سازی Semantic Caching برای کاهش ۴۵ درصدی هزینه فراخوانی مدل در پرسش های تکراری سازمان.',
            },
          ],
        },
      ],
      faqs: [
        {
          question: 'آیا در این دوره وابسته به یک کتابخانه خاص می شویم؟',
          answer:
            'خیر، ابتدا هسته معماری ایجنت را با کد خالص و تمیز پیاده سازی می کنیم تا درک عمیقی از مکانیزم داخلی پیدا کنید و سپس الگوهای استاندارد گراف حالت را بررسی می نماییم.',
        },
      ],
    },
  ];

  const videos: VideoTutorial[] = [
    {
      id: 'vid-1',
      title: 'آموزش جامع مکانیزم Attention و تفاوت Self-Attention با Cross-Attention',
      slug: 'understanding-self-and-cross-attention',
      description:
        'در این ویدیوی آموزشی رایگان، ساختار ریاضی و شهودی مکانیزم توجه در شبکه های ترنسفورمر را گام به گام روی تخته دیجیتال و کد پایتون بررسی می کنیم.',
      categoryId: 'cat-nlp',
      categoryName: 'پردازش زبان طبیعی',
      tags: ['ترنسفورمر', 'یادگیری عمیق', 'Attention', 'PyTorch'],
      durationSeconds: 1640,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail: COURSE_LLM_IMAGE,
      thumbnailAlt: 'ویدیوی آموزشی مکانیزم توجه در شبکه عصبی ترنسفورمر',
      transcript:
        'سلام به همراهان آکادمی هوش مصنوعی متافکر. در این ویدیو می خواهیم یکی از مهم ترین مفاهیم یادگیری عمیق مدرن یعنی مکانیزم توجه یا Attention را بررسی کنیم. در مدل های بازگشتی قدیمی مانند LSTM، اطلاعات کل جمله باید در یک بردار حالت پنهان با طول ثابت فشرده می شد که در جملات طولانی باعث فراموشی اطلاعات ابتدایی می گردید. مکانیزم Self-Attention به هر توکن اجازه می دهد به طور مستقیم با تمام توکن های دیگر در همان دنباله ارتباط برقرار کند و وزن اهمیت هر کدام را از طریق ضرب داخلی بردارهای Query و Key محاسبه نماید. در مقابل، در Cross-Attention بردارهای Query از سمت دیکودر و بردارهای Key و Value از خروجی انکودر یا یک مدالیته دیگر مانند تصویر دریافت می شوند.',
      keyTakeaways: [
        'دلیل تقسیم حاصل ضرب ماتریس های Q و K بر جذر بعد بردار (d_k) برای جلوگیری از اشباع تابع Softmax',
        'تفاوت کاربردی Masked Self-Attention در مدل های تولید متن خودرگرسیو مانند GPT',
        'نقش Cross-Attention در مدل های چندوجهی (Multimodal) و ترجمه ماشینی',
      ],
      isPremium: false,
      status: 'published',
      publishedAt: '2026-08-14T10:00:00.000Z',
      views: 4280,
      instructorName: 'دکتر افسانه رادمهر',
      relatedCourseSlug: 'llm-engineering-transformers',
      seoTitle: 'آموزش ویدیویی رایگان مکانیزم Attention در ترنسفورمر | متافکر',
      seoDescription:
        'ویدیوی آموزشی رایگان بررسی کامل Self-Attention و Cross-Attention به همراه پیاده سازی در PyTorch و متن کامل ویدیو.',
      canonicalUrl: '/videos/understanding-self-and-cross-attention',
    },
    {
      id: 'vid-2',
      title: 'بهینه سازی پایپ لاین RAG برای اسناد فارسی و جدول های پیچیده',
      slug: 'optimizing-persian-rag-pipelines',
      description:
        'چگونه اسناد PDF فارسی، گزارش های مالی و جداول را بدون به هم ریختگی ساختار متنی قطعه بندی (Chunking) و در پایگاه داده برداری نمایه سازی کنیم.',
      categoryId: 'cat-nlp',
      categoryName: 'پردازش زبان طبیعی',
      tags: ['RAG', 'پایگاه داده برداری', 'پردازش متن فارسی'],
      durationSeconds: 1920,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnail: COURSE_AGENTS_IMAGE,
      thumbnailAlt: 'ویدیوی آموزشی بهینه سازی سیستم های RAG فارسی',
      transcript:
        'یکی از پرتکرارترین چالش های تیم های فنی در پیاده سازی سیستم های RAG فارسی، افت شدید دقت بازیابی در زمان کار با فایل های PDF و جداول سازمانی است. در این آموزش عملی، سه تکنیک کلیدی را پیاده سازی می کنیم: اول، استخراج ساختارمند متن با حفظ سلسله مراتب سرتیترها؛ دوم، استفاده از Semantic Chunking با همپوشانی پویا؛ و سوم، ترکیب جستجوی واژگانی BM25 با مدل های امبدینگ چندزبانه برای یافتن دقیق عبارات تخصصی و شماره قوانین.',
      keyTakeaways: [
        'چرا قطعه بندی با طول ثابت (Fixed-size Chunking) زمینه معنایی جملات فارسی را تخریب می کند',
        'پیاده سازی الگوریتم Reciprocal Rank Fusion (RRF) برای ادغام نتایج جستجوی واژگانی و برداری',
        'ارزیابی کمی پایپ لاین RAG با معیارهای Context Recall و Faithfulness',
      ],
      isPremium: false,
      status: 'published',
      publishedAt: '2026-09-02T15:30:00.000Z',
      views: 3190,
      instructorName: 'دکتر افسانه رادمهر',
      relatedCourseSlug: 'llm-engineering-transformers',
      seoTitle: 'آموزش ویدیویی بهینه سازی سیستم RAG برای متون فارسی | متافکر',
      seoDescription:
        'آموزش عملی قطعه بندی معنایی متون فارسی، جستجوی ترکیبی BM25 و برداری و افزایش دقت بازیابی در سیستم های RAG.',
      canonicalUrl: '/videos/optimizing-persian-rag-pipelines',
    },
    {
      id: 'vid-3',
      title: 'کالبدشکافی تخمین عمق سه بعدی از تصاویر دوربین های صنعتی',
      slug: 'industrial-3d-depth-estimation-tutorial',
      description:
        'آشنایی عملی با کالیبراسیون دوربین استریو، محاسبه نقشه اختلاف منظر (Disparity Map) و ترکیب آن با شبکه های عصبی تخمین عمق تک چشمی.',
      categoryId: 'cat-cv',
      categoryName: 'بینایی ماشین',
      tags: ['بینایی ماشین', 'تخمین عمق', 'پردازش تصویر سه بعدی'],
      durationSeconds: 1480,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnail: COURSE_CV_IMAGE,
      thumbnailAlt: 'ویدیوی آموزشی تخمین عمق سه بعدی در بینایی ماشین',
      transcript:
        'در کاربردهای رباتیک و بازرسی صنعتی، دانستن مختصات دو بعدی شیء در تصویر کافی نیست و ما نیازمند فاصله دقیق هر پیکسل تا لنز دوربین هستیم. در این جلسه، هندسه اپی پولار در دوربین های استریو را بررسی کرده و نحوه استخراج ابر نقاط سه بعدی (Point Cloud) را به صورت بی درنگ آزمایش می کنیم.',
      keyTakeaways: [
        'فرمول رابطه معکوس بین عمق (Z) و میزان جابجایی پیکسل ها (Disparity)',
        'حذف نویزهای لبه تصویر با فیلترهای دوطرفه در نقشه های عمق صنعتی',
      ],
      isPremium: false,
      status: 'published',
      publishedAt: '2026-09-12T11:00:00.000Z',
      views: 2740,
      instructorName: 'مهندس کسری بهرامی',
      relatedCourseSlug: 'advanced-computer-vision-3d',
      seoTitle: 'آموزش ویدیویی تخمین عمق سه بعدی در بینایی ماشین | متافکر',
      seoDescription:
        'ویدیوی آموزشی رایگان نحوه محاسبه نقشه عمق و ابر نقاط سه بعدی با دوربین های استریو و شبکه های عصبی عمیق.',
      canonicalUrl: '/videos/industrial-3d-depth-estimation-tutorial',
    },
    {
      id: 'vid-4',
      title: 'معماری گاردریل های امنیتی برای ایجنت های متصل به پایگاه داده',
      slug: 'security-guardrails-for-sql-ai-agents',
      description:
        'چگونه مانع از اجرای کوئری های مخرب و نشت اطلاعات حساس در زمان اتصال مدل های زبانی به پایگاه های داده سازمانی شویم.',
      categoryId: 'cat-tools',
      categoryName: 'ابزارهای هوش مصنوعی',
      tags: ['امنیت هوش مصنوعی', 'ایجنت هوشمند', 'SQL', 'مهندسی نرم افزار'],
      durationSeconds: 1350,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4',
      thumbnail: HERO_STUDIO_IMAGE,
      thumbnailAlt: 'ویدیوی آموزشی امنیت ایجنت های هوش مصنوعی متصل به دیتابیس',
      transcript:
        'زمانی که به یک مدل زبانی اجازه می دهید کوئری SQL تولید و اجرا کند، هرگونه آسیب پذیری Prompt Injection می تواند به حذف جداول یا دسترسی غیرمجاز به اطلاعات کاربران دیگر منجر شود. در این ویدیو، معماری دفاع در عمق شامل پارس کردن درخت سینتکس SQL (AST Validation)، اتصال با کاربر فقط خواندنی (Read-Only Role) و اعمال Row-Level Security را پیاده سازی می کنیم.',
      keyTakeaways: [
        'مسدودسازی دستورات DDL و DML در لایه میان افزار پیش از ارسال به دیتابیس',
        'تزریق خودکار شناسه کاربر احراز هویت شده در شرط WHERE در سمت سرور',
      ],
      isPremium: false,
      status: 'published',
      publishedAt: '2026-09-28T09:00:00.000Z',
      views: 1985,
      instructorName: 'دکتر افسانه رادمهر',
      relatedCourseSlug: 'autonomous-ai-agents-production',
      seoTitle: 'آموزش امنیت ایجنت های هوش مصنوعی متصل به دیتابیس SQL | متافکر',
      seoDescription:
        'راهکارهای مهندسی برای جلوگیری از Prompt Injection و اجرای امن کوئری در ایجنت های هوش مصنوعی سازمانی.',
      canonicalUrl: '/videos/security-guardrails-for-sql-ai-agents',
    },
  ];

  const articles: Article[] = [
    {
      id: 'art-1',
      title: 'تحلیل عمیق الگوریتم FlashAttention و بهینه سازی حافظه HBM در آموزش مدل های زبانی',
      slug: 'deep-dive-flash-attention-memory-hierarchy',
      excerpt:
        'بررسی گلوگاه پهنای باند حافظه در محاسبات استاندارد Self-Attention و نحوه استفاده از تکنیک Tiling و Online Softmax برای افزایش سرعت ۳ برابری بدون تقریب زدن.',
      authorName: 'دکتر افسانه رادمهر',
      authorRole: 'مدیر علمی آکادمی متافکر',
      categoryId: 'cat-nlp',
      categoryName: 'پردازش زبان طبیعی',
      tags: ['ترنسفورمر', 'FlashAttention', 'بهینه سازی GPU', 'یادگیری عمیق'],
      readTimeMinutes: 11,
      thumbnail: COURSE_LLM_IMAGE,
      thumbnailAlt: 'معماری سلسله مراتب حافظه GPU و الگوریتم FlashAttention',
      status: 'published',
      publishedAt: '2026-09-10T08:30:00.000Z',
      seoTitle: 'مقاله تخصصی الگوریتم FlashAttention و بهینه سازی حافظه GPU | متافکر',
      seoDescription:
        'بررسی فنی الگوریتم FlashAttention، نحوه کاهش خواندن و نوشتن در حافظه HBM کارت گرافیک و اجرای محاسبات دقیق مکانیزم توجه در SRAM.',
      canonicalUrl: '/articles/deep-dive-flash-attention-memory-hierarchy',
      relatedCourseSlug: 'llm-engineering-transformers',
      relatedVideoSlug: 'understanding-self-and-cross-attention',
      ratingAvg: 4.9,
      ratingCount: 47,
      sections: [
        {
          id: 'sec-1',
          heading: 'چرا مکانیزم توجه استاندارد در دنباله های بلند با کمبود حافظه مواجه می شود؟',
          body: 'در پیاده سازی کلاسیک مکانیزم Self-Attention، برای دنباله ای به طول N، ماتریس شباهت S = QK^T دارای ابعاد N در N است. هنگامی که طول زمینه (Context Length) از ۴ هزار توکن به ۳۲ هزار توکن افزایش می یابد، اندازه این ماتریس میانی ۶۴ برابر بزرگ تر می شود. نکته کلیدی این است که گلوگاه اصلی در کارت های گرافیک مدرن، توان محاسباتی (FLOPs) نیست، بلکه پهنای باند انتقال داده بین حافظه اصلی گرافیک (HBM) و حافظه فوق سریع روی تراشه (SRAM) است.',
        },
        {
          id: 'sec-2',
          heading: 'تکنیک Tiling و محاسبه مرحله ای Online Softmax',
          body: 'الگوریتم FlashAttention به جای نوشتن ماتریس کامل N در N در حافظه کندتر HBM، ماتریس های ورودی Q، K و V را به بلوک های کوچک تر تقسیم می کند که به طور کامل درون حافظه سریع SRAM جای می گیرند. چالش ریاضی اصلی در این روش، تابع Softmax است که به مجموع کل سطر نیاز دارد. با نگه داشتن بیشینه محلی (m) و ضریب نرمال سازی تجمعی (l)، می توان خروجی دقیق را در یک بار پیمایش محاسبه کرد.',
          codeBlock: `def online_softmax_step(prev_max, prev_sum, current_scores_block):
    block_max = current_scores_block.max(dim=-1, keepdim=True).values
    new_max = torch.maximum(prev_max, block_max)
    exp_prev = torch.exp(prev_max - new_max) * prev_sum
    exp_curr = torch.exp(current_scores_block - new_max).sum(dim=-1, keepdim=True)
    new_sum = exp_prev + exp_curr
    return new_max, new_sum`,
        },
        {
          id: 'sec-3',
          heading: 'نتایج تجربی در آموزش مدل های زبانی فارسی',
          body: 'در آزمایشگاه آکادمی متافکر، فعال سازی کرنل FlashAttention-2 در زمان فاین تیونینگ مدل های ۸ میلیارد پارامتری با طول زمینه ۸۱۹۲ توکن، مصرف حافظه VRAM را تا ۵۸ درصد کاهش داد و توان عملیاتی پردازش توکن در ثانیه را ۲.۷ برابر افزایش داد.',
        },
      ],
    },
    {
      id: 'art-2',
      title: 'معماری سیستم های بازیابی دانش ترکیبی (Hybrid RAG) برای مستندات فنی و حقوقی فارسی',
      slug: 'hybrid-rag-architecture-persian-documents',
      excerpt:
        'راهنمای مهندسی ترکیب جستجوی واژگانی BM25 با امبدینگ های متراکم و مدل های بازرتبه بندی (Cross-Encoder Reranker) برای رسیدن به دقت بالای ۹۲ درصد.',
      authorName: 'دکتر افسانه رادمهر',
      authorRole: 'مدیر علمی آکادمی متافکر',
      categoryId: 'cat-nlp',
      categoryName: 'پردازش زبان طبیعی',
      tags: ['RAG', 'جستجوی معنایی', 'پردازش زبان طبیعی', 'مهندسی هوش مصنوعی'],
      readTimeMinutes: 9,
      thumbnail: COURSE_AGENTS_IMAGE,
      thumbnailAlt: 'دیاگرام معماری Hybrid RAG در مقالات تخصصی متافکر',
      status: 'published',
      publishedAt: '2026-09-19T10:15:00.000Z',
      seoTitle: 'معماری سیستم Hybrid RAG برای اسناد فارسی | مقالات تخصصی متافکر',
      seoDescription:
        'آموزش گام به گام طراحی سیستم های RAG ترکیبی برای زبان فارسی شامل نرمال سازی متن، ادغام RRF و بازرتبه بندی نتایج.',
      canonicalUrl: '/articles/hybrid-rag-architecture-persian-documents',
      relatedCourseSlug: 'llm-engineering-transformers',
      relatedVideoSlug: 'optimizing-persian-rag-pipelines',
      ratingAvg: 4.8,
      ratingCount: 38,
      sections: [
        {
          id: 'sec-201',
          heading: 'محدودیت جستجوی صرفا برداری در عبارات تخصصی و کدهای استاندارد',
          body: 'مدل های امبدینگ متراکم (Dense Embeddings) در درک مفاهیم کلی بسیار توانمند هستند، اما زمانی که کاربر به دنبال شماره یک ماده قانونی خاص، کد خطای صنعتی یا نام دقیق یک قطعه فنی می گردد، جستجوی واژگانی مبتنی بر فرکانس واژه (BM25) عملکرد بسیار دقیق تری از خود نشان می دهد.',
        },
        {
          id: 'sec-202',
          heading: 'الگوریتم Reciprocal Rank Fusion (RRF) برای ادغام رتبه ها',
          body: 'از آنجا که امتیاز خروجی BM25 بدون کران است و امتیاز شباهت کسینوسی بین منفی یک و مثبت یک قرار دارد، جمع مستقیم این دو عدد از نظر ریاضی نادرست است. الگوریتم RRF با تکیه بر رتبه هر سند در هر دو لیست، امتیازی پایدار و بدون نیاز به تنظیم وزن های پیچیده تولید می کند.',
          codeBlock: `def reciprocal_rank_fusion(bm25_ranked_ids: list[str], vector_ranked_ids: list[str], k: int = 60):
    scores: dict[str, float] = {}
    for rank, doc_id in enumerate(bm25_ranked_ids, start=1):
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    for rank, doc_id in enumerate(vector_ranked_ids, start=1):
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda item: item[1], reverse=True)`,
        },
      ],
    },
    {
      id: 'art-3',
      title: 'کوانتیزاسیون شبکه های بینایی ماشین از FP32 به INT8 بدون افت دقت در خطوط تولید',
      slug: 'fp32-to-int8-quantization-computer-vision',
      excerpt:
        'مقایسه فنی روش های Post-Training Quantization (PTQ) و Quantization-Aware Training (QAT) به همراه کالیبراسیون آنتروپی در TensorRT.',
      authorName: 'مهندس کسری بهرامی',
      authorRole: 'مدرس ارشد بینایی ماشین',
      categoryId: 'cat-cv',
      categoryName: 'بینایی ماشین',
      tags: ['بینایی ماشین', 'کوانتیزاسیون', 'TensorRT', 'سخت افزار لبه'],
      readTimeMinutes: 8,
      thumbnail: COURSE_CV_IMAGE,
      thumbnailAlt: 'تست کوانتیزاسیون مدل های بینایی ماشین در آزمایشگاه متافکر',
      status: 'published',
      publishedAt: '2026-09-24T13:00:00.000Z',
      seoTitle: 'کوانتیزاسیون INT8 در مدل های بینایی ماشین | آکادمی متافکر',
      seoDescription:
        'راهنمای عملی کاهش حجم و افزایش سرعت شبکه های عصبی تصویری با کوانتیزاسیون INT8 و کالیبراسیون Kullback-Leibler.',
      canonicalUrl: '/articles/fp32-to-int8-quantization-computer-vision',
      relatedCourseSlug: 'advanced-computer-vision-3d',
      relatedVideoSlug: 'industrial-3d-depth-estimation-tutorial',
      ratingAvg: 4.9,
      ratingCount: 29,
      sections: [
        {
          id: 'sec-301',
          heading: 'نگاشت خطی مقادیر اعشاری به اعداد صحیح ۸ بیتی',
          body: 'در کوانتیزاسیون متقارن، بازه اعداد اعشاری وزن ها و فعال سازی ها با استفاده از یک ضریب مقیاس (Scale Factor) به بازه منفی ۱۲۸ تا مثبت ۱۲۷ نگاشت می شود. انتخاب صحیح آستانه برش (Clipping Threshold) برای جلوگیری از تاثیر مقادیر پرت (Outliers) حیاتی است.',
        },
        {
          id: 'sec-302',
          heading: 'کالیبراسیون مبتنی بر واگرایی کولبک-لیبلر (KL Divergence)',
          body: 'برای اینکه توزیع احتمال فعال سازی ها پس از کوانتیزاسیون کمترین فاصله اطلاعاتی را با توزیع FP32 اصلی داشته باشد، از یک دیتاست کالیبراسیون شامل ۵۰۰ تصویر واقعی خط تولید استفاده کرده و آستانه ای را انتخاب می کنیم که واگرایی KL را کمینه سازد.',
        },
      ],
    },
  ];

  const portfolioProjects: PortfolioProject[] = [
    {
      id: 'prf-1',
      title: 'سامانه تحلیل و بازیابی هوشمند قوانین مالیاتی و بخشنامه های سازمانی (ParsLegal-RAG)',
      slug: 'parslegal-rag-enterprise-search',
      studentName: 'آرمان فرهادی',
      rollNumber: 'MF-1404-812',
      cohort: 'دوره چهارم مهندسی LLM',
      discipline: 'پردازش زبان طبیعی و بازیابی دانش',
      summary:
        'طراحی و استقرار موتور جستجوی معنایی و پاسخگویی مستند روی بیش از ۴۸ هزار صفحه بخشنامه رسمی با استناد دقیق به شماره ماده و بند قانونی.',
      problemStatement:
        'کارشناسان حقوقی و مالی برای یافتن آخرین اصلاحیه های بخشنامه ها به طور میانگین ۲۴ دقیقه زمان صرف جستجوی دستی در فایل های PDF اسکن شده می کردند.',
      architectureDetails:
        'استفاده از پایپ لاین OCR ساختاریافته، جستجوی ترکیبی BM25 + امبدینگ چندزبانه، بازرتبه بندی با Cross-Encoder و تولید پاسخ مقید به منبع (Grounded Generation).',
      outcomeMetric: 'کاهش زمان جستجوی کارشناسان از ۲۴ دقیقه به ۱۱ ثانیه با دقت استناد ۹۴.۶ درصد در بازه ۳ ماهه',
      technologies: ['PyTorch', 'vLLM', 'Qdrant', 'FastAPI', 'Hybrid Search'],
      thumbnail: COURSE_LLM_IMAGE,
      thumbnailAlt: 'پروژه سامانه هوشمند بازیابی قوانین فارسی در پورتفولیو متافکر',
      colSpan: 2,
      relatedCourseSlug: 'llm-engineering-transformers',
      interactiveDemoConfig: {
        inputPrompt: 'نحوه محاسبه معافیت مالیاتی شرکت های دانش بنیان نوع یک در سال ۱۴۰۴ چگونه است؟',
        modelName: 'MetaFekr-Legal-8B-QLoRA',
        tokenLatencyMs: 38,
        accuracyScore: '94.6% Grounded Faithfulness',
        sampleOutput:
          'بر اساس ماده ۳ قانون حمایت از شرکت های دانش بنیان و بخشنامه شماره ۲۰۰/۱۴۰۴/۱۲، درآمدهای ناشی از قراردادهای پژوهشی و تولید کالاهای دانش بنیان تایید شده توسط کارگروه، به مدت ۱۵ سال مشمول معافیت مالیاتی با نرخ صفر می باشند. [استناد: بخشنامه ۱۴۰۴/بند ۴]',
      },
    },
    {
      id: 'prf-2',
      title: 'سیستم بازرسی اپتیکی بی درنگ تشخیص میکروترک در قطعات ریخته گری خودرو',
      slug: 'realtime-optical-defect-inspection',
      studentName: 'نگار سرافراز',
      rollNumber: 'MF-1404-609',
      cohort: 'دوره سوم بینایی ماشین صنعتی',
      discipline: 'بینایی ماشین و سیستم های نهفته',
      summary:
        'پیاده سازی شبکه تشخیص عیوب سطحی روی پردازنده صنعتی NVIDIA Jetson Orin با نرخ پردازش ۷۵ قطعه در دقیقه در خط تولید.',
      problemStatement:
        'بازرسی چشمی قطعات فلزی در شیفت های طولانی منجر به خطای انسانی ۸ درصدی در تشخیص ترک های زیر ۰.۴ میلی متر می شد.',
      architectureDetails:
        'تصویربرداری با نورپردازی زاویه دار (Dark-Field Illumination)، شبکه بخش بندی بهینه شده در دقت INT8 با TensorRT و فرمان مستقیم به بازوی پنوماتیک جداساز.',
      outcomeMetric: 'دقت تشخیص ۹۹.۲ درصد و کاهش ۷۸ درصدی ضایعات برگشتی خط مونتاژ در ۶ ماه نخست استقرار',
      technologies: ['PyTorch', 'TensorRT INT8', 'OpenCV', 'C++', 'NVIDIA Jetson'],
      thumbnail: COURSE_CV_IMAGE,
      thumbnailAlt: 'پروژه بازرسی اپتیکی قطعات صنعتی با بینایی ماشین',
      colSpan: 1,
      relatedCourseSlug: 'advanced-computer-vision-3d',
      interactiveDemoConfig: {
        inputPrompt: 'آنالیز فریم دوربین استریو شماره ۰۴ - قطعه آلومینیومی سری A380',
        modelName: 'MetaFekr-DefectSeg-TRT-INT8',
        tokenLatencyMs: 6,
        accuracyScore: '99.2% mAP@50',
        sampleOutput:
          'وضعیت قطعه: سلامت کامل تایید شد (NOMINAL). هیچ گونه میکروترک یا حفره سطحی در ناحیه ROI-1 تا ROI-4 مشاهده نگردید. زمان استنتاج: ۶.۲ میلی ثانیه.',
      },
    },
    {
      id: 'prf-3',
      title: 'چارچوب چند ایجنتی پایش خودکار رخدادهای زیرساخت ابری و تحلیل ریشه ای خطا (RCA)',
      slug: 'multi-agent-cloud-incident-rca',
      studentName: 'سهراب کاظمی',
      rollNumber: 'MF-1404-734',
      cohort: 'دوره دوم مهندسی ایجنت های هوشمند',
      discipline: 'ایجنت های خودمختار و مهندسی قابلیت اطمینان',
      summary:
        'طراحی تیم ایجنت های همکار برای بررسی لاگ های سرویس ها، همبستگی متریک های Prometheus و پیشنهاد پچ اصلاحی در زمان بروز خطا.',
      problemStatement:
        'در زمان بروز خطا در میکروسرویس ها، بررسی همزمان لاگ ها و تریس های توزیع شده بیش از ۴۵ دقیقه زمان از تیم عملیات (SRE) می گرفت.',
      architectureDetails:
        'معماری گراف حالت با سه ایجنت تخصصی (تحلیلگر لاگ، بررسی کننده تغییرات گیت و ناظر امنیتی) همراه با تایید انسانی پیش از اعمال تغییرات.',
      outcomeMetric: 'کاهش میانگین زمان تشخیص ریشه خطا (MTTD) به میزان ۶۲ درصد در محیط عملیاتی',
      technologies: ['TypeScript', 'ReAct Graph', 'OpenTelemetry', 'Docker'],
      thumbnail: COURSE_AGENTS_IMAGE,
      thumbnailAlt: 'پروژه چارچوب چند ایجنتی تحلیل رخدادهای ابری',
      colSpan: 1,
      relatedCourseSlug: 'autonomous-ai-agents-production',
      interactiveDemoConfig: {
        inputPrompt: 'تحلیل افزایش ناگهانی خطای HTTP 502 در سرویس پرداخت در بازه ۱۴:۱۰ تا ۱۴:۱۵',
        modelName: 'MetaFekr-SRE-Orchestrator',
        tokenLatencyMs: 24,
        accuracyScore: '91.8% Root-Cause Match',
        sampleOutput:
          'علت ریشه ای شناسایی شده: اشباع استخر اتصالات دیتابیس (Connection Pool Exhaustion) پس از استقرار نسخه v2.14. پیشنهاد اصلاحی: افزایش max_connections به ۵۰ و بازگردانی موقت کانفیگ سرویس.',
      },
    },
  ];

  const enrollments: Enrollment[] = [
    {
      id: 'enr-1',
      userId: 'usr-stu-1',
      courseId: 'crs-agt-3',
      status: 'active',
      enrolledAt: '2026-09-16T10:00:00.000Z',
      expiresAt: '2029-09-16T10:00:00.000Z',
      completedLessonIds: ['les-agt-101', 'les-agt-102', 'les-agt-103'],
      lastWatchedLessonId: 'les-agt-103',
      lessonNotes: {
        'les-agt-101': 'نکته مهم: همیشه خروجی فراخوانی ابزار را با اسکیما در سمت سرور اعتبارسنجی کنیم.',
      },
    },
  ];

  const orders: Order[] = [
    {
      id: 'ord-1001',
      referenceCode: 'MF-ORD-88412',
      userId: 'usr-stu-1',
      userEmail: 'student@metafekr.ir',
      userName: 'آرمان فرهادی',
      courseId: 'crs-agt-3',
      courseTitle: 'طراحی ایجنت های هوشمند خودمختار و اتوماسیون فرآیندهای سازمانی',
      originalAmount: 3400000,
      discountAmount: 680000,
      finalAmount: 2720000,
      gateway: 'zarinpal',
      status: 'paid',
      authority: 'A00000000000000000000000000491827364',
      refId: '49182736401',
      createdAt: '2026-09-16T09:58:00.000Z',
      paidAt: '2026-09-16T10:00:00.000Z',
    },
  ];

  const coupons: Coupon[] = [
    {
      id: 'cpn-1',
      code: 'METAFEKR20',
      discountPercent: 20,
      maxUses: 200,
      usedCount: 14,
      active: true,
      expiresAt: '2027-12-30T23:59:59.000Z',
    },
    {
      id: 'cpn-2',
      code: 'GRANT100',
      discountPercent: 100,
      maxUses: 50,
      usedCount: 3,
      active: true,
      expiresAt: '2027-12-30T23:59:59.000Z',
    },
  ];

  const comments: CommentItem[] = [
    {
      id: 'cmt-1',
      targetType: 'lesson',
      targetId: 'les-llm-101',
      userName: 'آرمان فرهادی',
      userRole: 'student',
      content:
        'توضیحات مربوط به مقیاس بندی ضرب داخلی بر اساس جذر بعد کلید بسیار شفاف بود. آیا در مدل های جدیدتر از فاکتور مقیاس متفاوتی استفاده می شود؟',
      createdAt: '2026-09-21T16:40:00.000Z',
      answer:
        'سپاس از دقت نظر شما آرمان عزیز. در اغلب معماری های استاندارد همچنان از همان ضریب یک تقسیم بر جذر d_k استفاده می شود، اما در برخی مدل های با طول زمینه بسیار بلند (Long-Context)، ضریب مقیاس لگاریتمی متناسب با طول دنباله نیز اعمال می گردد.',
    },
    {
      id: 'cmt-2',
      targetType: 'article',
      targetId: 'art-1',
      userName: 'مهندس کسری بهرامی',
      userRole: 'instructor',
      content:
        'مقاله بسیار دقیقی بود. بخش مقایسه پهنای باند حافظه HBM و SRAM به خوبی علت اصلی سرعت بالای FlashAttention را روشن می کند.',
      createdAt: '2026-09-14T11:20:00.000Z',
    },
  ];

  const siteSettings: SiteSettings = {
    siteTitle: 'متافکر | آکادمی تخصصی آموزش هوش مصنوعی و مهندسی یادگیری ماشین',
    siteDescription:
      'پلتفرم جامع آموزش هوش مصنوعی متافکر شامل دوره های تخصصی پروژه محور، ویدیو های آموزشی رایگان، مقالات علمی و نمونه پروژه های هوش مصنوعی.',
    contactEmail: 'info@metafekr.ir',
    contactPhone: '021-88942100',
    address: 'تهران، بلوار کشاورز، پژوهشکده فناوری های نوین و هوش مصنوعی متافکر',
    zarinpalMerchantConfigured: Boolean(process.env.ZARINPAL_MERCHANT_ID && process.env.ZARINPAL_MERCHANT_ID.trim().length === 36),
    defaultCanonicalBase: process.env.APP_URL || 'https://metafekr.ir',
    redirects: [
      {
        id: 'red-1',
        fromPath: '/old-llm-course',
        toPath: '/courses/llm-engineering-transformers',
        statusCode: 301,
      },
    ],
  };

  return {
    users,
    courses,
    videos,
    articles,
    portfolioProjects,
    enrollments,
    orders,
    coupons,
    comments,
    siteSettings,
  };
}
