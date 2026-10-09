import type { SalesContract } from '../data/mockContracts';

export interface AgentLedger {
  name: string;
  dealsCount: number;
  totalSalesVolume: number;
  totalEarnedCommission: number;
  paidCommission: number;
  pendingCommission: number;
  contracts: SalesContract[];
}

export function computeCommission(dealValue: number, commissionRate = 2.5, agentShareRate = 50) {
  const totalCommission = Math.round((dealValue * commissionRate) / 100);
  const agentCommissionAmount = Math.round((totalCommission * agentShareRate) / 100);
  return { commissionRate, totalCommission, agentShareRate, agentCommissionAmount };
}

export function aggregateContractMetrics(contracts: SalesContract[]) {
  const sum = (f: (c: SalesContract) => number) => contracts.reduce((s, c) => s + (f(c) || 0), 0);
  return {
    totalDeals: contracts.length,
    totalVolume: sum(c => c.dealValue),
    totalAgencyCommission: sum(c => c.totalCommission),
    totalAgentCommissions: sum(c => c.agentCommissionAmount),
    totalPaidToAgents: sum(c => (c.status === 'paid' ? c.agentCommissionAmount : 0)),
    totalPendingPayouts: sum(c => (c.status !== 'paid' ? c.agentCommissionAmount : 0)),
  };
}

const emptyLedger = (name: string): AgentLedger => ({
  name, dealsCount: 0, totalSalesVolume: 0, totalEarnedCommission: 0,
  paidCommission: 0, pendingCommission: 0, contracts: [],
});

export function buildAgentLedgers(contracts: SalesContract[], agentNames: string[]): AgentLedger[] {
  const map = new Map<string, AgentLedger>();
  agentNames.filter(Boolean).forEach(name => map.set(name, emptyLedger(name)));
  for (const c of contracts) {
    const entry = map.get(c.agentName) ?? emptyLedger(c.agentName);
    entry.dealsCount += 1;
    entry.totalSalesVolume += c.dealValue || 0;
    entry.totalEarnedCommission += c.agentCommissionAmount || 0;
    if (c.status === 'paid') entry.paidCommission += c.agentCommissionAmount || 0;
    else entry.pendingCommission += c.agentCommissionAmount || 0;
    entry.contracts.push(c);
    map.set(c.agentName, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.totalEarnedCommission - a.totalEarnedCommission);
}
