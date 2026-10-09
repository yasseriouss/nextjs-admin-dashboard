import { formatNumber } from '../i18n/format';
import React, { useState, useMemo } from 'react';
import { Unit } from '../types';
import { 
  X, 
  ArrowRightLeft, 
  Check, 
  Building2, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  DollarSign, 
  Calendar, 
  UserCheck, 
  Layers, 
  FileText, 
  Eye, 
  TrendingDown, 
  Sparkles, 
  Printer, 
  SlidersHorizontal,
  Flame,
  Award,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface UnitComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  onRemoveUnit: (unitId: string) => void;
  onSelectUnitForDetails: (unit: Unit) => void;
  onExportQuotation?: (unit: Unit) => void;
  isArabic: boolean;
  theme?: 'dark' | 'light';
  allUnits?: Unit[];
  onAddUnitToCompare?: (unit: Unit) => void;
}

export const UnitComparisonModal: React.FC<UnitComparisonModalProps> = ({
  isOpen,
  onClose,
  units,
  onRemoveUnit,
  onSelectUnitForDetails,
  onExportQuotation,
  isArabic,
  allUnits = [],
  onAddUnitToCompare
}) => {
  const [highlightDifferences, setHighlightDifferences] = useState(true);
  const [filterSection, setFilterSection] = useState<'all' | 'financial' | 'specs' | 'location'>('all');

  if (!isOpen) return null;

  // Calculate Price per m² helper
  const getPricePerMeter = (unit: Unit): number => {
    const p = Number(unit.price) || 0;
    const s = Number(unit.size) || 0;
    return s > 0 && p > 0 ? Math.round(p / s) : 0;
  };

  // Compare metrics insights
  const metricsInsights = useMemo(() => {
    if (units.length === 0) return null;

    let lowestPriceUnit = units[0];
    let largestSizeUnit = units[0];
    let lowestMeterPriceUnit = units[0];
    let lowestMeterPrice = getPricePerMeter(units[0]);

    units.forEach((u) => {
      const uPrice = Number(u.price) || 0;
      const lPrice = Number(lowestPriceUnit.price) || 0;
      if (uPrice > 0 && (lPrice === 0 || uPrice < lPrice)) {
        lowestPriceUnit = u;
      }

      const uSize = Number(u.size) || 0;
      const lSize = Number(largestSizeUnit.size) || 0;
      if (uSize > lSize) {
        largestSizeUnit = u;
      }

      const uMeterPrice = getPricePerMeter(u);
      if (uMeterPrice > 0 && (lowestMeterPrice === 0 || uMeterPrice < lowestMeterPrice)) {
        lowestMeterPrice = uMeterPrice;
        lowestMeterPriceUnit = u;
      }
    });

    return {
      lowestPriceUnit,
      largestSizeUnit,
      lowestMeterPriceUnit,
      lowestMeterPrice
    };
  }, [units]);

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('avail') || s.includes('متاح')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isArabic ? 'متاح للبيع' : 'Available'}</span>
        </span>
      );
    }
    if (s.includes('reserv') || s.includes('حجز') || s.includes('محجوز')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent text-accent border border-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span>{isArabic ? 'محجوز' : 'Reserved'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        <span>{isArabic ? 'تم البيع' : 'Sold'}</span>
      </span>
    );
  };

  // Helper to test if a row's values differ across units
  const checkValuesDiffer = (values: (string | number | undefined | null)[]): boolean => {
    if (values.length <= 1) return false;
    const first = String(values[0] ?? '').trim().toLowerCase();
    return values.some(v => String(v ?? '').trim().toLowerCase() !== first);
  };

  // Available units that can be added (up to 3)
  const candidateUnitsToAdd = useMemo(() => {
    if (units.length >= 3) return [];
    const currentIds = new Set(units.map(u => u.id));
    return allUnits.filter(u => !currentIds.has(u.id)).slice(0, 8);
  }, [units, allUnits]);

  // Comparison Rows Definition
  interface ComparisonRow {
    id: string;
    section: 'financial' | 'specs' | 'location';
    labelAr: string;
    labelEn: string;
    icon: React.ReactNode;
    getValue: (u: Unit) => {
      text: string;
      raw: string | number;
      highlightBadge?: string;
    };
  }

  const comparisonRows: ComparisonRow[] = [
    // 1. FINANCIAL & VALUATION
    {
      id: 'price',
      section: 'financial',
      labelAr: 'سعر الطلب الإجمالي',
      labelEn: 'Total Asking Price',
      icon: <DollarSign className="w-4 h-4 text-accent" />,
      getValue: (u) => {
        const isLowest = metricsInsights?.lowestPriceUnit.id === u.id && units.length > 1;
        return {
          text: `${formatNumber(u.price)} ${u.currency || 'EGP'}`,
          raw: u.price,
          highlightBadge: isLowest ? (isArabic ? 'أقل سعر إجمالي' : 'Lowest Price') : undefined
        };
      }
    },
    {
      id: 'pricePerMeter',
      section: 'financial',
      labelAr: 'سعر المتر المربع (EGP/m²)',
      labelEn: 'Price per Square Meter',
      icon: <TrendingDown className="w-4 h-4 text-emerald-400" />,
      getValue: (u) => {
        const ppm = getPricePerMeter(u);
        const isLowestPpm = metricsInsights?.lowestMeterPriceUnit.id === u.id && units.length > 1;
        return {
          text: ppm > 0 ? `${formatNumber(ppm)} ج.م / م²` : '-',
          raw: ppm,
          highlightBadge: isLowestPpm ? (isArabic ? '★ أفضل سعر للمتر' : '★ Best Value / m²') : undefined
        };
      }
    },
    {
      id: 'category',
      section: 'financial',
      labelAr: 'نوع المعاملة',
      labelEn: 'Offering Type',
      icon: <Award className="w-4 h-4 text-blue-400" />,
      getValue: (u) => ({
        text: u.category === 'rent' ? (isArabic ? 'إيجار' : 'For Rent') : (isArabic ? 'بيع وتمليك' : 'For Sale'),
        raw: u.category || 'sales'
      })
    },
    {
      id: 'status',
      section: 'financial',
      labelAr: 'حالة الوحدة الحالية',
      labelEn: 'Inventory Status',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      getValue: (u) => ({
        text: u.status,
        raw: u.status
      })
    },

    // 2. ARCHITECTURAL & SPACE SPECS
    {
      id: 'unitType',
      section: 'specs',
      labelAr: 'النوع ونموذج الوحدة',
      labelEn: 'Property & Unit Type',
      icon: <Building2 className="w-4 h-4 text-indigo-400" />,
      getValue: (u) => ({
        text: u.unitType || u.propertyType || '-',
        raw: u.unitType || u.propertyType || ''
      })
    },
    {
      id: 'size',
      section: 'specs',
      labelAr: 'المساحة المبنية الإجمالية',
      labelEn: 'Built-Up Area (m²)',
      icon: <Maximize2 className="w-4 h-4 text-blue-400" />,
      getValue: (u) => {
        const isLargest = metricsInsights?.largestSizeUnit.id === u.id && units.length > 1;
        return {
          text: u.size !== '-' ? `${u.size} م²` : '-',
          raw: u.size,
          highlightBadge: isLargest ? (isArabic ? 'أكبر مساحة' : 'Largest Area') : undefined
        };
      }
    },
    {
      id: 'beds',
      section: 'specs',
      labelAr: 'عدد غرف النوم',
      labelEn: 'Bedrooms',
      icon: <Bed className="w-4 h-4 text-accent" />,
      getValue: (u) => ({
        text: u.beds !== '-' ? `${u.beds} ${isArabic ? 'غرف نوم' : 'Bedrooms'}` : '-',
        raw: u.beds
      })
    },
    {
      id: 'baths',
      section: 'specs',
      labelAr: 'دورات المياه',
      labelEn: 'Bathrooms',
      icon: <Bath className="w-4 h-4 text-cyan-400" />,
      getValue: (u) => ({
        text: u.baths ? `${u.baths} ${isArabic ? 'حمامات' : 'Baths'}` : (isArabic ? 'غير محدد' : 'Not specified'),
        raw: u.baths || 0
      })
    },
    {
      id: 'floor',
      section: 'specs',
      labelAr: 'الدور / الطابق',
      labelEn: 'Floor Level',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      getValue: (u) => ({
        text: u.floor ? (isArabic ? `الدور ${u.floor}` : `Floor ${u.floor}`) : (isArabic ? 'الدور الأرضي / متكرر' : 'Ground / Typical'),
        raw: u.floor || ''
      })
    },
    {
      id: 'deliveryDate',
      section: 'specs',
      labelAr: 'موعد الاستلام',
      labelEn: 'Delivery Timeline',
      icon: <Calendar className="w-4 h-4 text-rose-400" />,
      getValue: (u) => {
        const d = u.deliveryDate || 'Ready';
        const isReady = d.toLowerCase().includes('ready') || d.toLowerCase().includes('فوري');
        return {
          text: isReady ? (isArabic ? 'استلام فوري (Ready to Move)' : 'Ready to Move') : d,
          raw: d,
          highlightBadge: isReady ? (isArabic ? 'جاهز للسكن فوراً' : 'Ready Now') : undefined
        };
      }
    },

    // 3. LOCATION & COMMUNITY
    {
      id: 'compound',
      section: 'location',
      labelAr: 'المشروع / الكمبوند',
      labelEn: 'Compound / Master Project',
      icon: <Building2 className="w-4 h-4 text-accent" />,
      getValue: (u) => ({
        text: u.compound,
        raw: u.compound
      })
    },
    {
      id: 'area',
      section: 'location',
      labelAr: 'المنطقة والمدينة',
      labelEn: 'Location & District',
      icon: <MapPin className="w-4 h-4 text-rose-400" />,
      getValue: (u) => ({
        text: u.area,
        raw: u.area
      })
    },
    {
      id: 'agent',
      section: 'location',
      labelAr: 'الوسيط المسؤول',
      labelEn: 'Assigned Broker',
      icon: <UserCheck className="w-4 h-4 text-emerald-400" />,
      getValue: (u) => ({
        text: u.agent || 'Ahmed Aly',
        raw: u.agent || 'Ahmed Aly'
      })
    },
    {
      id: 'notes',
      section: 'location',
      labelAr: 'ملاحظات وتشطيبات',
      labelEn: 'Finishing & Remarks',
      icon: <FileText className="w-4 h-4 text-text-muted" />,
      getValue: (u) => ({
        text: u.notes || (isArabic ? 'تشطيب الترا سوبر لوكس، إطلالة مفتوحة' : 'Prime view, standard luxury finishing'),
        raw: u.notes || ''
      })
    }
  ];

  // Filter rows by active section tab
  const displayedRows = comparisonRows.filter(r => filterSection === 'all' || r.section === filterSection);

  // Column width classes depending on count of units
  const gridColClass = units.length === 1 ? 'grid-cols-1' : units.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-surface backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-border rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isArabic ? 'مقارنة الوحدات العقارية جنباً إلى جنب' : 'Side-by-Side Property Units Comparison'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {units.length} / 3 {isArabic ? 'وحدات' : 'units'}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {isArabic 
                  ? 'مقارنة تحليلية تفصيلية للمواصفات المعمارية، الأسعار، سعر المتر، وحالة التوفر لتسهيل اتخاذ قرار الشراء' 
                  : 'Detailed breakdown of architectural specifications, asking prices, price/m², and availability status'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {/* Toggle Highlight Differences */}
            <button
              onClick={() => setHighlightDifferences(!highlightDifferences)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                highlightDifferences 
                  ? 'bg-accent border-accent text-accent shadow-sm shadow-accent/20' 
                  : 'bg-surface-raised border-border text-text-muted hover:text-text'
              }`}
              title={isArabic ? 'تمييز البنود والخصائص المختلفة بين الوحدات' : 'Highlight fields where values differ'}
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{isArabic ? 'تمييز الفروقات' : 'Highlight Differences'}</span>
            </button>

            {/* Print / Save View */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-raised border border-border text-text-muted text-xs font-semibold transition cursor-pointer"
              title={isArabic ? 'طباعة جدول المقارنة' : 'Print comparison sheet'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isArabic ? 'طباعة' : 'Print'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Filter Pills Bar */}
        <div className="px-5 py-2.5 bg-surface border-b border-border flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wider mr-1">
              {isArabic ? 'تصفية الأقسام:' : 'Sections:'}
            </span>
            {[
              { id: 'all', ar: 'كافة الخصائص', en: 'All Metrics' },
              { id: 'financial', ar: 'الأسعار والتقييم المالي', en: 'Pricing & Valuation' },
              { id: 'specs', ar: 'المواصفات والمساحات', en: 'Specs & Layout' },
              { id: 'location', ar: 'الموقع والكمبوند', en: 'Location & Community' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterSection(tab.id as 'all' | 'financial' | 'specs' | 'location')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  filterSection === tab.id
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                    : 'bg-surface-raised text-text-muted hover:text-text hover:bg-surface-raised'
                }`}
              >
                {isArabic ? tab.ar : tab.en}
              </button>
            ))}
          </div>

          {units.length < 3 && candidateUnitsToAdd.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-text-muted">
              <span className="text-[11px] text-text-muted">{isArabic ? '+ أضف وحدة للمقارنة:' : '+ Add Unit:'}</span>
              <div className="flex items-center gap-1">
                {candidateUnitsToAdd.slice(0, 3).map(cUnit => (
                  <button
                    key={cUnit.id}
                    onClick={() => onAddUnitToCompare && onAddUnitToCompare(cUnit)}
                    className="px-2 py-0.5 rounded bg-surface-raised hover:bg-blue-600/30 text-text-muted hover:text-blue-300 border border-border font-mono text-[10px] transition cursor-pointer"
                    title={`${cUnit.compound} - ${formatNumber(cUnit.price)} ${cUnit.currency}`}
                  >
                    +{cUnit.id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {units.length === 0 ? (
            <div className="py-16 text-center text-text-muted space-y-3">
              <Layers className="w-12 h-12 text-text-muted mx-auto" />
              <h4 className="text-base font-bold text-white">
                {isArabic ? 'لم يتم اختيار أي وحدة للمقارنة' : 'No units selected for comparison'}
              </h4>
              <p className="text-xs text-text-muted max-w-md mx-auto">
                {isArabic 
                  ? 'يرجى الرجوع لجدول الوحدات وتحديد وحدتين أو ثلاث وحدات عبر النقر على مربعات المقارنة.' 
                  : 'Please check the comparison box next to up to 3 units from the table to view their side-by-side breakdown.'}
              </p>
            </div>
          ) : (
            <>
              {/* Top Hero Cards: Units Summary */}
              <div className={`grid ${gridColClass} gap-4`}>
                {units.map((unit) => {
                  const ppm = getPricePerMeter(unit);
                  const isLowestPrice = metricsInsights?.lowestPriceUnit.id === unit.id && units.length > 1;
                  const isLowestMeter = metricsInsights?.lowestMeterPriceUnit.id === unit.id && units.length > 1;

                  return (
                    <div 
                      key={unit.id}
                      className="bg-surface border border-border hover:border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg relative group transition"
                    >
                      {/* Top Bar with Badges & Remove */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-extrabold text-accent bg-accent px-2.5 py-0.5 rounded-lg border border-accent">
                              {unit.id}
                            </span>
                            {getStatusBadge(unit.status)}
                          </div>

                          <button
                            onClick={() => onRemoveUnit(unit.id)}
                            className="p-1 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title={isArabic ? 'إزالة هذه الوحدة من المقارنة' : 'Remove from comparison'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Compound & Area */}
                        <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition truncate">
                          {unit.compound}
                        </h4>
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-text-muted shrink-0" />
                          <span className="truncate">{unit.area}</span>
                        </p>

                        {/* Price Hero */}
                        <div className="mt-3.5 p-3 rounded-xl bg-surface border border-border space-y-1">
                          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">
                            {isArabic ? 'سعر الطلب' : 'Asking Price'}
                          </span>
                          <div className="text-lg sm:text-xl font-extrabold text-white flex items-baseline gap-1.5">
                            <span>{formatNumber(unit.price)}</span>
                            <span className="text-xs font-normal text-accent">{unit.currency || 'EGP'}</span>
                          </div>

                          {ppm > 0 && (
                            <div className="text-[11px] text-text-muted flex items-center justify-between pt-1 border-t border-border font-mono">
                              <span>{isArabic ? 'سعر المتر:' : 'Price/m²:'}</span>
                              <span className="font-bold text-blue-300">{formatNumber(ppm)} EGP</span>
                            </div>
                          )}
                        </div>

                        {/* Badges for Best Values */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {isLowestPrice && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>{isArabic ? 'الأقل سعراً' : 'Lowest Price'}</span>
                            </span>
                          )}
                          {isLowestMeter && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                              <Flame className="w-3 h-3 text-blue-400" />
                              <span>{isArabic ? 'أفضل سعر متر' : 'Best Price/m²'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                        <button
                          onClick={() => onSelectUnitForDetails(unit)}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'ملف الوحدة' : 'View Dossier'}</span>
                        </button>

                        {onExportQuotation && (
                          <button
                            onClick={() => onExportQuotation(unit)}
                            className="py-1.5 px-2.5 rounded-lg bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white text-xs font-semibold transition flex items-center gap-1 cursor-pointer border border-border"
                            title={isArabic ? 'عرض سعر رسمي PDF' : 'Official Quotation PDF'}
                          >
                            <FileText className="w-3.5 h-3.5 text-accent" />
                            <span className="hidden sm:inline">PDF</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comprehensive Comparison Breakdown Matrix Table */}
              <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg">
                <div className="p-3.5 bg-surface border-b border-border flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-accent" />
                    <span>{isArabic ? 'جدول مقارنة الخصائص والمواصفات التفصيلية' : 'Detailed Specifications & Attributes Matrix'}</span>
                  </span>

                  {highlightDifferences && (
                    <span className="text-[11px] text-accent/90 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      <span>{isArabic ? 'الصفوف المظللة بالأصفر توضح وجود اختلاف في المواصفات' : 'Highlighted rows denote varying specifications'}</span>
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left rtl:text-right border-collapse">
                    <thead>
                      <tr className="bg-surface text-text-muted border-b border-border font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4 w-[28%] sm:w-[22%] shrink-0">
                          {isArabic ? 'الخاصية / المعيار' : 'Specification / Field'}
                        </th>
                        {units.map((u) => (
                          <th key={u.id} className="py-3 px-4 font-mono font-bold text-accent">
                            {u.id} ({u.compound})
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {displayedRows.map((row) => {
                        const values = units.map(u => row.getValue(u));
                        const differs = checkValuesDiffer(values.map(v => v.raw));
                        const isRowHighlighted = highlightDifferences && differs;

                        return (
                          <tr 
                            key={row.id}
                            className={`transition ${
                              isRowHighlighted 
                                ? 'bg-accent hover:bg-accent' 
                                : 'hover:bg-surface-raised'
                            }`}
                          >
                            {/* Field Label */}
                            <td className="py-3 px-4 font-semibold text-text-muted flex items-center gap-2">
                              {row.icon}
                              <span>{isArabic ? row.labelAr : row.labelEn}</span>
                            </td>

                            {/* Values per Unit */}
                            {values.map((v, idx) => (
                              <td 
                                key={units[idx].id} 
                                className="py-3 px-4 text-text font-medium whitespace-pre-wrap"
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{v.text}</span>
                                  {v.highlightBadge && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent text-accent border border-accent">
                                      {v.highlightBadge}
                                    </span>
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Executive Summary Takeaways & Advisor Notes */}
              {metricsInsights && units.length > 1 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-surface to-indigo-950/40 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>{isArabic ? 'خلاصة التقييم الاستثماري للمقارنة' : 'Executive Investment Comparison Summary'}</span>
                    </span>
                    <h5 className="text-sm font-bold text-white">
                      {isArabic ? 'التحليل الاستثماري والتوصية البيعية' : 'Comparative Highlights & Value Rating'}
                    </h5>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {isArabic ? (
                        <>
                          وحدة <strong className="text-accent">{metricsInsights.lowestMeterPriceUnit.id}</strong> في مشروع <strong className="text-white">{metricsInsights.lowestMeterPriceUnit.compound}</strong> تقدم أفضل عائد سعر للمتر بقيمة <strong className="text-emerald-400">{formatNumber(metricsInsights.lowestMeterPrice)} ج.م/م²</strong>، بينما توفر وحدة <strong className="text-accent">{metricsInsights.largestSizeUnit.id}</strong> أكبر مساحة مبنية إجمالية (<strong className="text-white">{metricsInsights.largestSizeUnit.size} م²</strong>).
                        </>
                      ) : (
                        <>
                          Unit <strong className="text-accent">{metricsInsights.lowestMeterPriceUnit.id}</strong> in <strong className="text-white">{metricsInsights.lowestMeterPriceUnit.compound}</strong> provides the highest meter efficiency at <strong className="text-emerald-400">{formatNumber(metricsInsights.lowestMeterPrice)} EGP/m²</strong>, whereas Unit <strong className="text-accent">{metricsInsights.largestSizeUnit.id}</strong> delivers the largest space envelope at <strong className="text-white">{metricsInsights.largestSizeUnit.size} m²</strong>.
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectUnitForDetails(metricsInsights.lowestMeterPriceUnit)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isArabic ? `فحص الأفضل قيمة (${metricsInsights.lowestMeterPriceUnit.id})` : `Inspect Best Value (${metricsInsights.lowestMeterPriceUnit.id})`}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-surface flex items-center justify-between text-xs">
          <span className="text-text-muted font-mono">
            {isArabic ? 'نظام مقارنة المخزون العقاري 6th of October' : '6th of October Property Inventory Comparator'}
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-surface-raised hover:bg-surface-raised text-text font-semibold transition cursor-pointer"
          >
            {isArabic ? 'إغلاق المقارنة' : 'Close Comparison'}
          </button>
        </div>
      </div>
    </div>
  );
};
