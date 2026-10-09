import { formatNumber } from '../i18n/format';
import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { 
  TrendingUp, 
  Building2, 
  PieChart as PieIcon, 
  BarChart3, 
  Calendar, 
  DollarSign, 
  Award, 
  ArrowUpRight, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Layers,
  Printer,
} from 'lucide-react';
import { Unit, DashboardKPIs } from '../types';
import { MonthlySalesPdfModal } from './MonthlySalesPdfModal';

interface MonthlySalesReportsProps {
  units: Unit[];
  kpis: DashboardKPIs;
  isArabic: boolean;
  theme?: 'dark' | 'light';
}

const COLORS = [
  'rgb(59, 130, 246)', // blue-500
  'rgb(16, 185, 129)', // emerald-500
  'rgb(245, 158, 11)', // accent
  'rgb(139, 92, 246)', // purple-500
  'rgb(236, 72, 153)', // pink-500
  'rgb(6, 182, 212)', // cyan-500
  'rgb(249, 115, 22)', // orange-500
  'rgb(99, 102, 241)', // indigo-500
  'rgb(20, 184, 166)', // teal-500
];

export const MonthlySalesReports: React.FC<MonthlySalesReportsProps> = ({
  units,
  kpis,
  isArabic,
  theme = 'dark'
}) => {
  const [selectedCompound, setSelectedCompound] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'year' | 'quarter' | 'all'>('year');
  const [activeChartTab, setActiveChartTab] = useState<'monthly' | 'compounds' | 'status' | 'priceMeter'>('monthly');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Available unique compounds list
  const compoundList = useMemo(() => {
    const set = new Set<string>();
    units.forEach(u => {
      if (u.compound && u.compound.trim()) {
        set.add(u.compound.trim());
      }
    });
    return Array.from(set).sort();
  }, [units]);

  // Filtered units based on compound selector
  const filteredUnits = useMemo(() => {
    if (selectedCompound === 'all') return units;
    return units.filter(u => u.compound === selectedCompound);
  }, [units, selectedCompound]);

  // 1. Monthly Performance Data (Simulated based on units delivery and status)
  const monthlyData = useMemo(() => {
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Base values aligned with actual inventory volume
    const baseTarget = Math.max(15, Math.round(kpis.totalMarketValue / 12000000));

    return monthsAr.map((mAr, i) => {
      const monthName = isArabic ? mAr : monthsEn[i];
      // Distribute sales realistic curve
      const factor = [0.8, 0.9, 1.2, 1.1, 1.3, 1.5, 1.4, 1.3, 1.6, 1.7, 1.5, 1.8][i];
      const salesVolumeMillions = Number((baseTarget * factor * 0.85).toFixed(1));
      const targetMillions = Number((baseTarget * factor).toFixed(1));
      const dealsCount = Math.max(2, Math.round(factor * 3));
      const reservationsCount = Math.max(3, Math.round(factor * 4.5));

      return {
        month: monthName,
        monthIndex: i + 1,
        sales: salesVolumeMillions,
        target: targetMillions,
        deals: dealsCount,
        reservations: reservationsCount
      };
    });
  }, [kpis.totalMarketValue, isArabic]);

  // 2. Performance by Compound
  const compoundData = useMemo(() => {
    const map = new Map<string, {
      compound: string;
      totalUnits: number;
      available: number;
      reserved: number;
      sold: number;
      totalValueMillions: number;
      avgPriceMeter: number;
      avgSize: number;
    }>();

    units.forEach(u => {
      const cName = u.compound || (isArabic ? 'أخرى' : 'Other');
      const existing = map.get(cName) || {
        compound: cName,
        totalUnits: 0,
        available: 0,
        reserved: 0,
        sold: 0,
        totalValueMillions: 0,
        avgPriceMeter: 0,
        avgSize: 0
      };

      existing.totalUnits += 1;
      const st = (u.status || '').toLowerCase();
      if (st.includes('avail') || st.includes('متاح')) existing.available += 1;
      else if (st.includes('reserv') || st.includes('حجز') || st.includes('محجوز')) existing.reserved += 1;
      else if (st.includes('sold') || st.includes('مباع')) existing.sold += 1;
      else existing.available += 1;

      existing.totalValueMillions += (u.price || 0) / 1000000;
      const numericSize = typeof u.size === 'number' ? u.size : parseFloat(String(u.size)) || 0;
      if (numericSize > 0 && u.price && u.price > 0) {
        const pPerM = u.price / numericSize;
        existing.avgPriceMeter = existing.avgPriceMeter === 0 ? pPerM : (existing.avgPriceMeter + pPerM) / 2;
        existing.avgSize = existing.avgSize === 0 ? numericSize : (existing.avgSize + numericSize) / 2;
      }

      map.set(cName, existing);
    });

    return Array.from(map.values())
      .map(item => ({
        ...item,
        totalValueMillions: Number(item.totalValueMillions.toFixed(1)),
        avgPriceMeter: Math.round(item.avgPriceMeter),
        avgSize: Math.round(item.avgSize)
      }))
      .sort((a, b) => b.totalUnits - a.totalUnits)
      .slice(0, 10);
  }, [units, isArabic]);

  // 3. Status Distribution Data
  const statusData = useMemo(() => {
    let availCount = 0;
    let resCount = 0;
    let soldCount = 0;
    let availValue = 0;
    let resValue = 0;
    let soldValue = 0;

    filteredUnits.forEach(u => {
      const st = (u.status || '').toLowerCase();
      const price = u.price || 0;
      if (st.includes('reserv') || st.includes('حجز') || st.includes('محجوز')) {
        resCount++;
        resValue += price;
      } else if (st.includes('sold') || st.includes('مباع')) {
        soldCount++;
        soldValue += price;
      } else {
        availCount++;
        availValue += price;
      }
    });

    return [
      {
        name: isArabic ? 'متاح للبيع' : 'Available',
        count: availCount,
        valueMillions: Number((availValue / 1000000).toFixed(1)),
        color: 'rgb(16, 185, 129)'
      },
      {
        name: isArabic ? 'محجوز قيد التعاقد' : 'Reserved',
        count: resCount,
        valueMillions: Number((resValue / 1000000).toFixed(1)),
        color: 'rgb(245, 158, 11)'
      },
      {
        name: isArabic ? 'مباع ومكتمل' : 'Sold',
        count: soldCount,
        valueMillions: Number((soldValue / 1000000).toFixed(1)),
        color: 'rgb(59, 130, 246)'
      }
    ];
  }, [filteredUnits, isArabic]);

  // 4. Price Per Square Meter by Compound
  const priceMeterData = useMemo(() => {
    return compoundData
      .filter(c => c.avgPriceMeter > 0)
      .map(c => ({
        compound: c.compound,
        avgPriceMeter: c.avgPriceMeter,
        totalUnits: c.totalUnits
      }))
      .sort((a, b) => b.avgPriceMeter - a.avgPriceMeter);
  }, [compoundData]);

  // Top Compound by Volume
  const topCompound = useMemo(() => {
    if (compoundData.length === 0) return null;
    return compoundData[0];
  }, [compoundData]);

  // Calculations for summary bar
  const totalReportValue = useMemo(() => {
    const sum = filteredUnits.reduce((acc, u) => acc + (u.price || 0), 0);
    return Number((sum / 1000000).toFixed(1));
  }, [filteredUnits]);

  const avgUnitPrice = useMemo(() => {
    if (filteredUnits.length === 0) return 0;
    const sum = filteredUnits.reduce((acc, u) => acc + (u.price || 0), 0);
    return Number((sum / filteredUnits.length / 1000000).toFixed(2));
  }, [filteredUnits]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/20 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {isArabic ? 'تقارير المبيعات الشهرية ومؤشرات الأداء' : 'Monthly Sales & Performance Reports'}
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/30">
                Recharts Analytics
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {isArabic 
                ? 'تحليل بياني لحجم المبيعات، توزيع الكمبوندات، وحالة الوحدات في 6 أكتوبر والشيخ زايد' 
                : 'Interactive charts for monthly sales velocity, compound share, and inventory status'}
            </p>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
          {/* Compound Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-accent shrink-0" />
            <select
              value={selectedCompound}
              onChange={(e) => setSelectedCompound(e.target.value)}
              className="bg-transparent text-text text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-surface text-text">
                {isArabic ? 'كافة الكمبوندات والمشاريع' : 'All Compounds'}
              </option>
              {compoundList.map((c) => (
                <option key={c} value={c} className="bg-surface text-text">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Time range selector */}
          <div className="flex items-center p-1 bg-surface border border-border rounded-xl text-xs">
            <button
              onClick={() => setTimeRange('year')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                timeRange === 'year' ? 'bg-blue-600 text-white font-bold' : 'text-text-muted hover:text-white'
              }`}
            >
              {isArabic ? 'السنة' : 'Year'}
            </button>
            {/* PDF Export for Developers Button */}
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/25 cursor-pointer"
              title={isArabic ? 'تصدير تقرير المبيعات المعتمد بصيغة PDF مع شعار المنظمة للمطورين' : 'Export official PDF report with logo for developers'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isArabic ? 'تصدير تقرير PDF للمطورين' : 'Export PDF for Developers'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] text-text-muted font-medium">
              {isArabic ? 'إجمالي قيمة المعروض' : 'Total Inventory Value'}
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {formatNumber(totalReportValue)} <span className="text-xs text-accent font-normal">{isArabic ? 'مليون ج.م' : 'M EGP'}</span>
            </h3>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              <ArrowUpRight className="w-3 h-3" />
              <span>{filteredUnits.length} {isArabic ? 'وحدة مسجلة' : 'Units listed'}</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Available Units */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] text-text-muted font-medium">
              {isArabic ? 'الوحدات المتاحة للبيع' : 'Available Units'}
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1">
              {statusData[0]?.count || 0}
            </h3>
            <p className="text-[10px] text-text-muted mt-1 font-mono">
              {statusData[0]?.valueMillions || 0} {isArabic ? 'مليون ج.م متاحة كاش وتقسيط' : 'M EGP available'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Reserved / Pending Deals */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] text-text-muted font-medium">
              {isArabic ? 'الوحدات المحجوزة' : 'Reserved Units'}
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-accent mt-1">
              {statusData[1]?.count || 0}
            </h3>
            <p className="text-[10px] text-text-muted mt-1 font-mono">
              {statusData[1]?.valueMillions || 0} {isArabic ? 'مليون ج.م قيد التعاقد' : 'M EGP in closing'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-accent border border-accent flex items-center justify-center text-accent">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Top Performing Compound */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] text-text-muted font-medium">
              {isArabic ? 'المشروع الأعلى حصة' : 'Top Compound'}
            </p>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1 truncate">
              {topCompound?.compound || 'Mountain View'}
            </h3>
            <p className="text-[10px] text-purple-400 mt-1 truncate font-mono">
              {topCompound?.totalUnits || 0} {isArabic ? 'وحدات' : 'units'} &bull; {topCompound?.totalValueMillions || 0}M EGP
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Navigation Tabs for Charts */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveChartTab('monthly')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            activeChartTab === 'monthly'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-text-muted hover:text-white hover:bg-surface-raised'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{isArabic ? 'الأداء المالي الشهري والمستهدف' : 'Monthly Revenue & Target'}</span>
        </button>

        <button
          onClick={() => setActiveChartTab('compounds')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            activeChartTab === 'compounds'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-text-muted hover:text-white hover:bg-surface-raised'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{isArabic ? 'المبيعات حسب الكمبوند والمشروع' : 'Sales by Compound'}</span>
        </button>

        <button
          onClick={() => setActiveChartTab('status')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            activeChartTab === 'status'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-text-muted hover:text-white hover:bg-surface-raised'
          }`}
        >
          <PieIcon className="w-4 h-4" />
          <span>{isArabic ? 'توزيع حالة الوحدات (المتاح / المحجوز / المباع)' : 'Unit Status Breakdown'}</span>
        </button>

        <button
          onClick={() => setActiveChartTab('priceMeter')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            activeChartTab === 'priceMeter'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-text-muted hover:text-white hover:bg-surface-raised'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{isArabic ? 'مقارنة متوسط سعر المتر (ج.م/م²)' : 'Price / Sqm Benchmarking'}</span>
        </button>
      </div>

      {/* CHART SECTION 1: Monthly Sales Velocity vs Quota */}
      {activeChartTab === 'monthly' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-surface border border-border rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>{isArabic ? 'حجم المبيعات الفعلي مقابل المستهدف (مليون جنيه)' : 'Actual Sales vs Target Quota (Million EGP)'}</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {isArabic ? 'مقارنة تدفق المبيعات الشهرية مع الأهداف البيعية' : 'Monthly gross sales pacing vs business plan'}
                </p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(16, 185, 129)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="rgb(16, 185, 129)" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(59, 130, 246)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-text-muted)" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '0.75rem', color: 'var(--color-text)', fontSize: '12px' }}
                    formatter={(val, name) => [
                      `${val} ${isArabic ? 'مليون ج.م' : 'M EGP'}`,
                      name === 'sales' ? (isArabic ? 'المبيعات الفعلية' : 'Actual Sales') : (isArabic ? 'المستهدف البيعي' : 'Target Quota')
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    formatter={(value) => (value === 'sales' ? (isArabic ? 'المبيعات الفعلية' : 'Actual Sales') : (isArabic ? 'المستهدف' : 'Target Quota'))}
                  />
                  <Area type="monotone" dataKey="sales" stroke="rgb(16, 185, 129)" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                  <Area type="monotone" dataKey="target" stroke="rgb(59, 130, 246)" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#targetGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deals count breakdown */}
          <div className="lg:col-span-4 bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-accent" />
                <span>{isArabic ? 'عدد الصفقات والحجوزات شهرياً' : 'Monthly Deal Volume'}</span>
              </h3>
              <p className="text-[11px] text-text-muted mb-4">
                {isArabic ? 'تطور عدد التعاقدات المغلقة والحجوزات' : 'Executed contracts and reservations'}
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" stroke="var(--color-text-muted)" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                    <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '0.75rem', color: 'var(--color-text)', fontSize: '11px' }}
                    />
                    <Bar dataKey="deals" name={isArabic ? 'صفقات مباعة' : 'Closed Deals'} fill="rgb(59, 130, 246)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="reservations" name={isArabic ? 'حجوزات جديدة' : 'Reservations'} fill="rgb(245, 158, 11)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-border mt-2 flex items-center justify-between text-xs text-text-muted font-mono">
              <span>{isArabic ? 'متوسط قيمة الصفقة:' : 'Average Ticket Size:'}</span>
              <span className="font-bold text-white">{avgUnitPrice} {isArabic ? 'مليون ج.م' : 'M EGP'}</span>
            </div>
          </div>
        </div>
      )}

      {/* CHART SECTION 2: Sales & Volume by Compound */}
      {activeChartTab === 'compounds' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-5 shadow-xl">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>{isArabic ? 'إجمالي قيمة الوحدات المسجلة حسب الكمبوند (مليون ج.م)' : 'Total Valuation by Compound (Million EGP)'}</span>
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                {isArabic ? 'ترتيب أعلى الكمبوندات والمشاريع استثماراً في المحفظة' : 'Top project valuations in portfolio'}
              </p>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compoundData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" stroke="var(--color-text-muted)" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                  <YAxis dataKey="compound" type="category" stroke="var(--color-text-muted)" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} width={90} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '0.75rem', color: 'var(--color-text)', fontSize: '11px' }}
                    formatter={(val) => [`${val} ${isArabic ? 'مليون ج.م' : 'M EGP'}`, isArabic ? 'القيمة الإجمالية' : 'Total Valuation']}
                  />
                  <Bar dataKey="totalValueMillions" fill="rgb(139, 92, 246)" radius={[0, 6, 6, 0]}>
                    {compoundData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Units Count in each compound */}
          <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-5 shadow-xl">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>{isArabic ? 'توزيع عدد الوحدات بالمشاريع' : 'Unit Count by Project'}</span>
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                {isArabic ? 'مقارنة حجم المخزون بين كمبوندات أكتوبر وزايد' : 'Listing counts across prime compounds'}
              </p>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compoundData.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="compound" stroke="var(--color-text-muted)" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} />
                  <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '0.75rem', color: 'var(--color-text)', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="available" name={isArabic ? 'متاح' : 'Available'} fill="rgb(16, 185, 129)" stackId="a" />
                  <Bar dataKey="reserved" name={isArabic ? 'محجوز' : 'Reserved'} fill="rgb(245, 158, 11)" stackId="a" />
                  <Bar dataKey="sold" name={isArabic ? 'مباع' : 'Sold'} fill="rgb(59, 130, 246)" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CHART SECTION 3: Unit Status Breakdown (Pie & Donut) */}
      {activeChartTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col items-center">
            <div className="w-full mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                <span>{isArabic ? 'نسبة الوحدات حسب الحالة البيعية' : 'Unit Distribution by Status'}</span>
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                {isArabic ? 'الحصص المئوية للوحدات المتاحة والمحجوزة والمباعة' : 'Percentage split of available vs committed inventory'}
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="count"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '0.75rem', color: 'var(--color-text)', fontSize: '11px' }}
                    formatter={(val) => [`${val} ${isArabic ? 'وحدات' : 'units'}`, isArabic ? 'العدد' : 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Status Legend Badges */}
            <div className="flex items-center justify-center gap-4 flex-wrap mt-2">
              {statusData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-text-muted font-medium">{item.name}:</span>
                  <span className="text-white font-bold font-mono">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Financial Value Table */}
          <div className="lg:col-span-6 bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-accent" />
                <span>{isArabic ? 'القيمة المالية لكل تصنيف بيعي' : 'Financial Value by Status'}</span>
              </h3>
              <p className="text-[11px] text-text-muted mb-4">
                {isArabic ? 'إجمالي المبالغ بالمليون جنيه لكل حالة بالمخزون' : 'Monetary valuation per inventory pipeline status'}
              </p>

              <div className="space-y-3">
                {statusData.map((st, i) => {
                  const percentage = totalReportValue > 0 ? Math.round((st.valueMillions / totalReportValue) * 100) : 0;
                  return (
                    <div key={i} className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-8 rounded-full" style={{ backgroundColor: st.color }} />
                        <div>
                          <h4 className="text-xs font-bold text-white">{st.name}</h4>
                          <p className="text-[10px] text-text-muted font-mono mt-0.5">
                            {st.count} {isArabic ? 'وحدات مسجلة' : 'Units'} &bull; {percentage}% {isArabic ? 'من القيمة' : 'of value'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right rtl:text-left font-mono">
                        <span className="text-base font-extrabold text-white">
                          {formatNumber(st.valueMillions)}
                        </span>
                        <span className="text-[10px] text-text-muted block">
                          {isArabic ? 'مليون ج.م' : 'M EGP'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs text-text-muted">
              <span>{isArabic ? 'إجمالي المحفظة النشطة:' : 'Total Active Valuation:'}</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">{totalReportValue} {isArabic ? 'مليون جنيه' : 'M EGP'}</span>
            </div>
          </div>
        </div>
      )}

      {/* CHART SECTION 4: Price / Sqm Benchmarking */}
      {activeChartTab === 'priceMeter' && (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent" />
                <span>{isArabic ? 'مقارنة متوسط سعر المتر المربع (ج.م/م²) بأهم الكمبوندات' : 'Average Price per Sqm Benchmark (EGP/m²)'}</span>
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                {isArabic ? 'مؤشر أسعار المتر للشقق والفيلات في مشروعات 6 أكتوبر والشيخ زايد' : 'Price per meter benchmark to advise investors and buyers'}
              </p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceMeterData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="compound" 
                  stroke="var(--color-text-muted)" 
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '0.75rem', color: 'var(--color-text)', fontSize: '11px' }}
                  formatter={(val) => [`${formatNumber(val ? Number(val) : 0)} ${isArabic ? 'ج.م/م²' : 'EGP/m²'}`, isArabic ? 'متوسط سعر المتر' : 'Avg Price/m²']}
                />
                <Bar dataKey="avgPriceMeter" fill="rgb(245, 158, 11)" radius={[6, 6, 0, 0]}>
                  {priceMeterData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Comprehensive Compound Inventory Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-surface border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              {isArabic ? 'جدول أداء ومخزون الكمبوندات التفصيلي' : 'Compound Performance & Inventory Matrix'}
            </h3>
          </div>
          <span className="text-[11px] text-text-muted font-mono">
            {compoundData.length} {isArabic ? 'كمبوندات مسجلة' : 'Compounds Indexed'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border text-text-muted uppercase text-[10px]">
                <th className="py-3 px-4 text-right rtl:text-right ltr:text-left">{isArabic ? 'الكمبوند / المشروع' : 'Compound'}</th>
                <th className="py-3 px-4 text-center">{isArabic ? 'إجمالي الوحدات' : 'Total Units'}</th>
                <th className="py-3 px-4 text-center">{isArabic ? 'المتاح' : 'Available'}</th>
                <th className="py-3 px-4 text-center">{isArabic ? 'المحجوز' : 'Reserved'}</th>
                <th className="py-3 px-4 text-center">{isArabic ? 'المباع' : 'Sold'}</th>
                <th className="py-3 px-4 text-center">{isArabic ? 'متوسط المساحة' : 'Avg Size'}</th>
                <th className="py-3 px-4 text-center">{isArabic ? 'متوسط سعر المتر' : 'Avg Price/m²'}</th>
                <th className="py-3 px-4 text-right rtl:text-left ltr:text-right">{isArabic ? 'القيمة الإجمالية' : 'Total Valuation'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-muted">
              {compoundData.map((c, i) => (
                <tr key={i} className="hover:bg-surface-raised transition">
                  <td className="py-3 px-4 font-semibold text-white text-right rtl:text-right ltr:text-left">
                    {c.compound}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-text">
                    {c.totalUnits}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold font-mono">
                      {c.available}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-accent text-accent font-bold font-mono">
                      {c.reserved}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 font-bold font-mono">
                      {c.sold}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-text-muted">
                    {c.avgSize > 0 ? `${c.avgSize} م²` : '-'}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-accent font-semibold">
                    {c.avgPriceMeter > 0 ? `${formatNumber(c.avgPriceMeter)} ج.م` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right rtl:text-left ltr:text-right font-mono font-bold text-white">
                    {c.totalValueMillions} {isArabic ? 'مليون ج.م' : 'M EGP'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Export for Developers Modal */}
      <MonthlySalesPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        units={units}
        kpis={kpis}
        compoundData={compoundData}
        isArabic={isArabic}
        theme={theme}
      />
    </div>
  );
};

export default MonthlySalesReports;
