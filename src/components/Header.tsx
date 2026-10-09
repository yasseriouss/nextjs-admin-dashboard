import React, { useState } from 'react';
import { 
  Menu,
  Bell,
  Sun,
  Moon,
  Sparkles,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { AppNotification } from '../types';
import { AppLogo } from './AppLogo';
import { NAV_BY_ID, navLabelKey, type NavTabId } from '../navigation/navConfig';
import { useT } from '../i18n/useT';
import { notificationTitle, notificationMessage } from '../lib/notifications';

interface HeaderProps {
  isArabic: boolean;
  setIsArabic?: (val: boolean) => void;
  activeNavTab: NavTabId;
  setActiveNavTab?: (tab: NavTabId) => void;
  user?: FirebaseUser | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onRefresh?: () => void;
  isSyncing?: boolean;
  dueTasksCount?: number;
  overdueTasksCount?: number;
  onOpenSmartReminders?: () => void;
  onOpenMobileMenu?: () => void;
  notifications?: AppNotification[];
  onOpenSettings?: () => void;
  onClearNotifications?: () => void;
  onSelectUnit?: (unitId: string) => void;
  onSelectTask?: (taskId: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeNavTab,
  setActiveNavTab,
  overdueTasksCount = 0,
  onOpenSmartReminders,
  onOpenMobileMenu,
  notifications = [],
  onClearNotifications,
  onSelectUnit,
  onSelectTask,
  theme = 'dark',
  onToggleTheme,
  isSyncing = false
}) => {
  const t = useT();
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isDark = theme === 'dark';

  const currentTab = NAV_BY_ID[activeNavTab] || NAV_BY_ID.overview;
  const CurrentIcon = currentTab.icon;

  return (
    <header className="border-b border-border sticky top-0 z-30 backdrop-blur-md bg-card/90 shadow-xs transition-colors">
      <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu + Active View Breadcrumb/Title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Hamburger Button */}
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition cursor-pointer"
              title={t('header.openSidebar')}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Mobile-only compact logo */}
          <div 
            onClick={() => setActiveNavTab && setActiveNavTab('overview')} 
            className="md:hidden cursor-pointer shrink-0"
          >
            <AppLogo variant="mark" size="sm" theme={theme} />
          </div>

          {/* Desktop Active Page Title & Breadcrumb */}
          <div className="hidden md:flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-navy/20 dark:bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
              <CurrentIcon className="w-4 h-4 text-gold dark:text-gold" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
                  6O Platform
                </span>
                <span className="text-muted-foreground/40 text-xs">/</span>
                <h1 className="text-sm font-bold text-foreground truncate">
                  {t(navLabelKey(activeNavTab))}
                </h1>
                {isSyncing && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    Syncing...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Smart Reminders, Notifications & Theme Toggle Only */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Website Link */}
          <a
            href={(typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_LANDING_PAGE_URL : undefined) || 'https://6o-real-estate.vercel.app'}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-foreground text-xs font-semibold transition hover:border-gold/50 cursor-pointer"
            title={t('header.website.title')}
          >
            <Globe className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>{t('header.website.label')}</span>
          </a>

          {/* Smart Reminders Priority Button */}
          {onOpenSmartReminders && (
            <button
              onClick={onOpenSmartReminders}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                overdueTasksCount > 0
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25 shadow-xs shadow-rose-500/20'
                  : 'bg-secondary/60 hover:bg-secondary text-foreground border-border'
              }`}
              title={t('header.reminders.title')}
            >
              <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
              <span className="hidden sm:inline">{t('header.reminders.label')}</span>
              {overdueTasksCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white animate-pulse">
                  {overdueTasksCount} {t('header.reminders.due')}
                </span>
              )}
            </button>
          )}

          {/* Notifications Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="relative p-2 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer"
              title={t('header.notifications')}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold font-mono flex items-center justify-center animate-bounce shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotificationsDropdown && (
              <div className={`absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 sm:w-96 border rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 ${
                isDark ? 'bg-card border-border text-foreground' : 'bg-card border-border text-foreground'
              }`}>
                <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gold" />
                    <span className="font-bold text-xs">
                      {t('header.notifications')}
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-blue-400 font-mono font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && onClearNotifications && (
                    <button
                      onClick={onClearNotifications}
                      className="text-[10px] text-muted-foreground hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{t('header.clearAll')}</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      {t('header.noNotifications')}
                    </div>
                  ) : (
                    Array.from(new Map(notifications.map(n => [n.id, n])).values()).map((n) => {
                      const isTaskAlert = n.type === 'task_due' || n.type === 'urgent';
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.taskId && onSelectTask) {
                              onSelectTask(n.taskId);
                              setShowNotificationsDropdown(false);
                            } else if (n.unitId && onSelectUnit) {
                              onSelectUnit(n.unitId);
                              setShowNotificationsDropdown(false);
                            }
                          }}
                          className={`p-3 text-xs hover:bg-secondary/60 transition cursor-pointer flex gap-3 ${
                            !n.read ? 'bg-secondary/30' : ''
                          }`}
                        >
                          <div className={`p-1.5 rounded-xl h-fit shrink-0 ${
                            isTaskAlert 
                              ? 'bg-rose-500/10 text-rose-400' 
                              : n.type === 'sold'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-gold/10 text-gold'
                          }`}>
                            {isTaskAlert ? (
                              <Clock className="w-3.5 h-3.5" />
                            ) : n.type === 'sold' ? (
                              <DollarSign className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="font-bold truncate text-[11px]">
                                {notificationTitle(n, t)}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                                {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {notificationMessage(n, t)}
                            </p>
                            <div className="mt-1.5 flex items-center justify-between">
                              {n.taskId && (
                                <span className="text-[10px] text-gold hover:underline font-semibold flex items-center gap-0.5">
                                  <span>{t('header.openTask')}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              )}
                              {n.unitId && !n.taskId && (
                                <span className="text-[10px] text-gold hover:underline font-semibold flex items-center gap-0.5">
                                  <span>{t('header.viewUnit')}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Quick Switcher (Dark / Light) */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer"
              title={theme === 'dark' ? t('header.theme.toLight') : t('header.theme.toDark')}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-gold" />
              ) : (
                <Moon className="w-4 h-4 text-gold" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
