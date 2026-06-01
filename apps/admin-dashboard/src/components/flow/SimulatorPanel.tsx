import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, RotateCcw, ChevronDown, ChevronRight, Clock, Send } from 'lucide-react';
import {
  simulatorApi,
  InteractiveMessage,
  SimulatorResponse,
  SimulatorSession,
} from '@/api/adminFlows';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SimulatorPanelProps {
  businessId: string;
  flowId: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  message: InteractiveMessage;
  nodeId?: string;
  timestamp: Date;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Session expiry timeout in ms (60 minutes). */
const SESSION_EXPIRY_MS = 60 * 60 * 1000;

/** Warning threshold — show warning after 50 minutes of inactivity. */
const SESSION_WARNING_MS = 50 * 60 * 1000;

// ─── Component ───────────────────────────────────────────────────────────────

export const SimulatorPanel: React.FC<SimulatorPanelProps> = ({
  businessId,
  flowId,
  onClose,
}) => {
  const [session, setSession] = useState<SimulatorSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [contextData, setContextData] = useState<Record<string, unknown>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [expiryWarning, setExpiryWarning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  // ─── Session Initialization ──────────────────────────────────────────────

  const initSession = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    setMessages([]);
    setIsComplete(false);
    setExpiryWarning(false);
    setIsExpired(false);
    lastActivityRef.current = new Date();

    try {
      const { session: newSession, initialResponse } = await simulatorApi.createSession(
        businessId,
        flowId
      );

      setSession(newSession);
      setCurrentNodeId(initialResponse.currentNodeId);
      setContextData(initialResponse.contextData);

      // Add ALL initial bot messages (including auto-advanced greeting)
      const allMessages = initialResponse.messages || [initialResponse.message];
      const botMessages: ChatMessage[] = allMessages.map((msg, idx) => ({
        id: `msg_init_${Date.now()}_${idx}`,
        direction: 'outbound' as const,
        message: msg,
        nodeId: initialResponse.currentNodeId,
        timestamp: new Date(Date.now() + idx), // slight offset for ordering
      }));
      setMessages(botMessages);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to create simulation session';
      setError(msg);
    } finally {
      setIsInitializing(false);
    }
  }, [businessId, flowId]);

  // Initialize on mount
  useEffect(() => {
    initSession();
  }, [initSession]);

  // ─── Expiry Timer ────────────────────────────────────────────────────────

  useEffect(() => {
    expiryTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current.getTime();

      if (elapsed >= SESSION_EXPIRY_MS) {
        setIsExpired(true);
        setExpiryWarning(false);
      } else if (elapsed >= SESSION_WARNING_MS) {
        setExpiryWarning(true);
      } else {
        setExpiryWarning(false);
      }
    }, 30_000); // Check every 30 seconds

    return () => {
      if (expiryTimerRef.current) {
        clearInterval(expiryTimerRef.current);
      }
    };
  }, []);

  // ─── Auto-scroll ─────────────────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Handle Response ─────────────────────────────────────────────────────

  const handleResponse = useCallback((response: SimulatorResponse) => {
    lastActivityRef.current = new Date();
    setExpiryWarning(false);

    setCurrentNodeId(response.currentNodeId);
    setContextData(response.contextData);
    setIsComplete(response.complete);

    // Add ALL bot messages (handles auto-advance intermediate messages)
    const allMessages = response.messages || [response.message];
    const botMessages: ChatMessage[] = allMessages.map((msg, idx) => ({
      id: `msg_${Date.now()}_bot_${idx}`,
      direction: 'outbound' as const,
      message: msg,
      nodeId: response.currentNodeId,
      timestamp: new Date(Date.now() + idx),
    }));
    setMessages((prev) => [...prev, ...botMessages]);
  }, []);

  // ─── Send Text Message ───────────────────────────────────────────────────

  const handleSendMessage = useCallback(async () => {
    if (!session || !inputText.trim() || isLoading || isComplete || isExpired) return;

    const text = inputText.trim();
    setInputText('');
    lastActivityRef.current = new Date();

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      direction: 'inbound',
      message: { type: 'text', body: { text } },
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);
    setError(null);

    try {
      const response = await simulatorApi.sendMessage(businessId, session.id, text);
      handleResponse(response);
    } catch (err: any) {
      if (err.response?.status === 410) {
        setIsExpired(true);
        setError('Session expired. Please reset to start a new session.');
      } else {
        const msg =
          err.response?.data?.error?.message || err.message || 'Failed to send message';
        setError(msg);
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [session, inputText, isLoading, isComplete, isExpired, businessId, handleResponse]);

  // ─── Send Interactive Reply ──────────────────────────────────────────────

  const handleInteractiveReply = useCallback(
    async (type: string, id: string, title: string) => {
      if (!session || isLoading || isComplete || isExpired) return;

      lastActivityRef.current = new Date();

      // Add user message to chat (showing the button/list item they clicked)
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        direction: 'inbound',
        message: { type: 'text', body: { text: title } },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setIsLoading(true);
      setError(null);

      try {
        const response = await simulatorApi.sendInteractive(businessId, session.id, {
          type,
          id,
          title,
        });
        handleResponse(response);
      } catch (err: any) {
        if (err.response?.status === 410) {
          setIsExpired(true);
          setError('Session expired. Please reset to start a new session.');
        } else {
          const msg =
            err.response?.data?.error?.message ||
            err.message ||
            'Failed to send interactive reply';
          setError(msg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [session, isLoading, isComplete, isExpired, businessId, handleResponse]
  );

  // ─── Reset Session ───────────────────────────────────────────────────────

  const handleReset = useCallback(async () => {
    if (session) {
      try {
        await simulatorApi.resetSession(businessId, session.id);
      } catch {
        // Ignore reset errors — we'll create a new session anyway
      }
    }
    setSession(null);
    initSession();
  }, [session, businessId, initSession]);

  // ─── Key Handler ─────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // ─── Render Helpers ──────────────────────────────────────────────────────

  const renderInteractiveButtons = (message: InteractiveMessage) => {
    if (!message.action?.buttons) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {message.action.buttons.map((btn) => (
          <button
            key={btn.reply.id}
            onClick={() => handleInteractiveReply('button_reply', btn.reply.id, btn.reply.title)}
            disabled={isLoading || isComplete || isExpired}
            className="px-3 py-1.5 text-[12px] font-medium rounded-full border border-[#25D366] text-[#25D366] bg-white hover:bg-[#25D366] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {btn.reply.title}
          </button>
        ))}
      </div>
    );
  };

  const renderInteractiveList = (message: InteractiveMessage) => {
    if (!message.action?.sections) return null;

    return (
      <div className="mt-2 border border-[#E0DFDE] rounded-lg overflow-hidden">
        {message.action.sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.title && (
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#6F6D7A] bg-[#F5F3F1]">
                {section.title}
              </div>
            )}
            {section.rows.map((row) => (
              <button
                key={row.id}
                onClick={() => handleInteractiveReply('list_reply', row.id, row.title)}
                disabled={isLoading || isComplete || isExpired}
                className="w-full text-left px-3 py-2 border-t border-[#F0EFEE] first:border-t-0 hover:bg-[#F5F3F1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="text-[12px] font-medium text-[#03031F]">{row.title}</div>
                {row.description && (
                  <div className="text-[11px] text-[#6F6D7A] mt-0.5">{row.description}</div>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderChatBubble = (chatMsg: ChatMessage) => {
    const isBot = chatMsg.direction === 'outbound';
    const msg = chatMsg.message;

    return (
      <div
        key={chatMsg.id}
        className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}
      >
        <div
          className={`max-w-[85%] rounded-lg px-3 py-2 ${
            isBot
              ? 'bg-[#F0F0F0] text-[#03031F] rounded-tl-sm'
              : 'bg-[#DCF8C6] text-[#03031F] rounded-tr-sm'
          }`}
        >
          {/* Header */}
          {msg.header && (
            <div className="text-[11px] font-semibold text-[#6F6D7A] mb-1">
              {msg.header.text}
            </div>
          )}

          {/* Body */}
          <div className="text-[13px] whitespace-pre-wrap leading-relaxed">
            {msg.body.text}
          </div>

          {/* Footer */}
          {msg.footer && (
            <div className="text-[10px] text-[#A8A6B0] mt-1">{msg.footer.text}</div>
          )}

          {/* Interactive elements (only for bot messages) */}
          {isBot && renderInteractiveButtons(msg)}
          {isBot && renderInteractiveList(msg)}

          {/* Timestamp */}
          <div className="text-[9px] text-[#A8A6B0] mt-1 text-right">
            {chatMsg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="w-[380px] border-l flex flex-col bg-white"
      style={{ borderColor: '#F0EFEE' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#F0EFEE' }}
      >
        <span className="font-sans text-[14px] font-semibold" style={{ color: '#03031F' }}>
          Flow Simulator
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={isInitializing}
            className="p-1.5 rounded hover:bg-[#F5F3F1] transition-colors disabled:opacity-50"
            title="Reset session"
          >
            <RotateCcw size={14} style={{ color: '#6F6D7A' }} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#F5F3F1] transition-colors"
          >
            <X size={16} style={{ color: '#6F6D7A' }} />
          </button>
        </div>
      </div>

      {/* Session expiry warning */}
      {expiryWarning && !isExpired && (
        <div className="px-4 py-2 bg-[#FFF3CD] border-b border-[#FFEAA7] flex items-center gap-2">
          <Clock size={12} className="text-[#856404]" />
          <span className="text-[11px] text-[#856404] font-medium">
            Session will expire soon due to inactivity
          </span>
        </div>
      )}

      {/* Session expired */}
      {isExpired && (
        <div className="px-4 py-2 bg-[#F8D7DA] border-b border-[#F5C6CB] flex items-center gap-2">
          <Clock size={12} className="text-[#721C24]" />
          <span className="text-[11px] text-[#721C24] font-medium">
            Session expired — click Reset to start a new session
          </span>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-3 py-4" style={{ background: '#ECE5DD' }}>
        {isInitializing ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-5 h-5 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin"
              />
              <span className="text-[11px] text-[#6F6D7A]">Starting simulation…</span>
            </div>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-[12px] text-[#C62020] font-medium">{error}</p>
              <button
                onClick={handleReset}
                className="mt-3 text-[11px] text-[#25D366] font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map(renderChatBubble)}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-[#F0F0F0] rounded-lg px-4 py-2 rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#A8A6B0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#A8A6B0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#A8A6B0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Completion indicator */}
            {isComplete && (
              <div className="flex justify-center my-3">
                <span className="text-[11px] text-[#6F6D7A] bg-white/80 px-3 py-1 rounded-full">
                  Flow completed
                </span>
              </div>
            )}

            {/* Error inline */}
            {error && messages.length > 0 && (
              <div className="flex justify-center my-2">
                <span className="text-[11px] text-[#C62020] bg-white/80 px-3 py-1 rounded-full">
                  {error}
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="px-3 py-2 border-t flex-shrink-0" style={{ borderColor: '#F0EFEE' }}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isExpired
                ? 'Session expired'
                : isComplete
                ? 'Flow completed'
                : 'Type a message…'
            }
            disabled={isLoading || isComplete || isExpired || isInitializing}
            className="flex-1 px-3 py-2 text-[13px] rounded-full border border-[#E0DFDE] bg-white focus:outline-none focus:border-[#25D366] disabled:bg-[#F5F3F1] disabled:cursor-not-allowed transition-colors"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading || isComplete || isExpired || isInitializing}
            className="p-2 rounded-full bg-[#25D366] text-white hover:bg-[#20BD5A] disabled:bg-[#C9C7CF] disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Debug panel */}
      <div className="border-t flex-shrink-0" style={{ borderColor: '#F0EFEE' }}>
        <button
          onClick={() => setDebugOpen(!debugOpen)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#F5F3F1] transition-colors"
        >
          <span className="text-[11px] font-semibold text-[#6F6D7A] uppercase tracking-wide">
            Debug
          </span>
          {debugOpen ? (
            <ChevronDown size={12} className="text-[#6F6D7A]" />
          ) : (
            <ChevronRight size={12} className="text-[#6F6D7A]" />
          )}
        </button>

        {debugOpen && (
          <div className="px-4 pb-3 max-h-[200px] overflow-y-auto">
            <div className="mb-2">
              <span className="text-[10px] font-semibold text-[#A8A6B0] uppercase">
                Current Node
              </span>
              <div className="mt-0.5 font-mono text-[11px] text-[#03031F] bg-[#F5F3F1] px-2 py-1 rounded">
                {currentNodeId || '—'}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-[#A8A6B0] uppercase">
                Context Data
              </span>
              <pre className="mt-0.5 font-mono text-[10px] text-[#03031F] bg-[#F5F3F1] px-2 py-1.5 rounded overflow-x-auto whitespace-pre-wrap break-all max-h-[120px] overflow-y-auto">
                {JSON.stringify(contextData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
