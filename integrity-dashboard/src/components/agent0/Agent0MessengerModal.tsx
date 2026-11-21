import React, { useState, useEffect, useRef } from 'react';
import {
  X, Send, RefreshCw, MessageSquare, ShieldCheck, Terminal,
  Cpu, Copy, Check, Download, AlertCircle, Loader2, Sparkles, Database
} from 'lucide-react';
import {
  type Agent0Record,
  agent0Messenger,
  type A2AChatMessage,
  type A2AMessagePart
} from '../../services/agent0';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetAgent: Agent0Record | null;
}

export function Agent0MessengerModal({ isOpen, onClose, targetAgent }: Props) {
  const [messages, setMessages] = useState<A2AChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [contextId, setContextId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const a2aEndpoint = targetAgent?.services?.find((s) => s.name === 'A2A')?.endpoint || '';
  const agentKey = a2aEndpoint || targetAgent?.agentId || 'default';

  // Initialize conversation thread when opened
  useEffect(() => {
    if (isOpen && targetAgent) {
      const existingCtx = agent0Messenger.getContextId(agentKey);
      setContextId(existingCtx);
      if (messages.length === 0) {
        setMessages([
          {
            id: 'init_msg',
            role: 'system',
            parts: [
              {
                kind: 'text',
                text: `Connected to Agent0 peer "${targetAgent.name}" (#${targetAgent.tokenId}). A2A Protocol session ready.`,
              },
            ],
            contextId: existingCtx,
            timestamp: Date.now(),
          },
        ]);
      }
    }
  }, [isOpen, targetAgent, agentKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  if (!isOpen || !targetAgent) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: A2AChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      parts: [{ kind: 'text', text }],
      contextId,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const output = await agent0Messenger.talkToAgent({
        message: text,
        url: a2aEndpoint,
        agentId: targetAgent.agentId,
        agentName: targetAgent.name,
        contextId,
        newConversation: false,
      });

      setContextId(output.context_id);

      const agentReply: A2AChatMessage = {
        id: `agent_${Date.now()}`,
        role: 'agent',
        parts: output.parts || [{ kind: 'text', text: output.response }],
        contextId: output.context_id,
        timestamp: Date.now(),
        status: output.status,
      };

      setMessages((prev) => [...prev, agentReply]);
    } catch (err: any) {
      const errorMsg: A2AChatMessage = {
        id: `err_${Date.now()}`,
        role: 'system',
        parts: [{ kind: 'text', text: `A2A Communication Error: ${err?.message || 'Agent unreachable'}` }],
        contextId,
        timestamp: Date.now(),
        status: 'failed',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleResetConversation = () => {
    agent0Messenger.reset(agentKey);
    setContextId(null);
    setMessages([
      {
        id: `reset_${Date.now()}`,
        role: 'system',
        parts: [{ kind: 'text', text: 'Conversation context reset. Started fresh A2A session.' }],
        timestamp: Date.now(),
      },
    ]);
  };

  const copyText = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const exportTranscript = () => {
    const data = {
      agent: {
        id: targetAgent.agentId,
        name: targetAgent.name,
        wallet: targetAgent.walletAddress,
        endpoint: a2aEndpoint,
      },
      contextId,
      messages,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `a2a-messenger-${targetAgent.tokenId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'var(--surface-color, #111215)',
          border: '1px solid var(--border-color, #272a31)',
          borderRadius: 0,
          width: '100%',
          maxWidth: '740px',
          height: '85vh',
          maxHeight: '800px',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text-primary, #fff)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color, #272a31)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 0,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
                border: '1px solid rgba(99,102,241,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{targetAgent.name}</h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 0,
                    background: 'rgba(0, 229, 255, 0.1)',
                    color: 'var(--accent-color, #00e5ff)',
                    fontFamily: 'monospace',
                  }}
                >
                  #{targetAgent.tokenId}
                </span>
                {targetAgent.integrityDid && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 0,
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    <ShieldCheck size={11} /> Bound
                  </span>
                )}
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary, #888)' }}>
                {a2aEndpoint ? `A2A Gateway: ${a2aEndpoint}` : 'Decentralized A2A Benchmark Protocol (Direct)'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={exportTranscript}
              title="Export Conversation Transcript"
              style={{
                background: 'none',
                border: '1px solid var(--border-color, #333)',
                borderRadius: 0,
                padding: '0.4rem',
                color: 'var(--text-secondary, #888)',
                cursor: 'pointer',
              }}
            >
              <Download size={15} />
            </button>
            <button
              type="button"
              onClick={handleResetConversation}
              title="Reset Conversation (new_conversation: true)"
              style={{
                background: 'none',
                border: '1px solid var(--border-color, #333)',
                borderRadius: 0,
                padding: '0.4rem',
                color: 'var(--text-secondary, #888)',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #888)',
                cursor: 'pointer',
                padding: '0.4rem',
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sub-bar: Context & Confinement indicator */}
        <div
          style={{
            padding: '0.5rem 1.5rem',
            background: 'rgba(0,0,0,0.25)',
            borderBottom: '1px solid var(--border-color, #222)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888' }}>
            <span>A2A Context ID:</span>
            <code style={{ color: contextId ? '#00e5ff' : '#666', fontFamily: 'monospace' }}>
              {contextId || '(Initial session / turn 0)'}
            </code>
            {contextId && (
              <button
                type="button"
                onClick={() => copyText(contextId, 'ctx')}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}
              >
                {copiedId === 'ctx' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 0, background: '#10b981' }} />
            <span>eBPF Hardware Gated</span>
          </div>
        </div>

        {/* Message Thread Area */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const isSystem = m.role === 'system';

            if (isSystem) {
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: 'center',
                    padding: '0.35rem 0.85rem',
                    borderRadius: 0,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '0.75rem',
                    color: '#888',
                    textAlign: 'center',
                    maxWidth: '85%',
                  }}
                >
                  {m.parts.map((p, idx) => (
                    <span key={idx}>{p.text}</span>
                  ))}
                </div>
              );
            }

            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0 0.35rem',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <span>{isUser ? 'Caller (You)' : targetAgent.name}</span>
                  <span>·</span>
                  <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>

                <div
                  style={{
                    padding: '0.85rem 1.1rem',
                    borderRadius: 0,
                    borderTopRightRadius: isUser ? '2px' : '12px',
                    borderTopLeftRadius: !isUser ? '2px' : '12px',
                    background: isUser
                      ? 'linear-gradient(135deg, #4f46e5, #4338ca)'
                      : 'var(--surface-color, #1a1c22)',
                    border: isUser
                      ? '1px solid rgba(129,140,248,0.3)'
                      : '1px solid var(--border-color, #2d313a)',
                    color: '#f3f4f6',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.parts.map((p, idx) => (
                    <div key={idx}>
                      {p.kind === 'text' && <div>{p.text}</div>}
                      {p.kind === 'data' && (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            background: '#090a0d',
                            padding: '0.6rem 0.8rem',
                            borderRadius: 0,
                            border: '1px solid #222',
                            fontFamily: 'monospace',
                            fontSize: '0.78rem',
                            color: '#00e5ff',
                            overflowX: 'auto',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem', color: '#888' }}>
                            <Database size={11} />
                            <span>Structured DataPart Payload</span>
                          </div>
                          <pre style={{ margin: 0 }}>{JSON.stringify(p.data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {sending && (
            <div
              style={{
                alignSelf: 'flex-start',
                padding: '0.75rem 1rem',
                borderRadius: 0,
                borderTopLeftRadius: '2px',
                background: 'var(--surface-color, #1a1c22)',
                border: '1px solid var(--border-color, #2d313a)',
                color: '#888',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Loader2 size={15} className="animate-spin" />
              <span>A2A Endpoint evaluating turn…</span>
            </div>
          )}
        </div>

        {/* Suggested Quick Queries */}
        <div
          style={{
            padding: '0.4rem 1.5rem',
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            background: 'rgba(0,0,0,0.15)',
            borderTop: '1px solid var(--border-color, #222)',
          }}
        >
          {[
            'Audit security & memory safety bounds',
            'Fetch active PID quantitative state',
            'Verify ERC-8004 DID backlink proof',
            'Ping A2A capability card',
          ].map((promptText) => (
            <button
              key={promptText}
              type="button"
              disabled={sending}
              onClick={() => {
                setInput(promptText);
              }}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.74rem',
                borderRadius: 0,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color, #333)',
                color: '#aaa',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border-color, #272a31)',
            display: 'flex',
            gap: '0.65rem',
            background: 'var(--surface-color, #121316)',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${targetAgent.name} via A2A protocol…`}
            disabled={sending}
            autoFocus
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              borderRadius: 0,
              border: '1px solid var(--border-color, #333)',
              background: '#090a0d',
              color: '#fff',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="primary-button"
            style={{
              padding: '0.7rem 1.1rem',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              cursor: (!input.trim() || sending) ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
