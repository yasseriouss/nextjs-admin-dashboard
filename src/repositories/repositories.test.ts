import { describe, it, expect, beforeEach } from 'vitest';
import { LocalUnitRepository } from './local/LocalUnitRepository';
import {
  getUnitRepository,
  setUnitRepository,
  getClientRepository,
  setClientRepository,
  getTaskRepository,
  setTaskRepository,
  getContractRepository,
  setContractRepository,
  getOwnerRepository,
  setOwnerRepository,
} from './index';
import type { Unit, ClientLead, FollowUpTask, Owner } from '../types';
import type { SalesContract } from '../data/mockContracts';

describe('Repository Layer', () => {
  beforeEach(() => {
    localStorage.clear();
    setUnitRepository(null);
    setClientRepository(null);
    setTaskRepository(null);
    setContractRepository(null);
    setOwnerRepository(null);
  });

  describe('Unit Repository', () => {
    it('lists initial units when storage is empty', async () => {
      const repo = new LocalUnitRepository();
      const units = await repo.list();
      expect(Array.isArray(units)).toBe(true);
      expect(units.length).toBeGreaterThan(0);
    });

    it('creates, gets, updates, and deletes a unit in local repository', async () => {
      const repo = new LocalUnitRepository();
      const testUnit: Unit = {
        id: 'TEST-UNIT-99',
        status: 'Available',
        compound: 'Test Compound',
        area: '6 October',
        propertyType: 'Residential',
        unitType: 'Apartment',
        size: 150,
        beds: 3,
        baths: 2,
        price: 2500000,
        currency: 'EGP',
      };

      await repo.create(testUnit);
      const fetched = await repo.get('TEST-UNIT-99');
      expect(fetched).not.toBeNull();
      expect(fetched?.compound).toBe('Test Compound');

      const updated = await repo.update('TEST-UNIT-99', { status: 'Sold', price: 2700000 });
      expect(updated.status).toBe('Sold');
      expect(updated.price).toBe(2700000);

      const comment = await repo.addComment('TEST-UNIT-99', {
        unitId: 'TEST-UNIT-99',
        author: 'Test Agent',
        content: 'Client visited and loved the view',
        isPinned: false,
        category: 'client_interaction',
      });
      expect(comment.id).toBeDefined();

      const afterComment = await repo.get('TEST-UNIT-99');
      expect(afterComment?.comments?.length).toBe(1);

      const deleted = await repo.delete('TEST-UNIT-99');
      expect(deleted).toBe(true);
      const afterDelete = await repo.get('TEST-UNIT-99');
      expect(afterDelete).toBeNull();
    });

    it('factory returns a working repository instance', async () => {
      const repo = getUnitRepository();
      expect(repo).toBeDefined();
      expect(typeof repo.list).toBe('function');
      const list = await repo.list();
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe('Client Repository', () => {
    it('lists initial clients and performs CRUD', async () => {
      const repo = getClientRepository();
      const initial = await repo.list();
      expect(Array.isArray(initial)).toBe(true);

      const testClient: ClientLead = {
        id: 'CLIENT-TEST-1',
        name: 'أحمد محمود',
        phone: '01012345678',
        rating: 'hot',
        source: 'direct',
        stage: 'new',
        targetBudgetMin: 3000000,
        targetBudgetMax: 4500000,
        purpose: 'buy',
        assignedAgent: 'Agent 1',
        interactionLogs: [],
        createdAt: new Date().toISOString(),
      };

      await repo.create(testClient);
      const fetched = await repo.get('CLIENT-TEST-1');
      expect(fetched).not.toBeNull();
      expect(fetched?.name).toBe('أحمد محمود');

      const updated = await repo.update('CLIENT-TEST-1', { rating: 'warm', notes: 'Updated notes' });
      expect(updated.rating).toBe('warm');
      expect(updated.notes).toBe('Updated notes');

      const deleted = await repo.delete('CLIENT-TEST-1');
      expect(deleted).toBe(true);
      expect(await repo.get('CLIENT-TEST-1')).toBeNull();
    });
  });

  describe('Task Repository', () => {
    it('lists initial tasks and performs CRUD', async () => {
      const repo = getTaskRepository();
      const initial = await repo.list();
      expect(Array.isArray(initial)).toBe(true);

      const testTask: FollowUpTask = {
        id: 'TASK-TEST-1',
        title: 'Follow up on inspection',
        clientName: 'سارة إبراهيم',
        stage: 'viewing',
        type: 'call',
        priority: 'urgent',
        dueDate: '2026-10-10',
        agent: 'Sara',
      };

      await repo.create(testTask);
      const fetched = await repo.get('TASK-TEST-1');
      expect(fetched?.title).toBe('Follow up on inspection');

      const updated = await repo.update('TASK-TEST-1', { stage: 'negotiation' });
      expect(updated.stage).toBe('negotiation');

      const deleted = await repo.delete('TASK-TEST-1');
      expect(deleted).toBe(true);
      expect(await repo.get('TASK-TEST-1')).toBeNull();
    });
  });

  describe('Contract Repository', () => {
    it('lists initial contracts and performs CRUD', async () => {
      const repo = getContractRepository();
      const initial = await repo.list();
      expect(Array.isArray(initial)).toBe(true);

      const testContract: SalesContract = {
        id: 'CNT-TEST-1',
        contractNumber: '6O-2026-TEST',
        unitId: 'S-0001',
        compound: 'Mountain View',
        area: '6 October',
        clientName: 'طارق السعيد',
        dealValue: 5000000,
        closingDate: '2026-11-01',
        expiryDate: '2027-11-01',
        agentName: 'Karim',
        commissionRate: 2.5,
        totalCommission: 125000,
        agentShareRate: 50,
        agentCommissionAmount: 62500,
        status: 'pending',
      };

      await repo.create(testContract);
      const fetched = await repo.get('CNT-TEST-1');
      expect(fetched?.dealValue).toBe(5000000);

      const updated = await repo.update('CNT-TEST-1', { status: 'approved' });
      expect(updated.status).toBe('approved');

      const deleted = await repo.delete('CNT-TEST-1');
      expect(deleted).toBe(true);
      expect(await repo.get('CNT-TEST-1')).toBeNull();
    });
  });

  describe('Owner Repository', () => {
    it('lists initial owners and performs CRUD', async () => {
      const repo = getOwnerRepository();
      const initial = await repo.list();
      expect(Array.isArray(initial)).toBe(true);

      const testOwner: Owner = {
        id: 'OWN-TEST-1',
        name: 'محمد عبد الله',
        phone: '01234567890',
        area: 'Zayed',
      };

      await repo.create(testOwner);
      const fetched = await repo.get('OWN-TEST-1');
      expect(fetched?.name).toBe('محمد عبد الله');

      const updated = await repo.update('OWN-TEST-1', { area: 'October' });
      expect(updated.area).toBe('October');

      const deleted = await repo.delete('OWN-TEST-1');
      expect(deleted).toBe(true);
      expect(await repo.get('OWN-TEST-1')).toBeNull();
    });
  });
});
