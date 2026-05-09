import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bfuunlrugixhqdjtzfre.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_LzJglgvg_L9mGQwJIwE4SA_a-Kw8ZXC'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Clients (formerly customers) ───────────────────────
export const getClients = () =>
  supabase.from('clients').select('*').order('name')

export const getClient = (id) =>
  supabase.from('clients').select(`
    *,
    jobs(id, description, status, job_date, revenue, created_at)
  `).eq('id', id).single()

export const upsertClient = (data) =>
  supabase.from('clients').upsert(data).select().single()

export const deleteClient = (id) =>
  supabase.from('clients').delete().eq('id', id)

// ── Jobs ───────────────────────────────────────────────
export const getJobs = () =>
  supabase.from('jobs').select(`
    *,
    clients(id, name, phone, email, address),
    expenses(amount),
    job_subcontractors(amount)
  `).order('created_at', { ascending: false })

export const getJob = (id) =>
  supabase.from('jobs').select(`
    *,
    clients(id, name, phone, email, address),
    expenses(*),
    job_media(*),
    testimonials(*),
    job_subcontractors(*, subcontractors(*)),
    referral_partner:referral_partners!referral_partner_id(id, name, organization)
  `).eq('id', id).single()

export const upsertJob = (data) =>
  supabase.from('jobs').upsert(data).select().single()

export const deleteJob = (id) =>
  supabase.from('jobs').delete().eq('id', id)

// ── Expenses ───────────────────────────────────────────
export const upsertExpense = (data) =>
  supabase.from('expenses').upsert(data).select().single()

export const deleteExpense = (id) =>
  supabase.from('expenses').delete().eq('id', id)

// ── Media ──────────────────────────────────────────────
export const uploadMedia = async (jobId, file) => {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${jobId}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('job-media').upload(path, file)
  if (uploadError) return { error: uploadError }
  const isVideo = file.type.startsWith('video/')
  return supabase.from('job_media').insert({
    job_id: jobId,
    media_type: isVideo ? 'video' : 'image',
    storage_path: path,
    show_on_website: false,
    sort_order: 0
  }).select().single()
}

export const getMediaUrl = (path) =>
  supabase.storage.from('job-media').getPublicUrl(path).data.publicUrl

export const updateMedia = (id, data) =>
  supabase.from('job_media').update(data).eq('id', id)

export const deleteMedia = async (id, path) => {
  await supabase.storage.from('job-media').remove([path])
  return supabase.from('job_media').delete().eq('id', id)
}

// ── Testimonials ───────────────────────────────────────
export const upsertTestimonial = (data) =>
  supabase.from('testimonials').upsert(data).select().single()

export const deleteTestimonial = (id) =>
  supabase.from('testimonials').delete().eq('id', id)

// ── Subcontractors ─────────────────────────────────────
export const getSubcontractors = () =>
  supabase.from('subcontractors')
    .select('*, job_subcontractors(amount, created_at)')
    .order('name')

export const upsertSubcontractor = (data) =>
  supabase.from('subcontractors').upsert(data).select().single()

export const deleteSubcontractor = (id) =>
  supabase.from('subcontractors').delete().eq('id', id)

export const upsertJobSubcontractor = (data) =>
  supabase.from('job_subcontractors').upsert(data).select('*, subcontractors(*)').single()

export const deleteJobSubcontractor = (id) =>
  supabase.from('job_subcontractors').delete().eq('id', id)

// ── Leads (formerly inquiries) ─────────────────────────
export const getLeads = () =>
  supabase.from('leads').select('*, referral_partner:referral_partners!referral_partner_id(id, name, organization)').order('created_at', { ascending: false })

// ── Referral Partners ──────────────────────────────────
export const getReferralPartners = () =>
  supabase.from('referral_partners').select(`
    *,
    leads(id, status, converted_client_id),
    referred_jobs:jobs!referral_partner_id(id, referral_reward_amount, referral_reward_paid)
  `).order('name')

export const upsertReferralPartner = (data) =>
  supabase.from('referral_partners').upsert(data).select().single()

export const deleteReferralPartner = (id) =>
  supabase.from('referral_partners').delete().eq('id', id)

export const upsertLead = (data) =>
  supabase.from('leads').upsert(data).select().single()

export const updateLead = (id, data) =>
  supabase.from('leads').update(data).eq('id', id)

export const convertLeadToClient = async (lead, clientData) => {
  const { data: client, error: clientError } = await upsertClient(clientData)
  if (clientError) return { error: clientError }
  const { error: leadError } = await updateLead(lead.id, {
    status: 'Booked',
    converted_client_id: client.id
  })
  if (leadError) return { error: leadError }
  return { data: client }
}
