import { formatNumber } from '../i18n/format';
import React, { useState, useMemo } from 'react';
import {
  X,
  Building2,
  TrendingUp,
  BarChart3,
  Layers,
  Sparkles,
  FileText,
  Printer,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Unit } from '../types';
import { printCleanElement } from '../services/pdfExportService';

interface CompoundPriceDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  initialCompound?: string;
  isArabic: boolean;
  theme?: 'dark' | 'light';
  onSelectUnit?: (unit: Unit) => void;
  onExportQuotation?: (unit: Unit) => void;
}

export const CompoundPriceDistributionModal: React.FC<CompoundPriceDistributionModalProps> = ({
  isOpen,
  onClose,
  units,
  initialCompound,
  isArabic,
  theme = 'dark',
  onSelectUnit,
  onExportQuotation
}) => {
  const isDark = theme === 'dark';

  // Get all unique compounds with counts
  const availableCompounds = useMemo(() => {
    const compoundMap: Record<string, number> = {};
    units.forEach(u => {
      if (u.compound) {
        compoundMap[u.compound] = (compoundMap[u.compound] || 0) + 1;
      }
    });
    return Object.entries(compoundMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [units]);

  // Selected compound state
  const [selectedCompound, setSelectedCompound] = useState<string>(() => {
    if (initialCompound && initialCompound !== '') return initialCompound;
    return availableCompounds[0]?.name || 'All';
  });

  // Keep in sync when initialCompound changes externally
  React.useEffect(() => {
    if (initialCompound) {
      setSelectedCompound(initialCompound);
    }
  }, [initialCompound]);

  // Active sub-tab inside analysis
  const [activeChartTab, setActiveChartTab] = useState<'distribution' | 'unitTypes' | 'pricePerMeter'>('distribution');

  // Filter units for selected compound
  const targetUnits = useMemo(() => {
    if (!selectedCompound || selectedCompound === 'All') {
      return units;
    }
    return units.filter(u => u.compound.toLowerCase() === selectedCompound.toLowerCase());
  }, [units, selectedCompound]);

  // Comprehensive market assessment calculations for the compound
  const marketStats = useMemo(() => {
    if (targetUnits.length === 0) {
      return {
        count: 0,
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        medianPrice: 0,
        priceSpread: 0,
        avgPricePerMeter: 0,
        minPricePerMeter: 0,
        maxPricePerMeter: 0,
        availableCount: 0,
        reservedCount: 0,
        soldCount: 0,
        marketAbsorptionRate: 0,
        marketAssessmentScore: 'A+',
        marketStatusText: isArabic ? 'طلب مرتفع وسيولة نشطة' : 'High Demand & Strong Liquidity',
        premiumVsAreaAvg: 0
      };
    }

    const prices = targetUnits.map(u => Number(u.price) || 0).filter(p => p > 0).sort((a, b) => a - b);
    const minPrice = prices[0] || 0;
    const maxPrice = prices[prices.length - 1] || 0;
    const priceSpread = maxPrice - minPrice;
    const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
    
    // Median price
    const midIndex = Math.floor(prices.length / 2);
    const medianPrice = prices.length % 2 !== 0 
      ? prices[midIndex] 
      : Math.round((prices[midIndex - 1] + prices[midIndex]) / 2);

    // Price per square meter metrics
    const pricesPerMeter = targetUnits
      .map(u => {
        const p = Number(u.price) || 0;
        const s = Number(u.size) || 0;
        return s > 0 && p > 0 ? Math.round(p / s) : 0;
      })
      .filter(pm => pm > 0)
      .sort((a, b) => a - b);

    const avgPricePerMeter = pricesPerMeter.length > 0 
      ? Math.round(pricesPerMeter.reduce((sum, pm) => sum + pm, 0) / pricesPerMeter.length) 
      : 0;
    const minPricePerMeter = pricesPerMeter[0] || 0;
    const maxPricePerMeter = pricesPerMeter[pricesPerMeter.length - 1] || 0;

    // Status breakdown
    let availableCount = 0;
    let reservedCount = 0;
    let soldCount = 0;
    targetUnits.forEach(u => {
      const s = (u.status || '').toLowerCase();
      if (s.includes('sold') || s.includes('مباع')) soldCount++;
      else if (s.includes('reserv') || s.includes('حجز')) reservedCount++;
      else availableCount++;
    });

    const marketAbsorptionRate = targetUnits.length > 0 
      ? Math.round(((reservedCount + soldCount) / targetUnits.length) * 100) 
      : 0;

    // Overall portfolio benchmark average price per meter
    const allPricesPerMeter = units
      .map(u => {
        const p = Number(u.price) || 0;
        const s = Number(u.size) || 0;
        return s > 0 && p > 0 ? Math.round(p / s) : 0;
      })
      .filter(pm => pm > 0);
    const overallAvgMeterPrice = allPricesPerMeter.length > 0 
      ? allPricesPerMeter.reduce((sum, pm) => sum + pm, 0) / allPricesPerMeter.length 
      : 35000;

    const premiumVsAreaAvg = overallAvgMeterPrice > 0 
      ? Math.round(((avgPricePerMeter - overallAvgMeterPrice) / overallAvgMeterPrice) * 100)
      : 0;

    // Evaluation text based on price/m² and absorption
    let marketAssessmentScore = 'A+';
    let marketStatusText = isArabic ? 'مجمع سكني فاخر عالي الطلب' : 'Prime Luxury High Demand';
    if (avgPricePerMeter > 45000) {
      marketAssessmentScore = 'AAA';
      marketStatusText = isArabic ? 'نخبة مجمعات غرب القاهرة (Ultra Luxury)' : 'Ultra Luxury Tier';
    } else if (premiumVsAreaAvg < -5) {
      marketAssessmentScore = 'A';
      marketStatusText = isArabic ? 'قيمة استثمارية استثنائية (فرصة شراء)' : 'High Investment Value / Opportunity';
    } else {
      marketAssessmentScore = 'A+';
      marketStatusText = isArabic ? 'سوق متوازن ومستقر سعرياً' : 'Balanced Stable Market';
    }

    return {
      count: targetUnits.length,
      minPrice,
      maxPrice,
      avgPrice,
      medianPrice,
      priceSpread,
      avgPricePerMeter,
      minPricePerMeter,
      maxPricePerMeter,
      availableCount,
      reservedCount,
      soldCount,
      marketAbsorptionRate,
      marketAssessmentScore,
      marketStatusText,
      premiumVsAreaAvg
    };
  }, [targetUnits, units, isArabic]);

  // Chart 1: Dynamic Price Brackets (Histogram)
  const priceBracketsData = useMemo(() => {
    if (targetUnits.length === 0) return [];

    const buckets: {
      rangeLabel: string;
      min: number;
      max: number;
      unitsCount: number;
      units: Unit[];
    }[] = [];

    // Base tiers for October / Zayed market
    const tiers = [
      { label: '< 4M', min: 0, max: 4000000 },
      { label: '4M - 6M', min: 4000000, max: 6000000 },
      { label: '6M - 8M', min: 6000000, max: 8000000 },
      { label: '8M - 11M', min: 8000000, max: 11000000 },
      { label: '11M - 15M', min: 11000000, max: 15000000 },
      { label: '> 15M', min: 15000000, max: 999999999 }
    ];

    tiers.forEach(tier => {
      const inTier = targetUnits.filter(u => {
        const p = Number(u.price) || 0;
        return p >= tier.min && p < tier.max;
      });

      buckets.push({
        rangeLabel: tier.label,
        min: tier.min,
        max: tier.max,
        unitsCount: inTier.length,
        units: inTier
      });
    });

    // Remove empty outer brackets if none match
    return buckets;
  }, [targetUnits, marketStats]);

  // Chart 2: Price Range by Unit Type in the Compound (Min, Avg, Max)
  const priceByTypeData = useMemo(() => {
    if (targetUnits.length === 0) return [];

    const typeMap: Record<string, number[]> = {};
    targetUnits.forEach(u => {
      const type = u.unitType || u.propertyType || (isArabic ? 'وحدة سكنية' : 'Apartment');
      if (!typeMap[type]) typeMap[type] = [];
      const p = Number(u.price) || 0;
      if (p > 0) typeMap[type].push(p);
    });

    return Object.entries(typeMap).map(([type, prices]) => {
      prices.sort((a, b) => a - b);
      const min = prices[0];
      const max = prices[prices.length - 1];
      const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
      return {
        unitType: type,
        minPrice: Math.round(min / 1000000 * 10) / 10, // in Millions
        avgPrice: Math.round(avg / 1000000 * 10) / 10,
        maxPrice: Math.round(max / 1000000 * 10) / 10,
        count: prices.length,
        rawMin: min,
        rawAvg: avg,
        rawMax: max
      };
    }).sort((a, b) => b.count - a.count);
  }, [targetUnits, isArabic]);

  // Chart 3: Price vs Size Density
  const priceVsSizeData = useMemo(() => {
    return targetUnits
      .map(u => {
        const size = Number(u.size) || 0;
        const price = Number(u.price) || 0;
        const meterPrice = size > 0 && price > 0 ? Math.round(price / size) : 0;
        return {
          id: u.id,
          size,
          priceMillions: Math.round(price / 100000) / 10,
          meterPrice,
          compound: u.compound,
          unitType: u.unitType
        };
      })
      .filter(item => item.size > 0 && item.meterPrice > 0)
      .sort((a, b) => a.size - b.size);
  }, [targetUnits]);

  const handlePrint = () => {
    const printableElement = document.getElementById('printable-compound-analysis');
    if (!printableElement) {
      window.print();
      return;
    }
    const title = isArabic 
      ? `تحليل تقييم وتوزيع أسعار - ${selectedCompound}` 
      : `Price Distribution & Market Valuation - ${selectedCompound}`;
    printCleanElement(printableElement, title, isArabic);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-surface backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-5xl my-auto rounded-3xl border shadow-2xl flex flex-col max-h-[94vh] overflow-hidden ${
          isDark ? 'bg-surface border-border text-text' : 'bg-white border-border text-text'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-start justify-between gap-3 ${
          isDark ? 'bg-surface border-border' : 'bg-surface border-border'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-accent text-white shadow-lg shadow-blue-500/25">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold">
                  {isArabic ? 'تحليل وتوزيع أسعار الوحدات في الكمبوند' : 'Compound Price Distribution & Market Assessment'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-accent text-accent border border-accent">
                  {marketStats.marketAssessmentScore}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {isArabic 
                  ? 'رسم بياني لنطاق الأسعار، وسعر المتر، وتقييم شامل للقيمة السوقية العقارية' 
                  : 'Interactive price brackets, price per square meter, and real estate market valuation'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-border hover:bg-surface-raised text-text-muted text-xs font-semibold transition cursor-pointer"
              title={isArabic ? 'طباعة تقرير التحليل' : 'Print Market Assessment'}
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Compound Selector Bar & Switcher */}
        <div className={`px-4 sm:px-6 py-3 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs ${
          isDark ? 'bg-surface border-border' : 'bg-surface-raised border-border'
        }`}>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-accent shrink-0" />
            <span className="font-semibold text-text-muted shrink-0">
              {isArabic ? 'الكمبوند المختار للتقييم:' : 'Selected Compound:'}
            </span>
            <select
              value={selectedCompound}
              onChange={(e) => setSelectedCompound(e.target.value)}
              className="bg-surface border border-border text-accent font-bold rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer max-w-[280px]"
            >
              <option value="All">{isArabic ? '📊 جميع الكمبوندات (نظرة عامة مجمعة)' : 'All Compounds (Portfolio Overview)'}</option>
              {availableCompounds.map((c, i) => (
                <option key={i} value={c.name}>
                  {c.name} ({c.count} {isArabic ? 'وحدات' : 'units'})
                </option>
              ))}
            </select>
          </div>

          {/* Sub-tab Switcher for Charts */}
          <div className="flex items-center rounded-lg border border-border bg-surface p-0.5">
            <button
              onClick={() => setActiveChartTab('distribution')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeChartTab === 'distribution' ? 'bg-blue-600 text-white shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              {isArabic ? 'نطاق الأسعار' : 'Price Brackets'}
            </button>
            <button
              onClick={() => setActiveChartTab('unitTypes')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeChartTab === 'unitTypes' ? 'bg-blue-600 text-white shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              {isArabic ? 'الأسعار حسب النوع' : 'Price by Type'}
            </button>
            <button
              onClick={() => setActiveChartTab('pricePerMeter')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeChartTab === 'pricePerMeter' ? 'bg-blue-600 text-white shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              {isArabic ? 'السعر مقابل المساحة' : 'Price vs Area'}
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div id="printable-compound-analysis" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Key Metric Highlights (Price Range, Average, Median, Price/m²) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Price Range Window */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-surface via-surface to-surface border border-border shadow-md">
              <span className="text-[11px] font-semibold text-text-muted block">
                {isArabic ? 'نطاق أسعار الوحدات (المدى السعري)' : 'Unit Price Range Spectrum'}
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-white mt-1">
                {marketStats.minPrice > 0 ? (marketStats.minPrice / 1000000).toFixed(1) : 0}M
                <span className="text-accent mx-1.5">↔</span>
                {marketStats.maxPrice > 0 ? (marketStats.maxPrice / 1000000).toFixed(1) : 0}M
                <span className="text-xs font-normal text-text-muted ml-1">ج.م</span>
              </div>
              <div className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                <span>{isArabic ? 'الفارق السعري:' : 'Spread:'}</span>
                <span className="font-semibold text-accent">
                  {((marketStats.priceSpread || 0) / 1000000).toFixed(1)} مليون ج.م
                </span>
              </div>
            </div>

            {/* 2. Average & Median Price */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-surface via-surface to-surface border border-border shadow-md">
              <span className="text-[11px] font-semibold text-text-muted block">
                {isArabic ? 'متوسط وسيط الأسعار' : 'Average & Median Price'}
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-1">
                {formatNumber(marketStats.avgPrice)}
                <span className="text-xs font-normal text-text-muted ml-1">ج.م</span>
              </div>
              <div className="text-[11px] text-text-muted mt-1 flex items-center justify-between">
                <span>{isArabic ? 'الوسيط (Median):' : 'Median:'}</span>
                <strong className="text-text">
                  {formatNumber(marketStats.medianPrice)} ج.م
                </strong>
              </div>
            </div>

            {/* 3. Average Price per m² */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-surface via-surface to-surface border border-border shadow-md">
              <span className="text-[11px] font-semibold text-text-muted block">
                {isArabic ? 'متوسط سعر المتر المربع' : 'Avg Price per m²'}
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-blue-400 mt-1">
                {formatNumber(marketStats.avgPricePerMeter)}
                <span className="text-xs font-normal text-text-muted ml-1">ج.م/م²</span>
              </div>
              <div className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                <span>{isArabic ? 'مقارنة بمتوسط المنطقة:' : 'vs Region Avg:'}</span>
                <span className={`font-semibold ${marketStats.premiumVsAreaAvg >= 0 ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {marketStats.premiumVsAreaAvg >= 0 ? `+${marketStats.premiumVsAreaAvg}%` : `${marketStats.premiumVsAreaAvg}%`}
                </span>
              </div>
            </div>

            {/* 4. Market Assessment Rating */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-accent via-surface to-surface border border-accent shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-accent">
                  {isArabic ? 'تقييم السوق العقاري' : 'Market Valuation'}
                </span>
                <ShieldCheck className="w-4 h-4 text-accent" />
              </div>
              <div className="text-base font-bold text-white mt-1 truncate">
                {marketStats.marketStatusText}
              </div>
              <div className="text-[11px] text-text-muted mt-1 flex items-center gap-2">
                <span>{isArabic ? 'المعروض:' : 'Supply:'} <strong>{marketStats.count}</strong></span>
                <span>•</span>
                <span className="text-emerald-400">{marketStats.availableCount} {isArabic ? 'متاح' : 'avail'}</span>
                <span>•</span>
                <span className="text-blue-400">{marketStats.soldCount} {isArabic ? 'مباع' : 'sold'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>
                    {activeChartTab === 'distribution' && (isArabic ? 'توزيع الوحدات على النطاقات السعرية (Histogram)' : 'Unit Distribution Across Price Brackets')}
                    {activeChartTab === 'unitTypes' && (isArabic ? 'نطاق الأسعار (أدنى، متوسط، أعلى) حسب تصنيف الوحدة' : 'Price Range by Unit Category (Min, Avg, Max)')}
                    {activeChartTab === 'pricePerMeter' && (isArabic ? 'تطور سعر المتر المربع بالنسبة لمساحة الوحدة (م²)' : 'Price per m² vs Unit Space (m²)')}
                  </span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {isArabic 
                    ? `تحليل إحصائي دقيق لمخزون وحدات ${selectedCompound === 'All' ? 'كافة الكمبوندات' : selectedCompound}` 
                    : `Statistical inventory analysis for ${selectedCompound === 'All' ? 'All Compounds' : selectedCompound}`}
                </p>
              </div>

              <div className="text-xs text-text-muted flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>{isArabic ? 'عدد الوحدات' : 'Units Count'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                  <span>{isArabic ? 'متوسط السعر' : 'Avg Price'}</span>
                </div>
              </div>
            </div>

            {/* TAB 1: PRICE BRACKETS HISTOGRAM */}
            {activeChartTab === 'distribution' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceBracketsData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis 
                      dataKey="rangeLabel" 
                      stroke="var(--color-text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="var(--color-text-muted)" 
                      fontSize={11} 
                      allowDecimals={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percent = marketStats.count > 0 
                            ? Math.round((data.unitsCount / marketStats.count) * 100) 
                            : 0;
                          return (
                            <div className="bg-surface border border-border p-3 rounded-xl shadow-xl text-xs space-y-1.5">
                              <div className="font-bold text-accent text-sm">{data.rangeLabel}</div>
                              <div className="text-text">
                                {isArabic ? 'عدد الوحدات في هذا النطاق:' : 'Units in bracket:'}{' '}
                                <strong className="text-white text-sm">{data.unitsCount}</strong> ({percent}%)
                              </div>
                              {data.units.length > 0 && (
                                <div className="text-[10px] text-text-muted pt-1 border-t border-border">
                                  <span>{isArabic ? 'أكواد الوحدات: ' : 'Unit IDs: '}</span>
                                  <span className="font-mono text-blue-300">
                                    {data.units.slice(0, 4).map((u: Unit) => u.id).join(', ')}
                                    {data.units.length > 4 ? ` +${data.units.length - 4}` : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="unitsCount" radius={[8, 8, 0, 0]}>
                      {priceBracketsData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.unitsCount > 0 ? (index % 2 === 0 ? 'rgb(59, 130, 246)' : 'rgb(99, 102, 241)') : 'var(--color-border)'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* TAB 2: PRICE RANGE BY UNIT TYPE */}
            {activeChartTab === 'unitTypes' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceByTypeData} margin={{ top: 15, right: 15, left: -5, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis 
                      dataKey="unitType" 
                      stroke="var(--color-text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="var(--color-text-muted)" 
                      fontSize={11} 
                      unit="M"
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-surface border border-border p-3 rounded-xl shadow-xl text-xs space-y-1.5">
                              <div className="font-bold text-white text-sm">{d.unitType}</div>
                              <div className="text-[11px] text-text-muted">
                                {isArabic ? `إجمالي الوحدات: ${d.count}` : `Units count: ${d.count}`}
                              </div>
                              <div className="space-y-1 pt-1 border-t border-border">
                                <div className="text-text-muted">
                                  {isArabic ? 'أدنى سعر:' : 'Min Price:'} <strong className="text-text">{formatNumber(d.rawMin)} ج.م</strong>
                                </div>
                                <div className="text-accent font-bold">
                                  {isArabic ? 'متوسط السعر:' : 'Avg Price:'} <strong>{formatNumber(d.rawAvg)} ج.م</strong>
                                </div>
                                <div className="text-text-muted">
                                  {isArabic ? 'أعلى سعر:' : 'Max Price:'} <strong className="text-text">{formatNumber(d.rawMax)} ج.م</strong>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: 'var(--color-text-muted)' }} />
                    <Bar name={isArabic ? 'أدنى سعر (مليون ج.م)' : 'Min Price (M)'} dataKey="minPrice" fill="rgb(14, 165, 233)" radius={[4, 4, 0, 0]} />
                    <Bar name={isArabic ? 'متوسط السعر (مليون ج.م)' : 'Avg Price (M)'} dataKey="avgPrice" fill="rgb(245, 158, 11)" radius={[4, 4, 0, 0]} />
                    <Bar name={isArabic ? 'أعلى سعر (مليون ج.م)' : 'Max Price (M)'} dataKey="maxPrice" fill="rgb(139, 92, 246)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* TAB 3: PRICE VS SIZE / PRICE PER METER */}
            {activeChartTab === 'pricePerMeter' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceVsSizeData} margin={{ top: 15, right: 15, left: 10, bottom: 25 }}>
                    <defs>
                      <linearGradient id="colorMeter" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(59, 130, 246)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis 
                      dataKey="size" 
                      stroke="var(--color-text-muted)" 
                      fontSize={11} 
                      unit="m²"
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="var(--color-text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-surface border border-border p-3 rounded-xl shadow-xl text-xs space-y-1">
                              <div className="font-mono font-bold text-accent">{d.id} ({d.unitType})</div>
                              <div>{isArabic ? 'المساحة:' : 'Area:'} <strong className="text-white">{d.size} م²</strong></div>
                              <div>{isArabic ? 'السعر الإجمالي:' : 'Total Price:'} <strong className="text-emerald-400">{d.priceMillions} مليون ج.م</strong></div>
                              <div className="font-bold text-blue-400">
                                {isArabic ? 'سعر المتر:' : 'Price/m²:'} {formatNumber(d.meterPrice)} ج.م/م²
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="meterPrice" 
                      name={isArabic ? 'سعر المتر (ج.م/م²)' : 'Price per m²'} 
                      stroke="rgb(59, 130, 246)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorMeter)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Units Inventory in Selected Compound with Valuation Badges & Export Quotation Button */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" />
                  <span>
                    {isArabic ? `وحدات كمبوند ${selectedCompound === 'All' ? 'جميع المشاريع' : selectedCompound} وتقييمها السعري` : `Units in ${selectedCompound} & Market Valuation`}
                  </span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {isArabic 
                    ? 'قائمة الوحدات مع مقارنة سعر المتر بمتوسط الكمبوند، وإمكانية تصدير عرض سعر رسمي PDF لكل وحدة مباشرة' 
                    : 'List of units with price comparison to compound average, and 1-click official quotation export'}
                </p>
              </div>
              <span className="text-xs text-text-muted">
                {targetUnits.length} {isArabic ? 'وحدات' : 'units'}
              </span>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-surface">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-xs text-text-muted text-left border-collapse">
                  <thead className="bg-surface sticky top-0 text-[11px] uppercase tracking-wider text-text-muted border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3">Unit ID</th>
                      <th className="py-2.5 px-3">{isArabic ? 'النوع' : 'Type'}</th>
                      <th className="py-2.5 px-3">{isArabic ? 'المساحة' : 'Size'}</th>
                      <th className="py-2.5 px-3">{isArabic ? 'السعر المطلوب' : 'Asking Price'}</th>
                      <th className="py-2.5 px-3">{isArabic ? 'سعر المتر' : 'Price/m²'}</th>
                      <th className="py-2.5 px-3">{isArabic ? 'التقييم السعري' : 'Valuation'}</th>
                      <th className="py-2.5 px-3">{isArabic ? 'الحالة' : 'Status'}</th>
                      <th className="py-2.5 px-3 text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {targetUnits.map((u) => {
                      const price = Number(u.price) || 0;
                      const size = Number(u.size) || 0;
                      const meterPrice = size > 0 && price > 0 ? Math.round(price / size) : 0;
                      const diffFromAvg = marketStats.avgPricePerMeter > 0 && meterPrice > 0
                        ? Math.round(((meterPrice - marketStats.avgPricePerMeter) / marketStats.avgPricePerMeter) * 100)
                        : 0;

                      return (
                        <tr key={u.id} className="hover:bg-surface transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-accent">
                            {u.id}
                          </td>
                          <td className="py-2.5 px-3 text-text">
                            {u.unitType || u.propertyType}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {u.size} م²
                          </td>
                          <td className="py-2.5 px-3 font-bold text-white">
                            {formatNumber(price)} {u.currency}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-text-muted">
                            {meterPrice > 0 ? `${formatNumber(meterPrice)} ج.م` : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            {diffFromAvg < -5 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <span>🔥</span>
                                <span>{isArabic ? `أقل بـ ${Math.abs(diffFromAvg)}% (فرصة)` : `${Math.abs(diffFromAvg)}% below avg`}</span>
                              </span>
                            ) : diffFromAvg > 5 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent text-accent border border-accent">
                                <span>{isArabic ? `أعلى بـ ${diffFromAvg}% (فاخر)` : `+${diffFromAvg}% premium`}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-text-muted bg-surface-raised">
                                <span>{isArabic ? 'متطابق مع المتوسط' : 'At market avg'}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              u.status.toLowerCase().includes('avail')
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : u.status.toLowerCase().includes('reserv')
                                ? 'bg-accent text-accent'
                                : 'bg-blue-500/15 text-blue-400'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* 1-Click Official Quotation Export Button */}
                              {onExportQuotation && (
                                <button
                                  onClick={() => {
                                    onExportQuotation(u);
                                  }}
                                  className="px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm shadow-blue-500/20"
                                  title={isArabic ? 'تصدير عرض سعر رسمي PDF لهذا العميل' : 'Export official quotation PDF'}
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>{isArabic ? 'عرض سعر' : 'Quotation'}</span>
                                </button>
                              )}

                              {/* View Details Button */}
                              {onSelectUnit && (
                                <button
                                  onClick={() => {
                                    onSelectUnit(u);
                                    onClose();
                                  }}
                                  className="p-1 rounded-md bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
                                  title={isArabic ? 'معاينة تفاصيل الوحدة' : 'View Unit Details'}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Summary */}
        <div className={`p-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          isDark ? 'bg-surface border-border text-text-muted' : 'bg-surface border-border text-text-muted'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <span>
              {isArabic 
                ? `الخلاصة: نطاق أسعار ${selectedCompound === 'All' ? 'المخزون' : selectedCompound} يتراوح بين ${(marketStats.minPrice / 1000000).toFixed(1)} إلى ${(marketStats.maxPrice / 1000000).toFixed(1)} مليون ج.م، بمتوسط سعر متر ${formatNumber(marketStats.avgPricePerMeter)} ج.م/م²`
                : `Summary: ${selectedCompound} price band spans ${(marketStats.minPrice / 1000000).toFixed(1)}M to ${(marketStats.maxPrice / 1000000).toFixed(1)}M EGP with an average of ${formatNumber(marketStats.avgPricePerMeter)} EGP/m²`}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-raised hover:bg-surface-raised text-text font-semibold transition cursor-pointer self-end sm:self-auto"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompoundPriceDistributionModal;
