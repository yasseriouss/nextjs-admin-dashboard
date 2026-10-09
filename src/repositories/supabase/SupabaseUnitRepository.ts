import type { Unit, UnitCommentEntry, UnitAuditLogEntry, UnitStatus } from '../../types';
import type { UnitRepository } from '../types';
import { supabase, isSupabaseConfigured } from '../../services/supabase/client';
import { LocalUnitRepository } from '../local/LocalUnitRepository';
import type { Database } from '../../services/supabase/database.types';

type UnitRow = Database['public']['Tables']['units']['Row'];

function rowToUnit(row: UnitRow, comments?: UnitCommentEntry[], auditLog?: UnitAuditLogEntry[]): Unit {
  return {
    id: row.id,
    status: row.status as UnitStatus,
    compound: row.compound,
    area: row.area,
    propertyType: row.property_type,
    unitType: row.unit_type,
    size: Number(row.size) || 0,
    beds: Number(row.beds) || 1,
    baths: Number(row.baths) || 1,
    floor: row.floor || undefined,
    price: Number(row.price) || 0,
    currency: row.currency || 'EGP',
    notes: row.notes || undefined,
    ownerName: row.owner_name || undefined,
    ownerPhone: row.owner_phone || undefined,
    deliveryDate: row.delivery_date || undefined,
    agent: row.agent_name || undefined,
    category: (row.category as 'sales' | 'rent') || 'sales',
    qrCodeUrl: row.qr_code_url || undefined,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    videoUrl: row.video_url || undefined,
    comments: comments || [],
    auditLog: auditLog || [],
  };
}

function unitToInsertRow(unit: Unit): Database['public']['Tables']['units']['Insert'] {
  return {
    id: unit.id,
    status: unit.status,
    category: unit.category || 'sales',
    compound: unit.compound,
    area: unit.area,
    property_type: unit.propertyType || 'Residential',
    unit_type: unit.unitType || 'Apartment',
    size: Number(unit.size) || 0,
    beds: Number(unit.beds) || 1,
    baths: Number(unit.baths) || 1,
    floor: unit.floor !== undefined ? String(unit.floor) : null,
    price: Number(unit.price) || 0,
    currency: unit.currency || 'EGP',
    notes: unit.notes || null,
    owner_name: unit.ownerName || null,
    owner_phone: unit.ownerPhone || null,
    delivery_date: unit.deliveryDate || 'Ready',
    agent_name: unit.agent || null,
    images: unit.images || [],
    video_url: unit.videoUrl || null,
    qr_code_url: unit.qrCodeUrl || null,
    is_published_landing: false,
    is_demo: false,
  };
}

export class SupabaseUnitRepository implements UnitRepository {
  private fallback: LocalUnitRepository = new LocalUnitRepository();

