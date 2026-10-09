import type { Unit, Owner, ClientLead, FollowUpTask, DashboardKPIs } from '../types';

export function computeDashboardKpis(input: {
  units: Unit[];
  owners: Owner[];
  clients: ClientLead[];
  tasks: FollowUpTask[];
  mode: 'sales' | 'rent';
}): DashboardKPIs {
  const relevant = input.mode === 'rent'
    ? input.units.filter(u => u.category === 'rent')
    : input.units.filter(u => u.category !== 'rent');

  let availableUnits = 0;
  let reservedUnits = 0;
  let soldUnits = 0;
  let totalMarketValue = 0;
  let priceCount = 0;

  for (const u of relevant) {
    const s = u.status.toLowerCase();
    if (s.includes('avail') || s.includes('متاح')) availableUnits++;
    else if (s.includes('reserv') || s.includes('حجز')) reservedUnits++;
    else if (s.includes('sold') || s.includes('بيع')) soldUnits++;

    const p = Number(u.price) || 0;
    if (p > 0) {
      totalMarketValue += p;
      priceCount++;
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayFollowUpsCount = input.tasks.filter(
    t => t.dueDate === todayStr && t.stage !== 'completed'
  ).length;

  return {
    totalUnits: relevant.length,
    availableUnits,
    reservedUnits,
    soldUnits,
    totalMarketValue,
    avgUnitPrice: priceCount > 0 ? Math.round(totalMarketValue / priceCount) : 0,
    activeClientsCount: input.clients.length,
    ownersCount: input.owners.length,
    todayFollowUpsCount,
  };
}
