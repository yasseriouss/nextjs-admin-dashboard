import { formatNumber } from '../i18n/format';
import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  X,
  Building2,
  DollarSign,
  FileText,
  Share2,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  QrCode as QrCodeIcon,
  User,
  Check,
  Info,
  Loader2
} from 'lucide-react';
import { Unit } from '../types';
import { AppLogo } from './AppLogo';
import { generateUnitQrCodeDataUrl, getUnitDirectUrl } from '../services/qrService';
import { exportElementToPdf, printCleanElement } from '../services/pdfExportService';

interface UnitOfficialQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
  isArabic: boolean;
  theme?: 'dark' | 'light';
}

export const UnitOfficialQuotationModal: React.FC<UnitOfficialQuotationModalProps> = ({
  isOpen,
  onClose,
  unit,
  isArabic,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [clientName, setClientName] = useState<string>('');
  const [paymentPlan, setPaymentPlan] = useState<'cash' | 'installments'>('cash');
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [installmentYears, setInstallmentYears] = useState<number>(5);
  useState<string>('');
  const [includeQrCode, setIncludeQrCode] = useState<boolean>(true);
  const [includeCompoundHighlights, setIncludeCompoundHighlights] = useState<boolean>(true);
  const [includeOfficialSeal, setIncludeOfficialSeal] = useState<boolean>(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Generate dynamic QR code linking directly to the unit in the CRM app
  useEffect(() => {
    if (unit) {
      generateUnitQrCodeDataUrl(unit.id, {
        width: 260,
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

  // Financial calculations
  const downPaymentAmount = Math.round((priceNum * downPaymentPercent) / 100);
  const remainingAmount = priceNum - downPaymentAmount;
  const totalQuarterlyInstallments = installmentYears * 4;
  const quarterlyInstallmentAmount = totalQuarterlyInstallments > 0 ? Math.round(remainingAmount / totalQuarterlyInstallments) : 0;
  const cashDiscountPercent = 8;
  const cashDiscountAmount = Math.round((priceNum * cashDiscountPercent) / 100);
  const cashPriceAfterDiscount = priceNum - cashDiscountAmount;

  // Quotation Metadata
  const quotationRef = `QT-6O-${unit.id}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const issueDate = new Date();
  const validityDate = new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days validity

  const formattedIssueDate = issueDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedValidityDate = validityDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const agentName = unit.agent || (isArabic ? 'م. كريم سامي' : 'Eng. Karim Samy');
  const agentRole = isArabic ? 'مستشار المبيعات والاستثمار العقاري' : 'Senior Real Estate Investment Consultant';
  const agentPhone = '+20 100 876 5432';
  const companyEmail = 'sales@6october-realestate.com';
  const companyAddress = isArabic 
    ? 'محور 26 يوليو، ميدان جهينة، مبنى وست تاون هاب، 6 أكتوبر، الجيزة' 
    : '26th of July Corridor, Juhayna Square, Westown Hub, 6th of October City, Giza';

  // Compound Highlights
  const compoundAmenities = [
    { ar: 'بوابات أمنية ذكية وحراسة 24/7 مع كاميرات مراقبة', en: '24/7 Gated Security with Smart Surveillance' },
    { ar: 'موقع استراتيجي بالقرب من المحاور الرئيسية والخدمات', en: 'Prime Strategic Location Near Major Corridors' },
    { ar: 'كلوب هاوس فاخر، ملاعب رياضية، ومسارات للدراجات', en: 'Luxury Clubhouse, Sports Courts & Jogging Tracks' },
    { ar: 'مساحات خضراء ولاندسكيب مفتوح وبحيرات صناعية', en: 'Expansive Green Landscapes & Water Features' },
    { ar: 'جراج سيارات خاص تحت الأرض لكل وحدة', en: 'Dedicated Underground Private Parking' },
    { ar: 'صيانة دورية وإدارة احترافية للمرافق والمجتمع', en: 'Professional Community & Facility Management' }
  ];

  const handlePrint = () => {
    const printableElement = document.getElementById('printable-official-quotation');
    if (!printableElement) {
      window.print();
      return;
    }
    const title = isArabic 
      ? `عرض سعر رسمي - الوحدة ${unit.id} - ${unit.compound}` 
      : `Official Quotation - Unit ${unit.id} - ${unit.compound}`;
    printCleanElement(printableElement, title, isArabic);
  };

  const handleDownloadQuotation = async () => {
    const printableElement = document.getElementById('printable-official-quotation');
    if (!printableElement) return;

    try {
      setIsExportingPdf(true);
      const safeCompound = (unit.compound || 'Compound').replace(/\s+/g, '_');
      const filename = `Price_Offer_${unit.id}_${safeCompound}.pdf`;
      await exportElementToPdf(printableElement, filename);
    } catch (err) {
      console.error('Failed to export PDF, falling back to print dialog', err);
      handlePrint();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleShareWhatsApp = () => {
    const greeting = clientName.trim() 
      ? (isArabic ? `عناية السيد/السيدة: *${clientName.trim()}*` : `Dear: *${clientName.trim()}*`)
      : (isArabic ? `عناية العميل المحترم` : `Valued Client`);

    const summaryText = `📋 *عرض سعر رسمي معتمد - وحدة عقارية*\n` +
      `🏢 *شركة 6 أكتوبر للتسويق والاستثمار العقاري*\n` +
      `-----------------------------------------\n` +
      `${greeting}\n\n` +
      `يسرنا أن نقدم لسيادتكم تفاصيل عرض السعر المالي والفني للوحدة التالية:\n` +
      `▪ *المشروع / الكمبوند:* ${unit.compound}\n` +
      `▪ *المنطقة:* ${unit.area}\n` +
      `▪ *كود الوحدة:* ${unit.id}\n` +
      `▪ *نوع العقار:* ${unit.propertyType} (${unit.unitType})\n` +
      `▪ *المساحة:* ${unit.size} م² | *الغرف:* ${unit.beds} نوم | *الحمامات:* ${unit.baths || 2}\n` +
      `▪ *الدور:* ${unit.floor || (isArabic ? 'متكرر' : 'Typical')}\n` +
      `▪ *موعد الاستلام:* ${unit.deliveryDate || (isArabic ? 'استلام فوري' : 'Ready')}\n` +
      `-----------------------------------------\n` +
      `💰 *البيانات المالية وعرض السعر:*\n` +
      `▪ *إجمالي السعر:* ${formatNumber(priceNum)} ${unit.currency}\n` +
      (pricePerMeter > 0 ? `▪ *سعر المتر:* ${formatNumber(pricePerMeter)} ${unit.currency}/م²\n` : '') +
      (paymentPlan === 'cash' 
        ? `▪ *نظام الدفع:* كاش - خصم خاص للدفع الفوري 8% (السعر بعد الخصم: ${formatNumber(cashPriceAfterDiscount)} ${unit.currency})\n`
        : `▪ *نظام التقسيط:* مقدم ${downPaymentPercent}% (${formatNumber(downPaymentAmount)} ${unit.currency}) والباقي على ${installmentYears} سنوات بأقساط ربع سنوية (${formatNumber(quarterlyInstallmentAmount)} ${unit.currency})\n`) +
      `-----------------------------------------\n` +
      `🔗 *رابط المعاينة الرقمية والتحقق المباشر:*\n${directUrl}\n\n` +
      `📞 *للتواصل والتنسيق مع مستشار المبيعات:*\n` +
      `*${agentName}* - ${agentRole}\n` +
      `هاتف: ${agentPhone} | بريد: ${companyEmail}\n` +
      `رقم العرض: ${quotationRef} | العرض ساري حتى: ${formattedValidityDate}`;

    navigator.clipboard.writeText(summaryText);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-surface backdrop-blur-md overflow-y-auto">
      {/* CSS Rules dedicated to print rendering */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-official-quotation, #printable-official-quotation * {
            visibility: visible !important;
          }
          #printable-official-quotation {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: var(--color-navy, rgb(15, 45, 82)) !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}} />

      <div className={`w-full max-w-4xl my-auto rounded-3xl border shadow-2xl flex flex-col max-h-[96vh] overflow-hidden ${
        isDark ? 'bg-surface border-border text-text' : 'bg-white border-border text-text'
      }`}>
        {/* Top Control Header Bar (Hidden during print) */}
        <div className={`p-4 border-b flex items-center justify-between gap-3 print:hidden ${
          isDark ? 'bg-surface border-border' : 'bg-surface border-border'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/25">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {isArabic ? `عرض سعر رسمي للعملاء (${unit.id})` : `Official Price Quotation (${unit.id})`}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent text-accent border border-accent">
                  {unit.compound}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                {isArabic 
                  ? 'نموذج عرض سعر رسمي معتمد لمشاركته مع العملاء يتضمن التفاصيل المالية والمواصفات وختم المبيعات' 
                  : 'Certified formal price offer ready to export as PDF or share via WhatsApp with clients'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Direct PDF Export Button */}
            <button
              onClick={handleDownloadQuotation}
              disabled={isExportingPdf}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-500/25 cursor-pointer"
              title={isArabic ? 'تصدير وحفظ مستند عرض السعر بصيغة PDF رسمية' : 'Export and download official PDF quotation'}
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{isArabic ? 'جاري إنشاء PDF...' : 'Generating PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isArabic ? 'تصدير كملف PDF' : 'Download PDF'}</span>
                </>
              )}
            </button>

            {/* Print / Save as PDF Button */}
            <button
              onClick={handlePrint}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-surface-raised hover:bg-surface-raised text-text border-border' 
                  : 'bg-white hover:bg-surface-raised text-text border-border'
              }`}
              title={isArabic ? 'معاينة الطباعة / الحفظ السريع كملف PDF' : 'Print preview or quick save as PDF'}
            >
              <Printer className="w-4 h-4" />
              <span>{isArabic ? 'طباعة' : 'Print'}</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              title={isArabic ? 'نسخ نص العرض المنسق لمشاركته عبر الواتساب' : 'Copy formatted text for WhatsApp'}
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedWhatsApp ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'مشاركة واتساب' : 'WhatsApp')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Options Bar (Hidden in print) */}
        <div className={`px-4 py-3 border-b space-y-3 text-xs print:hidden ${
          isDark ? 'bg-surface border-border text-text-muted' : 'bg-surface-raised border-border text-text'
        }`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Client Name Input */}
            <div className="flex items-center gap-2 flex-1">
              <User className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-semibold shrink-0">
                {isArabic ? 'اسم العميل / الجهة:' : 'Client Name:'}
              </span>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder={isArabic ? 'أدخل اسم العميل (مثال: د. محمد الشناوي)...' : 'Enter client name (e.g. Dr. Mohamed El-Shenawy)...'}
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Payment Option Toggle */}
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent shrink-0" />
              <span className="font-semibold shrink-0">
                {isArabic ? 'نظام السداد:' : 'Payment:'}
              </span>
              <div className="flex rounded-lg border border-border bg-surface p-0.5">
                <button
                  type="button"
                  onClick={() => setPaymentPlan('cash')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    paymentPlan === 'cash' ? 'bg-blue-600 text-white' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {isArabic ? 'دفع كاش (خصم 8%)' : 'Cash (8% Off)'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPlan('installments')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    paymentPlan === 'installments' ? 'bg-blue-600 text-white' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {isArabic ? 'خطة تقسيط' : 'Installments'}
                </button>
              </div>
            </div>
          </div>

          {/* Conditional Installments Config */}
          {paymentPlan === 'installments' && (
            <div className="flex items-center gap-4 pt-1 border-t border-border text-[11px] flex-wrap">
              <div className="flex items-center gap-1.5">
                <span>{isArabic ? 'الدفعة المقدمة:' : 'Down Payment:'}</span>
                <select
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="bg-surface border border-border rounded px-2 py-0.5 text-text"
                >
                  <option value={10}>10% ({formatNumber(Math.round(priceNum * 0.1))} {unit.currency})</option>
                  <option value={15}>15% ({formatNumber(Math.round(priceNum * 0.15))} {unit.currency})</option>
                  <option value={20}>20% ({formatNumber(Math.round(priceNum * 0.2))} {unit.currency})</option>
                  <option value={25}>25% ({formatNumber(Math.round(priceNum * 0.25))} {unit.currency})</option>
                  <option value={30}>30% ({formatNumber(Math.round(priceNum * 0.3))} {unit.currency})</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span>{isArabic ? 'مدة التقسيط:' : 'Period:'}</span>
                <select
                  value={installmentYears}
                  onChange={(e) => setInstallmentYears(Number(e.target.value))}
                  className="bg-surface border border-border rounded px-2 py-0.5 text-text"
                >
                  <option value={3}>{isArabic ? '3 سنوات (12 قسط)' : '3 Years'}</option>
                  <option value={4}>{isArabic ? '4 سنوات (16 قسط)' : '4 Years'}</option>
                  <option value={5}>{isArabic ? '5 سنوات (20 قسط)' : '5 Years'}</option>
                  <option value={6}>{isArabic ? '6 سنوات (24 قسط)' : '6 Years'}</option>
                  <option value={7}>{isArabic ? '7 سنوات (28 قسط)' : '7 Years'}</option>
                  <option value={8}>{isArabic ? '8 سنوات (32 قسط)' : '8 Years'}</option>
                </select>
              </div>

              <span className="text-accent font-semibold">
                {isArabic ? 'القسط الربع سنوي:' : 'Quarterly installment:'} {formatNumber(quarterlyInstallmentAmount)} {unit.currency}
              </span>
            </div>
          )}

          {/* Toggles */}
          <div className="flex items-center gap-4 pt-1 border-t border-border text-[11px] flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCompoundHighlights}
                onChange={(e) => setIncludeCompoundHighlights(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>{isArabic ? 'تضمين مميزات وخدمات الكمبوند' : 'Include Compound Amenities'}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQrCode}
                onChange={(e) => setIncludeQrCode(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>{isArabic ? 'تضمين رمز QR الرقمي للتحقق' : 'Include Digital Verification QR'}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeOfficialSeal}
                onChange={(e) => setIncludeOfficialSeal(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>{isArabic ? 'ختم وتوقيع إدارة المبيعات' : 'Official Sales Seal & Signature'}</span>
            </label>
          </div>
        </div>

        {/* Printable Official Quotation Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface">
          <div
            id="printable-official-quotation"
            className="bg-white text-text rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl border border-border space-y-6 print:border-none print:shadow-none print:p-0"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            {/* Header: Agency Identity & Formal Quotation Banner */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-border">
              <div className="space-y-1">
                <AppLogo variant="horizontal" size="md" theme="light" />
                <p className="text-[11px] text-text-muted max-w-md pt-1">
                  {isArabic 
                    ? 'شركة 6 أكتوبر للتسويق والاستثمار العقاري - إدارة التسويق والمبيعات'
                    : '6th of October Real Estate Investment & Advisory - Sales & Marketing Division'}
                </p>
                <p className="text-[10px] text-text-muted">
                  {companyAddress}
                </p>
              </div>

              <div className={`text-xs text-text-muted space-y-1.5 ${isArabic ? 'sm:text-left' : 'sm:text-right'}`}>
                <div className="inline-block px-3 py-1 rounded-lg bg-blue-900 text-white font-mono font-bold text-xs tracking-wider">
                  {quotationRef}
                </div>
                <div className="text-[11px] text-text-muted">
                  <span>{isArabic ? 'تاريخ العرض: ' : 'Date: '}</span>
                  <strong>{formattedIssueDate}</strong>
                </div>
                <div className="text-[11px] text-accent bg-accent px-2 py-0.5 rounded border border-accent inline-block font-semibold">
                  <span>{isArabic ? 'صلاحية العرض: ' : 'Valid Until: '}</span>
                  <strong>{formattedValidityDate}</strong>
                </div>
              </div>
            </div>

            {/* Official Title & Addressee */}
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                  {isArabic ? 'عرض سعر رسمي معتمد - وحدة سكنية / استثمارية' : 'OFFICIAL REAL ESTATE PRICE QUOTATION & OFFER'}
                </span>
                <h2 className="text-base font-extrabold text-text mt-0.5">
                  {isArabic ? 'مقدم إلى السيد / السيدة: ' : 'Prepared For: '}
                  <span className="text-blue-900 underline decoration-blue-500 decoration-2">
                    {clientName.trim() || (isArabic ? 'العميل المحترم' : 'Valued Client')}
                  </span>
                </h2>
              </div>
              <div className="text-left sm:text-right">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {isArabic ? 'عرض مالي ساري' : 'Active Price Offer'}
                </span>
              </div>
            </div>

            {/* Compound & Unit Primary Specs Grid */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-surface text-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-accent" />
                  <div>
                    <h3 className="text-base font-bold">{unit.compound}</h3>
                    <p className="text-xs text-text-muted flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      {unit.area} - {isArabic ? 'غرب القاهرة، الجيزة' : 'West Cairo, Giza'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs bg-accent text-text font-bold px-2 py-0.5 rounded">
                    {unit.id}
                  </span>
                  <span className="text-xs text-text-muted">
                    {unit.propertyType} - {unit.unitType}
                  </span>
                </div>
              </div>

              {/* Specs Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border text-xs bg-white">
                <div className="p-3">
                  <span className="text-text-muted block text-[11px]">{isArabic ? 'المساحة الصافية الإجمالية' : 'Total Area'}</span>
                  <strong className="text-text font-bold text-sm block mt-0.5">{unit.size} م²</strong>
                </div>

                <div className="p-3">
                  <span className="text-text-muted block text-[11px]">{isArabic ? 'غرف النوم' : 'Bedrooms'}</span>
                  <strong className="text-text font-bold text-sm block mt-0.5">{unit.beds} {isArabic ? 'غرف' : 'Rooms'}</strong>
                </div>

                <div className="p-3">
                  <span className="text-text-muted block text-[11px]">{isArabic ? 'الحمامات' : 'Bathrooms'}</span>
                  <strong className="text-text font-bold text-sm block mt-0.5">{unit.baths || 2} {isArabic ? 'حمامات' : 'Baths'}</strong>
                </div>

                <div className="p-3">
                  <span className="text-text-muted block text-[11px]">{isArabic ? 'الدور / الطابق' : 'Floor Level'}</span>
                  <strong className="text-text font-bold text-sm block mt-0.5">{unit.floor || (isArabic ? 'الدور المتكرر' : 'Typical Floor')}</strong>
                </div>

                <div className="p-3">
                  <span className="text-text-muted block text-[11px]">{isArabic ? 'نوع التشطيب' : 'Finishing Type'}</span>
                  <strong className="text-text font-semibold block mt-0.5">{isArabic ? 'سوبر لوكس فندقي' : 'Super Lux'}</strong>
                </div>

                <div className="p-3">
                  <span className="text-text-muted block text-[11px]">{isArabic ? 'موعد الاستلام' : 'Delivery Date'}</span>
                  <strong className="text-emerald-700 font-bold block mt-0.5">{unit.deliveryDate || (isArabic ? 'استلام فوري' : 'Ready to Move')}</strong>
                </div>

                <div className="p-3">
                  <span className="text-text-muted block text-[11px]">{isArabic ? 'الإطلالة والفيو' : 'View'}</span>
                  <strong className="text-text font-semibold block mt-0.5">{isArabic ? 'بحيرات ومساحات خضراء مفتوحة' : 'Landscape & Pool View'}</strong>
                </div>

                <div className="p-3">
                  <span className="text-text-muted block text-[11px]">{isArabic ? 'حالة التوثيق' : 'Title Deed'}</span>
                  <strong className="text-blue-700 font-semibold block mt-0.5">{isArabic ? 'حصة بالأرض وعقد موثق' : 'Deed Verified'}</strong>
                </div>
              </div>
            </div>

            {/* Official Financial Pricing Breakdown Table */}
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border-2 border-blue-600/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-700" />
                  <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wider">
                    {isArabic ? 'بيان التسعير المالي وشروط السداد المعتمدة' : 'Official Pricing & Approved Payment Schedule'}
                  </h3>
                </div>
                <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  {paymentPlan === 'cash' ? (isArabic ? 'نظام الدفع النقدي' : 'Cash Plan') : (isArabic ? 'نظام التقسيط المريح' : 'Installment Plan')}
                </span>
              </div>

              {/* Price Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                  <span className="text-xs text-text-muted block">{isArabic ? 'إجمالي السعر الإجمالي المطلوب:' : 'Total Asking Price:'}</span>
                  <div className="text-xl font-extrabold text-blue-900 mt-1">
                    {formatNumber(priceNum)} <span className="text-xs font-normal text-text-muted">{unit.currency}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                  <span className="text-xs text-text-muted block">{isArabic ? 'سعر المتر المربع التقديري:' : 'Average Price per m²:'}</span>
                  <div className="text-xl font-bold text-text mt-1">
                    {pricePerMeter > 0 ? formatNumber(pricePerMeter) : '-'} <span className="text-xs font-normal text-text-muted">{unit.currency}/م²</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                  <span className="text-xs text-text-muted block">
                    {paymentPlan === 'cash' ? (isArabic ? 'السعر النهائي بعد خصم الكاش:' : 'Net Price after Discount:') : (isArabic ? 'الدفعة المقدمة للحجز:' : 'Required Down Payment:')}
                  </span>
                  <div className="text-xl font-extrabold text-emerald-700 mt-1">
                    {paymentPlan === 'cash' 
                      ? `${formatNumber(cashPriceAfterDiscount)} ${unit.currency}`
                      : `${formatNumber(downPaymentAmount)} ${unit.currency}`}
                  </div>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    {paymentPlan === 'cash' 
                      ? (isArabic ? `خصم 8% نقدي فوري (-${formatNumber(cashDiscountAmount)} ج.م)` : `8% Instant Cash Discount`)
                      : (isArabic ? `نسبة المقدم ${downPaymentPercent}% شاملة جدية الحجز` : `${downPaymentPercent}% Initial Down Payment`)}
                  </span>
                </div>
              </div>

              {/* Installment Plan Schedule Table if Installments Selected */}
              {paymentPlan === 'installments' && (
                <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                  <div className="px-4 py-2 bg-blue-900 text-white text-xs font-bold flex items-center justify-between">
                    <span>{isArabic ? `جدول وخطة الأقساط المقترحة (${installmentYears} سنوات)` : `Payment Breakdown Schedule (${installmentYears} Years)`}</span>
                    <span>{totalQuarterlyInstallments} {isArabic ? 'قسط ربع سنوي متساوي' : 'Equal Quarterly Installments'}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 p-3 gap-2 text-xs divide-x divide-border">
                    <div className="p-1">
                      <span className="text-text-muted block text-[11px]">{isArabic ? 'الدفعة المقدمة:' : 'Down Payment:'}</span>
                      <strong className="text-blue-950 block">{formatNumber(downPaymentAmount)} {unit.currency}</strong>
                    </div>
                    <div className="p-1">
                      <span className="text-text-muted block text-[11px]">{isArabic ? 'المبلغ المتبقي للتقسيط:' : 'Remaining Balance:'}</span>
                      <strong className="text-blue-950 block">{formatNumber(remainingAmount)} {unit.currency}</strong>
                    </div>
                    <div className="p-1">
                      <span className="text-text-muted block text-[11px]">{isArabic ? 'قيمة القسط الربع سنوي:' : 'Quarterly Installment:'}</span>
                      <strong className="text-emerald-700 font-bold block">{formatNumber(quarterlyInstallmentAmount)} {unit.currency}</strong>
                    </div>
                    <div className="p-1">
                      <span className="text-text-muted block text-[11px]">{isArabic ? 'وديعة الصيانة:' : 'Maintenance:'}</span>
                      <strong className="text-text block">{formatNumber(Math.round(priceNum * 0.08))} {unit.currency} (8%)</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compound Amenities & Features */}
            {includeCompoundHighlights && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1.5">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>{isArabic ? `أهم مميزات وخدمات كمبوند ${unit.compound}` : `Key Amenities of ${unit.compound}`}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {compoundAmenities.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-text font-medium">
                        {isArabic ? item.ar : item.en}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Inspection or Unit Notes if present */}
            {unit.notes && (
              <div className="p-3 bg-accent border border-accent rounded-xl text-xs space-y-1">
                <span className="font-bold text-accent flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-accent" />
                  {isArabic ? 'ملاحظات وتفاصيل إضافية خاصة بالوحدة:' : 'Special Unit Features & Notes:'}
                </span>
                <p className="text-text leading-relaxed">{unit.notes}</p>
              </div>
            )}

            {/* Authorized Agent Contact & Broker Identity */}
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                  {isArabic ? 'المستشار العقاري المعتمد للتواصل والمعاينة:' : 'Assigned Real Estate Consultant:'}
                </span>
                <div className="text-sm font-bold text-text">{agentName}</div>
                <div className="text-text-muted text-xs">{agentRole}</div>
                <div className="flex items-center gap-4 text-text pt-1">
                  <span className="flex items-center gap-1 font-mono font-bold" dir="ltr">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {agentPhone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    {companyEmail}
                  </span>
                </div>
              </div>

              {/* QR Code For Live Unit Verification */}
              {includeQrCode && (
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-border shadow-sm shrink-0">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt={`QR ${unit.id}`} className="w-16 h-16 object-contain" />
                  ) : (
                    <QrCodeIcon className="w-16 h-16 text-text" />
                  )}
                  <div className="text-[10px] text-text-muted space-y-0.5 max-w-[150px]">
                    <div className="font-bold text-text">
                      {isArabic ? 'امسح للتحقق الرقمي' : 'Scan for Live Specs'}
                    </div>
                    <div>{isArabic ? 'افتح تفاصيل الوحدة والصور مباشرة عبر هاتفك' : 'Open live property page & verify listing'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Official Seal, Terms & Signatures */}
            {includeOfficialSeal && (
              <div className="pt-4 border-t-2 border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                {/* Terms Summary */}
                <div className="text-[10px] text-text-muted max-w-sm space-y-0.5">
                  <p className="font-bold text-text">
                    {isArabic ? 'شروط وأحكام العرض:' : 'Terms & Conditions:'}
                  </p>
                  <p>
                    {isArabic 
                      ? 'هذا العرض سارٍ لمدة 14 يوماً من تاريخ الإصدار ويخضع لتوافر الوحدة في وقت توقيع استمارة الحجز. الأسعار نهائية طبقاً لعقد المطور/المالك.' 
                      : 'This quotation is valid for 14 days from issue date and subject to property availability at reservation time.'}
                  </p>
                </div>

                {/* Stamp & Signature Section */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-[10px] text-text-muted mb-1">{isArabic ? 'توقيع المستشار العقاري' : 'Agent Signature'}</div>
                    <div className="font-serif italic text-blue-900 border-b border-border pb-0.5 px-3 min-w-[100px]">
                      {agentName.split(' ')[0]}
                    </div>
                  </div>

                  {/* Stamp Box */}
                  <div className="border-2 border-dashed border-blue-600/50 rounded-xl p-2.5 bg-blue-50/50 text-center min-w-[140px]">
                    <div className="text-[9px] uppercase font-bold text-blue-800 tracking-wider">
                      {isArabic ? 'اعتماد إدارة المبيعات' : 'Sales Department'}
                    </div>
                    <div className="text-[11px] font-extrabold text-blue-950 mt-0.5">
                      6 OCTOBER CRM
                    </div>
                    <div className="text-[8px] text-blue-600 font-mono mt-0.5">
                      CERTIFIED QUOTATION
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitOfficialQuotationModal;
