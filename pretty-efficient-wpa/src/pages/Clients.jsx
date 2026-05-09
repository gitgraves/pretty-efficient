import { useState } from 'react'
import { fmt$ } from '../components/ui.jsx'

export default function Clients({ clients, jobs, onSelectClient }) {
  const [search, setSearch] = useState('')

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '24px 16px 100px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Clients</h1>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search clients…"
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 10,
          border: '1.5px solid var(--border)', fontSize: 15,
          background: '#fff', marginBottom: 20, boxSizing: 'border-box'
        }}
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink3)', background: '#fff', borderRadius: 14, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
          <p style={{ fontSize: 14 }}>{search ? 'No clients match your search.' : 'No clients yet. Create a job to add your first client.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(client => {
            const clientJobs = jobs.filter(j => j.client_id === client.id)
            const totalRevenue = clientJobs.reduce((s, j) => s + (j.revenue || 0), 0)
            const lastJob = clientJobs[0]
            return (
              <div key={client.id} onClick={() => onSelectClient(client.id)} style={{
                background: '#fff', borderRadius: 14, padding: '16px 18px',
                border: '1px solid var(--border)', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                boxShadow: 'var(--shadow)'
              }}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)', marginBottom: 3 }}>{client.name}</div>
                  {client.phone && <div style={{ fontSize: 13, color: 'var(--ink3)' }}>📞 {client.phone}</div>}
                  <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 3 }}>
                    {clientJobs.length} job{clientJobs.length !== 1 ? 's' : ''}
                    {lastJob ? ` · Last: ${new Date(lastJob.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {totalRevenue > 0 && (
                    <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>{fmt$(totalRevenue)}</div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>›</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
