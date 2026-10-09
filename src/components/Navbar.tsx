import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { User } from '../types/metafekr';

export type ActiveTab =
  | 'home'
  | 'courses'
  | 'videos'
  | 'articles'
  | 'portfolio'
  | 'workspace';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  user: User | null;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  user,
  onOpenAuthModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'home', label: 'خانه' },
    { id: 'courses', label: 'دوره های تخصصی' },
    { id: 'videos', label: 'ویدیو های آموزشی' },
    { id: 'articles', label: 'مقالات علمی' },
    { id: 'portfolio', label: 'پورتفولیو و دستاوردها' },
  ];

  const handleNavClick = (id: ActiveTab) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-700 cursor-pointer"
        >
          متافکر | MetaFekr
        </button>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="منوی اصلی"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-blue-800 text-slate-950 font-semibold'
                    : 'border-transparent hover:text-slate-950 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() => handleNavClick('workspace')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {user.role === 'admin'
                ? `پنل مدیریت (${user.name})`
                : user.role === 'instructor'
                ? `پنل مدرس (${user.name})`
                : `پنل دانشجو (${user.name})`}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1E40AF] hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              ورود و ناحیه کاربری
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="باز کردن منوی موبایل"
            className="lg:hidden p-2 text-slate-700 hover:text-slate-950 rounded-lg border border-slate-200 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`block w-full text-right py-2.5 px-3 rounded-lg text-sm font-medium ${
                activeTab === item.id
                  ? 'bg-slate-100 text-slate-950 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
