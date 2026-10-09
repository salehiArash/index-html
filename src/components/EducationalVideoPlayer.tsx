import React, { useEffect, useState } from 'react';
import { Code2, Cpu, Pause, Play, RotateCcw, Tv, Volume2 } from 'lucide-react';
import { SmartImage } from './SmartImage';

interface EducationalVideoPlayerProps {
  src?: string;
  poster: string;
  title: string;
  summary: string;
  codeSnippet?: string;
  durationMinutes: number;
}

export const EducationalVideoPlayer: React.FC<EducationalVideoPlayerProps> = ({
  src,
  poster,
  title,
  summary,
  codeSnippet,
  durationMinutes,
}) => {
  const [useInteractiveDeck, setUseInteractiveDeck] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(18);
  const [speed, setSpeed] = useState<1 | 1.25 | 1.5>(1);

  useEffect(() => {
    setIsPlaying(false);
    setProgress(15);
  }, [src, title]);

  useEffect(() => {
    if (!isPlaying || !useInteractiveDeck) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return Number((prev + 0.8 * speed).toFixed(1));
      });
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying, useInteractiveDeck, speed]);

  const currentMinute = Math.floor((progress / 100) * durationMinutes);
  const currentSecond = Math.floor((((progress / 100) * durationMinutes) % 1) * 60);

  return (
    <div className="bg-slate-950 text-white">
      {/* Mode Switcher Bar */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 truncate">{title}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setUseInteractiveDeck(false)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
              !useInteractiveDeck
                ? 'bg-blue-700 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            پخش ویدیو (MP4)
          </button>
          <button
            type="button"
            onClick={() => setUseInteractiveDeck(true)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
              useInteractiveDeck
                ? 'bg-blue-700 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            پخش کننده تعاملی اسلاید و کد
          </button>
        </div>
      </div>

      {!useInteractiveDeck && src ? (
        <div className="aspect-video bg-black relative">
          <video
            key={src}
            controls
            preload="metadata"
            poster={poster}
            onError={() => setUseInteractiveDeck(true)}
            className="w-full h-full object-contain"
          >
            <source src={src} type="video/mp4" />
          </video>
        </div>
      ) : (
        /* Resilient Interactive Lecture Slide & Code Player */
        <div className="aspect-video bg-slate-950 relative flex flex-col justify-between p-6 sm:p-8 overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-sky-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-white">
                استودیو مجازی متافکر: {title}
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400 tabular-nums shrink-0">
              {String(currentMinute).padStart(2, '0')}:
              {String(currentSecond).padStart(2, '0')} / {durationMinutes}:00
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-auto py-4 items-center">
            <div className="md:col-span-6 space-y-3">
              <span className="text-xs font-semibold text-sky-400 block">
                شرح گام به گام اسلاید آموزشی:
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {summary}
              </p>
            </div>
            <div className="md:col-span-6">
              {codeSnippet ? (
                <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-[11px] font-mono text-sky-200 overflow-x-auto max-h-44">
                  <code>{codeSnippet}</code>
                </pre>
              ) : (
                <div className="rounded-xl overflow-hidden border border-slate-800 aspect-16/9 max-h-44">
                  <SmartImage
                    src={poster}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Interactive Playback Controls */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = rect.right - e.clientX;
                const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                setProgress(Number(pct.toFixed(1)));
              }}
              className="w-full h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer"
            >
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-sky-500 transition-all duration-150"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-semibold cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>توقف</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>پخش درس</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProgress(0);
                    setIsPlaying(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  aria-label="پخش از ابتدا"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 tabular-nums">
                <Volume2 className="w-4 h-4 text-slate-400" />
                {([1, 1.25, 1.5] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                      speed === s
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
