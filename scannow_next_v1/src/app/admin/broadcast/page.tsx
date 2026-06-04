'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone, Send, X, AlertTriangle, CheckCircle2, Loader2, Radio,
} from 'lucide-react';
import { apiRequest, ItemResponse, GlobalBanner } from '@/lib/api';

/* ── Design tokens ── */
const P = {
  navy:        '#0e3a52',
  blue:        '#38B6FF',
  blueMid:     '#61A9E5',
  blueLight:   '#a8d8f0',
  bluePale:    '#c8eef7',
  bgBase:      '#EFFFFF',
  bgSurf:      '#EAF9FF',
  white:       '#ffffff',
  border:      '#daf2fb',
  greenBg:     '#f0fdf4',
  greenBorder: '#bbf7d0',
  greenText:   '#15803d',
  redBg:       '#fff0f0',
  redBorder:   '#fcd0d0',
  redText:     '#dc2626',
};

/* ── Section label ── */
function SectionLabel({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 3, height: 14, borderRadius: 99, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 9.5, fontWeight: 800, color: P.navy, letterSpacing: '0.13em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

export default function BroadcastAdmin() {
  const [message, setMessage]           = useState('');
  const [activeBanner, setActiveBanner] = useState<GlobalBanner | null>(null);
  const [loading, setLoading]           = useState(false);
  const [fetching, setFetching]         = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState<string | null>(null);
  const [txFocused, setTxFocused]       = useState(false);
  const MAX_CHARS = 300;

  const fetchActiveBanner = async () => {
    try {
      const res = await apiRequest<ItemResponse<GlobalBanner | null>>('/admin/banners/active');
      setActiveBanner(res.data);
    } catch (err) {
      console.error('Failed to fetch banner:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchActiveBanner(); }, []);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      await apiRequest('/admin/banners/set', {
        method: 'POST',
        body: JSON.stringify({ message: message.trim() }),
      });
      setSuccess('Banner broadcasted successfully to all restaurants!');
      setMessage('');
      await fetchActiveBanner();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to broadcast banner');
    } finally {
      setLoading(false);
    }
  };

  const handleClearBanner = async () => {
    if (!window.confirm('Are you sure you want to clear the active banner?')) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      await apiRequest('/admin/banners/clear', { method: 'POST' });
      setSuccess('Banner cleared successfully!');
      setActiveBanner(null);
      await fetchActiveBanner();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear banner');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12,
        background: P.bgBase, fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
        fontSize: 13, fontWeight: 700, color: P.blueMid,
      }}>
        <div style={{ width: 28, height: 28, border: `3px solid ${P.bluePale}`, borderTopColor: P.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Loading broadcast system…
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans','DM Sans','Segoe UI',sans-serif",
      background: P.bgBase,
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>

      {/* ── Sticky Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: P.bgBase,
        borderBottom: `1px solid ${P.border}`,
        padding: '13px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 13,
          background: `linear-gradient(135deg, ${P.navy}, ${P.blue})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Megaphone size={19} color={P.white} />
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: P.navy, margin: 0, letterSpacing: '-0.3px' }}>
            Global Broadcast
          </h1>
          <p style={{ fontSize: 11, color: P.blueMid, margin: '1px 0 0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Send notifications to all restaurant owners
          </p>
        </div>

        {/* Live pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', background: P.white, borderRadius: 20,
          border: `1.5px solid ${activeBanner ? P.blue : P.border}`,
          flexShrink: 0,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: activeBanner ? P.blue : P.blueLight,
            animation: activeBanner ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{
            fontSize: 9.5, fontWeight: 800,
            color: activeBanner ? P.navy : P.blueLight,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            display: 'none',
          }} className="pill-label">
            {activeBanner ? 'Banner Live' : 'No Active Banner'}
          </span>
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Toast ── */}
        {(success || error) && (
          <div style={{
            padding: '12px 14px',
            background: success ? P.greenBg : P.redBg,
            border: `1.5px solid ${success ? P.greenBorder : P.redBorder}`,
            borderRadius: 12,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            {success
              ? <CheckCircle2 size={16} color={P.greenText} style={{ flexShrink: 0, marginTop: 1 }} />
              : <AlertTriangle size={16} color={P.redText} style={{ flexShrink: 0, marginTop: 1 }} />}
            <span style={{ fontSize: 13, fontWeight: 600, color: success ? P.greenText : P.redText, lineHeight: 1.4 }}>
              {success || error}
            </span>
          </div>
        )}

        {/* ── Active Banner card ── */}
        <div style={{
          background: P.white, borderRadius: 20,
          border: `1.5px solid ${activeBanner ? P.blue : P.border}`,
          overflow: 'hidden',
          boxShadow: activeBanner ? `0 2px 16px rgba(56,182,255,0.12)` : '0 1px 6px rgba(56,182,255,0.05)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}>
          <div style={{ height: 3, background: `linear-gradient(90deg,${P.navy},${P.blue},${P.blueMid})` }} />
          <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <SectionLabel color={activeBanner ? P.blue : P.blueLight} label="Active Banner" />
              {activeBanner && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: P.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Radio size={11} color={P.white} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: P.blue, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Now</span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: P.blue, animation: 'pulse 1.5s infinite' }} />
                </div>
              )}
            </div>

            {activeBanner ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '13px 14px', background: P.bgSurf, borderRadius: 12, border: `1.5px solid ${P.border}` }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: P.navy, margin: 0, lineHeight: 1.65 }}>
                    {activeBanner.message}
                  </p>
                </div>
                {activeBanner.created_at && (
                  <div style={{ padding: '8px 12px', background: P.bgSurf, borderRadius: 10, border: `1.5px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div>
                      <p style={{ fontSize: 8, fontWeight: 800, color: P.blueMid, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 2px' }}>Sent at</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: P.navy, margin: 0 }}>
                        {new Date(activeBanner.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: `1.5px dashed ${P.bluePale}`, borderRadius: 12,
                padding: '24px 16px', gap: 8, textAlign: 'center',
              }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: P.bgSurf, border: `1.5px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                  <Megaphone size={20} color={P.blueLight} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: P.navy, margin: 0 }}>No active banner</p>
                <p style={{ fontSize: 12, color: P.blueMid, margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                  Compose a message below to broadcast to all restaurants
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Compose card ── */}
        <div style={{
          background: P.white, borderRadius: 20,
          border: `1.5px solid ${P.border}`,
          overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(56,182,255,0.07)',
        }}>
          <div style={{ height: 3, background: `linear-gradient(90deg,${P.navy},${P.blue},${P.blueMid})` }} />
          <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SectionLabel color={P.blue} label="Compose Broadcast" />

            <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 9, fontWeight: 800, color: P.blueMid, letterSpacing: '0.15em', textTransform: 'uppercase', paddingLeft: 2 }}>
                  Notification Message
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="e.g., System Maintenance tonight at 11:00 PM. All services will be temporarily unavailable."
                    disabled={loading}
                    onFocus={() => setTxFocused(true)}
                    onBlur={() => setTxFocused(false)}
                    style={{
                      width: '100%',
                      minHeight: 130,
                      padding: '13px 14px 32px',
                      background: P.bgSurf,
                      border: `1.5px solid ${txFocused ? P.blue : P.border}`,
                      boxShadow: txFocused ? `0 0 0 3px ${P.bluePale}` : 'none',
                      borderRadius: 13,
                      fontSize: 13,
                      fontWeight: 500,
                      color: P.navy,
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      lineHeight: 1.65,
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box',
                      display: 'block',
                    }}
                  />
                  {/* char count */}
                  <span style={{
                    position: 'absolute', bottom: 10, right: 13,
                    fontSize: 10, fontWeight: 700,
                    color: message.length > MAX_CHARS * 0.85 ? P.blueMid : P.blueLight,
                    pointerEvents: 'none',
                  }}>
                    {message.length}/{MAX_CHARS}
                  </span>
                </div>
              </div>



              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  style={{
                    flex: 1, padding: '13px',
                    background: loading || !message.trim() ? P.blueLight : P.blue,
                    color: P.white, border: 'none', borderRadius: 13,
                    fontSize: 12, fontWeight: 800, letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'inherit', transition: 'background 0.15s',
                    boxShadow: loading || !message.trim() ? 'none' : `0 4px 14px rgba(56,182,255,0.35)`,
                  }}
                >
                  {loading
                    ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Send size={15} />}
                  {loading ? 'Broadcasting…' : 'Broadcast Message'}
                </button>

                {activeBanner && (
                  <button
                    type="button"
                    onClick={handleClearBanner}
                    disabled={loading}
                    style={{
                      padding: '13px 18px',
                      background: P.bgSurf, color: P.blueMid,
                      border: `1.5px solid ${P.bluePale}`, borderRadius: 13,
                      fontSize: 12, fontWeight: 800, letterSpacing: '0.08em',
                      textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 7,
                      fontFamily: 'inherit', flexShrink: 0,
                    }}
                  >
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ── How It Works card ── */}

      </div>

      <style>{`
        @keyframes spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        textarea::placeholder { color: ${P.blueLight}; font-weight: 500; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${P.bluePale}; border-radius: 99px; }

        /* Show pill label on wider screens */
        @media (min-width: 400px) {
          .pill-label { display: inline !important; }
        }

        /* Desktop: side-by-side layout */
        @media (min-width: 768px) {
          .main-grid {
            display: grid !important;
            grid-template-columns: 1fr 300px;
            gap: 14px;
            align-items: start;
          }
          .right-col {
            display: flex !important;
            flex-direction: column;
            gap: 14px;
          }
          .compose-card { order: 0 !important; }
          .active-card  { order: 0 !important; }
          .howto-card   { order: 0 !important; }
        }
      `}</style>
    </div>
  );
}