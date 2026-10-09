import type { FollowUpTask, KanbanStage, SubtaskItem, TaskPriority } from '../../types';
import type { TaskRepository } from '../types';
import { supabase, isSupabaseConfigured } from '../../services/supabase/client';
import { LocalTaskRepository } from '../local/LocalTaskRepository';
import type { Database } from '../../services/supabase/database.types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];

function rowToTask(row: TaskRow): FollowUpTask {
  const subtasks = Array.isArray(row.subtasks)
    ? (row.subtasks as unknown as SubtaskItem[])
    : [];

  return {
    id: row.id,
    title: row.title,
    clientName: '',
    unitId: row.related_unit_id || undefined,
    clientId: row.related_client_id || undefined,
    stage: (row.stage as unknown as KanbanStage) || 'lead',
    type: 'call',
    priority: (row.priority as TaskPriority) || 'medium',
    dueDate: row.due_date || new Date().toISOString().slice(0, 10),
    dueTime: row.due_time || undefined,
    agent: row.assigned_to_name || 'Agent',
    notes: row.description || undefined,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at,
    subtasks,
  };
}

export class SupabaseTaskRepository implements TaskRepository {
  private fallback = new LocalTaskRepository();

  private get client() {
    if (!isSupabaseConfigured() || !supabase) return null;
    return supabase;
  }

  async list(): Promise<FollowUpTask[]> {
    const client = this.client;
    if (!client) return this.fallback.list();

    const { data: rows, error } = await client
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !rows) {
      console.warn('[SupabaseTaskRepository] Failed to list tasks, falling back to local:', error?.message);
      return this.fallback.list();
    }

    return rows.map(rowToTask);
  }

  async get(id: string): Promise<FollowUpTask | null> {
    const client = this.client;
    if (!client) return this.fallback.get(id);

    const { data: row, error } = await client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !row) {
      return this.fallback.get(id);
    }

    return rowToTask(row);
  }

  async create(task: FollowUpTask): Promise<FollowUpTask> {
    const client = this.client;
    if (!client) return this.fallback.create(task);

    const insertData: Database['public']['Tables']['tasks']['Insert'] = {
      id: task.id.length === 36 ? task.id : undefined,
      title: task.title,
      description: task.notes || null,
      assigned_to_name: task.agent || null,
      due_date: task.dueDate || null,
      due_time: task.dueTime || null,
      priority: task.priority || 'medium',
      stage: task.stage as unknown as Database['public']['Tables']['tasks']['Insert']['stage'],
      related_unit_id: task.unitId || null,
      related_client_id: task.clientId && task.clientId.length === 36 ? task.clientId : null,
      is_completed: !!task.completedAt,
      completed_at: task.completedAt || null,
      subtasks: task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [],
    };

    const { data, error } = await client
      .from('tasks')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      console.warn('[SupabaseTaskRepository] Create error, falling back to local:', error?.message);
      return this.fallback.create(task);
    }

    await this.fallback.create({ ...task, id: data.id });
    return rowToTask(data);
  }

  async update(id: string, patch: Partial<FollowUpTask>): Promise<FollowUpTask> {
    const client = this.client;
    if (!client) return this.fallback.update(id, patch);

    const updateData: Database['public']['Tables']['tasks']['Update'] = {};
    if (patch.title !== undefined) updateData.title = patch.title;
    if (patch.notes !== undefined) updateData.description = patch.notes || null;
    if (patch.agent !== undefined) updateData.assigned_to_name = patch.agent || null;
    if (patch.dueDate !== undefined) updateData.due_date = patch.dueDate || null;
    if (patch.dueTime !== undefined) updateData.due_time = patch.dueTime || null;
    if (patch.priority !== undefined) updateData.priority = patch.priority;
    if (patch.stage !== undefined) {
      updateData.stage = patch.stage as unknown as Database['public']['Tables']['tasks']['Update']['stage'];
    }
    if (patch.completedAt !== undefined) {
      updateData.is_completed = !!patch.completedAt;
      updateData.completed_at = patch.completedAt || null;
    }
    if (patch.subtasks !== undefined) {
      updateData.subtasks = JSON.parse(JSON.stringify(patch.subtasks));
    }

    const { data, error } = await client
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.warn('[SupabaseTaskRepository] Update error, falling back to local:', error?.message);
      return this.fallback.update(id, patch);
    }

    await this.fallback.update(id, patch);
    return rowToTask(data);
  }

  async delete(id: string): Promise<boolean> {
    const client = this.client;
    if (!client) return this.fallback.delete(id);

    const { error } = await client.from('tasks').delete().eq('id', id);
    if (error) {
      console.warn('[SupabaseTaskRepository] Delete error, falling back to local:', error?.message);
      return this.fallback.delete(id);
    }

    await this.fallback.delete(id);
    return true;
  }
}
