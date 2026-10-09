import { formatNumber } from '../i18n/format';
import React from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  Coins, 
  TrendingUp, 
  Users, 
  UserCheck, 
  CalendarCheck2 
} from 'lucide-react';
import { DashboardKPIs } from '../types';
import { useT } from '../i18n/useT';

interface KPIProps {
  kpis: DashboardKPIs;
}

export const KPISection: React.FC<KPIProps> = ({ kpis }) => {
  const t = useT();

  const formatEGP = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M ${t('common.currency.egp')}`;
    }
    return `${formatNumber(val)} ${t('common.currency.egp')}`;
  };

  const cards = [
    {
      title: t('kpi.totalUnits.title'),
      subtitle: t('kpi.totalUnits.subtitle'),
      value: formatNumber(kpis.totalUnits),
      icon: Building2,
      color: 'from-blue-600/20 to-blue-500/5',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      badge: t('kpi.totalUnits.badge')
    },
    {
      title: t('kpi.available.title'),
      subtitle: t('kpi.available.subtitle'),
      value: formatNumber(kpis.availableUnits),
      icon: CheckCircle2,
      color: 'from-emerald-600/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      badge: t('kpi.available.badge', { p: kpis.totalUnits ? Math.round((kpis.availableUnits / kpis.totalUnits) * 100) : 0 })
    },
    {
      title: t('kpi.reserved.title'),
      subtitle: t('kpi.reserved.subtitle'),
      value: formatNumber(kpis.reservedUnits),
      icon: Clock,
      color: 'from-accent to-accent',
      borderColor: 'border-accent',
      iconColor: 'text-accent',
      badge: t('kpi.reserved.badge')
    },
    {
      title: t('kpi.portfolio.title'),
      subtitle: t('kpi.portfolio.subtitle'),
      value: formatEGP(kpis.totalMarketValue),
      icon: Coins,
      color: 'from-yellow-600/20 to-accent',
      borderColor: 'border-yellow-500/30',
      iconColor: 'text-yellow-400',
      badge: t('kpi.portfolio.badge')
    },
    {
      title: t('kpi.avgPrice.title'),
      subtitle: t('kpi.avgPrice.subtitle'),
      value: formatEGP(kpis.avgUnitPrice),
      icon: TrendingUp,
      color: 'from-purple-600/20 to-purple-500/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      badge: t('kpi.avgPrice.badge')
    }
  ];

  const subCards = [
    {
      label: t('kpi.activeClients'),
      value: kpis.activeClientsCount || 14,
      icon: Users,
      color: 'text-cyan-400'
    },
    {
      label: t('kpi.owners'),
      value: kpis.ownersCount || 9,
      icon: UserCheck,
      color: 'text-indigo-400'
    },
    {
      label: t('kpi.todayFollowUps'),
      value: kpis.todayFollowUpsCount || 3,
      icon: CalendarCheck2,
      color: 'text-rose-400'
    },
    {
      label: t('kpi.soldUnits'),
      value: kpis.soldUnits || 0,
      icon: CheckCircle2,
      color: 'text-teal-400'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`relative overflow-hidden rounded-xl border ${card.borderColor} bg-gradient-to-br ${card.color} bg-surface p-4.5 backdrop-blur shadow-sm hover:border-border transition-all`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {card.title}
                  </span>
                  <div className="mt-1 text-2xl font-bold tracking-tight text-white">
                    {card.value}
                  </div>
                  <div className="mt-0.5 text-[11px] text-text-muted">
                    {card.subtitle}
                  </div>
                </div>
                <div className={`rounded-lg p-2 bg-surface-raised border border-border ${card.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-surface-raised text-text-muted border border-border">
                  {card.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini Activity Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-raised border border-border rounded-xl p-3">
        {subCards.map((sub, i) => {
          const SubIcon = sub.icon;
          return (
            <div key={i} className="flex items-center gap-3 px-2 py-1">
              <div className={`p-2 rounded-lg bg-surface border border-border ${sub.color}`}>
                <SubIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-text-muted font-medium">{sub.label}</div>
                <div className="text-base font-bold text-white leading-tight">{sub.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
