import { useState, useMemo } from 'react'
import { fmt$, fmtDate, StatusBadge, STATUS_OPTIONS } from '../components/ui.jsx'

export default function Jobs({ jobs, onSelectJob, onNewJob }) {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => jobs.filter(j => {
    const matchStatus = filter === 'All' || j.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (j.clients?.name || '').toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q)
    return matchStatus && matchSearch
  }), [jobs, filter, search])

  return (
    <div style={{ padding: '24px 16px 100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 28 }}>Jobs</h1>
        <button onClick={onNewJob} style={{
          background: 'var(--ink)', color: 'var(--paper)',
          borderRadius: 20, padding: '8px 18px', fontSize: 14, fontWeight: 600
        }}>+ New</button>
      </div>

      {/* Search */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search customer or job…"
        style={{
          width: '100%', padding: '11px 14px', marginBottom: 12,
          border: '1.5px solid var(--border)', borderRadius: 12,
          fontSize: 16, background: '#fff', outline: 'none'
        }}
      />

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
        {['All', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap',
            border: '1.5px solid',
            borderColor: filter === s ? 'var(--ink)' : 'var(--border)',
            background: filter === s ? 'var(--ink)' : '#fff',
            color: filter === s ? 'var(--paper)' : 'var(--ink2)',
            fontSize: 13, fontWeight: 500
          }}>{s}</button>
        ))}
      </div>

      {/* Count */}
      <p style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 14 }}>
        {filtered.length} job{filtered.length !== 1 ? 's' : ''}
      </p>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink3)' }}>No jobs found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(job => <JobRow key={job.id} job={job} onSelect={() => onSelectJob(job.id)} />)}
        </div>
      )}
    </div>
  )
}

function JobRow({ job, onSelect }) {
  const expenses = (job.expenses || []).reduce((s,e) => s + (e.amount||0), 0)
  const profit = (job.revenue||0) - expenses
  return (
    <div onClick={onSelect} style={{
      background: '#fff', borderRadius: 14, padding: '16px',
      border: '1px solid var(--border)', cursor: 'pointer',
      display: 'flex', justifyContent: 'space-between', gap: 12,
      boxShadow: 'var(--shadow)'
    }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{job.clients?.name || 'Unknown'}</span>
          <StatusBadge status={job.status} />
        </div>
        <div style={{ color: 'var(--ink2)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.description}</div>
        <div style={{ color: 'var(--ink3)', fontSize: 12, marginTop: 3 }}>{fmtDate(job.job_date)}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>{fmt$(job.revenue)}</div>
        <div style={{ fontSize: 12, color: profit >= 0 ? 'var(--sage)' : 'var(--rose)', fontWeight: 600 }}>
          {profit >= 0 ? '+' : ''}{fmt$(profit)}
        </div>
      </div>
    </div>
  )
}
