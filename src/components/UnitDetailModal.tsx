import { formatNumber } from '../i18n/format';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  MapPin, 
  Building, 
  Bed, 
  Maximize2, 
  Phone, 
  User, 
  Calendar, 
  CheckCircle, 
  FileText,
  Clock,
  Sparkles,
  Share2,
  Download,
  ShieldCheck,
  QrCode as QrCodeIcon,
  History,
  Info,
  ArrowRight,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Copy,
  ExternalLink,
  PlusCircle,
  Loader2,
  MessageSquare,
  Pin,
  Bell,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Image as ImageIcon,
  Plus,
  ZoomIn,
  Film
} from 'lucide-react';
import { Unit, Owner, FollowUpTask } from '../types';
import { UnitBrochureModal } from './UnitBrochureModal';
import { UnitOfficialQuotationModal } from './UnitOfficialQuotationModal';
import { UnitCommentsSection } from './UnitCommentsSection';
import { CompoundPriceDistributionModal } from './CompoundPriceDistributionModal';
import { VideoTourPlayer } from './VideoTourPlayer';
import { generateUnitQrCodeDataUrl, getUnitDirectUrl, downloadQrCodeImage } from '../services/qrService';
import { getUnitAuditLog, recordUnitStatusChange } from '../services/unitAuditService';
import { generateUnitBrochurePdf } from '../services/brochurePdfGenerator';
import { getUnitComments } from '../services/unitCommentsService';

interface DetailModalProps {
  unit: Unit | null;
  onClose: () => void;
  isArabic: boolean;
  onAskAIAboutUnit: (unit: Unit) => void;
  owners?: Owner[];
  theme?: 'dark' | 'light';
  onUpdateUnit?: (updatedUnit: Unit) => void;
  onAddFollowUpTask?: (task: Partial<FollowUpTask>) => void;
  images?: string[];
  onOpenCompoundPriceModal?: (compoundName: string) => void;
  allUnits?: Unit[];
}

