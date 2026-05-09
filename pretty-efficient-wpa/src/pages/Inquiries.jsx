import { useState, useEffect } from 'react'
import { fmtDate, Spinner, useToast, Toast } from '../components/ui.jsx'
import { getInquiries, updateInquiry } from '../lib/supabase.js'

const STATUS_COLORS = {
  'New':      { bg: '#EEF2FF', text: '#4338CA' },
  'Reviewed': { bg: '#FFF7ED', text: '#C2410C' },
  'Converted':{ bg: '#F0FDF4', text: '#15803D' },
  'Closed':   { bg: '#F4F4F5', text: '#52525B' },
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, showToast] = useToast()

  const load = async () => {
    setLoading(true)
    const { data } = await getInquiries()
    setInquiries(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const setStatus = async (id, status) => {
    await updateInquiry(id, { status })
    showToast('Status updated')
    load()
  }

  if (loading) return <div style={{ padding: 24 }}><Spinner /></div>

  return (
    <div style={{ padding: '24px 16px 100px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Inquiries</h1>
      <p style={{ color: 'var(--ink3)', fontSize: 14, marginBottom: 24 }}>Leads from your website contact form</p>

      {inquiries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink3)', background: '#fff', borderRadius: 14, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📬</div>
          <p style={{ fontSize: 14 }}>No inquiries yet. They'll appear here when someone fills out your website contact form.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {inquiries.map(inq => {
            const sc = STATUS_COLORS[inq.status] || STATUS_COLORS['New']
            return (
              <div key={inq.id} style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{inq.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{fmtDate(inq.created_at?.slice(0,10))}</div>
                  </div>
                  <span style={{ background: sc.bg, color: sc.text, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{inq.status}</span>
                </div>
                {inq.message && <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.5, marginBottom: 12, fontStyle: 'italic' }}>"{inq.message}"</p>}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  {inq.phone && <a href={`tel:${inq.phone}`} style={{ fontSize: 13, color: 'var(--ink2)' }}>📞 {inq.phone}</a>}
                  {inq.email && <a href={`mailto:${inq.email}`} style={{ fontSize: 13, color: 'var(--ink2)' }}>✉️ {inq.email}</a>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['New','Reviewed','Converted','Closed'].map(s => (
                    <button key={s} onClick={() => setStatus(inq.id, s)} style={{
                      padding: '5px 12px', borderRadius: 20, border: '1.5px solid',
                      borderColor: inq.status === s ? 'var(--ink)' : 'var(--border)',
                      background: inq.status === s ? 'var(--ink)' : 'transparent',
                      color: inq.status === s ? 'var(--paper)' : 'var(--ink2)',
                      fontSize: 12, fontWeight: 500
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
