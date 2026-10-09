import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Cpu, Layers, RotateCcw, Sliders } from 'lucide-react';

type QuantizationMode = 'FP16' | 'INT8' | 'NF4';

export const InteractiveAISandbox: React.FC<{
  onExploreCourse: (slug: string) => void;
}> = ({ onExploreCourse }) => {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [contextTokens, setContextTokens] = useState<number>(8192);
  const [quantization, setQuantization] = useState<QuantizationMode>('NF4');
  const [flashAttention, setFlashAttention] = useState<boolean>(true);
  const [hybridAlpha, setHybridAlpha] = useState<number>(65); // 0 = pure BM25, 100 = pure Dense Vector

  const metrics = useMemo(() => {
    // 8B model base weight memory
    const weightGb =
      quantization === 'FP16' ? 16.0 : quantization === 'INT8' ? 8.5 : 4.8;

    // KV Cache + Attention activation overhead
    const contextFactor = contextTokens / 4096;
    const attentionOverheadGb = flashAttention
      ? contextFactor * 1.15
      : Math.pow(contextFactor, 1.75) * 3.4;

    const totalVramGb = Number((weightGb + attentionOverheadGb).toFixed(1));

    // Throughput calculation (tokens/sec)
    const baseTps =
      quantization === 'FP16' ? 42 : quantization === 'INT8' ? 68 : 84;
    const flashMultiplier = flashAttention ? 1.55 : 0.72;
    const contextPenalty = Math.max(0.45, 1.15 - contextTokens / 42000);
    const throughputTps = Math.round(baseTps * flashMultiplier * contextPenalty);

    // Persian RAG Retrieval Faithfulness (%)
    // Optimal hybrid alpha around 60-70% dense + 30-40% lexical BM25
    const distanceFromOptimal = Math.abs(hybridAlpha - 65);
    const ragAccuracy = Number((94.8 - distanceFromOptimal * 0.22).toFixed(1));

    const vramNominal = totalVramGb <= 16.0;

    return {
      weightGb,
      attentionOverheadGb: Number(attentionOverheadGb.toFixed(1)),
      totalVramGb,
      throughputTps,
      ragAccuracy,
      vramNominal,
    };
  }, [contextTokens, quantization, flashAttention, hybridAlpha]);

  const applyPresetStage = (targetStage: 1 | 2 | 3) => {
    setStage(targetStage);
    if (targetStage === 1) {
      setContextTokens(4096);
      setQuantization('FP16');
      setFlashAttention(false);
      setHybridAlpha(100);
    } else if (targetStage === 2) {
      setContextTokens(16384);
      setQuantization('NF4');
      setFlashAttention(true);
      setHybridAlpha(80);
    } else {
      setContextTokens(8192);
      setQuantization('NF4');
      setFlashAttention(true);
      setHybridAlpha(65);
    }
  };

  return (
    <section
      aria-labelledby="sandbox-heading"
      className="py-16 border-b border-slate-200 bg-white"
    >
      <div className="max-w-[1360px] mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold text-blue-800 mb-2">
              آزمایشگاه تعاملی مهندسی هوش مصنوعی متافکر
            </p>
            <h2
              id="sandbox-heading"
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
            >
              شبیه ساز معماری ترنسفورمر، مصرف حافظه گرافیک و بازیابی ترکیبی (RAG)
            </h2>
          </div>

          {/* Progressive Disclosure Learning Stages */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => applyPresetStage(1)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stage === 1
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مرحله ۱: حالت پایه (FP16 استاندارد)
            </button>
            <button
              type="button"
              onClick={() => applyPresetStage(2)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stage === 2
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مرحله ۲: زمینه بلند و FlashAttention
            </button>
            <button
              type="button"
              onClick={() => applyPresetStage(3)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stage === 3
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مرحله ۳: تنظیمات بهینه صنعتی متافکر
            </button>
          </div>
        </div>

        {/* Two-Zone Sandbox Layout (60-65% Interactive Stage + 35-40% Control Deck) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Zone A: Interactive Stage (7 columns on desktop) */}
          <div className="lg:col-span-7 bg-[#0F172A] text-slate-100 rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-slate-800">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    توپولوژی پایپ لاین استنتاج (مدل ۸ میلیارد پارامتری)
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    پایش زنده تله متری حافظه VRAM و دقت بازیابی اسناد فارسی
                  </h3>
                </div>

                {/* Semantic State Indicator with Explicit Icon + Label (Never hue-only) */}
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tabular-nums ${
                    metrics.vramNominal
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/80'
                      : 'bg-red-950/90 text-red-300 border border-red-800/80'
                  }`}
                >
                  {metrics.vramNominal ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>وضعیت حافظه: بهینه (قابل اجرا روی GPU 16GB)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>وضعیت حافظه: فراتر از مرز 16GB (نیازمند سرور A100)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Pipeline Flow Nodes Visualization */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>۱. جستجوی ترکیبی RRF</span>
                    <Layers className="w-4 h-4 text-sky-400" />
                  </div>
                  <p className="text-sm font-bold text-white tabular-nums mb-1">
                    {hybridAlpha}% برداری · {100 - hybridAlpha}% واژگانی
                  </p>
                  <p className="text-xs text-slate-400">
                    دقت بازیابی: <strong className="text-sky-300 tabular-nums">{metrics.ragAccuracy}%</strong>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>۲. کرنل محاسبات توجه</span>
                    <Cpu className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-sm font-bold text-white mb-1">
                    {flashAttention ? 'FlashAttention-2 (SRAM)' : 'Attention استاندارد (HBM)'}
                  </p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    سربار KV: <strong className="text-amber-300">{metrics.attentionOverheadGb} GB</strong>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>۳. موتور استنتاج کوانتیزه</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-white tabular-nums mb-1">
                    دقت وزنی {quantization}
                  </p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    سرعت: <strong className="text-emerald-300">{metrics.throughputTps} توکن/ثانیه</strong>
                  </p>
                </div>
              </div>

              {/* Comparative Scaling Bars */}
              <div className="space-y-5 bg-slate-900/60 p-5 rounded-xl border border-slate-800/90">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-300 font-medium">
                      مصرف کل حافظه گرافیک (VRAM Footprint) در برابر سقف 16.0 گیگابایت
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-white">
                      {metrics.totalVramGb} GB / 24.0 GB Max
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.min(100, (metrics.weightGb / 24) * 100)}%` }}
                      className="bg-sky-500 transition-all duration-200"
                      title="حافظه وزن های مدل"
                    />
                    <div
                      style={{ width: `${Math.min(100, (metrics.attentionOverheadGb / 24) * 100)}%` }}
                      className={`${
                        metrics.vramNominal ? 'bg-emerald-400' : 'bg-rose-500'
                      } transition-all duration-200`}
                      title="سربار ماتریس توجه و KV Cache"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 tabular-nums">
                    <span>وزن های مدل: {metrics.weightGb} GB</span>
                    <span>کش توجه و زمینه: {metrics.attentionOverheadGb} GB</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-300 font-medium">
                      توان عملیاتی تولید توکن (Inference Throughput)
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-emerald-300">
                      {metrics.throughputTps} tokens/sec
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (metrics.throughputTps / 140) * 100)}%` }}
                      className="h-full bg-emerald-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-300 font-medium">
                      وفاداری پاسخ به اسناد مرجع فارسی (Grounded RAG Faithfulness)
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-amber-300">
                      {metrics.ragAccuracy}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${metrics.ragAccuracy}%` }}
                      className="h-full bg-amber-400 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mathematical Formula Callout */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-300">
                <span className="text-slate-400 block mb-1">رابطه ریاضی فعال در شبیه ساز:</span>
                <code className="font-mono text-sky-300 text-xs">
                  Attention(Q, K, V) = softmax((Q · K^T) / sqrt(d_k)) · V
                </code>
              </div>
              <button
                type="button"
                onClick={() => onExploreCourse('llm-engineering-transformers')}
                className="px-4 py-2 text-xs font-semibold bg-[#EA580C] hover:bg-orange-700 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                مشاهده سرفصل های این دوره
              </button>
            </div>
          </div>

          {/* Zone B: Control & Concept Deck (5 columns on desktop) */}
          <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-800" />
                  <h3 className="text-base font-bold text-slate-900">
                    متغیرهای کنترلی معماری مدل
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => applyPresetStage(3)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازنشانی به حالت بهینه</span>
                </button>
              </div>

              {/* Control 1: Context Window Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-800 mb-2">
                  <label htmlFor="context-slider">طول پنجره زمینه (Context Length):</label>
                  <span className="font-mono tabular-nums text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                    {contextTokens.toLocaleString('en-US')} tokens
                  </span>
                </div>
                <input
                  id="context-slider"
                  type="range"
                  min={2048}
                  max={32768}
                  step={2048}
                  value={contextTokens}
                  onChange={(e) => setContextTokens(Number(e.target.value))}
                  className="w-full accent-blue-800 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1 tabular-nums">
                  <span>2,048 توکن</span>
                  <span>16,384 توکن</span>
                  <span>32,768 توکن</span>
                </div>
              </div>

              {/* Control 2: Quantization Precision */}
              <div>
                <span className="block text-xs font-semibold text-slate-800 mb-2">
                  دقت کوانتیزاسیون وزن ها (Weight Quantization):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['FP16', 'INT8', 'NF4'] as QuantizationMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setQuantization(mode)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
                        quantization === mode
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode === 'FP16'
                        ? 'FP16 (16-bit)'
                        : mode === 'INT8'
                        ? 'INT8 (8-bit)'
                        : 'NF4 (QLoRA 4-bit)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control 3: Hybrid Search Balance Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-800 mb-2">
                  <label htmlFor="hybrid-slider">ضریب جستجوی ترکیبی (Dense vs BM25):</label>
                  <span className="font-mono tabular-nums text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                    Alpha: {(hybridAlpha / 100).toFixed(2)}
                  </span>
                </div>
                <input
                  id="hybrid-slider"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={hybridAlpha}
                  onChange={(e) => setHybridAlpha(Number(e.target.value))}
                  className="w-full accent-blue-800 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>صرفا واژگانی (BM25)</span>
                  <span>ترکیبی بهینه (0.65)</span>
                  <span>صرفا برداری (Dense)</span>
                </div>
              </div>

              {/* Control 4: FlashAttention-2 Toggle */}
              <div className="pt-2">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      فعال سازی کرنل FlashAttention-2 (IO-Aware Tiling)
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      حذف نوشتن ماتریس میانی N×N در حافظه HBM کارت گرافیک
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={flashAttention}
                    onChange={(e) => setFlashAttention(e.target.checked)}
                    className="w-4 h-4 accent-blue-800 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Educational Insight Box */}
            <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900 block mb-1">تحلیل مهندسی وضعیت فعلی:</strong>
              {metrics.vramNominal
                ? `با انتخاب دقت ${quantization} و ${
                    flashAttention ? 'فعال بودن FlashAttention-2' : 'حالت استاندارد'
                  }، کل مصرف حافظه تنها ${
                    metrics.totalVramGb
                  } گیگابایت است و مدل با سرعت ${
                    metrics.throughputTps
                  } توکن بر ثانیه روی یک کارت گرافیک استاندارد ۱۶ گیگابایتی اجرا می شود.`
                : `به دلیل طول زمینه بالا (${contextTokens} توکن) یا عدم استفاده از کوانتیزاسیون ۴ بیتی، مصرف حافظه به ${metrics.totalVramGb} گیگابایت رسیده که نیازمند فعال سازی NF4 و FlashAttention-2 است.`}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
