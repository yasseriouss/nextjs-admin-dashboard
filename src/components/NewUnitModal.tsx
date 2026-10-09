import { formatNumber } from '../i18n/format';
import React, { useState } from 'react';
import { normalizeUnitStatus } from '../lib/units';
import { 
  X, 
  Plus, 
  AlertCircle
} from 'lucide-react';
import { Unit } from '../types';
import { useT } from '../i18n/useT';
import { UNIT_STATUS_LABEL } from '../i18n/labels';

interface NewUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUnit: (unit: Unit) => Promise<void>;
  isArabic: boolean;
  isSaving?: boolean;
}

export const NewUnitModal: React.FC<NewUnitModalProps> = ({
  isOpen,
  onClose,
  onAddUnit,
  isArabic,
  isSaving
}) => {
  const t = useT();
  const [formData, setFormData] = useState({
    id: `OCT-${Math.floor(100 + Math.random() * 900)}`,
    status: 'Available',
    compound: '',
    area: '6th of October (أكتوبر)', // i18n-allow
    propertyType: 'Residential',
    unitType: 'Apartment (شقة)', // i18n-allow
    size: '150',
    beds: '3',
    price: '6500000',
    currency: 'EGP',
    deliveryDate: 'Ready to Move',
    ownerName: '',
    ownerPhone: '+20 100 ',
    notes: ''
  });

  const [confirmDialog, setConfirmDialog] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.compound || !formData.id) {
      setFormError(t('units.newUnit.error'));
      return;
    }
    setFormError(null);
    // Show mandatory confirmation modal before saving / mutating sheet data
    setConfirmDialog(true);
  };

  const handleConfirmedSave = async () => {
    const newUnit: Unit = {
      id: formData.id,
      status: normalizeUnitStatus(formData.status),
      compound: formData.compound,
      area: formData.area,
      propertyType: formData.propertyType,
      unitType: formData.unitType,
      size: parseFloat(formData.size) || formData.size,
      beds: formData.beds,
      price: parseFloat(formData.price) || 0,
      currency: formData.currency,
      deliveryDate: formData.deliveryDate,
      ownerName: formData.ownerName,
      ownerPhone: formData.ownerPhone,
      notes: formData.notes
    };

    await onAddUnit(newUnit);
    setConfirmDialog(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-surface border border-border rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface sticky top-0 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent text-accent border border-accent">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {t('units.newUnit.title')}
              </h2>
              <p className="text-xs text-text-muted">
                {t('units.newUnit.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{formError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-muted font-semibold mb-1">
                {t('units.newUnit.idLabel')}
              </label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-text-muted font-semibold mb-1">
                {t('units.th.status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-accent cursor-pointer"
              >
                {(Object.keys(UNIT_STATUS_LABEL) as Array<keyof typeof UNIT_STATUS_LABEL>).map((code) => (
                  <option key={code} value={code}>{isArabic ? `${t(UNIT_STATUS_LABEL[code])} (${code})` : t(UNIT_STATUS_LABEL[code])}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-muted font-semibold mb-1">
                {t('units.newUnit.compoundLabel')}
              </label>
              <input
                type="text"
                required
                placeholder="Palm Hills, Mountain View, O West..."
                value={formData.compound}
                onChange={(e) => setFormData({ ...formData, compound: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-text-muted font-semibold mb-1">
                {t('units.newUnit.areaLabel')}
              </label>
              <select
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="6th of October (أكتوبر)">6th of October (أكتوبر)</option> {/* i18n-allow */}
                <option value="Sheikh Zayed (الشيخ زايد)">Sheikh Zayed (الشيخ زايد)</option> {/* i18n-allow */}
                <option value="October Gardens (حدائق أكتوبر)">October Gardens (حدائق أكتوبر)</option> {/* i18n-allow */}
                <option value="New October (أكتوبر الجديدة)">New October (أكتوبر الجديدة)</option> {/* i18n-allow */}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-text-muted font-semibold mb-1">
                {t('units.newUnit.typeLabel')}
              </label>
              <select
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="Apartment (شقة)">Apartment (شقة)</option> {/* i18n-allow */}
                <option value="Duplex (دوبلكس)">Duplex (دوبلكس)</option> {/* i18n-allow */}
                <option value="Penthouse (بنتهاوس)">Penthouse (بنتهاوس)</option> {/* i18n-allow */}
                <option value="Townhouse (تاون هاوس)">Townhouse (تاون هاوس)</option> {/* i18n-allow */}
                <option value="Twin House (توين هاوس)">Twin House (توين هاوس)</option> {/* i18n-allow */}
                <option value="Stand-alone Villa (فيلا منفصلة)">Stand-alone Villa (فيلا منفصلة)</option> {/* i18n-allow */}
                <option value="Commercial / Clinic (تجاري / عيادة)">Commercial / Clinic (تجاري / عيادة)</option> {/* i18n-allow */}
              </select>
            </div>

            <div>
              <label className="block text-text-muted font-semibold mb-1">
                {t('units.newUnit.sizeLabel')}
              </label>
              <input
                type="number"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-text-muted font-semibold mb-1">
                {t('units.newUnit.bedsLabel')}
              </label>
              <input
                type="text"
                value={formData.beds}
                onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-muted font-semibold mb-1">
                {t('units.newUnit.priceLabel')}
              </label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-text-muted font-semibold mb-1">
                {t('units.newUnit.deliveryLabel')}
              </label>
              <input
                type="text"
                placeholder="Ready to Move, 2026..."
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-muted font-semibold mb-1">
                {t('units.newUnit.ownerLabel')}
              </label>
              <input
                type="text"
                placeholder={t('units.newUnit.ownerPlaceholder')}
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-text-muted font-semibold mb-1">
                {t('units.newUnit.ownerPhoneLabel')}
              </label>
              <input
                type="text"
                value={formData.ownerPhone}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-muted font-semibold mb-1">
              {t('units.newUnit.notesLabel')}
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('units.newUnit.notesPlaceholder')}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-accent"
            />
          </div>

          {/* Dialog Action Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-raised hover:bg-surface-raised text-text-muted rounded-lg transition font-medium cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-gradient-to-r from-accent to-accent hover:from-accent hover:to-accent text-text font-bold rounded-lg transition shadow-md shadow-accent/20 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('units.newUnit.reviewSave')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Mandatory User Confirmation Dialog before writing to external Google Sheet */}
      {confirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-surface backdrop-blur-md">
          <div className="bg-surface border border-accent rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-accent">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-base">
                {t('units.newUnit.confirmTitle')}
              </h3>
            </div>
            
            <p className="text-xs text-text-muted leading-relaxed">
              {t('units.newUnit.confirmMessage', {
                id: formData.id,
                compound: formData.compound,
                price: formatNumber(formData.price),
                currency: formData.currency,
              })}
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(false)}
                className="px-3.5 py-1.5 bg-surface-raised hover:bg-surface-raised text-text-muted rounded-lg text-xs font-semibold cursor-pointer"
              >
                {t('units.newUnit.confirmCancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmedSave}
                disabled={isSaving}
                className="px-4 py-1.5 bg-accent hover:bg-accent text-text font-bold rounded-lg text-xs transition cursor-pointer shadow-md shadow-accent/20"
              >
                {isSaving ? t('units.newUnit.saving') : t('units.newUnit.confirmSave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewUnitModal;
