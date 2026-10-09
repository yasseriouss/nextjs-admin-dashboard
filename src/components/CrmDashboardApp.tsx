"use client";

import { computeDashboardKpis } from '@/lib/kpis';
import {
  mergeNotifications,
  makeImminentTaskNotification,
  makeContractExpiryNotification,
  makeUnitTransitionAlerts,
  makeSoldToast,
  notificationTitle,
  notificationMessage,
} from '@/lib/notifications';
import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
} from '@/services/auth';
import { resolveLegacyUnitLocation } from '@/services/qrService';
import { getUnitRepository, getOwnerRepository } from '@/repositories';
import { SalesContract, calculateContractExpiryInfo } from '@/data/mockContracts';
import {
  STORAGE_KEYS,
  loadJson,
  loadUiSettings,
} from '@/data/storage';
import { useUnits, useOwners, useTasks, useClients, useTeam, useContracts, useUiSettings } from '@/hooks/useStoredList';
import { Unit, DashboardKPIs, Owner, FollowUpTask, ClientLead, TeamMember, AppNotification } from '@/types';
import { Header } from '@/components/Header';
import { useAppUI } from '@/context/AppUIContext';
import { KPISection } from '@/components/KPISection';
import { UnitsTable } from '@/components/UnitsTable';
import { SalesRegionalMiniDashboard } from '@/components/SalesRegionalMiniDashboard';
import { AnimatedLogoLoader } from '@/components/AnimatedLogoLoader';
import { Sidebar } from '@/components/Sidebar';
import { NotificationToast } from '@/components/NotificationToast';
import { TaskImminentBanner } from '@/components/TaskImminentBanner';
import { 
  Building2, 
  CheckCircle, 
  Layers,
} from 'lucide-react';
import { useT } from '@/i18n/useT';

// Lazy-loaded tab views
const MonthlySalesReports = lazy(() => import('@/components/MonthlySalesReports'));
const OwnersTab = lazy(() => import('@/components/OwnersTab'));
const CompoundUnitMap = lazy(() => import('@/components/CompoundUnitMap'));
const GeographicDistributionMap = lazy(() => import('@/components/GeographicDistributionMap'));
const CalendarView = lazy(() => import('@/components/CalendarView'));
const ContractsAndCommissions = lazy(() => import('@/components/ContractsAndCommissions'));
const SettingsPage = lazy(() => import('@/components/SettingsPage'));
const TeamAndTasksWorkspace = lazy(() => import('@/components/TeamAndTasksWorkspace'));
const SuiteCRMClients = lazy(() => import('@/components/SuiteCRMClients'));
const GeminiCopilotPage = lazy(() => import('@/components/GeminiCopilotPage'));
const CrmOverview = lazy(() => import('@/components/CrmOverview'));
const LandingPageCmsView = lazy(() => import('@/components/LandingPageCmsView'));
const BlogArticlesManager = lazy(() => import('@/components/BlogArticlesManager'));

// Lazy-loaded modals
const UnitDetailModal = lazy(() => import('@/components/UnitDetailModal'));
const UnitOfficialQuotationModal = lazy(() => import('@/components/UnitOfficialQuotationModal'));
const CompoundPriceDistributionModal = lazy(() => import('@/components/CompoundPriceDistributionModal'));
const NewUnitModal = lazy(() => import('@/components/NewUnitModal'));
const PasteDataModal = lazy(() => import('@/components/PasteDataModal'));
const UISettingsModal = lazy(() => import('@/components/UISettingsModal'));

const EMPTY_UNITS: Unit[] = [];
const EMPTY_OWNERS: Owner[] = [];
const EMPTY_TASKS: FollowUpTask[] = [];
const EMPTY_CLIENTS: ClientLead[] = [];
const EMPTY_TEAM: TeamMember[] = [];
const EMPTY_CONTRACTS: SalesContract[] = [];

