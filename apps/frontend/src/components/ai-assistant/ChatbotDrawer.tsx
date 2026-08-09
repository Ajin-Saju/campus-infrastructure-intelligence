'use client';

import React, { useState } from 'react';
import { useAIAssistant } from '@/context/AIAssistantContext';
import { useAuth } from '@/context/auth-context';
import { SuggestedQuestions } from './SuggestedQuestions';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ConversationHistorySidebar } from './ConversationHistorySidebar';
import {
  Bot,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  History,
  Plus,
  ShieldCheck,
} from 'lucide-react';

export const ChatbotDrawer: React.FC = () => {
  const { user } = useAuth();
  const {
    isOpen,
    isExpanded,
    toggleOpen,
    toggleExpand,
    conversations,
    activeConversationId,
    messages,
    isLoading,
    sendMessage,
    startNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
  } = useAIAssistant();

  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  if (!user) return null;

  const userName = user.firstName || 'there';

  return (
    <>
      {/* Floating AI Trigger Button */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium text-sm px-4 py-3 rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-purple-500/35 hover:scale-105 transition-all duration-300 group"
          title="Open AI Campus Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300"></span>
            </span>
          </div>
          <span className="hidden sm:inline font-semibold">Campus AI</span>
        </button>
      )}

      {/* Chat Panel / Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white dark:bg-gray-900 shadow-2xl transition-all duration-300 flex flex-col ${
            isExpanded
              ? 'inset-2 sm:inset-6 rounded-2xl border border-gray-200 dark:border-gray-800'
              : 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[450px] h-[100dvh] sm:h-[620px] sm:rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden'
          }`}
        >
          {/* Top Navigation Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-3.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-cyan-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm leading-tight">
                  <span>Campus AI Assistant</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-medium">
                    {typeof user.role === 'string' ? user.role : user.role?.name || 'STUDENT'}
                  </span>
                </div>
                <div className="text-[11px] text-blue-100/80 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-300" />
                  <span>Role-Authenticated AI</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistorySidebar((prev) => !prev)}
                className={`p-1.5 rounded-lg hover:bg-white/15 transition-colors ${
                  showHistorySidebar ? 'bg-white/20' : ''
                }`}
                title="Chat History"
              >
                <History className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={startNewChat}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                title="New Chat"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={toggleExpand}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors hidden sm:block"
                title={isExpanded ? 'Minimize' : 'Maximize'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-white" />}
              </button>

              <button
                onClick={toggleOpen}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                title="Close"
              >
                <X className="w-4.5 h-4.5 text-white" />
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* History Sidebar */}
            {showHistorySidebar && (
              <ConversationHistorySidebar
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={(id) => {
                  selectConversation(id);
                  setShowHistorySidebar(false);
                }}
                onNewChat={() => {
                  startNewChat();
                  setShowHistorySidebar(false);
                }}
                onDelete={deleteConversation}
                onRename={renameConversation}
                onCloseMobile={() => setShowHistorySidebar(false)}
              />
            )}

            {/* Chat Body */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/50 dark:bg-gray-900/50">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto">
                  <div className="text-center py-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-inner">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                      Hello, {userName}!
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                      I am your Campus Assistant. Ask me about maintenance issues, facility status, vendor repairs, or lost items.
                    </p>
                  </div>

                  <SuggestedQuestions onSelect={(q) => sendMessage(q)} />
                </div>
              ) : (
                <ChatMessageList messages={messages} isLoading={isLoading} />
              )}

              <ChatInput onSend={(text) => sendMessage(text)} isLoading={isLoading} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
