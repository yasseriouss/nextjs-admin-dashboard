import { formatNumber } from '../i18n/format';
import React, { useState } from 'react';
import { Unit } from '../types';
import { Card, CardHeader, CardContent, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Globe, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Send, 
  Star, 
  Sliders, 
  Building2, 
  Save, 
  Sparkles
} from 'lucide-react';

interface LandingPageArticle {
  id: string;
  title: string;
  titleAr: string;
  category: 'Investment' | 'Market Trends' | 'Neighborhoods' | 'Guides';
  author: string;
  date: string;
  published: boolean;
  summary: string;
  summaryAr: string;
}

const INITIAL_ARTICLES: LandingPageArticle[] = [
  {
    id: 'art-1',
    title: 'Top 5 Compounds in 6th of October for High ROI in 2026',
    titleAr: 'أفضل 5 كمبوندات في مدينة 6 أكتوبر لتحقيق أعلى عائد استثماري',
    category: 'Investment',
    author: 'yasserious.com',
    date: '2026-10-01',
    published: true,
    summary: 'Comprehensive financial breakdown of rental yields and capital appreciation in Palm Hills, Mountain View, and Badya.',
    summaryAr: 'تحليل مالي شامل لعوائد الإيجار ونمو رأس المال في بالم هيلز، ماونتن فيو، وباديا.'
  },
  {
    id: 'art-2',
    title: 'Sheikh Zayed vs 6 October: Real Estate Investment Comparison',
    titleAr: 'مقارنة استثمارية بين عقارات الشيخ زايد ومدينة 6 أكتوبر',
    category: 'Market Trends',
    author: 'yasserious.com',
    date: '2026-09-24',
    published: true,
    summary: 'A detailed price-per-meter comparison and lifestyle infrastructure analysis for luxury buyers.',
    summaryAr: 'مقارنة تفصيلية لسعر المتر وتحليل البنية التحتية للمشترين والمستثمرين.'
  },
  {
    id: 'art-3',
    title: 'Smart Buyer Guide: Off-Plan vs Resale Units in West Cairo',
    titleAr: 'دليل المشتري الذكي: الفرق بين وحدات تحت الإنشاء وإعادة البيع',
    category: 'Guides',
    author: 'yasserious.com',
    date: '2026-09-15',
    published: true,
    summary: 'How to negotiate payment plans, review developer delivery track records, and ensure clear legal contracts.',
    summaryAr: 'كيف تفاوض على خطط السداد وتفحص سجل المطور العقاري وتضمن عقداً قانونياً سليماً.'
  }
];

interface LandingPageCmsProps {
  units: Unit[];
  isArabic: boolean;
  onUpdateUnit?: (unit: Unit) => void;
}

