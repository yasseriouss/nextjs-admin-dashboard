import React from 'react';
import Link from 'next/link';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Languages, 
  LogOut, 
  LogIn, 
  Sliders
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { AppLogo } from './AppLogo';
import { NAV_SECTIONS, navLabelKey, navSectionKey, type NavTabId } from '@/navigation/navConfig';
import { useT } from '@/i18n/useT';

interface SidebarProps {
  activeNavTab: NavTabId;
  setActiveNavTab: (tabId: NavTabId) => void;
  isArabic: boolean;
  setIsArabic: (val: boolean) => void;
  user: FirebaseUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
  salesCount: number;
  rentCount: number;
  dueTasksCount?: number;
  leadsCount: number;
  teamCount: number;
  ownersCount: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenSettings?: () => void;
  theme?: 'dark' | 'light';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNavTab,
  setActiveNavTab,
  isArabic,
  setIsArabic,
  user,
  onSignIn,
  onSignOut,
  salesCount,
  rentCount,
  dueTasksCount = 0,
  leadsCount,
  teamCount,
  ownersCount,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
  theme = 'dark'
}) => {
  const t = useT();

  const badgeFor = (id: NavTabId): { badge?: number | string; badgeColor?: string } => {
    switch (id) {
      case 'sales':
        return { badge: salesCount, badgeColor: 'bg-blue-500/20 text-blue-300' };
      case 'rent':
        return { badge: rentCount, badgeColor: 'bg-emerald-500/20 text-emerald-300' };
      case 'reports':
        return { badge: t('nav.badge.new'), badgeColor: 'bg-indigo-500/20 text-indigo-300 font-bold' };
      case 'geo':
        return { badge: 'GPS', badgeColor: 'bg-blue-500/20 text-blue-300 font-bold' };
      case 'calendar':
        return { badge: t('nav.badge.live'), badgeColor: 'bg-accent text-accent font-bold' };
      case 'contracts':
        return { badge: '2.5%', badgeColor: 'bg-emerald-500/20 text-emerald-300 font-bold' };
      case 'tasks':
        return dueTasksCount > 0
          ? { badge: dueTasksCount, badgeColor: 'bg-accent text-text font-bold animate-pulse' }
          : { badge: `${teamCount}`, badgeColor: 'bg-cyan-500/20 text-cyan-300' };
      case 'clients':
        return { badge: leadsCount, badgeColor: 'bg-purple-500/20 text-purple-300' };
      case 'owners':
        return { badge: ownersCount, badgeColor: 'bg-surface-raised text-text-muted' };
      case 'gemini':
        return { badge: 'Gemini 2.5', badgeColor: 'bg-gradient-to-r from-accent to-rose-500 text-white font-bold' };
      default:
        return {};
    }
  };

  const navSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.map(item => ({ ...item, ...badgeFor(item.id) }))
  }));

  const handleSelectTab = (id: NavTabId) => {
    setActiveNavTab(id);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-3.5 border-b border-border bg-card/60 backdrop-blur-sm flex items-center justify-between shrink-0 transition-colors">
        <div className="flex items-center gap-2.5 overflow-hidden cursor-pointer" onClick={() => handleSelectTab('overview')}>
          {isCollapsed ? (
            <AppLogo variant="mark" size="sm" theme={theme} />
          ) : (
            <>
              <AppLogo variant="horizontal" size="sm" theme={theme} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold tracking-wider text-foreground">
                  6O PLATFORM
                </span>
                <span className="text-[10px] text-muted-foreground font-medium truncate">
                  {isArabic ? 'إدارة عقارات النخبة' /* i18n-allow */ : 'Luxury Real Estate CRM'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition cursor-pointer"
          title={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {isArabic ? (
            isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin scrollbar-thumb-border">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1.5">
            {!isCollapsed && (
              <h3 className="px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">
                {t(navSectionKey(section.key))}
              </h3>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNavTab === item.id;

                return (
                  <Link
                    key={item.id}
                    href={`/${item.id}`}
                    onClick={() => setIsMobileOpen(false)}
                    title={isCollapsed ? t(navLabelKey(item.id)) : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                      isActive
                        ? item.id === 'gemini'
                          ? 'bg-gradient-to-r from-accent via-rose-500/20 to-purple-500/20 text-foreground border border-accent shadow-xs'
                          : 'bg-navy text-gold dark:bg-gold dark:text-navy border border-gold/30 shadow-xs font-bold'
                        : item.id === 'gemini'
                        ? 'text-accent hover:text-accent hover:bg-accent border border-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive 
                          ? 'text-gold dark:text-navy' 
                          : item.id === 'gemini' 
                          ? 'text-accent' 
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`} />

                      {!isCollapsed && (
                        <span className="truncate text-right rtl:text-right ltr:text-left">
                          {t(navLabelKey(item.id))}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && item.badge !== undefined && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0 ${item.badgeColor || 'bg-secondary text-secondary-foreground'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / System Controls */}
      <div className="p-3 border-t border-border bg-card/60 space-y-2 shrink-0 transition-colors">
        {/* Dedicated System & Cloud Sync Settings Button */}
        <Link
          href="/settings"
          onClick={() => setIsMobileOpen(false)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
            activeNavTab === 'settings'
              ? 'bg-navy text-gold dark:bg-gold dark:text-navy border-gold/40 shadow-xs font-bold'
              : 'bg-card hover:bg-secondary/70 border-border text-foreground'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={t('sidebar.settings.title')}
        >
          <div className="flex items-center gap-2.5">
            <Sliders className={`w-4 h-4 shrink-0 ${activeNavTab === 'settings' ? 'text-gold dark:text-navy' : 'text-accent'}`} />
            {!isCollapsed && <span>{t('nav.settings')}</span>}
          </div>
          {!isCollapsed && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              activeNavTab === 'settings' ? 'bg-navy/40 text-gold dark:bg-navy dark:text-white' : 'bg-secondary text-muted-foreground'
            }`}>
              Sheets
            </span>
          )}
        </Link>

        {/* Language Switcher */}
        <button
          onClick={() => setIsArabic(!isArabic)}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl border border-border text-xs transition cursor-pointer bg-card hover:bg-secondary/70 text-foreground ${isCollapsed ? 'justify-center' : ''}`}
          title={t('sidebar.language.switchTitle')}
        >
          <div className="flex items-center gap-2">
            <Languages className="w-3.5 h-3.5 text-accent shrink-0" />
            {!isCollapsed && <span className="text-[11px]">{t('sidebar.language.current')}</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] text-accent font-bold font-mono">
              {t('sidebar.language.toggleShort')}
            </span>
          )}
        </button>

        {/* User Card / Sign-in */}
        {user ? (
          <div className={`flex items-center justify-between p-2 rounded-xl border border-border bg-card/80 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="flex items-center gap-2 min-w-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-full border border-border shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-navy text-gold border border-gold/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-[11px] font-bold truncate text-foreground">{user.displayName || 'Broker'}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={onSignOut}
                title={t('common.signOut')}
                className="p-1 text-muted-foreground hover:text-rose-500 rounded transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 bg-navy hover:bg-navy/80 text-gold border border-gold/40 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer ${
              isCollapsed ? 'p-2' : ''
            }`}
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>{t('sidebar.googleLogin')}</span>}
          </button>
        )}

        {/* Creator Attribution Pill (Aligned with Landing Page Footer) */}
        {!isCollapsed && (
          <div className="pt-2 text-center text-[10px]">
            <a
              href="https://yasserious.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-all shadow-2xs group"
            >
              <span className="size-1.5 rounded-full bg-accent animate-pulse" />
              <span>Created by <strong className="text-accent group-hover:underline">yasserious.com</strong></span>
            </a>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside 
        className={`hidden md:flex flex-col border-border bg-card/95 backdrop-blur-md z-30 transition-all duration-300 h-screen sticky top-0 shrink-0 ${
          isArabic ? 'border-l' : 'border-r'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-surface backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Body */}
          <div 
            className={`relative w-4/5 max-w-xs h-full shadow-2xl z-10 flex flex-col bg-card border-border ${
              isArabic ? 'border-l mr-auto' : 'border-r ml-auto'
            }`}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
