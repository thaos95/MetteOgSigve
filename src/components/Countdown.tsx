'use client';

import { useEffect, useState } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownProps {
  targetDate: string;
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  const difference = new Date(targetDate).getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex justify-center gap-6 sm:gap-8">
        {['dager', 'timer', 'min', 'sek'].map((label) => (
          <div key={label} className="text-center min-w-[4rem]">
            <span className="font-serif text-3xl sm:text-4xl text-primary tabular-nums">--</span>
            <span className="block text-xs uppercase tracking-wide text-warm-gray mt-1">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  const units = [
    { value: timeLeft.days, label: 'dager' },
    { value: timeLeft.hours, label: 'timer' },
    { value: timeLeft.minutes, label: 'min' },
    { value: timeLeft.seconds, label: 'sek' },
  ];

  return (
    <div className="flex justify-center gap-6 sm:gap-8">
      {units.map(({ value, label }) => (
        <div key={label} className="text-center min-w-[4rem]">
          <span className="font-serif text-3xl sm:text-4xl text-primary tabular-nums">
            {value.toString().padStart(2, '0')}
          </span>
          <span className="block text-xs uppercase tracking-wide text-warm-gray mt-1">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
