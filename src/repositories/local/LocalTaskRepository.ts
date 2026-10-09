import type { FollowUpTask } from '../../types';
import type { TaskRepository } from '../types';
import { loadTasks, saveJson, STORAGE_KEYS } from '../../data/storage';

export class LocalTaskRepository implements TaskRepository {
  async list(): Promise<FollowUpTask[]> {
    return loadTasks();
  }

  async get(id: string): Promise<FollowUpTask | null> {
    const tasks = loadTasks();
    return tasks.find((t) => t.id === id) ?? null;
  }

  async create(task: FollowUpTask): Promise<FollowUpTask> {
    const tasks = loadTasks();
    const existingIndex = tasks.findIndex((t) => t.id === task.id);
    let next: FollowUpTask[];
    if (existingIndex >= 0) {
      next = [...tasks];
      next[existingIndex] = task;
    } else {
      next = [task, ...tasks];
    }
    saveJson(STORAGE_KEYS.tasks, next);
    return task;
  }

  async update(id: string, patch: Partial<FollowUpTask>): Promise<FollowUpTask> {
    const tasks = loadTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`[LocalTaskRepository] Task with id "${id}" not found.`);
    }
    const updated: FollowUpTask = { ...tasks[index], ...patch, id };
    const next = [...tasks];
    next[index] = updated;
    saveJson(STORAGE_KEYS.tasks, next);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const tasks = loadTasks();
    const next = tasks.filter((t) => t.id !== id);
    saveJson(STORAGE_KEYS.tasks, next);
    return next.length < tasks.length;
  }
}
