import React, { useState } from 'react';
import { Cpu } from 'lucide-react';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackTitle?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  fallbackTitle,
  className = '',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-900 text-slate-200 p-6 text-center select-none ${className}`}
        role="img"
        aria-label={alt || fallbackTitle || 'تصویر آموزشی متافکر'}
      >
        <Cpu className="w-8 h-8 text-blue-400 mb-3 opacity-80" />
        <span className="text-xs font-medium text-slate-300 max-w-xs line-clamp-2">
          {fallbackTitle || alt || 'آکادمی هوش مصنوعی متافکر'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || fallbackTitle || 'تصویر متافکر'}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      {...rest}
    />
  );
};