export const LandingPageCmsView: React.FC<LandingPageCmsProps> = ({
  units,
  isArabic
}) => {
  const [activeTab, setActiveTab] = useState<'featured-units' | 'articles' | 'hero-settings'>('featured-units');
  const [articles, setArticles] = useState<LandingPageArticle[]>(INITIAL_ARTICLES);
  const [featuredUnitIds, setFeaturedUnitIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('6O_LANDING_FEATURED_UNITS');
      return saved ? JSON.parse(saved) : units.slice(0, 6).map(u => u.id);
    } catch {
      return units.slice(0, 6).map(u => u.id);
    }
  });

  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTitleAr, setNewTitleAr] = useState('');
  const [newCategory, setNewCategory] = useState<LandingPageArticle['category']>('Investment');
  const [newSummary, setNewSummary] = useState('');
  const [newSummaryAr, setNewSummaryAr] = useState('');
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  // Hero section settings state
  const [heroTitle, setHeroTitle] = useState('Find Your Dream Home in 6th of October & Sheikh Zayed');
  const [heroTitleAr, setHeroTitleAr] = useState('ابحث عن عقارك المثالي في 6 أكتوبر والشيخ زايد');
  const [heroPhone, setHeroPhone] = useState('+20 12 7597 5141');
  const [heroWhatsApp, setHeroWhatsApp] = useState('https://wa.me/201275975141');

  const toggleFeaturedUnit = (unitId: string) => {
    setFeaturedUnitIds(prev => {
      const next = prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId];
      localStorage.setItem('6O_LANDING_FEATURED_UNITS', JSON.stringify(next));
      return next;
    });
  };

  const handlePublishAll = () => {
    // Save CMS sync data
    const payload = {
      featuredUnits: units.filter(u => featuredUnitIds.includes(u.id)),
      articles: articles.filter(a => a.published),
      hero: {
        title: heroTitle,
        titleAr: heroTitleAr,
        phone: heroPhone,
        whatsapp: heroWhatsApp
      },
      lastSyncedAt: new Date().toISOString(),
      publishedBy: 'yasserious.com'
    };
    localStorage.setItem('6O_LANDING_PAGE_CMS_STATE', JSON.stringify(payload));
    setSyncStatusMessage(isArabic ? 'تم نشر وتحديث بيانات الموقع الرئيسي بنجاح!' : 'Landing Page published successfully!');
    setTimeout(() => setSyncStatusMessage(null), 4000);
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newTitleAr.trim()) return;

    const newArt: LandingPageArticle = {
      id: `art-${Date.now()}`,
      title: newTitle.trim() || newTitleAr.trim(),
      titleAr: newTitleAr.trim() || newTitle.trim(),
      category: newCategory,
      author: 'yasserious.com',
      date: new Date().toISOString().slice(0, 10),
      published: true,
      summary: newSummary.trim() || newSummaryAr.trim(),
      summaryAr: newSummaryAr.trim() || newSummary.trim()
    };

    setArticles(prev => [newArt, ...prev]);
    setIsArticleModalOpen(false);
    setNewTitle('');
    setNewTitleAr('');
    setNewSummary('');
    setNewSummaryAr('');
  };

  const toggleArticlePublish = (articleId: string) => {
    setArticles(prev => prev.map(a => a.id === articleId ? { ...a, published: !a.published } : a));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-navy to-navy/80 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-gold/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-gold/20 text-gold border border-gold/40">
              <Globe className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {isArabic ? 'إدارة ونشر محتوى الموقع الرئيسي' : 'Landing Page CMS & Publisher'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-text-muted max-w-2xl">
            {isArabic 
              ? 'التحكم المركزي في الوحدات المعروضة، والمقالات، وبيانات التواصل على موقع الزوار الرئيسي.' 
              : 'Direct control over public listings, real estate blog articles, and landing page hero content.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handlePublishAll}
            className="bg-gold hover:bg-gold/80 text-navy font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isArabic ? 'نشر فوري للموقع' : 'Publish to Website'}</span>
          </Button>
          <a
            href="https://yasserious.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-gold hover:underline px-2 hidden md:inline-block"
          >
            Created by yasserious.com
          </a>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMessage && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs sm:text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{syncStatusMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-card-border pb-2">
        <button
          onClick={() => setActiveTab('featured-units')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeTab === 'featured-units' 
              ? 'bg-navy text-gold shadow-sm' 
              : 'text-text-secondary hover:text-text-primary hover:bg-background-gray-primary'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{isArabic ? 'الوحدات المميزة بالموقع' : 'Featured Units'}</span>
          <Badge className="ml-1.5 bg-gold/20 text-gold border-0 text-[10px]">
            {featuredUnitIds.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeTab === 'articles' 
              ? 'bg-navy text-gold shadow-sm' 
              : 'text-text-secondary hover:text-text-primary hover:bg-background-gray-primary'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isArabic ? 'المقالات والأخبار' : 'Articles & News'}</span>
          <Badge className="ml-1.5 bg-blue-500/20 text-blue-400 border-0 text-[10px]">
            {articles.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('hero-settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeTab === 'hero-settings' 
              ? 'bg-navy text-gold shadow-sm' 
              : 'text-text-secondary hover:text-text-primary hover:bg-background-gray-primary'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{isArabic ? 'إعدادات واجهة الموقع' : 'Hero & Contact Settings'}</span>
        </button>
      </div>

      {/* TAB 1: FEATURED UNITS SELECTION */}
      {activeTab === 'featured-units' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-text-primary">
                {isArabic ? 'اختر الوحدات المراد عرضها على الصفحة الرئيسية' : 'Select Units to Feature on the Landing Page'}
              </h3>
              <p className="text-xs text-text-tertiary">
                {isArabic ? 'الوحدات المحددة ستظهر فوراً للمشترين في قسم العقارات المميزة.' : 'Selected units appear on the public website homepage.'}
              </p>
            </div>
            <span className="text-xs font-medium text-text-tertiary">
              {featuredUnitIds.length} {isArabic ? 'وحدات محددة' : 'units selected'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map((unit) => {
              const isFeatured = featuredUnitIds.includes(unit.id);
              return (
                <Card 
                  key={unit.id}
                  className={`transition-all duration-200 border ${
                    isFeatured 
                      ? 'border-gold ring-1 ring-gold bg-accent-50/10 dark:bg-accent-900/10' 
                      : 'border-card-border hover:border-card-border-hover'
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-text-tertiary block">
                          {unit.id}
                        </span>
                        <h4 className="text-sm font-bold text-text-primary line-clamp-1">
                          {unit.compound}
                        </h4>
                        <p className="text-xs text-text-secondary">
                          {unit.unitType} • {unit.area} m²
                        </p>
                      </div>

                      <button
                        onClick={() => toggleFeaturedUnit(unit.id)}
                        className={`size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isFeatured 
                            ? 'bg-gold text-navy shadow-sm' 
                            : 'bg-background-gray-primary text-text-tertiary hover:text-text-primary'
                        }`}
                        title={isFeatured ? 'Remove from Landing Page' : 'Feature on Landing Page'}
                      >
                        <Star className={`w-4 h-4 ${isFeatured ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-card-border">
                      <span className="font-bold text-gold">
                        {formatNumber(unit.price)} {unit.currency || 'EGP'}
                      </span>
                      <Badge className={
                        unit.status === 'Available' ? 'bg-emerald-500/15 text-emerald-400 border-0' :
                        unit.status === 'Reserved' ? 'bg-accent text-accent border-0' :
                        'bg-blue-500/15 text-blue-400 border-0'
                      }>
                        {unit.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ARTICLES & NEWS MANAGER */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-text-primary">
                {isArabic ? 'مقالات وأخبار العقارات المعروضة بالموقع' : 'Real Estate Articles & Market Reports'}
              </h3>
              <p className="text-xs text-text-tertiary">
                {isArabic ? 'إضافة وتعديل مقالات السوق العقاري لتعزيز الظهور وجذب العملاء.' : 'Manage published content for real estate SEO and buyer education.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/articles"
                className="bg-gold/15 hover:bg-gold/25 text-gold border border-gold/30 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isArabic ? 'استوديو المقالات المتقدم (AI)' : 'Advanced Article Studio (AI)'}</span>
              </a>
              <Button
                onClick={() => setIsArticleModalOpen(true)}
                className="bg-navy hover:bg-navy/80 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-gold" />
                <span>{isArabic ? 'إضافة مقال جديد' : '+ New Article'}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {articles.map((art) => (
              <Card key={art.id} className="border border-card-border hover:border-card-border-hover transition">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gold/15 text-gold border-0 text-[11px]">
                        {art.category}
                      </Badge>
                      <span className="text-[11px] text-text-tertiary">{art.date}</span>
                      <span className="text-[11px] text-text-tertiary">• {art.author}</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-text-primary">
                      {isArabic ? art.titleAr : art.title}
                    </h4>
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {isArabic ? art.summaryAr : art.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={() => toggleArticlePublish(art.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition ${
                        art.published 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-surface-raised text-text-muted hover:text-white'
                      }`}
                    >
                      {art.published ? (isArabic ? 'منشور ✓' : 'Published ✓') : (isArabic ? 'مسودة' : 'Draft')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* New Article Modal */}
          {isArticleModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-card-surface-area border border-card-border rounded-2xl w-full max-w-xl p-5 sm:p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-card-border pb-3">
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span>{isArabic ? 'إنشاء مقال جديد للموقع' : 'Create New Landing Page Article'}</span>
                  </h3>
                  <button 
                    onClick={() => setIsArticleModalOpen(false)}
                    className="text-text-tertiary hover:text-text-primary text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateArticle} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-text-secondary mb-1">
                      {isArabic ? 'العنوان بالإنجليزية' : 'Title (English)'}
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g. Investment Guide to October Gardens"
                      className="w-full bg-background-gray-primary border border-input rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-text-secondary mb-1">
                      {isArabic ? 'العنوان بالعربية' : 'Title (Arabic)'}
                    </label>
                    <input
                      type="text"
                      value={newTitleAr}
                      onChange={e => setNewTitleAr(e.target.value)}
                      placeholder="مثال: دليل الاستثمار في حدائق أكتوبر 2026"
                      className="w-full bg-background-gray-primary border border-input rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-text-secondary mb-1">
                      {isArabic ? 'التصنيف' : 'Category'}
                    </label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as any)}
                      className="w-full bg-background-gray-primary border border-input rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
                    >
                      <option value="Investment">Investment</option>
                      <option value="Market Trends">Market Trends</option>
                      <option value="Neighborhoods">Neighborhoods</option>
                      <option value="Guides">Guides</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-text-secondary mb-1">
                      {isArabic ? 'ملخص المقال (إنجليزي)' : 'Summary (English)'}
                    </label>
                    <textarea
                      rows={2}
                      value={newSummary}
                      onChange={e => setNewSummary(e.target.value)}
                      placeholder="Brief excerpt for card display..."
                      className="w-full bg-background-gray-primary border border-input rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-text-secondary mb-1">
                      {isArabic ? 'ملخص المقال (عربي)' : 'Summary (Arabic)'}
                    </label>
                    <textarea
                      rows={2}
                      value={newSummaryAr}
                      onChange={e => setNewSummaryAr(e.target.value)}
                      placeholder="موجز المقال للعرض في الموقع..."
                      className="w-full bg-background-gray-primary border border-input rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-card-border">
                    <button
                      type="button"
                      onClick={() => setIsArticleModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-text-secondary hover:text-text-primary font-medium"
                    >
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                    <Button
                      type="submit"
                      className="bg-navy hover:bg-navy/80 text-gold font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer"
                    >
                      {isArabic ? 'حفظ المقال' : 'Save & Publish'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HERO & CONTACT SETTINGS */}
      {activeTab === 'hero-settings' && (
        <Card className="border border-card-border">
          <CardHeader>
            <CardTitle className="text-base font-bold text-text-primary">
              {isArabic ? 'إعدادات واجهة الموقع والاتصال السريع' : 'Landing Page Hero & Quick Contact Config'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-text-secondary mb-1">
                  {isArabic ? 'العنوان الترويجي الرئيسي (إنجليزي)' : 'Hero Main Headline (EN)'}
                </label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={e => setHeroTitle(e.target.value)}
                  className="w-full bg-background-gray-primary border border-input rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-secondary mb-1">
                  {isArabic ? 'العنوان الترويجي الرئيسي (عربي)' : 'Hero Main Headline (AR)'}
                </label>
                <input
                  type="text"
                  value={heroTitleAr}
                  onChange={e => setHeroTitleAr(e.target.value)}
                  className="w-full bg-background-gray-primary border border-input rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-secondary mb-1">
                  {isArabic ? 'رقم الهاتف المباشر للاتصال' : 'Direct Phone Contact'}
                </label>
                <input
                  type="text"
                  value={heroPhone}
                  onChange={e => setHeroPhone(e.target.value)}
                  className="w-full bg-background-gray-primary border border-input rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-secondary mb-1">
                  {isArabic ? 'رابط الواتساب المباشر' : 'Direct WhatsApp Link'}
                </label>
                <input
                  type="text"
                  value={heroWhatsApp}
                  onChange={e => setHeroWhatsApp(e.target.value)}
                  className="w-full bg-background-gray-primary border border-input rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-card-border flex items-center justify-between">
              <span className="text-[11px] text-text-tertiary">
                {isArabic ? 'تم تصميم النظام والتطوير بواسطة yasserious.com' : 'Engineered by yasserious.com'}
              </span>
              <Button
                onClick={handlePublishAll}
                className="bg-navy hover:bg-navy/80 text-gold font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{isArabic ? 'حفظ ونشر التعديلات' : 'Save & Publish Config'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LandingPageCmsView;
