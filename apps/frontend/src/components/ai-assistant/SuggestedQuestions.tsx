'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onSelect }) => {
  const { user } = useAuth();
  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name || 'STUDENT';

  const getSuggestions = () => {
    switch (roleName) {
      case 'ADMIN':
        return [
          'Which building has the most open issues?',
          'Show critical issues',
          'Which assets are failing repeatedly?',
          'Show overdue maintenance tasks',
          'Give me a campus maintenance summary',
        ];
      case 'TECHNICIAN':
      case 'MAINTENANCE STAFF':
        return [
          'Show my assigned tasks',
          'What should I work on first?',
          'Show my overdue tasks',
          'What issues are assigned to me?',
        ];
      case 'VENDOR':
        return [
          'Show my assigned repairs',
          'Which repair is due first?',
          'Show my pending quotations',
          'Show my invoices',
        ];
      case 'FACULTY':
        return [
          'Show my reports',
          'Show my unresolved reports',
          'What is the status of my report?',
          'Are there any found items?',
        ];
      case 'STUDENT':
      default:
        return [
          'Show my unresolved reports',
          'What is the status of my issue?',
          'Show me my notifications',
          'How do I report a maintenance problem?',
          'Are there any lost items?',
        ];
    }
  };

  const suggestions = getSuggestions();

  return (
    <div className="flex flex-col gap-2 my-4 px-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
        <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
        <span>Suggested Questions for {roleName}:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            className="text-left text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700/60 rounded-xl px-3 py-2 transition-all duration-200 shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
