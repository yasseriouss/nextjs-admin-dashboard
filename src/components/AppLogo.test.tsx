import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLogo } from './AppLogo';

describe('AppLogo', () => {
  it('renders the mono PNG on light theme', () => {
    render(<AppLogo theme="light" />);
    expect(screen.getByRole('img').getAttribute('src')).toBe('/logo-6o.png');
  });
  it('renders the white variant on dark theme', () => {
    render(<AppLogo theme="dark" />);
    expect(screen.getByRole('img').getAttribute('src')).toBe('/logo-6o-white.png');
  });
});
