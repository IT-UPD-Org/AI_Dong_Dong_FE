import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as nextThemes from 'next-themes';
import { ThemeModeSelector, ThemeToggle } from '../components/theme/ThemeToggle';
import { ThemeProvider } from '../components/theme/ThemeProvider';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
  ThemeProvider: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="theme-provider" data-props={JSON.stringify(props)}>{children}</div>
  ),
}));

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

const setTheme = vi.fn();
const useTheme = vi.mocked(nextThemes.useTheme);
function themeState(theme = 'light', resolvedTheme = theme): ReturnType<typeof nextThemes.useTheme> {
  return { theme, resolvedTheme, setTheme, themes: ['light', 'dark', 'system'], systemTheme: 'light' };
}

beforeEach(() => {
  vi.clearAllMocks();
  document.documentElement.classList.remove('theme-transition');
  useTheme.mockReturnValue(themeState());
});

describe('global theme controls', () => {
  it('shows Sun in resolved light mode and switches to dark', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Chuyển sang giao diện tối' });
    expect(button).toHaveAttribute('title', 'Chuyển sang giao diện tối');
    expect(button.querySelector('.lucide-sun')).toHaveClass('opacity-100');
    expect(button.querySelector('.lucide-moon')).toHaveClass('opacity-0');
    fireEvent.click(button);
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('shows Moon in resolved dark mode and switches to light', () => {
    useTheme.mockReturnValue(themeState('dark'));
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' });
    expect(button.querySelector('.lucide-moon')).toHaveClass('opacity-100');
    expect(button.querySelector('.lucide-sun')).toHaveClass('opacity-0');
    fireEvent.click(button);
    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('uses the resolved theme when the saved preference is system', () => {
    useTheme.mockReturnValue(themeState('system', 'dark'));
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' }));
    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('the Settings selector updates the same global state for all three modes', () => {
    render(<ThemeModeSelector />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'themeLight' })).toHaveAttribute('aria-checked', 'true');
    for (const [name, value] of [['themeDark', 'dark'], ['themeSystem', 'system'], ['themeLight', 'light']]) {
      fireEvent.click(screen.getByRole('radio', { name }));
      expect(setTheme).toHaveBeenLastCalledWith(value);
    }
  });

  it('uses one class-based persisted provider with system preference enabled', () => {
    render(<ThemeProvider><div>child</div></ThemeProvider>);
    const props = JSON.parse(screen.getByTestId('theme-provider').getAttribute('data-props') || '{}');
    expect(props).toMatchObject({ attribute: 'class', storageKey: 'itupd-theme', defaultTheme: 'system', enableSystem: true });
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
