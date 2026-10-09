import { formatNumber } from '../i18n/format';
import React, { useState, useMemo } from 'react';
import { Unit } from '../types';
import {
  MapPin,
  Building2,
  Layers,
  Flame,
  DollarSign,
  TrendingUp,
  Compass,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface GeographicDistributionMapProps {
  units: Unit[];
  onSelectUnit: (unit: Unit) => void;
  isArabic: boolean;
  theme?: 'dark' | 'light';
}

export interface WestCairoZone {
  id: string;
  nameAr: string;
  nameEn: string;
  city: 'october' | 'zayed';
  cityLabelAr: string;
  cityLabelEn: string;
  centerSvg: { x: number; y: number };
  compounds: string[];
  descriptionAr: string;
  descriptionEn: string;
  majorRoads: string[];
}

const WEST_CAIRO_ZONES: WestCairoZone[] = [
  {
    id: 'zayed-core',
    nameAr: 'وسط الشيخ زايد والحي الدبلوماسي',
    nameEn: 'Sheikh Zayed Core & District 1-16',
    city: 'zayed',
    cityLabelAr: 'الشيخ زايد',
    cityLabelEn: 'Sheikh Zayed',
    centerSvg: { x: 550, y: 190 },
    compounds: ['Zed Towers (Sawiris)', 'Karmell SODIC', 'Greens', 'Zayed Dunes', 'Tara'],
    descriptionAr: 'المنطقة الأكثر حيوية، تضم أبراج زد، أركان بلازا، وممشى الشيخ زايد السياحي.',
    descriptionEn: 'Prime urban core containing Zed Towers, Arkan Plaza, and central commercial promenades.',
    majorRoads: ['محور 26 يوليو', 'شارع النزهة', 'وصلة دهشور']
  },
  {
    id: 'zayed-new-greenbelt',
    nameAr: 'الشيخ زايد الجديدة والحزام الأخضر',
    nameEn: 'New Zayed & Zayed Green Belt',
    city: 'zayed',
    cityLabelAr: 'الشيخ زايد',
    cityLabelEn: 'Sheikh Zayed',
    centerSvg: { x: 380, y: 120 },
    compounds: ['VYE SODIC', 'Solana (Ora)', 'De Joya Zayed', 'Belle Vie (Emaar)', 'Rivers'],
    descriptionAr: 'الامتداد العمراني الحديث ذو الكثافة السكنية الراقية والمساحات الخضراء الشاسعة.',
    descriptionEn: 'The modern prestigious western expansion featuring ultra-luxury standalone villa communities.',
    majorRoads: ['محور الضبعة', 'طريق القاهرة - الإسكندرية الصحراوي', 'محور بوليفارد']
  },
  {
    id: 'zayed-beverly-bostan',
    nameAr: 'بيفرلي هيلز ومحور البستان',
    nameEn: 'Beverly Hills & El-Bostan Axis',
    city: 'zayed',
    cityLabelAr: 'الشيخ زايد',
    cityLabelEn: 'Sheikh Zayed',
    centerSvg: { x: 440, y: 240 },
    compounds: ['Beverly Hills (SODIC)', 'Allegria (SODIC)', 'Westown Residences', 'The Courtyards'],
    descriptionAr: 'أعرق مجتمعات زايد السكنية، تتركز فيها الفيلات الفاخرة وملاعب الجولف الدولية.',
    descriptionEn: 'Established master-planned enclave featuring championship golf courses and signature villas.',
    majorRoads: ['طريق وصلة دهشور', 'محور البستان']
  },
  {
    id: 'oct-northern-expansions',
    nameAr: 'التوسعات الشمالية (أكتوبر)',
    nameEn: 'Northern Expansions (6th Oct)',
    city: 'october',
    cityLabelAr: '6 أكتوبر',
    cityLabelEn: '6th of October',
    centerSvg: { x: 470, y: 350 },
    compounds: ['Mountain View iCity', 'Mountain View Chillout Park', 'Grand Heights', 'Garden Hills', 'Porto October'],
    descriptionAr: 'منطقة الابتكار والكمبوندات الحديثة من الفئة A+ بجوار مول العرب ونادي الصيد.',
    descriptionEn: 'Prime upscale expansion with iconic smart projects like Mountain View iCity and Grand Heights.',
    majorRoads: ['محور جمال عبد الناصر', 'محور البوليفارد', 'وصلة دهشور']
  },
  {
    id: 'oct-palm-somid',
    nameAr: 'بالم هيلز وغرب سوميد',
    nameEn: 'Palm Hills & West Somid',
    city: 'october',
    cityLabelAr: '6 أكتوبر',
    cityLabelEn: '6th of October',
    centerSvg: { x: 580, y: 310 },
    compounds: ['Palm Hills October (Golf Views)', 'The Crown (Palm Hills)', 'Woodville', 'Bamboo'],
    descriptionAr: 'منطقة الجولف والفيلات الفاخرة الملاصقة لمحور 26 يوليو ومنطقة غرب سوميد الراقية.',
    descriptionEn: 'Exclusive golf community with standalone luxury estates directly off Mehwar 26th July.',
    majorRoads: ['محور 26 يوليو', 'محور الكفراوي']
  },
  {
    id: 'oct-south-wahat-badya',
    nameAr: 'جنوب الواحات ومحور بادية',
    nameEn: 'South Wahat & Badya Corridor',
    city: 'october',
    cityLabelAr: '6 أكتوبر',
    cityLabelEn: '6th of October',
    centerSvg: { x: 620, y: 470 },
    compounds: ['Badya (Palm Hills)', 'O West (Orascom)', 'Eco West', 'Ashgar City (أشجار سيتي)', 'Sun Capital (صن كابيتال)'],
    descriptionAr: 'مدينة بادية الذكية وأوراسكوم أويست بالقرب من مدينة الإنتاج الإعلامي ومول مصر والأهرامات.',
    descriptionEn: 'Mega smart-city developments including Badya and O West along Al Wahat Road.',
    majorRoads: ['طريق الواحات', 'الطريق الدائري الأوسطي', 'طريق الفيوم']
  },
  {
    id: 'oct-central-motamayez',
    nameAr: 'أحياء أكتوبر والحي المتميز',
    nameEn: 'Central 6th Oct & Motamayez',
    city: 'october',
    cityLabelAr: '6 أكتوبر',
    cityLabelEn: '6th of October',
    centerSvg: { x: 510, y: 420 },
    compounds: ['October Plaza (SODIC)', 'Rayhanah Plaza', 'مجاوره ٣، ٦ اكتوبر الحي الاول'],
    descriptionAr: 'قلب مدينة 6 أكتوبر الكلاسيكي، ميدان الحصري، الحي المتميز، ومحور التحرير المركزي.',
    descriptionEn: 'Vibrant city center around Hosary Square, Motamayez district and Central Axis.',
    majorRoads: ['المحور المركزي', 'طريق التحرير']
  }
];

export const GeographicDistributionMap: React.FC<GeographicDistributionMapProps> = ({
  units,
  onSelectUnit,
  isArabic
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('oct-northern-expansions');
  const [cityFilter, setCityFilter] = useState<'all' | 'october' | 'zayed'>('all');
  const [activeLayer, setActiveLayer] = useState<'density' | 'price' | 'availability' | 'delivery'>('density');
  const [searchQuery] = useState('');
  const [statusFilter] = useState<string>('all');
  const [propertyTypeFilter] = useState<string>('all');

  // Filter units according to search and filters
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      // City filter
      if (cityFilter === 'october') {
        const a = (u.area || '').toLowerCase();
        if (!a.includes('october') && !a.includes('أكتوبر')) return false;
      } else if (cityFilter === 'zayed') {
        const a = (u.area || '').toLowerCase();
        if (!a.includes('zayed') && !a.includes('زايد')) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const st = (u.status || '').toLowerCase();
        if (statusFilter === 'available' && !st.includes('avail') && !st.includes('متاح')) return false;
        if (statusFilter === 'reserved' && !st.includes('reserv') && !st.includes('حجز')) return false;
        if (statusFilter === 'sold' && !st.includes('sold') && !st.includes('مباع')) return false;
      }

      // Property type filter
      if (propertyTypeFilter !== 'all') {
        const pt = (u.propertyType || '').toLowerCase();
        const ut = (u.unitType || '').toLowerCase();
        if (!pt.includes(propertyTypeFilter.toLowerCase()) && !ut.includes(propertyTypeFilter.toLowerCase())) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchComp = (u.compound || '').toLowerCase().includes(q);
        const matchArea = (u.area || '').toLowerCase().includes(q);
        const matchType = (u.unitType || '').toLowerCase().includes(q);
        const matchId = (u.id || '').toLowerCase().includes(q);
        if (!matchComp && !matchArea && !matchType && !matchId) return false;
      }

      return true;
    });
  }, [units, cityFilter, statusFilter, propertyTypeFilter, searchQuery]);

  // Aggregate statistics per geographic zone
  const zoneStats = useMemo(() => {
    const totalMatching = filteredUnits.length || 1;

    return WEST_CAIRO_ZONES.map((zone) => {
      // Units matching this zone's compounds or name
      const zoneUnits = filteredUnits.filter((u) => {
        const comp = (u.compound || '').toLowerCase();
        return zone.compounds.some((c) => comp.includes(c.toLowerCase().split(' ')[0]));
      });

      const total = zoneUnits.length;
      const available = zoneUnits.filter((u) => (u.status || '').toLowerCase().includes('avail') || (u.status || '').toLowerCase().includes('متاح')).length;
      const reserved = zoneUnits.filter((u) => (u.status || '').toLowerCase().includes('reserv') || (u.status || '').toLowerCase().includes('حجز')).length;
      const sold = zoneUnits.filter((u) => (u.status || '').toLowerCase().includes('sold') || (u.status || '').toLowerCase().includes('مباع')).length;

      // Price calculation
      const prices = zoneUnits.map((u) => Number(u.price) || 0).filter((p) => p > 0);
      const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      // Price per sqm
      const pricesPerM2 = zoneUnits
        .map((u) => {
          const s = parseFloat(String(u.size).replace(/[^0-9.]/g, ''));
          const p = Number(u.price) || 0;
          return s > 0 && p > 0 ? Math.round(p / s) : 0;
        })
        .filter((pm) => pm > 0);
      const avgPricePerSqm = pricesPerM2.length > 0 ? Math.round(pricesPerM2.reduce((a, b) => a + b, 0) / pricesPerM2.length) : 0;

      const concentrationPct = Math.round((total / totalMatching) * 100);

      return {
        ...zone,
        unitsCount: total,
        availableCount: available,
        reservedCount: reserved,
        soldCount: sold,
        avgPrice,
        minPrice,
        maxPrice,
        avgPricePerSqm,
        concentrationPct,
        units: zoneUnits
      };
    });
  }, [filteredUnits]);

  // Selected Zone Detailed Info
  const selectedZoneData = useMemo(() => {
    return zoneStats.find((z) => z.id === selectedZoneId) || zoneStats[0];
  }, [zoneStats, selectedZoneId]);

  // Overall West Cairo KPIs
  const overallKPIs = useMemo(() => {
    const totalUnits = filteredUnits.length;
    const zayedCount = filteredUnits.filter((u) => (u.area || '').toLowerCase().includes('zayed') || (u.area || '').toLowerCase().includes('زايد')).length;
    const octoberCount = filteredUnits.filter((u) => (u.area || '').toLowerCase().includes('october') || (u.area || '').toLowerCase().includes('أكتوبر')).length;

    // Find zone with highest concentration
    const sortedByDensity = [...zoneStats].sort((a, b) => b.unitsCount - a.unitsCount);
    const topDensityZone = sortedByDensity[0];

    // Find zone with highest average price
    const sortedByPrice = [...zoneStats].sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm);
    const topLuxuryZone = sortedByPrice[0];

    return {
      totalUnits,
      zayedCount,
      octoberCount,
      topDensityZone,
      topLuxuryZone
    };
  }, [filteredUnits, zoneStats]);

  // Helper for Bubble Radius based on Unit Count
  const getBubbleRadius = (count: number) => {
    if (count === 0) return 24;
    return Math.min(68, Math.max(28, 22 + count * 8));
  };

  // Helper for Bubble Color based on Active Layer
  const getBubbleColor = (zone: typeof zoneStats[0]) => {
    if (activeLayer === 'price') {
      // Benchmark price per sqm
      if (zone.avgPricePerSqm > 60000) return { fill: 'rgba(168, 85, 247, 0.45)', stroke: 'rgb(192, 132, 252)', text: 'rgb(233, 213, 255)' };
      if (zone.avgPricePerSqm > 40000) return { fill: 'rgba(234, 179, 8, 0.45)', stroke: 'rgb(250, 204, 21)', text: 'rgb(254, 240, 138)' };
      return { fill: 'rgba(16, 185, 129, 0.45)', stroke: 'rgb(52, 211, 153)', text: 'rgb(167, 243, 208)' };
    }

    if (activeLayer === 'availability') {
      const availRatio = zone.unitsCount > 0 ? zone.availableCount / zone.unitsCount : 0;
      if (availRatio > 0.6) return { fill: 'rgba(34, 197, 94, 0.45)', stroke: 'rgb(74, 222, 128)', text: 'rgb(187, 247, 208)' };
      if (availRatio > 0.3) return { fill: 'rgba(249, 115, 22, 0.45)', stroke: 'rgb(251, 146, 60)', text: 'rgb(254, 215, 170)' };
      return { fill: 'rgba(239, 68, 68, 0.45)', stroke: 'rgb(248, 113, 113)', text: 'rgb(254, 202, 202)' };
    }

    // Default: Density
    if (zone.unitsCount >= 4) return { fill: 'rgba(59, 130, 246, 0.5)', stroke: 'rgb(96, 165, 250)', text: 'rgb(191, 219, 254)' };
    if (zone.unitsCount >= 2) return { fill: 'rgba(6, 182, 212, 0.45)', stroke: 'rgb(34, 211, 238)', text: 'rgb(207, 250, 254)' };
    return { fill: 'rgba(100, 116, 139, 0.4)', stroke: 'var(--color-text-muted)', text: 'var(--color-text)' };
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Worklenz KPI Summary Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isArabic ? 'تحليل التوزيع والكثافة الجغرافية (6 أكتوبر والشيخ زايد)' : 'Geographic Density & Distribution Analysis'}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent text-accent border border-accent">
              West Cairo GIS
            </span>
          </div>
          <p className="text-xs text-text-muted">
            {isArabic 
              ? 'خريطة تفاعلية ترصد تركز الوحدات العقارية، متوسطات الأسعار للمتر المربع، ومعدل الاستيعاب في مناطق التوسع الغربي للقاهرة.'
              : 'Interactive GIS intelligence detailing unit inventory density, price per m² benchmarks, and absorption velocity across West Cairo.'}
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center bg-surface p-1 rounded-xl border border-border text-xs">
          <button
            onClick={() => setCityFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              cityFilter === 'all' ? 'bg-blue-600 text-white shadow' : 'text-text-muted hover:text-white'
            }`}
          >
            {isArabic ? 'كامل غرب القاهرة' : 'All West Cairo'}
          </button>
          <button
            onClick={() => setCityFilter('zayed')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              cityFilter === 'zayed' ? 'bg-emerald-600 text-white shadow' : 'text-text-muted hover:text-white'
            }`}
          >
            {isArabic ? 'الشيخ زايد' : 'Sheikh Zayed'}
          </button>
          <button
            onClick={() => setCityFilter('october')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              cityFilter === 'october' ? 'bg-accent text-white shadow' : 'text-text-muted hover:text-white'
            }`}
          >
            {isArabic ? '6 أكتوبر' : '6th of October'}
          </button>
        </div>
      </div>

      {/* Analytics KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Units Analyzed */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{isArabic ? 'إجمالي محفظة غرب القاهرة' : 'Total West Cairo Units'}</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {overallKPIs.totalUnits} <span className="text-xs font-normal text-text-muted">{isArabic ? 'وحدة' : 'units'}</span>
          </div>
          <div className="text-[11px] text-text-muted flex items-center justify-between">
            <span>{isArabic ? 'زايد:' : 'Zayed:'} <strong className="text-emerald-400 font-mono">{overallKPIs.zayedCount}</strong></span>
            <span>{isArabic ? 'أكتوبر:' : 'Oct:'} <strong className="text-accent font-mono">{overallKPIs.octoberCount}</strong></span>
          </div>
        </div>

        {/* Metric 2: Highest Density Zone */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{isArabic ? 'أعلى منطقة تركيز للمخزون' : 'Peak Density Zone'}</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-base font-bold text-rose-400 truncate">
            {isArabic ? overallKPIs.topDensityZone?.nameAr : overallKPIs.topDensityZone?.nameEn}
          </div>
          <div className="text-[11px] text-text-muted">
            <strong className="text-white font-mono">{overallKPIs.topDensityZone?.unitsCount}</strong> {isArabic ? 'وحدات' : 'units'} ({overallKPIs.topDensityZone?.concentrationPct}% {isArabic ? 'من الإجمالي' : 'of inventory'})
          </div>
        </div>

        {/* Metric 3: Highest Value & Luxury Zone */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{isArabic ? 'أعلى متوسط سعر للمتر' : 'Highest Price / m²'}</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-base font-bold text-purple-400 truncate">
            {isArabic ? overallKPIs.topLuxuryZone?.nameAr : overallKPIs.topLuxuryZone?.nameEn}
          </div>
          <div className="text-[11px] text-text-muted">
            <strong className="text-white font-mono">{formatNumber(overallKPIs.topLuxuryZone?.avgPricePerSqm || 0)}</strong> EGP/m²
          </div>
        </div>

        {/* Metric 4: Absorption / Activity Index */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{isArabic ? 'معدل الحجز والبيع' : 'Market Velocity'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {overallKPIs.totalUnits > 0 
              ? Math.round(((filteredUnits.filter(u => (u.status || '').toLowerCase().includes('sold') || (u.status || '').toLowerCase().includes('reserv')).length) / overallKPIs.totalUnits) * 100)
              : 0}%
          </div>
          <div className="text-[11px] text-text-muted">
            {isArabic ? 'مستوى الإشغال وسرعة دوران المخزون' : 'Active deals & reservation velocity'}
          </div>
        </div>
      </div>

      {/* Main Map + Side Details Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Interactive SVG Map Container */}
        <div className="xl:col-span-2 bg-surface border border-border rounded-2xl p-5 shadow-2xl space-y-4">
          {/* Map Controls & Layer Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border text-xs">
            <div className="flex items-center gap-2">
              <span className="text-text-muted font-semibold">{isArabic ? 'طبقة التحليل:' : 'Analytics Layer:'}</span>
              <div className="flex items-center bg-surface p-1 rounded-xl border border-border">
                <button
                  onClick={() => setActiveLayer('density')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    activeLayer === 'density' ? 'bg-blue-600 text-white' : 'text-text-muted hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'الكثافة والتركز' : 'Density'}</span>
                </button>
                <button
                  onClick={() => setActiveLayer('price')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    activeLayer === 'price' ? 'bg-purple-600 text-white' : 'text-text-muted hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'خريطة الأسعار/م²' : 'Price / m²'}</span>
                </button>
                <button
                  onClick={() => setActiveLayer('availability')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    activeLayer === 'availability' ? 'bg-emerald-600 text-white' : 'text-text-muted hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'نسبة المتاح' : 'Availability'}</span>
                </button>
              </div>
            </div>

            {/* Quick Legend */}
            <div className="flex items-center gap-3 text-[11px] text-text-muted font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>{isArabic ? 'كثافة مرتفعة' : 'High Density'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span>{isArabic ? 'كثافة متوسطة' : 'Mid Density'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-surface-raised"></span>
                <span>{isArabic ? 'مخزون محدود' : 'Sparse'}</span>
              </span>
            </div>
          </div>

          {/* Interactive SVG Rendering */}
          <div className="relative w-full aspect-[16/10] bg-surface rounded-xl border border-border overflow-hidden shadow-inner select-none">
            {/* Background Grid Pattern */}
            <svg className="w-full h-full" viewBox="0 0 850 560">
              <defs>
                <pattern id="geo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="2 2" />
                </pattern>
                {/* Radial Glow Filters */}
                <filter id="glow-pulse" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <rect width="100%" height="100%" fill="var(--color-surface)" />
              <rect width="100%" height="100%" fill="url(#geo-grid)" />

              {/* Major Arteries and Highways */}
              {/* Mehwar 26 July (محور 26 يوليو) */}
              <path
                d="M 120 220 Q 320 210 520 230 T 820 280"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M 120 220 Q 320 210 520 230 T 820 280"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <text x="730" y="270" fill="var(--color-text-muted)" fontSize="10" fontFamily="sans-serif">
                {isArabic ? 'محور 26 يوليو' : '26th of July Corridor'}
              </text>

              {/* Dahshur Link Road (وصلة دهشور) */}
              <path
                d="M 420 80 L 460 250 L 510 460"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 420 80 L 460 250 L 510 460"
                fill="none"
                stroke="rgb(56, 189, 248)"
                strokeWidth="1.2"
                strokeDasharray="5 3"
              />
              <text x="350" y="170" fill="var(--color-text-muted)" fontSize="10" fontFamily="sans-serif">
                {isArabic ? 'وصلة دهشور' : 'Dahshur Link'}
              </text>

              {/* Cairo-Alexandria Desert Road */}
              <path
                d="M 220 50 L 550 150 L 780 200"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="4"
              />
              <text x="240" y="70" fill="var(--color-text-muted)" fontSize="9" fontFamily="sans-serif">
                {isArabic ? 'طريق الإسكندرية الصحراوي' : 'Cairo-Alex Desert Rd'}
              </text>

              {/* Al-Wahat Road (طريق الواحات) */}
              <path
                d="M 440 450 Q 600 480 820 490"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="5"
              />
              <path
                d="M 440 450 Q 600 480 820 490"
                fill="none"
                stroke="rgb(16, 185, 129)"
                strokeWidth="1.2"
                strokeDasharray="5 3"
              />
              <text x="690" y="515" fill="var(--color-text-muted)" fontSize="10" fontFamily="sans-serif">
                {isArabic ? 'طريق الواحات' : 'Al-Wahat Road'}
              </text>

              {/* City Territory Boundaries & Labels */}
              {/* Sheikh Zayed Sector Boundary */}
              <path
                d="M 320 80 Q 560 110 680 180 Q 620 280 440 270 Z"
                fill="rgba(16, 185, 129, 0.03)"
                stroke="rgba(16, 185, 129, 0.2)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x="520" y="130" fill="rgba(52, 211, 153, 0.6)" fontSize="14" fontWeight="bold" letterSpacing="1">
                {isArabic ? 'نطاق الشيخ زايد' : 'SHEIKH ZAYED'}
              </text>

              {/* 6th of October Sector Boundary */}
              <path
                d="M 420 290 Q 680 280 780 380 Q 720 530 460 520 Q 420 380 420 290 Z"
                fill="rgba(245, 158, 11, 0.03)"
                stroke="rgba(245, 158, 11, 0.2)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x="560" y="440" fill="rgba(251, 191, 36, 0.6)" fontSize="14" fontWeight="bold" letterSpacing="1">
                {isArabic ? 'نطاق 6 أكتوبر' : '6TH OF OCTOBER'}
              </text>

              {/* Interactive Zone Concentration Bubbles */}
              {zoneStats.map((zone) => {
                const isSelected = selectedZoneId === zone.id;
                const radius = getBubbleRadius(zone.unitsCount);
                const colors = getBubbleColor(zone);

                return (
                  <g
                    key={zone.id}
                    className="cursor-pointer transition-transform duration-300"
                    onClick={() => setSelectedZoneId(zone.id)}
                  >
                    {/* Outer animated radar pulse if selected */}
                    {isSelected && (
                      <circle
                        cx={zone.centerSvg.x}
                        cy={zone.centerSvg.y}
                        r={radius + 16}
                        fill="none"
                        stroke={colors.stroke}
                        strokeWidth="1.5"
                        opacity="0.6"
                        className="animate-ping"
                      />
                    )}

                    {/* Concentric Halo */}
                    <circle
                      cx={zone.centerSvg.x}
                      cy={zone.centerSvg.y}
                      r={radius + 6}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={isSelected ? '2.5' : '1'}
                      opacity={isSelected ? '1' : '0.7'}
                      filter={isSelected ? 'url(#glow-pulse)' : undefined}
                    />

                    {/* Center Core Circle */}
                    <circle
                      cx={zone.centerSvg.x}
                      cy={zone.centerSvg.y}
                      r={Math.max(14, radius * 0.45)}
                      fill={isSelected ? 'var(--color-surface-raised)' : 'var(--color-navy)'}
                      stroke={colors.stroke}
                      strokeWidth="2"
                    />

                    {/* Unit Count Value */}
                    <text
                      x={zone.centerSvg.x}
                      y={zone.centerSvg.y + 4}
                      fill={colors.text}
                      fontSize={radius > 40 ? '13' : '11'}
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {zone.unitsCount}
                    </text>

                    {/* Zone Title Label Pill */}
                    <rect
                      x={zone.centerSvg.x - 70}
                      y={zone.centerSvg.y + radius + 8}
                      width="140"
                      height="20"
                      rx="6"
                      fill={isSelected ? 'var(--color-surface-raised)' : 'rgba(15, 23, 42, 0.85)'}
                      stroke={isSelected ? colors.stroke : 'var(--color-border)'}
                      strokeWidth="1"
                    />
                    <text
                      x={zone.centerSvg.x}
                      y={zone.centerSvg.y + radius + 22}
                      fill={isSelected ? 'white' : 'var(--color-text-muted)'}
                      fontSize="9.5"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      {isArabic ? zone.nameAr.slice(0, 24) : zone.nameEn.slice(0, 24)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Map Floating Indicator */}
            <div className="absolute bottom-3 left-3 bg-surface backdrop-blur border border-border rounded-xl px-3 py-1.5 text-[10px] text-text-muted font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{isArabic ? 'انقر على أي منطقة لعرض تفاصيل الوحدات والأسعار' : 'Click any zone to inspect unit breakdown'}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Selected Zone Breakdown & Roster */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                <h3 className="font-bold text-white text-base">
                  {isArabic ? selectedZoneData.nameAr : selectedZoneData.nameEn}
                </h3>
              </div>
              <span className="text-xs text-blue-400 font-medium">
                {isArabic ? selectedZoneData.cityLabelAr : selectedZoneData.cityLabelEn}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold">
              {selectedZoneData.unitsCount} {isArabic ? 'وحدة' : 'units'}
            </span>
          </div>

          <p className="text-xs text-text-muted leading-relaxed bg-surface p-3 rounded-xl border border-border">
            {isArabic ? selectedZoneData.descriptionAr : selectedZoneData.descriptionEn}
          </p>

          {/* Key Metric Highlights in this Zone */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-surface p-2.5 rounded-xl border border-border">
              <span className="text-[10px] text-text-muted block">{isArabic ? 'متوسط السعر' : 'Avg Asking Price'}</span>
              <strong className="text-accent font-mono text-xs">
                {selectedZoneData.avgPrice > 0 ? `${(selectedZoneData.avgPrice / 1000000).toFixed(2)}M EGP` : '-'}
              </strong>
            </div>
            <div className="bg-surface p-2.5 rounded-xl border border-border">
              <span className="text-[10px] text-text-muted block">{isArabic ? 'متوسط سعر المتر' : 'Avg Price / m²'}</span>
              <strong className="text-purple-400 font-mono text-xs">
                {selectedZoneData.avgPricePerSqm > 0 ? `${formatNumber(selectedZoneData.avgPricePerSqm)} EGP` : '-'}
              </strong>
            </div>
            <div className="bg-surface p-2.5 rounded-xl border border-border">
              <span className="text-[10px] text-text-muted block">{isArabic ? 'حالة المخزون' : 'Stock Status'}</span>
              <div className="text-[11px] font-mono flex items-center gap-1.5 mt-0.5">
                <span className="text-emerald-400 font-bold">{selectedZoneData.availableCount} {isArabic ? 'متاح' : 'Avail'}</span>
                <span className="text-text-muted">|</span>
                <span className="text-blue-400">{selectedZoneData.soldCount} {isArabic ? 'مباع' : 'Sold'}</span>
              </div>
            </div>
            <div className="bg-surface p-2.5 rounded-xl border border-border">
              <span className="text-[10px] text-text-muted block">{isArabic ? 'المحاور الرئيسية' : 'Key Arterials'}</span>
              <span className="text-[11px] text-text-muted truncate block">
                {selectedZoneData.majorRoads[0]}
              </span>
            </div>
          </div>

          {/* Key Compounds in this Zone */}
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">
              {isArabic ? 'الكمبوندات والمشروعات البارزة:' : 'Featured Compounds in Zone:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedZoneData.compounds.map((comp, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted"
                >
                  {comp}
                </span>
              ))}
            </div>
          </div>

          {/* Unit Inventory List for this Zone */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-text">
                {isArabic ? 'قائمة الوحدات في النطاق' : 'Zone Unit Roster'}
              </span>
              <span className="text-[11px] text-text-muted font-mono">
                {selectedZoneData.units.length} {isArabic ? 'معروضة' : 'found'}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {selectedZoneData.units.length === 0 ? (
                <div className="p-6 text-center text-text-muted text-xs">
                  {isArabic ? 'لا توجد وحدات مسجلة تطابق الفلاتر الحالية في هذه المنطقة.' : 'No units match current filters in this zone.'}
                </div>
              ) : (
                selectedZoneData.units.map((unit) => (
                  <div
                    key={unit.id}
                    onClick={() => onSelectUnit(unit)}
                    className="p-3 rounded-xl bg-surface hover:bg-surface-raised border border-border transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-0.5 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-accent group-hover:text-accent">
                          {unit.id}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          (unit.status || '').toLowerCase().includes('sold')
                            ? 'bg-blue-500/20 text-blue-400'
                            : (unit.status || '').toLowerCase().includes('reserv')
                            ? 'bg-accent text-accent'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {unit.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-text truncate">
                        {unit.compound}
                      </p>
                      <div className="text-[10px] text-text-muted flex items-center gap-2">
                        <span>{unit.unitType}</span>
                        <span>•</span>
                        <span>{unit.size} m²</span>
                        <span>•</span>
                        <span>{unit.beds} Beds</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-white">
                        {formatNumber(unit.price)} <span className="text-[10px] text-accent">{unit.currency}</span>
                      </div>
                      <span className="text-[10px] text-blue-400 flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition">
                        <span>{isArabic ? 'معاينة' : 'Inspect'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicDistributionMap;
