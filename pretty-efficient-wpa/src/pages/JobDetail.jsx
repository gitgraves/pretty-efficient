import { useState, useRef } from 'react'
import {
  fmt$, fmtDate, StatusBadge, STATUS_OPTIONS, EXPENSE_CATEGORIES,
  Modal, Field, inputSx, selectSx, Spinner, ConfirmDialog, StarRating, useToast, Toast
} from '../components/ui.jsx'
import {
  getJob, upsertJob, deleteJob,
  upsertExpense, deleteExpense,
  uploadMedia, getMediaUrl, updateMedia, deleteMedia,
  upsertTestimonial, deleteTestimonial,
  upsertJobSubcontractor, deleteJobSubcontractor
} from '../lib/supabase.js'

export default function JobDetail({ jobId, clients, subcontractors, referralPartners, onBack, onDeleted, onRefresh, onSelectClient }) {
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, showToast] = useToast()

  const [expenseModal, setExpenseModal] = useState(null)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [testimonialModal, setTestimonialModal] = useState(null)
  const [jobSubModal, setJobSubModal] = useState(null)
  const [referralModal, setReferralModal] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  useState(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const { data, error } = await getJob(jobId)
      if (!cancelled) {
        if (error) showToast('Failed to load job', 'error')
        else setJob(data)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [jobId])

  const reload = async () => {
    const { data } = await getJob(jobId)
    if (data) setJob(data)
  }

  // ── Job edit ──
  const [jobForm, setJobForm] = useState(null)
  const openEditJob = () => setJobForm({
    id: job.id, client_id: job.client_id, description: job.description,
    status: job.status, job_date: job.job_date || '', revenue: String(job.revenue || ''),
    notes: job.notes || '', featured: job.featured || false
  })
  const saveJob = async () => {
    setSaving(true)
    const { error } = await upsertJob({ ...jobForm, revenue: parseFloat(jobForm.revenue) || 0 })
    setSaving(false)
    if (error) return showToast('Save failed', 'error')
    showToast('Saved')
    setJobForm(null)
    reload()
    onRefresh()
  }

  const handleDeleteJob = async () => {
    const { error } = await deleteJob(job.id)
    if (error) return showToast('Delete failed', 'error')
    onDeleted()
  }

  // ── Expenses ──
  const saveExpense = async () => {
    setSaving(true)
    const { error } = await upsertExpense({
      ...expenseModal,
      job_id: jobId,
      amount: parseFloat(expenseModal.amount) || 0,
      reimbursed_amount: expenseModal.reimbursable ? (parseFloat(expenseModal.reimbursed_amount) || 0) : null
    })
    setSaving(false)
    if (error) return showToast('Save failed', 'error')
    showToast('Expense saved')
    setExpenseModal(null)
    reload()
    onRefresh()
  }

  const handleDeleteExpense = async (id) => {
    const { error } = await deleteExpense(id)
    if (error) return showToast('Delete failed', 'error')
    reload()
    onRefresh()
  }

  // ── Media ──
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setMediaUploading(true)
    try {
      for (const file of files) {
        const { error } = await uploadMedia(jobId, file)
        if (error) { showToast(`Upload failed: ${error.message}`, 'error'); break }
      }
    } finally {
      setMediaUploading(false)
      reload()
    }
  }

  const toggleShowOnWebsite = async (media) => {
    await updateMedia(media.id, { show_on_website: !media.show_on_website })
    reload()
  }

  const handleDeleteMedia = async (id, path) => {
    await deleteMedia(id, path)
    reload()
  }

  // ── Subcontractors ──
  const saveJobSub = async () => {
    if (!jobSubModal.subcontractor_id) return showToast('Select a subcontractor', 'error')
    setSaving(true)
    const { subcontractors: _nested, ...subFields } = jobSubModal
    const { error } = await upsertJobSubcontractor({
      ...subFields,
      job_id: jobId,
      amount: parseFloat(jobSubModal.amount) || 0
    })
    setSaving(false)
    if (error) return showToast('Save failed', 'error')
    showToast('Saved')
    setJobSubModal(null)
    reload()
  }

  // ── Referral ──
  const openReferralModal = () => setReferralModal({
    referral_partner_id: job.referral_partner_id || '',
    referral_reward_amount: job.referral_reward_amount != null ? String(job.referral_reward_amount) : '',
    referral_reward_paid: job.referral_reward_paid || false,
    referral_reward_paid_date: job.referral_reward_paid_date || '',
  })

  const saveReferral = async () => {
    setSaving(true)
    const partnerId = referralModal.referral_partner_id || null
    const { error } = await upsertJob({
      id: job.id,
      referral_partner_id: partnerId,
      referral_reward_amount: partnerId ? (parseFloat(referralModal.referral_reward_amount) || null) : null,
      referral_reward_paid: partnerId ? referralModal.referral_reward_paid : false,
      referral_reward_paid_date: partnerId && referralModal.referral_reward_paid ? (referralModal.referral_reward_paid_date || null) : null,
    })
    setSaving(false)
    if (error) return showToast('Save failed', 'error')
    showToast('Saved')
    setReferralModal(null)
    reload()
    onRefresh()
  }

  // ── Testimonials ──
  const saveTestimonial = async () => {
    setSaving(true)
    const { error } = await upsertTestimonial({
      ...testimonialModal,
      job_id: jobId,
      client_id: job.client_id
    })
    setSaving(false)
    if (error) return showToast('Save failed', 'error')
    showToast('Testimonial saved')
    setTestimonialModal(null)
    reload()
  }

  if (loading) return <div style={{ padding: 24 }}><Spinner /></div>
  if (!job) return <div style={{ padding: 24 }}>Job not found.</div>

  const client = job.clients
  const expenses = job.expenses || []
  const jobSubs = job.job_subcontractors || []
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const totalSubPay = jobSubs.reduce((s, js) => s + (js.amount || 0), 0)
  const totalCosts = totalExpenses + totalSubPay
  const reimbursableIncome = expenses.filter(e => e.reimbursable).reduce((s, e) => s + (e.reimbursed_amount || 0), 0)
  const profit = (job.revenue || 0) + reimbursableIncome - totalCosts

  return (
    <div style={{ padding: 'calc(16px + var(--safe-top)) 16px 100px' }}>
      <button onClick={onBack} style={{ color: 'var(--ink3)', fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Jobs
      </button>

      {/* Job header card */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid var(--border)', marginBottom: 16, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 20 }}>{client?.name || 'Unknown Client'}</h2>
              <StatusBadge status={job.status} size="md" />
            </div>
            <p style={{ color: 'var(--ink2)', fontSize: 14 }}>{job.description}</p>
            <p style={{ color: 'var(--ink3)', fontSize: 13, marginTop: 4 }}>{fmtDate(job.job_date)}</p>
          </div>
          <button onClick={openEditJob} style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14, padding: '6px 0 6px 10px' }}>Edit</button>
        </div>

        {/* Client contact — read-only with View Client link */}
        {(client?.phone || client?.email || client?.address) && (
          <div style={{ marginBottom: 12 }}>
            {(client?.phone || client?.email) && (
              <div style={{ display: 'flex', gap: 16, marginBottom: client?.address ? 6 : 0, flexWrap: 'wrap' }}>
                {client?.phone && <a href={`tel:${client.phone}`} style={{ fontSize: 13, color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 5 }}>📞 {client.phone}</a>}
                {client?.email && <a href={`mailto:${client.email}`} style={{ fontSize: 13, color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 5 }}>✉️ {client.email}</a>}
              </div>
            )}
            {client?.address && (
              <a href={`https://maps.apple.com/?daddr=${encodeURIComponent(client.address)}`}
                style={{ fontSize: 13, color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                📍 {client.address}
              </a>
            )}
          </div>
        )}
        {client?.id && (
          <button onClick={() => onSelectClient(client.id)} style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginBottom: 12 }}>
            View Client Profile →
          </button>
        )}

        {/* Financials */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {[
            { label: 'Revenue', value: fmt$(job.revenue), color: 'var(--gold)' },
            { label: 'Expenses', value: fmt$(totalCosts), color: 'var(--rose)' },
            { label: 'Profit', value: fmt$(profit), color: profit >= 0 ? 'var(--sage)' : 'var(--rose)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--ink3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: s.color, marginTop: 3, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {job.notes && (
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--paper2)', borderRadius: 8, fontSize: 13, color: 'var(--ink2)', borderLeft: '3px solid var(--gold)' }}>
            {job.notes}
          </div>
        )}
      </div>

      {/* ── Expenses ── */}
      <Section title="Expenses" action="+ Add" onAction={() => setExpenseModal({ category: 'Supplies', description: '', amount: '', reimbursable: false, reimbursed_amount: '' })}>
        {expenses.length === 0 ? <Empty text="No expenses yet" /> : (
          <div>
            {expenses.map(exp => (
              <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ background: 'var(--paper2)', color: 'var(--ink2)', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>{exp.category}</span>
                    {exp.reimbursable && <span style={{ background: 'var(--gold-lt)', color: '#8a6a2a', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>Reimb.</span>}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 2 }}>{exp.description}</div>
                  {exp.reimbursable && <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 3 }}>Client owes {fmt$(exp.reimbursed_amount || 0)}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>{fmt$(exp.amount)}</span>
                  <button onClick={() => setExpenseModal({...exp, amount: String(exp.amount), reimbursed_amount: exp.reimbursed_amount != null ? String(exp.reimbursed_amount) : ''})} style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>Edit</button>
                  <button onClick={() => setConfirmDelete({ type: 'expense', id: exp.id })} style={{ color: 'var(--rose)', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--ink3)', fontWeight: 500, alignSelf: 'center' }}>
                {reimbursableIncome > 0 ? `+${fmt$(reimbursableIncome)} reimbursable` : ''}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>Total: {fmt$(totalExpenses)}</span>
            </div>
          </div>
        )}
      </Section>

      {/* ── Subcontractors ── */}
      <Section title="Subcontractors" action="+ Add" onAction={() => setJobSubModal({ subcontractor_id: '', role: '', amount: '' })}>
        {jobSubs.length === 0 ? <Empty text="No subcontractors on this job" /> : (
          <div>
            {jobSubs.map(js => (
              <div key={js.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{js.subcontractors?.name}</div>
                  {js.role && <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 2 }}>{js.role}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>{fmt$(js.amount)}</span>
                  <button onClick={() => setJobSubModal({...js, amount: String(js.amount)})} style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>Edit</button>
                  <button onClick={() => setConfirmDelete({ type: 'jobsub', id: js.id })} style={{ color: 'var(--rose)', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
              <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>Total: {fmt$(totalSubPay)}</span>
            </div>
          </div>
        )}
      </Section>

      {/* ── Referral ── */}
      <Section title="Referral" action={job.referral_partner ? 'Edit' : '+ Set Partner'} onAction={openReferralModal}>
        {!job.referral_partner ? <Empty text="No referral partner on this job" /> : (
          <div style={{ padding: '10px 0' }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{job.referral_partner.name}</div>
            {job.referral_partner.organization && <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 2 }}>{job.referral_partner.organization}</div>}
            {job.referral_reward_amount > 0 && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--ink2)' }}>Reward: <strong>{fmt$(job.referral_reward_amount)}</strong></span>
                <span style={{
                  background: job.referral_reward_paid ? 'var(--sage-lt)' : 'var(--rose-lt)',
                  color: job.referral_reward_paid ? 'var(--sage)' : 'var(--rose)',
                  borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600
                }}>
                  {job.referral_reward_paid ? `Paid${job.referral_reward_paid_date ? ' ' + new Date(job.referral_reward_paid_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}` : 'Unpaid'}
                </span>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── Photos & Videos ── */}
      <Section title="Photos & Videos" action={mediaUploading ? 'Uploading…' : '+ Upload'} onAction={() => !mediaUploading && fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
        {(job.job_media || []).length === 0 && !mediaUploading ? <Empty text="No photos or videos yet" /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(job.job_media || []).map(m => (
              <div key={m.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: 'var(--paper2)' }}>
                {m.media_type === 'video'
                  ? <video src={getMediaUrl(m.storage_path)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <img src={getMediaUrl(m.storage_path)} alt={m.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                }
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 6 }}>
                  <button onClick={() => setConfirmDelete({ type: 'media', id: m.id, path: m.storage_path })} style={{ alignSelf: 'flex-end', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '50%', width: 22, height: 22, fontSize: 14, lineHeight: '22px', textAlign: 'center' }}>×</button>
                  <button onClick={() => toggleShowOnWebsite(m)} style={{ background: m.show_on_website ? 'var(--gold)' : 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 6, padding: '3px 6px', fontSize: 10, fontWeight: 600 }}>
                    {m.show_on_website ? '🌐 Website' : 'Hidden'}
                  </button>
                </div>
              </div>
            ))}
            {mediaUploading && (
              <div style={{ aspectRatio: '1', borderRadius: 10, background: 'var(--paper2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner />
              </div>
            )}
          </div>
        )}
        <p style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 8 }}>Tap "Website" on any photo/video to show it on your public site.</p>
      </Section>

      {/* ── Testimonial ── */}
      <Section title="Testimonial" action="+ Add" onAction={() => setTestimonialModal({ quote: '', rating: 5, approved: false, id: null })}>
        {(job.testimonials || []).length === 0 ? <Empty text="No testimonial yet" /> : (
          (job.testimonials || []).map(t => (
            <div key={t.id} style={{ padding: '14px 0' }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                {[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= t.rating ? 'var(--gold)' : 'var(--paper3)', fontSize: 20 }}>★</span>)}
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink2)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 10 }}>"{t.quote}"</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ background: t.approved ? 'var(--sage-lt)' : 'var(--gold-lt)', color: t.approved ? 'var(--sage)' : '#8a6a2a', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                  {t.approved ? 'Published' : 'Draft'}
                </span>
                <button onClick={() => setTestimonialModal({...t})} style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>Edit</button>
                <button onClick={() => setConfirmDelete({ type: 'testimonial', id: t.id })} style={{ color: 'var(--rose)', fontSize: 18 }}>×</button>
              </div>
            </div>
          ))
        )}
      </Section>

      <div style={{ marginTop: 8, textAlign: 'center' }}>
        <button onClick={() => setConfirmDelete({ type: 'job' })} style={{ color: 'var(--rose)', fontSize: 13, fontWeight: 500, padding: 8 }}>
          Delete this job
        </button>
      </div>

      {/* ── Edit Job Modal ── */}
      {jobForm && (
        <Modal title="Edit Job" onClose={() => setJobForm(null)} onSave={saveJob} saving={saving}>
          <Field label="Client" required>
            <select value={jobForm.client_id || ''} onChange={e => setJobForm(f => ({...f, client_id: e.target.value}))} style={selectSx}>
              <option value="">Select client…</option>
              {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Description" required>
            <input value={jobForm.description} onChange={e => setJobForm(f => ({...f, description: e.target.value}))} style={inputSx} />
          </Field>
          <Field label="Date">
            <input type="date" value={jobForm.job_date} onChange={e => setJobForm(f => ({...f, job_date: e.target.value}))} style={inputSx} />
          </Field>
          <Field label="Status">
            <select value={jobForm.status} onChange={e => setJobForm(f => ({...f, status: e.target.value}))} style={selectSx}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Revenue ($)">
            <input type="number" value={jobForm.revenue} onChange={e => setJobForm(f => ({...f, revenue: e.target.value}))} style={inputSx} step="0.01" min="0" />
          </Field>
          <Field label="Notes">
            <textarea value={jobForm.notes} onChange={e => setJobForm(f => ({...f, notes: e.target.value}))} style={{...inputSx, minHeight: 70, resize: 'vertical'}} />
          </Field>
          <Field label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={jobForm.featured} onChange={e => setJobForm(f => ({...f, featured: e.target.checked}))} style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 14, color: 'var(--ink2)' }}>Feature on website portfolio</span>
            </label>
          </Field>
        </Modal>
      )}

      {/* ── Expense Modal ── */}
      {expenseModal && (
        <Modal title={expenseModal.id ? 'Edit Expense' : 'Add Expense'} onClose={() => setExpenseModal(null)} onSave={saveExpense} saving={saving}>
          <Field label="Category">
            <select value={expenseModal.category} onChange={e => setExpenseModal(f => ({...f, category: e.target.value}))} style={selectSx}>
              {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Description" required>
            <input value={expenseModal.description} onChange={e => setExpenseModal(f => ({...f, description: e.target.value}))} style={inputSx} placeholder="What was this for?" />
          </Field>
          <Field label="Your cost ($)" required>
            <input type="number" value={expenseModal.amount} onChange={e => setExpenseModal(f => ({...f, amount: e.target.value}))} style={inputSx} step="0.01" min="0" placeholder="0.00" />
          </Field>
          <Field label="Date">
            <input type="date" value={expenseModal.expense_date || ''} onChange={e => setExpenseModal(f => ({...f, expense_date: e.target.value}))} style={inputSx} />
          </Field>
          <Field label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={expenseModal.reimbursable || false} onChange={e => setExpenseModal(f => ({...f, reimbursable: e.target.checked, reimbursed_amount: e.target.checked ? f.amount : ''}))} style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 14, color: 'var(--ink2)' }}>Client reimburses this expense</span>
            </label>
          </Field>
          {expenseModal.reimbursable && (
            <Field label="Amount billed to client ($)" required>
              <input type="number" value={expenseModal.reimbursed_amount} onChange={e => setExpenseModal(f => ({...f, reimbursed_amount: e.target.value}))} style={inputSx} step="0.01" min="0" placeholder="0.00" />
            </Field>
          )}
        </Modal>
      )}

      {/* ── Testimonial Modal ── */}
      {testimonialModal && (
        <Modal title={testimonialModal.id ? 'Edit Testimonial' : 'Add Testimonial'} onClose={() => setTestimonialModal(null)} onSave={saveTestimonial} saving={saving}>
          <Field label="Rating">
            <StarRating value={testimonialModal.rating} onChange={v => setTestimonialModal(f => ({...f, rating: v}))} />
          </Field>
          <Field label="Quote" required>
            <textarea value={testimonialModal.quote} onChange={e => setTestimonialModal(f => ({...f, quote: e.target.value}))} style={{...inputSx, minHeight: 100, resize: 'vertical'}} placeholder="What did the client say?" />
          </Field>
          <Field label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={testimonialModal.approved} onChange={e => setTestimonialModal(f => ({...f, approved: e.target.checked}))} style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 14, color: 'var(--ink2)' }}>Publish on website</span>
            </label>
          </Field>
        </Modal>
      )}

      {/* ── Job Subcontractor Modal ── */}
      {jobSubModal && (
        <Modal title={jobSubModal.id ? 'Edit Subcontractor' : 'Add Subcontractor'} onClose={() => setJobSubModal(null)} onSave={saveJobSub} saving={saving}>
          {!jobSubModal.id && (
            <Field label="Subcontractor" required>
              <select value={jobSubModal.subcontractor_id} onChange={e => setJobSubModal(m => ({...m, subcontractor_id: e.target.value}))} style={selectSx}>
                <option value="">Select…</option>
                {(subcontractors || [])
                  .filter(s => !jobSubs.some(js => js.subcontractor_id === s.id))
                  .map(s => <option key={s.id} value={s.id}>{s.name} — {s.contractor_type}</option>)}
              </select>
            </Field>
          )}
          {jobSubModal.id && (
            <Field label="Subcontractor">
              <input value={jobSubs.find(js => js.id === jobSubModal.id)?.subcontractors?.name || ''} style={{...inputSx, color: 'var(--ink3)'}} disabled />
            </Field>
          )}
          <Field label="Role">
            <input value={jobSubModal.role || ''} onChange={e => setJobSubModal(m => ({...m, role: e.target.value}))} style={inputSx} placeholder="e.g. Assembled shelving units" />
          </Field>
          <Field label="Amount paid ($)" required>
            <input type="number" value={jobSubModal.amount} onChange={e => setJobSubModal(m => ({...m, amount: e.target.value}))} style={inputSx} step="0.01" min="0" placeholder="0.00" />
          </Field>
        </Modal>
      )}

      {/* ── Referral Modal ── */}
      {referralModal && (
        <Modal title="Referral Partner" onClose={() => setReferralModal(null)} onSave={saveReferral} saving={saving}>
          <Field label="Referral Partner">
            <select value={referralModal.referral_partner_id || ''} onChange={e => setReferralModal(m => ({...m, referral_partner_id: e.target.value || ''}))} style={selectSx}>
              <option value="">None</option>
              {(referralPartners || []).map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.organization ? ` — ${p.organization}` : ''}</option>
              ))}
            </select>
          </Field>
          {referralModal.referral_partner_id && (
            <>
              <Field label="Reward Amount ($)">
                <input type="number" value={referralModal.referral_reward_amount} onChange={e => setReferralModal(m => ({...m, referral_reward_amount: e.target.value}))} style={inputSx} step="0.01" min="0" placeholder="0.00" />
              </Field>
              <Field label="">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={referralModal.referral_reward_paid || false} onChange={e => setReferralModal(m => ({...m, referral_reward_paid: e.target.checked}))} style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 14, color: 'var(--ink2)' }}>Reward paid</span>
                </label>
              </Field>
              {referralModal.referral_reward_paid && (
                <Field label="Date Paid">
                  <input type="date" value={referralModal.referral_reward_paid_date || ''} onChange={e => setReferralModal(m => ({...m, referral_reward_paid_date: e.target.value}))} style={inputSx} />
                </Field>
              )}
            </>
          )}
        </Modal>
      )}

      {/* ── Confirm Delete ── */}
      {confirmDelete && (
        <ConfirmDialog
          msg={`Delete this ${confirmDelete.type}? This cannot be undone.`}
          onConfirm={async () => {
            if (confirmDelete.type === 'expense') await handleDeleteExpense(confirmDelete.id)
            else if (confirmDelete.type === 'media') await handleDeleteMedia(confirmDelete.id, confirmDelete.path)
            else if (confirmDelete.type === 'testimonial') { await deleteTestimonial(confirmDelete.id); reload() }
            else if (confirmDelete.type === 'jobsub') { await deleteJobSubcontractor(confirmDelete.id); reload() }
            else if (confirmDelete.type === 'job') await handleDeleteJob()
            setConfirmDelete(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}

function Section({ title, action, onAction, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid var(--border)', marginBottom: 14, boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: 17, fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>{title}</h3>
        {action && <button onClick={onAction} style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14 }}>{action}</button>}
      </div>
      {children}
    </div>
  )
}

function Empty({ text }) {
  return <p style={{ color: 'var(--ink3)', fontSize: 14, textAlign: 'center', padding: '8px 0' }}>{text}</p>
}
