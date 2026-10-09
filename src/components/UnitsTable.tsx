import { formatNumber } from '../i18n/format';
import React, { useState } from 'react';
import { normalizeUnitStatus } from '../lib/units';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  MapPin, 
  Bed, 
  Maximize2,
  Layers,
  FileSpreadsheet,
  LayoutGrid,
  Table as TableIcon,
  Calendar,
  UserCheck,
  QrCode,
  BarChart3,
  FileText,
  TrendingUp,
  ArrowRightLeft,
  X,
  AlertCircle,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Unit, UnitStatus, TableDensity } from '../types';
import { UnitComparisonModal } from './UnitComparisonModal';
import { useT } from '../i18n/useT';
import { UNIT_STATUS_LABEL } from '../i18n/labels';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const STATUS_DOT: Record<UnitStatus, string> = {
  Available: 'bg-emerald-400',
  Reserved: 'bg-accent',
  Sold: 'bg-blue-400',
};

const STATUS_OPTIONS = (Object.keys(UNIT_STATUS_LABEL) as UnitStatus[]).map((key) => ({
  key,
  labelKey: UNIT_STATUS_LABEL[key],
  dot: STATUS_DOT[key],
}));

interface TableProps {
  units: Unit[];
  filteredUnits: Unit[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  areaFilter: string;
  setAreaFilter: (a: string) => void;
  typeFilter: string;
  setTypeFilter: (t: string) => void;
  compoundFilter?: string;
  setCompoundFilter?: (c: string) => void;
  onSelectUnit: (u: Unit) => void;
  onOpenNewModal: () => void;
  isArabic: boolean;
  sheetUrl?: string;
  isSyncing?: boolean;
  tableDensity?: TableDensity;
  theme?: 'dark' | 'light';
  onOpenCompoundAnalysis?: (compoundName?: string) => void;
  onExportQuotation?: (unit: Unit) => void;
  onUpdateUnit?: (updatedUnit: Unit) => void;
}

export const UnitsTable: React.FC<TableProps> = ({
  units,
  filteredUnits,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  areaFilter,
  setAreaFilter,
  typeFilter,
  setTypeFilter,
  compoundFilter = '',
  setCompoundFilter,
  onSelectUnit,
  onOpenNewModal,
  isArabic,
  sheetUrl,
  tableDensity = 'normal',
  theme = 'dark',
  onOpenCompoundAnalysis,
  onExportQuotation,
  onUpdateUnit
}) => {
  const t = useT();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const pageSize = tableDensity === 'compact' ? 12 : tableDensity === 'spacious' ? 6 : 8;

  // Selected Units for Side-by-Side Comparison (Max 3)
  const [selectedForCompare, setSelectedForCompare] = useState<Unit[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [compareLimitWarning, setCompareLimitWarning] = useState<string | null>(null);

  // Quick Status Change state
  const [openQuickStatusUnitId, setOpenQuickStatusUnitId] = useState<string | null>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleDocumentClick = () => setOpenQuickStatusUnitId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const handleQuickStatusChange = (unit: Unit, newStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenQuickStatusUnitId(null);
    if (unit.status.toLowerCase() === newStatus.toLowerCase()) return;

    const updatedUnit: Unit = {
      ...unit,
      status: normalizeUnitStatus(newStatus),
      auditLog: [
        ...(unit.auditLog || []),
        {
          id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toISOString(),
          action: 'status_change',
          field: 'status',
          oldValue: unit.status,
          newValue: newStatus,
          changedBy: t('units.audit.quickCardAction'),
          notes: t('units.audit.quickCardNote', { status: newStatus })
        }
      ]
    };

    if (onUpdateUnit) {
      onUpdateUnit(updatedUnit);
    }
  };

  const handleToggleCompare = (unit: Unit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isAlreadySelected = selectedForCompare.some(u => u.id === unit.id);
    if (isAlreadySelected) {
      setSelectedForCompare(prev => prev.filter(u => u.id !== unit.id));
    } else {
      if (selectedForCompare.length >= 3) {
        setCompareLimitWarning(t('units.compare.limit'));
        setTimeout(() => setCompareLimitWarning(null), 3500);
        return;
      }
      setSelectedForCompare(prev => [...prev, unit]);
    }
  };

  // Real-time market assessment stats for the filtered compound
  const compoundMarketBrief = React.useMemo(() => {
    if (!compoundFilter) return null;
    const match = units.filter(u => u.compound.toLowerCase().includes(compoundFilter.toLowerCase()));
    if (match.length === 0) return null;
    const prices = match.map(u => Number(u.price) || 0).filter(p => p > 0).sort((a, b) => a - b);
    const minP = prices[0] || 0;
    const maxP = prices[prices.length - 1] || 0;
    const avgP = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const meterPrices = match.map(u => {
      const p = Number(u.price) || 0;
      const s = Number(u.size) || 0;
      return s > 0 && p > 0 ? Math.round(p / s) : 0;
    }).filter(pm => pm > 0);
    const avgMeter = meterPrices.length > 0 ? Math.round(meterPrices.reduce((a, b) => a + b, 0) / meterPrices.length) : 0;

    return {
      name: match[0].compound,
      count: match.length,
      minPriceFormatted: `${(minP / 1000000).toFixed(1)}M`,
      maxPriceFormatted: `${(maxP / 1000000).toFixed(1)}M`,
      avgPriceFormatted: `${(avgP / 1000000).toFixed(1)}M`,
      avgMeterFormatted: formatNumber(avgMeter)
    };
  }, [units, compoundFilter]);

  const densityStyles = {
    compact: {
      th: 'py-2 px-3 text-[10px]',
      td: 'py-2 px-3 text-[11px]',
      badge: 'px-2 py-0.5 text-[10px]'
    },
    normal: {
      th: 'py-3 px-4 text-[11px]',
      td: 'py-3.5 px-4 text-xs',
      badge: 'px-2.5 py-1 text-xs'
    },
    spacious: {
      th: 'py-4 px-5 text-xs',
      td: 'py-5 px-5 text-sm',
      badge: 'px-3 py-1.5 text-xs'
    }
  }[tableDensity];

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentUnits = filteredUnits.slice(startIndex, startIndex + pageSize);

  const unitTypes = Array.from(new Set(units.map(u => u.unitType).filter(Boolean)));
  const areas = Array.from(new Set(units.map(u => u.area).filter(Boolean)));
  const compounds = Array.from(new Set(units.map(u => u.compound).filter(Boolean)));

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('avail') || s.includes('متاح')) { // i18n-allow
      return (
        <Badge variant="success" size="sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t(UNIT_STATUS_LABEL.Available)}
        </Badge>
      );
    }
    if (s.includes('reserv') || s.includes('حجز') || s.includes('محجوز')) { // i18n-allow
      return (
        <Badge variant="warning" size="sm">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          {t(UNIT_STATUS_LABEL.Reserved)}
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="sm">
        <span className="w-1.5 h-1.5 rounded-full bg-surface-raised" />
        {t(UNIT_STATUS_LABEL.Sold)}
      </Badge>
    );
  };

  const renderQuickStatusControl = (u: Unit, isCard = false) => {
    const isOpen = openQuickStatusUnitId === u.id;
    const currentStatus = (u.status || '').toLowerCase();

    return (
      <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpenQuickStatusUnitId(isOpen ? null : u.id);
          }}
          className={`group/status inline-flex items-center gap-1.5 rounded-lg border transition cursor-pointer ${
            isOpen ? 'ring-2 ring-blue-500/50 bg-surface-raised' : ''
          } ${isCard ? 'p-1 bg-surface border-border hover:border-border hover:bg-surface-raised' : 'p-0.5 border-transparent hover:border-border hover:bg-surface-raised'}`}
          title={t('units.quickStatus.hint')}
        >
          {getStatusBadge(u.status)}
          <ChevronDown className="w-3 h-3 text-text-muted group-hover/status:text-white transition" />
        </button>

        {isOpen && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-1.5 z-50 bg-surface border border-border rounded-xl shadow-2xl p-1.5 w-48 space-y-1 animate-fade-in"
          >
            <div className="px-2 py-1 text-[10px] font-bold text-text-muted border-b border-border flex items-center justify-between">
              <span>{t('units.quickStatus.title')}</span>
              <span className="text-accent font-mono text-[9px]">{u.id}</span>
            </div>

            {STATUS_OPTIONS.map((st) => {
              const isSelected = currentStatus.includes(st.key.toLowerCase()) || 
                (st.key === 'Available' && currentStatus.includes('متاح')) || // i18n-allow
                (st.key === 'Reserved' && (currentStatus.includes('محجوز') || currentStatus.includes('حجز'))) || // i18n-allow
                (st.key === 'Sold' && (currentStatus.includes('مباع') || currentStatus.includes('بيع'))); // i18n-allow

              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={(e) => handleQuickStatusChange(u, st.key, e)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? st.key === 'Available' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : st.key === 'Reserved'
                        ? 'bg-accent text-accent border border-accent'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'text-text-muted hover:bg-surface-raised hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                    <span>{t(st.labelKey)}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const exportToCSV = () => {
    const headers = ['Unit ID', 'Status', 'Compound', 'Area', 'Property Type', 'Bedrooms', 'Area (m²)', 'Asking Price', 'Delivery', 'Agent'];
    const rows = filteredUnits.map(u => [
      `"${u.id}"`,
      `"${u.status}"`,
      `"${(u.compound || '').replace(/"/g, '""')}"`,
      `"${(u.area || '').replace(/"/g, '""')}"`,
      `"${(u.unitType || u.propertyType || '').replace(/"/g, '""')}"`,
      u.beds,
      u.size,
      u.price,
      `"${u.deliveryDate || 'Ready'}"`,
      `"${u.agent || 'Ahmed Aly'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Units_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm flex flex-col text-card-foreground">
      {/* Controls & Filter Header */}
      <div className="p-4 border-b border-card-border space-y-3 bg-card/80 backdrop-blur">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('units.search.placeholder')}
              className="w-full bg-card border border-input rounded-xl ps-10 pe-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition"
            />
          </div>

          {/* Action Buttons & View Mode Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Table / Cards View Switcher */}
            <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'table' ? 'bg-primary text-primary-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                title={t('units.view.table')}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'cards' ? 'bg-primary text-primary-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                title={t('units.view.cards')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Compare Units Button */}
            <Button
              variant={selectedForCompare.length > 0 ? 'accent' : 'outline'}
              size="sm"
              onClick={() => {
                if (selectedForCompare.length > 0) {
                  setIsComparisonModalOpen(true);
                } else {
                  setCompareLimitWarning(t('units.compare.selectFirst'));
                  setTimeout(() => setCompareLimitWarning(null), 3500);
                }
              }}
              title={t('units.compare.titleHint')}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{t('units.compare.button')}</span>
              {selectedForCompare.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-primary-950 text-accent">
                  {selectedForCompare.length}/3
                </span>
              )}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewModal}
            >
              <Plus className="w-4 h-4" />
              <span>{t('units.addUnit')}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              title="Export filtered units to CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('units.export')}</span>
            </Button>

            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 rounded-lg text-xs sm:text-sm transition"
                title="Open connected Google Sheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">{t('units.sheet')}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap gap-2 pt-1 items-center">
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('units.filters.label')}</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-border text-text-muted rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">{t('units.filters.allStatuses')}</option>
            {STATUS_OPTIONS.map(({ key, labelKey }) => (
              <option key={key} value={key}>{isArabic ? `${key} (${t(labelKey)})` : t(labelKey)}</option>
            ))}
          </select>

          {/* Compound Filter */}
          {setCompoundFilter && (
            <select
              value={compoundFilter}
              onChange={(e) => {
                setCompoundFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-surface border border-border text-text-muted rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer max-w-[180px] truncate"
            >
              <option value="">{t('units.filters.allCompounds')}</option>
              {compounds.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Quick Price Distribution & Market Assessment Button */}
          <button
            onClick={() => onOpenCompoundAnalysis && onOpenCompoundAnalysis(compoundFilter || undefined)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              compoundFilter
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 hover:bg-blue-600/30 shadow-sm shadow-blue-500/20'
                : 'bg-surface hover:bg-surface-raised text-text-muted border-border'
            }`}
            title={t('units.priceDist.hint')}
          >
            <BarChart3 className="w-3.5 h-3.5 text-accent" />
            <span>
              {compoundFilter 
                ? t('units.priceDist.rangeFor', { compound: compoundFilter })
                : t('units.priceDist.range')}
            </span>
          </button>

          {/* Area Filter */}
          <select
            value={areaFilter}
            onChange={(e) => {
              setAreaFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-border text-text-muted rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer max-w-[190px] truncate"
          >
            <option value="">{t('units.filters.allAreas')}</option>
            {areas.map((a, i) => (
              <option key={i} value={a}>{a}</option>
            ))}
          </select>

          {/* Unit Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-border text-text-muted rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer max-w-[170px] truncate"
          >
            <option value="">{t('units.filters.allTypes')}</option>
            {unitTypes.map((t, i) => (
              <option key={i} value={t}>{t}</option>
            ))}
          </select>

          {(searchQuery || statusFilter || areaFilter || typeFilter || compoundFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setAreaFilter('');
                setTypeFilter('');
                if (setCompoundFilter) setCompoundFilter('');
                setCurrentPage(1);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4 cursor-pointer ml-auto"
            >
              {t('units.filters.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Compound Price Range & Market Evaluation Summary Banner */}
      {compoundFilter && compoundMarketBrief && (
        <div className="mx-4 mt-3 mb-1 p-3 bg-gradient-to-r from-blue-950/70 via-surface to-indigo-950/60 border border-blue-500/30 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-white text-sm">{compoundMarketBrief.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {t('units.market.badge')}
                </span>
              </div>
              <div className="text-text-muted text-[11px] mt-1 flex items-center gap-3 flex-wrap">
                <span>
                  {t('units.market.priceBand')}{' '}
                  <strong className="text-accent font-extrabold">
                    {compoundMarketBrief.minPriceFormatted} ↔ {compoundMarketBrief.maxPriceFormatted}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  {t('units.market.avgPerMeter')}{' '}
                  <strong className="text-blue-300 font-bold">{compoundMarketBrief.avgMeterFormatted} {t('units.market.egpPerM2')}</strong>
                </span>
                <span>•</span>
                <span>
                  {t('units.market.supply')}{' '}
                  <strong className="text-white">{compoundMarketBrief.count} {t('units.market.units')}</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenCompoundAnalysis && onOpenCompoundAnalysis(compoundFilter)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-500/30 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <BarChart3 className="w-3.5 h-3.5 text-accent" />
            <span>{t('units.market.viewCharts')}</span>
          </button>
        </div>
      )}

      {/* Table Mode */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border font-semibold text-text-muted uppercase tracking-wider">
                <th className={`${densityStyles.th} text-center w-12`} title={t('units.compare.select')}>
                  <ArrowRightLeft className="w-3.5 h-3.5 mx-auto text-accent" />
                </th>
                <th className={densityStyles.th}>{t('units.th.unitId')}</th>
                <th className={densityStyles.th}>{t('units.th.status')}</th>
                <th className={densityStyles.th}>{t('units.th.compound')}</th>
                <th className={densityStyles.th}>{t('units.th.area')}</th>
                <th className={densityStyles.th}>{t('units.th.type')}</th>
                <th className={`${densityStyles.th} text-center`}>{t('units.th.beds')}</th>
                <th className={`${densityStyles.th} text-center`}>{t('units.th.size')}</th>
                <th className={`${densityStyles.th} text-right`}>{t('units.askingPrice')}</th>
                <th className={densityStyles.th}>{t('units.th.delivery')}</th>
                <th className={densityStyles.th}>{t('units.th.agent')}</th>
                <th className={`${densityStyles.th} text-center`}>{t('units.th.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentUnits.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-text-muted">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Layers className="w-8 h-8 text-text-muted mx-auto" />
                      <p className="font-medium text-text-muted">
                        {t('units.empty.tableTitle')}
                      </p>
                      <p className="text-xs text-text-muted">
                        {t('units.empty.tableHint')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentUnits.map((u) => (
                  <tr 
                    key={u.id}
                    className={`hover:bg-surface-raised transition group cursor-pointer ${
                      selectedForCompare.some(item => item.id === u.id) ? 'bg-accent border-l-2 border-accent' : ''
                    }`}
                    onClick={() => onSelectUnit(u)}
                  >
                    <td className={`${densityStyles.td} text-center`} onClick={(e) => e.stopPropagation()}>
                      <label 
                        className="flex items-center justify-center cursor-pointer p-0.5" 
                        title={t('units.compare.selectHint')}
                      >
                        <input
                          type="checkbox"
                          checked={selectedForCompare.some(item => item.id === u.id)}
                          onChange={() => handleToggleCompare(u)}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0 bg-surface cursor-pointer transition accent-accent"
                        />
                      </label>
                    </td>
                    <td className={`${densityStyles.td} font-bold text-accent font-mono whitespace-nowrap`}>
                      {u.id}
                    </td>
                    <td className={`${densityStyles.td} whitespace-nowrap`}>
                      {renderQuickStatusControl(u, false)}
                    </td>
                    <td className={`${densityStyles.td} font-semibold text-text whitespace-nowrap`}>
                      {u.compound}
                    </td>
                    <td className={`${densityStyles.td} text-text-muted whitespace-nowrap`}>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-text-muted" />
                        {u.area}
                      </span>
                    </td>
                    <td className={`${densityStyles.td} text-text-muted whitespace-nowrap`}>
                      <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">
                        {u.unitType}
                      </span>
                    </td>
                    <td className={`${densityStyles.td} text-center font-semibold text-text-muted whitespace-nowrap`}>
                      {u.beds !== '-' ? `${u.beds} Beds` : '-'}
                    </td>
                    <td className={`${densityStyles.td} text-center text-text-muted whitespace-nowrap`}>
                      {u.size !== '-' ? `${u.size} m²` : '-'}
                    </td>
                    <td className={`${densityStyles.td} text-right font-bold text-white whitespace-nowrap`}>
                      {formatNumber(u.price)} <span className="text-[11px] text-accent font-normal">{u.currency}</span>
                    </td>
                    <td className={`${densityStyles.td} text-text-muted whitespace-nowrap`}>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-text-muted" />
                        {u.deliveryDate || 'Ready'}
                      </span>
                    </td>
                    <td className={`${densityStyles.td} text-text-muted whitespace-nowrap`}>
                      <span className="inline-flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-text-muted" />
                        {u.agent || 'Ahmed Aly'}
                      </span>
                    </td>
                    <td className={`${densityStyles.td} text-center`} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {onExportQuotation && (
                          <button
                            onClick={() => onExportQuotation(u)}
                            className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition cursor-pointer"
                            title={t('units.actions.exportQuotation')}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onSelectUnit(u)}
                          className="p-1.5 rounded-lg bg-surface-raised hover:bg-accent text-text-muted hover:text-accent border border-border transition cursor-pointer"
                          title={t('units.actions.qr')}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectUnit(u)}
                          className="p-1.5 rounded-lg bg-surface-raised hover:bg-blue-600/30 text-text-muted hover:text-blue-300 border border-border transition cursor-pointer"
                          title={t('units.actions.details')}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards View Mode (Matching Reference Template) */
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentUnits.length === 0 ? (
            <div className="col-span-full py-12 text-center text-text-muted">
              <Layers className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p>{t('units.empty.cards')}</p>
            </div>
          ) : (
            currentUnits.map((u) => (
              <div
                key={u.id}
                onClick={() => onSelectUnit(u)}
                className={`bg-surface border ${
                  selectedForCompare.some(item => item.id === u.id)
                    ? 'border-accent ring-1 ring-accent bg-accent'
                    : 'border-border hover:border-blue-500/40'
                } rounded-xl p-4 flex flex-col justify-between gap-3 transition cursor-pointer shadow-sm hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-accent text-xs">{u.id}</span>
                    {onExportQuotation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportQuotation(u);
                        }}
                        className="p-1 rounded bg-blue-900/30 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-800/60 transition cursor-pointer"
                        title={t('units.actions.exportPriceQuotation')}
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUnit(u);
                      }}
                      className="p-1 rounded bg-surface hover:bg-accent text-text-muted hover:text-accent border border-border transition cursor-pointer"
                      title={t('units.actions.qr')}
                    >
                      <QrCode className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label 
                      onClick={(e) => e.stopPropagation()} 
                      className="flex items-center gap-1 cursor-pointer p-0.5 rounded hover:bg-surface-raised transition"
                      title={t('units.compare.selectLabel')}
                    >
                      <input
                        type="checkbox"
                        checked={selectedForCompare.some(item => item.id === u.id)}
                        onChange={() => handleToggleCompare(u)}
                        className="w-3.5 h-3.5 rounded border-border text-accent accent-accent bg-surface cursor-pointer"
                      />
                      <span className="text-[10px] text-text-muted font-medium">
                        {t('units.compare.short')}
                      </span>
                    </label>
                    {renderQuickStatusControl(u, true)}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-text text-sm tracking-tight">{u.compound}</div>
                  <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-text-muted" />
                    <span>{u.area}</span>
                    <span>&bull;</span>
                    <span>{u.unitType}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted pt-1 border-t border-border">
                  <span className="flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-text-muted" />
                    {u.beds} Beds
                  </span>
                  <span className="flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-text-muted" />
                    {u.size} m²
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {u.deliveryDate || 'Ready'}
                  </span>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-text-muted block">
                      {t('units.askingPrice')}
                    </span>
                    <div className="font-bold text-white text-sm">
                      {formatNumber(u.price)} <span className="text-[11px] text-accent font-normal">{u.currency}</span>
                    </div>
                  </div>

                  {/* Dedicated Quick Status Change Button on Card */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenQuickStatusUnitId(openQuickStatusUnitId === u.id ? null : u.id);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shadow-sm ${
                        openQuickStatusUnitId === u.id
                          ? 'bg-accent text-text border-accent font-bold ring-2 ring-accent'
                          : 'bg-surface hover:bg-surface-raised border-border text-text-muted hover:text-white hover:border-border'
                      }`}
                      title={t('units.quickStatus.hintCard')}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        (u.status || '').toLowerCase().includes('avail') || (u.status || '').includes('متاح') // i18n-allow
                          ? 'bg-emerald-400'
                          : (u.status || '').toLowerCase().includes('reser') || (u.status || '').includes('محجوز') // i18n-allow
                          ? 'bg-accent'
                          : 'bg-blue-400'
                      }`} />
                      <span>{t('units.quickStatus.short')}</span>
                      <ChevronDown className={`w-3 h-3 transition ${openQuickStatusUnitId === u.id ? 'rotate-180 text-text' : 'text-text-muted'}`} />
                    </button>

                    {openQuickStatusUnitId === u.id && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-full right-0 mb-1.5 z-50 bg-surface border border-border rounded-xl shadow-2xl p-1.5 w-48 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="px-2 py-1 text-[10px] font-bold text-text-muted border-b border-border flex items-center justify-between">
                          <span>{t('units.quickStatus.title')}</span>
                          <span className="text-accent font-mono text-[9px]">{u.id}</span>
                        </div>

                        {STATUS_OPTIONS.map((st) => {
                          const currentStatus = (u.status || '').toLowerCase();
                          const isSelected = currentStatus.includes(st.key.toLowerCase()) || 
                            (st.key === 'Available' && currentStatus.includes('متاح')) || // i18n-allow
                            (st.key === 'Reserved' && (currentStatus.includes('محجوز') || currentStatus.includes('حجز'))) || // i18n-allow
                            (st.key === 'Sold' && (currentStatus.includes('مباع') || currentStatus.includes('بيع'))); // i18n-allow

                          return (
                            <button
                              key={st.key}
                              type="button"
                              onClick={(e) => handleQuickStatusChange(u, st.key, e)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                isSelected
                                  ? st.key === 'Available' 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' 
                                    : st.key === 'Reserved'
                                    ? 'bg-accent text-accent border border-accent font-bold'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold'
                                  : 'text-text-muted hover:bg-surface-raised hover:text-white border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                                <span>{t(st.labelKey)}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-border bg-surface flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
        <div>
          <span>
            {t('units.pagination.showing')} <strong className="text-text">{filteredUnits.length > 0 ? startIndex + 1 : 0}</strong> {t('units.pagination.to')}{' '}
            <strong className="text-text">{Math.min(startIndex + pageSize, filteredUnits.length)}</strong> {t('units.pagination.of')}{' '}
            <strong className="text-text">{filteredUnits.length}</strong> {t('units.pagination.units')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-surface text-text-muted disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-raised transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('units.pagination.prev')}</span>
          </button>
          
          <span className="px-2.5 font-bold text-text">
            {currentPage}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-surface text-text-muted disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-raised transition cursor-pointer"
          >
            <span>{t('units.pagination.next')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Comparison Dock Bar */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-surface border border-accent rounded-2xl shadow-2xl p-3 sm:px-4 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-x-auto py-0.5">
              <div className="p-2 rounded-xl bg-accent text-accent shrink-0">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {selectedForCompare.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-xs shadow-sm"
                  >
                    <span className="font-mono font-bold text-accent">{u.id}</span>
                    <span className="text-text-muted truncate max-w-[90px]">{u.compound.split(' ')[0]}</span>
                    <button
                      onClick={() => handleToggleCompare(u)}
                      className="text-text-muted hover:text-rose-400 p-0.5 transition cursor-pointer"
                      title={t('units.compare.remove')}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setSelectedForCompare([])}
                className="text-xs text-text-muted hover:text-text px-2.5 py-1.5 transition cursor-pointer"
              >
                {t('units.compare.clearAll')}
              </button>

              <button
                onClick={() => setIsComparisonModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent hover:from-accent hover:to-accent text-text font-extrabold text-xs shadow-lg shadow-accent/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-text" />
                <span>
                  {t('units.compare.now', { n: selectedForCompare.length })}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Warning Toast */}
      {compareLimitWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-accent text-text px-4 py-2 rounded-xl shadow-xl font-bold text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-text shrink-0" />
          <span>{compareLimitWarning}</span>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      <UnitComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        units={selectedForCompare}
        onRemoveUnit={(unitId) => setSelectedForCompare(prev => prev.filter(u => u.id !== unitId))}
        onSelectUnitForDetails={(unit) => {
          setIsComparisonModalOpen(false);
          onSelectUnit(unit);
        }}
        onExportQuotation={onExportQuotation}
        isArabic={isArabic}
        theme={theme}
        allUnits={filteredUnits}
        onAddUnitToCompare={(unit) => {
          if (selectedForCompare.length < 3 && !selectedForCompare.some(u => u.id === unit.id)) {
            setSelectedForCompare(prev => [...prev, unit]);
          }
        }}
      />
    </div>
  );
};
