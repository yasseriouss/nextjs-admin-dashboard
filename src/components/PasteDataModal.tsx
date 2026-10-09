import { formatNumber } from '../i18n/format';
import React, { useState } from 'react';
import { 
  X, 
  ClipboardPaste, 
  Upload, 
  Check, 
  AlertCircle, 
  HelpCircle,
  Database
} from 'lucide-react';
import { Unit } from '../types';
import { parseDelimitedText, parseTableRows } from '../lib/dataParser';
import { useT } from '../i18n/useT';

interface PasteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportUnits: (units: Unit[]) => void;
  isArabic: boolean;
}

export const PasteDataModal: React.FC<PasteDataModalProps> = ({
  isOpen,
  onClose,
  onImportUnits,
  isArabic,
}) => {
  const t = useT();
  const [rawText, setRawText] = useState('');
  const [previewUnits, setPreviewUnits] = useState<Unit[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTextChange = (text: string) => {
    setRawText(text);
    setErrorMsg(null);

    if (!text.trim()) {
      setPreviewUnits([]);
      return;
    }

    try {
      const parsedRows = parseDelimitedText(text);
      if (parsedRows.length > 0) {
        const result = parseTableRows(parsedRows);
        setPreviewUnits(result.units);
      } else {
        setPreviewUnits([]);
      }
    } catch (e) {
      setErrorMsg((e instanceof Error ? e.message : String(e)) || 'Error parsing text');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleTextChange(content);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (previewUnits.length === 0) return;
    onImportUnits(previewUnits);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-surface border border-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-raised/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ClipboardPaste className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {t('units.paste.title')}
              </h3>
              <p className="text-xs text-text-muted">
                {t('units.paste.subtitle')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-raised transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-primary/10 border-b border-primary/20 text-xs text-primary space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-foreground">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>{t('units.paste.howTo')}</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-text-muted">
            <li>{t('units.paste.step1')}</li>
            <li>{t('units.paste.step2')}</li>
          </ol>
        </div>

        {/* Body Form */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* File Upload Option */}
          <div className="flex items-center justify-between gap-3 bg-surface border border-border rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>{t('units.paste.uploadCsv')}</span>
            </div>
            <label className="cursor-pointer px-3 py-1.5 bg-surface-raised hover:bg-surface-raised text-white rounded-lg text-xs font-medium border border-border transition">
              <span>{t('units.paste.chooseFile')}</span>
              <input 
                type="file" 
                accept=".csv,.txt,.tsv" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Text Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted flex justify-between">
              <span>{t('units.paste.pasteHere')}</span>
              {rawText && (
                <button 
                  onClick={() => handleTextChange('')}
                  className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                >
                  {t('common.clear')}
                </button>
              )}
            </label>
            <textarea
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={"Unit ID\tStatus\tArea\tCompound\tSize\tPrice...\nU-101\tAvailable\t6 October\tMountain View\t180\t4500000"}
              rows={6}
              className="w-full bg-surface-raised/50 border border-border rounded-xl p-3 text-xs font-mono text-white placeholder-text-muted focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Parse Error */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {previewUnits.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {t('units.paste.detected', { n: previewUnits.length })}
                </span>
                <span className="text-text-muted text-[11px]">
                  {previewUnits.filter(u => u.category === 'sales').length} {t('common.sales')} • {' '}
                  {previewUnits.filter(u => u.category === 'rent').length} {t('common.rent')}
                </span>
              </div>

              <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-surface-raised text-text-muted sticky top-0">
                    <tr>
                      <th className="p-2 border-b border-border">{t('common.id')}</th>
                      <th className="p-2 border-b border-border">{t('units.th.compound')}</th>
                      <th className="p-2 border-b border-border">{t('units.th.size')}</th>
                      <th className="p-2 border-b border-border">{t('units.askingPrice')}</th>
                      <th className="p-2 border-b border-border">{t('units.th.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewUnits.slice(0, 10).map((u, i) => (
                      <tr key={i} className="hover:bg-surface-raised/40">
                        <td className="p-2 font-mono text-primary">{u.id}</td>
                        <td className="p-2 text-white">{u.compound}</td>
                        <td className="p-2 text-text-muted">{u.size} m²</td>
                        <td className="p-2 font-medium text-emerald-400">{formatNumber(u.price)} {u.currency}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            u.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            u.status === 'Reserved' ? 'bg-accent/10 text-accent border border-accent/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewUnits.length > 10 && (
                <p className="text-[10px] text-center text-text-muted">
                  {t('units.paste.more', { n: previewUnits.length - 10 })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-surface-raised/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-white hover:bg-surface-raised transition cursor-pointer"
          >
            {t('common.cancel')}
          </button>

          <button
            onClick={handleApplyImport}
            disabled={previewUnits.length === 0}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg cursor-pointer ${
              previewUnits.length > 0
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                : 'bg-surface-raised text-text-muted cursor-not-allowed opacity-50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>
              {t('units.paste.importButton', { n: previewUnits.length })}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasteDataModal;