export const UnitDetailModal: React.FC<DetailModalProps> = ({
  unit,
  onClose,
  isArabic,
  onAskAIAboutUnit,
  owners = [],
  theme = 'dark',
  onUpdateUnit,
  onAddFollowUpTask,
  images,
  onOpenCompoundPriceModal,
  allUnits = []
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'history' | 'qrcode'>('overview');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isBrochureOpen, setIsBrochureOpen] = useState(false);
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingPdfBrochure, setIsGeneratingPdfBrochure] = useState<boolean>(false);

  // Status Change State inside Modification History
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>('');
  const [statusChangeNote, setStatusChangeNote] = useState<string>('');
  const [isChangingStatus, setIsChangingStatus] = useState<boolean>(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState<string | null>(null);

  // Audit trail filtering & chronological sorting
  const [auditFilter, setAuditFilter] = useState<'all' | 'status_only' | 'other'>('all');
  const [auditSortOrder, setAuditSortOrder] = useState<'asc' | 'desc'>('asc'); // 'asc' = Chronological (oldest first)

  // Image Gallery & Lightbox States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAddingCustomImage, setIsAddingCustomImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isPriceDistributionOpen, setIsPriceDistributionOpen] = useState(false);
  const [mediaMode, setMediaMode] = useState<'photos' | 'video'>('photos');

  // Compute effective images: images prop -> unit.images -> curated defaults based on type
  const effectiveImages = useMemo(() => {
    if (images && images.length > 0) return images;
    if (unit?.images && unit.images.length > 0) return unit.images;
    if (!unit) return [];

    const typeLower = (unit.unitType || unit.propertyType || '').toLowerCase();
    if (typeLower.includes('villa') || typeLower.includes('فيلا') || typeLower.includes('twin') || typeLower.includes('town')) {
      return [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80'
      ];
    }
    if (typeLower.includes('penthouse') || typeLower.includes('بنتهاوس') || typeLower.includes('roof')) {
      return [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80'
      ];
    }
    if (typeLower.includes('studio') || typeLower.includes('استوديو') || typeLower.includes('استديو')) {
      return [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1502005229762-ee1b2b9ba58f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80'
      ];
    }
    return [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80'
    ];
  }, [images, unit]);

  // Open Compound Price Comparison Modal directly for this unit's compound
  const handleOpenPriceComparison = () => {
    if (!unit) return;
    if (onOpenCompoundPriceModal) {
      onOpenCompoundPriceModal(unit.compound);
    } else {
      setIsPriceDistributionOpen(true);
    }
  };

  // Add custom image url
  const handleAddCustomImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit || !customImageUrl.trim()) return;
    const url = customImageUrl.trim();
    const currentList = unit.images && unit.images.length > 0 ? unit.images : effectiveImages;
    const updatedImages = [...currentList, url];
    if (onUpdateUnit) {
      onUpdateUnit({
        ...unit,
        images: updatedImages
      });
    }
    setCustomImageUrl('');
    setIsAddingCustomImage(false);
    setActiveImageIndex(updatedImages.length - 1);
  };

  // Generate QR Code on unit change
  useEffect(() => {
    if (unit) {
      setMediaMode('photos');
      setSelectedNewStatus(unit.status);
      generateUnitQrCodeDataUrl(unit.id, {
        width: 320,
        darkColor: '#0F2D52', // no-hex-allow: QR generator requires hex
        lightColor: '#FFFFFF' // no-hex-allow: QR generator requires hex
      }).then(url => setQrCodeDataUrl(url));
    }
  }, [unit]);

  if (!unit) return null;

  // Find associated owner from the CRM owners repository if available
  const associatedOwner = owners.find(o => 
    (unit.ownerName && o.name && o.name.toLowerCase().includes(unit.ownerName.toLowerCase())) ||
    (unit.ownerPhone && o.phone && o.phone.replace(/\D/g, '') === unit.ownerPhone.replace(/\D/g, '')) ||
    (o.notes && o.notes.includes(unit.id))
  ) || null;

  const directUrl = getUnitDirectUrl(unit.id);
  const auditLogs = getUnitAuditLog(unit);

  // Compute filtered & sorted audit logs
  const filteredAuditLogs = useMemo(() => {
    let list = [...auditLogs];
    if (auditFilter === 'status_only') {
      list = list.filter(l => l.action === 'status_change');
    } else if (auditFilter === 'other') {
      list = list.filter(l => l.action !== 'status_change');
    }
    return list.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return auditSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [auditLogs, auditFilter, auditSortOrder]);

  // Extract chronological status lifecycle progression
  const statusTransitions = useMemo(() => {
    return auditLogs
      .filter(l => l.action === 'status_change' || l.action === 'created')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [auditLogs]);

  const unitComments = useMemo(() => getUnitComments(unit), [unit]);
  const pinnedComment = useMemo(() => unitComments.find(c => c.isPinned), [unitComments]);
  const pendingRemindersCount = useMemo(() => unitComments.filter(c => c.reminder && !c.reminder.completed).length, [unitComments]);

  const handleDownloadPdfBrochure = async () => {
    if (!unit) return;
    try {
      setIsGeneratingPdfBrochure(true);
      await generateUnitBrochurePdf(unit, {
        qrCodeDataUrl,
        isArabic,
        agentName: unit.agent || undefined,
        agentPhone: unit.ownerPhone || undefined
      });
    } catch (err) {
      console.error('Error generating PDF brochure with jsPDF:', err);
      // Fallback: open brochure preview modal
      setIsBrochureOpen(true);
    } finally {
      setIsGeneratingPdfBrochure(false);
    }
  };

  const copyListingBrief = () => {
    const text = `🏡 *عرض وحدة عقارية - 6O Real Estate CRM*\n` +
      `▪ *كود الوحدة:* ${unit.id}\n` +
      `▪ *المشروع / الكمبوند:* ${unit.compound}\n` +
      `▪ *المنطقة:* ${unit.area}\n` +
      `▪ *نوع العقار:* ${unit.propertyType} - ${unit.unitType}\n` +
      `▪ *المساحة:* ${unit.size} م² | *الغرف:* ${unit.beds}\n` +
      `▪ *سعر البيع المطلوب:* ${formatNumber(unit.price)} ${unit.currency}\n` +
      `▪ *الحالة:* ${unit.status}\n` +
      (unit.notes ? `▪ *ملاحظات:* ${unit.notes}\n` : '') +
      `🔗 *رابط المعاينة المباشر:* ${directUrl}\n` +
      `📞 للاستفسار والمعاينة: تواصل معنا في 6 October Real Estate.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyDirectUrl = () => {
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleApplyStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewStatus || selectedNewStatus === unit.status) return;

    setIsChangingStatus(true);
    const updated = recordUnitStatusChange(
      unit, 
      selectedNewStatus, 
      unit.agent || 'Sales Agent',
      statusChangeNote
    );

    if (onUpdateUnit) {
      onUpdateUnit(updated);
    }

    setStatusSuccessMessage(
      isArabic 
        ? `تم تحديث حالة الوحدة إلى "${selectedNewStatus}" وتسجيلها في سجل التعديلات.` 
        : `Unit status updated to "${selectedNewStatus}" and logged in audit history.`
    );
    setStatusChangeNote('');
    setIsChangingStatus(false);
    setTimeout(() => setStatusSuccessMessage(null), 3500);
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('avail')) {
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    }
    if (s.includes('reserv')) {
      return 'bg-accent text-accent border border-accent';
    }
    if (s.includes('sold')) {
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
    }
    return 'bg-surface-raised text-text-muted border border-border';
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-surface backdrop-blur-sm animate-in fade-in duration-200">
        <div 
          className="bg-surface border border-border rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-border flex items-start justify-between bg-surface sticky top-0 backdrop-blur z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-extrabold text-accent bg-accent px-2.5 py-0.5 rounded-lg border border-accent">
                  {unit.id}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadgeClass(unit.status)}`}>
                  {unit.status}
                </span>
                <span className="text-xs text-text-muted">
                  {unit.category === 'rent' ? (isArabic ? 'وحدة إيجار' : 'For Rent') : (isArabic ? 'وحدة بيع' : 'For Sale')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1.5">{unit.compound}</h2>
              <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-text-muted" />
                {unit.area}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* PRIMARY 'COMPARE' BUTTON - User Request 1 */}
              <button
                type="button"
                onClick={handleOpenPriceComparison}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-500/25 border border-indigo-400/30 cursor-pointer"
                title={isArabic ? `مقارنة أسعار كمبوند ${unit.compound} وتحليل التوزيع السعري` : `Compare prices for ${unit.compound}`}
              >
                <BarChart3 className="w-4 h-4 text-violet-200" />
                <span>{isArabic ? 'مقارنة' : 'Compare'}</span>
              </button>

              {/* PRIMARY 'OFFICIAL PRICE QUOTATION PDF' BUTTON */}
              <button
                onClick={() => setIsQuotationOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/25 cursor-pointer"
                title={isArabic ? 'تصدير عرض سعر رسمي معتمد للعميل (PDF)' : 'Export Official Client Price Offer (PDF)'}
              >
                <FileText className="w-4 h-4" />
                <span>{isArabic ? 'عرض سعر رسمي PDF' : 'Official Quotation'}</span>
              </button>

              {/* DOWNLOAD PDF BROCHURE BUTTON USING JSPDF */}
              <button
                onClick={handleDownloadPdfBrochure}
                disabled={isGeneratingPdfBrochure}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-accent to-accent hover:from-accent hover:to-accent disabled:opacity-60 text-text text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-accent/20 cursor-pointer"
                title={isArabic ? 'تنزيل بروشور PDF احترافي فوراً عبر مكتبة jsPDF' : 'Download professional PDF brochure using jsPDF'}
              >
                {isGeneratingPdfBrochure ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-text" />
                    <span>{isArabic ? 'جاري التجهيز...' : 'Generating...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-text" />
                    <span>{isArabic ? 'بروشور المشتري (PDF)' : 'Download Buyer PDF Brochure'}</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Price Hero Section with Direct Actions */}
          <div className="p-4 sm:px-6 bg-surface border-b border-border">
            <div className="p-4 rounded-xl bg-gradient-to-r from-accent via-accent to-transparent border border-accent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-accent font-semibold uppercase tracking-wider">
                  {isArabic ? 'سعر البيع المطلوب' : 'Asking Price'}
                </span>
                <div className="text-2xl font-bold text-white mt-0.5">
                  {formatNumber(unit.price)} <span className="text-sm font-normal text-accent">{unit.currency}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Compare Button in Hero - User Request 1 */}
                <button
                  type="button"
                  onClick={handleOpenPriceComparison}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-500/20 border border-indigo-400/30"
                  title={isArabic ? `مقارنة أسعار ومواصفات كمبوند ${unit.compound} بجميع الوحدات` : `Compare ${unit.compound} prices`}
                >
                  <BarChart3 className="w-4 h-4 text-violet-200" />
                  <span>{isArabic ? 'مقارنة أسعار الكمبوند' : 'Compare Compound'}</span>
                </button>

                {/* Official Quotation to PDF Button in Hero */}
                <button
                  onClick={() => setIsQuotationOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md shadow-blue-500/25"
                  title={isArabic ? 'تصدير عرض سعر رسمي مالي موجه للعميل بصيغة PDF' : 'Export official client price quotation to PDF'}
                >
                  <FileText className="w-4 h-4" />
                  <span>{isArabic ? 'عرض سعر رسمي PDF' : 'Quotation PDF'}</span>
                </button>

                {/* Download PDF Brochure Button in Hero */}
                <button
                  onClick={handleDownloadPdfBrochure}
                  disabled={isGeneratingPdfBrochure}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-accent to-accent hover:from-accent text-text rounded-lg text-xs font-bold transition cursor-pointer shadow-md shadow-accent/20 disabled:opacity-60"
                  title={isArabic ? 'تنزيل بروشور PDF احترافي فوراً عبر مكتبة jsPDF' : 'Download professional PDF brochure using jsPDF'}
                >
                  {isGeneratingPdfBrochure ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-text" />
                      <span>{isArabic ? 'جاري التحميل...' : 'Downloading...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-text" />
                      <span>{isArabic ? 'بروشور المشتري PDF' : 'Buyer Brochure PDF'}</span>
                    </>
                  )}
                </button>

                {/* Preview Printable Brochure Button */}
                <button
                  onClick={() => setIsBrochureOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-raised hover:bg-surface-raised border border-border text-text rounded-lg text-xs font-semibold transition cursor-pointer"
                  title={isArabic ? 'معاينة البروشور وطباعته' : 'Preview printable brochure modal'}
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>{isArabic ? 'معاينة' : 'Preview'}</span>
                </button>

                {/* Quick Comments & Activity Tab Trigger */}
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    activeTab === 'comments'
                      ? 'bg-accent text-text border-accent font-bold'
                      : 'bg-surface-raised hover:bg-surface-raised text-text border-border'
                  }`}
                  title={isArabic ? 'سجل التعليقات والملاحظات والتفاعلات' : 'Comments, Notes & Reminders'}
                >
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <span>{isArabic ? 'الملاحظات' : 'Notes'}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'comments' ? 'bg-surface text-text' : 'bg-surface text-accent'
                  }`}>
                    {unitComments.length}
                  </span>
                  {pendingRemindersCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  )}
                </button>

                {/* Quick QR View Tab Trigger */}
                <button
                  onClick={() => setActiveTab('qrcode')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    activeTab === 'qrcode'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-surface-raised hover:bg-surface-raised text-text border-border'
                  }`}
                  title={isArabic ? 'عرض رمز QR للمعاينة الميدانية' : 'View Field Visit QR Code'}
                >
                  <QrCodeIcon className="w-4 h-4 text-accent" />
                  <span>{isArabic ? 'رمز QR' : 'QR Code'}</span>
                </button>

                <button
                  onClick={copyListingBrief}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-raised hover:bg-surface-raised border border-border text-text rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-text-muted" />}
                  <span>{copied ? (isArabic ? 'تم النسخ' : 'Copied!') : (isArabic ? 'مشاركة' : 'Share')}</span>
                </button>

                <button
                  onClick={() => {
                    onAskAIAboutUnit(unit);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-raised hover:bg-surface-raised border border-border text-text rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>{isArabic ? 'استشارة الذكاء الاصطناعي' : 'Ask AI'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="px-6 border-b border-border bg-surface flex items-center gap-1 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'overview'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>{isArabic ? 'المواصفات والتفاصيل' : 'Overview & Specs'}</span>
            </button>

            {/* Rich-Text Comments, Pinned Notes & Reminders Tab */}
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-3 px-4 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'comments'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isArabic ? 'التعليقات والملاحظات' : 'Comments & Notes'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'comments' ? 'bg-accent text-accent' : 'bg-surface-raised text-text-muted'
              }`}>
                {unitComments.length}
              </span>
              {pinnedComment && (
                <Pin className="w-3.5 h-3.5 text-accent fill-accent" />
              )}
              {pendingRemindersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5 animate-pulse">
                  <Bell className="w-2.5 h-2.5 text-rose-400" />
                  <span>{pendingRemindersCount}</span>
                </span>
              )}
            </button>

            {/* User Request: Audit Trail & Status History Tab */}
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'history'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{isArabic ? 'سجل تتبع التعديلات وتغيرات الحالة (Audit Trail)' : 'Audit Trail & Status History'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-surface-raised text-text-muted">
                {auditLogs.length}
              </span>
            </button>

            {/* User Request 1: QR Code & Field Visit Tab */}
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`py-3 px-4 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'qrcode'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              <QrCodeIcon className="w-4 h-4" />
              <span>{isArabic ? 'رمز QR والمعاينة الميدانية' : 'QR Code & Field Visit'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* TAB 1: OVERVIEW & SPECS */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Image Gallery Alongside Unit Details - User Request 2 */}
                <div className="lg:col-span-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {unit.videoUrl ? (
                        <div className="flex items-center gap-1 bg-surface-raised p-0.5 rounded-lg border border-border">
                          <button
                            type="button"
                            onClick={() => setMediaMode('photos')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                              mediaMode === 'photos'
                                ? 'bg-accent text-text'
                                : 'text-text-muted hover:text-white'
                            }`}
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'الصور' : 'Photos'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMediaMode('video')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                              mediaMode === 'video'
                                ? 'bg-accent text-text'
                                : 'text-text-muted hover:text-white'
                            }`}
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'جولة فيديو' : 'Video Tour'}</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 text-accent" />
                          <span className="text-xs font-bold text-white">
                            {isArabic ? 'معرض صور الوحدة' : 'Unit Image Gallery'}
                          </span>
                        </>
                      )}
                      {mediaMode === 'photos' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-raised text-accent border border-border">
                          {effectiveImages.length > 0 ? `${activeImageIndex + 1} / ${effectiveImages.length}` : '0'}
                        </span>
                      )}
                    </div>

                    {mediaMode === 'photos' && (
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomImage(!isAddingCustomImage)}
                        className="text-[11px] font-medium text-accent hover:text-accent flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'إضافة رابط صورة' : 'Add Image URL'}</span>
                      </button>
                    )}
                  </div>

                  {/* Add Image URL inline input form */}
                  {isAddingCustomImage && (
                    <form onSubmit={handleAddCustomImage} className="p-2.5 rounded-xl bg-surface border border-border space-y-2">
                      <input
                        type="url"
                        placeholder="https://example.com/property.jpg"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCustomImage(false);
                            setCustomImageUrl('');
                          }}
                          className="px-2.5 py-1 rounded-lg text-text-muted hover:text-white text-xs"
                        >
                          {isArabic ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={!customImageUrl.trim()}
                          className="px-3 py-1 rounded-lg bg-accent hover:bg-accent disabled:opacity-50 text-text text-xs font-bold"
                        >
                          {isArabic ? 'إضافة' : 'Add'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Main Display: Video Tour or Image Gallery */}
                  {mediaMode === 'video' && unit.videoUrl ? (
                    <VideoTourPlayer
                      src={unit.videoUrl}
                      title={`${unit.compound} - ${unit.unitType || unit.propertyType}`}
                      autoPlay={false}
                      className="w-full aspect-[4/3]"
                    />
                  ) : (
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface border border-border group shadow-lg">
                      {effectiveImages.length > 0 ? (
                        <>
                          <img
                            src={effectiveImages[activeImageIndex]}
                            alt={`${unit.compound} - ${unit.unitType}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                            onClick={() => setIsLightboxOpen(true)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
                            }}
                          />

                          {/* Top Overlays */}
                          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-surface backdrop-blur text-white border border-border shadow">
                              {unit.unitType || unit.propertyType}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsLightboxOpen(true);
                              }}
                              className="pointer-events-auto p-1.5 rounded-lg bg-surface hover:bg-surface text-text-muted hover:text-white backdrop-blur border border-border transition shadow cursor-pointer"
                              title={isArabic ? 'تكبير الصورة' : 'Full Screen'}
                            >
                              <ZoomIn className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Bottom Video Badge on photo if video is available */}
                          {unit.videoUrl && (
                            <button
                              type="button"
                              onClick={() => setMediaMode('video')}
                              className="pointer-events-auto absolute bottom-2.5 right-2.5 rtl:right-auto rtl:left-2.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-brand-gold border border-brand-gold/40 text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm cursor-pointer transition-transform transform hover:scale-105 z-10"
                              title={isArabic ? 'مشاهدة جولة الفيديو' : 'Watch Video Tour'}
                            >
                              <Film className="w-3.5 h-3.5" />
                              <span>{isArabic ? 'جولة فيديو' : 'Video Tour'}</span>
                            </button>
                          )}

                          {/* Navigation Arrows if more than 1 image */}
                          {effectiveImages.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveImageIndex((prev) => (prev === 0 ? effectiveImages.length - 1 : prev - 1));
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-surface hover:bg-surface text-white backdrop-blur border border-border opacity-80 group-hover:opacity-100 transition shadow cursor-pointer"
                                title={isArabic ? 'الصورة السابقة' : 'Previous Image'}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveImageIndex((prev) => (prev === effectiveImages.length - 1 ? 0 : prev + 1));
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-surface hover:bg-surface text-white backdrop-blur border border-border opacity-80 group-hover:opacity-100 transition shadow cursor-pointer"
                                title={isArabic ? 'الصورة التالية' : 'Next Image'}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-text-muted">
                          <ImageIcon className="w-10 h-10 mb-2 stroke-1 text-text-muted" />
                          <span className="text-xs">{isArabic ? 'لا توجد صور مرفوعة للوحدة' : 'No images available'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Thumbnail Row (only in photos mode) */}
                  {mediaMode === 'photos' && effectiveImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                      {effectiveImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                            activeImageIndex === idx
                              ? 'border-accent ring-2 ring-accent shadow-md scale-105'
                              : 'border-border opacity-60 hover:opacity-100 hover:border-border'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Unit Details Alongside Image Gallery */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Unit Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-surface-raised rounded-xl border border-border">
                    <span className="text-[11px] text-text-muted flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-text-muted" />
                      {isArabic ? 'نوع الوحدة' : 'Unit Type'}
                    </span>
                    <div className="text-sm font-semibold text-white mt-1">{unit.unitType}</div>
                  </div>

                  <div className="p-3 bg-surface-raised rounded-xl border border-border">
                    <span className="text-[11px] text-text-muted flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-text-muted" />
                      {isArabic ? 'المساحة' : 'Built-up Area'}
                    </span>
                    <div className="text-sm font-semibold text-white mt-1">{unit.size} م²</div>
                  </div>

                  <div className="p-3 bg-surface-raised rounded-xl border border-border">
                    <span className="text-[11px] text-text-muted flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-text-muted" />
                      {isArabic ? 'غرف النوم' : 'Bedrooms'}
                    </span>
                    <div className="text-sm font-semibold text-white mt-1">{unit.beds} غرف</div>
                  </div>

                  <div className="p-3 bg-surface-raised rounded-xl border border-border">
                    <span className="text-[11px] text-text-muted flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      {isArabic ? 'الاستلام' : 'Delivery'}
                    </span>
                    <div className="text-sm font-semibold text-white mt-1">{unit.deliveryDate || (isArabic ? 'جاهز للمعاينة' : 'Ready')}</div>
                  </div>
                </div>

                {/* Contact / Owner Section */}
                <div className="p-4 bg-surface-raised rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-accent" />
                      <span>{isArabic ? 'بيانات المالك المرتبط والاتصال' : 'Associated Owner Information & Contacts'}</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{isArabic ? 'مالك معتمد' : 'Verified Owner'}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2.5 text-sm text-text">
                      <User className="w-4 h-4 text-accent shrink-0" />
                      <div>
                        <div className="font-semibold">{associatedOwner?.name || unit.ownerName || (isArabic ? 'المالك مسجل بالنظام' : 'Registered Owner')}</div>
                        {associatedOwner?.address && (
                          <div className="text-[11px] text-text-muted">{associatedOwner.address}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-sm text-text">
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-mono">{associatedOwner?.phone || unit.ownerPhone || '+20 100 000 0000'}</span>
                        <div className="text-[10px] text-emerald-400">{isArabic ? 'متاح واتساب وهاتف' : 'WhatsApp & Phone'}</div>
                      </div>
                    </div>
                  </div>

                  {associatedOwner?.email && (
                    <div className="text-xs text-text-muted border-t border-border pt-2 flex items-center justify-between">
                      <span>{isArabic ? 'البريد: ' : 'Email: '} <strong className="text-text">{associatedOwner.email}</strong></span>
                      {associatedOwner.unitsCount && (
                        <span>{isArabic ? 'إجمالي وحدات المالك: ' : 'Total Portfolio: '} <strong>{associatedOwner.unitsCount}</strong></span>
                      )}
                    </div>
                  )}
                </div>

                {/* Description & Notes */}
                {unit.notes && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-text-muted flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-text-muted" />
                      {isArabic ? 'ملاحظات وتفاصيل المعاينة الأساسية' : 'Primary Property & Inspection Notes'}
                    </span>
                    <p className="text-xs text-text-muted bg-surface p-3.5 rounded-xl border border-border leading-relaxed">
                      {unit.notes}
                    </p>
                  </div>
                )}

                {/* PINNED INTERNAL NOTE & REMINDERS WIDGET (OVERVIEW QUICK ACCESS) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-accent via-surface to-surface border border-accent space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Pin className="w-4 h-4 text-accent fill-accent" />
                      <span className="text-xs font-bold text-accent">
                        {isArabic ? 'الملاحظات الداخلية والتنبيهات المثبتة للوسطاء' : 'Internal Agent Notes & Pinned Reminders'}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-accent text-accent border border-accent">
                        {unitComments.length} {isArabic ? 'ملاحظة' : 'Notes'}
                      </span>
                      {pendingRemindersCount > 0 && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                          <Bell className="w-3 h-3 text-rose-400" />
                          <span>{pendingRemindersCount} {isArabic ? 'تذكير مستحق' : 'Due Reminder'}</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('comments')}
                      className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent text-text text-xs font-bold transition flex items-center gap-1 cursor-pointer self-start sm:self-auto shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'فتح قسم الملاحظات والتذكيرات' : 'Open Notes & Reminders'}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>

                  {pinnedComment ? (
                    <div className="p-3.5 rounded-xl bg-surface border border-accent text-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-text-muted">
                        <span className="font-semibold text-accent flex items-center gap-1.5">
                          <Pin className="w-3 h-3 text-accent fill-accent" />
                          <span>{pinnedComment.author}</span>
                          {pinnedComment.authorRole && <span className="text-text-muted text-[10px]">({pinnedComment.authorRole})</span>}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {new Date(pinnedComment.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      <p className="text-text line-clamp-3 leading-relaxed whitespace-pre-line text-xs font-sans">
                        {pinnedComment.content.replace(/[*#_`]/g, '')}
                      </p>

                      {pinnedComment.reminder && (
                        <div className="flex items-center gap-2 pt-1 border-t border-border text-[11px] text-rose-300 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{isArabic ? 'تذكير متابعة مرتبط:' : 'Follow-up:'} {pinnedComment.reminder.title} ({pinnedComment.reminder.dueDate})</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted leading-relaxed">
                      {isArabic 
                        ? 'يمكنك تثبيت الملاحظات الداخلية الهامة، وربط تذكيرات المتابعة، وتوثيق سجل التفاعلات مع العملاء مباشرة عبر التبويب المخصص.' 
                        : 'You can pin internal notes, attach follow-up reminders, and log interactions with clients directly.'}
                    </p>
                  )}
                </div>

                {/* Prospective Buyer PDF Brochure Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-accent via-surface to-blue-900/15 border border-accent flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent px-2 py-0.5 rounded border border-accent inline-block">
                      {isArabic ? 'كتيب ومواصفات العقار للمشتري' : 'Buyer Property Brochure & Dossier'}
                    </span>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-accent" />
                      <span>{isArabic ? `تصدير كتيب احترافي لوحدة ${unit.id}` : `Export Professional Buyer Brochure for ${unit.id}`}</span>
                    </h4>
                    <p className="text-xs text-text-muted">
                      {isArabic 
                        ? 'مستند PDF رسمي مهيأ خصيصاً للمشترين والمستثمرين يتضمن السعر، المواصفات الهندسية، حالة العقار، خطط السداد، ومزايا المشروع.'
                        : 'Official PDF document formatted specifically for potential buyers featuring unit pricing, key specifications, property status, payment plans, and amenities.'}
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadPdfBrochure}
                    disabled={isGeneratingPdfBrochure}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent hover:from-accent hover:to-accent text-text font-bold text-xs shadow-lg shadow-accent/20 flex items-center gap-2 shrink-0 transition cursor-pointer disabled:opacity-60"
                  >
                    {isGeneratingPdfBrochure ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-text" />
                        <span>{isArabic ? 'جاري تجهيز الـ PDF...' : 'Generating PDF...'}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-text" />
                        <span>{isArabic ? 'تحميل بروشور المشتري (PDF)' : 'Download Buyer PDF Brochure'}</span>
                      </>
                    )}
                  </button>
                </div>
                </div>
              </div>
            )}

            {/* TAB: RICH-TEXT COMMENTS, PINNED NOTES & ACTIVITY */}
            {activeTab === 'comments' && (
              <UnitCommentsSection
                unit={unit}
                isArabic={isArabic}
                theme={theme}
                onUpdateUnit={onUpdateUnit}
                onAddFollowUpTask={onAddFollowUpTask}
              />
            )}

            {/* TAB 2: MODIFICATION HISTORY (Audit Log Timeline) */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                {/* Header Summary & Live Status Modifier */}
                <div className="p-4 sm:p-5 bg-surface rounded-xl border border-border space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <History className="w-4 h-4 text-accent" />
                        <span>{isArabic ? 'سجل تتبع التعديلات وتغيرات الحالة (Audit Trail)' : 'Chronological Audit Trail & Status History'}</span>
                      </h4>
                      <p className="text-xs text-text-muted mt-0.5">
                        {isArabic 
                          ? 'سجل زمني مفصل وموثق لجميع تغيرات الحالة (مثل: Available ➔ Reserved ➔ Sold) مع التوقيت وهوية المسؤول' 
                          : 'Chronological log of all status transitions (e.g., Available to Reserved, Reserved to Sold) with verified timestamps'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-accent text-accent border border-accent">
                        {auditLogs.length} {isArabic ? 'عمليات موثقة' : 'Total Entries'}
                      </span>
                    </div>
                  </div>

                  {/* Chronological Status Journey Stepper */}
                  <div className="p-3.5 bg-surface rounded-xl border border-border space-y-2">
                    <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span>{isArabic ? 'المسار الزمني لتغيرات الحالة (Status Lifecycle):' : 'Chronological Status Journey:'}</span>
                    </span>

                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                      {statusTransitions.map((item, idx) => {
                        const val = item.newValue ? String(item.newValue) : 'Available';
                        const itemTime = new Date(item.timestamp).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <React.Fragment key={item.id || idx}>
                            <div className="flex items-center gap-2 shrink-0 bg-surface px-3 py-1.5 rounded-lg border border-border">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                                idx === statusTransitions.length - 1 ? 'bg-accent text-text' : 'bg-surface-raised text-text-muted'
                              }`}>
                                {idx + 1}
                              </span>
                              <div>
                                <span className={`text-xs px-2 py-0.5 rounded font-bold inline-block ${getStatusBadgeClass(val)}`}>
                                  {val}
                                </span>
                                <span className="block text-[10px] font-mono text-text-muted mt-0.5">{itemTime}</span>
                              </div>
                            </div>
                            {idx < statusTransitions.length - 1 && (
                              <ArrowRight className="w-3.5 h-3.5 text-accent/70 shrink-0 rtl:rotate-180" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inline Status Modifier Form */}
                  <form onSubmit={handleApplyStatusChange} className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                    <div>
                      <label className="text-[11px] font-semibold text-text-muted block mb-1">
                        {isArabic ? 'تحديث حالة الوحدة الآن:' : 'Change Status:'}
                      </label>
                      <select
                        value={selectedNewStatus}
                        onChange={(e) => setSelectedNewStatus(e.target.value)}
                        className="w-full bg-surface border border-border text-white rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-accent outline-none"
                      >
                        <option value="Available">{isArabic ? 'متاح (Available)' : 'Available'}</option>
                        <option value="Reserved">{isArabic ? 'محجوز (Reserved)' : 'Reserved'}</option>
                        <option value="Sold">{isArabic ? 'تم البيع (Sold)' : 'Sold'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-text-muted block mb-1">
                        {isArabic ? 'ملاحظة التعديل أو اسم العميل:' : 'Reason / Client Note:'}
                      </label>
                      <input
                        type="text"
                        placeholder={isArabic ? 'سبب تغيير الحالة أو تفاصيل الحجز' : 'Reason for status update'}
                        value={statusChangeNote}
                        onChange={(e) => setStatusChangeNote(e.target.value)}
                        className="w-full bg-surface border border-border text-white rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-accent outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isChangingStatus || selectedNewStatus === unit.status}
                      className="px-3.5 py-1.5 bg-accent hover:bg-accent disabled:opacity-50 text-text font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 h-[34px]"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'تسجيل التعديل' : 'Record Change'}</span>
                    </button>
                  </form>

                  {statusSuccessMessage && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{statusSuccessMessage}</span>
                    </div>
                  )}
                </div>

                {/* Filter and Sort Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-surface p-2.5 rounded-xl border border-border text-xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
                    <span className="text-text-muted flex items-center gap-1 text-[11px] shrink-0">
                      <Filter className="w-3 h-3 text-text-muted" />
                      <span>{isArabic ? 'تصفية السجل:' : 'Filter:'}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setAuditFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                        auditFilter === 'all'
                          ? 'bg-accent text-text font-bold'
                          : 'bg-surface text-text-muted hover:bg-surface-raised border border-border'
                      }`}
                    >
                      {isArabic ? 'كافة السجلات' : 'All Events'} ({auditLogs.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuditFilter('status_only')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                        auditFilter === 'status_only'
                          ? 'bg-accent text-text font-bold'
                          : 'bg-surface text-text-muted hover:bg-surface-raised border border-border'
                      }`}
                    >
                      {isArabic ? 'تغيرات الحالة فقط' : 'Status Changes Only'} ({auditLogs.filter(l => l.action === 'status_change').length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuditFilter('other')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                        auditFilter === 'other'
                          ? 'bg-accent text-text font-bold'
                          : 'bg-surface text-text-muted hover:bg-surface-raised border border-border'
                      }`}
                    >
                      {isArabic ? 'الأسعار والمعاينات' : 'Price & Inspections'} ({auditLogs.filter(l => l.action !== 'status_change').length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAuditSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-raised border border-border text-text-muted hover:text-white transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 font-medium"
                    title={isArabic ? 'التبديل بين الترتيب الزمني التصاعدي والتنازلي' : 'Toggle chronological sorting'}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-accent" />
                    <span>
                      {auditSortOrder === 'asc'
                        ? (isArabic ? 'الترتيب: زمني (الأقدم للأحدث)' : 'Sort: Chronological (Oldest First)')
                        : (isArabic ? 'الترتيب: الأحدث أولاً' : 'Sort: Newest First')}
                    </span>
                  </button>
                </div>

                {/* Audit Timeline */}
                <div className="relative pl-6 pr-6 space-y-6 before:absolute before:left-8 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-raised rtl:before:left-auto rtl:before:right-8">
                  {filteredAuditLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-text-muted bg-surface rounded-xl border border-border">
                      {isArabic ? 'لا توجد سجلات تطابق خيار التصفية المحدد.' : 'No audit entries match the selected filter.'}
                    </div>
                  ) : (
                    filteredAuditLogs.map((log, index) => {
                      const dateObj = new Date(log.timestamp);
                      const dateFormatted = dateObj.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                      const timeFormatted = dateObj.toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      const isStatusChange = log.action === 'status_change';
                      const isSoldChange = log.newValue?.toString().toLowerCase().includes('sold');
                      const isReservedChange = log.newValue?.toString().toLowerCase().includes('reserv');

                      return (
                        <div key={log.id || index} className="relative flex items-start gap-4">
                          {/* Timeline Icon Node */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${
                            isSoldChange 
                              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 ring-4 ring-border' 
                              : isReservedChange 
                              ? 'bg-accent text-text shadow-md ring-4 ring-border' 
                              : log.action === 'created' 
                              ? 'bg-blue-500 text-white ring-4 ring-border' 
                              : 'bg-surface-raised text-text-muted ring-4 ring-border'
                          }`}>
                            {index + 1}
                          </div>

                          {/* Timeline Entry Card */}
                          <div className={`flex-1 rounded-xl p-4 space-y-2.5 transition shadow-sm border ${
                            isStatusChange
                              ? 'bg-gradient-to-r from-surface via-surface to-surface border-accent hover:border-accent'
                              : 'bg-surface border-border hover:border-border'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Action Type Badge */}
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                  isStatusChange
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : log.action === 'price_update'
                                    ? 'bg-accent text-accent border border-accent'
                                    : 'bg-surface-raised text-text-muted border border-border'
                                }`}>
                                  {log.action === 'status_change' ? (isArabic ? 'تغيير الحالة' : 'Status Change') :
                                   log.action === 'price_update' ? (isArabic ? 'تعديل السعر' : 'Price Update') :
                                   log.action === 'created' ? (isArabic ? 'إنشاء القيد' : 'Initial Creation') :
                                   log.action === 'inspection_completed' ? (isArabic ? 'معاينة ميدانية' : 'Inspection') :
                                   log.action}
                                </span>

                                {/* Status Transition pill (e.g. Available -> Reserved, Reserved -> Sold) */}
                                {isStatusChange && log.newValue && (
                                  <div className="flex items-center gap-2 text-xs font-semibold bg-surface px-3 py-1 rounded-lg border border-border">
                                    {log.oldValue && (
                                      <>
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getStatusBadgeClass(String(log.oldValue))}`}>
                                          {String(log.oldValue)}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 text-accent rtl:rotate-180" />
                                      </>
                                    )}
                                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${getStatusBadgeClass(String(log.newValue))}`}>
                                      {String(log.newValue)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Verified Chronological Timestamp */}
                              <div className="flex items-center gap-2 text-text-muted text-[11px] font-mono">
                                <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-border">
                                  <Clock className="w-3 h-3 text-accent" />
                                  <span>{dateFormatted} - {timeFormatted}</span>
                                </span>
                              </div>
                            </div>

                            {/* Notes and description */}
                            {log.notes && (
                              <p className="text-xs text-text leading-relaxed bg-surface p-3 rounded-lg border border-border">
                                {log.notes}
                              </p>
                            )}

                            {/* Agent / User who made the change */}
                            <div className="flex items-center justify-between text-[11px] text-text-muted pt-1.5 border-t border-border">
                              <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-text-muted" />
                                <span>{isArabic ? 'المسؤول:' : 'Changed by:'} <strong className="text-text">{log.changedBy}</strong></span>
                              </span>
                              <span className="font-mono text-[10px] text-text-muted">ID: {log.id}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: QR CODE & FIELD VISIT */}
            {activeTab === 'qrcode' && (
              <div className="space-y-6">
                <div className="p-5 bg-surface rounded-2xl border border-border flex flex-col md:flex-row items-center gap-6">
                  {/* High-Resolution QR Display */}
                  <div className="bg-white p-3 rounded-2xl border-2 border-accent shadow-xl shadow-accent/20 shrink-0 text-center space-y-2">
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt={`QR Code for Unit ${unit.id}`}
                        className="w-48 h-48 object-contain mx-auto"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-surface-raised rounded-lg">
                        <QrCodeIcon className="w-16 h-16 text-text-muted animate-spin" />
                      </div>
                    )}
                    <span className="font-mono text-xs font-bold text-text bg-surface-raised px-3 py-1 rounded-full inline-block border border-border">
                      {unit.id}
                    </span>
                  </div>

                  {/* QR Controls & Scanning Instructions */}
                  <div className="space-y-4 flex-1 text-text-muted">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <QrCodeIcon className="w-5 h-5 text-accent" />
                        <span>{isArabic ? 'رمز الاستجابة السريعة (QR Code) للمعاينة الميدانية' : 'Field Visit QR Code & Deep Link'}</span>
                      </h4>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {isArabic 
                          ? 'يمكن للوسطاء العقاريين والعملاء مسح هذا الرمز بكاميرا الهاتف للوصول الفوري إلى صفحة الوحدة وكافة تفاصيلها المحدثة أثناء الجولات والمعاينات الميدانية.' 
                          : 'Agents and prospective buyers can scan this QR code with their mobile cameras to view live unit specs and pricing during field visits.'}
                      </p>
                    </div>

                    {/* Direct URL Box */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-text-muted font-semibold block">
                        {isArabic ? 'الرابط المباشر للوحدة في التطبيق:' : 'Direct Deep Link URL:'}
                      </label>
                      <div className="flex items-center gap-2 bg-surface p-2 rounded-xl border border-border">
                        <input 
                          type="text" 
                          readOnly 
                          value={directUrl}
                          className="bg-transparent text-xs text-accent font-mono w-full outline-none select-all truncate"
                        />
                        <button
                          onClick={copyDirectUrl}
                          className="px-2.5 py-1 bg-surface-raised hover:bg-surface-raised text-white rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1 cursor-pointer border border-border"
                        >
                          {copiedLink ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
                          <span>{copiedLink ? (isArabic ? 'تم النسخ' : 'Copied') : (isArabic ? 'نسخ' : 'Copy')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Action buttons for QR */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <button
                        onClick={() => downloadQrCodeImage(qrCodeDataUrl, unit.id)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>{isArabic ? 'تحميل كود QR (PNG)' : 'Download QR Image'}</span>
                      </button>

                      <button
                        onClick={() => setIsBrochureOpen(true)}
                        className="px-3.5 py-2 bg-gradient-to-r from-accent to-accent hover:from-accent text-text rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-accent/20 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{isArabic ? 'تصدير بروشور مع الكود' : 'Export Brochure with QR'}</span>
                      </button>

                      <a
                        href={directUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-surface-raised hover:bg-surface-raised border border-border text-text rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                        <span>{isArabic ? 'فتح الرابط في نافذة جديدة' : 'Open Direct Page'}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Field Visit Tips */}
                <div className="p-4 bg-surface rounded-xl border border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-accent block">{isArabic ? '⚡ مسح فوري للمعاينة' : 'Instant Field Access'}</span>
                    <p className="text-text-muted text-[11px] leading-relaxed">
                      {isArabic ? 'لا يتطلب تسجيل دخول لعرض السعر والمساحة ورقم الوحدة.' : 'Directly view specs and pricing on site without friction.'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-accent block">{isArabic ? '🖨️ طباعة بطاقة المعاينة' : 'Printable Signage'}</span>
                    <p className="text-text-muted text-[11px] leading-relaxed">
                      {isArabic ? 'يمكن تثبيت الرمز في موقع العقار للمعاينة الذاتية من العملاء.' : 'Place printable QR cards at unit doors during open houses.'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-accent block">{isArabic ? '🔄 تحديث لحظي' : 'Real-time Sync'}</span>
                    <p className="text-text-muted text-[11px] leading-relaxed">
                      {isArabic ? 'عند حجز الوحدة ينعكس التحديث مباشرة عند مسح الرمز.' : 'Status changes to Sold or Reserved reflect instantly.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-border bg-surface flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* PRIMARY 'DOWNLOAD PDF BROCHURE' BUTTON IN FOOTER */}
              <button
                onClick={handleDownloadPdfBrochure}
                disabled={isGeneratingPdfBrochure}
                className="px-4 py-2 bg-gradient-to-r from-accent to-accent hover:from-accent text-text text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-accent/20 disabled:opacity-60"
                title={isArabic ? 'تنزيل بروشور PDF احترافي فوراً عبر مكتبة jsPDF' : 'Download professional PDF brochure using jsPDF'}
              >
                {isGeneratingPdfBrochure ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-text" />
                    <span>{isArabic ? 'جاري التحميل...' : 'Downloading...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-text" />
                    <span>Download PDF Brochure</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsBrochureOpen(true)}
                className="px-3.5 py-2 bg-surface-raised hover:bg-surface-raised border border-border text-text text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                title={isArabic ? 'معاينة البروشور وطباعته' : 'Preview printable brochure modal'}
              >
                <FileText className="w-4 h-4 text-accent" />
                <span>{isArabic ? 'معاينة' : 'Preview'}</span>
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'history' ? 'overview' : 'history')}
                className="px-3.5 py-2 bg-surface-raised hover:bg-surface-raised text-text-muted text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <History className="w-4 h-4 text-accent" />
                <span>{activeTab === 'history' ? (isArabic ? 'العودة للمواصفات' : 'Back to Specs') : (isArabic ? 'سجل التعديلات' : 'Modification History')}</span>
              </button>

              {/* Compare Button in Footer - User Request 1 */}
              <button
                type="button"
                onClick={handleOpenPriceComparison}
                className="px-3.5 py-2 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 border border-violet-500/40 text-violet-300 hover:text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                title={isArabic ? `مقارنة أسعار كمبوند ${unit.compound}` : `Compare ${unit.compound} prices`}
              >
                <BarChart3 className="w-4 h-4 text-violet-400" />
                <span>{isArabic ? 'مقارنة' : 'Compare'}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface-raised hover:bg-surface-raised text-text-muted text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              {isArabic ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {/* Professional Real Estate Brochure Modal (PDF Export) */}
      <UnitBrochureModal
        isOpen={isBrochureOpen}
        onClose={() => setIsBrochureOpen(false)}
        unit={unit}
        owner={associatedOwner}
        isArabic={isArabic}
        theme={theme}
      />

      {/* Official Customer Price Offer / Quotation Modal (PDF Export) */}
      <UnitOfficialQuotationModal
        isOpen={isQuotationOpen}
        onClose={() => setIsQuotationOpen(false)}
        unit={unit}
        isArabic={isArabic}
        theme={theme}
      />

      {/* Full-screen Image Lightbox Modal - User Request 2 */}
      {isLightboxOpen && effectiveImages.length > 0 && (
        <div 
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="flex items-center justify-between text-white p-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-accent text-sm">{unit.id}</span>
              <span className="text-text-muted text-xs">&bull;</span>
              <span className="text-sm font-semibold">{unit.compound}</span>
              <span className="text-xs text-text-muted">({activeImageIndex + 1} / {effectiveImages.length})</span>
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
            <img
              src={effectiveImages[activeImageIndex]}
              alt={`${unit.compound} view ${activeImageIndex + 1}`}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            />

            {effectiveImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === 0 ? effectiveImages.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-surface hover:bg-surface-raised text-white backdrop-blur border border-border transition cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === effectiveImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-surface hover:bg-surface-raised text-white backdrop-blur border border-border transition cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {effectiveImages.length > 1 && (
            <div className="flex items-center justify-center gap-2 py-2 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
              {effectiveImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                    activeImageIndex === idx ? 'border-accent ring-2 ring-accent scale-105' : 'border-border opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Embedded Compound Price Distribution & Comparison Modal - User Request 1 */}
      {isPriceDistributionOpen && (
        <CompoundPriceDistributionModal
          isOpen={isPriceDistributionOpen}
          onClose={() => setIsPriceDistributionOpen(false)}
          units={allUnits && allUnits.length > 0 ? allUnits : [unit]}
          initialCompound={unit.compound}
          isArabic={isArabic}
          theme={theme}
        />
      )}
    </>
  );
};

export default UnitDetailModal;
