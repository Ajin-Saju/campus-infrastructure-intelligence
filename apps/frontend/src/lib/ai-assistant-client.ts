import { apiRequest } from '@/lib/auth-client';

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  contextEntity?: string | null;
  contextEntityId?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: AIMessage[];
}

export interface AIMessage {
  id?: string;
  conversationId?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt?: string;
  toolCalls?: any;
}

export async function fetchUserConversations(): Promise<AIConversation[]> {
  try {
    const res = await apiRequest<AIConversation[]>('/ai-assistant/conversations');
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.warn('fetchUserConversations warning:', err);
    return [];
  }
}

export async function fetchConversationById(id: string): Promise<AIConversation> {
  return apiRequest<AIConversation>(`/ai-assistant/conversations/${id}`);
}

export async function createConversation(
  title?: string,
  initialMessage?: string,
  contextEntity?: string,
  contextEntityId?: string,
): Promise<AIConversation> {
  return apiRequest<AIConversation>('/ai-assistant/conversations', {
    method: 'POST',
    body: JSON.stringify({
      title,
      initialMessage,
      contextEntity,
      contextEntityId,
    }),
  });
}

export async function postChatMessage(
  content: string,
  conversationId?: string,
  contextEntity?: string,
  contextEntityId?: string,
): Promise<{ conversationId: string; message: AIMessage }> {
  const endpoint = conversationId
    ? `/ai-assistant/conversations/${conversationId}/messages`
    : '/ai-assistant/messages';

  return apiRequest<{ conversationId: string; message: AIMessage }>(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      content,
      conversationId,
      contextEntity,
      contextEntityId,
    }),
  });
}

export async function renameConversation(id: string, title: string): Promise<void> {
  return apiRequest<void>(`/ai-assistant/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}

export async function deleteConversation(id: string): Promise<void> {
  return apiRequest<void>(`/ai-assistant/conversations/${id}`, {
    method: 'DELETE',
  });
}
