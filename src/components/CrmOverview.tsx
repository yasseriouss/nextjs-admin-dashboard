import { formatNumber } from '../i18n/format';
import React from 'react';
import { Unit, ClientLead, FollowUpTask, DashboardKPIs } from '../types';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Plus, 
  RefreshCw, 
  Bot, 
  Globe, 
  MapPin, 
  CheckCircle2, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface CrmOverviewProps {
  units: Unit[];
  clients: ClientLead[];
  tasks?: FollowUpTask[];
  kpis: DashboardKPIs;
  isArabic: boolean;
  onNavigate: (tab: string) => void;
  onOpenNewUnit: () => void;
  onSyncDatabase: () => void;
  isSyncing: boolean;
}

const MONTHLY_SALES_DATA = [
  { month: 'Jan', sales: 14200000, deals: 3 },
  { month: 'Feb', sales: 18500000, deals: 4 },
  { month: 'Mar', sales: 12100000, deals: 2 },
  { month: 'Apr', sales: 22400000, deals: 5 },
  { month: 'May', sales: 29800000, deals: 6 },
  { month: 'Jun', sales: 34500000, deals: 7 },
  { month: 'Jul', sales: 27100000, deals: 5 },
  { month: 'Aug', sales: 38900000, deals: 8 },
  { month: 'Sep', sales: 42000000, deals: 9 },
  { month: 'Oct', sales: 46500000, deals: 10 },
];

