import { useState, useEffect } from 'react'
import { CONTRACTOR_TYPES, Modal, Field, inputSx, selectSx, Spinner, ConfirmDialog, useToast, Toast, fmt$ } from '../components/ui.jsx'
import { getSubcontractors, upsertSubcontractor, deleteSubcontractor, getReferralPartners, upsertReferralPartner, deleteReferralPartner } from '../lib/supabase.js'

const CURRENT_YEAR = new Date().getFullYear()

function ytd(sub) {
  return (sub.job_subcontractors || [])
    .filter(js => new Date(js.created_at).getFullYear() === CURRENT_YEAR)
    .reduce((s, js) => s + (js.amount || 0), 0)
}

function partnerStats(partner) {
  const leads = partner.leads || []
  const jobs = partner.referred_jobs || []
  const converted = leads.filter(l => l.converted_client_id).length
  const totalEarned = jobs.reduce((s, j) => s + (j.referral_reward_amount || 0), 0)
  const totalPaid = jobs.filter(j => j.referral_reward_paid).reduce((s, j) => s + (j.referral_reward_amount || 0), 0)
  return { leadsCount: leads.length, converted, totalEarned, totalPaid }
}

const blankSub = { name: '', phone: '', email: '', address: '', contractor_type: 'Organizer', notes: '' }
const blankPartner = { name: '', organization: '', phone: '', email: '', notes: '' }

