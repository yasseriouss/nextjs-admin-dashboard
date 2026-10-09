import React from 'react';
import { AppLogo } from './AppLogo';
import { useT } from '../i18n/useT';

interface AnimatedLogoLoaderProps {
  message?: string;
  subMessage?: string;
  theme?: 'dark' | 'light';
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedLogoLoader: React.FC<AnimatedLogoLoaderProps> = ({
  message,
  subMessage,
  theme = 'dark',
  fullScreen = true
}) => {
  const t = useT();
  const isDark = theme === 'dark';

  const defaultMsg = t('loader.default');

  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center select-none animate-in fade-in duration-500">
      {/* Animated Glowing Ring & Logo Container */}
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing orb */}
        <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-accent via-blue-500/20 to-purple-500/20 blur-xl animate-pulse" />
        
        {/* Rotating dash ring */}
        <div className="absolute w-28 h-28 rounded-full border-2 border-dashed border-accent animate-spin" style={{ animationDuration: '8s' }} />

        {/* Counter-rotating accent ring */}
        <div className="absolute w-32 h-32 rounded-full border border-blue-500/30 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />

        {/* Central Logo Box */}
        <div className={`relative z-10 w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
          isDark 
            ? 'bg-surface border border-border shadow-accent/20' 
            : 'bg-white border border-border shadow-xl'
        }`}>
          <AppLogo variant="mark" size="lg" theme={theme} />
        </div>
      </div>

      {/* Brand Title */}
      <div className="space-y-1">
        <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-text'}`}>
          {t('brand.nameAr')} {t('brand.date')}
        </h2>
        <p className="text-xs font-mono font-bold tracking-widest text-accent uppercase">
          {t('brand.nameCrm')}
        </p>
      </div>

      {/* Progress Animated Line */}
      <div className="w-56 h-1.5 rounded-full overflow-hidden bg-surface-raised border border-border">
        <div className="h-full bg-gradient-to-r from-blue-500 via-accent to-emerald-400 animate-pulse rounded-full w-full" />
      </div>

      {/* Status Message */}
      <div className="space-y-1">
        <p className={`text-xs font-semibold animate-pulse ${isDark ? 'text-text-muted' : 'text-text'}`}>
          {message || defaultMsg}
        </p>
        {subMessage && (
          <p className="text-[11px] text-text-muted font-normal">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${
        isDark ? 'bg-surface backdrop-blur-md' : 'bg-surface backdrop-blur-md'
      }`}>
        {content}
      </div>
    );
  }

  return content;
};
