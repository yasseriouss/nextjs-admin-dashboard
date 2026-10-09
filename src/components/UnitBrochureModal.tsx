import { formatNumber } from '../i18n/format';
import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  X,
  Building2,
  Calendar,
  CheckCircle2,
  Share2,
  ShieldCheck,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Award,
  Sparkles,
  QrCode as QrCodeIcon,
  Compass,
  Check,
  Navigation,
  Loader2
} from 'lucide-react';
import { Unit, Owner } from '../types';
import { AppLogo } from './AppLogo';
import { generateUnitQrCodeDataUrl, getUnitDirectUrl } from '../services/qrService';
import { exportElementToPdf, printCleanElement } from '../services/pdfExportService';

interface UnitBrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
  owner?: Owner | null;
  isArabic: boolean;
  theme?: 'dark' | 'light';
}

export const UnitBrochureModal: React.FC<UnitBrochureModalProps> = ({
  isOpen,
  onClose,
  unit,
  isArabic,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [includeQrCode, setIncludeQrCode] = useState<boolean>(true);
  const [includeAmenities, setIncludeAmenities] = useState<boolean>(true);
  const [includeAgentCard, setIncludeAgentCard] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Generate real scannable QR code when modal opens
  useEffect(() => {
    if (unit) {
      generateUnitQrCodeDataUrl(unit.id, {
        width: 320,
        darkColor: '#0F2D52', // no-hex-allow: QR generator requires hex
        lightColor: '#FFFFFF' // no-hex-allow: QR generator requires hex
      }).then(dataUrl => setQrCodeDataUrl(dataUrl));
    }
  }, [unit]);

  if (!isOpen || !unit) return null;

  const priceNum = Number(unit.price) || 0;
  const sizeNum = Number(unit.size) || 0;
  const pricePerMeter = sizeNum > 0 && priceNum > 0 ? Math.round(priceNum / sizeNum) : 0;

  const directUrl = getUnitDirectUrl(unit.id);
  const brochureRef = `BRC-6O-${unit.id}-${new Date().getFullYear()}`;

  const todayFormatted = new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const agentName = unit.agent || (isArabic ? 'أحمد عبد الجليل - مستشار عقاري معتمد' : 'Ahmed Abdelgalil - Senior Property Consultant');
  const agentPhone = unit.ownerPhone || '+20 100 000 0000';

  // Standard luxury real estate amenities based on compound/area
  const amenities = [
    { ar: 'حراسة وأمن على مدار 24 ساعة', en: '24/7 Security & Gated Entry' },
    { ar: 'إطلالة بانورامية مميزة على المساحات الخضراء', en: 'Panoramic Landscape & Open View' },
    { ar: 'مواقف سيارات خاصة ومغطاة', en: 'Dedicated Covered Parking' },
    { ar: 'قريب من المدارس الدولية والمراكز التجارية', en: 'Near International Schools & Malls' },
    { ar: 'نادي صحي وحمامات سباحة', en: 'Clubhouse & Swimming Pools' },
    { ar: 'بنية تحتية ذكية وكابلات ألياف ضوئية', en: 'Fiber Optic & Smart Infrastructure' },
  ];

  const handlePrint = () => {
    const printableElement = document.getElementById('printable-unit-brochure');
    if (!printableElement) {
      window.print();
      return;
    }
    const title = isArabic 
      ? `بروشور عقاري - ${unit.compound} (${unit.id})` 
      : `Real Estate Brochure - ${unit.compound} (${unit.id})`;
    printCleanElement(printableElement, title, isArabic);
  };

  const handleDownloadStandaloneBrochure = async () => {
    const printableElement = document.getElementById('printable-unit-brochure');
    if (!printableElement) return;

    try {
      setIsExportingPdf(true);
      const safeCompound = (unit.compound || 'Compound').replace(/\s+/g, '_');
      const filename = `Brochure_${unit.id}_${safeCompound}.pdf`;
      await exportElementToPdf(printableElement, filename);
    } catch (err) {
      console.error('Failed to export brochure PDF', err);
      handlePrint();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyBrochureText = () => {
    const text = `🏡 *بروشور عرض عقاري حصري - 6O Real Estate Brochure*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 *المشروع:* ${unit.compound}\n` +
      `🏙️ *المنطقة:* ${unit.area} - 6 أكتوبر / الشيخ زايد\n` +
      `🏷️ *كود الوحدة:* ${unit.id} | *الحالة:* ${unit.status}\n` +
      `📐 *المساحة:* ${unit.size} م² | 🛏️ *الغرف:* ${unit.beds} | 🚿 *الحمامات:* ${unit.baths || 2}\n` +
      `🏢 *نوع الوحدة:* ${unit.propertyType} - ${unit.unitType}\n` +
      `💰 *السعر المطلوب:* ${formatNumber(priceNum)} ${unit.currency}\n` +
      (pricePerMeter > 0 ? `📊 *متوسط سعر المتر:* ${formatNumber(pricePerMeter)} ${unit.currency}/م²\n` : '') +
      `🔑 *الاستلام:* ${unit.deliveryDate || 'استلام فوري'}\n` +
      (unit.notes ? `📝 *الملاحظات والفيو:* ${unit.notes}\n` : '') +
      `🔗 *رابط المعاينة الرقمية المباشرة:* ${directUrl}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📞 للحجز والاستفسار: ${agentName} (${agentPhone})`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-surface backdrop-blur-md overflow-y-auto">
      {/* Print CSS rules dedicated to the professional brochure */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-unit-brochure, #printable-unit-brochure * {
            visibility: visible !important;
          }
          #printable-unit-brochure {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12px !important;
            background: white !important;
            color: var(--color-navy, rgb(15, 45, 82)) !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}} />

      <div className={`w-full max-w-4xl my-auto rounded-3xl border shadow-2xl flex flex-col max-h-[96vh] overflow-hidden ${
        isDark ? 'bg-surface border-border text-text' : 'bg-white border-border text-text'
      }`}>
        {/* Top Control Bar (Hidden in Print) */}
        <div className={`p-4 border-b flex items-center justify-between gap-3 print:hidden ${
          isDark ? 'bg-surface border-border' : 'bg-surface border-border'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent to-accent text-text font-bold shadow-md shadow-accent/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {isArabic ? `تصدير بروشور تسويقي PDF احترافي (${unit.id})` : `Export Professional Real Estate Brochure (${unit.id})`}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent text-accent border border-accent">
                  A4 Brochure
                </span>
              </div>
              <p className="text-xs text-text-muted">
                {isArabic 
                  ? 'بروشور عقاري فاخر للعملاء والمعاينات يشمل السعر والمنطقة والمواصفات وكود QR التفاعلي' 
                  : 'Luxury client-facing brochure with price, location, key specs, and scannable QR code'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Direct PDF Export Button */}
            <button
              onClick={handleDownloadStandaloneBrochure}
              disabled={isExportingPdf}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent hover:from-accent hover:to-accent disabled:opacity-60 text-text text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-accent/20 cursor-pointer"
              title={isArabic ? 'تصدير وحفظ البروشور كملف PDF' : 'Download Brochure as PDF'}
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isArabic ? 'جاري تجهيز PDF...' : 'Generating PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isArabic ? 'تصدير PDF' : 'Download PDF'}</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-surface-raised hover:bg-surface-raised text-text border-border' 
                  : 'bg-white hover:bg-surface-raised text-text border-border'
              }`}
              title={isArabic ? 'طباعة البروشور أو حفظه بصيغة PDF' : 'Print or Save as PDF'}
            >
              <Printer className="w-4 h-4" />
              <span>{isArabic ? 'طباعة' : 'Print'}</span>
            </button>

            <button
              onClick={handleCopyBrochureText}
              className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                copied 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : isDark 
                  ? 'bg-surface-raised hover:bg-surface-raised text-text-muted border-border' 
                  : 'bg-white hover:bg-surface-raised text-text border-border'
              }`}
              title={isArabic ? 'نسخ نص البروشور للواتساب' : 'Copy Brochure Text'}
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Options Bar (Hidden in Print) */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 text-xs flex-wrap print:hidden ${
          isDark ? 'bg-surface border-border text-text-muted' : 'bg-surface-raised border-border text-text'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-muted">
              {isArabic ? 'خيارات محتوى البروشور:' : 'Brochure Elements:'}
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox"
                checked={includeQrCode}
                onChange={(e) => setIncludeQrCode(e.target.checked)}
                className="rounded text-accent focus:ring-accent w-3.5 h-3.5 cursor-pointer"
              />
              <span>{isArabic ? 'كود QR للمعاينة السريعة' : 'Scannable QR Code'}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox"
                checked={includeAmenities}
                onChange={(e) => setIncludeAmenities(e.target.checked)}
                className="rounded text-accent focus:ring-accent w-3.5 h-3.5 cursor-pointer"
              />
              <span>{isArabic ? 'قائمة المميزات والخدمات' : 'Amenities & Facilities'}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox"
                checked={includeAgentCard}
                onChange={(e) => setIncludeAgentCard(e.target.checked)}
                className="rounded text-accent focus:ring-accent w-3.5 h-3.5 cursor-pointer"
              />
              <span>{isArabic ? 'بطاقة المستشار العقاري' : 'Agent Contact Card'}</span>
            </label>
          </div>
        </div>

        {/* Printable Real Estate Brochure Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface">
          <div 
            id="printable-unit-brochure"
            className="bg-white text-text rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl border border-border space-y-6 print:border-none print:shadow-none print:p-0"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            {/* Header: Luxury Real Estate Brand & Reference */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-border">
              <div className="flex items-center gap-3">
                <AppLogo variant="horizontal" size="md" theme="light" />
              </div>

              <div className={`text-xs text-text-muted space-y-1 ${isArabic ? 'sm:text-left' : 'sm:text-right'}`}>
                <div className="inline-block px-3 py-1 rounded-full bg-surface text-accent font-mono font-bold text-xs tracking-wider">
                  {brochureRef}
                </div>
                <div className="text-[11px] text-text-muted font-medium">
                  <span>{isArabic ? 'تاريخ الطرح: ' : 'Listed Date: '}</span>
                  <strong>{todayFormatted}</strong>
                </div>
              </div>
            </div>

            {/* Hero Cover Banner: Compound Name, Unit Type & Asking Price */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface via-surface to-surface-raised text-white p-6 shadow-xl border border-border">
              {/* Subtle architectural ambient highlight */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-accent rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-extrabold bg-accent text-text px-2.5 py-0.5 rounded-md shadow-sm">
                      {unit.id}
                    </span>
                    <span className="text-xs uppercase tracking-wider font-bold text-accent bg-accent border border-accent px-2.5 py-0.5 rounded-md">
                      {unit.category === 'rent' ? (isArabic ? 'إيجار فاخر' : 'Luxury Rental') : (isArabic ? 'تمليك سكني فاخر' : 'Exclusive Sale')}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                      unit.status.toLowerCase().includes('avail')
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : unit.status.toLowerCase().includes('reserv')
                        ? 'bg-accent text-accent border border-accent'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {unit.status}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                    {unit.compound}
                  </h1>

                  <p className="text-xs sm:text-sm text-text-muted flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-accent shrink-0" />
                    <span className="font-semibold">{unit.area}</span>
                    <span className="text-text-muted">|</span>
                    <span className="text-text-muted">{unit.propertyType} - {unit.unitType}</span>
                  </p>
                </div>

                {/* Price Display Block (Core Requirement) */}
                <div className={`p-4 rounded-xl bg-surface border border-accent shadow-inner ${
                  isArabic ? 'md:text-left' : 'md:text-right'
                }`}>
                  <span className="text-[11px] text-accent font-bold uppercase tracking-wider block">
                    {isArabic ? 'السعر الإجمالي المطلوب' : 'Asking Price'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                    {formatNumber(priceNum)} <span className="text-base font-semibold text-accent">{unit.currency}</span>
                  </div>
                  {pricePerMeter > 0 && (
                    <div className="text-xs text-text-muted font-medium mt-1">
                      {isArabic ? 'متوسط سعر المتر:' : 'Price / m²:'}{' '}
                      <strong className="text-accent font-mono">{formatNumber(pricePerMeter)} {unit.currency}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location Section (Core Requirement: Location) */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="text-xs font-extrabold text-text uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>{isArabic ? 'الموقع الجغرافي والوصول الاستراتيجي' : 'Prime Location & Connectivity'}</span>
                </h3>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  <span>{isArabic ? 'موقع مميز وحيوي' : 'Strategic Hub'}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-border space-y-1">
                  <span className="text-text-muted text-[11px] font-medium block">
                    {isArabic ? 'المدينة والمنطقة:' : 'City & Sub-market:'}
                  </span>
                  <strong className="text-text text-sm block">{unit.area}</strong>
                  <span className="text-[11px] text-text-muted block">
                    {isArabic ? 'السادس من أكتوبر / غرب القاهرة' : '6th of October / West Cairo'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-border space-y-1">
                  <span className="text-text-muted text-[11px] font-medium block">
                    {isArabic ? 'المحاور الرئيسية القريبة:' : 'Main Arteries & Access:'}
                  </span>
                  <strong className="text-text block text-xs">
                    {isArabic ? 'محور 26 يوليو، وصلة دهشور' : '26th of July Corridor, Dahshour'}
                  </strong>
                  <span className="text-[11px] text-text-muted block">
                    {isArabic ? 'سهولة الانتقال للمهندسين وزايد' : 'Seamless access to Zayed & Mohandessin'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-border space-y-1">
                  <span className="text-text-muted text-[11px] font-medium block">
                    {isArabic ? 'أبرز المعالم القريبة:' : 'Key Nearby Landmarks:'}
                  </span>
                  <strong className="text-text block text-xs">
                    {isArabic ? 'مول العرب، ميدان جهينة' : 'Mall of Arabia, Juhayna Sq.'}
                  </strong>
                  <span className="text-[11px] text-text-muted block">
                    {isArabic ? 'مستشفيات كبرى وجامعات دولية' : 'Top hospitals & universities'}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Features Matrix (Core Requirement: Key Features) */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2.5">
                <Building2 className="w-4 h-4 text-accent" />
                <span>{isArabic ? 'المواصفات الفنية والمميزات الأساسية للوحدة' : 'Key Specifications & Features'}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Size */}
                <div className="bg-accent p-3.5 rounded-xl border border-accent">
                  <span className="text-accent text-[11px] font-semibold flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-accent" />
                    {isArabic ? 'المساحة الإجمالية' : 'Built-up Area'}
                  </span>
                  <div className="text-base font-extrabold text-text mt-1 font-mono">
                    {unit.size} <span className="text-xs font-normal text-text-muted">م² (sqm)</span>
                  </div>
                </div>

                {/* Bedrooms */}
                <div className="bg-surface p-3.5 rounded-xl border border-border">
                  <span className="text-text-muted text-[11px] font-semibold flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-text-muted" />
                    {isArabic ? 'غرف النوم' : 'Bedrooms'}
                  </span>
                  <div className="text-base font-extrabold text-text mt-1">
                    {unit.beds} <span className="text-xs font-normal text-text-muted">{isArabic ? 'غرف' : 'Rooms'}</span>
                  </div>
                </div>

                {/* Bathrooms */}
                <div className="bg-surface p-3.5 rounded-xl border border-border">
                  <span className="text-text-muted text-[11px] font-semibold flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 text-text-muted" />
                    {isArabic ? 'الحمامات' : 'Bathrooms'}
                  </span>
                  <div className="text-base font-extrabold text-text mt-1">
                    {unit.baths || 2} <span className="text-xs font-normal text-text-muted">{isArabic ? 'حمامات' : 'Baths'}</span>
                  </div>
                </div>

                {/* Floor Level */}
                <div className="bg-surface p-3.5 rounded-xl border border-border">
                  <span className="text-text-muted text-[11px] font-semibold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-text-muted" />
                    {isArabic ? 'الدور والارتفاع' : 'Floor Level'}
                  </span>
                  <div className="text-base font-extrabold text-text mt-1">
                    {unit.floor || (isArabic ? 'متكرر' : 'Typical')}
                  </div>
                </div>

                {/* Delivery */}
                <div className="bg-surface p-3.5 rounded-xl border border-border">
                  <span className="text-text-muted text-[11px] font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    {isArabic ? 'حالة الاستلام' : 'Delivery Status'}
                  </span>
                  <div className="text-sm font-bold text-text mt-1">
                    {unit.deliveryDate || (isArabic ? 'استلام فوري' : 'Ready to move')}
                  </div>
                </div>

                {/* Property Type */}
                <div className="bg-surface p-3.5 rounded-xl border border-border">
                  <span className="text-text-muted text-[11px] font-semibold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-text-muted" />
                    {isArabic ? 'تصنيف الوحدة' : 'Unit Type'}
                  </span>
                  <div className="text-sm font-bold text-text mt-1">
                    {unit.unitType}
                  </div>
                </div>

                {/* Finishing */}
                <div className="bg-surface p-3.5 rounded-xl border border-border">
                  <span className="text-text-muted text-[11px] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-text-muted" />
                    {isArabic ? 'نوع التشطيب' : 'Finishing'}
                  </span>
                  <div className="text-sm font-bold text-text mt-1">
                    {unit.notes?.includes('تشطيب') 
                      ? (isArabic ? 'تشطيب كامل سوبر لوكس' : 'Fully Finished') 
                      : (isArabic ? 'نصف تشطيب / محارة' : 'Core & Shell / Semi')}
                  </div>
                </div>

                {/* View */}
                <div className="bg-surface p-3.5 rounded-xl border border-border">
                  <span className="text-text-muted text-[11px] font-semibold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-text-muted" />
                    {isArabic ? 'الإطلالة والفيو' : 'Property View'}
                  </span>
                  <div className="text-sm font-bold text-text mt-1 truncate">
                    {unit.notes?.includes('View') || unit.notes?.includes('فيو')
                      ? (isArabic ? 'فيو مفتوح ولاندسكيب' : 'Landscape / Open View')
                      : (isArabic ? 'إطلالة بحرية مميزة' : 'Garden / Prime View')}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Special Features Highlight */}
            {unit.notes && (
              <div className="bg-accent border border-accent rounded-xl p-4">
                <span className="text-xs font-bold text-accent block mb-1">
                  {isArabic ? '📌 تفاصيل العرض وملاحظات الفحص:' : '📌 Special Remarks & Payment Terms:'}
                </span>
                <p className="text-xs text-text leading-relaxed font-medium">
                  {unit.notes}
                </p>
              </div>
            )}

            {/* Amenities Grid */}
            {includeAmenities && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isArabic ? 'مميزات وخدمات الكمبوند والمشروع' : 'Compound Facilities & Community Highlights'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {amenities.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-text">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>{isArabic ? item.ar : item.en}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scannable QR Code & Agent Mandate Card */}
            <div className="pt-2 border-t-2 border-border grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Real Scannable QR Code Feature */}
              {includeQrCode && (
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-3.5">
                  <div className="bg-white p-1.5 rounded-lg border border-border shrink-0 shadow-sm">
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt={`QR Code for Unit ${unit.id}`}
                        className="w-20 h-20 object-contain"
                      />
                    ) : (
                      <div className="w-20 h-20 flex items-center justify-center bg-surface-raised">
                        <QrCodeIcon className="w-10 h-10 text-text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <span className="font-extrabold text-text block text-xs">
                      {isArabic ? 'امسح الرمز للمعاينة الرقمية' : 'Scan for Live Listing'}
                    </span>
                    <p className="text-[11px] text-text-muted leading-tight">
                      {isArabic 
                        ? 'افتح صفحة الوحدة مباشرة بالهاتف أثناء المعاينة الميدانية' 
                        : 'Open unit details directly on your mobile during field visits.'}
                    </p>
                    <span className="font-mono text-[10px] text-accent font-bold block">
                      ID: {unit.id}
                    </span>
                  </div>
                </div>
              )}

              {/* Agent Contact Card */}
              {includeAgentCard && (
                <div className="p-3 bg-surface text-white rounded-xl space-y-1.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-accent tracking-wider">
                      {isArabic ? 'المستشار العقاري المعتمد' : 'Certified Property Consultant'}
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>{isArabic ? 'وكيل حصري' : 'Mandate'}</span>
                    </span>
                  </div>

                  <div className="font-bold text-sm text-white">{agentName}</div>
                  
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border text-text-muted">
                    <span className="font-mono text-accent font-bold" dir="ltr">{agentPhone}</span>
                    <span className="text-[11px] text-text-muted">6 October Real Estate</span>
                  </div>
                </div>
              )}
            </div>

            {/* Official Disclaimer */}
            <div className="text-[10px] text-text-muted text-center pt-2 border-t border-border">
              {isArabic 
                ? 'هذا البروشور وثيقة تسويقية رسمية صادرة من منظومة 6O Real Estate CRM لإدارة وتسويق عقارات 6 أكتوبر والشيخ زايد.' 
                : 'Official property brochure issued by 6O Real Estate CRM Platform for 6th of October & Sheikh Zayed developments.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
