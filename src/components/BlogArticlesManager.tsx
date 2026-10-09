import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  FileText,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Search,
  Trash2,
  Edit3,
  Globe,
  Tag,
  TrendingUp,
  BookOpen,
  ExternalLink,
  Save,
  FolderOpen
} from 'lucide-react';

export type ArticleStatus = 'draft' | 'published' | 'scheduled';

export type ArticleCategory = 'Investment' | 'Market Trends' | 'Neighborhoods' | 'Guides' | 'Tips';

export interface DashboardArticle {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  category: ArticleCategory;
  author: string;
  date: string;
  status: ArticleStatus;
  scheduledPublishDate?: string;
  summary: string;
  summaryAr: string;
  content: string;
  contentAr: string;
  coverImage?: string;
  tags: string[];
  seoTitle?: string;
  seoTitleAr?: string;
  seoDesc?: string;
  seoDescAr?: string;
  seoKeywords?: string[];
  readTimeMinutes: number;
  viewsCount?: number;
}

const INITIAL_ARTICLES: DashboardArticle[] = [
  {
    id: 'art-1',
    slug: 'top-5-compounds-6th-october-roi-2026',
    title: 'Top 5 Compounds in 6th of October for High ROI in 2026',
    titleAr: 'أفضل 5 كمبوندات في مدينة 6 أكتوبر لتحقيق أعلى عائد استثماري في 2026',
    category: 'Investment',
    author: 'yasserious.com',
    date: '2026-10-01',
    status: 'published',
    summary: 'Comprehensive financial breakdown of rental yields and capital appreciation in Palm Hills, Mountain View, and Badya.',
    summaryAr: 'تحليل مالي شامل لعوائد الإيجار ونمو رأس المال في كمبوندات بالم هيلز، ماونتن فيو، وباديا بالمقارنة مع التضخم الحالي.',
    content: `## Executive Overview

The 6th of October real estate sector is witnessing unprecedented growth, driven by prime infrastructure expansions and rising institutional demand.

### 1. Palm Hills October
Consistently delivers an 8.5% net annual rental yield with top-tier community facilities and established commercial hubs.

### 2. Mountain View iCity
Renowned for innovative 4D master planning and high liquidity in secondary market sales.

### 3. Badya Palm Hills
The premier smart-city development offering extended 10-year flexible payment terms.`,
    contentAr: `## نظرة تنفيذية شاملة

يشهد سوق العقارات في مدينة 6 أكتوبر طفرة استثمارية غير مسبوقة مدعومة بتوسعات الطرق ومحاور الربط السريع مثل المونوريل والقطار السريع.

### 1. بالم هيلز أكتوبر
يحقق متوسط عائد إيجاري سنوي يبلغ 8.5% مع طلب مرتفع وثابت من العائلات والمستثمرين.

### 2. ماونتن فيو آي سيتي
يمتاز بالمخططات الذكية والمساحات الخضراء المنفصلة وحركة تداول سريعة في سوق إعادة البيع (Resale).

### 3. باديا بالم هيلز
مدينة المستقبل الذكية في أكتوبر الجديدة مع خطط سداد ممتدة تصل إلى 10 سنوات تضمن تخفيف الأعباء المالية.`,
    coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    tags: ['6 أكتوبر', 'استثمار عقاري', 'بالم هيلز', 'ماونتن فيو', 'عائد إيجاري'],
    seoTitle: 'Top 5 High ROI Compounds in 6th of October 2026',
    seoTitleAr: 'أفضل 5 كمبوندات في 6 أكتوبر لتحقيق أعلى عائد استثماري 2026',
    seoDesc: 'Discover the most profitable residential compounds in 6th of October for rental yields and capital growth.',
    seoDescAr: 'دليل المستثمر لأكثر الكمبوندات ربحية في مدينة 6 أكتوبر لعام 2026 مع مقارنة الأسعار والعوائد.',
    seoKeywords: ['عقارات 6 أكتوبر', 'استثمار زايد وأكتوبر', 'كمبوندات أكتوبر'],
    readTimeMinutes: 4,
    viewsCount: 1420
  },
  {
    id: 'art-2',
    slug: 'sheikh-zayed-vs-6-october-comparison',
    title: 'Sheikh Zayed vs 6 October: Real Estate Investment Comparison',
    titleAr: 'مقارنة استثمارية دقيقة بين عقارات الشيخ زايد ومدينة 6 أكتوبر',
    category: 'Market Trends',
    author: 'yasserious.com',
    date: '2026-09-24',
    status: 'published',
    summary: 'A detailed price-per-meter comparison and lifestyle infrastructure analysis for luxury buyers.',
    summaryAr: 'مقارنة تفصيلية لسعر المتر المربع ونمط الحياة والبنية التحتية لتوجيه قرارات المشترين والمستثمرين.',
    content: `## Location Dynamics: Zayed vs October

While Sheikh Zayed caters to established boutique luxury and higher entry prices, 6th of October provides expansive land banks and superior capital appreciation potential.`,
    contentAr: `## محددات المقارنة بين زايد وأكتوبر

تتميز الشيخ زايد بكونها وجهة مكتملة الخدمات للباحثين عن الرفاهية المباشرة مع أسعار دخول أعلى للمتر المربع، بينما توفر مدينة 6 أكتوبر فرص نمو رأسمالي أكبر بفضل الرقع العمرانية الواسعة ومشاريع الجيل الرابع.`,
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    tags: ['الشيخ زايد', '6 أكتوبر', 'مقارنة عقارية', 'سعر المتر'],
    seoTitle: 'Sheikh Zayed vs 6 October: Which is Better for Investment?',
    seoTitleAr: 'الشيخ زايد أم 6 أكتوبر: أيهما أفضل للاستثمار العقاري؟',
    seoDesc: 'Comprehensive real estate comparison between Sheikh Zayed and 6th of October prices and lifestyle.',
    seoDescAr: 'مقارنة تحليلية شاملة للأسعار والعوائد بين زايد وأكتوبر لمساعدة المشتري والمستثمر.',
    seoKeywords: ['الشيخ زايد', 'مدينة 6 أكتوبر', 'مقارنة أسعار العقارات'],
    readTimeMinutes: 3,
    viewsCount: 980
  },
  {
    id: 'art-3',
    slug: 'off-plan-vs-resale-guide-west-cairo',
    title: 'Smart Buyer Guide: Off-Plan vs Resale Units in West Cairo',
    titleAr: 'دليل المشتري الذكي: الفرق بين وحدات تحت الإنشاء وإعادة البيع في غرب القاهرة',
    category: 'Guides',
    author: 'yasserious.com',
    date: '2026-09-15',
    status: 'scheduled',
    scheduledPublishDate: '2026-10-15T10:00',
    summary: 'How to negotiate payment plans, review developer delivery track records, and ensure clear legal contracts.',
    summaryAr: 'كيف تفاوض على خطط السداد وتفحص سجل تسليم المطور وتضمن عقداً قانونياً سليماً وموثقاً.',
    content: `## Off-Plan vs Resale Advantages

1. **Off-Plan (Under Construction):** Lower initial cash commitment, long installment horizons up to 8-10 years.
2. **Resale (Immediate Delivery):** Zero delivery risk, immediate rental generation, but requires higher cash up front.`,
    contentAr: `## مزايا وخيارات الشراء

1. **تحت الإنشاء (Off-Plan):** سيولة نقدية أولى منخفضة، وأقساط طويلة تمتد حتى 8 و10 سنوات.
2. **إعادة البيع (Resale):** انعدام مخاطر تأخر التسليم، وتشغيل فوري للإيجار، ولكن تتطلب دفعة نقدية كاش أعلى.`,
    coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
    tags: ['دليل المشتري', 'وحدات ريسيل', 'أوف بلان', 'نصائح عقارية'],
    seoTitle: 'Off-Plan vs Resale Real Estate in West Cairo',
    seoTitleAr: 'دليل شراء العقارات تحت الإنشاء وإعادة البيع في غرب القاهرة',
    seoDesc: 'Learn the financial pros and cons of buying resale vs off-plan properties in Egypt.',
    seoDescAr: 'تعرف على الفرق القانوني والمالي بين شراء وحدة تحت الإنشاء أو استلام فوري في مصر.',
    seoKeywords: ['ريسيل عقارات', 'شراء شقة بالتقسيط', 'عقود العقارات'],
    readTimeMinutes: 5,
    viewsCount: 350
  },
  {
    id: 'art-4',
    slug: 'october-market-price-guide-q4',
    title: 'Q4 2026 Price Index: Residential Units in West Cairo Hubs',
    titleAr: 'مؤشر أسعار الربع الرابع 2026: دليل الشقق والفلل في محاور غرب القاهرة',
    category: 'Market Trends',
    author: 'yasserious.com',
    date: '2026-10-02',
    status: 'draft',
    summary: 'Current market rates across El Motamayez, El Ashgar, and expansions with price trajectory forecasts.',
    summaryAr: 'رصد فوري لمتوسط أسعار الشقق والفيلات في الحي المتميز وحي الأشجار ومناطق التوسعات الشرقية والشمالية.',
    content: `Quarterly price index reviewing real transaction values in 6th of October residential zones.`,
    contentAr: `تقرير ربع سنوي يرصد أسعار الصفقات الفعلية في مناطق الحي المتميز والوصلات الحيوية لمدينة السادس من أكتوبر.`,
    coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    tags: ['مؤشر الأسعار', 'الحي المتميز', 'حي الأشجار', 'أسعار أكتوبر'],
    seoTitle: '6th of October Price Index Q4 2026',
    seoTitleAr: 'مؤشر أسعار عقارات 6 أكتوبر الربع الرابع 2026',
    seoDesc: 'Explore current real estate price per meter in 6th of October and Sheikh Zayed.',
    seoDescAr: 'استكشف متوسط سعر المتر للشقق والفيلات في أهم أحياء مدينة 6 أكتوبر.',
    seoKeywords: ['أسعار شقق 6 أكتوبر', 'الحي المتميز', 'عقارات مصر'],
    readTimeMinutes: 3,
    viewsCount: 110
  }
];

