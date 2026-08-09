'use client';

import React from 'react';
import {
  Ticket,
  CheckCircle2,
  Clock,
  Lock,
  AlertTriangle,
  Info,
  MapPin,
  Building2,
  Package,
  Wrench,
  HelpCircle,
  Bell,
  Sparkles,
} from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onTicketClick?: (ticketNumber: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onTicketClick }) => {
  if (!content) return null;

  // Handle empty / no records found feedback specifically
  if (content.toLowerCase().includes("couldn't find any matching records")) {
    return (
      <div className="flex items-start gap-3 p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/50 rounded-2xl text-blue-900 dark:text-blue-200 text-xs">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed font-medium">{content}</div>
      </div>
    );
  }

  const lines = content.split('\n');

  const renderInlineStyles = (text: string) => {
    // 1. Status Pill Badges
    const statusPill = (statusStr: string, colorClass: string, IconComp: any) => (
      <span
        key={statusStr}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}
      >
        <IconComp className="w-3 h-3" />
        <span>{statusStr}</span>
      </span>
    );

    // Replace Markdown status badges with React Status Pills
    if (text.includes('🟡 **OPEN**') || text.includes('OPEN')) {
      text = text.replace(
        /(🟡 \*\*OPEN\*\*|Status: \*\*OPEN\*\*)/g,
        '__STATUS_OPEN__',
      );
    }
    if (text.includes('🔵 **IN PROGRESS**') || text.includes('IN PROGRESS')) {
      text = text.replace(
        /(🔵 \*\*IN PROGRESS\*\*|Status: \*\*IN_PROGRESS\*\*)/g,
        '__STATUS_IN_PROGRESS__',
      );
    }
    if (text.includes('✅ **RESOLVED**') || text.includes('RESOLVED')) {
      text = text.replace(
        /(✅ \*\*RESOLVED\*\*|Status: \*\*RESOLVED\*\*)/g,
        '__STATUS_RESOLVED__',
      );
    }
    if (text.includes('🔒 **CLOSED**') || text.includes('CLOSED')) {
      text = text.replace(
        /(🔒 \*\*CLOSED\*\*|Status: \*\*CLOSED\*\*)/g,
        '__STATUS_CLOSED__',
      );
    }

    // Split text into tokens by double asterisks **bold** and placeholders
    const parts = text.split(/(\*\*.*?\*\*|__STATUS_\w+__|TICK-\d+|TKT-\d{4}-\d{4})/g);

    return parts.map((part, idx) => {
      if (!part) return null;

      if (part === '__STATUS_OPEN__') {
        return (
          <React.Fragment key={idx}>
            {statusPill(
              'OPEN',
              'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
              Clock,
            )}
          </React.Fragment>
        );
      }
      if (part === '__STATUS_IN_PROGRESS__') {
        return (
          <React.Fragment key={idx}>
            {statusPill(
              'IN PROGRESS',
              'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
              Wrench,
            )}
          </React.Fragment>
        );
      }
      if (part === '__STATUS_RESOLVED__') {
        return (
          <React.Fragment key={idx}>
            {statusPill(
              'RESOLVED',
              'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
              CheckCircle2,
            )}
          </React.Fragment>
        );
      }
      if (part === '__STATUS_CLOSED__') {
        return (
          <React.Fragment key={idx}>
            {statusPill(
              'CLOSED',
              'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
              Lock,
            )}
          </React.Fragment>
        );
      }

      // Ticket Clickable Badge
      if (/^(TICK-\d+|TKT-\d{4}-\d{4})$/i.test(part)) {
        return (
          <button
            key={idx}
            onClick={() => onTicketClick && onTicketClick(part)}
            className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded-md transition-colors"
            title={`Click to lookup ${part}`}
          >
            <Ticket className="w-3 h-3 text-indigo-500" />
            <span>{part}</span>
          </button>
        );
      }

      // Bold Formatting (**text**)
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-gray-900 dark:text-gray-100">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic Formatting (*text*)
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="text-gray-600 dark:text-gray-300 not-italic">
            {part.slice(1, -1)}
          </em>
        );
      }

      return part;
    });
  };

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-gray-800 dark:text-gray-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header 3 (### Title)
        if (trimmed.startsWith('### ')) {
          return (
            <div
              key={idx}
              className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-gray-100 pt-1 pb-0.5 border-b border-gray-100 dark:border-gray-700/50"
            >
              <span>{renderInlineStyles(trimmed.replace('### ', ''))}</span>
            </div>
          );
        }

        // Header 2 (## Title)
        if (trimmed.startsWith('## ')) {
          return (
            <h4 key={idx} className="font-bold text-sm text-blue-600 dark:text-blue-400 pt-1">
              {renderInlineStyles(trimmed.replace('## ', ''))}
            </h4>
          );
        }

        // Tip Callout Box (💡 *Tip...*)
        if (trimmed.includes('💡') || trimmed.toLowerCase().startsWith('tip:')) {
          return (
            <div
              key={idx}
              className="mt-2 p-2.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div>{renderInlineStyles(trimmed)}</div>
            </div>
          );
        }

        // Bullet list item (• or -)
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
          const contentStr = trimmed.replace(/^(• |- )/, '');
          return (
            <div
              key={idx}
              className="flex items-start gap-2 pl-1 py-0.5 group hover:bg-gray-50/50 dark:hover:bg-gray-800/40 rounded-lg transition-colors"
            >
              <span className="text-blue-500 font-bold text-base leading-none select-none">•</span>
              <div className="flex-1">{renderInlineStyles(contentStr)}</div>
            </div>
          );
        }

        // Standard paragraph line
        return <p key={idx}>{renderInlineStyles(line)}</p>;
      })}
    </div>
  );
};
