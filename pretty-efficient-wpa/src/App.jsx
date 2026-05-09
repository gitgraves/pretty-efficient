import { useState, useEffect, useCallback } from 'react'
import { getJobs, getClients, getSubcontractors, getReferralPartners } from './lib/supabase.js'
import { Spinner } from './components/ui.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Jobs from './pages/Jobs.jsx'
import JobDetail from './pages/JobDetail.jsx'
import NewJob from './pages/NewJob.jsx'
import Leads from './pages/Leads.jsx'
import Clients from './pages/Clients.jsx'
import ClientDetail from './pages/ClientDetail.jsx'
import Team from './pages/Team.jsx'

const NAV = [
  { id: 'dashboard', label: 'Home',    icon: '⌂' },
  { id: 'jobs',      label: 'Jobs',    icon: '📋' },
  { id: 'clients',   label: 'Clients', icon: '👤' },
  { id: 'leads',     label: 'Leads',   icon: '📬' },
  { id: 'team',      label: 'Team',    icon: '👥' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [jobs, setJobs] = useState([])
  const [clients, setClients] = useState([])
  const [subcontractors, setSubcontractors] = useState([])
  const [referralPartners, setReferralPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [newJobOpen, setNewJobOpen] = useState(false)
  const [newJobClientId, setNewJobClientId] = useState(null)

  const loadData = useCallback(async () => {
    const [{ data: jobData }, { data: clientData }, { data: subData }, { data: partnerData }] = await Promise.all([
      getJobs(), getClients(), getSubcontractors(), getReferralPartners()
    ])
    setJobs(jobData || [])
    setClients(clientData || [])
    setSubcontractors(subData || [])
    setReferralPartners(partnerData || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSelectJob = (id) => { setSelectedJobId(id); setNewJobOpen(false); setSelectedClientId(null) }
  const handleSelectClient = (id) => { setSelectedClientId(id); setSelectedJobId(null); setNewJobOpen(false) }
  const handleNewJob = (clientId = null) => { setNewJobOpen(true); setSelectedJobId(null); setSelectedClientId(null); setNewJobClientId(clientId) }
  const handleBack = () => { setSelectedJobId(null); setNewJobOpen(false); setSelectedClientId(null); setNewJobClientId(null) }
  const handleJobSaved = (id) => { setNewJobOpen(false); setSelectedJobId(id); setNewJobClientId(null); loadData() }
  const handleJobDeleted = () => { setSelectedJobId(null); setTab('jobs'); loadData() }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: 'var(--ink)' }}>Pretty Efficient</div>
      <Spinner />
    </div>
  )

  const showNav = !newJobOpen && !selectedJobId && !selectedClientId
  const showDetail = !!selectedJobId
  const showClientDetail = !!selectedClientId
  const showNew = newJobOpen && !selectedJobId

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', minHeight: '100dvh', position: 'relative' }}>

      {showDetail ? (
        <JobDetail
          jobId={selectedJobId}
          clients={clients}
          subcontractors={subcontractors}
          referralPartners={referralPartners}
          onBack={handleBack}
          onDeleted={handleJobDeleted}
          onRefresh={loadData}
          onSelectClient={handleSelectClient}
        />
      ) : showClientDetail ? (
        <ClientDetail
          clientId={selectedClientId}
          onBack={handleBack}
          onSelectJob={handleSelectJob}
          onNewJob={handleNewJob}
          onRefresh={loadData}
        />
      ) : showNew ? (
        <NewJob
          clients={clients}
          preselectedClientId={newJobClientId}
          onSaved={handleJobSaved}
          onCancel={handleBack}
        />
      ) : (
        <>
          {tab === 'dashboard' && <Dashboard jobs={jobs} onSelectJob={handleSelectJob} onNewJob={handleNewJob} />}
          {tab === 'jobs'      && <Jobs jobs={jobs} onSelectJob={handleSelectJob} onNewJob={handleNewJob} />}
          {tab === 'clients'   && <Clients clients={clients} jobs={jobs} onSelectClient={handleSelectClient} />}
          {tab === 'leads'     && <Leads clients={clients} onRefresh={loadData} onSelectClient={handleSelectClient} />}
          {tab === 'team'      && <Team onRefresh={loadData} />}
        </>
      )}

      {/* Floating + button */}
      {showNav && (tab === 'dashboard' || tab === 'jobs') && (
        <button onClick={() => handleNewJob()} style={{
          position: 'fixed', right: 20, bottom: 'calc(76px + var(--safe-bot))',
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--gold)', color: 'var(--ink)',
          fontSize: 26, lineHeight: 1, fontWeight: 300,
          boxShadow: '0 4px 16px rgba(200,169,110,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100
        }}>+</button>
      )}

      {/* Bottom nav */}
      {showNav && (
        <nav style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 540,
          background: 'rgba(250,248,245,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          paddingBottom: 'var(--safe-bot)',
          zIndex: 100
        }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              flex: 1, padding: '10px 8px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: tab === n.id ? 'var(--gold)' : 'var(--ink3)',
              transition: 'color 0.15s'
            }}>
              <span style={{ fontSize: 20 }}>{n.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{n.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
