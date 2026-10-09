import { describe, it, expect } from 'vitest';
import { getWorklenzSuggestions } from './worklenzSuggestionService';
import type { TeamMember, FollowUpTask } from '../types';

const makeMember = (over: Partial<TeamMember>): TeamMember => ({
  id: 'TM-1', name: 'Ahmed', role: 'property_consultant',
  roleTitleAr: 'مستشار عقاري', roleTitleEn: 'Property Consultant',
  phone: '01000000000', email: 'ahmed@example.com', avatarBg: 'bg-navy',
  status: 'available', maxCapacity: 8, activeTasksCount: 0,
  closedDealsCount: 0, closedVolumeEgp: 0, winRatePercentage: 0,
  onTimeRatePercentage: 0, specialties: [], joinedDate: '2026-01-01',
  ...over,
});

const makeTask = (over: Partial<FollowUpTask>): FollowUpTask => ({
  id: 'T-1', title: 'Follow up call', clientName: 'Sara',
  stage: 'lead', type: 'call', priority: 'medium',
  dueDate: '2026-10-05', agent: 'Ahmed',
  ...over,
});

describe('getWorklenzSuggestions', () => {
  it('returns empty array for empty team', () => {
    expect(getWorklenzSuggestions('Palm Hills', [], [])).toEqual([]);
  });

  it('ranks compound expert first (45 workload + 35 expertise + 10 status = 90)', () => {
    const expert = makeMember({ id: 'TM-A', name: 'Expert', specialties: ['بالم هيلز'] });
    const generalist = makeMember({ id: 'TM-B', name: 'Generalist', specialties: [] });
    const result = getWorklenzSuggestions('Palm Hills', [generalist, expert], []);
    expect(result[0].member.id).toBe('TM-A');
    expect(result[0].score).toBe(90);
    expect(result[0].hasCompoundExpertise).toBe(true);
    expect(result[1].score).toBe(55);
  });

  it('matches Arabic specialty to English compound (cross-lingual)', () => {
    const member = makeMember({ specialties: ['ماونتن فيو'] });
    const result = getWorklenzSuggestions('Mountain View iCity', [member], []);
    expect(result[0].hasCompoundExpertise).toBe(true);
    expect(result[0].matchedSpecialty).toBe('ماونتن فيو');
  });

  it('penalizes overloaded members below zero and explains why', () => {
    const overloaded = makeMember({ id: 'TM-C', name: 'Ahmed', maxCapacity: 2 });
    const tasks = [makeTask({ id: 'T-1' }), makeTask({ id: 'T-2', stage: 'contacted' })];
    const result = getWorklenzSuggestions('Palm Hills', [overloaded], tasks);
    expect(result[0].activeCount).toBe(2);
    expect(result[0].score).toBeLessThan(0);
    expect(result[0].reasonEn).toContain('Workload full');
  });

  it('does not count completed tasks as active load', () => {
    const member = makeMember({ name: 'Ahmed' });
    const result = getWorklenzSuggestions('', [member], [makeTask({ stage: 'completed' })]);
    expect(result[0].activeCount).toBe(0);
    expect(result[0].score).toBe(65); // 45 workload + 10 empty-compound bonus + 10 status
  });

  it('subtracts 10 points for offline members', () => {
    const offline = makeMember({ name: 'Ahmed', status: 'offline' });
    const result = getWorklenzSuggestions('', [offline], []);
    expect(result[0].score).toBe(45); // 45 + 10 expertise - 10 offline
  });
});
