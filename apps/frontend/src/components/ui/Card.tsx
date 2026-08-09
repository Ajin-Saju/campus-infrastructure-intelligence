'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = false,
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const base = glass
    ? 'glass-card rounded-2xl p-5 shadow-sm transition-all duration-300'
    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all duration-300';

  const hover = hoverEffect
    ? 'hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700'
    : '';

  return (
    <div className={`${base} ${hover} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const GlassCard: React.FC<CardProps> = (props) => <Card glass {...props} />;
