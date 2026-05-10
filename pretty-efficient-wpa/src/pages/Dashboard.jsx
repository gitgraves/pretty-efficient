import { useMemo } from 'react'
import { fmt$, fmtDate, StatusBadge } from '../components/ui.jsx'

export default function Dashboard({ jobs, onSelectJob, onNewJob }) {
  const stats = useMemo(() => {
    const totalRevenue = jobs.reduce((s, j) => s + (j.revenue || 0), 0)
    const totalExpenses = jobs.reduce((s, j) => {
      const exp = (j.expenses || []).reduce((e, x) => e + (x.amount || 0), 0)
      const sub = (j.job_subcontractors || []).reduce((e, x) => e + (x.amount || 0), 0)
      return s + exp + sub
    }, 0)
    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === 'In Progress' || j.status === 'Scheduled').length,
      completedJobs: jobs.filter(j => j.status === 'Completed').length,
    }
  }, [jobs])

  const recent = [...jobs].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

  return (
    <div style={{ padding: '24px 16px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, color: 'var(--ink)', whiteSpace: 'nowrap' }}>Pretty Efficient</h1>
        <p style={{ color: 'var(--ink3)', marginTop: 6, fontSize: 14 }}>Home Organizing</p>
      </div>

      {/* Financial cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Revenue', value: fmt$(stats.totalRevenue), color: 'var(--gold)' },
          { label: 'Expenses', value: fmt$(stats.totalExpenses), color: 'var(--rose)' },
          { label: 'Profit', value: fmt$(stats.netProfit), color: stats.netProfit >= 0 ? 'var(--sage)' : 'var(--rose)' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 10, color: 'var(--ink3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.color, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Job count cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 32 }}>
        {[
          { label: 'Total', value: stats.totalJobs },
          { label: 'Active', value: stats.activeJobs },
          { label: 'Done', value: stats.completedJobs },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 12px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent jobs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 20 }}>Recent Jobs</h2>
      </div>

      {recent.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink3)', background: '#fff', borderRadius: 14, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <p style={{ fontSize: 14 }}>No jobs yet. Tap + to add your first one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recent.map(job => <JobCard key={job.id} job={job} onSelect={() => onSelectJob(job.id)} />)}
        </div>
      )}
    </div>
  )
}

function JobCard({ job, onSelect }) {
  const expenses = (job.expenses || []).reduce((s, e) => s + (e.amount || 0), 0)
  const subPay = (job.job_subcontractors || []).reduce((s, js) => s + (js.amount || 0), 0)
  const profit = (job.revenue || 0) - expenses - subPay
  return (
    <div onClick={onSelect} style={{
      background: '#fff', borderRadius: 14, padding: '16px',
      border: '1px solid var(--border)', cursor: 'pointer',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      boxShadow: 'var(--shadow)', transition: 'transform 0.1s'
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