  private get client() {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }
    return supabase;
  }

  async list(): Promise<Unit[]> {
    const client = this.client;
    if (!client) return this.fallback.list();

    const { data: rows, error } = await client
      .from('units')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !rows) {
      console.warn('[SupabaseUnitRepository] Failed to list units, falling back to local:', error?.message);
      return this.fallback.list();
    }

    return rows.map(r => rowToUnit(r));
  }

  async get(id: string): Promise<Unit | null> {
    const client = this.client;
    if (!client) return this.fallback.get(id);

    const { data: row, error } = await client
      .from('units')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !row) {
      return this.fallback.get(id);
    }

    // Load child comments
    const { data: comments } = await client
      .from('unit_comments')
      .select('*')
      .eq('unit_id', id)
      .order('created_at', { ascending: false });

    // Load child audit logs
    const { data: auditLogs } = await client
      .from('unit_audit_logs')
      .select('*')
      .eq('unit_id', id)
      .order('created_at', { ascending: false });

    const parsedComments: UnitCommentEntry[] = (comments || []).map(c => ({
      id: c.id,
      unitId: c.unit_id,
      author: c.author_name,
      authorRole: c.author_role || undefined,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      content: c.content,
      isPinned: c.is_pinned,
      pinnedAt: c.pinned_at || undefined,
      category: c.category as any,
      tags: Array.isArray(c.tags) ? (c.tags as string[]) : [],
    }));

    const parsedAuditLogs: UnitAuditLogEntry[] = (auditLogs || []).map(a => ({
      id: a.id,
      timestamp: a.created_at,
      action: a.action as any,
      field: a.field || undefined,
      oldValue: a.old_value || undefined,
      newValue: a.new_value || undefined,
      changedBy: a.changed_by_name,
      notes: a.notes || undefined,
    }));

    return rowToUnit(row, parsedComments, parsedAuditLogs);
  }

  async create(unit: Unit): Promise<Unit> {
    const client = this.client;
    if (!client) return this.fallback.create(unit);

    const insertPayload = unitToInsertRow(unit);
    const { data, error } = await client
      .from('units')
      .upsert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      console.warn('[SupabaseUnitRepository] Create failed, saving locally:', error?.message);
      return this.fallback.create(unit);
    }

    return rowToUnit(data);
  }

  async update(id: string, patch: Partial<Unit>): Promise<Unit> {
    const client = this.client;
    if (!client) return this.fallback.update(id, patch);

    const updatePayload: Database['public']['Tables']['units']['Update'] = {};
    if (patch.status !== undefined) updatePayload.status = patch.status;
    if (patch.category !== undefined) updatePayload.category = patch.category;
    if (patch.compound !== undefined) updatePayload.compound = patch.compound;
    if (patch.area !== undefined) updatePayload.area = patch.area;
    if (patch.price !== undefined) updatePayload.price = Number(patch.price);
    if (patch.size !== undefined) updatePayload.size = Number(patch.size);
    if (patch.beds !== undefined) updatePayload.beds = Number(patch.beds);
    if (patch.baths !== undefined) updatePayload.baths = Number(patch.baths);
    if (patch.floor !== undefined) updatePayload.floor = String(patch.floor);
    if (patch.notes !== undefined) updatePayload.notes = patch.notes;
    if (patch.images !== undefined) updatePayload.images = patch.images;
    if (patch.agent !== undefined) updatePayload.agent_name = patch.agent;

    const { data, error } = await client
      .from('units')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.warn('[SupabaseUnitRepository] Update failed, updating locally:', error?.message);
      return this.fallback.update(id, patch);
    }

    return rowToUnit(data);
  }

  async delete(id: string): Promise<boolean> {
    const client = this.client;
    if (!client) return this.fallback.delete(id);

    const { error } = await client.from('units').delete().eq('id', id);
    if (error) {
      console.warn('[SupabaseUnitRepository] Delete failed:', error.message);
      return this.fallback.delete(id);
    }
    return true;
  }

  async addComment(
    unitId: string,
    comment: Omit<UnitCommentEntry, 'id' | 'createdAt'>
  ): Promise<UnitCommentEntry> {
    const client = this.client;
    if (!client) return this.fallback.addComment(unitId, comment);

    const { data, error } = await client
      .from('unit_comments')
      .insert({
        unit_id: unitId,
        author_name: comment.author,
        author_role: comment.authorRole || 'Agent',
        content: comment.content,
        is_pinned: comment.isPinned || false,
        category: comment.category || 'internal_note',
        tags: comment.tags || [],
      })
      .select()
      .single();

    if (error || !data) {
      return this.fallback.addComment(unitId, comment);
    }

    return {
      id: data.id,
      unitId: data.unit_id,
      author: data.author_name,
      authorRole: data.author_role || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      content: data.content,
      isPinned: data.is_pinned,
      category: data.category as any,
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    };
  }

  async addAuditLog(
    unitId: string,
    log: Omit<UnitAuditLogEntry, 'id' | 'timestamp'>
  ): Promise<UnitAuditLogEntry> {
    const client = this.client;
    if (!client) return this.fallback.addAuditLog(unitId, log);

    const { data, error } = await client
      .from('unit_audit_logs')
      .insert({
        unit_id: unitId,
        action: log.action,
        field: log.field || null,
        old_value: log.oldValue !== undefined ? String(log.oldValue) : null,
        new_value: log.newValue !== undefined ? String(log.newValue) : null,
        changed_by_name: log.changedBy,
        notes: log.notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      return this.fallback.addAuditLog(unitId, log);
    }

    return {
      id: data.id,
      timestamp: data.created_at,
      action: data.action as any,
      field: data.field || undefined,
      oldValue: data.old_value || undefined,
      newValue: data.new_value || undefined,
      changedBy: data.changed_by_name,
      notes: data.notes || undefined,
    };
  }
}
