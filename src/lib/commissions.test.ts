import { describe, it, expect } from 'vitest';
import { computeCommission, aggregateContractMetrics, buildAgentLedgers } from './commissions';
import { INITIAL_CONTRACTS } from '../data/mockContracts';
import type { SalesContract } from '../data/mockContracts';

const c = (over: Partial<SalesContract>): SalesContract => ({ ...structuredClone(INITIAL_CONTRACTS[0]), ...over });

describe('computeCommission', () => {
  it('computes agency and agent shares with default rates (2.5% / 50%)', () => {
    expect(computeCommission(7_850_000)).toEqual({
      commissionRate: 2.5, totalCommission: 196250, agentShareRate: 50, agentCommissionAmount: 98125,
    });
  });
  it('honors custom rates and rounds to whole EGP', () => {
    expect(computeCommission(1_000_000, 3, 40)).toEqual({
      commissionRate: 3, totalCommission: 30000, agentShareRate: 40, agentCommissionAmount: 12000,
    });
    expect(computeCommission(99_999, 2.5, 50).totalCommission).toBe(2500);
  });
  it('returns zeros for zero deal value', () => {
    expect(computeCommission(0)).toEqual({
      commissionRate: 2.5, totalCommission: 0, agentShareRate: 50, agentCommissionAmount: 0,
    });
  });
});

describe('aggregateContractMetrics', () => {
  it('sums volume and commissions, splitting paid vs pending', () => {
    const contracts = [
      c({ id: 'C1', dealValue: 100, status: 'paid', totalCommission: 10, agentCommissionAmount: 5 }),
      c({ id: 'C2', dealValue: 200, status: 'pending', totalCommission: 20, agentCommissionAmount: 8 }),
      c({ id: 'C3', dealValue: 300, status: 'approved', totalCommission: 30, agentCommissionAmount: 12 }),
    ];
    expect(aggregateContractMetrics(contracts)).toEqual({
      totalDeals: 3, totalVolume: 600, totalAgencyCommission: 60,
      totalAgentCommissions: 25, totalPaidToAgents: 5, totalPendingPayouts: 20,
    });
  });
  it('returns zeros for an empty list', () => {
    expect(aggregateContractMetrics([]).totalDeals).toBe(0);
    expect(aggregateContractMetrics([]).totalVolume).toBe(0);
  });
});

describe('buildAgentLedgers', () => {
  it('pre-seeds every named agent, aggregates contracts, sorts earned desc', () => {
    const contracts = [
      c({ id: 'C1', agentName: 'Sara', status: 'paid', dealValue: 100, agentCommissionAmount: 7 }),
      c({ id: 'C2', agentName: 'Omar', status: 'pending', dealValue: 500, agentCommissionAmount: 30 }),
    ];
    const ledgers = buildAgentLedgers(contracts, ['Sara', 'Omar', 'Nour']);
    expect(ledgers.map(l => l.name)).toEqual(['Omar', 'Sara', 'Nour']);
    expect(ledgers[0].dealsCount).toBe(1);
    expect(ledgers[0].pendingCommission).toBe(30);
    expect(ledgers[1].paidCommission).toBe(7);
    expect(ledgers[2]).toMatchObject({ dealsCount: 0, totalEarnedCommission: 0, contracts: [] });
  });
  it('creates an entry for a contract agent missing from the names list', () => {
    const ledgers = buildAgentLedgers([c({ agentName: 'Ghost', agentCommissionAmount: 4 })], ['Sara']);
    expect(ledgers.map(l => l.name).sort()).toEqual(['Ghost', 'Sara']);
  });
});
