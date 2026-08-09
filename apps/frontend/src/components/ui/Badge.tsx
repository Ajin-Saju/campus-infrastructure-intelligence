'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Lock, XCircle, Wrench, ShieldAlert } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'amber';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center gap-1 font-semibold rounded-full border transition-colors';

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variants = {
    default:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    success:
      'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    warning:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    danger:
      'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    info:
      'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    purple:
      'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    amber:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
  };

  return (
    <span className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const upper = (status || '').toUpperCase();

  switch (upper) {
    case 'OPEN':
    case 'PENDING':
      return (
        <Badge variant="warning" size={size}>
          <Clock className="w-3 h-3" />
          <span>OPEN</span>
        </Badge>
      );
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
    case 'ASSIGNED':
      return (
        <Badge variant="info" size={size}>
          <Wrench className="w-3 h-3" />
          <span>IN PROGRESS</span>
        </Badge>
      );
    case 'RESOLVED':
    case 'COMPLETED':
      return (
        <Badge variant="success" size={size}>
          <CheckCircle2 className="w-3 h-3" />
          <span>RESOLVED</span>
        </Badge>
      );
    case 'CLOSED':
      return (
        <Badge variant="default" size={size}>
          <Lock className="w-3 h-3" />
          <span>CLOSED</span>
        </Badge>
      );
    case 'CRITICAL':
    case 'REJECTED':
      return (
        <Badge variant="danger" size={size}>
          <ShieldAlert className="w-3 h-3" />
          <span>{upper}</span>
        </Badge>
      );
    case 'HIGH':
      return (
        <Badge variant="danger" size={size}>
          <AlertTriangle className="w-3 h-3" />
          <span>HIGH</span>
        </Badge>
      );
    default:
      return <Badge size={size}>{upper}</Badge>;
  }
};
