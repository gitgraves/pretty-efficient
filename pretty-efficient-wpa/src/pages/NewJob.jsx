import { useState } from 'react'
import { STATUS_OPTIONS, Field, inputSx, selectSx, useToast, Toast } from '../components/ui.jsx'
import { upsertJob, upsertClient } from '../lib/supabase.js'

export default function NewJob({ clients, preselectedClientId, onSaved, onCancel }) {
  const [mode, setMode] = useState(preselectedClientId ? 'existing' : 'existing')
  const [saving, setSaving] = useState(false)
  const [toast, showToast] = useToast()

  const [form, setForm] = useState({
    client_id: preselectedClientId || '', description: '', job_date: '', status: 'Scheduled', revenue: '', notes: ''
  })
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', address: '' })

  const set = (key) => (e) => setForm(f => ({...f, [key]: e.target.value}))
  const setNC = (key) => (e) => setNewClient(f => ({...f, [key]: e.target.value}))

  const pickContact = async () => {
    try {
      const [contact] = await navigator.contacts.select(['name', 'email', 'tel', 'address'], { multiple: false })
      if (!contact) return
      const addr = contact.address?.[0]
      const addrStr = addr
        ? [addr.addressLine?.join(' '), addr.city, addr.region, addr.postalCode].filter(Boolean).join(', ')
        : ''
      setNewClient({
        name: contact.name?.[0] ?? '',
        phone: contact.tel?.[0] ?? '',
        email: contact.email?.[0] ?? '',
        address: addrStr
      })
    } catch { /* user cancelled */ }
  }

  const handleSave = async () => {
    if (!form.description) return showToast('Description is required', 'error')
    setSaving(true)

    let clientId = form.client_id

    if (mode === 'new') {
      if (!newClient.name) { setSaving(false); return showToast('Client name is required', 'error') }
      const { data, error } = await upsertClient(newClient)
      if (error) { setSaving(false); return showToast('Failed to create client', 'error') }
      clientId = data.id
    }

    const { data, error } = await upsertJob({
      client_id: clientId || null,
      description: form.description,
      job_date: form.job_date || null,
      status: form.status,
      revenue: parseFloat(form.revenue) || 0,
      notes: form.notes || null,
      featured: false
    })

    setSaving(false)
    if (error) return showToast('Save failed', 'error')
    onSaved(data.id)
  }

  return (
    <div style={{ padding: 'calc(24px + var(--safe-top)) 16px 100px' }}>
      <button onClick={onCancel} style={{ color: 'var(--ink3)', fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Cancel
      </button>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>New Job</h1>

      <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid var(--border)', marginBottom: 16 }}>
        <h2 style={{ fontSize: 17, marginBottom: 16 }}>Client</h2>

        {!preselectedClientId && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[['existing', 'Existing client'], ['new', 'New client']].map(([v, label]) => (
              <button key={v} onClick={() => setMode(v)} style={{
                padding: '7px 16px', borderRadius: 20, border: '1.5px solid',
                borderColor: mode === v ? 'var(--ink)' : 'var(--border)',
                background: mode === v ? 'var(--ink)' : '#fff',
                color: mode === v ? 'var(--paper)' : 'var(--ink2)',
                fontSize: 13, fontWeight: 500
              }}>{label}</button>
            ))}
          </div>
        )}

        {mode === 'existing' ? (
          <Field label="Select client">
            <select value={form.client_id} onChange={set('client_id')} style={selectSx} disabled={!!preselectedClientId}>
              <option value="">Choose…</option>
              {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        ) : (
          <>
            {'contacts' in navigator && (
              <button onClick={pickContact} style={{
                width: '100%', marginBottom: 14, padding: '10px 16px',
                borderRadius: 10, border: '1.5px solid var(--border)',
                background: 'var(--paper2)', color: 'var(--ink2)',
                fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
                <span style={{ fontSize: 18 }}>👤</span> Import from Contacts
              </button>
            )}
            <Field label="Name" required><input value={newClient.name} onChange={setNC('name')} style={inputSx} placeholder="Full name" /></Field>
            <Field label="Phone"><input type="tel" value={newClient.phone} onChange={setNC('phone')} style={inputSx} placeholder="555-0000" /></Field>
            <Field label="Email"><input type="email" value={newClient.email} onChange={setNC('email')} style={inputSx} placeholder="email@example.com" /></Field>
            <Field label="Address"><input value={newClient.address} onChange={setNC('address')} style={inputSx} placeholder="Street, City, State ZIP" /></Field>
          </>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid var(--border)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, marginBottom: 16 }}>Job Details</h2>
        <Field label="Description" required>
          <input value={form.description} onChange={set('description')} style={inputSx} placeholder="e.g. Kitchen pantry overhaul" />
        </Field>
        <Field label="Date">
          <input type="date" value={form.job_date} onChange={set('job_date')} style={inputSx} />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={set('status')} style={selectSx}>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Revenue ($)">
          <input type="number" value={form.revenue} onChange={set('revenue')} style={inputSx} step="0.01" min="0" placeholder="0.00" />
        </Field>
        <Field label="Notes">
          <textarea value={form.notes} onChange={set('notes')} style={{...inputSx, minHeight: 70, resize: 'vertical'}} placeholder="Optional notes…" />
        </Field>
      </div>

      <button onClick={handleSave} disabled={saving} style={{
        width: '100%', background: 'var(--ink)', color: 'var(--paper)',
        borderRadius: 12, padding: 15, fontSize: 16, fontWeight: 600,
        opacity: saving ? 0.7 : 1
      }}>{saving ? 'Saving…' : 'Create Job'}</button>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
