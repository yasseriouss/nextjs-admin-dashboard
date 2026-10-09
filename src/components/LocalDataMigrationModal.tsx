import React, { useState } from 'react';
import { Database, CheckCircle, AlertTriangle, ArrowRight, X, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { formatNumber } from '../i18n/format';
import { isSupabaseConfigured } from '../services/supabase/client';
import { loadUnits, loadClients, loadTasks, loadContracts, loadOwners } from '../data/storage';
import {
  SupabaseUnitRepository,
  SupabaseClientRepository,
  SupabaseTaskRepository,
  SupabaseContractRepository,
  SupabaseOwnerRepository,
} from '../repositories';

interface LocalDataMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalDataMigrationModal: React.FC<LocalDataMigrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const units = loadUnits();
  const clients = loadClients();
  const tasks = loadTasks();
  const contracts = loadContracts();
  const owners = loadOwners();

  const isConfigured = isSupabaseConfigured();

  const handleStartMigration = async () => {
    setStatus('migrating');
    setProgress(5);
    setErrorMessage(null);

    try {
      const unitRepo = new SupabaseUnitRepository();
      const clientRepo = new SupabaseClientRepository();
      const taskRepo = new SupabaseTaskRepository();
      const contractRepo = new SupabaseContractRepository();
      const ownerRepo = new SupabaseOwnerRepository();

      // 1. Units (30%)
      for (let i = 0; i < units.length; i++) {
        await unitRepo.create(units[i]);
      }
      setProgress(30);

      // 2. Clients (50%)
      for (let i = 0; i < clients.length; i++) {
        await clientRepo.create(clients[i]);
      }
      setProgress(50);

      // 3. Tasks (70%)
      for (let i = 0; i < tasks.length; i++) {
        await taskRepo.create(tasks[i]);
      }
      setProgress(70);

      // 4. Contracts (85%)
      for (let i = 0; i < contracts.length; i++) {
        await contractRepo.create(contracts[i]);
      }
      setProgress(85);

      // 5. Owners (100%)
      for (let i = 0; i < owners.length; i++) {
        await ownerRepo.create(owners[i]);
      }
      setProgress(100);
      setStatus('success');
    } catch (err: unknown) {
      console.error('[Migration] Failed:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error during migration');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg p-6 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl text-brand-text">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-2 text-brand-muted hover:text-brand-text transition-colors rounded-lg"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-xl border border-brand-gold/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-text">{t('migration.modal.title')}</h3>
            <p className="text-xs text-brand-muted mt-0.5">{t('migration.modal.desc')}</p>
          </div>
        </div>

        {!isConfigured && (
          <div className="mb-4 p-3 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{t('migration.modal.notConfigured')}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-4">
          <div className="p-3 bg-brand-bg rounded-xl border border-brand-border/60 text-center">
            <span className="block text-xs text-brand-muted">{t('migration.modal.unitsCount', { n: '' })}</span>
            <span className="text-base font-bold text-brand-gold">{formatNumber(units.length, lang)}</span>
          </div>
          <div className="p-3 bg-brand-bg rounded-xl border border-brand-border/60 text-center">
            <span className="block text-xs text-brand-muted">{t('migration.modal.clientsCount', { n: '' })}</span>
            <span className="text-base font-bold text-brand-text">{formatNumber(clients.length, lang)}</span>
          </div>
          <div className="p-3 bg-brand-bg rounded-xl border border-brand-border/60 text-center">
            <span className="block text-xs text-brand-muted">{t('migration.modal.tasksCount', { n: '' })}</span>
            <span className="text-base font-bold text-brand-text">{formatNumber(tasks.length, lang)}</span>
          </div>
          <div className="p-3 bg-brand-bg rounded-xl border border-brand-border/60 text-center">
            <span className="block text-xs text-brand-muted">{t('migration.modal.contractsCount', { n: '' })}</span>
            <span className="text-base font-bold text-brand-text">{formatNumber(contracts.length, lang)}</span>
          </div>
          <div className="p-3 bg-brand-bg rounded-xl border border-brand-border/60 text-center">
            <span className="block text-xs text-brand-muted">{t('migration.modal.ownersCount', { n: '' })}</span>
            <span className="text-base font-bold text-brand-text">{formatNumber(owners.length, lang)}</span>
          </div>
        </div>

        {status === 'migrating' && (
          <div className="my-4">
            <div className="flex justify-between text-xs text-brand-muted mb-1.5">
              <span>{t('migration.modal.migrating')}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-brand-bg rounded-full h-2 overflow-hidden border border-brand-border">
              <div
                className="bg-brand-gold h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="my-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{t('migration.modal.completed')}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-brand-muted hover:text-brand-text transition-colors rounded-xl border border-brand-border"
          >
            {t('common.close')}
          </button>
          <button
            onClick={handleStartMigration}
            disabled={status === 'migrating' || status === 'success'}
            className="px-5 py-2 text-xs font-semibold text-brand-navy bg-brand-gold hover:bg-brand-gold/90 transition-all rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {status === 'migrating' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('migration.modal.migrating')}</span>
              </>
            ) : (
              <>
                <span>{t('migration.modal.start')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