export default function App({ embedded = true }: { embedded?: boolean } = {}) {
  const {
    activeNavTab,
    isNotFound,
    setActiveNavTab,
    selectedUnit,
    setSelectedUnit,
    searchQuery,
    setSearchQuery,
    isArabic,
    setIsArabic,
    notifications,
    setNotifications,
    theme,
    toggleTheme,
  } = useAppUI();
  const t = useT();
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [, setToken] = useState<string | null>(null);

  // Responsive Sidebar States
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [, setIsSmartRemindersOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Show Smart Reminders modal on initial launch / login if not explicitly suppressed today
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const suppressed = loadJson<string | null>(STORAGE_KEYS.remindersSuppressed, null);
    if (suppressed !== today) {
      const timer = setTimeout(() => {
        setIsSmartRemindersOpen(true);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, []);

  // Units & KPIs State
  const { data: unitsData, setData: setUnits } = useUnits();
  const { data: ownersData, setData: setOwners } = useOwners();
  const { data: tasksData, setData: setTasks } = useTasks();
  const units = unitsData ?? EMPTY_UNITS;
  const owners = ownersData ?? EMPTY_OWNERS;
  const tasks = tasksData ?? EMPTY_TASKS;

  // SuiteCRM Clients State
  const { data: clientsData, setData: setClients } = useClients();
  const clients = clientsData ?? EMPTY_CLIENTS;

  // Worklenz Team State
  const { data: teamData, setData: setTeam } = useTeam();
  const team = teamData ?? EMPTY_TEAM;

  // Sales Contracts & Commissions State (Monitored for 7-day proactive expiry)
  const { data: contractsData, setData: setContracts } = useContracts();
  const contracts = contractsData ?? EMPTY_CONTRACTS;

  const handleUpdateContracts = (updated: SalesContract[]) => {
    setContracts(updated);
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('');
  const [compoundFilter, setCompoundFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals & Panels
  const [selectedQuotationUnit, setSelectedQuotationUnit] = useState<Unit | null>(null);
  const [isCompoundAnalysisOpen, setIsCompoundAnalysisOpen] = useState(false);
  const [selectedCompoundForAnalysis, setSelectedCompoundForAnalysis] = useState<string>('');
  const [isNewUnitModalOpen, setIsNewUnitModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isSavingUnit, setIsSavingUnit] = useState(false);

  // UI Settings & Customization State
  const { data: uiSettingsData, setData: setUiSettings } = useUiSettings();
  const uiSettings = useMemo(() => uiSettingsData ?? loadUiSettings(), [uiSettingsData]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Notifications State for Real-time Database Sync
  // (notifications state lives in AppUIProvider — consumed via useAppUI above)
  const [dismissedToastIds, setDismissedToastIds] = useState<Set<string>>(new Set());

  // Timer tick for real-time due tasks check
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Next.js location + unit route param (/units/:id drives the detail modal)
  const pathname = usePathname() || '';
  const router = useRouter();
  const unitMatch = pathname.match(/^\/units\/([^/]+)/);
  const unitIdParam = unitMatch ? unitMatch[1] : undefined;

  // QR deep-link boot resolver: legacy ?unitId= / ?unit= / #unit= → /units/:id (runs once)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target = resolveLegacyUnitLocation(window.location.search, window.location.hash);
    if (target) router.replace(target);
  }, [router]);

  // URL → selection: the path param is the single source of truth for the modal
  useEffect(() => {
    if (unitIdParam === undefined) {
      // Don't auto-clear if selected via table row click
    } else {
      setSelectedUnit(units.find(u => u.id === unitIdParam) ?? null);
    }
  }, [unitIdParam, units, setSelectedUnit]);

  // Selection → URL (replace, so back/forward never toggles the modal).
  // Only reacts to selection changes, so external navigation always wins.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedUnit) {
      if (!pathname.startsWith(`/units/${selectedUnit.id}`)) {
        window.history.replaceState(null, '', `/units/${selectedUnit.id}`);
      }
    } else if (pathname.startsWith('/units/')) {
      window.history.replaceState(null, '', `/${activeNavTab}`);
    }
  }, [selectedUnit, pathname, activeNavTab]);

  // Compute tasks due within the next 2 hours
  const imminentTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.stage === 'completed' || !task.dueDate) return false;
      const timeStr = task.dueTime ? (task.dueTime.length === 5 ? `${task.dueTime}:00` : task.dueTime) : '23:59:00';
      const target = new Date(`${task.dueDate}T${timeStr}`);
      if (isNaN(target.getTime())) return false;
      const diffMins = Math.round((target.getTime() - currentTimestamp) / 60000);
      // Within next 2 hours: from -30 mins past due up to +120 mins
      return diffMins >= -30 && diffMins <= 120;
    });
  }, [tasks, currentTimestamp]);

  // Desktop notification permission & trigger
  const [desktopNotificationPermission, setDesktopNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const handleRequestDesktopNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setDesktopNotificationPermission(perm);
        if (perm === 'granted') {
          new Notification(t('notifications.desktop.enabled.title'), {
            body: t('notifications.desktop.enabled.body')
          });
        }
      } catch (err) {
        console.warn('Desktop notification request failed:', err);
      }
    }
  };

  // Push imminent tasks into notifications system & desktop notification (avoiding duplicates)
  useEffect(() => {
    if (imminentTasks.length === 0) return;

    setNotifications(prev => {
      const existingTaskIds = new Set(prev.filter(n => n.taskId).map(n => n.taskId));
      const existingIds = new Set(prev.map(n => n.id));
      const toAdd: AppNotification[] = [];

      imminentTasks.forEach((task) => {
        const notifId = `task-imminent-${task.id}`;
        if (!existingTaskIds.has(task.id) && !existingIds.has(notifId)) {
          existingTaskIds.add(task.id);
          existingIds.add(notifId);
          toAdd.push(makeImminentTaskNotification(task));

          // Browser Desktop Notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(
                t('notifications.desktop.task.title', { title: task.title }),
                {
                  body: t('notifications.desktop.task.body', {
                    client: task.clientName,
                    due: task.dueTime || t('common.within2Hours'),
                  })
                }
              );
            } catch (e) {
              console.warn('Failed to dispatch desktop notification', e);
            }
          }
        }
      });

      if (toAdd.length === 0) return prev;
      return mergeNotifications(prev, toAdd);
    });
  }, [imminentTasks, t]);

  // Proactive Alerts System: Monitor contracts expiring within 7 days & notify Sales Managers
  useEffect(() => {
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const toAdd: AppNotification[] = [];

      contracts.forEach((cnt) => {
        if (!cnt.expiryDate) return;
        const expiryInfo = calculateContractExpiryInfo(cnt.expiryDate);
        if (expiryInfo.isExpiringSoon || expiryInfo.isExpired) {
          const notifId = `cnt-expiry-${cnt.id}`;
          if (!existingIds.has(notifId)) {
            existingIds.add(notifId);
            const newNotif = makeContractExpiryNotification(cnt, expiryInfo);
            toAdd.push(newNotif);

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(notificationTitle(newNotif, t), { body: notificationMessage(newNotif, t) });
              } catch (e) {}
            }
          }
        }
      });

      if (toAdd.length === 0) return prev;
      return mergeNotifications(prev, toAdd);
    });
  }, [contracts, t]);

  // Compute live KPIs
  const kpis: DashboardKPIs = useMemo(
    () => computeDashboardKpis({
      units, owners, tasks, clients,
      mode: activeNavTab === 'rent' ? 'rent' : 'sales',
    }),
    [units, owners, tasks, clients, activeNavTab]
  );

  // Filtered Units computation
  const filteredUnits = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return units.filter((u) => {
      // Nav tab separation: rent vs sales
      if (activeNavTab === 'rent' && u.category !== 'rent') return false;
      if (activeNavTab === 'sales' && u.category === 'rent') return false;

      const matchesSearch =
        !q ||
        u.id.toLowerCase().includes(q) ||
        u.compound.toLowerCase().includes(q) ||
        u.area.toLowerCase().includes(q) ||
        u.unitType.toLowerCase().includes(q) ||
        (u.agent && u.agent.toLowerCase().includes(q)) ||
        (u.notes && u.notes.toLowerCase().includes(q));

      const matchesStatus = !statusFilter || u.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesCompound = !compoundFilter || u.compound.toLowerCase().includes(compoundFilter.toLowerCase());
      const matchesArea = !areaFilter || u.area === areaFilter;
      const matchesType = !typeFilter || u.unitType.toLowerCase().includes(typeFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCompound && matchesArea && matchesType;
    });
  }, [units, activeNavTab, searchQuery, statusFilter, compoundFilter, areaFilter, typeFilter]);

  // Auth Initialization on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Compute overdue tasks count across all active tasks
  const overdueTasksCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter(task => task.stage !== 'completed' && task.dueDate && task.dueDate < today).length;
  }, [tasks]);

  // Authentication Handlers
  const handleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setIsSmartRemindersOpen(true);
      }
    } catch (err) {
      console.error('Google Sign In failed:', err);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  // Sync data from Database (Supabase Cloud / Local Storage)
  const handleSyncFromDatabase = async () => {
    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const unitRepo = getUnitRepository();
      const ownerRepo = getOwnerRepository();
      const [fetchedUnits, fetchedOwners] = await Promise.all([
        unitRepo.list(),
        ownerRepo.list(),
      ]);
      
      if (fetchedUnits && fetchedUnits.length > 0) {
        // Detect real-time status transitions to 'Sold' or 'Reserved'
        const newAlerts = makeUnitTransitionAlerts(units, fetchedUnits);
        if (newAlerts.length > 0) setNotifications(prev => mergeNotifications(prev, newAlerts));

        setUnits(fetchedUnits);
      }
      if (fetchedOwners && fetchedOwners.length > 0) {
        setOwners(fetchedOwners);
      }

      const saleCount = (fetchedUnits || []).filter(u => u.category !== 'rent').length;
      const rentCount = (fetchedUnits || []).filter(u => u.category === 'rent').length;

      setSyncStatus(
        t('sync.success', {
          sales: saleCount,
          rent: rentCount,
          owners: (fetchedOwners || []).length,
        })
      );
    } catch (err) {
      console.warn('Sync error:', err);
      const syncMessage = err instanceof Error ? err.message : String(err);
      setSyncStatus(t('sync.error', { error: syncMessage }));
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 6000);
    }
  };

  // Auto-sync on initial mount
  useEffect(() => {
    handleSyncFromDatabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic Auto-Sync from database if configured in UI Settings
  useEffect(() => {
    if (uiSettings.autoSyncInterval > 0) {
      const timer = setInterval(() => {
        handleSyncFromDatabase();
      }, uiSettings.autoSyncInterval * 1000);
      return () => clearInterval(timer);
    }
  }, [uiSettings.autoSyncInterval, units]);

  const handleImportUnits = (importedUnits: Unit[]) => {
    setUnits(importedUnits);
    setSyncStatus(t('sync.imported', { n: importedUnits.length }));
    setTimeout(() => setSyncStatus(null), 6000);
  };

  // Add new unit (saved to database repository)
  const handleAddUnit = async (newUnit: Unit) => {
    setIsSavingUnit(true);
    try {
      setUnits((prev) => [newUnit, ...prev.filter(u => u.id !== newUnit.id)]);
      const unitRepo = getUnitRepository();
      await unitRepo.create(newUnit);
    } catch (err) {
      console.warn('Could not save unit to database repository:', err);
    } finally {
      setIsSavingUnit(false);
    }
  };

  // Update unit status, notes or details and record in audit log
  const handleAddTask = (newTask: FollowUpTask) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateUnit = async (updatedUnit: Unit) => {
    const nextUnits = units.map(u => u.id === updatedUnit.id ? updatedUnit : u);
    setUnits(nextUnits);
    setSelectedUnit(updatedUnit);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/units/${updatedUnit.id}`);
    }

    try {
      const unitRepo = getUnitRepository();
      await unitRepo.update(updatedUnit.id, updatedUnit);
    } catch (err) {
      console.warn('Could not update unit in database repository:', err);
    }

    // If unit was marked Sold, show celebratory notification toast
    const soldNotification = makeSoldToast(updatedUnit);
    if (soldNotification) setNotifications(prev => mergeNotifications(prev, [soldNotification]));
  };

  if (isInitialLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        uiSettings.theme === 'light' ? 'bg-surface text-text' : 'bg-surface text-text'
      }`}>
        <AnimatedLogoLoader 
          message={t('loader.boot')}
          subMessage={t('loader.bootSub')}
          size="lg"
        />
      </div>
    );
  }

  const renderCrmBody = () => (
    <>

        {/* Persistent Banner Alert for Tasks Due within 2 Hours */}
        {imminentTasks.length > 0 && (
          <TaskImminentBanner
            tasks={imminentTasks}
            onNavigateToTasks={() => setActiveNavTab('tasks')}
            onOpenSmartReminders={() => setIsSmartRemindersOpen(true)}
            onRequestDesktopNotification={handleRequestDesktopNotification}
            desktopNotificationPermission={desktopNotificationPermission}
            isArabic={isArabic}
            theme={uiSettings.theme}
          />
        )}

        {/* Sync notification banner */}
        {syncStatus && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* In-app 404 for unknown single-segment paths (e.g. /whatever) */}
        {isNotFound ? (
          <div data-testid="view-not-found" className="flex flex-col items-center justify-center text-center py-16 px-4">
            <p className="text-4xl font-black text-text-muted mb-4">404</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {t('common.notFound.title')}
            </h2>
            <p className="text-xs text-text-muted mt-2 max-w-md">
              {t('common.notFound.body')}
            </p>
            <Link
              href="/sales"
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              {t('common.notFound.back')}
            </Link>
          </div>
        ) : (
        <div data-testid={`view-${activeNavTab}`}>
        <Suspense fallback={<AnimatedLogoLoader theme={theme} fullScreen={false} />}>

        {/* TAB 1: SALES UNITS / TAB 2: RENT UNITS */}
        {(activeNavTab === 'sales' || activeNavTab === 'rent') && (
          <>
            {/* Dashboard Header Bar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span>
                      {activeNavTab === 'rent'
                        ? t('units.inventory.rent')
                        : t('units.inventory.sales')}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {t('units.inventory.subtitle')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Desktop View Mode Toggle: Table View vs D3 Compound Map */}
                  <div className="hidden sm:flex items-center bg-surface border border-border rounded-lg p-1 text-xs">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                        viewMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-text-muted hover:text-text'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{t('units.tableView')}</span>
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                        viewMode === 'map' ? 'bg-blue-600 text-white shadow-sm' : 'text-text-muted hover:text-text'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{t('units.compoundMap')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Metrics Cards Row */}
              <KPISection kpis={kpis} />
            </div>

            {/* Regional Mini Dashboard: Units Distribution (October / Zayed) & Impact on Pipeline Deals Volume */}
            <SalesRegionalMiniDashboard
              units={units}
              isArabic={isArabic}
              theme={uiSettings.theme}
              activeAreaFilter={areaFilter}
              onFilterArea={(area) => setAreaFilter(area === 'all' ? '' : area)}
            />

            {/* Inventory Controls & Table Section or D3 Map */}
            {viewMode === 'map' ? (
              <div className="space-y-6">
                <CompoundUnitMap
                  units={units}
                  onSelectUnit={(u) => setSelectedUnit(u)}
                  isArabic={isArabic}
                />
              </div>
            ) : (
              <div className="w-full">
                <UnitsTable
                  units={units}
                  filteredUnits={filteredUnits}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  compoundFilter={compoundFilter}
                  setCompoundFilter={setCompoundFilter}
                  areaFilter={areaFilter}
                  setAreaFilter={setAreaFilter}
                  typeFilter={typeFilter}
                  setTypeFilter={setTypeFilter}
                  onSelectUnit={(u) => setSelectedUnit(u)}
                  onOpenNewModal={() => setIsNewUnitModalOpen(true)}
                  isArabic={isArabic}
                  isSyncing={isSyncing}
                  tableDensity={uiSettings.tableDensity}
                  theme={uiSettings.theme}
                  onOpenCompoundAnalysis={(comp) => {
                    setSelectedCompoundForAnalysis(comp || compoundFilter || '');
                    setIsCompoundAnalysisOpen(true);
                  }}
                  onExportQuotation={(unit) => setSelectedQuotationUnit(unit)}
                  onUpdateUnit={handleUpdateUnit}
                />
              </div>
            )}
          </>
        )}

        {/* TAB: COMPOUND MAP DIRECT VIEW */}
        {activeNavTab === 'map' && (
          <div className="space-y-6">
            <KPISection kpis={kpis} />
            <CompoundUnitMap
              units={units}
              onSelectUnit={(u) => setSelectedUnit(u)}
              isArabic={isArabic}
              theme={uiSettings.theme}
            />
          </div>
        )}

        {/* TAB: CALENDAR & CLIENT VIEWINGS SCHEDULE */}
        {activeNavTab === 'calendar' && (
          <CalendarView
            tasks={tasks}
            team={team}
            onUpdateTasks={setTasks}
            isArabic={isArabic}
            theme={uiSettings.theme}
          />
        )}

        {/* TAB: SALES CONTRACTS & AGENT COMMISSIONS ENGINE */}
        {activeNavTab === 'contracts' && (
          <ContractsAndCommissions
            contracts={contracts}
            onUpdateContracts={handleUpdateContracts}
            units={units}
            team={team}
            tasks={tasks}
            onAddTask={handleAddTask}
            isArabic={isArabic}
            theme={uiSettings.theme}
          />
        )}

        {/* TAB 3: CLIENTS & OPPORTUNITIES (SuiteCRM Engine) */}
        {activeNavTab === 'clients' && (
          <SuiteCRMClients
            clients={clients}
            onUpdateClients={setClients}
            team={team}
            isArabic={isArabic}
            tasks={tasks}
            onAddTask={handleAddTask}
          />
        )}

        {/* TAB 4: OWNERS */}
        {activeNavTab === 'owners' && (
          <OwnersTab
            owners={owners}
            onUpdateOwners={setOwners}
            units={units}
            contracts={contracts}
            isArabic={isArabic}
            theme={uiSettings.theme}
            onFilterUnitsByOwner={() => {
              setActiveNavTab('sales');
            }}
          />
        )}

        {/* TAB: MONTHLY SALES REPORTS (RECHARTS) */}
        {activeNavTab === 'reports' && (
          <MonthlySalesReports
            units={units}
            kpis={kpis}
            isArabic={isArabic}
            theme={uiSettings.theme}
          />
        )}

        {/* TAB: UNIFIED TEAM WORKLOAD & KANBAN PIPELINE WORKSPACE */}
        {(activeNavTab === 'tasks' || activeNavTab === 'team') && (
          <TeamAndTasksWorkspace
            tasks={tasks}
            onUpdateTasks={setTasks}
            team={team}
            onUpdateTeam={setTeam}
            units={units}
            isArabic={isArabic}
            theme={uiSettings.theme}
            onOpenSmartReminders={() => setIsSmartRemindersOpen(true)}
            clients={clients}
            onUpdateClients={setClients}
          />
        )}

        {/* TAB 6: DEDICATED GEMINI AI COPILOT PAGE */}
        {activeNavTab === 'gemini' && (
          <GeminiCopilotPage
            units={units}
            kpis={kpis}
            isArabic={isArabic}
            onNavigateToTab={(tab) => setActiveNavTab(tab)}
            onQuickFilter={(q) => {
              setSearchQuery(q);
              setActiveNavTab('sales');
            }}
          />
        )}

        {/* TAB 7: GEOGRAPHIC DISTRIBUTION & CONCENTRATION MAP (WEST CAIRO GIS) */}
        {activeNavTab === 'geo' && (
          <GeographicDistributionMap
            units={units}
            onSelectUnit={(u) => setSelectedUnit(u)}
            isArabic={isArabic}
            theme={uiSettings.theme}
          />
        )}

        {/* TAB 8: DEDICATED SYSTEM SETTINGS & SUPABASE CLOUD SYNC (Worklenz Enterprise) */}
        {activeNavTab === 'settings' && (
          <SettingsPage
            onSync={handleSyncFromDatabase}
            isSyncing={isSyncing}
            syncStatus={syncStatus}
            onOpenPasteModal={() => setIsPasteModalOpen(true)}
            uiSettings={uiSettings}
            onUpdateUISettings={setUiSettings}
            units={units}
            tasks={tasks}
            team={team}
            clients={clients}
            isArabic={isArabic}
            onToggleTheme={toggleTheme}
          />
        )}

        {/* TAB: CRM EXECUTIVE OVERVIEW */}
        {activeNavTab === 'overview' && (
          <CrmOverview
            units={units}
            clients={clients}
            tasks={tasks}
            kpis={kpis}
            isArabic={isArabic}
            onNavigate={(tab) => setActiveNavTab(tab as any)}
            onOpenNewUnit={() => setIsNewUnitModalOpen(true)}
            onSyncDatabase={handleSyncFromDatabase}
            isSyncing={isSyncing}
          />
        )}

        {/* TAB: LANDING PAGE CMS & PUBLISHER */}
        {activeNavTab === 'landing-page-cms' && (
          <LandingPageCmsView
            units={units}
            isArabic={isArabic}
            onUpdateUnit={handleUpdateUnit}
          />
        )}

        {/* TAB: BLOG & ARTICLES STUDIO */}
        {activeNavTab === 'articles' && (
          <BlogArticlesManager
            isArabic={isArabic}
          />
        )}
        </Suspense>
        </div>
        )}

        {/* Real-time Database Notification Toasts (Corner Alerts for Sold/Reserved & Imminent Tasks) */}
        <NotificationToast
          notifications={notifications.filter(n => !dismissedToastIds.has(n.id))}
          onDismiss={(id) => {
            setDismissedToastIds(prev => new Set(prev).add(id));
          }}
          onSelectUnit={(unitId) => {
            const u = units.find(unit => unit.id === unitId);
            if (u) setSelectedUnit(u);
          }}
          onSelectTask={() => {
            setActiveNavTab('tasks');
          }}
          theme={uiSettings.theme}
        />

        <Suspense fallback={null}>
          {/* UI Customization & Settings Modal (Dark/Light mode & Table Density) */}
          <UISettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            settings={uiSettings}
            onUpdateSettings={setUiSettings}
            isArabic={isArabic}
          />

          {/* Unit Inspector Modal with Modification History, QR Code, and PDF Brochure Export */}
          {selectedUnit && (
            <UnitDetailModal
              unit={selectedUnit}
              onClose={() => setSelectedUnit(null)}
              isArabic={isArabic}
              owners={owners}
              theme={uiSettings.theme}
              onUpdateUnit={handleUpdateUnit}
              allUnits={units}
              images={selectedUnit.images}
              onOpenCompoundPriceModal={(compoundName) => {
                setSelectedCompoundForAnalysis(compoundName);
                setIsCompoundAnalysisOpen(true);
              }}
              onAskAIAboutUnit={() => {
                setSelectedUnit(null);
                setActiveNavTab('gemini');
              }}
            />
          )}

          {/* New Unit Creator Modal */}
          <NewUnitModal
            isOpen={isNewUnitModalOpen}
            onClose={() => setIsNewUnitModalOpen(false)}
            onAddUnit={handleAddUnit}
            isArabic={isArabic}
            isSaving={isSavingUnit}
          />

          {/* Paste & Import Property Data Modal */}
          <PasteDataModal
            isOpen={isPasteModalOpen}
            onClose={() => setIsPasteModalOpen(false)}
            onImportUnits={handleImportUnits}
            isArabic={isArabic}
          />

          {/* Compound Price Range Distribution & Market Valuation Modal */}
          <CompoundPriceDistributionModal
            isOpen={isCompoundAnalysisOpen}
            onClose={() => setIsCompoundAnalysisOpen(false)}
            units={units}
            initialCompound={selectedCompoundForAnalysis || compoundFilter}
            isArabic={isArabic}
            theme={uiSettings.theme}
            onSelectUnit={(u) => setSelectedUnit(u)}
            onExportQuotation={(u) => setSelectedQuotationUnit(u)}
          />

          {/* Official Customer Price Offer / Quotation Modal */}
          <UnitOfficialQuotationModal
            isOpen={!!selectedQuotationUnit}
            onClose={() => setSelectedQuotationUnit(null)}
            unit={selectedQuotationUnit}
            isArabic={isArabic}
            theme={uiSettings.theme}
          />
        </Suspense>
    </>
  );

  if (embedded) {
    return (
      <div className="w-full space-y-6 px-2 sm:px-4 lg:px-6 py-4" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-card-border">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncFromDatabase}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition cursor-pointer disabled:opacity-50"
            >
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
              <span>{isSyncing ? (isArabic ? 'جاري المزامنة...' : 'Syncing...') : (isArabic ? 'مزامنة السحاب' : 'Sync Data')}</span>
            </button>
            {(kpis?.todayFollowUpsCount ?? 0) > 0 && (
              <button
                onClick={() => setActiveNavTab('tasks')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-pointer"
              >
                <span>{kpis?.todayFollowUpsCount} {isArabic ? 'مهام مستحقة' : 'Due Tasks'}</span>
              </button>
            )}
            {syncStatus && (
              <span className="text-xs text-text-tertiary">
                {syncStatus}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewUnitModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white shadow-xs hover:bg-primary/90 transition cursor-pointer"
            >
              <span>+ {isArabic ? 'إضافة وحدة' : 'New Unit'}</span>
            </button>
            <button
              onClick={() => setIsPasteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-card-border bg-card-surface-area hover:bg-background-gray-primary transition cursor-pointer"
            >
              <span>{isArabic ? 'لصق بيانات' : 'Paste Data'}</span>
            </button>
          </div>
        </div>

        {renderCrmBody()}
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen flex font-sans transition-colors duration-200 ${
        uiSettings.theme === 'light' ? 'bg-surface-raised text-text' : 'bg-surface text-text'
      } ${
        isArabic ? 'text-right' : 'text-left'
      }`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <Sidebar
        activeNavTab={activeNavTab}
        setActiveNavTab={setActiveNavTab}
        isArabic={isArabic}
        setIsArabic={setIsArabic}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onRefresh={handleSyncFromDatabase}
        isSyncing={isSyncing}
        salesCount={units.filter(u => u.category !== 'rent').length}
        rentCount={units.filter(u => u.category === 'rent').length}
        dueTasksCount={kpis.todayFollowUpsCount}
        leadsCount={clients.length}
        teamCount={team.length}
        ownersCount={owners.length}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenSettings={() => setActiveNavTab('settings')}
        theme={uiSettings.theme}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          isArabic={isArabic}
          setIsArabic={setIsArabic}
          activeNavTab={activeNavTab}
          setActiveNavTab={setActiveNavTab}
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onRefresh={handleSyncFromDatabase}
          isSyncing={isSyncing}
          dueTasksCount={kpis.todayFollowUpsCount}
          overdueTasksCount={overdueTasksCount}
          onOpenSmartReminders={() => setIsSmartRemindersOpen(true)}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          notifications={notifications}
          onClearNotifications={() => setNotifications([])}
          onSelectUnit={(unitId) => {
            const found = units.find(u => u.id === unitId);
            if (found) setSelectedUnit(found);
          }}
          onSelectTask={() => {
            setActiveNavTab('tasks');
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-6">
          {renderCrmBody()}
        </main>
      </div>
    </div>
  );
}
