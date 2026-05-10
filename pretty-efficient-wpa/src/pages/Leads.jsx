import { useState, useEffect } from 'react'
import { fmt$, fmtDate, Spinner, Modal, Field, inputSx, selectSx, useToast, Toast, ConfirmDialog } from '../components/ui.jsx'
import { getLeads, upsertLead, updateLead, convertLeadToClient, getReferralPartners, upsertConsultation, deleteConsultation } from '../lib/supabase.js'

const STATUS_OPTIONS = ['New', 'Contacted', 'Quoted', 'Booked', 'Lost']
const SOURCE_OPTIONS = ['website_form', 'referral', 'manual', 'social_media']
const SOURCE_LABELS = { website_form: 'Website', referral: 'Referral', manual: 'Manual', social_media: 'Instagram' }
const CONSULT_STATUSES = ['Scheduled', 'Completed', 'No-Show', 'Declined', 'Converted']

const STATUS_COLORS = {
  'New':       { bg: '#EEF2FF', text: '#4338CA' },
  'Contacted': { bg: '#FFF7ED', text: '#C2410C' },
  'Quoted':    { bg: '#FEFCE8', text: '#A16207' },
  'Booked':    { bg: '#F0FDF4', text: '#15803D' },
  'Lost':      { bg: '#F4F4F5', text: '#52525B' },
}

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

