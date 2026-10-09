import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  Sun, 
  Download, 
  ClipboardPaste, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Clock,
  Volume2,
  VolumeX,
  ArrowUpRight,
} from 'lucide-react';
import { UISettings, Unit, FollowUpTask, ClientLead, TeamMember, TableDensity } from '../types';
import { isSupabaseConfigured } from '../services/supabase/client';
import { getActiveBackendName } from '../repositories';
import { LocalDataMigrationModal } from './LocalDataMigrationModal';

interface SettingsPageProps {
  onSync: () => Promise<void>;
  isSyncing: boolean;
  syncStatus: string | null;
  onOpenPasteModal: () => void;
  uiSettings: UISettings;
  onUpdateUISettings: (settings: UISettings) => void;
  units: Unit[];
  tasks: FollowUpTask[];
  team: TeamMember[];
  clients: ClientLead[];
  isArabic: boolean;
  onToggleTheme: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onSync,
  isSyncing,
  syncStatus,
  onOpenPasteModal,
  uiSettings,
  onUpdateUISettings,
  units,
  tasks,
  team,
  clients,
  isArabic,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'appearance' | 'worklenz' | 'system'>('sync');
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();
  const activeBackend = getActiveBackendName();
  const supabaseUrl = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined) || 'https://jzllhisbgjfdnurfuzfb.supabase.co';

  // Export full JSON backup
  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      version: '2.0',
      backend: activeBackend,
      units,
      tasks,
      team,
      clients,
      uiSettings,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `6o-real-estate-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setSavedSuccessMessage(
      isArabic ? 'تم تصدير ملف النسخة الاحتياطية بنجاح!' : 'Full backup exported successfully!'
    );
    setTimeout(() => setSavedSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isArabic ? 'إعدادات المنظومة وبيئة العمل' : 'System Settings & Integration'}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Supabase Cloud
            </span>
          </div>
          <p className="text-xs text-text-muted max-w-2xl">
            {isArabic
              ? 'التحكم المركزي في قاعدة بيانات Supabase السحابية، تخصيص مظهر وكثافة العرض، وضبط قواعد بيئة عمل فريق الوسطاء.'
              : 'Central hub for Supabase Cloud Database integration, auto-sync intervals, UI display density, and team workload rules.'}
          </p>
        </div>

        {/* Quick Sync Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? (isArabic ? 'جاري المزامنة...' : 'Syncing...') : (isArabic ? 'مزامنة مع Supabase' : 'Sync Supabase')}</span>
        </button>
      </div>

      {/* Settings Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('sync')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'sync'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold'
              : 'text-text-muted hover:text-white hover:bg-surface-raised'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>{isArabic ? 'قاعدة بيانات سوبابيس (Supabase Cloud)' : 'Supabase Cloud Database'}</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'appearance'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold'
              : 'text-text-muted hover:text-white hover:bg-surface-raised'
          }`}
        >
          <Sun className="w-4 h-4 text-accent" />
          <span>{isArabic ? 'المظهر وكثافة العرض' : 'Appearance & Density'}</span>
        </button>

        <button
          onClick={() => setActiveTab('worklenz')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'worklenz'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 font-bold'
              : 'text-text-muted hover:text-white hover:bg-surface-raised'
          }`}
        >
          <Briefcase className="w-4 h-4 text-purple-400" />
          <span>{isArabic ? 'بيئة العمل وإدارة الوسطاء' : 'Team Workload Rules'}</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'system'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold'
              : 'text-text-muted hover:text-white hover:bg-surface-raised'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isArabic ? 'النسخ الاحتياطي ومقاييس النظام' : 'Backup & Metrics'}</span>
        </button>
      </div>

      {/* Notifications / Success Alerts */}
      {savedSuccessMessage && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedSuccessMessage}</span>
        </div>
      )}

      {syncStatus && (
        <div className="p-3.5 bg-surface-raised border border-border rounded-xl text-text text-xs flex items-center gap-2 animate-fade-in">
          <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* TAB 1: SUPABASE CLOUD DATABASE SYNC & INTEGRATION */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          {/* Main Supabase Configuration Card */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>{isArabic ? 'قاعدة بيانات Supabase السحابية (PostgreSQL Cloud)' : 'Supabase Cloud Database (PostgreSQL)'}</span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {isArabic 
                    ? 'المصدر المعتمد لبيانات العقارات، الملاك، الصفقات، والعملاء بسلاسة وتشفير سحابي متقدم.'
                    : 'Certified source of truth for properties, owners, deals, and clients with enterprise cloud encryption.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  isConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-accent/10 text-accent border-accent/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-accent'}`} />
                  <span>{isConfigured ? (isArabic ? 'سحابة متصلة ونشطة' : 'Cloud Connected') : (isArabic ? 'وضع التخزين المحلي الآمن' : 'Local Storage Mode')}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Endpoint Display */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted">
                  {isArabic ? 'رابط مشروع Supabase السحابي:' : 'Supabase Project URL:'}
                </label>
                <div className="w-full bg-surface-raised border border-border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono flex items-center justify-between">
                  <span className="truncate">{supabaseUrl}</span>
                  <span className="text-[10px] text-emerald-400 font-bold shrink-0 ml-2">HTTPS</span>
                </div>
              </div>

              {/* Status & Backend */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted">
                  {isArabic ? 'نوع المخزن النشط (Active Storage Engine):' : 'Active Storage Engine:'}
                </label>
                <div className="w-full bg-surface-raised border border-border rounded-xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between">
                  <span className="font-semibold text-emerald-400 capitalize">{activeBackend} Repository</span>
                  <span className="text-[10px] text-text-muted font-mono">Row Level Security (RLS)</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsMigrationModalOpen(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition cursor-pointer flex items-center gap-1 font-semibold"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{isArabic ? 'نقل كافة السجلات المحلية إلى سحابة Supabase بضغطة واحدة' : 'Migrate all local records to Supabase Cloud'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenPasteModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white border border-border text-xs transition cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-accent" />
                  <span>{isArabic ? 'استيراد CSV / بيانات جداول' : 'Import CSV Data'}</span>
                </button>

                <button
                  onClick={onSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? (isArabic ? 'جاري المزامنة...' : 'Syncing...') : (isArabic ? 'مزامنة فورية' : 'Sync Now')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sync Frequency & Security Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto-Sync Interval Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">
                  {isArabic ? 'تردد المزامنة السحابية التلقائية' : 'Cloud Auto-Sync Frequency'}
                </h4>
              </div>
              <p className="text-xs text-text-muted">
                {isArabic
                  ? 'اختر معدل تكرار فحص قاعدة بيانات Supabase وتحديث أسعار وحالات الوحدات في الخلفية تلقائياً.'
                  : 'Choose how often the app polls Supabase Cloud for live unit price and status updates.'}
              </p>

              <div className="space-y-2">
                {[
                  { value: 0, labelAr: 'مزامنة يدوية فقط (عند الطلب)', labelEn: 'Manual Sync Only' },
                  { value: 60, labelAr: 'كل دقيقة (مزامنة فورية سريعة)', labelEn: 'Every 1 Minute (Fast)' },
                  { value: 300, labelAr: 'كل 5 دقائق (موصى به للاستقرار)', labelEn: 'Every 5 Minutes (Recommended)' },
                  { value: 900, labelAr: 'كل 15 دقيقة', labelEn: 'Every 15 Minutes' },
                  { value: 1800, labelAr: 'كل 30 دقيقة', labelEn: 'Every 30 Minutes' }
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      uiSettings.autoSyncInterval === item.value
                        ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-surface border-border text-text-muted hover:bg-surface-raised'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <input
                        type="radio"
                        name="autoSyncInterval"
                        checked={uiSettings.autoSyncInterval === item.value}
                        onChange={() => onUpdateUISettings({ ...uiSettings, autoSyncInterval: item.value })}
                        className="accent-emerald-500"
                      />
                      <span>{isArabic ? item.labelAr : item.labelEn}</span>
                    </div>
                    {item.value === 300 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        {isArabic ? 'مثالي' : 'Best'}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Cloud Architecture & Security */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">
                  {isArabic ? 'أمان التخزين السحابي وقواعد RLS' : 'Cloud Architecture & Security'}
                </h4>
              </div>
              <p className="text-xs text-text-muted">
                {isArabic
                  ? 'يتم تشفير وتأمين كافة بيانات المخزون والملاك والعملاء عبر قواعد أمان PostgreSQL Row Level Security (RLS).'
                  : 'All inventory units, contracts, and clients are secured via PostgreSQL Row Level Security policies.'}
              </p>

              <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">PostgreSQL Engine</div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <div className="text-xs text-text-muted space-y-1">
                  <div>• Table: <code>units</code> (Real estate listings)</div>
                  <div>• Table: <code>clients</code> (CRM leads & inquiries)</div>
                  <div>• Table: <code>owners</code> (Property owners directory)</div>
                  <div>• Table: <code>contracts</code> (Sales & commissions ledger)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPEARANCE & DISPLAY DENSITY */}
      {activeTab === 'appearance' && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sun className="w-5 h-5 text-accent" />
              <span>{isArabic ? 'تخصيص المظهر وتجربة العرض' : 'Appearance & UI Experience'}</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {isArabic 
                ? 'تحكم في المظهر النهاري/الليلي، وكثافة عرض الجداول بما يتناسب مع حجم شاشتك وأسلوب عملك.'
                : 'Configure dark/light themes and table density tailored for enterprise productivity.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme Selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-text-muted block">
                {isArabic ? 'نمط الألوان (Color Theme):' : 'Color Theme:'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateUISettings({ ...uiSettings, theme: 'dark' })}
                  className={`p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-2 ${
                    uiSettings.theme === 'dark'
                      ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/30'
                      : 'bg-surface border-border text-text-muted hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-gold border border-gold/20">
                    D
                  </div>
                  <span className="text-xs font-bold">{isArabic ? 'الوضع الليلي (Dark Luxury)' : 'Dark Luxury'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateUISettings({ ...uiSettings, theme: 'light' })}
                  className={`p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-2 ${
                    uiSettings.theme === 'light'
                      ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/30'
                      : 'bg-surface border-border text-text-muted hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-text border border-border">
                    L
                  </div>
                  <span className="text-xs font-bold">{isArabic ? 'الوضع النهاري (Light Minimal)' : 'Light Minimal'}</span>
                </button>
              </div>
            </div>

            {/* Table Density */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-text-muted block">
                {isArabic ? 'كثافة أسطر الجداول (Table Density):' : 'Table Density:'}
              </label>
              <div className="space-y-2">
                {[
                  { id: 'compact', titleAr: 'مكثف (Compact)', titleEn: 'Compact (High Information Density)', descAr: 'مناسب للشاشات الكبيرة والمقارنة السريعة' },
                  { id: 'normal', titleAr: 'متوسط (Normal)', titleEn: 'Normal (Standard Balanced)', descAr: 'العرض الافتراضي القياسي المريح للعين' },
                  { id: 'comfortable', titleAr: 'مريح (Comfortable)', titleEn: 'Comfortable (Spacious View)', descAr: 'مسافات واسعة تتيح فحص الصور والملاحظات بوضوح' }
                ].map((d) => (
                  <label
                    key={d.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      uiSettings.tableDensity === d.id
                        ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-surface border-border text-text-muted hover:bg-surface-raised'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tableDensity"
                      checked={uiSettings.tableDensity === d.id}
                      onChange={() => onUpdateUISettings({ ...uiSettings, tableDensity: d.id as TableDensity })}
                      className="accent-emerald-500 mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">
                        {isArabic ? d.titleAr : d.titleEn}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {d.descAr}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Sound & Notifications Settings */}
          <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border">
              <div className="flex items-center gap-2.5">
                {uiSettings.enableNotificationSound ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-text-muted" />
                )}
                <div>
                  <div className="text-xs font-bold text-white">
                    {isArabic ? 'تنبيهات صوتية فورية' : 'Sound Alerts'}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {isArabic ? 'تشغيل رنين خفيف عند تحديث أي وحدة إلى "تم البيع" أو "محجوز"' : 'Play chime on deal closure'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={uiSettings.enableNotificationSound}
                onChange={(e) => onUpdateUISettings({ ...uiSettings, enableNotificationSound: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs font-bold text-white">
                    {isArabic ? 'إظهار صور ورموز الوسطاء' : 'Show Agent Avatars'}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {isArabic ? 'عرض صور وحلقات حالة الوسطاء في الجداول والكانبان' : 'Display agent badges in tables'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={uiSettings.showAvatars}
                onChange={(e) => onUpdateUISettings({ ...uiSettings, showAvatars: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORKLENZ TEAM RULES & WORKLOAD */}
      {activeTab === 'worklenz' && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" />
              <span>{isArabic ? 'قواعد بيئة عمل Worklenz وإدارة الوسطاء' : 'Worklenz Team & Workload Rules'}</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {isArabic 
                ? 'توزيع المهام بذكاء، تحديد السعة القصوى لكل وسيط، ومراقبة جودة إنجاز المعاينات والمفاوضات.'
                : 'Configure broker deal limits, overload alerts, and automated follow-up workflows.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <span className="text-[11px] text-text-muted font-semibold block">
                {isArabic ? 'الحد الأقصى للمهام لكل وسيط:' : 'Max Tasks Capacity / Agent:'}
              </span>
              <div className="text-xl font-bold font-mono text-purple-400">8 {isArabic ? 'صفقات نشطة' : 'deals'}</div>
              <p className="text-[10px] text-text-muted">
                {isArabic ? 'يتم إطلاق تنبيه عند تجاوز الوسيط لـ 8 مهام نشطة متزامنة لمنع الاحتراق الوظيفي.' : 'Triggers overload warning badge when capacity is exceeded.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <span className="text-[11px] text-text-muted font-semibold block">
                {isArabic ? 'عمولة الوسيط الافتراضية:' : 'Default Broker Commission:'}
              </span>
              <div className="text-xl font-bold font-mono text-accent">2.5% {isArabic ? 'من الصفقة' : 'of deal'}</div>
              <p className="text-[10px] text-text-muted">
                {isArabic ? 'تُحسب تلقائياً وتُوزع في جدول العقود وعمولات الوسطاء.' : 'Calculated automatically and credited to commission ledgers.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <span className="text-[11px] text-text-muted font-semibold block">
                {isArabic ? 'المهلة القصوى للمتابعة المتأخرة:' : 'Overdue Grace Period:'}
              </span>
              <div className="text-xl font-bold font-mono text-rose-400">24 {isArabic ? 'ساعة' : 'hours'}</div>
              <p className="text-[10px] text-text-muted">
                {isArabic ? 'المهام غير المنجزة بعد 24 ساعة من موعدها تظهر في شريط التحذيرات العاجلة بالأعلى.' : 'Unfinished tasks escalate to imminent urgency banner.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM BACKUP & METRICS */}
      {activeTab === 'system' && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{isArabic ? 'النسخ الاحتياطي ومقاييس النظام السحابي' : 'Cloud Backup & System Metrics'}</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {isArabic 
                ? 'إدارة حفظ وتفريغ النسخ الاحتياطية لمطابقة البيانات ومراقبة إحصائيات التخزين السحابي.'
                : 'Generate JSON backups and monitor system entity volume across active databases.'}
            </p>
          </div>

          {/* Database Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <span className="text-[10px] text-text-muted block">{isArabic ? 'إجمالي الوحدات' : 'Units'}</span>
              <strong className="text-xl font-bold font-mono text-blue-400">{units.length}</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <span className="text-[10px] text-text-muted block">{isArabic ? 'مهام المتابعة' : 'Tasks'}</span>
              <strong className="text-xl font-bold font-mono text-accent">{tasks.length}</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <span className="text-[10px] text-text-muted block">{isArabic ? 'أعضاء الفريق' : 'Team'}</span>
              <strong className="text-xl font-bold font-mono text-purple-400">{team.length}</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <span className="text-[10px] text-text-muted block">{isArabic ? 'عملاء SuiteCRM' : 'Leads'}</span>
              <strong className="text-xl font-bold font-mono text-emerald-400">{clients.length}</strong>
            </div>
          </div>

          {/* Export Action Card */}
          <div className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isArabic ? 'تصدير نسخة احتياطية كاملة (Full JSON Backup)' : 'Download Full JSON Backup'}</span>
              </h4>
              <p className="text-[11px] text-text-muted">
                {isArabic 
                  ? 'قم بحفظ نسخة احتياطية من كل الوحدات، الملاك، والمتابعات لاستيرادها في أي وقت.'
                  : 'Exports current state of inventory, clients, owners, and kanban cards.'}
              </p>
            </div>

            <button
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-raised hover:bg-surface-raised text-text hover:text-white border border-border text-xs font-semibold transition cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{isArabic ? 'تحميل النسخة الاحتياطية' : 'Download Backup'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Migration Modal */}
      <LocalDataMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
      />
    </div>
  );
};

export default SettingsPage;
