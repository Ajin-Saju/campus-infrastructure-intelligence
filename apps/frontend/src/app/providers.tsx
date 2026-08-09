'use client';

import React from 'react';
import { AuthProvider } from '../context/auth-context';
import { AIAssistantProvider } from '../context/AIAssistantContext';
import { ChatbotDrawer } from '../components/ai-assistant/ChatbotDrawer';
import AppLayoutWrapper from '../components/navigation/AppLayoutWrapper';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AIAssistantProvider>
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
        <ChatbotDrawer />
      </AIAssistantProvider>
    </AuthProvider>
  );
}
