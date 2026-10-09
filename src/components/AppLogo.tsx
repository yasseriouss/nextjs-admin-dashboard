import React from 'react';

interface AppLogoProps {
  variant?: 'mark' | 'full' | 'horizontal';  // kept for call-site compat; all render the lockup
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light';
  className?: string;
}

const DIM = { sm: 32, md: 40, lg: 52, xl: 80 };

export const AppLogo: React.FC<AppLogoProps> = ({ size = 'md', theme = 'dark', className = '' }) => {
  const isDark = theme === 'dark';
  return (
    <img
      src={isDark ? '/logo-6o-white.png' : '/logo-6o.png'}
      alt="6O"
      width={DIM[size]}
      height={DIM[size]}
      className={`shrink-0 object-contain ${className}`}
    />
  );
};
