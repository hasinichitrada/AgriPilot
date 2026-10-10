import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Sprout,
  CheckCircle2,
  AlertCircle,
  Minimize2,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import type { Language } from '../types/agri.ts';
import { sendChatMessage, getOrCreateSessionId, type ChatMessage } from '../services/chatService.ts';

interface AgriPilotChatProps {
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  selectedCrop?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AgriPilotChat: React.FC<AgriPilotChatProps> = ({
  language,
  onLanguageChange,
  selectedCrop,
  isOpen: controlledIsOpen,
  onOpenChange
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalIsOpen(value);
    }
  };

  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const [conversationId, setConversationId] = useState<string>(() => `conv-${Date.now()}`);

  const getWelcomeText = (lang: Language) => {
    return lang === 'te'
      ? 'నమస్కారం! నేను మీ AgriPilot AI సహాయకుడిని. మీ పంట సంరక్షణ, ఎరువులు, తెగుళ్ళు లేదా వ్యవసాయ సమస్యల గురించి నన్ను అడగండి.'
      : 'Hello! I am your AgriPilot AI Assistant. Ask me anything about your crops, pest management, fertilizers, or field practices.';
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'agent',
      text: getWelcomeText(language),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Voice speech state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Update initial welcome message when language toggles if no other messages exist
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-1') {
        return [
          {
            id: 'welcome-1',
            sender: 'agent',
            text: getWelcomeText(language),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];
      }
      return prev;
    });
  }, [language]);

  // Clean up microphone on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  // Reset conversation (New Chat)
  const handleResetChat = () => {
    const newSession = getOrCreateSessionId(true);
    setSessionId(newSession);
    setConversationId(`conv-${Date.now()}`);
    setErrorMessage(null);
    setInputText('');
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'agent',
        text: getWelcomeText(language),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Submit message to n8n chatbot
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: text,
        chatInput: text,
        sessionId,
        conversationId,
        language,
        crop: selectedCrop
      });

      if (response.success && response.reply) {
        const agentMessage: ChatMessage = {
          id: `agt-${Date.now()}`,
          sender: 'agent',
          text: response.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, agentMessage]);
      } else {
        const failText = response.error || (language === 'te' ? 'సమాధానం అందుబాటులో లేదు.' : 'Unable to receive response.');
        setErrorMessage(failText);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'agent',
            text: language === 'te'
              ? `క్షమించండి, n8n ఏజెంట్ అనుసంధానంలో లోపం ఏర్పడింది: ${failText}`
              : `Sorry, there was an issue communicating with the n8n agent: ${failText}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'error'
          }
        ]);
      }
    } catch (err: any) {
      const failText = err.message || 'Connection error';
      setErrorMessage(failText);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          text: language === 'te'
            ? `నెట్‌వర్క్ లోపం: దయచేసి మళ్ళీ ప్రయత్నించండి.`
            : `Network error: Please verify your connection and try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'error'
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Voice speech transcription inside chatbot
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(language === 'te' ? 'ఈ బ్రౌజర్‌లో వాయిస్ అందుబాటులో లేదు.' : 'Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (_) {
      setIsListening(false);
    }
  };

  // Suggested Prompts explicitly required
  const suggestedPrompts = language === 'te'
    ? [
        'నా వరి ఆకులు ఎందుకు పసుపు రంగులోకి మారుతున్నాయి?',
        'మిరపలో పురుగులను ఎలా నివారించాలి?',
        'ఎరువులు వేసే ముందు ఏమి తనిఖీ చేయాలి?'
      ]
    : [
        'Why are my paddy leaves turning yellow?',
        'How can I manage pests in chilli?',
        'What should I check before applying fertilizer?'
      ];

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 no-print">
      {/* Floating Chat Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group relative flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white font-bold shadow-xl shadow-emerald-700/30 hover:shadow-emerald-700/50 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-emerald-100"
          title="Ask AgriPilot"
          aria-label="Open AgriPilot AI Chatbot"
        >
          <div className="relative">
            <Sprout className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
          </div>
          <span className="text-sm tracking-wide">
            {language === 'te' ? 'AgriPilotని అడగండి' : 'Ask AgriPilot'}
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-emerald-100">
            AI
          </span>
        </button>
      )}

      {/* Expanded Chat Drawer / Popup Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-3xl border border-stone-200 shadow-2xl transition-all duration-200 flex flex-col overflow-hidden ${
            isMinimized
              ? 'w-72 sm:w-80 h-16'
              : 'w-[calc(100vw-2rem)] sm:w-[420px] md:w-[460px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 px-4 py-3.5 text-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
                <Sprout className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  <span>AgriPilot AI Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </h4>
                <p className="text-[11px] text-emerald-100 opacity-90">
                  {language === 'te' ? 'మీ AI వ్యవసాయ సహచరుడు' : 'Your AI Farming Companion'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* New Chat Reset Button */}
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer text-white/90 hover:text-white"
                title={language === 'te' ? 'కొత్త సంభాషణ ప్రారంభించండి' : 'Start New Chat'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Minimize / Maximize Button */}
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer text-white/90 hover:text-white"
                title={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer text-white/90 hover:text-white"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Context Bar (Active Crop & Language) */}
              <div className="bg-emerald-50/80 px-4 py-1.5 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900 shrink-0">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>n8n AI Agent Connected</span>
                  {selectedCrop && (
                    <span className="bg-emerald-200/70 text-emerald-900 px-2 py-0.2 rounded-full text-[10px] font-semibold">
                      {selectedCrop}
                    </span>
                  )}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-800">
                  {language === 'te' ? 'తెలుగు' : 'English'}
                </span>
              </div>

              {/* Conversation Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/60">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'agent' && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-emerald-700 text-white rounded-br-xs'
                          : msg.status === 'error'
                          ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-bl-xs'
                          : 'bg-white border border-stone-200 text-stone-800 rounded-bl-xs'
                      }`}
                    >
                      {/* Formatted Text with Linebreaks Preserved */}
                      <div className="whitespace-pre-wrap font-sans">
                        {msg.text}
                      </div>

                      <div className="flex items-center justify-end gap-1 mt-1.5">
                        <span
                          className={`text-[9px] ${
                            msg.sender === 'user' ? 'text-emerald-200' : 'text-stone-400'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-stone-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {/* AI Typing / Loading Indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2.5 text-stone-500 text-xs py-1">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs flex items-center gap-2.5 shadow-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span className="font-medium text-stone-700">
                        {language === 'te'
                          ? 'AgriPilot n8n ఏజెంట్ సమాధానం సిద్ధం చేస్తోంది...'
                          : 'AgriPilot n8n Agent is thinking...'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Anchor for auto-scroll */}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Prompts Pill Section */}
              <div className="px-3.5 py-2 bg-stone-100/80 border-t border-stone-200 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
                {suggestedPrompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSendMessage(promptText)}
                    className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-stone-300 text-stone-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50 font-medium shadow-2xs"
                  >
                    💡 {promptText}
                  </button>
                ))}
              </div>

              {/* Input Area with Microphone and Send Button */}
              <div className="p-3 bg-white border-t border-stone-200 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                    title={isListening ? 'Stop recording' : 'Speak message'}
                    aria-label="Microphone Voice Input"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      language === 'te'
                        ? 'సందేశం టైప్ చేయండి లేదా అడగండి...'
                        : 'Type your farming question...'
                    }
                    disabled={isLoading}
                    className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all disabled:bg-stone-100"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-all cursor-pointer shadow-md disabled:cursor-not-allowed shrink-0"
                    title={language === 'te' ? 'పంపండి' : 'Send'}
                    aria-label="Send Message"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
