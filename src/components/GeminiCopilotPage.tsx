import React, { useState, useRef, useEffect } from 'react';
import { STORAGE_KEYS, saveJson } from '../data/storage';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  MessageSquare, 
  Building2, 
  FileText, 
  TrendingUp, 
  Loader2, 
} from 'lucide-react';
import { Unit, DashboardKPIs, ChatMessage } from '../types';
import { askGeminiInventoryAI } from '../services/gemini';
import type { NavTabId } from '../navigation/navConfig';

interface GeminiCopilotPageProps {
  units: Unit[];
  kpis: DashboardKPIs;
  isArabic: boolean;
  onNavigateToTab: (tabId: NavTabId) => void;
  onQuickFilter: (query: string) => void;
}

export const GeminiCopilotPage: React.FC<GeminiCopilotPageProps> = ({
  units,
  kpis,
  isArabic
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.geminiChat);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<Omit<ChatMessage, 'timestamp'> & { timestamp: string }>;
        return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {}
    }
    return [
      {
        id: 'welcome-init',
        role: 'assistant',
        content: isArabic
          ? `مرحباً بك في **مساعد Gemini الذكي لعقارات 6 أكتوبر والشيخ زايد**!\n\nأنا مرتبط مباشرة ببيانات مخزونك الحالي (${units.length} وحدة مسجلة) وأسعار السوق والكمبوندات.\n\n**كيف يمكنني مساعدتك اليوم؟**\n- مطابقة الوحدات المناسبة لميزانية ورغبة العميل.\n- صياغة رسائل واتساب احترافية وعروض أسعار مكتملة التفاصيل.\n- مقارنة المشاريع وخطط السداد ونسب التخصيم للكاش.\n- صياغة شروط الحجز والعقود الابتدائية.`
          : `Welcome to **Gemini Real Estate Copilot** for 6th of October & Sheikh Zayed!\n\nI am grounded with your live inventory (${units.length} units indexed) and pricing benchmarks.\n\nAsk me for property matching, professional WhatsApp proposal drafting, ROI calculations, or project comparisons!`,
        timestamp: new Date()
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Persist chat history
  useEffect(() => {
    saveJson(STORAGE_KEYS.geminiChat, messages);
  }, [messages]);

  // Quick Prompt Categories
  const promptCategories = [
    {
      icon: Building2,
      categoryAr: 'مطابقة الوحدات',
      categoryEn: 'Property Matching',
      prompts: isArabic ? [
        'أرخص شقة استلام فوري في ماونتن فيو آي سيتي بمقدم مناسب',
        'وحدات ريسيل 3 غرف في 6 أكتوبر بسعر أقل من 8 مليون',
        'فيلات للبيع في بالم هيلز أو سوديك الشيخ زايد'
      ] : [
        'Cheapest immediate-delivery unit in Mountain View iCity',
        'Available 3-bedroom resale apartments under 8M EGP',
        'Luxury standalone villas in Palm Hills or Sodic'
      ]
    },
    {
      icon: MessageSquare,
      categoryAr: 'صياغة رسائل واتساب',
      categoryEn: 'WhatsApp Copywriting',
      prompts: isArabic ? [
        'اكتب رسالة عرض سعر واتساب فاخرة ومحفزة لعميل مهتم بشقة في آي سيتي',
        'رسالة تذكير أنيقة لعميل بعد إجراء المعاينة الميدانية',
        'رسالة ترويجية لقائمة وحدات جاهزة للاستلام بدون عمولة'
      ] : [
        'Draft a persuasive WhatsApp property proposal for Mountain View',
        'Follow-up message after conducting an on-site showing',
        'Broadcast promotional message for direct resale listings'
      ]
    },
    {
      icon: TrendingUp,
      categoryAr: 'مقارنة المشاريع والسوق',
      categoryEn: 'Market & ROI',
      prompts: isArabic ? [
        'قارن بين الاستثمار في O West أوراسكوم و Badya بالم هيلز',
        'ما هو متوسط سعر المتر للشقق والفيلات في كمبوندات أكتوبر الحالية؟',
        'حساب العائد الإيجاري المتوقع لبنتهاوس في تشيل أوت بارك'
      ] : [
        'Compare investment prospects: O West vs Badya Palm Hills',
        'What is the current average price per meter in 6th of October?',
        'Estimate rental yield for a penthouse in Chillout Park'
      ]
    },
    {
      icon: FileText,
      categoryAr: 'استشارات العقود والشهر العقاري',
      categoryEn: 'Legal & Procedures',
      prompts: isArabic ? [
        'ما هي المستندات المطلوبة لنقل الملكية والتنازل في جهاز مدينة 6 أكتوبر؟',
        'بنود وشروط الحجز الابتدائي الأساسية لحماية المشتري والبائع',
        'كيفية التأكد من تسلسل الملكية وتوكيلات الشهر العقاري'
      ] : [
        'Required legal papers for title transfer in 6th of October City Authority',
        'Essential clauses for preliminary reservation agreement',
        'How to verify legal ownership chain and power of attorney'
      ]
    }
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const aiReply = await askGeminiInventoryAI(text, kpis, units);
      const assistantMessage: ChatMessage = {
        id: `gemini-${Date.now()}`,
        role: 'assistant',
        content: aiReply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: isArabic
          ? `عذراً، حدث خطأ أثناء معالجة الطلب: ${errMsg || 'يرجى المحاولة مجدداً'}`
          : `Sorry, an error occurred while generating response: ${errMsg || 'Please retry'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm(isArabic ? 'هل تريد مسح سجل المحادثة مع Gemini؟' : 'Clear conversation history?')) {
      const resetMsg: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: isArabic 
          ? 'تم تفريغ المحادثة. يمكنك بدء استفسار جديد بخصوص المخزون والعملاء.'
          : 'Conversation cleared. Ready for your next real estate inquiry.',
        timestamp: new Date()
      };
      setMessages([resetMsg]);
      localStorage.removeItem(STORAGE_KEYS.geminiChat);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-6xl mx-auto space-y-4">
      {/* Top Header Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-accent via-rose-500 to-purple-600 text-white shadow-lg shadow-accent/20 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {isArabic ? 'مساعد Gemini الذكي للعقارات والمبيعات' : 'Gemini AI Real Estate Copilot'}
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-accent to-purple-500/20 text-accent font-bold border border-accent">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {units.length} {isArabic ? 'وحدة مسجلة بالمخزون المباشر' : 'Units Grounded'}
              </span>
              <span>&bull;</span>
              <span>{isArabic ? 'تحليل لحظي لأسعار 6 أكتوبر والشيخ زايد' : 'Live October & Zayed Intelligence'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-raised text-text-muted hover:text-rose-400 border border-border rounded-xl text-xs font-semibold transition cursor-pointer"
            title={isArabic ? 'مسح المحادثة' : 'Clear Chat'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isArabic ? 'مسح السجل' : 'Clear History'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (Split / Flex) */}
      <div className="flex-1 min-h-0 bg-surface border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Chat Message Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-border">
          {messages.map((msg) => {
            const isAI = msg.role === 'assistant';
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'mr-auto rtl:mr-0 rtl:ml-auto flex-row-reverse' : 'ml-auto rtl:ml-0 rtl:mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md ${
                  isAI 
                    ? 'bg-gradient-to-tr from-accent via-rose-500 to-purple-600' 
                    : 'bg-blue-600'
                }`}>
                  {isAI ? <Sparkles className="w-4 h-4" /> : <span className="font-bold text-xs">U</span>}
                </div>

                {/* Bubble */}
                <div className={`group relative rounded-2xl p-4 text-xs leading-relaxed max-w-[85%] sm:max-w-[90%] shadow-md ${
                  isAI
                    ? 'bg-surface border border-border text-text'
                    : 'bg-blue-600 text-white rounded-tr-none rtl:rounded-tr-2xl rtl:rounded-tl-none font-medium'
                }`}>
                  {/* Copy button */}
                  {isAI && (
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 p-1 text-text-muted hover:text-white rounded bg-surface border border-border transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title={isArabic ? 'نسخ النص' : 'Copy'}
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {/* Content with linebreaks */}
                  <div className="whitespace-pre-line space-y-1">
                    {msg.content}
                  </div>

                  <span className="block text-[9px] text-text-muted text-left rtl:text-right mt-2 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-xl ml-auto rtl:ml-0 rtl:mr-auto">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-surface border border-border rounded-2xl p-3.5 text-xs text-text-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span>{isArabic ? 'جاري استخراج وتحليل بيانات المخزون وصياغة الرد...' : 'Analyzing inventory and generating response...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-surface border-t border-border overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-text-muted font-bold whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent" />
            <span>{isArabic ? 'مقترحات سريعة:' : 'Quick Prompts:'}</span>
          </span>

          {promptCategories.flatMap(c => c.prompts).slice(0, 6).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-raised text-text-muted hover:text-white border border-border text-[11px] whitespace-nowrap transition cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-surface border-t border-border shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={isArabic ? 'اسأل Gemini عن أي وحدة، صياغة رسالة واتساب، مقارنة أسعار الكمبوندات...' : 'Ask Gemini about units, draft WhatsApp messages, compare prices...'}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-xs text-text placeholder-text-muted focus:outline-none focus:border-accent transition disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="px-4 sm:px-5 py-3 bg-gradient-to-r from-accent via-rose-500 to-purple-600 hover:opacity-95 text-white font-semibold rounded-xl text-xs shadow-lg shadow-accent/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isArabic ? 'إرسال' : 'Send'}</span>
                  <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GeminiCopilotPage;
