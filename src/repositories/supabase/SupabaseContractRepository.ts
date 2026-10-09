import type { SalesContract } from '../../data/mockContracts';
import type { ContractRepository } from '../types';
import { supabase, isSupabaseConfigured } from '../../services/supabase/client';
import { LocalContractRepository } from '../local/LocalContractRepository';
import type { Database } from '../../services/supabase/database.types';

type ContractRow = Database['public']['Tables']['contracts']['Row'];

function rowToContract(row: ContractRow): SalesContract {
  return {
    id: row.id,
    contractNumber: `6O-${row.id.slice(0, 8).toUpperCase()}`,
    unitId: row.unit_id,
    compound: '',
    area: '',
    clientName: row.buyer_name,
    clientPhone: row.buyer_phone || undefined,
    dealValue: Number(row.sales_price) || 0,
    closingDate: row.contract_date,
    expiryDate: row.contract_date,
    agentName: row.assigned_agent_name || 'Agent',
    commissionRate: Number(row.commission_rate) || 2.5,
    totalCommission: Number(row.commission_amount) || 0,
    agentShareRate: 50,
    agentCommissionAmount: Number(row.agent_share) || 0,
    status: row.status === 'completed' ? 'paid' : row.status === 'signed' ? 'approved' : 'pending',
    notes: row.notes || undefined,
  };
}

export class SupabaseContractRepository implements ContractRepository {
  private fallback = new LocalContractRepository();

  private get client() {
    if (!isSupabaseConfigured() || !supabase) return null;
    return supabase;
  }

  async list(): Promise<SalesContract[]> {
    const client = this.client;
    if (!client) return this.fallback.list();

    const { data: rows, error } = await client
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !rows) {
      console.warn('[SupabaseContractRepository] Failed to list contracts, falling back to local:', error?.message);
      return this.fallback.list();
    }

    return rows.map(rowToContract);
  }

  async get(id: string): Promise<SalesContract | null> {
    const client = this.client;
    if (!client) return this.fallback.get(id);

    const { data: row, error } = await client
      .from('contracts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !row) {
      return this.fallback.get(id);
    }

    return rowToContract(row);
  }

  async create(contract: SalesContract): Promise<SalesContract> {
    const client = this.client;
    if (!client) return this.fallback.create(contract);

    const statusEnum: Database['public']['Tables']['contracts']['Insert']['status'] =
      contract.status === 'paid' ? 'completed' : contract.status === 'approved' ? 'signed' : 'draft';

    const insertData: Database['public']['Tables']['contracts']['Insert'] = {
      id: contract.id.length === 36 ? contract.id : undefined,
      unit_id: contract.unitId,
      buyer_name: contract.clientName,
      buyer_phone: contract.clientPhone || '01000000000',
      seller_name: 'Property Owner',
      seller_phone: '01000000000',
      sales_price: contract.dealValue,
      commission_rate: contract.commissionRate,
      commission_amount: contract.totalCommission,
      agent_share: contract.agentCommissionAmount,
      company_share: contract.totalCommission - contract.agentCommissionAmount,
      contract_date: contract.closingDate || new Date().toISOString().slice(0, 10),
      status: statusEnum,
      assigned_agent_name: contract.agentName || null,
      notes: contract.notes || null,
    };

    const { data, error } = await client
      .from('contracts')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      console.warn('[SupabaseContractRepository] Create error, falling back to local:', error?.message);
      return this.fallback.create(contract);
    }

    await this.fallback.create({ ...contract, id: data.id });
    return rowToContract(data);
  }

  async update(id: string, patch: Partial<SalesContract>): Promise<SalesContract> {
    const client = this.client;
    if (!client) return this.fallback.update(id, patch);

    const updateData: Database['public']['Tables']['contracts']['Update'] = {};
    if (patch.dealValue !== undefined) updateData.sales_price = patch.dealValue;
    if (patch.clientName !== undefined) updateData.buyer_name = patch.clientName;
    if (patch.clientPhone !== undefined) updateData.buyer_phone = patch.clientPhone;
    if (patch.commissionRate !== undefined) updateData.commission_rate = patch.commissionRate;
    if (patch.totalCommission !== undefined) updateData.commission_amount = patch.totalCommission;
    if (patch.agentCommissionAmount !== undefined) updateData.agent_share = patch.agentCommissionAmount;
    if (patch.closingDate !== undefined) updateData.contract_date = patch.closingDate;
    if (patch.notes !== undefined) updateData.notes = patch.notes || null;
    if (patch.status !== undefined) {
      updateData.status = patch.status === 'paid' ? 'completed' : patch.status === 'approved' ? 'signed' : 'draft';
    }

    const { data, error } = await client
      .from('contracts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.warn('[SupabaseContractRepository] Update error, falling back to local:', error?.message);
      return this.fallback.update(id, patch);
    }

    await this.fallback.update(id, patch);
    return rowToContract(data);
  }

  async delete(id: string): Promise<boolean> {
    const client = this.client;
    if (!client) return this.fallback.delete(id);

    const { error } = await client.from('contracts').delete().eq('id', id);
    if (error) {
      console.warn('[SupabaseContractRepository] Delete error, falling back to local:', error?.message);
      return this.fallback.delete(id);
    }

    await this.fallback.delete(id);
    return true;
  }
}
