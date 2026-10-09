import { formatNumber } from '../i18n/format';
import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  TrendingUp, 
  Sparkles,
  Wallet,
  Filter,
  Check,
  X,
  CalendarCheck,
  RefreshCw,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';
import { SalesContract, INITIAL_CONTRACTS, calculateContractExpiryInfo, ContractType } from '../data/mockContracts';
import { Unit, TeamMember, FollowUpTask } from '../types';
import { computeCommission, aggregateContractMetrics, buildAgentLedgers } from '../lib/commissions';
import { STORAGE_KEYS, loadJson, saveJson } from '../data/storage';

interface ContractsAndCommissionsProps {
  contracts?: SalesContract[];
  onUpdateContracts?: (contracts: SalesContract[]) => void;
  units?: Unit[];
  team?: TeamMember[];
  tasks?: FollowUpTask[];
  onAddTask?: (task: FollowUpTask) => void;
  isArabic: boolean;
  theme?: 'dark' | 'light';
}

export const ContractsAndCommissions: React.FC<ContractsAndCommissionsProps> = ({
  contracts: propContracts,
  onUpdateContracts,
  team = [],
  onAddTask,
  isArabic,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  // Contracts State (synced to local storage)
  const [contracts, setContracts] = useState<SalesContract[]>(() => {
    if (propContracts && propContracts.length > 0) return propContracts;
    return loadJson<SalesContract[] | null>(STORAGE_KEYS.contracts, null) || INITIAL_CONTRACTS;
  });

  const saveContracts = (updated: SalesContract[]) => {
    setContracts(updated);
    if (onUpdateContracts) onUpdateContracts(updated);
    try {
      saveJson(STORAGE_KEYS.contracts, updated);
    } catch (e) {}
  };

  // View state
  const [activeTab, setActiveTab] = useState<'contracts' | 'agents'>('contracts');
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Default expiry date 1 year from today
  const getDefaultExpiryDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  };

  // New Contract Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formContractNum, setFormContractNum] = useState(`6O-2026-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [formUnitId, setFormUnitId] = useState('');
  const [formCompound, setFormCompound] = useState('Mountain View iCity');
  const [formArea, setFormArea] = useState('6 October');
  const [formClientName, setFormClientName] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formDealValue, setFormDealValue] = useState('7500000');
  const [formClosingDate, setFormClosingDate] = useState(new Date().toISOString().slice(0, 10));
  const [formExpiryDate, setFormExpiryDate] = useState(getDefaultExpiryDate());
  const [formContractType, setFormContractType] = useState<ContractType>('exclusive_marketing');
  const [formAgentName, setFormAgentName] = useState(team[0]?.name || 'سارة نبيل');
  const [formCommissionRate, setFormCommissionRate] = useState('2.5');
  const [formAgentShareRate, setFormAgentShareRate] = useState('50');
  const [formStatus, setFormStatus] = useState<'paid' | 'approved' | 'pending'>('pending');
  const [formNotes, setFormNotes] = useState('');

  // Selected Voucher for Quick Print/Preview
  const [selectedVoucher, setSelectedVoucher] = useState<SalesContract | null>(null);

  // Proactive Alerts Analysis (<= 7 days expiration)
  const expiryAnalysis = useMemo(() => {
    let expiringCount = 0;
    let expiredCount = 0;
    const expiringList: SalesContract[] = [];
    const expiredList: SalesContract[] = [];

    contracts.forEach(c => {
      const info = calculateContractExpiryInfo(c.expiryDate);
      if (info.isExpiringSoon) {
        expiringCount++;
        expiringList.push(c);
      } else if (info.isExpired) {
        expiredCount++;
        expiredList.push(c);
      }
    });

    return {
      expiringCount,
      expiredCount,
      expiringList,
      expiredList
    };
  }, [contracts]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Quick Renew Contract for 1 Year (+365 days)
  const handleQuickRenew = (contractId: string, months = 12) => {
    const updated = contracts.map(c => {
      if (c.id === contractId) {
        const baseDate = c.expiryDate && !calculateContractExpiryInfo(c.expiryDate).isExpired
          ? new Date(c.expiryDate)
          : new Date();
        baseDate.setMonth(baseDate.getMonth() + months);
        const newExpiry = baseDate.toISOString().slice(0, 10);
        return {
          ...c,
          expiryDate: newExpiry,
          renewalStatus: 'renewed' as const,
          notes: `${c.notes || ''} [تم التجديد التلقائي لـ ${months} شهر حتى ${newExpiry}]`
        };
      }
      return c;
    });

    saveContracts(updated);
    showToast(isArabic ? '✅ تم تجديد العقد بنجاح لمدة سنة إضافية وتحديث تاريخ الانتهاء' : 'Contract renewed successfully for 1 year');
  };

  // Create follow-up task directly into Kanban for sales agent
  const handleCreateRenewalTask = (contract: SalesContract) => {
    const info = calculateContractExpiryInfo(contract.expiryDate);
    const newTask: FollowUpTask = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      title: isArabic 
        ? `متابعة تجديد عقد ${contract.contractNumber} (${contract.clientName})`
        : `Renew Contract ${contract.contractNumber} (${contract.clientName})`,
      clientName: contract.clientName,
      clientPhone: contract.clientPhone,
      unitId: contract.unitId,
      compound: contract.compound,
      dealValue: contract.dealValue,
      stage: 'negotiation',
      type: 'contract',
      category: 'contract',
      unitNature: contract.contractType === 'rent' ? 'rent' : 'sale',
      priority: 'urgent',
      dueDate: contract.expiryDate || new Date().toISOString().slice(0, 10),
      dueTime: '11:00',
      agent: contract.agentName || 'سارة نبيل',
      notes: isArabic
        ? `تنبيه مدير المبيعات: العقد الموثق رقم ${contract.contractNumber} ينتهي ${info.labelAr}. مطلوب التواصل المباشر مع العميل والمالك لتوقيع ملحق التجديد لضمان استحقاق العمولة (${formatNumber(contract.agentCommissionAmount || 0)} ج.م).`
        : `Sales Manager Alert: Contract ${contract.contractNumber} expires ${info.labelEn}. Contact client for renewal extension.`,
      createdAt: new Date().toISOString()
    };

    if (onAddTask) {
      onAddTask(newTask);
    } else {
      try {
        const list = loadJson<FollowUpTask[]>(STORAGE_KEYS.tasks, []);
        saveJson(STORAGE_KEYS.tasks, [newTask, ...list]);
      } catch (e) {}
    }

    showToast(isArabic 
      ? `📋 تم إنشاء مهمة متابعة عاجلة للمستشار (${contract.agentName}) في لوحة الكانبان!`
      : `Follow-up task created in Kanban for ${contract.agentName}!`);
  };

  // Available Agents
  const agentNames = useMemo(() => {
    const fromTeam = team.map(t => t.name);
    const fromContracts = contracts.map(c => c.agentName);
    return Array.from(new Set([...fromTeam, ...fromContracts])).filter(Boolean);
  }, [team, contracts]);

  // Computed Financial Metrics
  const metrics = useMemo(() => aggregateContractMetrics(contracts), [contracts]);

  // Agent Performance Ledgers
  const agentLedgers = useMemo(() => buildAgentLedgers(contracts, agentNames), [contracts, agentNames]);

  // Filtered Contracts
  const filteredContracts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return contracts.filter(c => {
      if (q) {
        const matchesClient = c.clientName.toLowerCase().includes(q);
        const matchesUnit = c.unitId.toLowerCase().includes(q);
        const matchesCompound = c.compound.toLowerCase().includes(q);
        const matchesAgent = c.agentName.toLowerCase().includes(q);
        const matchesNum = c.contractNumber.toLowerCase().includes(q);
        if (!matchesClient && !matchesUnit && !matchesCompound && !matchesAgent && !matchesNum) {
          return false;
        }
      }
      if (agentFilter !== 'all' && c.agentName !== agentFilter) return false;
      
      // Status & Expiry Filter
      if (statusFilter === 'expiring_7d') {
        const info = calculateContractExpiryInfo(c.expiryDate);
        if (!info.isExpiringSoon) return false;
      } else if (statusFilter === 'expired') {
        const info = calculateContractExpiryInfo(c.expiryDate);
        if (!info.isExpired) return false;
      } else if (statusFilter === 'active') {
        const info = calculateContractExpiryInfo(c.expiryDate);
        if (info.isExpired) return false;
      } else if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [contracts, searchQuery, agentFilter, statusFilter]);

  // Update Contract Status
  const handleUpdateStatus = (contractId: string, newStatus: 'paid' | 'approved' | 'pending') => {
    const updated = contracts.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          status: newStatus,
          paymentDate: newStatus === 'paid' ? new Date().toISOString().slice(0, 10) : c.paymentDate
        };
      }
      return c;
    });
    saveContracts(updated);
  };

  // Create Contract
  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    const dealVal = Number(formDealValue) || 0;
    const comm = computeCommission(dealVal, Number(formCommissionRate) || 2.5, Number(formAgentShareRate) || 50);

    const newContract: SalesContract = {
      id: `CNT-${Date.now().toString().slice(-4)}`,
      contractNumber: formContractNum.trim() || `6O-2026-${Date.now().toString().slice(-3)}`,
      unitId: formUnitId.trim() || 'S-0099',
      compound: formCompound.trim() || '6 October',
      area: formArea.trim() || '6 October',
      clientName: formClientName.trim(),
      clientPhone: formClientPhone.trim() || undefined,
      dealValue: dealVal,
      closingDate: formClosingDate,
      expiryDate: formExpiryDate,
      contractType: formContractType,
      agentName: formAgentName,
      commissionRate: comm.commissionRate,
      totalCommission: comm.totalCommission,
      agentShareRate: comm.agentShareRate,
      agentCommissionAmount: comm.agentCommissionAmount,
      status: formStatus,
      paymentDate: formStatus === 'paid' ? new Date().toISOString().slice(0, 10) : undefined,
      notes: formNotes.trim() || undefined
    };

    saveContracts([newContract, ...contracts]);
    setIsNewModalOpen(false);
    setFormClientName('');
    setFormClientPhone('');
    setFormUnitId('');
    setFormNotes('');
    showToast(isArabic ? '✅ تم توثيق العقد الجديد وحفظ تاريخ الانتهاء بنجاح' : 'Contract documented successfully');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Contract #', 'Unit ID', 'Compound', 'Client Name', 
      'Deal Value (EGP)', 'Closing Date', 'Agent', 
      'Commission %', 'Total Commission', 'Agent Share %', 
      'Agent Commission', 'Payout Status'
    ];
    const rows = contracts.map(c => [
      `"${c.contractNumber}"`,
      `"${c.unitId}"`,
      `"${c.compound}"`,
      `"${c.clientName}"`,
      c.dealValue,
      c.closingDate,
      `"${c.agentName}"`,
      `${c.commissionRate}%`,
      c.totalCommission,
      `${c.agentShareRate}%`,
      c.agentCommissionAmount,
      c.status
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-contracts-commissions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Ribbon */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isDark ? 'bg-surface border-border' : 'bg-white border-border'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-600 to-accent text-white shadow-lg shadow-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-text'}`}>
                {isArabic ? 'إدارة عقود البيع وحساب عمولات الوكلاء' : 'Sales Contracts & Agent Commissions Engine'}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1 font-mono">
                <Sparkles className="w-2.5 h-2.5" />
                Ledger v2.0
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
              {isArabic 
                ? 'توثيق صفقات البيع المكتملة، حساب نسب عمولة الوكالة (2.5%)، وتوزيع مستحقات فريق الوسطاء وتتبع الصرف' 
                : 'Track closed contracts, auto-calculate 2.5% commissions, distribute broker splits and monitor payouts'}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isArabic ? 'تسجيل عقد بيع جديد' : '+ New Contract'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition cursor-pointer ${
              isDark ? 'bg-surface border-border text-text-muted hover:bg-surface-raised' : 'bg-surface-raised border-border text-text hover:bg-surface-raised'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isArabic ? 'تصدير كشف العمولات' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition cursor-pointer ${
              isDark ? 'bg-surface border-border text-text-muted hover:bg-surface-raised' : 'bg-surface-raised border-border text-text hover:bg-surface-raised'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isArabic ? 'طباعة' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Temporary Toast Message */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-text-muted hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PROACTIVE CONTRACT EXPIRATION ALERT SYSTEM FOR SALES MANAGERS */}
      {expiryAnalysis.expiringCount > 0 && (
        <div className={`p-4 sm:p-5 rounded-2xl border transition duration-200 shadow-xl ${
          isDark 
            ? 'bg-gradient-to-r from-accent via-surface to-rose-950/30 border-accent shadow-accent/20' 
            : 'bg-accent border-accent text-text'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-accent">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent text-accent border border-accent animate-pulse">
                <AlertTriangle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                    <span>{isArabic ? 'نظام التنبيهات الاستباقي لمديري المبيعات' : 'Sales Manager Proactive Contract Alert System'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold font-mono">
                      {expiryAnalysis.expiringCount} {isArabic ? 'عقود تنتهي خلال ≤ 7 أيام' : 'Expiring in ≤ 7 Days'}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-accent/80 mt-0.5">
                  {isArabic
                    ? 'إخطار استباقي قبل 7 أيام من انتهاء العقود الموثقة لضمان سرعة التجديد ومتابعة العمولات قبل انقضاء المهلة القانونية'
                    : 'Automated 7-day prior notification for managers to secure renewals and protect commission pipeline'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter(statusFilter === 'expiring_7d' ? 'all' : 'expiring_7d')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'expiring_7d'
                    ? 'bg-accent text-text border-accent shadow-md'
                    : 'bg-accent text-accent border-accent hover:bg-accent'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{statusFilter === 'expiring_7d' ? (isArabic ? 'عرض كل العقود' : 'Show All') : (isArabic ? 'تصفية العقود الموشكة فقط' : 'Filter Expiring Only')}</span>
              </button>
            </div>
          </div>

          {/* Expiring Contracts Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3.5">
            {expiryAnalysis.expiringList.map(contract => {
              const info = calculateContractExpiryInfo(contract.expiryDate);
              return (
                <div
                  key={contract.id}
                  className={`p-3.5 rounded-xl border space-y-2.5 transition relative ${
                    isDark ? 'bg-surface border-accent hover:border-accent' : 'bg-white border-accent shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-black text-accent block">{contract.contractNumber}</span>
                      <strong className="text-white text-xs block truncate mt-0.5">{contract.clientName}</strong>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold font-mono ${info.badgeColor}`}>
                      {info.labelAr}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border">
                    <div>
                      <span className="text-text-muted block text-[10px]">{isArabic ? 'الوحدة والمشروع:' : 'Unit:'}</span>
                      <span className="text-text font-semibold truncate block font-mono">{contract.unitId} ({contract.compound})</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px]">{isArabic ? 'المستشار المسؤول:' : 'Agent:'}</span>
                      <span className="text-blue-400 font-semibold truncate block">{contract.agentName}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px]">{isArabic ? 'تاريخ الانتهاء:' : 'Expiry Date:'}</span>
                      <span className="text-rose-400 font-mono font-bold block">{contract.expiryDate}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px]">{isArabic ? 'العمولة المستحقة:' : 'Commission:'}</span>
                      <span className="text-emerald-400 font-mono font-bold block">{formatNumber(contract.totalCommission)} ج.م</span>
                    </div>
                  </div>

                  {/* Quick Actions for Sales Manager */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                    <button
                      onClick={() => handleQuickRenew(contract.id, 12)}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                      title={isArabic ? 'تجديد العقد لمدة سنة إضافية (+365 يوم)' : 'Renew for 1 Year'}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isArabic ? 'تجديد (+سنة)' : 'Renew (+1y)'}</span>
                    </button>

                    <button
                      onClick={() => handleCreateRenewalTask(contract)}
                      className="flex-1 py-1.5 px-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg font-semibold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                      title={isArabic ? 'إنشاء مهمة متابعة وتجديد عاجلة للمستشار في الكانبان' : 'Create Follow-up in Kanban'}
                    >
                      <CalendarCheck className="w-3 h-3 text-blue-400" />
                      <span>{isArabic ? 'مهمة كانبان' : 'Kanban Task'}</span>
                    </button>

                    {contract.clientPhone && (
                      <a
                        href={`https://wa.me/${contract.clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          isArabic 
                            ? `مرحباً ${contract.clientName}، نود إحاطتكم بأن عقدكم رقم ${contract.contractNumber} للوحدة ${contract.unitId} يوشك على الانتهاء بتاريخ ${contract.expiryDate}. يسعدنا ترتيب إجراءات التجديد.`
                            : `Hello ${contract.clientName}, regarding contract ${contract.contractNumber}...`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                        title={isArabic ? 'مراسلة عبر واتساب' : 'WhatsApp'}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Closed Sales Volume */}
        <div className={`p-4 rounded-2xl border shadow-md space-y-2 ${
          isDark ? 'bg-surface border-border' : 'bg-white border-border'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-semibold">{isArabic ? 'إجمالي حجم الصفقات المغلقة:' : 'Closed Sales Volume:'}</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-text'}`}>
              {(metrics.totalVolume / 1000000).toFixed(2)}M
            </span>
            <span className="text-xs text-text-muted font-mono">EGP</span>
          </div>
          <span className="text-[11px] text-blue-400 font-semibold block">
            {metrics.totalDeals} {isArabic ? 'عقود بيع موثقة' : 'executed contracts'}
          </span>
        </div>

        {/* Agency Total Commission Pool */}
        <div className={`p-4 rounded-2xl border shadow-md space-y-2 ${
          isDark ? 'bg-surface border-border' : 'bg-white border-border'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-semibold">{isArabic ? 'إجمالي عمولات الوكالة:' : 'Agency Commission Pool:'}</span>
            <span className="p-2 rounded-xl bg-accent text-accent border border-accent">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-accent">
              {(metrics.totalAgencyCommission / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-text-muted font-mono">EGP</span>
          </div>
          <span className="text-[11px] text-accent font-semibold block">
            {isArabic ? 'متوسط نسبة العمولة: 2.5%' : 'Avg Rate: 2.5%'}
          </span>
        </div>

        {/* Paid to Agents */}
        <div className={`p-4 rounded-2xl border shadow-md space-y-2 ${
          isDark ? 'bg-surface border-border' : 'bg-white border-border'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-semibold">{isArabic ? 'عمولات تم صرفها للوسطاء:' : 'Paid to Agents:'}</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {(metrics.totalPaidToAgents / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-text-muted font-mono">EGP</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold block">
            {isArabic ? 'مستحقات مستلمة وموثقة' : 'Completed disbursements'}
          </span>
        </div>

        {/* Pending Commission Payouts */}
        <div className={`p-4 rounded-2xl border shadow-md space-y-2 ${
          isDark ? 'bg-surface border-border' : 'bg-white border-border'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-semibold">{isArabic ? 'مستحقات قيد الصرف والاعتماد:' : 'Pending Payouts:'}</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-purple-400">
              {(metrics.totalPendingPayouts / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-text-muted font-mono">EGP</span>
          </div>
          <span className="text-[11px] text-purple-400 font-semibold block">
            {isArabic ? 'بانتظار التحويل المالي' : 'Awaiting transfer'}
          </span>
        </div>
      </div>

      {/* Sub-Tabs: Contracts Register vs Agent Ledgers */}
      <div className={`p-3 rounded-2xl border shadow-md flex flex-wrap items-center justify-between gap-3 ${
        isDark ? 'bg-surface border-border' : 'bg-white border-border'
      }`}>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
              activeTab === 'contracts'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : isDark ? 'text-text-muted hover:text-white hover:bg-surface-raised' : 'text-text-muted hover:text-text hover:bg-surface-raised'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isArabic ? 'سجل عقود البيع والصفقات' : 'Sales Contracts Register'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-raised text-text-muted font-mono text-[10px]">
              {contracts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
              activeTab === 'agents'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : isDark ? 'text-text-muted hover:text-white hover:bg-surface-raised' : 'text-text-muted hover:text-text hover:bg-surface-raised'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isArabic ? 'سجل عمولات فريق العمل والوكلاء' : 'Agent Commission Ledgers'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-raised text-text-muted font-mono text-[10px]">
              {agentLedgers.length}
            </span>
          </button>
        </div>

        {/* Search & Filters */}
        {activeTab === 'contracts' && (
          <div className="flex flex-wrap items-center gap-2 text-xs w-full lg:w-auto">
            {/* Search Input */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border flex-1 sm:w-64 ${
              isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
            }`}>
              <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <input
                type="text"
                placeholder={isArabic ? 'بحث بالعميل، الوحدة، الكمبوند...' : 'Search contract, client...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-none"
              />
            </div>

            {/* Agent Filter */}
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-blue-500 ${
                isDark ? 'bg-surface border-border text-text-muted' : 'bg-surface border-border text-text'
              }`}
            >
              <option value="all">{isArabic ? 'كافة الوكلاء' : 'All Agents'}</option>
              {agentNames.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Status Filter */}
            {/* Status & Expiry Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-blue-500 ${
                isDark ? 'bg-surface border-border text-text-muted' : 'bg-surface border-border text-text'
              }`}
            >
              <option value="all">{isArabic ? 'كافة حالات العقود' : 'All Contracts'}</option>
              <option value="expiring_7d">{isArabic ? '⚠️ تنتهي خلال ≤ 7 أيام (تنبيه التجديد)' : '⚠️ Expiring in ≤ 7 Days'}</option>
              <option value="expired">{isArabic ? '❌ عقود منتهية الصلاحية' : '❌ Expired Contracts'}</option>
              <option value="active">{isArabic ? '✅ عقود سارية وموثقة' : '✅ Active Contracts'}</option>
              <option value="paid">{isArabic ? 'مدفوعة ومصروفة' : 'Paid'}</option>
              <option value="approved">{isArabic ? 'معتمدة للصرف' : 'Approved'}</option>
              <option value="pending">{isArabic ? 'قيد التدقيق' : 'Pending'}</option>
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: CONTRACTS REGISTER TABLE */}
      {activeTab === 'contracts' && (
        <div className={`rounded-2xl border shadow-xl overflow-x-auto ${
          isDark ? 'bg-surface border-border' : 'bg-white border-border'
        }`}>
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'bg-surface border-border text-text-muted' : 'bg-surface-raised border-border text-text-muted'
              }`}>
                <th className="py-3 px-4"># العقد والتاريخ</th>
                <th className="py-3 px-4">الوحدة والمشروع</th>
                <th className="py-3 px-4">طبيعة العقد</th>
                <th className="py-3 px-4">اسم المشتري / العميل</th>
                <th className="py-3 px-4">تاريخ الانتهاء والتنبيه (7 أيام)</th>
                <th className="py-3 px-4">قيمة الصفقة</th>
                <th className="py-3 px-4">المستشار العقاري</th>
                <th className="py-3 px-4">عمولة الوكالة (2.5%)</th>
                <th className="py-3 px-4">عمولة الوكيل (50%)</th>
                <th className="py-3 px-4">حالة الصرف</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-border text-text-muted' : 'divide-border text-text'
            }`}>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-text-muted">
                    {isArabic ? 'لا توجد عقود مسجلة مطابقة للفلاتر' : 'No contracts match your search'}
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => {
                  const expiryInfo = calculateContractExpiryInfo(c.expiryDate);
                  return (
                    <tr key={c.id} className={`transition ${
                      expiryInfo.isExpiringSoon 
                        ? (isDark ? 'bg-accent hover:bg-accent' : 'bg-accent hover:bg-accent') 
                        : (isDark ? 'hover:bg-surface-raised' : 'hover:bg-surface')
                    }`}>
                      {/* Contract # and Date */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`font-bold block ${isDark ? 'text-white' : 'text-text'}`}>{c.contractNumber}</span>
                        <span className="text-[10px] text-text-muted">{c.closingDate}</span>
                      </td>

                      {/* Unit & Compound */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="font-mono text-accent font-bold bg-accent px-1.5 py-0.5 rounded border border-accent">
                            {c.unitId}
                          </span>
                          <span className={`truncate max-w-[130px] ${isDark ? 'text-white' : 'text-text'}`}>{c.compound}</span>
                        </div>
                        <span className="text-[10px] text-text-muted">{c.area}</span>
                      </td>

                      {/* Contract Nature / Type */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                          c.contractType === 'rent'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : c.contractType === 'exclusive_marketing'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : c.contractType === 'brokerage_agreement'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {c.contractType === 'rent'
                            ? (isArabic ? '🔑 إيجار موثق' : 'Rent')
                            : c.contractType === 'exclusive_marketing'
                            ? (isArabic ? '⭐ تسويق حصري' : 'Exclusive')
                            : c.contractType === 'brokerage_agreement'
                            ? (isArabic ? '📜 اتفاقية وساطة' : 'Brokerage')
                            : (isArabic ? '🛒 بيع نهائي' : 'Sale')}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <strong className={`block ${isDark ? 'text-white' : 'text-text'}`}>{c.clientName}</strong>
                        {c.clientPhone && (
                          <span className="font-mono text-[10px] text-text-muted">{c.clientPhone}</span>
                        )}
                      </td>

                      {/* Expiry Date & 7-Day Alert Status */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="space-y-1">
                          <span className="font-bold text-white block text-xs">{c.expiryDate || '-'}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${expiryInfo.badgeColor}`}>
                            {expiryInfo.isExpiringSoon && <Clock className="w-2.5 h-2.5" />}
                            <span>{expiryInfo.labelAr}</span>
                          </span>
                        </div>
                      </td>

                      {/* Deal Value */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className="text-white text-sm">{formatNumber(c.dealValue)}</span>
                        <span className="text-[10px] text-text-muted block font-normal">ج.م</span>
                      </td>

                      {/* Agent */}
                      <td className="py-3.5 px-4 font-semibold text-blue-400">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 text-[9px] flex items-center justify-center font-bold text-blue-300">
                            {c.agentName.slice(0, 1)}
                          </span>
                          <span>{c.agentName}</span>
                        </div>
                      </td>

                      {/* Agency Commission */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-accent font-bold text-xs">{formatNumber(c.totalCommission)}</span>
                        <span className="text-[10px] text-text-muted block">({c.commissionRate}%)</span>
                      </td>

                      {/* Agent Commission */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-emerald-400 font-bold text-sm">{formatNumber(c.agentCommissionAmount)}</span>
                        <span className="text-[10px] text-text-muted block font-semibold text-text-muted">({c.agentShareRate}%)</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {c.status === 'paid' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isArabic ? 'تم الصرف ✓' : 'Paid'}</span>
                          </span>
                        )}
                        {c.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1 w-max">
                            <Check className="w-3 h-3" />
                            <span>{isArabic ? 'معتمدة للصرف' : 'Approved'}</span>
                          </span>
                        )}
                        {c.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent text-accent border border-accent flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3" />
                            <span>{isArabic ? 'قيد التدقيق' : 'Pending'}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Renew Button */}
                          <button
                            onClick={() => handleQuickRenew(c.id, 12)}
                            title={isArabic ? 'تجديد العقد لمدة سنة (+365 يوم)' : 'Renew 1 Year'}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Create Kanban Task */}
                          <button
                            onClick={() => handleCreateRenewalTask(c)}
                            title={isArabic ? 'إنشاء مهمة متابعة فورية في الكانبان للمستشار' : 'Create Kanban Follow-up'}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition cursor-pointer"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Toggle Status */}
                          {c.status !== 'paid' ? (
                            <button
                              onClick={() => handleUpdateStatus(c.id, 'paid')}
                              title={isArabic ? 'صرف العمولة للوكيل فوراً' : 'Disburse Payout'}
                              className="p-1.5 rounded-lg bg-accent hover:bg-accent text-accent border border-accent transition cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(c.id, 'approved')}
                              title={isArabic ? 'إرجاع الحالة لمعتمدة' : 'Revert to approved'}
                              className="p-1.5 rounded-lg bg-surface-raised hover:bg-surface-raised text-text-muted transition cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View / Print Voucher */}
                          <button
                            onClick={() => setSelectedVoucher(c)}
                            title={isArabic ? 'معاينة سند صرف العمولة' : 'View Commission Voucher'}
                            className="p-1.5 rounded-lg bg-surface-raised hover:bg-surface-raised text-text-muted border border-border transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: AGENT COMMISSIONS LEDGERS CARDS */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agentLedgers.map((agent, index) => {
            const rankLabel = index === 0 ? '🏆 Top Producer' : index === 1 ? '🥈 Senior Broker' : '🌟 Certified Advisor';
            const payoutPercent = agent.totalEarnedCommission > 0 
              ? Math.round((agent.paidCommission / agent.totalEarnedCommission) * 100) 
              : 100;

            return (
              <div
                key={agent.name}
                className={`p-4 rounded-2xl border shadow-lg space-y-4 transition hover:shadow-xl ${
                  isDark ? 'bg-surface border-border' : 'bg-white border-border'
                }`}
              >
                {/* Agent Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-accent text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {agent.name.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-text'}`}>{agent.name}</h4>
                      <span className="text-[10px] font-mono text-accent font-semibold">{rankLabel}</span>
                    </div>
                  </div>

                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-surface-raised text-text-muted font-bold">
                    {agent.dealsCount} {isArabic ? 'صفقات' : 'deals'}
                  </span>
                </div>

                {/* Performance Stats Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-surface border border-border space-y-0.5">
                    <span className="text-[10px] text-text-muted">{isArabic ? 'إجمالي المبيعات:' : 'Sales Volume:'}</span>
                    <strong className="text-white block font-mono">
                      {(agent.totalSalesVolume / 1000000).toFixed(2)}M EGP
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface border border-border space-y-0.5">
                    <span className="text-[10px] text-text-muted">{isArabic ? 'إجمالي العمولات:' : 'Total Earned:'}</span>
                    <strong className="text-accent block font-mono">
                      {formatNumber(agent.totalEarnedCommission)} ج.م
                    </strong>
                  </div>
                </div>

                {/* Paid vs Pending Breakdown */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isArabic ? 'تم صرفه:' : 'Disbursed:'} {formatNumber(agent.paidCommission)} ج.م</span>
                    </span>
                    <span className="text-purple-400 font-semibold font-mono">
                      {payoutPercent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full overflow-hidden bg-surface-raised">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${payoutPercent}%` }}
                    />
                  </div>

                  {agent.pendingCommission > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-purple-300 pt-0.5">
                      <span>{isArabic ? 'مستحقات قيد الصرف:' : 'Pending Payout:'}</span>
                      <strong className="font-mono">{formatNumber(agent.pendingCommission)} ج.م</strong>
                    </div>
                  )}
                </div>

                {/* Action: Disburse All Pending or View Voucher */}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  {agent.pendingCommission > 0 ? (
                    <button
                      onClick={() => {
                        const updated = contracts.map(c => {
                          if (c.agentName === agent.name && c.status !== 'paid') {
                            return { ...c, status: 'paid' as const, paymentDate: new Date().toISOString().slice(0, 10) };
                          }
                          return c;
                        });
                        saveContracts(updated);
                      }}
                      className="w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'صرف كافة المستحقات المعلقة' : 'Disburse All Pending'}</span>
                    </button>
                  ) : (
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'كافة العمولات مستوفاة ومدفوعة' : 'All Commissions Settled'}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD NEW SALES CONTRACT */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-surface border-border' : 'bg-white border-border'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-text'}`}>
                  {isArabic ? 'تسجيل عقد بيع جديد واحتساب العمولات' : 'Register Sales Contract & Commission'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-surface-raised transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'رقم العقد / المعاملة *' : 'Contract Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formContractNum}
                    onChange={(e) => setFormContractNum(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'كود الوحدة المباعة *' : 'Unit ID *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S-0012, PH-01"
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'المشروع / الكمبوند' : 'Compound'}
                  </label>
                  <input
                    type="text"
                    value={formCompound}
                    onChange={(e) => setFormCompound(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'المنطقة' : 'Area'}
                  </label>
                  <select
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  >
                    <option value="6 October">6 October (6 أكتوبر)</option>
                    <option value="Sheikh Zayed">Sheikh Zayed (الشيخ زايد)</option>
                    <option value="Hadayek October">Hadayek October (حدائق أكتوبر)</option>
                    <option value="Dahshur Link">Dahshur Link (وصلة دهشور)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'اسم المشتري / العميل *' : 'Client / Buyer Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="اسم المشتري"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'رقم الهاتف' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    placeholder="01012345678"
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>
              </div>

              {/* Financial Calculation Box */}
              <div className="p-3.5 rounded-xl bg-surface border border-border space-y-3">
                <span className="text-accent font-bold text-xs flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>{isArabic ? 'حساب العمولات التلقائي:' : 'Automatic Commission Calculation:'}</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-text-muted text-[11px] mb-1">
                      {isArabic ? 'سعر البيع الإجمالي (ج.م) *' : 'Selling Price (EGP) *'}
                    </label>
                    <input
                      type="number"
                      required
                      value={formDealValue}
                      onChange={(e) => setFormDealValue(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-text-muted text-[11px] mb-1">
                      {isArabic ? 'نسبة عمولة الوكالة (%)' : 'Agency Rate (%)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formCommissionRate}
                      onChange={(e) => setFormCommissionRate(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-text-muted text-[11px] mb-1">
                      {isArabic ? 'حصة الوكيل من العمولة (%)' : 'Agent Split (%)'}
                    </label>
                    <input
                      type="number"
                      value={formAgentShareRate}
                      onChange={(e) => setFormAgentShareRate(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live Output Preview */}
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <div>
                    <span className="text-text-muted">{isArabic ? 'عمولة الوكالة:' : 'Agency Commission:'} </span>
                    <strong className="text-accent font-mono">
                      {formatNumber(Math.round(((Number(formDealValue) || 0) * (Number(formCommissionRate) || 2.5)) / 100))} ج.م
                    </strong>
                  </div>
                  <div>
                    <span className="text-text-muted">{isArabic ? 'عمولة الوكيل الصافية:' : 'Agent Payout:'} </span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      {formatNumber(Math.round((((Number(formDealValue) || 0) * (Number(formCommissionRate) || 2.5) / 100) * (Number(formAgentShareRate) || 50)) / 100))} ج.م
                    </strong>
                  </div>
                </div>
              </div>

              {/* Contract Type and Expiry Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'طبيعة العقد الموثق *' : 'Contract Nature / Type *'}
                  </label>
                  <select
                    value={formContractType}
                    onChange={(e) => setFormContractType(e.target.value as ContractType)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  >
                    <option value="exclusive_marketing">{isArabic ? '⭐ عقد تسويق ووساطة حصري' : 'Exclusive Marketing'}</option>
                    <option value="brokerage_agreement">{isArabic ? '📜 اتفاقية عمولة ووساطة عقارية' : 'Brokerage Agreement'}</option>
                    <option value="sale">{isArabic ? '🛒 عقد بيع نهائي موثق' : 'Final Sale Contract'}</option>
                    <option value="rent">{isArabic ? '🔑 عقد إيجار سنوي موثق' : 'Annual Rent Contract'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1 flex items-center justify-between">
                    <span>{isArabic ? 'تاريخ انتهاء العقد للتنبيه *' : 'Contract Expiry Date *'}</span>
                    <span className="text-[10px] text-accent font-bold">
                      {isArabic ? '(نظام تنبيه الـ 7 أيام)' : '(7-day alert system)'}
                    </span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'الوسيط المستحق' : 'Assigned Broker'}
                  </label>
                  <select
                    value={formAgentName}
                    onChange={(e) => setFormAgentName(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  >
                    {agentNames.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'تاريخ التوقيع / الإغلاق' : 'Closing Date'}
                  </label>
                  <input
                    type="date"
                    value={formClosingDate}
                    onChange={(e) => setFormClosingDate(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'حالة الصرف الأولية' : 'Payout Status'}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'paid' | 'approved' | 'pending')}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  >
                    <option value="pending">{isArabic ? 'قيد التدقيق (Pending)' : 'Pending'}</option>
                    <option value="approved">{isArabic ? 'معتمدة للصرف (Approved)' : 'Approved'}</option>
                    <option value="paid">{isArabic ? 'تم الصرف فوراً (Paid)' : 'Paid'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-muted font-semibold mb-1">
                  {isArabic ? 'ملاحظات وبنود الصفقة' : 'Notes & Conditions'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isArabic ? 'طريقة السداد، رقم الشيك، أي شروط خاصة بالعميل...' : 'Payment method, check number, notes...'}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                  }`}
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-surface-raised hover:bg-surface-raised text-text-muted rounded-xl font-semibold cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isArabic ? 'حفظ العقد واحتساب العمولة' : 'Save & Calculate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMMISSION VOUCHER PRINT MODAL */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white text-text rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface text-white flex items-center justify-center font-bold">
                  6O
                </div>
                <div>
                  <h3 className="font-black text-lg text-text">سند صرف عمولة وساطة عقارية</h3>
                  <p className="text-xs text-text-muted font-mono uppercase">Official Brokerage Commission Voucher</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Voucher Body */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-surface rounded-xl border border-border">
                <div>
                  <span className="text-[10px] text-text-muted block">رقم العقد والمعاملة:</span>
                  <strong className="font-mono text-sm text-text">{selectedVoucher.contractNumber}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">تاريخ التوثيق:</span>
                  <strong className="font-mono text-sm text-text">{selectedVoucher.closingDate}</strong>
                </div>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">المستشار العقاري المستحق:</span>
                  <strong className="text-blue-700 text-sm">{selectedVoucher.agentName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">كود الوحدة والكمبوند:</span>
                  <strong className="text-text">{selectedVoucher.unitId} - {selectedVoucher.compound}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">اسم المشتري / العميل:</span>
                  <strong className="text-text">{selectedVoucher.clientName}</strong>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-text-muted">قيمة الصفقة الإجمالية:</span>
                  <strong className="text-text font-mono text-sm">{formatNumber(selectedVoucher.dealValue)} ج.م</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">عمولة الوكالة ({selectedVoucher.commissionRate}%):</span>
                  <strong className="text-accent font-mono">{formatNumber(selectedVoucher.totalCommission)} ج.م</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-800 font-bold">صافي عمولة الوكيل ({selectedVoucher.agentShareRate}%):</span>
                  <strong className="text-emerald-700 font-mono text-base font-black">
                    {formatNumber(selectedVoucher.agentCommissionAmount)} ج.م
                  </strong>
                </div>
              </div>

              {selectedVoucher.notes && (
                <div className="p-2.5 bg-surface rounded-lg text-text-muted">
                  <span className="font-semibold block text-[10px]">ملاحظات:</span>
                  <span>{selectedVoucher.notes}</span>
                </div>
              )}
            </div>

            {/* Signature Area */}
            <div className="pt-4 border-t border-border grid grid-cols-2 gap-4 text-center text-xs">
              <div className="border-t border-dashed border-border pt-2">
                <span className="block text-text-muted text-[10px]">توقيع الإدارة المالية</span>
                <span className="font-bold text-text">شقق وعقارات 6 أكتوبر</span>
              </div>
              <div className="border-t border-dashed border-border pt-2">
                <span className="block text-text-muted text-[10px]">توقيع المستشار العقاري المستلم</span>
                <span className="font-bold text-text">{selectedVoucher.agentName}</span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة السند</span>
              </button>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 bg-surface-raised hover:bg-surface-raised text-text rounded-xl text-xs font-semibold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsAndCommissions;