export default function Leads({ clients, onRefresh, onSelectClient }) {
  const [leads, setLeads] = useState([])
  const [referralPartners, setReferralPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, showToast] = useToast()
  const [leadModal, setLeadModal] = useState(null)
  const [convertModal, setConvertModal] = useState(null)
  const [consultModal, setConsultModal] = useState(null)
  const [consultConfirm, setConsultConfirm] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [{ data: leadData }, { data: partnerData }] = await Promise.all([
      getLeads(),
      getReferralPartners()
    ])
    setLeads(leadData || [])
    setReferralPartners(partnerData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveLead = async () => {
    if (!leadModal.name?.trim()) return showToast('Name is required', 'error')
    setSaving(true)
    const payload = { ...leadModal, source: leadModal.source || 'manual' }
    if (payload.source !== 'referral') payload.referral_partner_id = null
    const { error } = await upsertLead(payload)
    setSaving(false)
    if (error) return showToast('Save failed', 'error')
    showToast('Lead saved')
    setLeadModal(null)
    load()
  }

  const setStatus = async (id, status) => {
    await updateLead(id, { status })
    load()
  }

  const handleConvert = async () => {
    if (!convertModal.name?.trim()) return showToast('Name is required', 'error')
    setSaving(true)
    const { data: client, error } = await convertLeadToClient(convertModal.lead, {
      name: convertModal.name,
      phone: convertModal.phone,
      email: convertModal.email,
      address: convertModal.address || '',
    })
    setSaving(false)
    if (error) return showToast('Conversion failed', 'error')
    showToast('Lead converted to client!')
    setConvertModal(null)
    load()
    onRefresh()
    onSelectClient(client.id)
  }

  const saveConsult = async () => {
    setSaving(true)
    const payload = {
      ...consultModal,
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

  if (loading) return <div style={{ padding: 24 }}><Spinner /></div>

  return (
    <div style={{ padding: '24px 16px 100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h1 style={{ fontSize: 28 }}>Leads</h1>
        <button onClick={() => setLeadModal({ name: '', phone: '', email: '', message: '', source: 'manual', notes: '', status: 'New', referral_partner_id: null })}
          style={{ background: 'var(--ink)', color: 'var(--paper)', borderRadius: 20, padding: '8px 18px', fontSize: 13, fontWeight: 600 }}>
          + Add Lead
        </button>
      </div>
      <p style={{ color: 'var(--ink3)', fontSize: 14, marginBottom: 24 }}>Prospects from your website and referrals</p>

      {leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink3)', background: '#fff', borderRadius: 14, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📬</div>
          <p style={{ fontSize: 14 }}>No leads yet. They'll appear here when someone fills out your website contact form, or tap + to add one manually.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leads.map(lead => {
            const sc = STATUS_COLORS[lead.status] || STATUS_COLORS['New']
            const isConverted = !!lead.converted_client_id
            const consults = (lead.consultations || []).slice().sort((a, b) => (a.consult_date || '').localeCompare(b.consult_date || ''))
            return (
              <div key={lead.id} style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid var(--border)', boxShadow: 'var(--shadow)', opacity: lead.status === 'Lost' ? 0.7 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{lead.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>
                      {SOURCE_LABELS[lead.source] || lead.source}
                      {lead.referral_partner && (
                        <span style={{ color: 'var(--gold)', fontWeight: 600 }}> via {lead.referral_partner.name}{lead.referral_partner.organization ? ` (${lead.referral_partner.organization})` : ''}</span>
                      )}
                      {' '}· {fmtDate(lead.created_at?.slice(0, 10))}
                    </div>
                  </div>
                  <span style={{ background: sc.bg, color: sc.text, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{lead.status}</span>
                </div>

                {lead.message && <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' }}>"{lead.message}"</p>}

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                  {lead.phone && <a href={`tel:${lead.phone}`} style={{ fontSize: 13, color: 'var(--ink2)' }}>📞 {lead.phone}</a>}
                  {lead.email && <a href={`mailto:${lead.email}`} style={{ fontSize: 13, color: 'var(--ink2)' }}>✉️ {lead.email}</a>}
                </div>

                {lead.notes && (
                  <div style={{ fontSize: 13, color: 'var(--ink2)', background: 'var(--paper2)', borderRadius: 8, padding: '8px 10px', marginBottom: 10, borderLeft: '3px solid var(--gold)' }}>
                    {lead.notes}
                  </div>
                )}

                {/* Consultations */}
                {consults.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    {consults.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: 13 }}>🗓</span>
                          <span style={{ fontSize: 13, color: 'var(--ink2)' }}>
                            {fmtDate(c.consult_date)}{c.consult_time ? ` · ${c.consult_time}` : ''}
                          </span>
                          <ConsultBadge status={c.status} />
                          {c.fee > 0 && <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>{fmt$(c.fee)}{c.fee_collected ? ' ✓' : ''}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => setConsultModal({ ...c, fee: c.fee?.toString() || '0' })} style={{ fontSize: 12, color: 'var(--ink3)', padding: '2px 6px' }}>Edit</button>
                          <button onClick={() => setConsultConfirm(c)} style={{ fontSize: 12, color: 'var(--rose)', padding: '2px 6px' }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {STATUS_OPTIONS.filter(s => s !== 'Booked').map(s => (
                      <button key={s} onClick={() => setStatus(lead.id, s)} style={{
                        padding: '5px 12px', borderRadius: 20, border: '1.5px solid',
                        borderColor: lead.status === s ? 'var(--ink)' : 'var(--border)',
                        background: lead.status === s ? 'var(--ink)' : 'transparent',
                        color: lead.status === s ? 'var(--paper)' : 'var(--ink2)',
                        fontSize: 12, fontWeight: 500
                      }}>{s}</button>
                    ))}
                    <button onClick={() => setLeadModal({ ...lead, referral_partner_id: lead.referral_partner_id || null })} style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid var(--border)', fontSize: 12, color: 'var(--ink2)', fontWeight: 500 }}>Edit</button>
                    <button onClick={() => setConsultModal({ lead_id: lead.id, consult_date: '', consult_time: '', fee: '0', fee_collected: false, status: 'Scheduled', notes: '' })}
                      style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid var(--gold)', fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
                      + Consult
                    </button>
                  </div>

                  {isConverted ? (
                    <button onClick={() => onSelectClient(lead.converted_client_id)}
                      style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 600 }}>
                      View Client →
                    </button>
                  ) : lead.status !== 'Lost' && (
                    <button onClick={() => setConvertModal({ lead, name: lead.name, phone: lead.phone || '', email: lead.email || '', address: '' })}
                      style={{ background: 'var(--gold)', color: 'var(--ink)', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
                      Convert to Client
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add / Edit Lead Modal ── */}
      {leadModal && (
        <Modal title={leadModal.id ? 'Edit Lead' : 'Add Lead'} onClose={() => setLeadModal(null)} onSave={saveLead} saving={saving}>
          <Field label="Name" required>
            <input value={leadModal.name || ''} onChange={e => setLeadModal(f => ({...f, name: e.target.value}))} style={inputSx} placeholder="Full name" />
          </Field>
          <Field label="Phone">
            <input type="tel" value={leadModal.phone || ''} onChange={e => setLeadModal(f => ({...f, phone: e.target.value}))} style={inputSx} placeholder="555-0000" />
          </Field>
          <Field label="Email">
            <input type="email" value={leadModal.email || ''} onChange={e => setLeadModal(f => ({...f, email: e.target.value}))} style={inputSx} placeholder="email@example.com" />
          </Field>
          <Field label="Source">
            <select value={leadModal.source || 'manual'} onChange={e => setLeadModal(f => ({...f, source: e.target.value, referral_partner_id: e.target.value !== 'referral' ? null : f.referral_partner_id}))} style={selectSx}>
              {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
            </select>
          </Field>
          {leadModal.source === 'referral' && (
            <Field label="Referral Partner">
              <select value={leadModal.referral_partner_id || ''} onChange={e => setLeadModal(f => ({...f, referral_partner_id: e.target.value || null}))} style={selectSx}>
                <option value="">Select partner…</option>
                {referralPartners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.organization ? ` — ${p.organization}` : ''}
                  </option>
                ))}
              </select>
              {referralPartners.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 6 }}>No referral partners yet — add them in the Team tab first.</p>
              )}
            </Field>
          )}
          <Field label="Message / Notes">
            <textarea value={leadModal.notes || ''} onChange={e => setLeadModal(f => ({...f, notes: e.target.value}))} style={{...inputSx, minHeight: 80, resize: 'vertical'}} placeholder="What are they looking for?" />
          </Field>
        </Modal>
      )}

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
          {consultModal.id && (
            <>
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
            </>
          )}
          <Field label="Notes">
            <textarea value={consultModal.notes || ''} onChange={e => setConsultModal(f => ({...f, notes: e.target.value}))} style={{...inputSx, minHeight: 70, resize: 'vertical'}} placeholder="Any notes about this consultation…" />
          </Field>
        </Modal>
      )}

      {/* ── Convert to Client Modal ── */}
      {convertModal && (
        <Modal title="Convert to Client" onClose={() => setConvertModal(null)} onSave={handleConvert} saving={saving} saveLabel="Convert">
          <p style={{ fontSize: 14, color: 'var(--ink2)', marginBottom: 16, lineHeight: 1.5 }}>
            Confirm the client details. This will create a new client record and mark this lead as Booked.
          </p>
          <Field label="Name" required>
            <input value={convertModal.name || ''} onChange={e => setConvertModal(f => ({...f, name: e.target.value}))} style={inputSx} />
          </Field>
          <Field label="Phone">
            <input type="tel" value={convertModal.phone || ''} onChange={e => setConvertModal(f => ({...f, phone: e.target.value}))} style={inputSx} />
          </Field>
          <Field label="Email">
            <input type="email" value={convertModal.email || ''} onChange={e => setConvertModal(f => ({...f, email: e.target.value}))} style={inputSx} />
          </Field>
          <Field label="Address">
            <input value={convertModal.address || ''} onChange={e => setConvertModal(f => ({...f, address: e.target.value}))} style={inputSx} placeholder="Street, City, TX" />
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
