'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  AIConversation,
  AIMessage,
  fetchUserConversations,
  fetchConversationById,
  createConversation,
  postChatMessage,
  deleteConversation as deleteConvApi,
  renameConversation as renameConvApi,
} from '@/lib/ai-assistant-client';

interface AIAssistantContextType {
  isOpen: boolean;
  isExpanded: boolean;
  toggleOpen: () => void;
  openAssistant: (contextEntity?: string, contextEntityId?: string) => void;
  closeAssistant: () => void;
  toggleExpand: () => void;
  conversations: AIConversation[];
  activeConversationId: string | null;
  messages: AIMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  startNewChat: () => void;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  contextEntity: string | null;
  contextEntityId: string | null;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export const AIAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextEntity, setContextEntity] = useState<string | null>(null);
  const [contextEntityId, setContextEntityId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const list = await fetchUserConversations();
      setConversations(list);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [user, loadConversations]);

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const toggleExpand = () => setIsExpanded((prev) => !prev);

  const openAssistant = (entity?: string, entityId?: string) => {
    if (entity) setContextEntity(entity);
    if (entityId) setContextEntityId(entityId);
    setIsOpen(true);
  };

  const closeAssistant = () => setIsOpen(false);

  const selectConversation = async (id: string) => {
    try {
      setIsLoading(true);
      const conv = await fetchConversationById(id);
      setActiveConversationId(conv.id);
      setMessages(conv.messages || []);
    } catch (err) {
      console.error('Failed to select conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const tempUserMsg: AIMessage = {
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await postChatMessage(
        content,
        activeConversationId || undefined,
        contextEntity || undefined,
        contextEntityId || undefined,
      );

      setActiveConversationId(res.conversationId);
      setMessages((prev) => [...prev, res.message]);
      await loadConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMsg: AIMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConv = async (id: string) => {
    try {
      await deleteConvApi(id);
      if (activeConversationId === id) {
        startNewChat();
      }
      await loadConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleRenameConv = async (id: string, newTitle: string) => {
    try {
      await renameConvApi(id, newTitle);
      await loadConversations();
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        isExpanded,
        toggleOpen,
        openAssistant,
        closeAssistant,
        toggleExpand,
        conversations,
        activeConversationId,
        messages,
        isLoading,
        sendMessage,
        startNewChat,
        selectConversation,
        deleteConversation: handleDeleteConv,
        renameConversation: handleRenameConv,
        contextEntity,
        contextEntityId,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
};
