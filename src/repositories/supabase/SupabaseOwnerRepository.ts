import type { Owner } from '../../types';
import type { OwnerRepository } from '../types';
import { supabase, isSupabaseConfigured } from '../../services/supabase/client';
import { LocalOwnerRepository } from '../local/LocalOwnerRepository';
import type { Database } from '../../services/supabase/database.types';

type OwnerRow = Database['public']['Tables']['owners']['Row'];

function rowToOwner(row: OwnerRow): Owner {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    phone2: row.phone2 || undefined,
    whatsapp: row.whatsapp || undefined,
    email: row.email || undefined,
    area: row.area || undefined,
    address: row.address || undefined,
    company: row.company || undefined,
    notes: row.notes || undefined,
    status: 'Active',
  };
}

export class SupabaseOwnerRepository implements OwnerRepository {
  private fallback = new LocalOwnerRepository();

  private get client() {
    if (!isSupabaseConfigured() || !supabase) return null;
    return supabase;
  }

  async list(): Promise<Owner[]> {
    const client = this.client;
    if (!client) return this.fallback.list();

    const { data: rows, error } = await client
      .from('owners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !rows) {
      console.warn('[SupabaseOwnerRepository] Failed to list owners, falling back to local:', error?.message);
      return this.fallback.list();
    }

    return rows.map(rowToOwner);
  }

  async get(id: string): Promise<Owner | null> {
    const client = this.client;
    if (!client) return this.fallback.get(id);

    const { data: row, error } = await client
      .from('owners')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !row) {
      return this.fallback.get(id);
    }

    return rowToOwner(row);
  }

  async create(owner: Owner): Promise<Owner> {
    const client = this.client;
    if (!client) return this.fallback.create(owner);

    const insertData: Database['public']['Tables']['owners']['Insert'] = {
      id: owner.id.length === 36 ? owner.id : undefined,
      name: owner.name,
      phone: owner.phone,
      phone2: owner.phone2 || null,
      whatsapp: owner.whatsapp || null,
      email: owner.email || null,
      area: owner.area || null,
      address: owner.address || null,
      company: owner.company || null,
      notes: owner.notes || null,
    };

    const { data, error } = await client
      .from('owners')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      console.warn('[SupabaseOwnerRepository] Create error, falling back to local:', error?.message);
      return this.fallback.create(owner);
    }

    await this.fallback.create({ ...owner, id: data.id });
    return rowToOwner(data);
  }

  async update(id: string, patch: Partial<Owner>): Promise<Owner> {
    const client = this.client;
    if (!client) return this.fallback.update(id, patch);

    const updateData: Database['public']['Tables']['owners']['Update'] = {};
    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.phone !== undefined) updateData.phone = patch.phone;
    if (patch.phone2 !== undefined) updateData.phone2 = patch.phone2 || null;
    if (patch.whatsapp !== undefined) updateData.whatsapp = patch.whatsapp || null;
    if (patch.email !== undefined) updateData.email = patch.email || null;
    if (patch.area !== undefined) updateData.area = patch.area || null;
    if (patch.address !== undefined) updateData.address = patch.address || null;
    if (patch.company !== undefined) updateData.company = patch.company || null;
    if (patch.notes !== undefined) updateData.notes = patch.notes || null;

    const { data, error } = await client
      .from('owners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.warn('[SupabaseOwnerRepository] Update error, falling back to local:', error?.message);
      return this.fallback.update(id, patch);
    }

    await this.fallback.update(id, patch);
    return rowToOwner(data);
  }

  async delete(id: string): Promise<boolean> {
    const client = this.client;
    if (!client) return this.fallback.delete(id);

    const { error } = await client.from('owners').delete().eq('id', id);
    if (error) {
      console.warn('[SupabaseOwnerRepository] Delete error, falling back to local:', error?.message);
      return this.fallback.delete(id);
    }

    await this.fallback.delete(id);
    return true;
  }
}
