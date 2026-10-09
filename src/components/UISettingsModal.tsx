import React from 'react';
import { 
  Moon, 
  Sun, 
  Sliders, 
  X, 
  Check, 
  RotateCcw, 
  Bell, 
  RefreshCw,
} from 'lucide-react';
import { UISettings, TableDensity } from '../types';

interface UISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UISettings;
  onUpdateSettings: (newSettings: UISettings) => void;
  isArabic: boolean;
}

export const UISettingsModal: React.FC<UISettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  isArabic
}) => {
  if (!isOpen) return null;

  const handleThemeChange = (theme: 'dark' | 'light') => {
    onUpdateSettings({ ...settings, theme });
  };

  const handleDensityChange = (tableDensity: TableDensity) => {
    onUpdateSettings({ ...settings, tableDensity });
  };

  const handleResetDefaults = () => {
    onUpdateSettings({
      theme: 'dark',
      tableDensity: 'normal',
      showAvatars: true,
      enableNotificationSound: true,
      autoSyncInterval: 0
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div 
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-colors bg-surface border-border text-text"
      >
        {/* Modal Header */}
        <div className="p-5 border-b flex items-center justify-between bg-surface border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isArabic ? 'تخصيص واجهة المستخدم وعرض البيانات' : 'UI & Display Customization'}
              </h3>
              <p className="text-xs text-text-muted">
                {isArabic ? 'تحكم في المظهر وكثافة جداول الوحدات' : 'Personalize theme and table information density'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition text-text-muted hover:bg-surface-raised hover:text-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SECTION 1: Theme Switcher */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2.5">
              {isArabic ? 'مظهر النظام (Dark / Light Mode)' : 'Appearance Theme'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Dark Theme Button */}
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition text-center cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'border-blue-500 bg-blue-600/10 text-blue-400 ring-2 ring-blue-500/30'
                    : settings.theme === 'light'
                    ? 'border-border hover:bg-surface text-text-muted'
                    : 'border-border hover:bg-surface-raised text-text-muted'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-accent shadow-inner">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">{isArabic ? 'الوضع الليلي الفاخر' : 'Dark Mode'}</span>
                  <span className="text-[10px] opacity-75">{isArabic ? 'مريح للعين وخلفيات داكنة' : 'Slate dark luxury'}</span>
                </div>
                {settings.theme === 'dark' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {isArabic ? 'مفعل' : 'Active'}
                  </span>
                )}
              </button>

              {/* Light Theme Button */}
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition text-center cursor-pointer ${
                  settings.theme === 'light'
                    ? 'border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-500/30'
                    : 'border-border hover:bg-surface-raised text-text-muted'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-accent border border-accent flex items-center justify-center text-accent shadow-inner">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">{isArabic ? 'الوضع النهاري المشرق' : 'Light Mode'}</span>
                  <span className="text-[10px] opacity-75">{isArabic ? 'خلفيات بيضاء ناصعة للمكاتب' : 'Clean crisp white'}</span>
                </div>
                {settings.theme === 'light' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {isArabic ? 'مفعل' : 'Active'}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* SECTION 2: Table Information Density */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider">
                {isArabic ? 'كثافة معلومات جداول الوحدات' : 'Table Information Density'}
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                {settings.tableDensity}
              </span>
            </div>
            <p className="text-xs mb-3 text-text-muted">
              {isArabic 
                ? 'تحكم في ارتفاع الصفوف والمسافات لعرض وحدات أكثر في الشاشة أو قراءة مريحة'
                : 'Adjust row height and spacing to display more units per screen or enhance readability'}
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Compact Density */}
              <button
                type="button"
                onClick={() => handleDensityChange('compact')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                  settings.tableDensity === 'compact'
                    ? 'border-blue-500 bg-blue-600/10 text-blue-400 ring-2 ring-blue-500/20'
                    : settings.theme === 'light'
                    ? 'border-border hover:bg-surface text-text'
                    : 'border-border hover:bg-surface-raised text-text-muted'
                }`}
              >
                <div className="flex flex-col gap-1 items-center mb-2">
                  <div className="w-12 h-1.5 bg-current opacity-70 rounded" />
                  <div className="w-12 h-1.5 bg-current opacity-70 rounded" />
                  <div className="w-12 h-1.5 bg-current opacity-70 rounded" />
                </div>
                <span className="text-xs font-bold block">{isArabic ? 'مضغوط' : 'Compact'}</span>
                <span className="text-[9px] opacity-75">{isArabic ? 'أقصى عدد وحدات' : 'Maximum rows'}</span>
              </button>

              {/* Normal Density */}
              <button
                type="button"
                onClick={() => handleDensityChange('normal')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                  settings.tableDensity === 'normal'
                    ? 'border-blue-500 bg-blue-600/10 text-blue-400 ring-2 ring-blue-500/20'
                    : settings.theme === 'light'
                    ? 'border-border hover:bg-surface text-text'
                    : 'border-border hover:bg-surface-raised text-text-muted'
                }`}
              >
                <div className="flex flex-col gap-1.5 items-center mb-2">
                  <div className="w-12 h-2.5 bg-current opacity-70 rounded" />
                  <div className="w-12 h-2.5 bg-current opacity-70 rounded" />
                </div>
                <span className="text-xs font-bold block">{isArabic ? 'قياسي' : 'Normal'}</span>
                <span className="text-[9px] opacity-75">{isArabic ? 'متوازن ومريح' : 'Balanced default'}</span>
              </button>

              {/* Spacious Density */}
              <button
                type="button"
                onClick={() => handleDensityChange('spacious')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                  settings.tableDensity === 'spacious'
                    ? 'border-blue-500 bg-blue-600/10 text-blue-400 ring-2 ring-blue-500/20'
                    : settings.theme === 'light'
                    ? 'border-border hover:bg-surface text-text'
                    : 'border-border hover:bg-surface-raised text-text-muted'
                }`}
              >
                <div className="flex flex-col gap-2.5 items-center mb-2">
                  <div className="w-12 h-3.5 bg-current opacity-70 rounded" />
                  <div className="w-12 h-3.5 bg-current opacity-70 rounded" />
                </div>
                <span className="text-xs font-bold block">{isArabic ? 'واسع' : 'Spacious'}</span>
                <span className="text-[9px] opacity-75">{isArabic ? 'مسافات وهوامش مريحة' : 'Roomy spacing'}</span>
              </button>
            </div>

            {/* Density Live Sample Preview */}
            <div className="mt-3.5 p-3 rounded-xl border text-xs bg-surface-raised border-border">
              <div className="flex items-center justify-between text-[10px] text-text-muted mb-1.5 font-mono">
                <span>{isArabic ? 'معاينة حية لارتفاع الصف:' : 'Live Row Height Preview:'}</span>
                <span className="text-blue-400 font-bold">{settings.tableDensity}</span>
              </div>
              <div className="border rounded-lg overflow-hidden bg-surface border-border">
                <div className={`flex items-center justify-between font-semibold border-b border-border ${
                  settings.tableDensity === 'compact' ? 'py-1 px-3 text-[11px]' : settings.tableDensity === 'spacious' ? 'py-3.5 px-4 text-xs' : 'py-2 px-3 text-xs'
                }`}>
                  <span className="font-mono text-blue-400">S-0042</span>
                  <span>Mountain View iCity</span>
                  <span className="font-mono text-emerald-400 font-bold">8,500,000 EGP</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Additional Sync & Alert Options */}
          <div className="pt-2 border-t border-border space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              {isArabic ? 'خيارات إضافية' : 'Preferences'}
            </label>

            {/* Notification Sound */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent" />
                <span className="text-xs">{isArabic ? 'تنبيهات صوتية فور بيع أو حجز وحدة' : 'Notification alerts on unit status change'}</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enableNotificationSound}
                onChange={(e) => onUpdateSettings({ ...settings, enableNotificationSound: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Auto Sync Interval */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <span className="text-xs">{isArabic ? 'مزامنة سحابية تلقائية (Supabase)' : 'Cloud Auto-sync interval'}</span>
              </div>
              <select
                value={settings.autoSyncInterval}
                onChange={(e) => onUpdateSettings({ ...settings, autoSyncInterval: Number(e.target.value) })}
                className="text-xs px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer bg-surface border-border text-text"
              >
                <option value={0}>{isArabic ? 'يدوية فقط' : 'Manual only'}</option>
                <option value={60}>{isArabic ? 'كل دقيقة' : 'Every 1 minute'}</option>
                <option value={300}>{isArabic ? 'كل 5 دقائق' : 'Every 5 minutes'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex items-center justify-between bg-surface border-border">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition text-text-muted hover:text-text"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isArabic ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            {isArabic ? 'حفظ وتطبيق' : 'Apply & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UISettingsModal;