export default function Team({ onRefresh }) {
  const [subs, setSubs] = useState([])
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [subModal, setSubModal] = useState(null)
  const [partnerModal, setPartnerModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeletePartner, setConfirmDeletePartner] = useState(null)
  const [toast, showToast] = useToast()

  const load = async () => {
    const [{ data: subData }, { data: partnerData }] = await Promise.all([
      getSubcontractors(),
      getReferralPartners()
    ])
    setSubs(subData || [])
    setPartners(partnerData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Subcontractors ──
  const handleSaveSub = async () => {
    if (!subModal.name) return showToast('Name is required', 'error')
    setSaving(true)
    const { error } = await upsertSubcontractor(subModal)
    setSaving(false)
    if (error) return showToast('Save failed', 'error')
    showToast('Saved')
    setSubModal(null)
    load()
    onRefresh()
  }

  const handleDeleteSub = async () => {
    const { error } = await deleteSubcontractor(confirmDelete.id)
    if (error) return showToast('Delete failed', 'error')
    setConfirmDelete(null)
    load()
    onRefresh()
  }

  // ── Referral Partners ──
  const handleSavePartner = async () => {
    if (!partnerModal.name) return showToast('Name is required', 'error')
    setSaving(true)
    const { error } = await upsertReferralPartner(partnerModal)
    setSaving(false)
    if (error) return showToast('Save failed', 'error')
    showToast('Saved')
    setPartnerModal(null)
    load()
  }

  const handleDeletePartner = async () => {
    const { error } = await deleteReferralPartner(confirmDeletePartner.id)
    if (error) return showToast('Delete failed', 'error')
    setConfirmDeletePartner(null)
    load()
  }

  if (loading) return <div style={{ padding: 24 }}><Spinner /></div>

  return (
    <div style={{ padding: 'calc(20px + var(--safe-top)) 16px 100px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Team</h1>

      {/* ── Subcontractors ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>Subcontractors</h2>
        <button onClick={() => setSubModal({ ...blankSub })} style={{ background: 'var(--ink)', color: 'var(--paper)', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 600 }}>+ Add</button>
      </div>

      {subs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 20px', color: 'var(--ink3)', background: '#fff', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 28 }}>
          <p style={{ fontSize: 14 }}>No subcontractors yet. Add people who work your jobs.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {subs.map(sub => {
            const paid = ytd(sub)
            const warn = paid >= 600
            return (
              <div key={sub.id} style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{sub.name}</span>
                      <span style={{ background: 'var(--paper2)', color: 'var(--ink2)', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>{sub.contractor_type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {sub.phone && <a href={`tel:${sub.phone}`} style={{ fontSize: 13, color: 'var(--ink2)' }}>📞 {sub.phone}</a>}
                      {sub.email && <a href={`mailto:${sub.email}`} style={{ fontSize: 13, color: 'var(--ink2)' }}>✉️ {sub.email}</a>}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{CURRENT_YEAR} paid:</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: warn ? 'var(--rose)' : 'var(--ink)' }}>{fmt$(paid)}</span>
                      {warn && <span style={{ background: 'var(--rose-lt)', color: 'var(--rose)', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>1099 required</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0, marginLeft: 10 }}>
                    <button onClick={() => setSubModal({ ...sub })} style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14 }}>Edit</button>
                    <button onClick={() => setConfirmDelete(sub)} style={{ color: 'var(--rose)', fontSize: 18, lineHeight: 1 }}>×</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Referral Partners ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>Referral Partners</h2>
        <button onClick={() => setPartnerModal({ ...blankPartner })} style={{ background: 'var(--ink)', color: 'var(--paper)', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 600 }}>+ Add</button>
      </div>

      {partners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 20px', color: 'var(--ink3)', background: '#fff', borderRadius: 14, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 14 }}>No referral partners yet.</p>
          <p style={{ fontSize: 13, marginTop: 4, color: 'var(--ink3)' }}>Add anyone who sends you business — Container Store staff, neighbors, past clients, etc.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {partners.map(partner => {
            const { leadsCount, converted, totalEarned, totalPaid } = partnerStats(partner)
            const unpaid = totalEarned - totalPaid
            return (
              <div key={partner.id} style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{partner.name}</span>
                      {partner.organization && (
                        <span style={{ background: 'var(--gold-lt)', color: '#8a6a2a', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>{partner.organization}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
                      {partner.phone && <a href={`tel:${partner.phone}`} style={{ fontSize: 13, color: 'var(--ink2)' }}>📞 {partner.phone}</a>}
                      {partner.email && <a href={`mailto:${partner.email}`} style={{ fontSize: 13, color: 'var(--ink2)' }}>✉️ {partner.email}</a>}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink3)' }}><strong style={{ color: 'var(--ink)' }}>{leadsCount}</strong> lead{leadsCount !== 1 ? 's' : ''}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink3)' }}><strong style={{ color: 'var(--ink)' }}>{converted}</strong> converted</span>
                      {totalEarned > 0 && <span style={{ fontSize: 12, color: 'var(--ink3)' }}>Earned <strong style={{ color: 'var(--sage)' }}>{fmt$(totalEarned)}</strong></span>}
                      {unpaid > 0 && <span style={{ fontSize: 12, background: 'var(--rose-lt)', color: 'var(--rose)', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>{fmt$(unpaid)} owed</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0, marginLeft: 10 }}>
                    <button onClick={() => setPartnerModal({ ...partner })} style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14 }}>Edit</button>
                    <button onClick={() => setConfirmDeletePartner(partner)} style={{ color: 'var(--rose)', fontSize: 18, lineHeight: 1 }}>×</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Subcontractor Modal ── */}
      {subModal && (
        <Modal title={subModal.id ? 'Edit Subcontractor' : 'Add Subcontractor'} onClose={() => setSubModal(null)} onSave={handleSaveSub} saving={saving}>
          <Field label="Name" required>
            <input value={subModal.name} onChange={e => setSubModal(m => ({...m, name: e.target.value}))} style={inputSx} placeholder="Full name" />
          </Field>
          <Field label="Type">
            <select value={subModal.contractor_type} onChange={e => setSubModal(m => ({...m, contractor_type: e.target.value}))} style={selectSx}>
              {CONTRACTOR_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Phone">
            <input type="tel" value={subModal.phone || ''} onChange={e => setSubModal(m => ({...m, phone: e.target.value}))} style={inputSx} placeholder="555-0000" />
          </Field>
          <Field label="Email">
            <input type="email" value={subModal.email || ''} onChange={e => setSubModal(m => ({...m, email: e.target.value}))} style={inputSx} placeholder="email@example.com" />
          </Field>
          <Field label="Address">
            <input value={subModal.address || ''} onChange={e => setSubModal(m => ({...m, address: e.target.value}))} style={inputSx} placeholder="Street, City, State ZIP" />
          </Field>
          <Field label="Notes">
            <textarea value={subModal.notes || ''} onChange={e => setSubModal(m => ({...m, notes: e.target.value}))} style={{...inputSx, minHeight: 60, resize: 'vertical'}} placeholder="Optional notes…" />
          </Field>
        </Modal>
      )}

      {/* ── Referral Partner Modal ── */}
      {partnerModal && (
        <Modal title={partnerModal.id ? 'Edit Referral Partner' : 'Add Referral Partner'} onClose={() => setPartnerModal(null)} onSave={handleSavePartner} saving={saving}>
          <Field label="Name" required>
            <input value={partnerModal.name} onChange={e => setPartnerModal(m => ({...m, name: e.target.value}))} style={inputSx} placeholder="Full name" />
          </Field>
          <Field label="Organization">
            <input value={partnerModal.organization || ''} onChange={e => setPartnerModal(m => ({...m, organization: e.target.value}))} style={inputSx} placeholder="e.g. The Container Store" />
          </Field>
          <Field label="Phone">
            <input type="tel" value={partnerModal.phone || ''} onChange={e => setPartnerModal(m => ({...m, phone: e.target.value}))} style={inputSx} placeholder="555-0000" />
          </Field>
          <Field label="Email">
            <input type="email" value={partnerModal.email || ''} onChange={e => setPartnerModal(m => ({...m, email: e.target.value}))} style={inputSx} placeholder="email@example.com" />
          </Field>
          <Field label="Notes">
            <textarea value={partnerModal.notes || ''} onChange={e => setPartnerModal(m => ({...m, notes: e.target.value}))} style={{...inputSx, minHeight: 60, resize: 'vertical'}} placeholder="Optional notes…" />
          </Field>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          msg={`Remove ${confirmDelete.name}? This will also remove them from any jobs they are on.`}
          onConfirm={handleDeleteSub}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmDeletePartner && (
        <ConfirmDialog
          msg={`Remove ${confirmDeletePartner.name} as a referral partner? Their leads and job records won't be deleted.`}
          onConfirm={handleDeletePartner}
          onCancel={() => setConfirmDeletePartner(null)}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}