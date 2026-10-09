import { formatNumber } from '../i18n/format';
import React, { useState, useRef } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  Building2, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { Unit, DashboardKPIs } from '../types';
import { AppLogo } from './AppLogo';
import { exportElementToPdf, printCleanElement } from '../services/pdfExportService';

interface MonthlySalesPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  kpis: DashboardKPIs;
  compoundData: Array<{
    compound: string;
    totalUnits: number;
    available: number;
    reserved: number;
    sold: number;
    avgSize: number;
    avgPriceMeter: number;
    totalValueMillions: number;
  }>;
  isArabic: boolean;
  theme?: 'dark' | 'light';
}

const POPULAR_DEVELOPERS = [
  'بالم هيلز للتعمير (Palm Hills Developments)',
  'ماونتن فيو للاستثمار العقاري (Mountain View DMG)',
  'شركة سوديك - السادس من أكتوبر (SODIC West)',
  'أوراسكوم العقارية - مشروع O West (Orascom)',
  'مجموعة درة العقارية (Dorra Group)',
  'نيو جيزة للتنمية والتطوير (New Giza Developments)',
  'إنيرشيا للتطوير العقاري (Inertia Egypt - Joulz)',
  'مصر إيطاليا العقارية (Misr Italia)',
  'تطوير مصر (Tatweer Misr)',
  'كافة المطورين العقاريين المعتمدين بـ 6 أكتوبر والشيخ زايد'
];

