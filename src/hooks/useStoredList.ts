import { useQuery, useQueryClient, notifyManager } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  saveJson,
  STORAGE_KEYS,
  loadUnits,
  loadOwners,
  loadTasks,
  loadClients,
  loadTeam,
  loadContracts,
  loadUiSettings,
} from '../data/storage';
import type { Unit, Owner, FollowUpTask, ClientLead, TeamMember, UISettings } from '../types';
import type { SalesContract } from '../data/mockContracts';
import {
  getUnitRepository,
  getClientRepository,
  getTaskRepository,
  getContractRepository,
  getOwnerRepository,
} from '../repositories';

notifyManager.setScheduler((cb) => cb());

export function useStoredList<T>(key: string, loader: () => T) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['storage', key], queryFn: loader, staleTime: Infinity });

  const setData = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const prev = client.getQueryData<T>(['storage', key]) ?? loader();
      const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
      client.setQueryData(['storage', key], next);
      saveJson(key, next);
    },
    [client, key, loader]
  );

  return { data: query.data as T, setData, isPending: query.isPending };
}

export function useUnits() {
  const repo = getUnitRepository();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['storage', STORAGE_KEYS.units],
    queryFn: () => repo.list(),
    initialData: loadUnits,
    staleTime: Infinity,
  });

  const setData = useCallback(
    (updater: Unit[] | ((prev: Unit[]) => Unit[])) => {
      const prev = client.getQueryData<Unit[]>(['storage', STORAGE_KEYS.units]) ?? loadUnits();
      const next = typeof updater === 'function' ? (updater as (p: Unit[]) => Unit[])(prev) : updater;
      client.setQueryData(['storage', STORAGE_KEYS.units], next);
      saveJson(STORAGE_KEYS.units, next);
    },
    [client]
  );

  return { data: query.data as Unit[], setData, isPending: query.isPending };
}

export function useClients() {
  const repo = getClientRepository();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['storage', STORAGE_KEYS.clients],
    queryFn: () => repo.list(),
    initialData: loadClients,
    staleTime: Infinity,
  });

  const setData = useCallback(
    (updater: ClientLead[] | ((prev: ClientLead[]) => ClientLead[])) => {
      const prev = client.getQueryData<ClientLead[]>(['storage', STORAGE_KEYS.clients]) ?? loadClients();
      const next = typeof updater === 'function' ? (updater as (p: ClientLead[]) => ClientLead[])(prev) : updater;
      client.setQueryData(['storage', STORAGE_KEYS.clients], next);
      saveJson(STORAGE_KEYS.clients, next);
    },
    [client]
  );

  return { data: query.data as ClientLead[], setData, isPending: query.isPending };
}

export function useTasks() {
  const repo = getTaskRepository();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['storage', STORAGE_KEYS.tasks],
    queryFn: () => repo.list(),
    initialData: loadTasks,
    staleTime: Infinity,
  });

  const setData = useCallback(
    (updater: FollowUpTask[] | ((prev: FollowUpTask[]) => FollowUpTask[])) => {
      const prev = client.getQueryData<FollowUpTask[]>(['storage', STORAGE_KEYS.tasks]) ?? loadTasks();
      const next = typeof updater === 'function' ? (updater as (p: FollowUpTask[]) => FollowUpTask[])(prev) : updater;
      client.setQueryData(['storage', STORAGE_KEYS.tasks], next);
      saveJson(STORAGE_KEYS.tasks, next);
    },
    [client]
  );

  return { data: query.data as FollowUpTask[], setData, isPending: query.isPending };
}

export function useContracts() {
  const repo = getContractRepository();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['storage', STORAGE_KEYS.contracts],
    queryFn: () => repo.list(),
    initialData: loadContracts,
    staleTime: Infinity,
  });

  const setData = useCallback(
    (updater: SalesContract[] | ((prev: SalesContract[]) => SalesContract[])) => {
      const prev = client.getQueryData<SalesContract[]>(['storage', STORAGE_KEYS.contracts]) ?? loadContracts();
      const next = typeof updater === 'function' ? (updater as (p: SalesContract[]) => SalesContract[])(prev) : updater;
      client.setQueryData(['storage', STORAGE_KEYS.contracts], next);
      saveJson(STORAGE_KEYS.contracts, next);
    },
    [client]
  );

  return { data: query.data as SalesContract[], setData, isPending: query.isPending };
}

export function useOwners() {
  const repo = getOwnerRepository();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['storage', STORAGE_KEYS.owners],
    queryFn: () => repo.list(),
    initialData: loadOwners,
    staleTime: Infinity,
  });

  const setData = useCallback(
    (updater: Owner[] | ((prev: Owner[]) => Owner[])) => {
      const prev = client.getQueryData<Owner[]>(['storage', STORAGE_KEYS.owners]) ?? loadOwners();
      const next = typeof updater === 'function' ? (updater as (p: Owner[]) => Owner[])(prev) : updater;
      client.setQueryData(['storage', STORAGE_KEYS.owners], next);
      saveJson(STORAGE_KEYS.owners, next);
    },
    [client]
  );

  return { data: query.data as Owner[], setData, isPending: query.isPending };
}

export const useTeam = () => useStoredList<TeamMember[]>(STORAGE_KEYS.team, loadTeam);

export const useUiSettings = () => useStoredList<UISettings>(STORAGE_KEYS.uiSettings, loadUiSettings);
