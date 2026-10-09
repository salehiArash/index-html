import React, { useState } from 'react';
import { ShieldCheck, UserCheck, X } from 'lucide-react';
import { User } from '../types/metafekr';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [discipline, setDiscipline] = useState('مهندسی مدل های زبانی بزرگ');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'login'
            ? { email, password }
            : { name, email, password, discipline }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطا در احراز هویت.');
        return;
      }
      onSuccess(data.token, data.user);
      onClose();
    } catch {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (role: 'student' | 'instructor' | 'admin') => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/quick-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(data.token, data.user);
        onClose();
      } else {
        setError(data.error || 'خطا در ورود سریع.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 shadow-xl">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span id="auth-modal-title">
              {mode === 'login'
                ? 'ورود به حساب کاربری متافکر'
                : 'ثبت نام دانشجوی جدید در متافکر'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ورود به حساب
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ثبت نام جدید
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    نام و نام خانوادگی:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: سارا محمدی"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    گرایش تخصصی مورد علاقه:
                  </label>
                  <select
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs bg-white"
                  >
                    <option value="مهندسی مدل های زبانی بزرگ">
                      مهندسی مدل های زبانی بزرگ
                    </option>
                    <option value="بینایی ماشین و سیستم های نهفته">
                      بینایی ماشین و سیستم های نهفته
                    </option>
                    <option value="طراحی ایجنت های هوشمند">
                      طراحی ایجنت های هوشمند
                    </option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                آدرس ایمیل:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@metafekr.ir"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                رمز عبور:
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-[#1E40AF] hover:bg-blue-900 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading
                ? 'در حال بررسی...'
                : mode === 'login'
                ? 'ورود به سامانه'
                : 'ایجاد حساب کاربری'}
            </button>
          </form>

          {/* One-Click Demo Role Access for Evaluators */}
          <div className="pt-5 border-t border-slate-200 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-800" />
              <span>ورود سریع آزمایشی (تست سطوح دسترسی و پنل مدیریت):</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRole('student')}
                className="py-2 px-2 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 cursor-pointer"
              >
                ورود دانشجو
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('instructor')}
                className="py-2 px-2 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 cursor-pointer"
              >
                ورود مدرس
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('admin')}
                className="py-2 px-2 rounded-lg text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
              >
                ورود مدیر کل
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