export const MonthlySalesPdfModal: React.FC<MonthlySalesPdfModalProps> = ({
  isOpen,
  onClose,
  compoundData,
  isArabic,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const printableRef = useRef<HTMLDivElement>(null);

  // Customization Form State
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>(POPULAR_DEVELOPERS[0]);
  const [customDeveloperName, setCustomDeveloperName] = useState<string>('');
  const [reportTitle] = useState<string>(
    isArabic 
      ? 'التقرير التحليلي الشامل لحركة مبيعات ومخزون عقارات 6 أكتوبر والشيخ زايد' 
      : 'Comprehensive Monthly Sales & Inventory Intelligence Report - 6th of October & Sheikh Zayed'
  );
  const [preparedBy] = useState<string>(
    isArabic ? 'إدارة المبيعات ودراسات السوق - قطاع غرب القاهرة' : 'West Cairo Sales & Market Intelligence Division'
  );
  const [referenceCode] = useState<string>(
    `REF-6O-REP-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-08`
  );
  const [includePricingMatrix, setIncludePricingMatrix] = useState<boolean>(true);
  const [includeOfficialSeal, setIncludeOfficialSeal] = useState<boolean>(true);
  const [includeStrategicAdvice] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  if (!isOpen) return null;

  const targetDevName = customDeveloperName.trim() || selectedDeveloper;
  const todayFormatted = new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Totals calculations
  const totalUnitsCount = compoundData.reduce((acc, c) => acc + c.totalUnits, 0);
  const totalAvailable = compoundData.reduce((acc, c) => acc + c.available, 0);
  const totalReserved = compoundData.reduce((acc, c) => acc + c.reserved, 0);
  const totalSold = compoundData.reduce((acc, c) => acc + c.sold, 0);
  const totalValuationMillions = compoundData.reduce((acc, c) => acc + c.totalValueMillions, 0).toFixed(1);

  // Calculate weighted average price per meter
  const weightedPriceMeter = Math.round(
    compoundData
      .filter(c => c.avgPriceMeter > 0)
      .reduce((sum, c) => sum + (c.avgPriceMeter * c.totalUnits), 0) / (totalUnitsCount || 1)
  );

  // Trigger high fidelity PDF print
  const handlePrint = () => {
    const printableElement = document.getElementById('official-printable-report');
    if (!printableElement) {
      window.print();
      return;
    }
    const title = isArabic 
      ? 'التقرير التحليلي لحركة مبيعات 6 أكتوبر' 
      : '6th of October Monthly Sales Intelligence Report';
    printCleanElement(printableElement, title, isArabic);
  };

  const handleDownloadPdf = async () => {
    const printableElement = document.getElementById('official-printable-report');
    if (!printableElement) return;

    try {
      setIsExportingPdf(true);
      const filename = `Sales_Report_${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, '0')}.pdf`;
      await exportElementToPdf(printableElement, filename);
    } catch (err) {
      console.error('Failed to export sales report PDF', err);
      handlePrint();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-surface backdrop-blur-md overflow-y-auto">
      {/* Styles injected specifically for seamless PDF print rendering */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-printable-report, #official-printable-report * {
            visibility: visible !important;
          }
          #official-printable-report {
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

      <div className={`w-full max-w-5xl my-auto rounded-3xl border shadow-2xl flex flex-col max-h-[96vh] overflow-hidden ${
        isDark ? 'bg-surface border-border text-text' : 'bg-white border-border text-text'
      }`}>
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className={`p-4 border-b flex items-center justify-between gap-4 print:hidden ${
          isDark ? 'bg-surface border-border' : 'bg-surface border-border'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {isArabic ? 'تصدير تقرير المبيعات الرسمي للمطورين (PDF)' : 'Export Official Sales Report to PDF'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-accent border border-accent">
                  Ready for Developers
                </span>
              </div>
              <p className="text-xs text-text-muted">
                {isArabic ? 'تقرير رسمي معتمد يتضمن شعار المنظمة ومؤشرات أداء الكمبوندات لطباعته أو حفظه كـ PDF' : 'Official accredited report formatted with logo and compound metrics'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Direct PDF Export Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-500/25 cursor-pointer"
              title={isArabic ? 'تصدير وتحميل التقرير كـ PDF' : 'Download report as PDF'}
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
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
              title={isArabic ? 'طباعة التقرير أو حفظه كـ PDF' : 'Print or Save as PDF'}
            >
              <Printer className="w-4 h-4" />
              <span>{isArabic ? 'طباعة' : 'Print'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-surface-raised transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Settings Bar (Hidden on print) */}
        <div className={`p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-3 text-xs print:hidden ${
          isDark ? 'bg-surface border-border text-text-muted' : 'bg-surface-raised border-border text-text'
        }`}>
          {/* Target Developer Dropdown */}
          <div className="space-y-1">
            <label className="font-bold flex items-center gap-1 text-text-muted">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              {isArabic ? 'المطور العقاري الموجه إليه التقرير:' : 'Target Developer:'}
            </label>
            <select
              value={selectedDeveloper}
              onChange={(e) => setSelectedDeveloper(e.target.value)}
              className={`w-full p-2 rounded-xl border focus:outline-none cursor-pointer ${
                isDark ? 'bg-surface-raised border-border text-white' : 'bg-white border-border text-text'
              }`}
            >
              {POPULAR_DEVELOPERS.map((dev, idx) => (
                <option key={idx} value={dev}>{dev}</option>
              ))}
            </select>
          </div>

          {/* Custom Developer Override */}
          <div className="space-y-1">
            <label className="font-bold text-text-muted">
              {isArabic ? 'أو كتابة اسم مطور مخصص:' : 'Or Custom Developer Name:'}
            </label>
            <input
              type="text"
              placeholder={isArabic ? 'مثال: شركة التطوير المصرية...' : 'e.g., Cairo Development Co...'}
              value={customDeveloperName}
              onChange={(e) => setCustomDeveloperName(e.target.value)}
              className={`w-full p-2 rounded-xl border focus:outline-none ${
                isDark ? 'bg-surface-raised border-border text-white' : 'bg-white border-border text-text'
              }`}
            />
          </div>

          {/* Include Options checkboxes */}
          <div className="flex flex-col justify-center gap-1.5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePricingMatrix}
                onChange={(e) => setIncludePricingMatrix(e.target.checked)}
                className="rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>{isArabic ? 'تضمين مؤشر أسعار المتر المربع' : 'Include Price/m² Matrix'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeOfficialSeal}
                onChange={(e) => setIncludeOfficialSeal(e.target.checked)}
                className="rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>{isArabic ? 'تضمين خاتم الاعتماد والتوقيعات' : 'Include Seal & Signatures'}</span>
            </label>
          </div>
        </div>

        {/* The Printable Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface flex justify-center">
          <div 
            id="official-printable-report"
            ref={printableRef}
            className="w-full max-w-[210mm] bg-white text-text rounded-xl shadow-2xl p-8 sm:p-10 font-sans border border-border"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            {/* Top Official Header with Logo & Reference */}
            <div className="border-b-2 border-border pb-5 mb-6 flex items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                {/* Official Organization Logo */}
                <AppLogo 
                  variant="horizontal" 
                  size="lg" 
                  theme="light" 
                />
              </div>

              {/* Official Meta Box */}
              <div className="text-left rtl:text-left ltr:text-right text-[11px] text-text-muted space-y-1 font-mono">
                <div className="font-bold text-text text-xs">{referenceCode}</div>
                <div>{isArabic ? 'التاريخ:' : 'Date:'} {todayFormatted}</div>
                <div>{isArabic ? 'المدينة:' : 'Location:'} 6th of October & Sheikh Zayed</div>
                <div className="text-[10px] text-emerald-700 font-bold">
                  ● {isArabic ? 'وثيقة مبيعات رسمية معتمدة' : 'Official Accredited Report'}
                </div>
              </div>
            </div>

            {/* Target Developer Callout Block */}
            <div className="bg-surface border border-border rounded-xl p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800">
                    {isArabic ? 'موجه رسمياً إلى السادة:' : 'OFFICIALLY ADDRESSED TO:'}
                  </span>
                  <h2 className="text-base font-bold text-text mt-0.5">
                    {targetDevName}
                  </h2>
                  <p className="text-xs text-text-muted">
                    {isArabic 
                      ? 'عناية: قطاع المبيعات والتسويق وتطوير الأعمال وإدارة علاقات الوسطاء' 
                      : 'Attn: Sales & Marketing Directorate, Business Development & Broker Relations'}
                  </p>
                </div>

                <div className="text-right rtl:text-right ltr:text-left">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">
                    {isArabic ? 'إعداد ومصادقة:' : 'PREPARED BY:'}
                  </span>
                  <span className="text-xs font-bold text-text block">
                    {preparedBy}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="mb-6">
              <h1 className="text-xl font-black text-text tracking-tight">
                {reportTitle}
              </h1>
              <p className="text-xs text-text-muted mt-1">
                {isArabic 
                  ? 'رصد تفصيلي لمؤشرات السيولة، ومعدلات حجز الوحدات، ومتوسطات أسعار المتر المربع بالكمبوندات السكنية لمدينة 6 أكتوبر والشيخ زايد.'
                  : 'Detailed tracking of market liquidity, unit reservation rates, and average price per sqm across 6th of October and Sheikh Zayed residential compounds.'}
              </p>
            </div>

            {/* Executive KPIs Grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-center">
                <span className="text-[10px] text-blue-800 font-bold block">
                  {isArabic ? 'إجمالي تقييم المحفظة' : 'Total Inventory Valuation'}
                </span>
                <span className="text-lg font-black text-blue-900 font-mono block mt-0.5">
                  {totalValuationMillions}
                </span>
                <span className="text-[9px] text-blue-700 font-medium">
                  {isArabic ? 'مليون جنيه مصري' : 'Million EGP'}
                </span>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-[10px] text-emerald-800 font-bold block">
                  {isArabic ? 'الوحدات المتاحة للبيع' : 'Available Units'}
                </span>
                <span className="text-lg font-black text-emerald-900 font-mono block mt-0.5">
                  {totalAvailable}
                </span>
                <span className="text-[9px] text-emerald-700 font-medium">
                  {isArabic ? 'وحدة سكنية شاغرة' : 'vacant units'}
                </span>
              </div>

              <div className="bg-accent border border-accent rounded-xl p-3 text-center">
                <span className="text-[10px] text-accent font-bold block">
                  {isArabic ? 'الوحدات المحجوزة' : 'Reserved Units'}
                </span>
                <span className="text-lg font-black text-accent font-mono block mt-0.5">
                  {totalReserved}
                </span>
                <span className="text-[9px] text-accent font-medium">
                  {isArabic ? 'قيد تحرير العقود' : 'in contracting'}
                </span>
              </div>

              <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3 text-center">
                <span className="text-[10px] text-purple-800 font-bold block">
                  {isArabic ? 'متوسط سعر المتر' : 'Avg Price per Sqm'}
                </span>
                <span className="text-lg font-black text-purple-900 font-mono block mt-0.5">
                  {formatNumber(weightedPriceMeter)}
                </span>
                <span className="text-[9px] text-purple-700 font-medium">
                  {isArabic ? 'ج.م / متر مربع' : 'EGP / m²'}
                </span>
              </div>
            </div>

            {/* Inventory Status Bar Visual */}
            <div className="mb-6 p-4 bg-surface border border-border rounded-xl">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-text">
                  {isArabic ? 'توزيع حالة المخزون العقاري:' : 'Inventory Status Breakdown:'}
                </span>
                <span className="text-text-muted font-mono">
                  {totalUnitsCount} {isArabic ? 'إجمالي الوحدات المسجلة' : 'Total Units'}
                </span>
              </div>

              <div className="w-full h-4 rounded-full overflow-hidden flex bg-surface-raised">
                <div 
                  style={{ width: `${(totalAvailable / (totalUnitsCount || 1)) * 100}%` }}
                  className="bg-emerald-500 h-full"
                  title={`Available: ${totalAvailable}`}
                />
                <div 
                  style={{ width: `${(totalReserved / (totalUnitsCount || 1)) * 100}%` }}
                  className="bg-accent h-full"
                  title={`Reserved: ${totalReserved}`}
                />
                <div 
                  style={{ width: `${(totalSold / (totalUnitsCount || 1)) * 100}%` }}
                  className="bg-blue-600 h-full"
                  title={`Sold: ${totalSold}`}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-[10px] text-text-muted">
                <span className="flex items-center gap-1 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  {isArabic ? `متاح للبيع (${totalAvailable})` : `Available (${totalAvailable})`}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
                  {isArabic ? `محجوز (${totalReserved})` : `Reserved (${totalReserved})`}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  {isArabic ? `مباع ومكتمل (${totalSold})` : `Sold (${totalSold})`}
                </span>
              </div>
            </div>

            {/* Detailed Compound Matrix Table */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                  {isArabic ? 'جدول أداء ومخزون الكمبوندات والمشاريع:' : 'Compound Inventory & Velocity Matrix:'}
                </h3>
                <span className="text-[10px] text-text-muted font-mono">
                  {compoundData.length} {isArabic ? 'مشروع مسجل' : 'projects'}
                </span>
              </div>

              <table className="w-full border-collapse text-xs border border-border">
                <thead>
                  <tr className="bg-surface-raised text-text text-[10px] uppercase font-bold border-b border-border">
                    <th className="p-2 text-right rtl:text-right ltr:text-left">{isArabic ? 'الكمبوند / المشروع' : 'Project'}</th>
                    <th className="p-2 text-center">{isArabic ? 'الإجمالي' : 'Total'}</th>
                    <th className="p-2 text-center text-emerald-800">{isArabic ? 'متاح' : 'Avail'}</th>
                    <th className="p-2 text-center text-accent">{isArabic ? 'محجوز' : 'Res'}</th>
                    <th className="p-2 text-center text-blue-800">{isArabic ? 'مباع' : 'Sold'}</th>
                    <th className="p-2 text-center">{isArabic ? 'متوسط المساحة' : 'Avg m²'}</th>
                    <th className="p-2 text-center">{isArabic ? 'سعر المتر' : 'Price/m²'}</th>
                    <th className="p-2 text-right rtl:text-left ltr:text-right">{isArabic ? 'القيمة الإجمالية' : 'Valuation'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text">
                  {compoundData.map((c, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-surface'}>
                      <td className="p-2 font-bold text-text text-right rtl:text-right ltr:text-left">
                        {c.compound}
                      </td>
                      <td className="p-2 text-center font-mono font-semibold">{c.totalUnits}</td>
                      <td className="p-2 text-center font-mono font-bold text-emerald-700">{c.available}</td>
                      <td className="p-2 text-center font-mono font-bold text-accent">{c.reserved}</td>
                      <td className="p-2 text-center font-mono font-bold text-blue-700">{c.sold}</td>
                      <td className="p-2 text-center font-mono text-text-muted">
                        {c.avgSize > 0 ? `${c.avgSize} م²` : '-'}
                      </td>
                      <td className="p-2 text-center font-mono font-semibold text-text">
                        {c.avgPriceMeter > 0 ? `${formatNumber(c.avgPriceMeter)} ج.م` : '-'}
                      </td>
                      <td className="p-2 text-right rtl:text-left ltr:text-right font-mono font-bold text-text">
                        {c.totalValueMillions} {isArabic ? 'مليون' : 'M'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Strategic Advice & Market Insights for Developers */}
            {includeStrategicAdvice && (
              <div className="mb-6 p-3.5 bg-accent border border-accent rounded-xl text-xs text-text">
                <div className="flex items-center gap-1.5 font-bold text-accent mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>{isArabic ? 'توصيات استشارية للمطورين العقاريين لزيادة سرعة البيع:' : 'Advisory Insights for Developers:'}</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-text pr-2">
                  <li>
                    {isArabic 
                      ? 'الطلب الأكبر في 6 أكتوبر يتركز على الشقق السكنية بمساحات 130 - 170 م² تسليم خلال 18 - 24 شهراً.'
                      : 'Highest demand in 6th of October is concentrated on 130-170 m² apartments with 18-24 months delivery.'}
                  </li>
                  <li>
                    {isArabic 
                      ? 'المشترون يفضلون خطط السداد المرنة (10% مقدم مع أقساط متساوية على 7 إلى 8 سنوات بدون فوائد).'
                      : 'Buyers favor flexible 7-8 year payment structures with 10% down payment.'}
                  </li>
                  <li>
                    {isArabic 
                      ? 'الطلب الاستثماري على الفيلات المستقلة والتاون هاوس في التوسعات الشمالية وبادية في تصاعد ملحوظ بنسبة 28%.'
                      : 'Stand-alone villas and townhouses in Northern Expansions and Badya show a 28% increase in demand.'}
                  </li>
                </ul>
              </div>
            )}

            {/* Signatures, Barcode & Endorsement Seal */}
            {includeOfficialSeal && (
              <div className="pt-6 border-t-2 border-border flex items-center justify-between gap-6 text-xs text-text">
                {/* Brokerage Official Stamp Seal */}
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-blue-800 p-1 flex items-center justify-center text-center">
                    <div className="w-full h-full rounded-full border border-blue-700 bg-blue-50/50 flex flex-col items-center justify-center p-1">
                      <span className="text-[8px] font-bold text-blue-900 leading-tight">عقارات 6 أكتوبر</span>
                      <ShieldCheck className="w-4 h-4 text-blue-800 my-0.5" />
                      <span className="text-[7px] text-blue-700 font-bold">معتمد رسمياً ✓</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-text block">
                      {isArabic ? 'خاتم الاعتماد والتوثيق' : 'Official Brokerage Seal'}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono block">
                      AUTH-ID: 6O-VERIFIED-2026
                    </span>
                  </div>
                </div>

                {/* Authorized Signatures */}
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="h-10 border-b border-border w-32 mb-1 flex items-end justify-center font-serif text-text-muted italic text-[11px]">
                      Yasser Sallam
                    </div>
                    <span className="text-[10px] font-bold text-text block">
                      {isArabic ? 'رئيس قطاع المبيعات والوساطة' : 'Head of Sales & Brokerage'}
                    </span>
                  </div>

                  <div className="text-center">
                    <div className="h-10 border-b border-border w-32 mb-1 flex items-end justify-center font-serif text-text-muted italic text-[11px]">
                      Finance Audit
                    </div>
                    <span className="text-[10px] font-bold text-text block">
                      {isArabic ? 'إدارة التدقيق والتحليل المالي' : 'Financial Audit & Valuation'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Disclaimer */}
            <div className="mt-6 pt-3 border-t border-border text-center text-[9px] text-text-muted">
              {isArabic 
                ? 'منصة شقق وعقارات 6 أكتوبر والشيخ زايد - جميع البيانات مستخرجة لحظياً من قاعدة بيانات المخزون المعتمدة ونظام CRM (سحابة Supabase).'
                : '6th of October & Sheikh Zayed Real Estate Platform - Data synchronized directly from certified inventory database (Supabase Cloud).'}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions (Hidden on print) */}
        <div className={`p-4 border-t flex items-center justify-between gap-4 print:hidden ${
          isDark ? 'bg-surface border-border' : 'bg-surface border-border'
        }`}>
          <div className="text-xs text-text-muted flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {isArabic 
                ? 'تلميح: عند الضغط على "طباعة وحفظ كملف PDF"، اختر "Save as PDF" من نافذة المتصفح.' 
                : 'Tip: Select "Save as PDF" in your browser print dialog to export the PDF file.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isArabic ? 'طباعة وحفظ كملف PDF' : 'Print / Save as PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface-raised hover:bg-surface-raised text-text text-xs font-bold transition cursor-pointer"
            >
              {isArabic ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
