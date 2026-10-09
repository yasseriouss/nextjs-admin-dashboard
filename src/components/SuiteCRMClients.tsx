import React, { useState, useMemo } from 'react';
import { STORAGE_KEYS, saveJson } from '../data/storage';
import { 
  ClientLead, 
  LeadRating, 
  LeadSource, 
  LeadStage, 
  InteractionLog,
  TeamMember,
  FollowUpTask
} from '../types';
import { getWorklenzSuggestions } from '../services/worklenzSuggestionService';
import { 
  Users, 
  UserPlus, 
  Phone, 
  MessageSquare, 
  Flame, 
  Sun, 
  Snowflake, 
  Search, 
  Plus, 
  Building2, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  X, 
  Check, 
  Edit3, 
  Trash2, 
  Sparkles,
  History,
  TrendingUp,
  Zap
} from 'lucide-react';

interface SuiteCRMClientsProps {
  clients: ClientLead[];
  onUpdateClients: (clients: ClientLead[]) => void;
  team: TeamMember[];
  isArabic: boolean;
  tasks?: FollowUpTask[];
  onAddTask?: (task: FollowUpTask) => void;
}

export const SuiteCRMClients: React.FC<SuiteCRMClientsProps> = ({
  clients,
  onUpdateClients,
  team,
  isArabic,
  tasks = [],
  onAddTask
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [agentFilter] = useState<string>('all');

  // Selected client for side inspection drawer
  const [selectedClient, setSelectedClient] = useState<ClientLead | null>(null);

  // Direct SuiteCRM Sync Toast Notification State
  const [syncToast, setSyncToast] = useState<{ show: boolean; message: string } | null>(null);

  // Modal State for New / Edit Client
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientLead | null>(null);
  const [createFollowUpTask, setCreateFollowUpTask] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formRating, setFormRating] = useState<LeadRating>('hot');
  const [formSource, setFormSource] = useState<LeadSource>('facebook');
  const [formStage, setFormStage] = useState<LeadStage>('new');
  const [formBudgetMin, setFormBudgetMin] = useState<string>('5000000');
  const [formBudgetMax, setFormBudgetMax] = useState<string>('10000000');
  const [formPurpose, setFormPurpose] = useState<'buy' | 'rent' | 'invest'>('buy');
  const [formPropertyType, setFormPropertyType] = useState('شقة فاخرة / بنتهاوس');
  const [formCompound, setFormCompound] = useState('ماونتن فيو آي سيتي');
  const [formAgent, setFormAgent] = useState('سارة نبيل');
  const [formDealValue, setFormDealValue] = useState<string>('');
  const [formProbability, setFormProbability] = useState<string>('50');
  const [formNotes, setFormNotes] = useState('');

  // Quick Log Interaction State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logType, setLogType] = useState<'call' | 'whatsapp' | 'meeting' | 'viewing' | 'note'>('call');
  const [logSummary, setLogSummary] = useState('');
  const [logOutcome, setLogOutcome] = useState('');

  // SuiteCRM Live KPI Analytics
  const metrics = useMemo(() => {
    const total = clients.length;
    const hotLeads = clients.filter(c => c.rating === 'hot').length;
    const warmLeads = clients.filter(c => c.rating === 'warm').length;
    const totalPipelineValue = clients.reduce((acc, c) => acc + (c.dealValue || 0), 0);
    const weightedForecast = clients.reduce((acc, c) => {
      const val = c.dealValue || 0;
      const prob = (c.probability || 50) / 100;
      return acc + (val * prob);
    }, 0);
    const wonCount = clients.filter(c => c.stage === 'won').length;

    return {
      total,
      hotLeads,
      warmLeads,
      totalPipelineValue,
      weightedForecast,
      wonCount
    };
  }, [clients]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return clients.filter(c => {
      if (q) {
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone.includes(q);
        const matchesCompound = c.targetCompound?.toLowerCase().includes(q);
        const matchesCompany = c.company?.toLowerCase().includes(q);
        const matchesAgent = c.assignedAgent.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesCompound && !matchesCompany && !matchesAgent) return false;
      }

      if (ratingFilter !== 'all' && c.rating !== ratingFilter) return false;
      if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
      if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
      if (agentFilter !== 'all' && c.assignedAgent !== agentFilter) return false;

      return true;
    });
  }, [clients, searchQuery, ratingFilter, sourceFilter, stageFilter, agentFilter]);

  // Worklenz agent suggestions for client compound
  const worklenzSuggestions = useMemo(() => {
    return getWorklenzSuggestions(formCompound, team, tasks);
  }, [formCompound, team, tasks]);
  const topSuggestedBroker = worklenzSuggestions[0] || null;

  // Open modal for new client
  const handleOpenNewModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormCompany('');
    setFormRating('hot');
    setFormSource('facebook');
    setFormStage('new');
    setFormBudgetMin('5000000');
    setFormBudgetMax('10000000');
    setFormPurpose('buy');
    setFormPropertyType('شقة فاخرة / بنتهاوس');
    setFormCompound('');
    const initialSugg = getWorklenzSuggestions('', team, tasks);
    setFormAgent(initialSugg[0]?.member.name || team[0]?.name || 'سارة نبيل');
    setFormDealValue('');
    setFormProbability('50');
    setFormNotes('');
    setCreateFollowUpTask(true);
    setIsModalOpen(true);
  };

  // Open modal for editing client
  const handleOpenEditModal = (client: ClientLead) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormPhone(client.phone);
    setFormEmail(client.email || '');
    setFormCompany(client.company || '');
    setFormRating(client.rating);
    setFormSource(client.source);
    setFormStage(client.stage);
    setFormBudgetMin(String(client.targetBudgetMin || ''));
    setFormBudgetMax(String(client.targetBudgetMax || ''));
    setFormPurpose(client.purpose);
    setFormPropertyType(client.targetPropertyType || '');
    setFormCompound(client.targetCompound || '');
    setFormAgent(client.assignedAgent);
    setFormDealValue(client.dealValue ? String(client.dealValue) : '');
    setFormProbability(client.probability ? String(client.probability) : '50');
    setFormNotes(client.notes || '');
    setCreateFollowUpTask(false);
    setIsModalOpen(true);
  };

  // Save Client Form
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      setFormError(isArabic ? 'يرجى إدخال اسم العميل ورقم الهاتف' : 'Please provide client name and phone');
      return;
    }
    setFormError(null);

    if (editingClient) {
      const updated = clients.map(c => {
        if (c.id === editingClient.id) {
          return {
            ...c,
            name: formName.trim(),
            phone: formPhone.trim(),
            email: formEmail.trim() || undefined,
            company: formCompany.trim() || undefined,
            rating: formRating,
            source: formSource,
            stage: formStage,
            targetBudgetMin: Number(formBudgetMin) || 0,
            targetBudgetMax: Number(formBudgetMax) || 0,
            purpose: formPurpose,
            targetPropertyType: formPropertyType.trim() || undefined,
            targetCompound: formCompound.trim() || undefined,
            assignedAgent: formAgent,
            dealValue: formDealValue ? Number(formDealValue) : undefined,
            probability: Number(formProbability) || 50,
            notes: formNotes.trim() || undefined
          };
        }
        return c;
      });
      onUpdateClients(updated);
      try {
        saveJson(STORAGE_KEYS.clients, updated);
      } catch (err) {}
      if (selectedClient?.id === editingClient.id) {
        setSelectedClient(updated.find(c => c.id === editingClient.id) || null);
      }
      setSyncToast({
        show: true,
        message: isArabic
          ? `تم تحديث ومزامنة بيانات العميل "${formName.trim()}" بنجاح!`
          : `Client lead "${formName.trim()}" updated and synced successfully!`
      });
      setTimeout(() => setSyncToast(null), 4000);
    } else {
      const newClient: ClientLead = {
        id: `CLT-${Date.now().toString().slice(-4)}`,
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        company: formCompany.trim() || undefined,
        rating: formRating,
        source: formSource,
        stage: formStage,
        targetBudgetMin: Number(formBudgetMin) || 0,
        targetBudgetMax: Number(formBudgetMax) || 0,
        purpose: formPurpose,
        targetPropertyType: formPropertyType.trim() || undefined,
        targetCompound: formCompound.trim() || undefined,
        assignedAgent: formAgent,
        dealValue: formDealValue ? Number(formDealValue) : undefined,
        probability: Number(formProbability) || 50,
        notes: formNotes.trim() || undefined,
        interactionLogs: [
          {
            id: `LOG-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            time: '12:00',
            type: 'note',
            agent: formAgent,
            summary: isArabic ? 'تسجيل العميل في النظام' : 'Lead created in SuiteCRM'
          }
        ],
        createdAt: new Date().toISOString().slice(0, 10)
      };
      const updatedClients = [newClient, ...clients];
      onUpdateClients(updatedClients);
      try {
        saveJson(STORAGE_KEYS.clients, updatedClients);
      } catch (err) {}

      // Optionally create linked initial follow-up task in Task Workspace
      if (createFollowUpTask && onAddTask) {
        const initialTask: FollowUpTask = {
          id: `TSK-${Date.now().toString().slice(-4)}`,
          title: isArabic 
            ? `متابعة أولية للعميل الجديد: ${formName.trim()} (${formCompound.trim() || 'فرصة جديدة'})`
            : `Initial follow-up with new lead: ${formName.trim()} (${formCompound.trim() || 'New Opportunity'})`,
          clientName: formName.trim(),
          clientPhone: formPhone.trim(),
          stage: 'lead',
          type: 'call',
          category: 'call',
          unitNature: formPurpose === 'rent' ? 'rent' : 'sale',
          priority: formRating === 'hot' ? 'urgent' : formRating === 'warm' ? 'high' : 'medium',
          compound: formCompound.trim() || undefined,
          dealValue: formDealValue ? Number(formDealValue) : undefined,
          dueDate: new Date().toISOString().slice(0, 10),
          dueTime: '12:00',
          agent: formAgent,
          notes: formNotes.trim() || (isArabic ? 'عميل مسجل حديثاً عبر قسم SuiteCRM Clients' : 'Newly registered lead in SuiteCRM'),
          createdAt: new Date().toISOString()
        };
        onAddTask(initialTask);
      }

      setSyncToast({
        show: true,
        message: isArabic
          ? `تم تسجيل ومزامنة العميل الجديد "${newClient.name}" مباشرة في قسم SuiteCRM Clients بنجاح!`
          : `New client lead "${newClient.name}" successfully created and synced to SuiteCRM module!`
      });
      setTimeout(() => setSyncToast(null), 4500);
    }

    setIsModalOpen(false);
    setEditingClient(null);
  };

  // Add Interaction Log (SuiteCRM Audit History)
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !logSummary.trim()) return;

    const newLog: InteractionLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      type: logType,
      agent: selectedClient.assignedAgent,
      summary: logSummary.trim(),
      outcome: logOutcome.trim() || undefined
    };

    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        return {
          ...c,
          interactionLogs: [newLog, ...(c.interactionLogs || [])]
        };
      }
      return c;
    });

    onUpdateClients(updated);
    setSelectedClient(updated.find(c => c.id === selectedClient.id) || null);
    setIsLogModalOpen(false);
    setLogSummary('');
    setLogOutcome('');
  };

  // Delete client
  const handleDeleteClient = (clientId: string) => {
    if (window.confirm(isArabic ? 'هل تريد حذف هذا العميل من النظام؟' : 'Delete this client lead?')) {
      onUpdateClients(clients.filter(c => c.id !== clientId));
      if (selectedClient?.id === clientId) setSelectedClient(null);
    }
  };

  // Helper for Rating badge
  const getRatingInfo = (rating: LeadRating) => {
    switch (rating) {
      case 'hot':
        return {
          labelAr: 'عميل ساخن (جاهز للشراء)',
          labelEn: 'Hot Lead',
          badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30 ring-1 ring-rose-500/20 font-bold',
          icon: <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
        };
      case 'warm':
        return {
          labelAr: 'عميل دافئ (مهتم ومستجيب)',
          labelEn: 'Warm Lead',
          badge: 'bg-accent text-accent border-accent font-semibold',
          icon: <Sun className="w-3.5 h-3.5 text-accent" />
        };
      case 'cold':
        return {
          labelAr: 'عميل بارد (متابعة مستقبلية)',
          labelEn: 'Cold Lead',
          badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          icon: <Snowflake className="w-3.5 h-3.5 text-blue-400" />
        };
    }
  };

  // Helper for Lead Source
  const getSourceLabel = (source: LeadSource) => {
    const map: Record<LeadSource, { ar: string; en: string }> = {
      facebook: { ar: 'إعلانات فيسبوك', en: 'Facebook Ads' },
      google: { ar: 'حملات جوجل', en: 'Google Search' },
      property_finder: { ar: 'بروبرتي فايندر', en: 'Property Finder' },
      aqarmap: { ar: 'عقارماب', en: 'Aqarmap' },
      referral: { ar: 'ترشيح عميل / معارف', en: 'Client Referral' },
      direct: { ar: 'زيارة مباشرة للفرع', en: 'Walk-in' },
      campaign: { ar: 'حملة واتساب ورسائل', en: 'Campaign' }
    };
    return isArabic ? map[source].ar : map[source].en;
  };

  // Helper for Stage
  const getStageLabel = (stage: LeadStage) => {
    const map: Record<LeadStage, { ar: string; en: string; badge: string }> = {
      new: { ar: 'طلب جديد', en: 'New Lead', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      contacted: { ar: 'تم التواصل', en: 'Contacted', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
      qualified: { ar: 'عميل مؤهل', en: 'Qualified', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
      viewing: { ar: 'معاينة مجدولة', en: 'Viewing', badge: 'bg-accent text-accent border-accent' },
      negotiation: { ar: 'مفاوضات جارية', en: 'Negotiation', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      won: { ar: 'صفقة منجزة ✓', en: 'Closed Won', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      lost: { ar: 'غير مهتم / ملغى', en: 'Lost', badge: 'bg-surface-raised text-text-muted border-border' }
    };
    return map[stage];
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Analytics Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>{isArabic ? 'إدارة العملاء والفرص البيعية (SuiteCRM Engine)' : 'Enterprise Leads & Accounts'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                SuiteCRM v8
              </span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isArabic
                ? 'تصنيف درجات اهتمام العملاء (ساخن/دافئ/بارد)، قنوات الاستقطاب، وسجل النشاطات التاريخي والتوقعات المرجحة'
                : 'Lead scoring (Hot/Warm/Cold), marketing acquisition channels, interaction logs, and weighted sales forecasting'}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-blue-600/20 cursor-pointer self-start lg:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isArabic ? '+ تسجيل عميل جديد' : '+ Create Lead'}</span>
        </button>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Clients */}
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>{isArabic ? 'إجمالي العملاء المسجلين' : 'Total Leads'}</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{metrics.total}</div>
          <div className="text-[10px] text-text-muted">{isArabic ? 'قاعدة بيانات نشطة' : 'Active DB'}</div>
        </div>

        {/* Hot Leads */}
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span className="text-rose-400 font-bold">{isArabic ? 'عملاء ساخنون 🔥' : 'Hot Leads 🔥'}</span>
            <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">{metrics.hotLeads}</div>
          <div className="text-[10px] text-text-muted">{isArabic ? 'جاهزية عالية للتعاقد' : 'Ready to buy'}</div>
        </div>

        {/* Total Pipeline Value */}
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>{isArabic ? 'إجمالي قيمة الفرص' : 'Pipeline Value'}</span>
            <DollarSign className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold font-mono text-accent">
            {(metrics.totalPipelineValue / 1000000).toFixed(1)}M
          </div>
          <div className="text-[10px] text-text-muted font-mono">EGP Total Deal Volume</div>
        </div>

        {/* Weighted Forecast (SuiteCRM) */}
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>{isArabic ? 'التوقع المرجح للمبيعات' : 'Weighted Forecast'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {(metrics.weightedForecast / 1000000).toFixed(1)}M
          </div>
          <div className="text-[10px] text-text-muted">{isArabic ? 'احتمالية التحصيل الفعلية' : 'Probability Weighted'}</div>
        </div>

        {/* Closed Won Deals */}
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>{isArabic ? 'صفقات تم إغلاقها' : 'Deals Won'}</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-400">{metrics.wonCount}</div>
          <div className="text-[10px] text-text-muted">{isArabic ? 'عقود تم توثيقها' : 'Closed & Signed'}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            placeholder={isArabic ? 'بحث بالاسم، رقم الهاتف، الكمبوند، أو الوسيط...' : 'Search by client name, phone, compound, agent...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 rtl:pl-4 rtl:pr-9 text-text placeholder-text-muted text-xs focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Rating Filter */}
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text-muted">
            <span className="text-text-muted text-[11px]">{isArabic ? 'التصنيف:' : 'Rating:'}</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value="all" className="bg-surface">{isArabic ? 'الكل' : 'All Ratings'}</option>
              <option value="hot" className="bg-surface">{isArabic ? '🔥 ساخن' : 'Hot'}</option>
              <option value="warm" className="bg-surface">{isArabic ? '☀️ دافئ' : 'Warm'}</option>
              <option value="cold" className="bg-surface">{isArabic ? '❄️ بارد' : 'Cold'}</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text-muted">
            <span className="text-text-muted text-[11px]">{isArabic ? 'المصدر:' : 'Source:'}</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value="all" className="bg-surface">{isArabic ? 'جميع المصادر' : 'All Sources'}</option>
              <option value="facebook" className="bg-surface">Facebook Ads</option>
              <option value="property_finder" className="bg-surface">Property Finder</option>
              <option value="aqarmap" className="bg-surface">Aqarmap</option>
              <option value="referral" className="bg-surface">{isArabic ? 'ترشيح عميل' : 'Referral'}</option>
              <option value="direct" className="bg-surface">{isArabic ? 'زيارة مباشرة' : 'Direct'}</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text-muted">
            <span className="text-text-muted text-[11px]">{isArabic ? 'المرحلة:' : 'Stage:'}</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value="all" className="bg-surface">{isArabic ? 'جميع المراحل' : 'All Stages'}</option>
              <option value="new" className="bg-surface">{isArabic ? 'طلب جديد' : 'New'}</option>
              <option value="contacted" className="bg-surface">{isArabic ? 'تم التواصل' : 'Contacted'}</option>
              <option value="qualified" className="bg-surface">{isArabic ? 'مؤهل' : 'Qualified'}</option>
              <option value="viewing" className="bg-surface">{isArabic ? 'معاينة' : 'Viewing'}</option>
              <option value="negotiation" className="bg-surface">{isArabic ? 'مفاوضات' : 'Negotiation'}</option>
              <option value="won" className="bg-surface">{isArabic ? 'منجزة' : 'Won'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const ratingInfo = getRatingInfo(client.rating);
          const stageInfo = getStageLabel(client.stage);
          const isSelected = selectedClient?.id === client.id;

          return (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`bg-surface border rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5 cursor-pointer hover:border-border transition ${
                isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 bg-surface-raised' : 'border-border'
              }`}
            >
              {/* Card Header: Rating Badge & Stage */}
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${ratingInfo.badge}`}>
                  {ratingInfo.icon}
                  <span>{isArabic ? ratingInfo.labelAr.split(' ')[0] : ratingInfo.labelEn}</span>
                </span>

                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${stageInfo.badge}`}>
                  {isArabic ? stageInfo.ar : stageInfo.en}
                </span>
              </div>

              {/* Client Name & Company */}
              <div>
                <h3 className="font-bold text-white text-base leading-snug">{client.name}</h3>
                {client.company && (
                  <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 text-text-muted shrink-0" />
                    <span className="truncate">{client.company}</span>
                  </p>
                )}
              </div>

              {/* Requirement & Budget Box */}
              <div className="bg-surface p-3 rounded-xl border border-border text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">{isArabic ? 'الطلب والكمبوند:' : 'Target:'}</span>
                  <span className="font-semibold text-text truncate max-w-[170px]">
                    {client.targetCompound || client.targetPropertyType || '6 October'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-muted">{isArabic ? 'الميزانية المتاحة:' : 'Budget:'}</span>
                  <strong className="text-accent font-mono">
                    {(client.targetBudgetMin / 1000000).toFixed(1)}M - {(client.targetBudgetMax / 1000000).toFixed(1)}M EGP
                  </strong>
                </div>

                {client.dealValue && (
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-text-muted">{isArabic ? 'قيمة الصفقة المتوقعة:' : 'Deal Value:'}</span>
                    <strong className="text-emerald-400 font-mono">
                      {(client.dealValue / 1000000).toFixed(2)}M EGP ({client.probability || 50}%)
                    </strong>
                  </div>
                )}
              </div>

              {/* Lead Source & Assigned Agent */}
              <div className="flex items-center justify-between text-xs text-text-muted pt-1">
                <span className="text-[11px] bg-surface-raised px-2 py-0.5 rounded text-text-muted font-medium">
                  {getSourceLabel(client.source)}
                </span>
                <span className="text-[11px] flex items-center gap-1 text-text-muted">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>{client.assignedAgent}</span>
                </span>
              </div>

              {/* Footer Actions: WhatsApp, Call, Edit */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                    title={isArabic ? 'محادثة وتذكير واتساب' : 'WhatsApp'}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`tel:${client.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition cursor-pointer"
                    title={isArabic ? 'اتصال مباشر' : 'Call'}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(client);
                    }}
                    className="p-1.5 text-text-muted hover:text-white rounded-lg hover:bg-surface-raised transition cursor-pointer"
                    title={isArabic ? 'تعديل بيانات العميل' : 'Edit'}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClient(client.id);
                    }}
                    className="p-1.5 text-text-muted hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                    title={isArabic ? 'حذف العميل' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SELECTED CLIENT AUDIT LOG & INTERACTION TIMELINE DRAWER */}
      {selectedClient && (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <History className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <span>{isArabic ? 'سجل النشاطات والمتابعات التاريخي:' : 'Interaction History & Audit Log:'}</span>
                  <span className="text-blue-400">{selectedClient.name}</span>
                </h3>
                <p className="text-xs text-text-muted">
                  {isArabic 
                    ? 'توثيق كافة المكالمات، رسائل الواتساب، والزيارات الميدانية مع العميل (SuiteCRM Activity Stream)'
                    : 'Complete call logs, WhatsApp conversations, and on-site showings trail'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLogModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'تسجيل نشاط / مكالمة جديدة' : '+ Log Interaction'}</span>
              </button>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 text-text-muted hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interaction Logs Timeline */}
          <div className="space-y-3">
            {(!selectedClient.interactionLogs || selectedClient.interactionLogs.length === 0) ? (
              <div className="text-center py-6 text-text-muted text-xs">
                {isArabic ? 'لا توجد أنشطة مسجلة حتى الآن لهذا العميل.' : 'No interactions logged yet.'}
              </div>
            ) : (
              selectedClient.interactionLogs.map((log) => (
                <div key={log.id} className="bg-surface p-3.5 rounded-xl border border-border flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-surface border border-border text-blue-400 shrink-0">
                    {log.type === 'call' && <Phone className="w-4 h-4 text-blue-400" />}
                    {log.type === 'whatsapp' && <MessageSquare className="w-4 h-4 text-emerald-400" />}
                    {log.type === 'meeting' && <Building2 className="w-4 h-4 text-purple-400" />}
                    {log.type === 'viewing' && <Calendar className="w-4 h-4 text-accent" />}
                    {log.type === 'note' && <FileText className="w-4 h-4 text-text-muted" />}
                    {log.type === 'proposal' && <DollarSign className="w-4 h-4 text-cyan-400" />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {log.type === 'call' ? (isArabic ? 'مكالمة هاتفية' : 'Phone Call') :
                         log.type === 'whatsapp' ? (isArabic ? 'متابعة واتساب' : 'WhatsApp Chat') :
                         log.type === 'meeting' ? (isArabic ? 'اجتماع بالمكتب' : 'Meeting') :
                         log.type === 'viewing' ? (isArabic ? 'معاينة ميدانية' : 'Showing') :
                         log.type === 'proposal' ? (isArabic ? 'توقيع عرض سعر' : 'Contract') :
                         (isArabic ? 'ملاحظة داخلية' : 'Internal Note')}
                      </span>
                      <span className="text-text-muted font-mono text-[10px]">
                        {log.date} {log.time || ''} • {log.agent}
                      </span>
                    </div>

                    <p className="text-text-muted leading-relaxed">{log.summary}</p>

                    {log.outcome && (
                      <div className="text-[11px] text-accent/90 font-medium pt-1">
                        ↳ {isArabic ? 'النتيجة / الإجراء التالي:' : 'Next Action:'} {log.outcome}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Create / Edit Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <UserPlus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-base text-white">
                  {editingClient ? (isArabic ? 'تعديل بيانات العميل والفرصة' : 'Edit Lead & Opportunity') : (isArabic ? 'تسجيل عميل جديد (SuiteCRM)' : 'Create New Lead')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-text-muted hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <span className="font-bold">⚠️</span>
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'اسم العميل *' : 'Client Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isArabic ? 'مثال: م/ ياسر سلام' : 'e.g. Eng. Yasser Sallam'}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'رقم الهاتف / واتساب *' : 'Phone / WhatsApp *'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+2010..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    placeholder="client@domain.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'الشركة / جهة العمل' : 'Company'}
                  </label>
                  <input
                    type="text"
                    placeholder={isArabic ? 'اسم الشركة أو الوظيفة' : 'Company or Employer'}
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Rating & Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'تصنيف درجة اهتمام العميل (Lead Rating)' : 'Lead Temperature Rating'}
                  </label>
                  <select
                    value={formRating}
                    onChange={(e) => setFormRating(e.target.value as LeadRating)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="hot">🔥 {isArabic ? 'ساخن (جاهز للشراء فوراً)' : 'Hot Lead'}</option>
                    <option value="warm">☀️ {isArabic ? 'دافئ (مهتم ويقارن خيارات)' : 'Warm Lead'}</option>
                    <option value="cold">❄️ {isArabic ? 'بارد (استفسار أولي / مؤجل)' : 'Cold Lead'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'مصدر الاستقطاب (Lead Source)' : 'Acquisition Source'}
                  </label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as LeadSource)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="facebook">{isArabic ? 'إعلانات فيسبوك / انستجرام' : 'Facebook Ads'}</option>
                    <option value="property_finder">Property Finder</option>
                    <option value="aqarmap">Aqarmap</option>
                    <option value="google">{isArabic ? 'حملات بحث جوجل' : 'Google Search'}</option>
                    <option value="referral">{isArabic ? 'ترشيح عميل / معارف' : 'Referral'}</option>
                    <option value="direct">{isArabic ? 'زيارة مباشرة للفرع' : 'Walk-in'}</option>
                    <option value="campaign">{isArabic ? 'حملة واتساب' : 'WhatsApp Campaign'}</option>
                  </select>
                </div>
              </div>

              {/* Stage & Assigned Agent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'مرحلة العميل في دورة البيع' : 'Lifecycle Stage'}
                  </label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value as LeadStage)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="new">{isArabic ? 'طلب جديد (New)' : 'New'}</option>
                    <option value="contacted">{isArabic ? 'تم التواصل (Contacted)' : 'Contacted'}</option>
                    <option value="qualified">{isArabic ? 'عميل مؤهل (Qualified)' : 'Qualified'}</option>
                    <option value="viewing">{isArabic ? 'معاينة مجدولة (Viewing)' : 'Viewing'}</option>
                    <option value="negotiation">{isArabic ? 'مفاوضات جارية (Negotiation)' : 'Negotiation'}</option>
                    <option value="won">{isArabic ? 'تم التعاقد بنجاح ✓ (Won)' : 'Closed Won'}</option>
                    <option value="lost">{isArabic ? 'غير مهتم / ملغى (Lost)' : 'Lost'}</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-text-muted font-semibold">
                      {isArabic ? 'الوسيط المسؤول' : 'Assigned Broker'}
                    </label>
                    {topSuggestedBroker && (
                      <span className="text-[10px] text-blue-400 flex items-center gap-1 font-mono">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        <span>Worklenz: {topSuggestedBroker.member.name.split(' ')[0]}</span>
                      </span>
                    )}
                  </div>
                  <select
                    value={formAgent}
                    onChange={(e) => setFormAgent(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {team.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Worklenz Suggestion Recommendation Callout in SuiteCRM */}
              {topSuggestedBroker && (
                <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-[11px] text-text-muted">
                      <strong className="text-white">{topSuggestedBroker.member.name}</strong> • {isArabic ? topSuggestedBroker.reasonAr : topSuggestedBroker.reasonEn}
                    </span>
                  </div>
                  {formAgent !== topSuggestedBroker.member.name && (
                    <button
                      type="button"
                      onClick={() => setFormAgent(topSuggestedBroker.member.name)}
                      className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] shrink-0 transition cursor-pointer flex items-center gap-1"
                    >
                      <Zap className="w-2.5 h-2.5 text-accent" />
                      <span>{isArabic ? 'تعيين' : 'Assign'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Target Compound & Property Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'المشروع / الكمبوند المطلوب' : 'Target Compound'}
                  </label>
                  <input
                    type="text"
                    placeholder={isArabic ? 'مثال: بالم هيلز، ماونتن فيو، بادية...' : 'e.g. Palm Hills, Mountain View...'}
                    value={formCompound}
                    onChange={(e) => setFormCompound(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'نوع الوحدة المستهدفة' : 'Property Type'}
                  </label>
                  <input
                    type="text"
                    placeholder={isArabic ? 'شقة 3 غرف، فيلا ستاند ألون، تاون هاوس...' : 'Apartment, Villa, Townhouse...'}
                    value={formPropertyType}
                    onChange={(e) => setFormPropertyType(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Budget Range & Deal Forecast */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'الميزانية من (ج.م)' : 'Budget Min (EGP)'}
                  </label>
                  <input
                    type="number"
                    value={formBudgetMin}
                    onChange={(e) => setFormBudgetMin(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'الميزانية إلى (ج.م)' : 'Budget Max (EGP)'}
                  </label>
                  <input
                    type="number"
                    value={formBudgetMax}
                    onChange={(e) => setFormBudgetMax(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'احتمالية الإغلاق %' : 'Probability %'}
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={formProbability}
                    onChange={(e) => setFormProbability(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-text-muted font-semibold mb-1">
                  {isArabic ? 'ملاحظات تفصيلية' : 'Notes & Strategy'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isArabic ? 'سجل تفاصيل رغبة العميل، جاهزية الكاش، وطريقة الدفع...' : 'Client specific preferences, cash downpayment...'}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Option to automatically create initial follow-up task in Task Workspace */}
              {!editingClient && onAddTask && (
                <div className="p-3 rounded-xl bg-surface border border-border flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="createFollowUpTask"
                    checked={createFollowUpTask}
                    onChange={(e) => setCreateFollowUpTask(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500 bg-surface cursor-pointer"
                  />
                  <label htmlFor="createFollowUpTask" className="text-xs text-text-muted cursor-pointer">
                    <span className="font-bold text-white block">
                      {isArabic ? 'إنشاء مهمة متابعة أولية بالكانبان تلقائياً (Worklenz Task)' : 'Auto-create initial follow-up task in Kanban (Worklenz)'}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {isArabic 
                        ? 'إدراج مهمة اتصال فوري مسندة للوسيط في مساحة المهام لمتابعة العميل الجديد فوراً' 
                        : 'Automatically schedules a new follow-up task for the assigned broker in the Task Workspace'}
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-raised hover:bg-surface-raised text-text-muted rounded-lg font-medium transition cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingClient ? (isArabic ? 'حفظ التعديلات' : 'Save Changes') : (isArabic ? 'إضافة العميل' : 'Create Lead')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log Interaction Form */}
      {isLogModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <History className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-base text-white">
                  {isArabic ? 'تسجيل نشاط ومتابعة جديدة' : 'Log Interaction'}
                </h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 text-text-muted hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLog} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-muted font-semibold mb-1">
                  {isArabic ? 'نوع النشاط' : 'Activity Type'}
                </label>
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value as 'call' | 'whatsapp' | 'meeting' | 'viewing' | 'note')}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="call">{isArabic ? 'مكالمة هاتفية' : 'Phone Call'}</option>
                  <option value="whatsapp">{isArabic ? 'محادثة وتذكير واتساب' : 'WhatsApp Chat'}</option>
                  <option value="viewing">{isArabic ? 'معاينة ميدانية بالكمبوند' : 'Site Showing'}</option>
                  <option value="meeting">{isArabic ? 'اجتماع بالمكتب' : 'Office Meeting'}</option>
                  <option value="note">{isArabic ? 'ملاحظة ومتابعة داخلية' : 'Internal Note'}</option>
                </select>
              </div>

              <div>
                <label className="block text-text-muted font-semibold mb-1">
                  {isArabic ? 'ملخص ما تم في المحادثة أو المقابلة *' : 'Summary *'}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={isArabic ? 'سجل تفاصيل الحوار وما أبداه العميل من آراء...' : 'Summary of what happened during interaction...'}
                  value={logSummary}
                  onChange={(e) => setLogSummary(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-text-muted font-semibold mb-1">
                  {isArabic ? 'الإجراء التالي المتفق عليه' : 'Agreed Next Step'}
                </label>
                <input
                  type="text"
                  placeholder={isArabic ? 'مثال: موعد معاينة السبت، إرسال خطة أقساط...' : 'e.g. Showing scheduled for Saturday...'}
                  value={logOutcome}
                  onChange={(e) => setLogOutcome(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 bg-surface-raised hover:bg-surface-raised text-text-muted rounded-lg font-medium transition cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'حفظ النشاط بالسجل' : 'Save to History'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct SuiteCRM Sync Success Toast Notification */}
      {syncToast && syncToast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-surface border border-emerald-500/40 text-white px-4 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md backdrop-blur-md">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span>SuiteCRM Clients Sync</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 font-mono">Live Sync</span>
              </div>
              <p className="text-xs text-text mt-0.5 leading-snug">{syncToast.message}</p>
            </div>
            <button 
              onClick={() => setSyncToast(null)}
              className="text-text-muted hover:text-white p-1 rounded-lg hover:bg-surface-raised transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuiteCRMClients;
