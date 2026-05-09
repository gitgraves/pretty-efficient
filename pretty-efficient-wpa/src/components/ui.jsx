import { useState } from 'react'

// ── Status config ──────────────────────────────────────
export const STATUS_OPTIONS = ['Scheduled', 'In Progress', 'Completed', 'Cancelled']
export const EXPENSE_CATEGORIES = ['Labor', 'Supplies', 'Transportation', 'Equipment', 'Other']
export const CONTRACTOR_TYPES = ['Organizer', 'Installer', 'Other']

export const STATUS_STYLE = {
  'Scheduled':  { bg: '#EEF2FF', text: '#4338CA', dot: '#818CF8' },
  'In Progress':{ bg: '#FFF7ED', text: '#C2410C', dot: '#FB923C' },
  'Completed':  { bg: '#F0FDF4', text: '#15803D', dot: '#4ADE80' },
  'Cancelled':  { bg: '#FEF2F2', text: '#B91C1C', dot: '#F87171' },
}

// ── Formatters ─────────────────────────────────────────
export const fmt$ = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

export const fmtDate = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

// ── StatusBadge ────────────────────────────────────────
export function StatusBadge({ status, size = 'sm' }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE['Scheduled']
  return (
    <span style={{
      background: s.bg, color: s.text,
      borderRadius: 20, padding: size === 'sm' ? '2px 9px' : '4px 12px',
      fontSize: size === 'sm' ? 11 : 13,
      fontWeight: 700, letterSpacing: '0.03em',
      display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap'
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}

// ── Modal ──────────────────────────────────────────────
export function Modal({ title, onClose, onSave, saveLabel = 'Save', saving = false, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(44,40,37,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 200, padding: '0',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--paper)', borderRadius: '20px 20px 0 0',
        padding: '24px 20px calc(24px + var(--safe-bot))',
        width: '100%', maxWidth: 540, maxHeight: '90dvh',
        overflowY: 'auto', boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20 }}>{title}</h2>
          <button onClick={onClose} style={{ color: 'var(--ink3)', fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        {children}
        {onSave && (
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button onClick={onSave} disabled={saving} style={{
              flex: 1, background: 'var(--ink)', color: 'var(--paper)',
              borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 600,
              opacity: saving ? 0.6 : 1
            }}>{saving ? 'Saving…' : saveLabel}</button>
            <button onClick={onClose} style={{
              flex: 1, background: 'var(--paper2)', color: 'var(--ink2)',
              borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 500
            }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Field ──────────────────────────────────────────────
export function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}{required && <span style={{ color: 'var(--rose)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// ── Input styles ───────────────────────────────────────
export const inputSx = {
  width: '100%', padding: '11px 13px',
  border: '1.5px solid var(--border)', borderRadius: 10,
  fontSize: 16, background: '#fff', color: 'var(--ink)', outline: 'none',
  WebkitAppearance: 'none', appearance: 'none'
}

export const selectSx = { ...inputSx, cursor: 'pointer' }

// ── Spinner ────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2.5px solid var(--paper3)',
        borderTopColor: 'var(--gold)',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────
export function Toast({ msg, type = 'success', onDone }) {
  return (
    <div style={{
      position: 'fixed', bottom: 'calc(80px + var(--safe-bot))', left: '50%',
      transform: 'translateX(-50%)',
      background: type === 'error' ? 'var(--rose)' : 'var(--ink)',
      color: '#fff', borderRadius: 20, padding: '10px 20px',
      fontSize: 14, fontWeight: 500, zIndex: 300,
      boxShadow: 'var(--shadow-lg)', whiteSpace: 'nowrap',
      animation: 'fadeup 0.2s ease'
    }}>
      {msg}
      <style>{`@keyframes fadeup { from { opacity:0; transform:translateX(-50%) translateY(8px); } }`}</style>
    </div>
  )
}

// ── useToast ───────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState(null)
  const show = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }
  return [toast, show]
}

// ── ConfirmDialog ──────────────────────────────────────
export function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(44,40,37,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 300, padding: 20
    }}>
      <div style={{ background: 'var(--paper)', borderRadius: 16, padding: 28, maxWidth: 320, width: '100%', boxShadow: 'var(--shadow-lg)' }}>
        <p style={{ fontSize: 15, color: 'var(--ink)', marginBottom: 24, lineHeight: 1.5 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onConfirm} style={{ flex: 1, background: 'var(--rose)', color: '#fff', borderRadius: 10, padding: 11, fontWeight: 600, fontSize: 14 }}>Delete</button>
          <button onClick={onCancel} style={{ flex: 1, background: 'var(--paper2)', color: 'var(--ink2)', borderRadius: 10, padding: 11, fontWeight: 500, fontSize: 14 }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── StarRating ─────────────────────────────────────────
export function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)} style={{
          fontSize: 26, color: n <= value ? '#C8A96E' : 'var(--paper3)',
          padding: '2px', lineHeight: 1
        }}>★</button>
      ))}
    </div>
  )
}