const CATEGORIES: ArticleCategory[] = [
  'Investment',
  'Market Trends',
  'Neighborhoods',
  'Guides',
  'Tips'
];

interface BlogArticlesManagerProps {
  isArabic: boolean;
}

export const BlogArticlesManager: React.FC<BlogArticlesManagerProps> = ({ isArabic }) => {
  const [articles, setArticles] = useState<DashboardArticle[]>(() => {
    try {
      const saved = localStorage.getItem('6O_LANDING_ARTICLES');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_ARTICLES;
    } catch {
      return INITIAL_ARTICLES;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ArticleStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Active Article Editor State
  const [editingArticle, setEditingArticle] = useState<DashboardArticle | null>(null);
  const [isNewArticleModalOpen, setIsNewArticleModalOpen] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<'content' | 'ai' | 'seo' | 'preview'>('content');
  const [previewLanguage, setPreviewLanguage] = useState<'ar' | 'en'>(isArabic ? 'ar' : 'en');
  const [notificationToast, setNotificationToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Sync state to localStorage whenever articles array updates
  const persistArticles = (updated: DashboardArticle[]) => {
    setArticles(updated);
    try {
      localStorage.setItem('6O_LANDING_ARTICLES', JSON.stringify(updated));
    } catch {
      // safe fallback
    }
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotificationToast({ message, type });
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = articles.length;
    const published = articles.filter(a => a.status === 'published').length;
    const draft = articles.filter(a => a.status === 'draft').length;
    const scheduled = articles.filter(a => a.status === 'scheduled').length;
    const totalViews = articles.reduce((sum, a) => sum + (a.viewsCount || 0), 0);
    return { total, published, draft, scheduled, totalViews };
  }, [articles]);

  // Filtered List
  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.titleAr.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.summaryAr.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q));

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [articles, statusFilter, categoryFilter, searchQuery]);

  // New Article Template
  const handleOpenNewArticle = () => {
    const today = new Date().toISOString().slice(0, 10);
    const newArt: DashboardArticle = {
      id: `art-${Date.now().toString(36)}`,
      slug: `new-article-${Date.now().toString(36).slice(-4)}`,
      title: 'New Real Estate Article Title',
      titleAr: 'عنوان المقال العقاري الجديد',
      category: 'Investment',
      author: 'yasserious.com',
      date: today,
      status: 'draft',
      summary: 'Brief executive summary explaining the main value proposition and investment context.',
      summaryAr: 'ملخص تنفيذي موجز يوضح محاور المقال وأهم النقاط الاستثمارية للمشتري والمستثمر.',
      content: 'Write your comprehensive article content in English here...',
      contentAr: 'اكتب محتوى المقال الشامل باللغة العربية هنا بتفاصيل دقيقة وجذابة...',
      coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      tags: ['عقارات 6 أكتوبر', 'الشيخ زايد', 'استثمار'],
      seoTitle: 'New Real Estate Insights | 6 October',
      seoTitleAr: 'رؤى وتحليلات عقارية جديدة | 6 أكتوبر',
      seoDesc: 'Comprehensive guide and market insights on West Cairo real estate properties.',
      seoDescAr: 'دليل وتحليلات شاملة حول عقارات غرب القاهرة ومدينة 6 أكتوبر والشيخ زايد.',
      seoKeywords: ['عقارات', '6 أكتوبر', 'استثمار'],
      readTimeMinutes: 3,
      viewsCount: 0
    };
    setEditingArticle(newArt);
    setActiveEditorTab('content');
    setIsNewArticleModalOpen(true);
  };

  const handleOpenEditArticle = (art: DashboardArticle) => {
    setEditingArticle({ ...art });
    setActiveEditorTab('content');
    setIsNewArticleModalOpen(true);
  };

  const handleSaveArticle = () => {
    if (!editingArticle) return;
    const exists = articles.some(a => a.id === editingArticle.id);
    let updated: DashboardArticle[];
    if (exists) {
      updated = articles.map(a => a.id === editingArticle.id ? editingArticle : a);
    } else {
      updated = [editingArticle, ...articles];
    }
    persistArticles(updated);
    setIsNewArticleModalOpen(false);
    showToast(isArabic ? 'تم حفظ وتحديث المقال بنجاح!' : 'Article saved successfully!');
  };

  const handleDeleteArticle = (id: string) => {
    const target = articles.find(a => a.id === id);
    const confirmMsg = isArabic
      ? `هل أنت متأكد من حذف مقال "${target?.titleAr || target?.title}"؟`
      : `Are you sure you want to delete "${target?.title}"?`;
    if (window.confirm(confirmMsg)) {
      const updated = articles.filter(a => a.id !== id);
      persistArticles(updated);
      showToast(isArabic ? 'تم حذف المقال بنجاح' : 'Article deleted', 'info');
    }
  };

  const handleQuickStatusChange = (id: string, newStatus: ArticleStatus) => {
    const updated = articles.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: newStatus,
          date: newStatus === 'published' ? new Date().toISOString().slice(0, 10) : a.date
        };
      }
      return a;
    });
    persistArticles(updated);
    const label = newStatus === 'published'
      ? (isArabic ? 'تم نشر المقال فوراً' : 'Article published live')
      : newStatus === 'draft'
      ? (isArabic ? 'تم تحويل المقال إلى مسودة' : 'Moved to drafts')
      : (isArabic ? 'تمت جدولة المقال' : 'Article scheduled');
    showToast(label);
  };

  // AI Content Enhancements
  const handleAIEnhanceTone = () => {
    if (!editingArticle) return;
    const enhancedAr = `${editingArticle.contentAr}\n\n💡 **توصية خبراء 6o للعقارات:** يُنصح المستثمرون بمراجعة جدول التدفقات النقدية وخطة السداد مع التركيز على المطورين ذوي السجل التشغيلي الموثوق لتحقيق أفضل عائد رأسمالي مركب.`;
    const enhancedEn = `${editingArticle.content}\n\n💡 **6o Real Estate Advisory:** Buyers and investors are encouraged to verify developer execution track records and structure installment schedules aligning with projected capital appreciation cycles.`;
    
    setEditingArticle({
      ...editingArticle,
      contentAr: enhancedAr,
      content: enhancedEn,
      readTimeMinutes: Math.max(editingArticle.readTimeMinutes, 4)
    });
    showToast(isArabic ? 'تمت صياغة وتحسين نبرة المحتوى بواسطة الذكاء الاصطناعي!' : 'Content enhanced with professional real estate tone!');
  };

  const handleAIGenerateHeadlines = () => {
    if (!editingArticle) return;
    const cat = editingArticle.category;
    let headlineAr = '';
    let headlineEn = '';
    if (cat === 'Investment') {
      headlineAr = 'الدليل الاستثماري الشامل: كيف تختار وحدتك المثالية بأعلى عائد في 6 أكتوبر؟';
      headlineEn = 'The Ultimate Investment Roadmap: Maximizing Capital ROI in 6th of October';
    } else if (cat === 'Market Trends') {
      headlineAr = 'تحولات السوق العقاري 2026: قراءة تحليلية في الأسعار وفرص التملك في غرب القاهرة';
      headlineEn = '2026 Real Estate Shifts: Strategic Pricing & Ownership Horizons in West Cairo';
    } else {
      headlineAr = 'دليل المشتري الذكي لعام 2026: أسرار الشراء الآمن والتقسيط الميسر في زايد وأكتوبر';
      headlineEn = 'Smart Buyer Field Guide 2026: Safe Contracts & Flexible Installments in Zayed';
    }

    setEditingArticle({
      ...editingArticle,
      titleAr: headlineAr,
      title: headlineEn
    });
    showToast(isArabic ? 'تم توليد وتطبيق عنوان تسويقي جذاب!' : 'High-impact headline applied!');
  };

  const handleAIGenerateSummary = () => {
    if (!editingArticle) return;
    const summaryAr = `تحليل شامل يبرز أهم الفرص في ${editingArticle.category === 'Investment' ? 'العوائد الاستثمارية' : 'المؤشرات العقارية'} بمدينة 6 أكتوبر والشيخ زايد مع نصائح قانونية ومالية للمشترين.`;
    const summaryEn = `Comprehensive analysis examining high-value ${editingArticle.category.toLowerCase()} dynamics across 6th of October and Sheikh Zayed with strategic tips for buyers.`;
    
    setEditingArticle({
      ...editingArticle,
      summaryAr,
      summary: summaryEn
    });
    showToast(isArabic ? 'تم توليد الملخص التنفيذي بنجاح!' : 'Executive summary generated!');
  };

  const handleAIOptimizeSEO = () => {
    if (!editingArticle) return;
    const baseSlug = editingArticle.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const seoTitleAr = `${editingArticle.titleAr.slice(0, 50)} | عقارات 6 أكتوبر`;
    const seoTitle = `${editingArticle.title.slice(0, 50)} | 6 October Real Estate`;
    const seoDescAr = editingArticle.summaryAr.slice(0, 155);
    const seoDesc = editingArticle.summary.slice(0, 155);

    setEditingArticle({
      ...editingArticle,
      slug: baseSlug || editingArticle.slug,
      seoTitleAr,
      seoTitle,
      seoDescAr,
      seoDesc,
      seoKeywords: ['عقارات 6 أكتوبر', 'شقق للبيع', 'الشيخ زايد', 'استثمار عقاري مصر']
    });
    showToast(isArabic ? 'تم تحسين بيانات السيو (SEO) والكلمات المفتاحية!' : 'SEO metadata optimized!');
  };

  return (
    <div className="space-y-6" data-testid="view-articles">
      {/* Toast alert */}
      {notificationToast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border border-border shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold text-foreground">{notificationToast.message}</span>
        </div>
      )}

      {/* Main Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                {isArabic ? 'استوديو إدارة المقالات والمدونة' : 'Blog & Articles Studio'}
                <Badge variant="accent" className="text-xs bg-gold/10 text-gold border-gold/30">
                  {isArabic ? 'محرر ذكي متقدم' : 'AI Content Editor'}
                </Badge>
              </h1>
              <p className="text-sm text-text-muted">
                {isArabic
                  ? 'إنشاء وتعديل وتحسين مقالات الموقع مع دعم النشر الفوري، المسودات، والجدولة الزمنية'
                  : 'Create, refine, and publish bilingual real estate articles with draft, instant publish, and scheduled release workflows'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={`${(typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_LANDING_PAGE_URL : undefined) || 'https://6o-real-estate.vercel.app'}/${isArabic ? 'ar' : 'en'}/articles`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-secondary/70 hover:bg-secondary text-xs font-semibold text-foreground transition hover:border-gold/50 cursor-pointer"
            title={isArabic ? 'مشاهدة صفحة المقالات على الموقع المباشر' : 'View Articles on Live Website'}
          >
            <Globe className="w-4 h-4 text-gold" />
            <span>{isArabic ? 'صفحة المقالات الحية' : 'Live Website Feed'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
          </a>

          <Button
            onClick={handleOpenNewArticle}
            className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-bold px-4 py-2 rounded-xl transition shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isArabic ? 'كتابة مقال جديد' : 'New Article'}</span>
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-text-muted">{isArabic ? 'إجمالي المقالات' : 'Total Articles'}</div>
            <div className="text-2xl font-bold text-foreground mt-0.5">{metrics.total}</div>
          </div>
          <div className="p-2 rounded-lg bg-secondary text-foreground">
            <BookOpen className="w-5 h-5 text-gold" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-text-muted">{isArabic ? 'منشور على الموقع' : 'Published Live'}</div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{metrics.published}</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-text-muted">{isArabic ? 'مسودات قيد الإعداد' : 'Drafts in Progress'}</div>
            <div className="text-2xl font-bold text-gold mt-0.5">{metrics.draft}</div>
          </div>
          <div className="p-2 rounded-lg bg-gold/10 text-gold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-text-muted">{isArabic ? 'مجدول للنشر' : 'Scheduled Release'}</div>
            <div className="text-2xl font-bold text-indigo-400 mt-0.5">{metrics.scheduled}</div>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card/40">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-gold text-navy font-bold'
                : 'bg-secondary/70 text-text-muted hover:text-foreground'
            }`}
          >
            {isArabic ? 'الكل' : 'All'} ({metrics.total})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === 'published'
                ? 'bg-emerald-500 text-white font-bold'
                : 'bg-secondary/70 text-text-muted hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isArabic ? 'منشور' : 'Published'}</span>
            <span className="opacity-80">({metrics.published})</span>
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === 'draft'
                ? 'bg-gold text-navy font-bold'
                : 'bg-secondary/70 text-text-muted hover:text-gold'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isArabic ? 'مسودات' : 'Drafts'}</span>
            <span className="opacity-80">({metrics.draft})</span>
          </button>
          <button
            onClick={() => setStatusFilter('scheduled')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === 'scheduled'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-secondary/70 text-text-muted hover:text-indigo-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isArabic ? 'مجدول' : 'Scheduled'}</span>
            <span className="opacity-80">({metrics.scheduled})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-secondary text-xs text-foreground focus:outline-hidden focus:border-gold/50 cursor-pointer"
          >
            <option value="all">{isArabic ? 'جميع التصنيفات' : 'All Categories'}</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-text-muted absolute right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isArabic ? 'بحث في المقالات والعناوين...' : 'Search articles & tags...'}
              className="w-full text-xs rounded-xl border border-border bg-secondary py-1.5 rtl:pr-8 rtl:pl-3 ltr:pl-8 ltr:pr-3 text-foreground placeholder:text-text-muted focus:outline-hidden focus:border-gold/50"
            />
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card/20 space-y-3">
          <FolderOpen className="w-10 h-10 text-text-muted mx-auto opacity-50" />
          <h3 className="text-base font-bold text-foreground">
            {isArabic ? 'لا توجد مقالات مطابقة لمعايير البحث' : 'No articles match your filter criteria'}
          </h3>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            {isArabic
              ? 'يمكنك تغيير خيارات التصفية أو إنشاء مقال جديد الآن ونشره مباشرة على الموقع'
              : 'Try clearing your filters or create a new article to get started.'}
          </p>
          <Button onClick={handleOpenNewArticle} className="bg-gold hover:bg-gold-light text-navy text-xs font-bold mt-2">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {isArabic ? 'إنشاء مقال جديد' : 'Create Article'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((article) => {
            const isPub = article.status === 'published';
            const isDraft = article.status === 'draft';
            const isSched = article.status === 'scheduled';

            return (
              <div
                key={article.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-gold/40 transition shadow-xs hover:shadow-lg overflow-hidden"
              >
                {/* Image & Badges */}
                <div className="relative h-44 w-full bg-secondary overflow-hidden">
                  {article.coverImage ? (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/80 text-text-muted">
                      <BookOpen className="w-10 h-10 opacity-30" />
                    </div>
                  )}

                  {/* Status Overlay Badge */}
                  <div className="absolute top-3 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto flex items-center gap-1.5">
                    {isPub && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-md shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        {isArabic ? 'منشور مباشر' : 'Live'}
                      </span>
                    )}
                    {isDraft && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gold/90 text-navy backdrop-blur-md shadow-xs">
                        <FileText className="w-3 h-3" />
                        {isArabic ? 'مسودة' : 'Draft'}
                      </span>
                    )}
                    {isSched && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600/90 text-white backdrop-blur-md shadow-xs">
                        <Calendar className="w-3 h-3" />
                        {isArabic ? 'مجدول' : 'Scheduled'}
                      </span>
                    )}
                  </div>

                  {/* Category Chip */}
                  <div className="absolute bottom-3 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-navy/80 text-gold border border-gold/30 backdrop-blur-md">
                      {article.category}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readTimeMinutes} {isArabic ? 'دقائق قراءة' : 'min read'}
                      </span>
                      <span>
                        {isSched && article.scheduledPublishDate
                          ? (isArabic ? `تاريخ الجدولة: ${article.scheduledPublishDate.replace('T', ' ')}` : `Sched: ${article.scheduledPublishDate.replace('T', ' ')}`)
                          : article.date}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-gold transition line-clamp-2">
                      {isArabic ? article.titleAr : article.title}
                    </h3>

                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {isArabic ? article.summaryAr : article.summary}
                    </p>
                  </div>

                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {article.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-text-muted">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    {/* Quick status dropdown / toggle */}
                    <div className="flex items-center gap-1">
                      {isPub ? (
                        <button
                          onClick={() => handleQuickStatusChange(article.id, 'draft')}
                          title={isArabic ? 'تحويل إلى مسودة' : 'Move to Draft'}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold text-text-muted hover:text-gold hover:bg-gold/10 transition cursor-pointer"
                        >
                          {isArabic ? 'إلغاء النشر' : 'Unpublish'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuickStatusChange(article.id, 'published')}
                          title={isArabic ? 'نشر فوري الآن' : 'Publish immediately'}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/15 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isArabic ? 'نشر الآن' : 'Publish'}</span>
                        </button>
                      )}

                      {!isSched && (
                        <button
                          onClick={() => {
                            setEditingArticle({ ...article, status: 'scheduled' });
                            setActiveEditorTab('content');
                            setIsNewArticleModalOpen(true);
                          }}
                          title={isArabic ? 'جدولة النشر' : 'Schedule publication'}
                          className="p-1 rounded-lg text-text-muted hover:text-indigo-400 hover:bg-indigo-500/10 transition cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteArticle(article.id)}
                        className="p-1.5 h-auto text-text-muted hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title={isArabic ? 'حذف المقال' : 'Delete article'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleOpenEditArticle(article)}
                        className="bg-secondary hover:bg-gold hover:text-navy text-foreground text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        <span>{isArabic ? 'تعديل وتحسين' : 'Edit & Polish'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Article Studio / Editor Modal */}
      {isNewArticleModalOpen && editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-navy/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between gap-4 bg-secondary/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {isArabic ? 'محرر ومحسن المقالات الذكي' : 'Article Studio & AI Enhancer'}
                  </h2>
                  <p className="text-xs text-text-muted">
                    {isArabic
                      ? 'صياغة المحتوى، ضبط السيو، وتحديد موعد النشر أو الحفظ كمسودة'
                      : 'Polish real estate copy, configure SEO metadata, and schedule or publish'}
                  </p>
                </div>
              </div>

              {/* Status Selector Bar */}
              <div className="flex items-center gap-2 bg-secondary p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setEditingArticle({ ...editingArticle, status: 'draft' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    editingArticle.status === 'draft'
                      ? 'bg-gold text-navy shadow-xs'
                      : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  {isArabic ? 'مسودة' : 'Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingArticle({ ...editingArticle, status: 'published', date: new Date().toISOString().slice(0, 10) })}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    editingArticle.status === 'published'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isArabic ? 'نشر فوري' : 'Publish'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingArticle({
                    ...editingArticle,
                    status: 'scheduled',
                    scheduledPublishDate: editingArticle.scheduledPublishDate || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16)
                  })}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    editingArticle.status === 'scheduled'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>{isArabic ? 'جدولة' : 'Schedule'}</span>
                </button>
              </div>
            </div>

            {/* Scheduled Datetime picker bar if scheduled */}
            {editingArticle.status === 'scheduled' && (
              <div className="px-6 py-2.5 bg-indigo-500/10 border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-300">
                <div className="flex items-center gap-2 font-semibold">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>{isArabic ? 'موعد النشر التلقائي المجدول على الموقع:' : 'Scheduled live release date & time:'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={editingArticle.scheduledPublishDate || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, scheduledPublishDate: e.target.value })}
                    className="px-3 py-1 rounded-lg bg-secondary border border-border text-foreground font-mono text-xs focus:border-indigo-400 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* Editor Workspace Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-border bg-card shrink-0">
              <button
                onClick={() => setActiveEditorTab('content')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-bold transition cursor-pointer ${
                  activeEditorTab === 'content'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-text-muted hover:text-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isArabic ? 'المحتوى ثنائي اللغة' : 'Bilingual Content'}</span>
              </button>

              <button
                onClick={() => setActiveEditorTab('ai')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-bold transition cursor-pointer ${
                  activeEditorTab === 'ai'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-text-muted hover:text-foreground'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>{isArabic ? 'أدوات التحسين الذكي (AI)' : 'AI Enhancement Studio'}</span>
              </button>

              <button
                onClick={() => setActiveEditorTab('seo')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-bold transition cursor-pointer ${
                  activeEditorTab === 'seo'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-text-muted hover:text-foreground'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إعدادات السيو (SEO)' : 'SEO & Metadata'}</span>
              </button>

              <button
                onClick={() => setActiveEditorTab('preview')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-bold transition cursor-pointer ${
                  activeEditorTab === 'preview'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-text-muted hover:text-foreground'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isArabic ? 'معاينة الموقع الحية' : 'Live Preview'}</span>
              </button>
            </div>

            {/* Scrollable Tab Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: CONTENT */}
              {activeEditorTab === 'content' && (
                <div className="space-y-5">
                  {/* Category, Author, Cover URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1.5">
                        {isArabic ? 'التصنيف' : 'Category'}
                      </label>
                      <select
                        value={editingArticle.category}
                        onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value as ArticleCategory })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-secondary text-xs text-foreground focus:outline-hidden focus:border-gold/50 cursor-pointer"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1.5">
                        {isArabic ? 'المؤلف / الكاتب' : 'Author'}
                      </label>
                      <input
                        type="text"
                        value={editingArticle.author}
                        onChange={(e) => setEditingArticle({ ...editingArticle, author: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-secondary text-xs text-foreground focus:outline-hidden focus:border-gold/50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1.5">
                        {isArabic ? 'وقت القراءة التقديري (بالدقائق)' : 'Read Time (Minutes)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={editingArticle.readTimeMinutes}
                        onChange={(e) => setEditingArticle({ ...editingArticle, readTimeMinutes: Number(e.target.value) || 3 })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-secondary text-xs text-foreground focus:outline-hidden focus:border-gold/50"
                      />
                    </div>
                  </div>

                  {/* Slug & Cover Image URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1.5">
                        {isArabic ? 'الرابط الدائم (Slug)' : 'URL Slug'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={editingArticle.slug}
                          onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })}
                          className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-border bg-secondary text-foreground focus:outline-hidden focus:border-gold/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1.5">
                        {isArabic ? 'رابط صورة الغلاف' : 'Cover Image URL'}
                      </label>
                      <input
                        type="text"
                        value={editingArticle.coverImage || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, coverImage: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-secondary text-foreground focus:outline-hidden focus:border-gold/50"
                      />
                    </div>
                  </div>

                  {/* Bilingual Titles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <span>العنوان بالعربية (الأساسي للموقع)</span>
                          <span className="text-[10px] text-gold font-mono">AR</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        dir="rtl"
                        value={editingArticle.titleAr}
                        onChange={(e) => setEditingArticle({ ...editingArticle, titleAr: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-secondary text-sm font-semibold text-foreground focus:outline-hidden focus:border-gold/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <span>English Title</span>
                          <span className="text-[10px] text-gold font-mono">EN</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        dir="ltr"
                        value={editingArticle.title}
                        onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-secondary text-sm font-semibold text-foreground focus:outline-hidden focus:border-gold/50"
                      />
                    </div>
                  </div>

                  {/* Bilingual Summaries / Excerpts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground block">
                        الملخص التنفيذي بالعربية (Excerpt)
                      </label>
                      <textarea
                        rows={3}
                        dir="rtl"
                        value={editingArticle.summaryAr}
                        onChange={(e) => setEditingArticle({ ...editingArticle, summaryAr: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-secondary text-xs text-foreground focus:outline-hidden focus:border-gold/50 leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground block">
                        English Excerpt / Summary
                      </label>
                      <textarea
                        rows={3}
                        dir="ltr"
                        value={editingArticle.summary}
                        onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-secondary text-xs text-foreground focus:outline-hidden focus:border-gold/50 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Full Article Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground block">
                        نص المقال الكامل بالعربية (Markdown مدعوم)
                      </label>
                      <textarea
                        rows={9}
                        dir="rtl"
                        value={editingArticle.contentAr}
                        onChange={(e) => setEditingArticle({ ...editingArticle, contentAr: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary font-mono text-xs text-foreground focus:outline-hidden focus:border-gold/50 leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground block">
                        Full Article Content English (Markdown supported)
                      </label>
                      <textarea
                        rows={9}
                        dir="ltr"
                        value={editingArticle.content}
                        onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary font-mono text-xs text-foreground focus:outline-hidden focus:border-gold/50 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Tags Editor */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-gold" />
                      <span>{isArabic ? 'الوسوم والكلمات الدلالية (Tags)' : 'Tags'}</span>
                    </label>
                    <input
                      type="text"
                      value={editingArticle.tags.join(', ')}
                      onChange={(e) => setEditingArticle({
                        ...editingArticle,
                        tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder={isArabic ? 'أدخل الكلمات مفصولة بفاصلة (مثال: 6 أكتوبر، زايد، شقق للبيع)' : 'Comma separated tags (e.g. 6 October, ROI, Zayed)'}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-secondary text-xs text-foreground focus:outline-hidden focus:border-gold/50"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: AI & ENHANCEMENT SUITE */}
              {activeEditorTab === 'ai' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-gold/30 bg-gold/5 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-gold shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {isArabic ? 'حزمة التحسين الذكي للمحتوى العقاري' : 'Real Estate AI Enhancement Suite'}
                      </h4>
                      <p className="text-xs text-text-muted">
                        {isArabic
                          ? 'أدوات مساعدة لرفع جاذبية المقال، وتوليد عناوين تسويقية عالية التحويل، وضبط صياغة النص للمستثمرين'
                          : 'Specialized assistants to elevate tone, generate high-converting headlines, and formulate executive takeaways'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tool 1: Real Estate Tone Enhancer */}
                    <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gold/15 text-gold">
                          <Edit3 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            {isArabic ? 'تحسين وصياغة النص العقاري' : 'Elevate Real Estate Tone'}
                          </h4>
                          <span className="text-[11px] text-text-muted">
                            {isArabic ? 'إضافة توصيات الخبراء وصياغة مالية دقيقة' : 'Add expert advisories & financial clarity'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {isArabic
                          ? 'يقوم بتحليل المقال وإضافة توصيات استثمارية احترافية تتناسب مع طبيعة السوق المصري في الشيخ زايد وأكتوبر.'
                          : 'Injects professional advisory insights tailored for Egyptian luxury and investment property buyers.'}
                      </p>
                      <Button
                        onClick={handleAIEnhanceTone}
                        className="w-full bg-secondary hover:bg-gold hover:text-navy text-foreground text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-gold" />
                        {isArabic ? 'تطبيق التحسين الفوري' : 'Enhance Copy Now'}
                      </Button>
                    </div>

                    {/* Tool 2: Headline Generator */}
                    <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            {isArabic ? 'توليد عناوين تسويقية جذابة' : 'Catchy Headline Generator'}
                          </h4>
                          <span className="text-[11px] text-text-muted">
                            {isArabic ? 'عناوين ذات معدل نقر مرتفع (CTR)' : 'High CTR engagement headlines'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {isArabic
                          ? 'يقترح عناوين استثمارية مبتكرة باللغتين العربية والإنجليزية تتوافق مع تصنيف المقال وتجذب القارئ.'
                          : 'Proposes engaging, conversion-optimized titles aligned with the chosen topic category.'}
                      </p>
                      <Button
                        onClick={handleAIGenerateHeadlines}
                        className="w-full bg-secondary hover:bg-emerald-500 hover:text-white text-foreground text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        {isArabic ? 'توليد واختيار عنوان جديد' : 'Generate Headlines'}
                      </Button>
                    </div>

                    {/* Tool 3: Auto Summary Generator */}
                    <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            {isArabic ? 'توليد ملخص تنفيذي ذكي' : 'Executive Summary Synthesizer'}
                          </h4>
                          <span className="text-[11px] text-text-muted">
                            {isArabic ? 'ملخص بطاقات العرض ومواقع التواصل' : 'For listing cards & snippet cards'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {isArabic
                          ? 'يستخرج أهم الأفكار من متن المقال ويصيغ ملخصاً مركزاً وجذاباً لا يتعدى سطرين للمعاينة.'
                          : 'Synthesizes key article takeaways into a punchy 2-sentence preview summary.'}
                      </p>
                      <Button
                        onClick={handleAIGenerateSummary}
                        className="w-full bg-secondary hover:bg-indigo-600 hover:text-white text-foreground text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                        {isArabic ? 'توليد الملخص التنفيذي' : 'Synthesize Summary'}
                      </Button>
                    </div>

                    {/* Tool 4: Auto SEO Meta Generator */}
                    <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gold/15 text-gold">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            {isArabic ? 'تحسين السيو والوسوم التلقائي' : 'Auto SEO & Keyword Optimizer'}
                          </h4>
                          <span className="text-[11px] text-text-muted">
                            {isArabic ? 'متوافق مع محركات بحث Google' : 'Google SERP title & snippet'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {isArabic
                          ? 'يضبط عنوان السيو، ووصف الميتا (أقل من 160 حرف)، والرابط الدائم والكلمات المفتاحية الأكثر بحثاً.'
                          : 'Builds search engine meta title, description (under 160 chars), and relevant keyword clusters.'}
                      </p>
                      <Button
                        onClick={handleAIOptimizeSEO}
                        className="w-full bg-secondary hover:bg-gold hover:text-navy text-foreground text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-gold" />
                        {isArabic ? 'تحسين السيو تلقائياً' : 'Optimize SEO Meta'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SEO & METADATA */}
              {activeEditorTab === 'seo' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl border border-border bg-card/40 space-y-2">
                    <span className="text-[11px] font-bold text-gold uppercase tracking-wider block">
                      {isArabic ? 'معاينة نتيجة البحث في Google' : 'Google Search Snippet Preview'}
                    </span>
                    <div className="p-3 rounded-lg bg-navy/90 border border-border/80 font-sans text-xs space-y-1">
                      <div className="text-[11px] text-emerald-400 truncate">
                        https://6o-real-estate.vercel.app/{isArabic ? 'ar' : 'en'}/articles/{editingArticle.slug}
                      </div>
                      <div className="text-sm font-bold text-sky-400 hover:underline cursor-pointer truncate">
                        {isArabic ? (editingArticle.seoTitleAr || editingArticle.titleAr) : (editingArticle.seoTitle || editingArticle.title)}
                      </div>
                      <div className="text-xs text-text-muted line-clamp-2">
                        {isArabic ? (editingArticle.seoDescAr || editingArticle.summaryAr) : (editingArticle.seoDesc || editingArticle.summary)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-muted block">
                        {isArabic ? 'عنوان السيو بالعربية (SEO Title)' : 'Arabic SEO Title'}
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={editingArticle.seoTitleAr || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, seoTitleAr: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-secondary text-xs text-foreground focus:outline-hidden focus:border-gold/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-muted block">
                        {isArabic ? 'عنوان السيو بالإنجليزية (SEO Title)' : 'English SEO Title'}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={editingArticle.seoTitle || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, seoTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-secondary text-xs text-foreground focus:outline-hidden focus:border-gold/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-text-muted block">
                          {isArabic ? 'وصف الميتا بالعربية (Meta Description)' : 'Arabic Meta Description'}
                        </label>
                        <span className="text-[10px] text-text-muted font-mono">
                          {(editingArticle.seoDescAr || '').length}/160
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        dir="rtl"
                        value={editingArticle.seoDescAr || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, seoDescAr: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-secondary text-xs text-foreground focus:outline-hidden focus:border-gold/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-text-muted block">
                          {isArabic ? 'وصف الميتا بالإنجليزية (Meta Description)' : 'English Meta Description'}
                        </label>
                        <span className="text-[10px] text-text-muted font-mono">
                          {(editingArticle.seoDesc || '').length}/160
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        dir="ltr"
                        value={editingArticle.seoDesc || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, seoDesc: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-secondary text-xs text-foreground focus:outline-hidden focus:border-gold/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LIVE WEBSITE PREVIEW */}
              {activeEditorTab === 'preview' && (
                <div className="space-y-6">
                  {/* Preview Toolbar */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/50">
                    <span className="text-xs font-bold text-foreground">
                      {isArabic ? 'محاكاة مظهر المقال على موقع الزوار' : 'Live Website Appearance Preview'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewLanguage('ar')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          previewLanguage === 'ar' ? 'bg-gold text-navy' : 'bg-card text-text-muted'
                        }`}
                      >
                        عربي (RTL)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewLanguage('en')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          previewLanguage === 'en' ? 'bg-gold text-navy' : 'bg-card text-text-muted'
                        }`}
                      >
                        English (LTR)
                      </button>
                    </div>
                  </div>

                  {/* Simulated Landing Page Article View */}
                  <div
                    dir={previewLanguage === 'ar' ? 'rtl' : 'ltr'}
                    className="max-w-3xl mx-auto p-6 sm:p-10 rounded-2xl border border-border bg-card/90 shadow-xl space-y-6"
                  >
                    {/* Category & Status */}
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold/15 text-gold border border-gold/30">
                        {editingArticle.category}
                      </span>
                      <span className="text-xs text-text-muted">
                        • {editingArticle.readTimeMinutes} {previewLanguage === 'ar' ? 'دقائق قراءة' : 'min read'}
                      </span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
                      {previewLanguage === 'ar' ? editingArticle.titleAr : editingArticle.title}
                    </h1>

                    {/* Author & Date */}
                    <div className="flex items-center gap-3 py-3 border-y border-border/60 text-xs text-text-muted">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center font-bold text-gold">
                        6o
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{editingArticle.author}</div>
                        <div>
                          {editingArticle.status === 'scheduled' && editingArticle.scheduledPublishDate
                            ? (previewLanguage === 'ar' ? `مجدول للنشر: ${editingArticle.scheduledPublishDate.replace('T', ' ')}` : `Scheduled: ${editingArticle.scheduledPublishDate.replace('T', ' ')}`)
                            : editingArticle.date}
                        </div>
                      </div>
                    </div>

                    {/* Cover image preview */}
                    {editingArticle.coverImage && (
                      <div className="rounded-xl overflow-hidden max-h-80 w-full bg-secondary">
                        <img
                          src={editingArticle.coverImage}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Excerpt Lead */}
                    <p className="text-sm font-semibold text-foreground/90 leading-relaxed italic border-l-4 rtl:border-l-0 rtl:border-r-4 border-gold px-3">
                      {previewLanguage === 'ar' ? editingArticle.summaryAr : editingArticle.summary}
                    </p>

                    {/* Body */}
                    <div className="text-xs sm:text-sm text-foreground/80 leading-relaxed whitespace-pre-line space-y-4 font-sans">
                      {previewLanguage === 'ar' ? editingArticle.contentAr : editingArticle.content}
                    </div>

                    {/* Tags */}
                    {editingArticle.tags.length > 0 && (
                      <div className="pt-4 border-t border-border/60 flex flex-wrap gap-2">
                        {editingArticle.tags.map((t, idx) => (
                          <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-text-muted">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between gap-3 bg-secondary/30 shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsNewArticleModalOpen(false)}
                className="text-xs font-semibold rounded-xl border-border hover:bg-secondary cursor-pointer"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveArticle}
                  className="bg-gold hover:bg-gold-light text-navy font-bold px-5 py-2 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {editingArticle.status === 'published'
                      ? (isArabic ? 'حفظ ونشر المقال' : 'Save & Publish Live')
                      : editingArticle.status === 'scheduled'
                      ? (isArabic ? 'حفظ وجدولة النشر' : 'Save & Schedule')
                      : (isArabic ? 'حفظ كمسودة' : 'Save as Draft')}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogArticlesManager;
