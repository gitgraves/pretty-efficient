import { useState, useEffect } from 'react'
import { fmt$, fmtDate, StatusBadge, Field, inputSx, selectSx, Spinner, Modal, useToast, Toast, ConfirmDialog } from '../components/ui.jsx'
import { getClient, upsertClient, deleteClient, upsertConsultation, deleteConsultation } from '../lib/supabase.js'

const CONSULT_STATUSES = ['Scheduled', 'Completed', 'No-Show', 'Declined', 'Converted']

const CSTY = {
  'Scheduled': { bg: '#EEF2FF', text: '#4338CA' },
  'Completed': { bg: '#F0FDF4', text: '#15803D' },
  'No-Show':   { bg: '#FFF7ED', text: '#C2410C' },
  'Declined':  { bg: '#F4F4F5', text: '#52525B' },
  'Converted': { bg: '#FEFCE8', text: '#A16207' },
}

function ConsultBadge({ status }) {
  const s = CSTY[status] || CSTY['Scheduled']
  return (
    <span style={{ background: s.bg, color: s.text, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
      {status}
    </span>
  )
}

export default function ClientDetail({ clientId, onBack, onSelectJob, onNewJob, onRefresh }) {
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, showToast] = useToast()
  const [consultModal, setConsultModal] = useState(null)
  const [consultConfirm, setConsultConfirm] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await getClient(clientId)
    if (error) showToast('Failed to load client', 'error')
    else { setClient(data); setForm({ name: data.name, phone: data.phone || '', email: data.email || '', address: data.address || '', notes: data.notes || '' }) }
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId])

  const saveClient = async () => {
    if (!form.name?.trim()) return showToast('Name is required', 'error')
    setSaving(true)
    const { error } = await upsertClient({ id: clientId, ...form })
    setSaving(false)
    if (error) return showToast('Save failed', 'error')
    showToast('Client saved')
    setEditing(false)
    load()
    onRefresh()
  }

  const saveConsult = async () => {
    setSaving(true)
    const payload = {
      ...consultModal,
      client_id: clientId,
      fee: parseFloat(consultModal.fee) || 0,
      consult_date: consultModal.consult_date || null,
    }
    const { error } = await upsertConsultation(payload)
    setSaving(false)
    if (error) return showToast('Save failed', 'error')
    showToast('Consultation saved')
    setConsultModal(null)
    load()
    onRefresh()
  }

  const handleDeleteConsult = async () => {
    const { error } = await deleteConsultation(consultConfirm.id)
    setConsultConfirm(null)
    if (error) return showToast('Delete failed', 'error')
    showToast('Consultation deleted')
    load()
    onRefresh()
  }

  const handleConvertConsult = async (c) => {
    setSaving(true)
    await upsertConsultation({ ...c, status: 'Converted' })
    setSaving(false)
    onNewJob(clientId)
  }

  if (loading) return <div style={{ padding: 24 }}><Spinner /></div>
  if (!client) return <div style={{ padding: 24 }}>Client not found.</div>

  const jobs = client.jobs || []
  const consults = (client.consultations || []).slice().sort((a, b) => (a.consult_date || '').localeCompare(b.consult_date || ''))
  const totalRevenue = jobs.reduce((s, j) => s + (j.revenue || 0), 0)
  const completedJobs = jobs.filter(j => j.status === 'Completed').length

  return (
    <div style={{ padding: 'calc(16px + var(--safe-top)) 16px 100px' }}>
      <button onClick={onBack} style={{ color: 'var(--ink3)', fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Clients
      </button>

      {/* Client card */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid var(--border)', marginBottom: 16, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22 }}>{client.name}</h2>
          <button onClick={() => setEditing(e => !e)} style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14 }}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div>
            <Field label="Name" required>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={inputSx} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} style={inputSx} placeholder="555-0000" />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} style={inputSx} placeholder="email@example.com" />
            </Field>
            <Field label="Address">
              <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} style={inputSx} placeholder="Street, City, TX" />
            </Field>
            <Field label="Notes">
              <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} style={{...inputSx, minHeight: 70, resize: 'vertical'}} placeholder="Internal notes about this client…" />
            </Field>
            <button onClick={saveClient} disabled={saving} style={{
              width: '100%', background: 'var(--ink)', color: 'var(--paper)',
              borderRadius: 10, padding: 12, fontSize: 15, fontWeight: 600,
              marginTop: 8, opacity: saving ? 0.7 : 1
            }}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {client.phone && <a href={`tel:${client.phone}`} style={{ fontSize: 14, color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 8 }}>📞 {client.phone}</a>}
            {client.email && <a href={`mailto:${client.email}`} style={{ fontSize: 14, color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 8 }}>✉️ {client.email}</a>}
            {client.address && (
              <a href={`https://maps.apple.com/?daddr=${encodeURIComponent(client.address)}`} style={{ fontSize: 14, color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                📍 {client.address}
              </a>
            )}
            {client.notes && (
              <div style={{ marginTop: 4, padding: '10px 12px', background: 'var(--paper2)', borderRadius: 8, fontSize: 13, color: 'var(--ink2)', borderLeft: '3px solid var(--gold)' }}>
                {client.notes}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {!editing && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            {[
              { label: 'Total Jobs', value: jobs.length },
              { label: 'Completed', value: completedJobs },
              { label: 'Revenue', value: fmt$(totalRevenue) },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--ink3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginTop: 3, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consultations */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid var(--border)', boxShadow: 'var(--shadow)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 17, fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>Consultations</h3>
          <button onClick={() => setConsultModal({ consult_date: '', consult_time: '', fee: '0', fee_collected: false, status: 'Scheduled', notes: '' })}
            style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14 }}>+ Schedule</button>
        </div>

        {consults.length === 0 ? (
          <p style={{ color: 'var(--ink3)', fontSize: 14, textAlign: 'center', padding: '8px 0' }}>No consultations yet</p>
        ) : (
          consults.map(c => (
            <div key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{fmtDate(c.consult_date)}</span>
                    {c.consult_time && <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{c.consult_time}</span>}
                    <ConsultBadge status={c.status} />
                  </div>
                  {c.fee > 0 && (
                    <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>
                      {fmt$(c.fee)}{c.fee_collected ? <span style={{ color: 'var(--sage)', fontWeight: 500, marginLeft: 4 }}>· collected</span> : <span style={{ color: 'var(--rose)', fontWeight: 500, marginLeft: 4 }}>· not yet collected</span>}
                    </div>
                  )}
                  {c.notes && <p style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 4, lineHeight: 1.4 }}>{c.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                  <button onClick={() => setConsultModal({ ...c, fee: c.fee?.toString() || '0' })} style={{ color: 'var(--ink3)', fontSize: 13 }}>Edit</button>
                  <button onClick={() => setConsultConfirm(c)} style={{ color: 'var(--rose)', fontSize: 13 }}>✕</button>
                </div>
              </div>
              {(c.status === 'Scheduled' || c.status === 'Completed') && (
                <button onClick={() => handleConvertConsult(c)}
                  style={{ background: 'var(--gold)', color: 'var(--ink)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>
                  Convert to Job
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Job history */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 17, fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>Job History</h3>
          <button onClick={() => onNewJob(clientId)} style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14 }}>+ New Job</button>
        </div>

        {jobs.length === 0 ? (
          <p style={{ color: 'var(--ink3)', fontSize: 14, textAlign: 'center', padding: '8px 0' }}>No jobs yet</p>
        ) : (
          jobs.map(job => (
            <div key={job.id} onClick={() => onSelectJob(job.id)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{job.description}</span>
                  <StatusBadge status={job.status} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{fmtDate(job.job_date)}</div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15, flexShrink: 0, marginLeft: 12 }}>
                {fmt$(job.revenue)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Consultation Modal ── */}
      {consultModal && (
        <Modal title={consultModal.id ? 'Edit Consultation' : 'Schedule Consultation'} onClose={() => setConsultModal(null)} onSave={saveConsult} saving={saving}>
          <Field label="Date">
            <input type="date" value={consultModal.consult_date || ''} onChange={e => setConsultModal(f => ({...f, consult_date: e.target.value}))} style={inputSx} />
          </Field>
          <Field label="Time">
            <input type="text" value={consultModal.consult_time || ''} onChange={e => setConsultModal(f => ({...f, consult_time: e.target.value}))} style={inputSx} placeholder="e.g. 2:00 PM" />
          </Field>
          <Field label="Consultation Fee ($)">
            <input type="number" step="0.01" min="0" value={consultModal.fee || '0'} onChange={e => setConsultModal(f => ({...f, fee: e.target.value}))} style={inputSx} />
          </Field>
          <Field label="Status">
            <select value={consultModal.status || 'Scheduled'} onChange={e => setConsultModal(f => ({...f, status: e.target.value}))} style={selectSx}>
              {CONSULT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Fee Collected">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!consultModal.fee_collected} onChange={e => setConsultModal(f => ({...f, fee_collected: e.target.checked}))} style={{ width: 18, height: 18 }} />
              Fee collected
            </label>
          </Field>
          <Field label="Notes">
            <textarea value={consultModal.notes || ''} onChange={e => setConsultModal(f => ({...f, notes: e.target.value}))} style={{...inputSx, minHeight: 70, resize: 'vertical'}} placeholder="Any notes about this consultation…" />
          </Field>
        </Modal>
      )}

      {consultConfirm && (
        <ConfirmDialog
          msg={`Delete the ${fmtDate(consultConfirm.consult_date)} consultation?`}
          onConfirm={handleDeleteConsult}
          onCancel={() => setConsultConfirm(null)}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