export const CrmOverview: React.FC<CrmOverviewProps> = ({
  units,
  clients,
  kpis,
  isArabic,
  onNavigate,
  onOpenNewUnit,
  onSyncDatabase,
  isSyncing,
}) => {
  // Unit breakdown by type
  const typeCounts = units.reduce<Record<string, number>>((acc, u) => {
    const type = u.unitType || 'Apartment';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  // Compound breakdown
  const compoundCounts = units.reduce<Record<string, number>>((acc, u) => {
    const c = u.compound || '6 October';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  const compoundEntries = Object.entries(compoundCounts).slice(0, 5);

  // Recent transactions
  const recentDeals = units.filter(u => u.status === 'Sold' || u.status === 'Reserved').slice(0, 5);

  return (
    <div data-testid="view-overview" className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse"></span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              {isArabic ? 'لوحة التحكم والمتابعة التنفيذية' : '6 October Real Estate CRM Overview'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-tertiary">
            {isArabic 
              ? 'مراقبة المبيعات، ومحفظة الوحدات، ومتابعة العملاء والصفقات في 6 أكتوبر والشيخ زايد.' 
              : 'Real-time sales velocity, unit inventory, client lead pipeline, and deals tracking.'}
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center flex-wrap gap-2">
          <Button
            onClick={onOpenNewUnit}
            className="bg-navy hover:bg-navy/80 text-gold font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isArabic ? 'إضافة وحدة جديدة' : '+ New Unit'}</span>
          </Button>

          <Button
            onClick={onSyncDatabase}
            disabled={isSyncing}
            className="bg-card-surface-area border border-card-border hover:bg-background-gray-primary text-text-primary text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? (isArabic ? 'جاري المزامنة...' : 'Syncing...') : (isArabic ? 'مزامنة Supabase' : 'Sync Supabase')}</span>
          </Button>

          <Button
            onClick={() => onNavigate('gemini')}
            className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/30 hover:border-purple-400 text-purple-200 text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span>{isArabic ? 'المساعد الذكي' : 'Gemini AI'}</span>
          </Button>

          <Button
            onClick={() => onNavigate('landing-page-cms')}
            className="bg-gold/15 border border-gold/30 hover:bg-gold/25 text-gold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isArabic ? 'الموقع الرئيسي' : 'Landing Page'}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Row (NextAdmin TailGrids Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Listings */}
        <Card className="border border-card-border hover:border-gold/40 transition shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-tertiary">
                {isArabic ? 'الوحدات المعروضة' : 'Active Listings'}
              </span>
              <div className="size-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary tracking-tight">
                {kpis.totalUnits}
              </div>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                {kpis.availableUnits} {isArabic ? 'متاح للبيع والإيجار' : 'available for deal'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 pt-1 border-t border-card-border">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+6.4% {isArabic ? 'هذا الشهر' : 'vs last month'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Portfolio Volume */}
        <Card className="border border-card-border hover:border-gold/40 transition shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-tertiary">
                {isArabic ? 'قيمة المحفظة العقارية' : 'Portfolio Volume'}
              </span>
              <div className="size-9 rounded-xl bg-gold/15 text-gold flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary tracking-tight">
                {(kpis.totalMarketValue / 1_000_000).toFixed(1)}M <span className="text-xs font-bold text-gold">EGP</span>
              </div>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                {isArabic ? 'متوسط سعر الوحدة' : 'Avg price'}: {((kpis.totalMarketValue / Math.max(kpis.totalUnits, 1)) / 1_000_000).toFixed(1)}M EGP
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 pt-1 border-t border-card-border">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2% {isArabic ? 'نمو رأسمالي' : 'capital growth'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Client Leads */}
        <Card className="border border-card-border hover:border-gold/40 transition shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-tertiary">
                {isArabic ? 'العملاء والطلبات' : 'Client Leads'}
              </span>
              <div className="size-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary tracking-tight">
                {clients.length || 38}
              </div>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                {kpis.todayFollowUpsCount || 0} {isArabic ? 'متابعات مستحقة اليوم' : 'follow-ups today'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 pt-1 border-t border-card-border">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>68% {isArabic ? 'نسبة التحويل' : 'conversion rate'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Estimated Commissions */}
        <Card className="border border-card-border hover:border-gold/40 transition shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-tertiary">
                {isArabic ? 'العمولات المقدرة' : 'Earned Commissions'}
              </span>
              <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary tracking-tight">
                {((kpis.totalMarketValue * 0.025) / 1_000_000).toFixed(2)}M <span className="text-xs font-bold text-emerald-400">EGP</span>
              </div>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                {isArabic ? 'عمولة قياسية 2.5%' : 'Standard 2.5% broker fee'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 pt-1 border-t border-card-border">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>92% {isArabic ? 'من المستهدف السنوي' : 'of annual target'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Charts & Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2 cols) */}
        <Card className="lg:col-span-2 border border-card-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                {isArabic ? 'حجم المبيعات والصفقات الشهرية' : 'Monthly Sales Velocity & Closed Volume'}
              </CardTitle>
              <p className="text-xs text-text-tertiary">
                {isArabic ? 'قيمة الصفقات المغلقة شهرياً بالجنيه المصري' : 'Closed transaction values in EGP (2026)'}
              </p>
            </div>
            <Badge className="bg-gold/15 text-gold border-0 text-xs font-bold">
              2026 YTD
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_SALES_DATA}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-navy)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="var(--color-text-muted)" 
                    fontSize={11} 
                    tickLine={false} 
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip 
                    formatter={(val: any) => [`${formatNumber(val)} EGP`, isArabic ? 'حجم المبيعات' : 'Sales Volume']}
                    contentStyle={{ 
                      backgroundColor: 'var(--color-navy)', 
                      borderColor: 'var(--color-accent)', 
                      borderRadius: '12px',
                      color: 'var(--color-text)',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="var(--color-accent)" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#salesGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Breakdown by Unit Type (1 col) */}
        <Card className="border border-card-border flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-text-primary">
              {isArabic ? 'توزيع الوحدات حسب النوع' : 'Inventory by Property Type'}
            </CardTitle>
            <p className="text-xs text-text-tertiary">
              {isArabic ? 'نسبة كل فئة في المخزون الحالي' : 'Listing distribution across categories'}
            </p>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-2 flex-1">
            {typeEntries.map(([type, count]) => {
              const pct = Math.round((count / Math.max(units.length, 1)) * 100);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-text-secondary">{type}</span>
                    <span className="text-text-primary font-mono">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-background-gray-primary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-navy to-gold rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
          <CardFooter className="pt-2 border-t border-card-border flex justify-between items-center text-xs">
            <span className="text-text-tertiary">
              {units.length} {isArabic ? 'إجمالي الوحدات' : 'total active units'}
            </span>
            <button
              onClick={() => onNavigate('sales')}
              className="text-gold hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{isArabic ? 'عرض كل الوحدات' : 'View all units'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </CardFooter>
        </Card>
      </div>

      {/* Row 2: Top Compounds & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 6 October Compounds */}
        <Card className="border border-card-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                {isArabic ? 'أبرز كمبوندات 6 أكتوبر والشيخ زايد' : 'Prime 6th of October Developments'}
              </CardTitle>
              <p className="text-xs text-text-tertiary">
                {isArabic ? 'المشاريع الأكثر طلباً في السوق' : 'Top residential & commercial projects'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('map')}
              className="text-xs text-gold hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isArabic ? 'خريطة المشاريع' : 'Open Map'}</span>
            </button>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            {compoundEntries.map(([compound, count]) => (
              <div 
                key={compound}
                className="flex items-center justify-between p-3 rounded-xl bg-background-gray-primary/50 hover:bg-background-gray-primary transition border border-card-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-navy text-gold font-bold text-xs flex items-center justify-center">
                    {compound.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-text-primary">
                      {compound}
                    </h5>
                    <span className="text-[11px] text-text-tertiary">
                      6th of October City / Sheikh Zayed
                    </span>
                  </div>
                </div>

                <Badge className="bg-gold/15 text-gold border-0 text-xs font-semibold">
                  {count} {isArabic ? 'وحدات' : 'units'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Closed & Reserved Transactions */}
        <Card className="border border-card-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                {isArabic ? 'أحدث الصفقات المحجوزة والمباعة' : 'Recent Closed & Reserved Deals'}
              </CardTitle>
              <p className="text-xs text-text-tertiary">
                {isArabic ? 'آخر المعاملات العقارية المسجلة في النظام' : 'Latest registered deals and agreements'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('contracts')}
              className="text-xs text-gold hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{isArabic ? 'كل العقود' : 'All Contracts'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            {recentDeals.length > 0 ? (
              recentDeals.map((deal) => (
                <div 
                  key={deal.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-background-gray-primary/50 hover:bg-background-gray-primary transition border border-card-border/50 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] text-text-tertiary">
                      {deal.id}
                    </span>
                    <h5 className="font-bold text-text-primary">
                      {deal.compound} — {deal.unitType}
                    </h5>
                    <p className="text-text-tertiary text-[11px]">
                      {deal.area} m² • {formatNumber(deal.price)} EGP
                    </p>
                  </div>

                  <div className="text-end space-y-1">
                    <Badge className={deal.status === 'Sold' ? 'bg-blue-500/15 text-blue-400 border-0' : 'bg-accent text-accent border-0'}>
                      {deal.status}
                    </Badge>
                    <div className="text-[10px] font-semibold text-gold">
                      Fee: {formatNumber(((deal.price || 0) * 0.025))} EGP
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-text-tertiary">
                {isArabic ? 'لا توجد صفقات محجوزة حالياً.' : 'No recent deals to show.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Attribution Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-4 rounded-xl bg-card-surface-area border border-card-border text-xs text-text-tertiary">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{isArabic ? 'نظام إدارة العقارات المتكامل — 6 أكتوبر' : 'Integrated Real Estate Management — 6th of October'}</span>
        </div>
        <a 
          href="https://yasserious.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-bold text-gold hover:underline"
        >
          Created by yasserious.com
        </a>
      </div>
    </div>
  );
};

export default CrmOverview;
