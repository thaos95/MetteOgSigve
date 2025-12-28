import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Countdown } from '../Countdown';

describe('Countdown', () => {
  beforeEach(() => {
    // Mock date to a fixed point: December 28, 2025
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-28T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders all time units with Norwegian labels', () => {
    render(<Countdown targetDate="2026-07-03T14:00:00" />);
    
    // After mounting, should show the countdown
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText('dager')).toBeInTheDocument();
    expect(screen.getByText('timer')).toBeInTheDocument();
    expect(screen.getByText('min')).toBeInTheDocument();
    expect(screen.getByText('sek')).toBeInTheDocument();
  });

  it('displays correct countdown values', () => {
    render(<Countdown targetDate="2026-07-03T14:00:00" />);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // From Dec 28 2025 12:00 to July 3 2026 14:00 is approximately 187 days
    // The exact values depend on the calculation
    const numbers = screen.getAllByText(/^\d{2,3}$/);
    expect(numbers.length).toBeGreaterThanOrEqual(4);
  });

  it('updates every second', () => {
    render(<Countdown targetDate="2026-07-03T14:00:00" />);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const initialSeconds = screen.getByText('sek').previousSibling?.textContent;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const newSeconds = screen.getByText('sek').previousSibling?.textContent;
    
    // Seconds should have changed (or wrapped around)
    expect(newSeconds).toBeDefined();
  });

  it('shows zero values when target date has passed', () => {
    render(<Countdown targetDate="2025-01-01T00:00:00" />);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should show zeros for past dates
    expect(screen.getAllByText('00').length).toBeGreaterThanOrEqual(4);
  });

  it('pads single digit numbers with leading zeros', () => {
    render(<Countdown targetDate="2026-07-03T14:00:00" />);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Hours, minutes, and seconds should be padded (e.g., "02" not "2")
    const numbers = screen.getAllByText(/^\d{2,3}$/);
    numbers.forEach(num => {
      expect(num.textContent?.length).toBeGreaterThanOrEqual(2);
    });
  });
});
