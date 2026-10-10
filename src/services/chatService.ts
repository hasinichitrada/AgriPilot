import type { Language } from '../types/agri.ts';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
}

export interface ChatRequestPayload {
  message: string;
  chatInput?: string;
  sessionId: string;
  conversationId: string;
  language: Language;
  crop?: string;
}

export interface ChatResponse {
  success: boolean;
  reply?: string;
  error?: string;
  raw?: any;
}

// Generate a stable unique session ID and keep it throughout the conversation
export function getOrCreateSessionId(reset = false): string {
  const STORAGE_KEY = 'agripilot_chat_session_id';
  if (!reset) {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
  }
  const newSessionId = `agri-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  sessionStorage.setItem(STORAGE_KEY, newSessionId);
  return newSessionId;
}

export async function sendChatMessage(payload: ChatRequestPayload): Promise<ChatResponse> {
  const cleanMessage = payload.message.trim();
  if (!cleanMessage) {
    throw new Error('Message cannot be empty.');
  }

  const controller = new AbortController();
  // 65s client timeout matching the server proxy's 60s timeout for n8n AI agent workflows
  const timeoutId = setTimeout(() => controller.abort(), 65000);

  try {
    const response = await fetch('/api/chat-n8n', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'chat',
        chatInput: cleanMessage,
        message: cleanMessage,
        sessionId: payload.sessionId,
        conversationId: payload.conversationId,
        language: payload.language,
        crop: payload.crop || undefined,
        timestamp: new Date().toISOString()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMsg = errData.error || errData.details || `Server returned error (${response.status}: ${response.statusText})`;
      return {
        success: false,
        error: errorMsg
      };
    }

    const data = await response.json();

    if (data.success && data.reply) {
      return {
        success: true,
        reply: data.reply,
        raw: data.raw
      };
    } else if (data.reply) {
      return {
        success: true,
        reply: data.reply
      };
    } else {
      return {
        success: false,
        error: data.error || 'Empty or unexpected response from n8n agent.'
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: payload.language === 'te'
          ? 'సమయం మించిపోయింది: n8n ఏజెంట్ స్పందించడానికి ఎక్కువ సమయం తీసుకుంది. దయచేసి మళ్ళీ ప్రయత్నించండి.'
          : 'Request timed out: n8n agent took too long to respond. Please try again.'
      };
    }
    return {
      success: false,
      error: err.message || 'Network connection failed.'
    };
  }
}
