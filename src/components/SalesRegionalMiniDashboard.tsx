import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
} from 'recharts';
import { 
  Building2, 
  DollarSign, 
  PieChart as PieIcon, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Filter, 
} from 'lucide-react';
import { Unit } from '../types';

interface SalesRegionalMiniDashboardProps {
  units: Unit[];
  isArabic: boolean;
  theme?: 'dark' | 'light';
  onFilterArea?: (area: string) => void;
  activeAreaFilter?: string;
}

export const SalesRegionalMiniDashboard: React.FC<SalesRegionalMiniDashboardProps> = ({
  units,
  isArabic,
  theme = 'dark',
  onFilterArea,
  activeAreaFilter = 'all'
}) => {
  const isDark = theme === 'dark';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [metricMode, setMetricMode] = useState<'units' | 'volume'>('volume');

  // Regional Aggregations (6 October vs Sheikh Zayed)
  const stats = useMemo(() => {
    let octUnits = 0;
    let octVolume = 0;
    let zayedUnits = 0;
    let zayedVolume = 0;
    let otherUnits = 0;
    let otherVolume = 0;

    const octCompounds = new Set<string>();
    const zayedCompounds = new Set<string>();

    units.forEach((u) => {
      const areaLower = (u.area || '').toLowerCase();
      const compLower = (u.compound || '').toLowerCase();
      const price = Number(u.price) || 0;

      const isZayed = 
        areaLower.includes('zayed') || 
        areaLower.includes('زايد') || 
        compLower.includes('zayed') || 
        compLower.includes('زايد') ||
        compLower.includes('beverly') ||
        compLower.includes('allegria') ||
        compLower.includes('karmell') ||
        compLower.includes('zed');

      const isOctober = 
        !isZayed && (
          areaLower.includes('october') || 
          areaLower.includes('اكتوبر') || 
          areaLower.includes('أكتوبر') || 
          compLower.includes('october') || 
          compLower.includes('اكتوبر') || 
          compLower.includes('أكتوبر') ||
          compLower.includes('badya') ||
          compLower.includes('mountain view') ||
          compLower.includes('o west') ||
          compLower.includes('palm hills')
        );

      if (isZayed) {
        zayedUnits += 1;
        zayedVolume += price;
        if (u.compound) zayedCompounds.add(u.compound);
      } else if (isOctober) {
        octUnits += 1;
        octVolume += price;
        if (u.compound) octCompounds.add(u.compound);
      } else {
        // Categorize based on main geography
        octUnits += 1;
        octVolume += price;
        if (u.compound) octCompounds.add(u.compound);
      }
    });

    const totalUnits = octUnits + zayedUnits + otherUnits;
    const totalVolume = octVolume + zayedVolume + otherVolume;

    const octAvgPrice = octUnits > 0 ? Math.round(octVolume / octUnits) : 0;
    const zayedAvgPrice = zayedUnits > 0 ? Math.round(zayedVolume / zayedUnits) : 0;

    const octUnitsPct = totalUnits > 0 ? Math.round((octUnits / totalUnits) * 100) : 0;
    const zayedUnitsPct = totalUnits > 0 ? Math.round((zayedUnits / totalUnits) * 100) : 0;

    const octVolumePct = totalVolume > 0 ? Math.round((octVolume / totalVolume) * 100) : 0;
    const zayedVolumePct = totalVolume > 0 ? Math.round((zayedVolume / totalVolume) * 100) : 0;

    const octCommissionExp = Math.round(octVolume * 0.025);
    const zayedCommissionExp = Math.round(zayedVolume * 0.025);

    return {
      totalUnits,
      totalVolume,
      oct: {
        units: octUnits,
        volume: octVolume,
        avgPrice: octAvgPrice,
        unitsPct: octUnitsPct,
        volumePct: octVolumePct,
        commission: octCommissionExp,
        compounds: Array.from(octCompounds).slice(0, 3)
      },
      zayed: {
        units: zayedUnits,
        volume: zayedVolume,
        avgPrice: zayedAvgPrice,
        unitsPct: zayedUnitsPct,
        volumePct: zayedVolumePct,
        commission: zayedCommissionExp,
        compounds: Array.from(zayedCompounds).slice(0, 3)
      }
    };
  }, [units]);

  // Chart Data based on selected mode
  const chartData = useMemo(() => {
    if (metricMode === 'units') {
      return [
        {
          name: isArabic ? '6 أكتوبر' : '6th of October',
          value: stats.oct.units,
          formattedValue: `${stats.oct.units} ${isArabic ? 'وحدة' : 'units'}`,
          percentage: `${stats.oct.unitsPct}%`,
          color: 'rgb(59, 130, 246)', // Blue
          regionKey: 'october'
        },
        {
          name: isArabic ? 'الشيخ زايد' : 'Sheikh Zayed',
          value: stats.zayed.units,
          formattedValue: `${stats.zayed.units} ${isArabic ? 'وحدة' : 'units'}`,
          percentage: `${stats.zayed.unitsPct}%`,
          color: 'rgb(16, 185, 129)', // Emerald
          regionKey: 'zayed'
        }
      ];
    }

    return [
      {
        name: isArabic ? '6 أكتوبر' : '6th of October',
        value: stats.oct.volume,
        formattedValue: `${(stats.oct.volume / 1000000).toFixed(1)}M EGP`,
        percentage: `${stats.oct.volumePct}%`,
        color: 'rgb(59, 130, 246)', // Blue
        regionKey: 'october'
      },
      {
        name: isArabic ? 'الشيخ زايد' : 'Sheikh Zayed',
        value: stats.zayed.volume,
        formattedValue: `${(stats.zayed.volume / 1000000).toFixed(1)}M EGP`,
        percentage: `${stats.zayed.volumePct}%`,
        color: 'rgb(16, 185, 129)', // Emerald
        regionKey: 'zayed'
      }
    ];
  }, [metricMode, stats, isArabic]);

  // Custom Pie Tooltip
  type PieTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: { color: string; name: string; formattedValue: string; percentage: string } }>;
};

