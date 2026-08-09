'use client';

import React from 'react';
import { useAIAssistant } from '@/context/AIAssistantContext';
import { SuggestedQuestions } from '@/components/ai-assistant/SuggestedQuestions';
import { ChatMessageList } from '@/components/ai-assistant/ChatMessageList';
import { ChatInput } from '@/components/ai-assistant/ChatInput';
import { ConversationHistorySidebar } from '@/components/ai-assistant/ConversationHistorySidebar';
import { Bot, Sparkles, Plus } from 'lucide-react';

export default function StandaloneAssistantPage() {
  const {
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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col sm:flex-row bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-lg m-2 sm:m-4">
      {/* Sidebar */}
      <div className="hidden sm:block w-72 h-full">
        <ConversationHistorySidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={selectConversation}
          onNewChat={startNewChat}
          onDelete={deleteConversation}
          onRename={renameConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/50 dark:bg-gray-900/50">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>AI Campus Assistant</span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                  Enterprise AI
                </span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ask about maintenance, issues, assets, locations, or lost items
              </p>
            </div>
          </div>

          <button
            onClick={startNewChat}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800/40 rounded-xl px-3 py-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Messages */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full p-6 overflow-y-auto">
            <div className="text-center mb-8 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-inner">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Welcome to your AI Campus Assistant
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a suggested question below or type a query to search authorized campus data.
              </p>
            </div>

            <SuggestedQuestions onSelect={(q) => sendMessage(q)} />
          </div>
        ) : (
          <ChatMessageList messages={messages} isLoading={isLoading} />
        )}

        {/* Input */}
        <div className="max-w-4xl mx-auto w-full">
          <ChatInput onSend={(text) => sendMessage(text)} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
