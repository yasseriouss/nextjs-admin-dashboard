import type { ClientLead, InteractionLog, LeadRating, LeadSource, LeadStage } from '../../types';
import type { ClientRepository } from '../types';
import { supabase, isSupabaseConfigured } from '../../services/supabase/client';
import { LocalClientRepository } from '../local/LocalClientRepository';
import type { Database } from '../../services/supabase/database.types';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type InteractionRow = Database['public']['Tables']['client_interactions']['Row'];

function rowToInteraction(row: InteractionRow): InteractionLog {
  const d = new Date(row.created_at);
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return {
    id: row.id,
    date: row.created_at.slice(0, 10),
    time: timeStr,
    type: (row.type as InteractionLog['type']) || 'call',
    agent: row.agent_name,
    summary: row.summary,
    outcome: row.outcome || undefined,
  };
}

function rowToClient(row: ClientRow, interactions: InteractionLog[] = []): ClientLead {
  // Map LeadStatus to LeadStage if necessary
  let stage: LeadStage = 'new';
  const s = (row.status || '').toLowerCase();
  if (s.includes('new') || s.includes('جديد')) stage = 'new';
  else if (s.includes('contact') || s.includes('تواصل')) stage = 'contacted';
  else if (s.includes('qualif') || s.includes('مؤهل')) stage = 'qualified';
  else if (s.includes('view') || s.includes('معاينة')) stage = 'viewing';
  else if (s.includes('nego') || s.includes('تفاوض')) stage = 'negotiation';
  else if (s.includes('won') || s.includes('مغلق') || s.includes('تم')) stage = 'won';
  else if (s.includes('lost') || s.includes('خسارة')) stage = 'lost';

  const rating: LeadRating = row.priority === 'urgent' ? 'hot' : row.priority === 'high' ? 'hot' : row.priority === 'medium' ? 'warm' : 'cold';

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    company: undefined,
    rating,
    source: 'direct' as LeadSource,
    stage,
    targetBudgetMin: Number(row.budget_min) || 0,
    targetBudgetMax: Number(row.budget_max) || 0,
    purpose: 'buy',
    targetPropertyType: row.property_type || undefined,
    targetCompound: row.preferred_area || undefined,
    assignedAgent: row.assigned_agent_name || 'Agent',
    dealValue: Number(row.budget_max) || undefined,
    notes: row.notes || undefined,
    interactionLogs: interactions,
    createdAt: row.created_at,
  };
}

export class SupabaseClientRepository implements ClientRepository {
  private fallback = new LocalClientRepository();

  private get client() {
    if (!isSupabaseConfigured() || !supabase) return null;
    return supabase;
  }

  async list(): Promise<ClientLead[]> {
    const client = this.client;
    if (!client) return this.fallback.list();

    const { data: rows, error } = await client
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !rows) {
      console.warn('[SupabaseClientRepository] Failed to list clients, falling back to local:', error?.message);
      return this.fallback.list();
    }

    return rows.map((r) => rowToClient(r));
  }

  async get(id: string): Promise<ClientLead | null> {
    const client = this.client;
    if (!client) return this.fallback.get(id);

    const { data: row, error } = await client
      .from('clients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !row) {
      return this.fallback.get(id);
    }

    const { data: interactions } = await client
      .from('client_interactions')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false });

    const parsedInteractions = (interactions || []).map(rowToInteraction);
    return rowToClient(row, parsedInteractions);
  }

  async create(lead: ClientLead): Promise<ClientLead> {
    const client = this.client;
    if (!client) return this.fallback.create(lead);

    const insertData: Database['public']['Tables']['clients']['Insert'] = {
      id: lead.id.length === 36 ? lead.id : undefined, // only pass id if valid uuid
      name: lead.name,
      phone: lead.phone,
      email: lead.email || null,
      preferred_area: lead.targetCompound || null,
      property_type: lead.targetPropertyType || null,
      budget_min: lead.targetBudgetMin || null,
      budget_max: lead.targetBudgetMax || null,
      assigned_agent_name: lead.assignedAgent || null,
      notes: lead.notes || null,
      priority: lead.rating === 'hot' ? 'urgent' : lead.rating === 'warm' ? 'medium' : 'low',
    };

    const { data, error } = await client
      .from('clients')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      console.warn('[SupabaseClientRepository] Create error, falling back to local:', error?.message);
      return this.fallback.create(lead);
    }

    // Keep local cache synced
    await this.fallback.create({ ...lead, id: data.id });
    return rowToClient(data, lead.interactionLogs);
  }

  async update(id: string, patch: Partial<ClientLead>): Promise<ClientLead> {
    const client = this.client;
    if (!client) return this.fallback.update(id, patch);

    const updateData: Database['public']['Tables']['clients']['Update'] = {};
    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.phone !== undefined) updateData.phone = patch.phone;
    if (patch.email !== undefined) updateData.email = patch.email || null;
    if (patch.targetCompound !== undefined) updateData.preferred_area = patch.targetCompound || null;
    if (patch.targetPropertyType !== undefined) updateData.property_type = patch.targetPropertyType || null;
    if (patch.targetBudgetMin !== undefined) updateData.budget_min = patch.targetBudgetMin;
    if (patch.targetBudgetMax !== undefined) updateData.budget_max = patch.targetBudgetMax;
    if (patch.assignedAgent !== undefined) updateData.assigned_agent_name = patch.assignedAgent;
    if (patch.notes !== undefined) updateData.notes = patch.notes || null;
    if (patch.rating !== undefined) {
      updateData.priority = patch.rating === 'hot' ? 'urgent' : patch.rating === 'warm' ? 'medium' : 'low';
    }

    const { data, error } = await client
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.warn('[SupabaseClientRepository] Update error, falling back to local:', error?.message);
      return this.fallback.update(id, patch);
    }

    await this.fallback.update(id, patch);
    return rowToClient(data);
  }

  async delete(id: string): Promise<boolean> {
    const client = this.client;
    if (!client) return this.fallback.delete(id);

    const { error } = await client.from('clients').delete().eq('id', id);
    if (error) {
      console.warn('[SupabaseClientRepository] Delete error, falling back to local:', error?.message);
      return this.fallback.delete(id);
    }

    await this.fallback.delete(id);
    return true;
  }
}