const CustomTooltip = ({ active, payload }: PieTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-xl border shadow-xl text-xs space-y-1 ${
          isDark ? 'bg-surface border-border text-white' : 'bg-white border-border text-text'
        }`}>
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </div>
          <div className="font-mono text-sm font-black text-accent">
            {data.formattedValue}
          </div>
          <div className="text-[10px] text-text-muted flex items-center justify-between gap-4">
            <span>{isArabic ? 'الحصة من الإجمالي:' : 'Share of Total:'}</span>
            <span className="font-bold text-white font-mono">{data.percentage}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-2xl border shadow-lg transition duration-200 overflow-hidden ${
      isDark ? 'bg-surface border-border' : 'bg-white border-border'
    }`}>
      {/* Header Bar */}
      <div className={`p-3.5 sm:p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
        isDark ? 'border-border bg-surface' : 'border-border bg-surface'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white shadow-md shadow-blue-500/20">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-text'}`}>
                {isArabic ? 'لوحة معلومات توزيع المناطق وتأثيرها المالي' : 'Regional Distribution & Pipeline Impact Dashboard'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                {isArabic ? 'أكتوبر vs زايد' : 'October vs Zayed'}
              </span>
            </div>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
              {isArabic 
                ? 'رسم بياني دائري لتوزيع الوحدات ومقارنة أثرها المباشر على حجم الصفقات المتوقعة والعمولات' 
                : 'Circular distribution and impact analysis on expected deal pipeline volume'}
            </p>
          </div>
        </div>

        {/* Controls: Mode Switch & Collapse Toggle */}
        <div className="flex items-center gap-2">
          {/* Toggle Metric Mode */}
          <div className={`flex items-center p-0.5 rounded-xl border text-xs font-semibold ${
            isDark ? 'bg-surface border-border' : 'bg-surface-raised border-border'
          }`}>
            <button
              onClick={() => setMetricMode('volume')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                metricMode === 'volume'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'text-text-muted hover:text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>{isArabic ? 'حجم الصفقات (ج.م)' : 'Deal Volume'}</span>
            </button>
            <button
              onClick={() => setMetricMode('units')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                metricMode === 'units'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'text-text-muted hover:text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>{isArabic ? 'عدد الوحدات' : 'Units Count'}</span>
            </button>
          </div>

          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isDark ? 'bg-surface border-border text-text-muted hover:text-white hover:bg-surface-raised' : 'bg-surface-raised border-border text-text-muted hover:bg-surface-raised'
            }`}
            title={isCollapsed ? (isArabic ? 'توسيع اللوحة' : 'Expand') : (isArabic ? 'تصغير اللوحة' : 'Collapse')}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            
            {/* Circular Pie/Donut Chart (5 cols) */}
            <div className={`lg:col-span-5 p-4 rounded-2xl border flex flex-col items-center justify-center relative ${
              isDark ? 'bg-surface border-border' : 'bg-surface border-border'
            }`}>
              <div className="w-full flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-text-muted flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {metricMode === 'volume' 
                      ? (isArabic ? 'توزيع حجم الصفقات المتوقعة' : 'Deal Volume Share') 
                      : (isArabic ? 'توزيع عدد الوحدات بالمخزون' : 'Inventory Share')}
                  </span>
                </span>
                <span className="font-mono text-accent">
                  {metricMode === 'volume'
                    ? `${(stats.totalVolume / 1000000).toFixed(1)}M EGP`
                    : `${stats.totalUnits} ${isArabic ? 'وحدة' : 'Units'}`}
                </span>
              </div>

              {/* Chart Container */}
              <div className="w-full h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={800}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke={isDark ? 'var(--color-navy)' : 'white'} 
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
                    {metricMode === 'volume' ? (isArabic ? 'حجم الصفقات' : 'Pipeline') : (isArabic ? 'الوحدات' : 'Units')}
                  </span>
                  <span className="text-base font-black font-mono text-white">
                    {metricMode === 'volume' ? '100%' : stats.totalUnits}
                  </span>
                  <span className="text-[9px] text-blue-400 font-semibold font-mono">
                    {isArabic ? 'أكتوبر & زايد' : 'Oct & Zayed'}
                  </span>
                </div>
              </div>

              {/* Legend with interactive click */}
              <div className="w-full flex items-center justify-center gap-6 pt-2 border-t border-border text-xs">
                <button
                  onClick={() => onFilterArea && onFilterArea('6 October')}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <span className="w-3 h-3 rounded-md bg-blue-500 shadow-sm shadow-blue-500/50" />
                  <span className="font-semibold text-text-muted group-hover:text-blue-400 transition">
                    {isArabic ? '6 أكتوبر' : '6 October'}:
                  </span>
                  <strong className="font-mono text-white">
                    {metricMode === 'volume' ? `${stats.oct.volumePct}%` : `${stats.oct.unitsPct}%`}
                  </strong>
                </button>

                <button
                  onClick={() => onFilterArea && onFilterArea('Sheikh Zayed')}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <span className="font-semibold text-text-muted group-hover:text-emerald-400 transition">
                    {isArabic ? 'الشيخ زايد' : 'Sheikh Zayed'}:
                  </span>
                  <strong className="font-mono text-white">
                    {metricMode === 'volume' ? `${stats.zayed.volumePct}%` : `${stats.zayed.unitsPct}%`}
                  </strong>
                </button>
              </div>
            </div>

            {/* Regional Comparison Cards (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Region 1: 6 October Card */}
              <div className={`p-4 rounded-2xl border transition duration-150 space-y-3 relative overflow-hidden ${
                activeAreaFilter?.toLowerCase().includes('october') || activeAreaFilter?.includes('أكتوبر')
                  ? 'border-blue-500 bg-blue-950/20 ring-1 ring-blue-500/30'
                  : isDark ? 'bg-surface border-border hover:border-border' : 'bg-white border-border'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <h4 className="font-black text-sm text-white">
                      {isArabic ? 'منطقة 6 أكتوبر' : '6th of October'}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                    {stats.oct.unitsPct}% {isArabic ? 'من الوحدات' : 'of units'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-text-muted">{isArabic ? 'حجم الصفقات المتوقع:' : 'Expected Deal Volume:'}</span>
                    <strong className="font-mono text-sm text-white font-black">
                      {(stats.oct.volume / 1000000).toFixed(2)}M EGP
                    </strong>
                  </div>

                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-text-muted">{isArabic ? 'متوسط سعر الوحدة:' : 'Avg Unit Price:'}</span>
                    <strong className="font-mono text-accent font-bold">
                      {(stats.oct.avgPrice / 1000000).toFixed(2)}M EGP
                    </strong>
                  </div>

                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-text-muted">{isArabic ? 'العمولات المتوقعة (2.5%):' : 'Expected Commission:'}</span>
                    <strong className="font-mono text-emerald-400 font-bold">
                      {(stats.oct.commission / 1000).toFixed(1)}k EGP
                    </strong>
                  </div>
                </div>

                {/* Progress Share Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-text-muted font-mono">
                    <span>{isArabic ? 'حصة السيولة المتوقعة' : 'Pipeline Liquidity Share'}</span>
                    <span className="text-blue-400 font-bold">{stats.oct.volumePct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-raised overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.oct.volumePct}%` }} />
                  </div>
                </div>

                {/* Filter Quick Action */}
                <button
                  onClick={() => onFilterArea && onFilterArea('6 October')}
                  className="w-full mt-2 py-1.5 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Filter className="w-3 h-3" />
                  <span>{isArabic ? 'تصفية وحدات 6 أكتوبر' : 'Filter October Units'}</span>
                </button>
              </div>

              {/* Region 2: Sheikh Zayed Card */}
              <div className={`p-4 rounded-2xl border transition duration-150 space-y-3 relative overflow-hidden ${
                activeAreaFilter?.toLowerCase().includes('zayed') || activeAreaFilter?.includes('زايد')
                  ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                  : isDark ? 'bg-surface border-border hover:border-border' : 'bg-white border-border'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h4 className="font-black text-sm text-white">
                      {isArabic ? 'مدينة الشيخ زايد' : 'Sheikh Zayed City'}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {stats.zayed.unitsPct}% {isArabic ? 'من الوحدات' : 'of units'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-text-muted">{isArabic ? 'حجم الصفقات المتوقع:' : 'Expected Deal Volume:'}</span>
                    <strong className="font-mono text-sm text-white font-black">
                      {(stats.zayed.volume / 1000000).toFixed(2)}M EGP
                    </strong>
                  </div>

                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-text-muted">{isArabic ? 'متوسط سعر الوحدة:' : 'Avg Unit Price:'}</span>
                    <strong className="font-mono text-accent font-bold">
                      {(stats.zayed.avgPrice / 1000000).toFixed(2)}M EGP
                    </strong>
                  </div>

                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-text-muted">{isArabic ? 'العمولات المتوقعة (2.5%):' : 'Expected Commission:'}</span>
                    <strong className="font-mono text-emerald-400 font-bold">
                      {(stats.zayed.commission / 1000).toFixed(1)}k EGP
                    </strong>
                  </div>
                </div>

                {/* Progress Share Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-text-muted font-mono">
                    <span>{isArabic ? 'حصة السيولة المتوقعة' : 'Pipeline Liquidity Share'}</span>
                    <span className="text-emerald-400 font-bold">{stats.zayed.volumePct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-raised overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.zayed.volumePct}%` }} />
                  </div>
                </div>

                {/* Filter Quick Action */}
                <button
                  onClick={() => onFilterArea && onFilterArea('Sheikh Zayed')}
                  className="w-full mt-2 py-1.5 px-3 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Filter className="w-3 h-3" />
                  <span>{isArabic ? 'تصفية وحدات الشيخ زايد' : 'Filter Zayed Units'}</span>
                </button>
              </div>

            </div>
          </div>

          {/* Strategic Insight Ribbon on Expected Pipeline Impact */}
          <div className={`p-3 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            isDark ? 'bg-gradient-to-r from-blue-950/40 via-surface to-emerald-950/40 border-border text-text-muted' : 'bg-blue-50/60 border-blue-200 text-text'
          }`}>
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-accent text-accent border border-accent shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <strong className="text-white block font-bold">
                  {isArabic ? 'تحليل تأثير توزيع المناطق على حجم الصفقات المتوقعة:' : 'Strategic Regional Pipeline Impact:'}
                </strong>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {isArabic 
                    ? `تتميز مدينة الشيخ زايد بمتوسط سعر صفقة أعلى بـ ${stats.oct.avgPrice > 0 ? Math.round(((stats.zayed.avgPrice - stats.oct.avgPrice) / stats.oct.avgPrice) * 100) : 0}% مما يرفع العائد الرأسمالي، في حين تقدم 6 أكتوبر كثافة صفقات أعلى (${stats.oct.units} وحدة) واستقراراً في دوران السيولة.`
                    : `Sheikh Zayed provides higher ticket deal sizes (+${stats.oct.avgPrice > 0 ? Math.round(((stats.zayed.avgPrice - stats.oct.avgPrice) / stats.oct.avgPrice) * 100) : 0}% avg price) driving maximum commission yield, while 6 October guarantees operational deal velocity with ${stats.oct.units} units.`}
                </p>
              </div>
            </div>

            {/* Clear Filter if active */}
            {activeAreaFilter !== 'all' && (
              <button
                onClick={() => onFilterArea && onFilterArea('all')}
                className="px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-raised text-white font-semibold shrink-0 cursor-pointer text-xs"
              >
                {isArabic ? 'إلغاء التصفية الجغرافية' : 'Show All Areas'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
