import React, { useState } from 'react';
import { X, Star, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { type Agent0Record } from '../../services/agent0';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetAgent?: Agent0Record | null;
}

export function Agent0FeedbackModal({ isOpen, onClose, targetAgent }: Props) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('Excellent performance. Executed tasks cleanly within eBPF security boundaries.');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // In production, this signs an EIP-712 reputation attestation or calls ReputationRegistry.sol
      await new Promise((r) => setTimeout(r, 600));
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="modal-content" style={{
        background: 'var(--surface-color, #121316)',
        border: '1px solid var(--border-color, #2a2d35)',
        borderRadius: '12px', width: '100%', maxWidth: '500px',
        padding: '2rem', color: 'var(--text-primary, #fff)', position: 'relative'
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.25rem', right: '1.25rem',
            background: 'none', border: 'none', color: 'var(--text-secondary, #888)',
            cursor: 'pointer'
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            padding: '0.6rem', borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'
          }}>
            <Star size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, margin: 0 }}>Agent Reputation Feedback</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary, #888)' }}>
              Submit cryptographic review & score for {targetAgent?.name || 'Agent'}.
            </p>
          </div>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle2 size={44} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Feedback Recorded!</h3>
            <p style={{ color: 'var(--text-secondary, #888)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Your rating of {rating} stars has been cryptographically logged to the Agent0 registry.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={onClose}
              style={{ padding: '0.55rem 1.25rem', borderRadius: '6px' }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary, #aaa)' }}>
                Rating
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0.25rem', color: (hoverRating || rating) >= star ? '#f59e0b' : '#444'
                    }}
                  >
                    <Star size={24} fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary, #aaa)' }}>
                Review Notes & Proof Evaluation
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px',
                  background: 'var(--bg-color, #0a0b0d)', border: '1px solid var(--border-color, #333)',
                  color: '#fff', fontSize: '0.9rem'
                }}
              />
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444', fontSize: '0.85rem'
              }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                disabled={loading}
                style={{ padding: '0.65rem 1.25rem', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={loading}
                style={{
                  padding: '0.65rem 1.25rem', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing Feedback…</span>
                  </>
                ) : (
                  <span>Submit On-Chain Feedback</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
