import { formatNumber } from '../i18n/format';
import React, { useState, useRef, useMemo } from 'react';
import {
  Pin,
  PinOff,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Clock,
  Bell,
  Tag,
  Trash2,
  Copy,
  Check,
  MessageSquare,
  Phone,
  MessageCircle,
  Eye,
  Users,
  DollarSign,
  Sparkles,
  Plus,
  Search,
  CalendarDays,
  Send,
  CheckSquare,
  Square,
  ChevronUp,
  User
} from 'lucide-react';
import { Unit, UnitCommentEntry, UnitFollowUpReminder, UnitInteractionLog, FollowUpTask } from '../types';
import {
  getUnitComments,
  addCommentToUnit,
  toggleCommentPin,
  toggleReminderState,
  deleteCommentFromUnit
} from '../services/unitCommentsService';

interface UnitCommentsSectionProps {
  unit: Unit;
  isArabic: boolean;
  theme?: 'dark' | 'light';
  onUpdateUnit?: (updatedUnit: Unit) => void;
  onAddFollowUpTask?: (task: Partial<FollowUpTask>) => void;
}

export const UnitCommentsSection: React.FC<UnitCommentsSectionProps> = ({
  unit,
  isArabic,
  onUpdateUnit,
  onAddFollowUpTask
}) => {
  // Comments state derived from unit or default synthesized comments
  const comments = useMemo(() => getUnitComments(unit), [unit]);

  // UI state
  const [activeFilter, setActiveFilter] = useState<'all' | 'pinned' | 'reminders' | 'interactions'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(true);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for new note
  const [content, setContent] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>(unit.agent || (isArabic ? 'كريم سامي' : 'Karim Samy'));
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [category] = useState<UnitCommentEntry['category']>('internal_note');
  const [selectedTag, setSelectedTag] = useState<string>('');

  // Reminder Sub-form State
  const [attachReminder, setAttachReminder] = useState<boolean>(false);
  const [reminderTitle, setReminderTitle] = useState<string>('');
  const [reminderDueDate, setReminderDueDate] = useState<string>(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return tmr.toISOString().split('T')[0];
  });
  const [reminderDueTime, setReminderDueTime] = useState<string>('12:00');
  const [reminderPriority, setReminderPriority] = useState<UnitFollowUpReminder['priority']>('high');
  const [reminderClientName, setReminderClientName] = useState<string>('');

  // Interaction Sub-form State
  const [attachInteraction, setAttachInteraction] = useState<boolean>(false);
  const [interactionType, setInteractionType] = useState<UnitInteractionLog['type']>('call');
  const [interactionClient, setInteractionClient] = useState<string>('');
  const [interactionPhone, setInteractionPhone] = useState<string>('');
  const [interactionOutcome, setInteractionOutcome] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick Preset Tags
  const presetTags = [
    { labelAr: 'ملاحظة داخلية', labelEn: 'Internal Note', tag: 'ملاحظة_داخلية', icon: '📝' },
    { labelAr: 'معاينة ميدانية', labelEn: 'Site Viewing', tag: 'معاينة_ميدانية', icon: '🏡' },
    { labelAr: 'مكالمة عميل', labelEn: 'Client Call', tag: 'مكالمة_عميل', icon: '📞' },
    { labelAr: 'واتساب', labelEn: 'WhatsApp', tag: 'واتساب', icon: '💬' },
    { labelAr: 'تفاوض سعري', labelEn: 'Price Negotiation', tag: 'تفاوض_سعري', icon: '💰' },
    { labelAr: 'سري / إداري', labelEn: 'Confidential', tag: 'سري_إداري', icon: '🔒' },
    { labelAr: 'موقف قانوني', labelEn: 'Legal & Title', tag: 'موقف_قانوني', icon: '📜' },
  ];

  // Helper to insert formatting at cursor in textarea
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || (isArabic ? 'نص' : 'text')}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 2));
    }, 10);
  };

  // Quick insert preset tag
  const handleInsertTag = (tagText: string) => {
    const formattedTag = ` #${tagText} `;
    setContent(prev => prev + formattedTag);
    setSelectedTag(tagText);
  };

  // Submit Handler for New Comment
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    let reminderData: UnitFollowUpReminder | undefined = undefined;
    if (attachReminder && (reminderTitle.trim() || content.trim())) {
      reminderData = {
        id: `rem-${unit.id}-${Date.now()}`,
        title: reminderTitle.trim() || (isArabic ? `متابعة الوحدة ${unit.id}` : `Follow up Unit ${unit.id}`),
        dueDate: reminderDueDate,
        dueTime: reminderDueTime,
        priority: reminderPriority,
        assignedAgent: authorName,
        completed: false,
        clientName: reminderClientName.trim() || undefined
      };

      // Also trigger optional app-level task sync if provided
      if (onAddFollowUpTask) {
        onAddFollowUpTask({
          title: reminderData.title,
          unitId: unit.id,
          compound: unit.compound,
          dueDate: reminderData.dueDate,
          dueTime: reminderData.dueTime,
          agent: reminderData.assignedAgent,
          priority: reminderData.priority,
          clientName: reminderData.clientName || unit.ownerName || 'Client Inquiry',
          notes: content.slice(0, 120),
          stage: 'viewing',
          type: interactionType === 'whatsapp' ? 'whatsapp' : interactionType === 'call' ? 'call' : 'visit'
        });
      }
    }

    let interactionData: UnitInteractionLog | undefined = undefined;
    if (attachInteraction) {
      interactionData = {
        id: `int-${unit.id}-${Date.now()}`,
        type: interactionType,
        clientName: interactionClient.trim() || undefined,
        clientPhone: interactionPhone.trim() || undefined,
        agent: authorName,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        summary: content.slice(0, 100),
        outcome: interactionOutcome.trim() || undefined
      };
    }

    // Extract hashtags from content
    const hashtagMatches = content.match(/#[\w\u0621-\u064A_]+/g);
    const tags = hashtagMatches ? hashtagMatches.map(t => t.replace('#', '')) : [];
    if (selectedTag && !tags.includes(selectedTag)) {
      tags.push(selectedTag);
    }

    const updatedUnit = addCommentToUnit(unit, {
      author: authorName.trim() || 'Agent',
      authorRole: isArabic ? 'مستشار عقاري معتمد' : 'Real Estate Consultant',
      content: content.trim(),
      isPinned,
      category,
      tags,
      reminder: reminderData,
      interaction: interactionData
    });

    if (onUpdateUnit) {
      onUpdateUnit(updatedUnit);
    }

    // Reset Form
    setContent('');
    setIsPinned(false);
    setAttachReminder(false);
    setReminderTitle('');
    setReminderClientName('');
    setAttachInteraction(false);
    setInteractionOutcome('');
    setInteractionClient('');
    setInteractionPhone('');
    setSelectedTag('');
    setPreviewMode(false);
  };

  // Toggle Pin on an existing comment
  const handleTogglePin = (commentId: string) => {
    const updated = toggleCommentPin(unit, commentId);
    if (onUpdateUnit) {
      onUpdateUnit(updated);
    }
  };

  // Toggle Reminder completed state
  const handleToggleReminder = (commentId: string) => {
    const updated = toggleReminderState(unit, commentId);
    if (onUpdateUnit) {
      onUpdateUnit(updated);
    }
  };

  // Delete a comment
  const handleDeleteComment = (commentId: string) => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من حذف هذه الملاحظة نهائياً؟' : 'Are you sure you want to delete this note?')) {
      const updated = deleteCommentFromUnit(unit, commentId);
      if (onUpdateUnit) {
        onUpdateUnit(updated);
      }
    }
  };

  // Copy Comment Content
  const handleCopyComment = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered comments
  const filteredComments = useMemo(() => {
    return comments.filter(c => {
      // Tab filter
      if (activeFilter === 'pinned' && !c.isPinned) return false;
      if (activeFilter === 'reminders' && !c.reminder) return false;
      if (activeFilter === 'interactions' && !c.interaction) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = c.content.toLowerCase().includes(q);
        const matchesAuthor = c.author.toLowerCase().includes(q);
        const matchesClient = c.reminder?.clientName?.toLowerCase().includes(q) || c.interaction?.clientName?.toLowerCase().includes(q);
        const matchesTags = c.tags?.some(t => t.toLowerCase().includes(q));
        return matchesContent || matchesAuthor || matchesClient || matchesTags;
      }

      return true;
    });
  }, [comments, activeFilter, searchQuery]);

  // Counters
  const counts = useMemo(() => {
    return {
      all: comments.length,
      pinned: comments.filter(c => c.isPinned).length,
      reminders: comments.filter(c => c.reminder).length,
      pendingReminders: comments.filter(c => c.reminder && !c.reminder.completed).length,
      interactions: comments.filter(c => c.interaction).length,
    };
  }, [comments]);

  // Safe Rich-Text Content Parser & Renderer
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');

    return (
      <div className="space-y-1.5 text-xs leading-relaxed text-text">
        {lines.map((line, lineIdx) => {
          if (!line.trim()) return <div key={lineIdx} className="h-1.5" />;

          // Process bullet points
          const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
          const isNumbered = /^\d+\.\s/.test(line.trim());
          const cleanLine = isBullet ? line.replace(/^[•\-]\s*/, '') : isNumbered ? line.replace(/^\d+\.\s*/, '') : line;

          // Parse markdown spans: **bold**, *italic*, <u>underline</u>, #tags
          const parts = parseMarkdownSpans(cleanLine);

          return (
            <div key={lineIdx} className={`flex items-start gap-1.5 ${isBullet || isNumbered ? 'pl-2 rtl:pr-2' : ''}`}>
              {isBullet && <span className="text-accent font-bold select-none">•</span>}
              {isNumbered && (
                <span className="text-blue-400 font-mono text-[11px] font-bold select-none">
                  {line.match(/^\d+\./)?.[0] || '1.'}
                </span>
              )}
              <div className="flex-1 flex-wrap break-words">{parts}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper to parse bold, italic, tags, price values
  const parseMarkdownSpans = (text: string) => {
    // Regex splits by **bold**, *italic*, <u>underline</u>, #hashtags, and price patterns
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|<u>[^<]+<\/u>|#[\w\u0621-\u064A_]+|\b\d{1,3}(?:,\d{3})+(?:\s*(?:EGP|ج\.م|LE))?\b)/g;
    const tokens = text.split(regex);

    return tokens.map((token, i) => {
      if (!token) return null;

      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white tracking-wide">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('*') && token.endsWith('*')) {
        return (
          <em key={i} className="italic text-text-muted">
            {token.slice(1, -1)}
          </em>
        );
      }
      if (token.startsWith('<u>') && token.endsWith('</u>')) {
        return (
          <span key={i} className="underline decoration-accent decoration-1 underline-offset-2 text-accent">
            {token.slice(3, -4)}
          </span>
        );
      }
      if (token.startsWith('#')) {
        return (
          <span key={i} className="inline-block px-1.5 py-0.2 mx-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-medium">
            {token}
          </span>
        );
      }
      // Price highlight
      if (/\b\d{1,3}(?:,\d{3})+/.test(token)) {
        return (
          <span key={i} className="inline-block px-1 rounded bg-emerald-500/15 text-emerald-300 font-mono font-bold text-[11px]">
            {token}
          </span>
        );
      }

      return <span key={i}>{token}</span>;
    });
  };

  return (
    <div className="space-y-5">
      {/* SECTION HEADER WITH STATS & QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-surface via-surface to-surface border border-border shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent to-accent text-text font-bold shadow-md shadow-accent/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                {isArabic ? 'سجل التعليقات والملاحظات والتفاعلات' : 'Internal Notes, Comments & Activity'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent text-accent border border-accent">
                {counts.all} {isArabic ? 'ملاحظة' : 'Notes'}
              </span>
              {counts.pinned > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-accent border border-accent flex items-center gap-1">
                  <Pin className="w-3 h-3 text-accent fill-accent" />
                  <span>{counts.pinned} {isArabic ? 'مثبت' : 'Pinned'}</span>
                </span>
              )}
              {counts.pendingReminders > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                  <Bell className="w-3 h-3 text-rose-400" />
                  <span>{counts.pendingReminders} {isArabic ? 'تذكير مستحق' : 'Due'}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {isArabic 
                ? 'تدوين الملاحظات الداخلية السرية، وتثبيت التنبيهات، وربط تذكيرات المتابعة، وتوثيق سجل التفاعلات الميدانية للوحدة.' 
                : 'Pin internal agent notes, schedule follow-up reminders linked directly to the unit, and log client interactions.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsComposerOpen(!isComposerOpen)}
          className="px-3.5 py-2 rounded-xl bg-accent hover:bg-accent text-text font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-accent/20 cursor-pointer self-start sm:self-auto"
        >
          {isComposerOpen ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isComposerOpen ? (isArabic ? 'إخفاء صندوق الإضافة' : 'Collapse Editor') : (isArabic ? 'إضافة ملاحظة جديدة' : 'Add Note / Reminder')}</span>
        </button>
      </div>

      {/* RICH-TEXT COMPOSER ACCORDION */}
      {isComposerOpen && (
        <form 
          onSubmit={handleSubmitComment} 
          className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-white">
                {isArabic ? 'محرر الملاحظات المنسق (Rich-Text Composer)' : 'Rich-Text Note & Reminder Composer'}
              </span>
            </div>

            {/* Author selector */}
            <div className="flex items-center gap-2 text-xs">
              <User className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-text-muted">{isArabic ? 'الكاتب:' : 'Author:'}</span>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={isArabic ? 'اسم المستشار' : 'Agent Name'}
                className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-accent font-semibold focus:outline-none focus:border-accent max-w-[150px]"
              />
            </div>
          </div>

          {/* RICH-TEXT TOOLBAR */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-surface rounded-xl border border-border">
            {/* Bold */}
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              className="p-1.5 rounded-lg hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
              title={isArabic ? 'خط عريض (**نص**)' : 'Bold (**text**)'}
            >
              <Bold className="w-4 h-4" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              className="p-1.5 rounded-lg hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
              title={isArabic ? 'خط مائل (*نص*)' : 'Italic (*text*)'}
            >
              <Italic className="w-4 h-4" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => insertFormatting('<u>', '</u>')}
              className="p-1.5 rounded-lg hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
              title={isArabic ? 'تسطير (<u>نص</u>)' : 'Underline (<u>text</u>)'}
            >
              <Underline className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-surface-raised mx-1" />

            {/* Bullet List */}
            <button
              type="button"
              onClick={() => insertFormatting('• ')}
              className="p-1.5 rounded-lg hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
              title={isArabic ? 'قائمة نقطية (• )' : 'Bullet List (• )'}
            >
              <List className="w-4 h-4" />
            </button>

            {/* Numbered List */}
            <button
              type="button"
              onClick={() => insertFormatting('1. ')}
              className="p-1.5 rounded-lg hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
              title={isArabic ? 'قائمة مرقمة (1. )' : 'Numbered List (1. )'}
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-surface-raised mx-1" />

            {/* Price Insert */}
            <button
              type="button"
              onClick={() => insertFormatting(`${formatNumber(unit.price)} ${unit.currency}`)}
              className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1"
              title={isArabic ? 'إدراج سعر الوحدة المعتمد' : 'Insert Asking Price'}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{isArabic ? 'سعر الوحدة' : 'Price'}</span>
            </button>

            {/* Preview Toggle */}
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`ml-auto rtl:mr-auto px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                previewMode
                  ? 'bg-accent text-accent border-accent'
                  : 'bg-surface-raised hover:bg-surface-raised text-text-muted border-border'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-accent" />
              <span>{previewMode ? (isArabic ? 'وضع التعديل' : 'Edit') : (isArabic ? 'معاينة التنسيق' : 'Preview')}</span>
            </button>
          </div>

          {/* Quick Preset Tags Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
            <span className="text-text-muted shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>{isArabic ? 'وسوم سريعة:' : 'Tags:'}</span>
            </span>
            {presetTags.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleInsertTag(p.tag)}
                className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white border border-border transition cursor-pointer shrink-0 flex items-center gap-1"
              >
                <span>{p.icon}</span>
                <span>{isArabic ? p.labelAr : p.labelEn}</span>
              </button>
            ))}
          </div>

          {/* Textarea or Preview Canvas */}
          {previewMode ? (
            <div className="min-h-[110px] p-3.5 bg-surface rounded-xl border border-accent overflow-y-auto">
              <span className="text-[10px] uppercase font-bold text-accent block mb-1.5">
                {isArabic ? 'معاينة التنسيق المباشر:' : 'Formatted Preview:'}
              </span>
              {content.trim() ? renderFormattedText(content) : (
                <span className="text-xs text-text-muted italic">
                  {isArabic ? 'لا يوجد نص لعرضه حالياً، ابدأ بالكتابة أعلاه.' : 'Nothing to preview yet. Start typing above.'}
                </span>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isArabic 
                ? 'اكتب ملاحظتك الداخلية هنا... يدعم التنسيق العريض (**نص**)، المائل (*نص*)، القوائم النقطية (•)، والوسوم (#ملاحظة).' 
                : 'Write your internal note here... Supports **bold**, *italic*, <u>underline</u>, bullet points (•), and #tags.'}
              className="w-full bg-surface border border-border rounded-xl p-3.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed font-sans"
            />
          )}

          {/* ACTION TOGGLES: PIN TO TOP, FOLLOW-UP REMINDER, LOG INTERACTION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* 1. Pin to Top Toggle */}
            <label className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
              isPinned ? 'bg-accent border-accent text-accent' : 'bg-surface border-border text-text-muted hover:text-text'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Pin className={`w-4 h-4 ${isPinned ? 'text-accent fill-accent' : 'text-text-muted'}`} />
                <span>{isArabic ? 'تثبيت الملاحظة في الأعلى' : 'Pin to Top of Unit'}</span>
              </div>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent cursor-pointer"
              />
            </label>

            {/* 2. Follow-Up Reminder Toggle */}
            <label className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
              attachReminder ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : 'bg-surface border-border text-text-muted hover:text-text'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Bell className={`w-4 h-4 ${attachReminder ? 'text-rose-400' : 'text-text-muted'}`} />
                <span>{isArabic ? 'إرفاق تذكير متابعة' : 'Attach Reminder'}</span>
              </div>
              <input
                type="checkbox"
                checked={attachReminder}
                onChange={(e) => setAttachReminder(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 cursor-pointer"
              />
            </label>

            {/* 3. Log Interaction Toggle */}
            <label className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
              attachInteraction ? 'bg-blue-500/15 border-blue-500/40 text-blue-300' : 'bg-surface border-border text-text-muted hover:text-text'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Users className={`w-4 h-4 ${attachInteraction ? 'text-blue-400' : 'text-text-muted'}`} />
                <span>{isArabic ? 'توثيق تفاعل رسمي' : 'Log Interaction'}</span>
              </div>
              <input
                type="checkbox"
                checked={attachInteraction}
                onChange={(e) => setAttachInteraction(e.target.checked)}
                className="w-4 h-4 rounded text-blue-500 focus:ring-blue-400 cursor-pointer"
              />
            </label>
          </div>

          {/* CONDITIONAL SUB-FORM: ATTACH FOLLOW-UP REMINDER */}
          {attachReminder && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3 animate-in fade-in duration-200 text-xs">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <Clock className="w-4 h-4 text-rose-400" />
                  <span>{isArabic ? 'بيانات تذكير المتابعة المباشر المرتبط بالوحدة:' : 'Follow-Up Reminder Details:'}</span>
                </div>
                <span className="text-[10px] text-rose-400 font-mono font-semibold">
                  {isArabic ? 'سيرسل إشعاراً في الموعد' : 'Alerts on due date'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-text-muted block mb-1">
                    {isArabic ? 'عنوان مهمة التذكير:' : 'Reminder Title:'}
                  </label>
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder={isArabic ? 'مثال: مهاتفة المالك للتأكد من تسليم الشيكات' : 'e.g. Call owner to confirm payment schedule'}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-muted block mb-1">
                    {isArabic ? 'مستوى الأولوية:' : 'Priority:'}
                  </label>
                  <select
                    value={reminderPriority}
                    onChange={(e) => setReminderPriority(e.target.value as UnitFollowUpReminder['priority'])}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
                  >
                    <option value="urgent">{isArabic ? '🔴 عاجل جداً (Urgent)' : 'Urgent'}</option>
                    <option value="high">{isArabic ? '🟠 مرتفع (High)' : 'High'}</option>
                    <option value="medium">{isArabic ? '🔵 متوسط (Medium)' : 'Medium'}</option>
                    <option value="low">{isArabic ? '⚪ منخفض (Low)' : 'Low'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-muted block mb-1">
                    {isArabic ? 'تاريخ الاستحقاق:' : 'Due Date:'}
                  </label>
                  <input
                    type="date"
                    value={reminderDueDate}
                    onChange={(e) => setReminderDueDate(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-muted block mb-1">
                    {isArabic ? 'توقيت الاستحقاق:' : 'Due Time:'}
                  </label>
                  <input
                    type="time"
                    value={reminderDueTime}
                    onChange={(e) => setReminderDueTime(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-muted block mb-1">
                    {isArabic ? 'العميل المستهدف (اختياري):' : 'Linked Client (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={reminderClientName}
                    onChange={(e) => setReminderClientName(e.target.value)}
                    placeholder={isArabic ? 'اسم العميل / المستثمر' : 'Client name'}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CONDITIONAL SUB-FORM: LOG INTERACTION */}
          {attachInteraction && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-3 animate-in fade-in duration-200 text-xs">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-300">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span>{isArabic ? 'توثيق تفاعل مباشر (مكالمة، واتساب، معاينة، اجتماع):' : 'Log Interaction Record:'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-text-muted block mb-1">
                    {isArabic ? 'نوع التفاعل:' : 'Interaction Type:'}
                  </label>
                  <select
                    value={interactionType}
                    onChange={(e) => setInteractionType(e.target.value as UnitInteractionLog['type'])}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="call">{isArabic ? '📞 مكالمة هاتفية (Call)' : 'Phone Call'}</option>
                    <option value="whatsapp">{isArabic ? '💬 محادثة واتساب (WhatsApp)' : 'WhatsApp'}</option>
                    <option value="viewing">{isArabic ? '🏡 معاينة ميدانية (Viewing)' : 'Viewing'}</option>
                    <option value="meeting">{isArabic ? '🤝 اجتماع تفاوض (Meeting)' : 'Meeting'}</option>
                    <option value="offer">{isArabic ? '📋 تقديم عرض سعر (Offer)' : 'Price Offer'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-muted block mb-1">
                    {isArabic ? 'اسم العميل / الطرف الآخر:' : 'Client / Counterparty:'}
                  </label>
                  <input
                    type="text"
                    value={interactionClient}
                    onChange={(e) => setInteractionClient(e.target.value)}
                    placeholder={isArabic ? 'اسم العميل' : 'Client Name'}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-muted block mb-1">
                    {isArabic ? 'هاتف العميل:' : 'Client Phone:'}
                  </label>
                  <input
                    type="text"
                    value={interactionPhone}
                    onChange={(e) => setInteractionPhone(e.target.value)}
                    placeholder="+20 100 ..."
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-muted block mb-1">
                    {isArabic ? 'النتيجة / الإجراء التالي:' : 'Outcome / Next Step:'}
                  </label>
                  <input
                    type="text"
                    value={interactionOutcome}
                    onChange={(e) => setInteractionOutcome(e.target.value)}
                    placeholder={isArabic ? 'مثال: طلب موعد معاينة ثانية' : 'e.g. Requested second viewing'}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-[11px] text-text-muted">
              {isArabic 
                ? 'الملاحظات تحفظ وتزامن تلقائياً مع محفظة الوحدة.' 
                : 'Notes and reminders auto-sync directly with the unit record.'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setContent('');
                  setIsComposerOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-border hover:bg-surface-raised text-text-muted text-xs font-semibold transition cursor-pointer"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={!content.trim()}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-accent to-accent hover:from-accent hover:to-accent disabled:opacity-50 text-text text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-accent/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isArabic ? 'نشر الملاحظة / حفظ التذكير' : 'Post Note / Save Reminder'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 p-1 bg-surface rounded-xl border border-border overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-accent text-text shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <span>{isArabic ? 'جميع الملاحظات' : 'All Notes'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeFilter === 'all' ? 'bg-surface text-text font-bold' : 'bg-surface-raised text-text-muted'
            }`}>
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('pinned')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'pinned'
                ? 'bg-accent text-text shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <Pin className="w-3.5 h-3.5 fill-current" />
            <span>{isArabic ? 'المثبتة' : 'Pinned'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeFilter === 'pinned' ? 'bg-surface text-text font-bold' : 'bg-surface-raised text-text-muted'
            }`}>
              {counts.pinned}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('reminders')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'reminders'
                ? 'bg-accent text-text shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isArabic ? 'تذكيرات المتابعة' : 'Reminders'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeFilter === 'reminders' ? 'bg-surface text-text font-bold' : 'bg-surface-raised text-text-muted'
            }`}>
              {counts.reminders}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('interactions')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'interactions'
                ? 'bg-accent text-text shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isArabic ? 'سجل التفاعلات' : 'Interactions'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeFilter === 'interactions' ? 'bg-surface text-text font-bold' : 'bg-surface-raised text-text-muted'
            }`}>
              {counts.interactions}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isArabic ? 'بحث في الملاحظات أو الوسوم...' : 'Search notes or tags...'}
            className="w-full bg-surface border border-border rounded-xl pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* STREAM OF NOTES & COMMENTS */}
      <div className="space-y-3.5">
        {filteredComments.length === 0 ? (
          <div className="p-8 text-center bg-surface rounded-2xl border border-border space-y-2">
            <MessageSquare className="w-8 h-8 text-text-muted mx-auto" />
            <h4 className="text-sm font-semibold text-text-muted">
              {isArabic ? 'لا توجد ملاحظات مطابقة للتصفية الحالية' : 'No notes match the current filter'}
            </h4>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              {isArabic 
                ? 'استخدم صندوق الإضافة أعلاه لتدوين ملاحظاتك وتثبيت التنبيهات أو إرفاق تذكيرات المتابعة.' 
                : 'Use the composer above to add internal notes, pin important alerts, or schedule follow-up reminders.'}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => {
            const dateFormatted = new Date(comment.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const isPinnedItem = comment.isPinned;
            const hasReminder = !!comment.reminder;
            const hasInteraction = !!comment.interaction;

            return (
              <div
                key={comment.id}
                className={`p-4 sm:p-5 rounded-2xl border transition shadow-lg ${
                  isPinnedItem
                    ? 'bg-gradient-to-br from-accent via-surface to-surface border-accent shadow-accent/20'
                    : 'bg-surface border-border hover:border-border'
                }`}
              >
                {/* CARD HEADER: AUTHOR, PIN BADGE, TIMESTAMP, ACTIONS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isPinnedItem
                        ? 'bg-accent text-text shadow-md shadow-accent/20'
                        : 'bg-surface-raised text-text border border-border'
                    }`}>
                      {comment.author.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{comment.author}</span>
                        {comment.authorRole && (
                          <span className="text-[10px] text-text-muted">({comment.authorRole})</span>
                        )}
                        {isPinnedItem && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-accent border border-accent flex items-center gap-1">
                            <Pin className="w-3 h-3 text-accent fill-accent" />
                            <span>{isArabic ? 'ملاحظة مثبتة' : 'Pinned Note'}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-muted">{dateFormatted}</span>
                    </div>
                  </div>

                  {/* Header Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {/* Pin / Unpin Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin(comment.id)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        isPinnedItem
                          ? 'bg-accent text-accent border-accent hover:bg-accent'
                          : 'bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white border-border'
                      }`}
                      title={isPinnedItem ? (isArabic ? 'إلغاء تثبيت الملاحظة' : 'Unpin note') : (isArabic ? 'تثبيت الملاحظة في الأعلى' : 'Pin to top')}
                    >
                      {isPinnedItem ? (
                        <>
                          <PinOff className="w-3.5 h-3.5 text-accent" />
                          <span className="text-[10px]">{isArabic ? 'إلغاء التثبيت' : 'Unpin'}</span>
                        </>
                      ) : (
                        <>
                          <Pin className="w-3.5 h-3.5" />
                          <span className="text-[10px]">{isArabic ? 'تثبيت' : 'Pin'}</span>
                        </>
                      )}
                    </button>

                    {/* Copy Text */}
                    <button
                      type="button"
                      onClick={() => handleCopyComment(comment.id, comment.content)}
                      className="p-1.5 rounded-lg bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white border border-border transition cursor-pointer"
                      title={isArabic ? 'نسخ نص الملاحظة' : 'Copy note content'}
                    >
                      {copiedId === comment.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete Note */}
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1.5 rounded-lg bg-surface-raised hover:bg-rose-500/20 text-text-muted hover:text-rose-400 border border-border hover:border-rose-500/30 transition cursor-pointer"
                      title={isArabic ? 'حذف الملاحظة' : 'Delete note'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* RICH-TEXT NOTE BODY */}
                <div className="py-1">
                  {renderFormattedText(comment.content)}
                </div>

                {/* ATTACHED FOLLOW-UP REMINDER BANNER */}
                {hasReminder && comment.reminder && (
                  <div className={`mt-3.5 p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    comment.reminder.completed
                      ? 'bg-surface border-border text-text-muted'
                      : comment.reminder.priority === 'urgent'
                      ? 'bg-rose-500/10 border-rose-500/40 text-text shadow-sm'
                      : 'bg-accent border-accent text-text'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleReminder(comment.id)}
                        className="mt-0.5 text-text-muted hover:text-white cursor-pointer shrink-0"
                        title={comment.reminder.completed ? (isArabic ? 'إعادة تعيين كمعلق' : 'Mark as pending') : (isArabic ? 'تحديد كمنجز' : 'Mark as done')}
                      >
                        {comment.reminder.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-accent" />
                        )}
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${comment.reminder.completed ? 'line-through text-text-muted' : 'text-white'}`}>
                            {comment.reminder.title}
                          </span>
                          {/* Priority badge */}
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            comment.reminder.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : comment.reminder.priority === 'high'
                              ? 'bg-accent text-accent border border-accent'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}>
                            {comment.reminder.priority.toUpperCase()}
                          </span>
                        </div>

                        {comment.reminder.clientName && (
                          <div className="text-[11px] text-text-muted">
                            <span>{isArabic ? 'العميل: ' : 'Client: '}</span>
                            <strong className="text-text">{comment.reminder.clientName}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-xs">
                      <div className="flex items-center gap-1 font-mono font-semibold text-accent">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>{comment.reminder.dueDate}</span>
                        {comment.reminder.dueTime && <span>({comment.reminder.dueTime})</span>}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleReminder(comment.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                          comment.reminder.completed
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-accent hover:bg-accent text-text border-accent'
                        }`}
                      >
                        {comment.reminder.completed 
                          ? (isArabic ? 'منجز ✓' : 'Done ✓') 
                          : (isArabic ? 'إنجاز المهمة' : 'Mark Done')}
                      </button>
                    </div>
                  </div>
                )}

                {/* ATTACHED INTERACTION LOG BANNER */}
                {hasInteraction && comment.interaction && (
                  <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between border-b border-blue-500/20 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase flex items-center gap-1">
                          {comment.interaction.type === 'call' && <Phone className="w-3 h-3" />}
                          {comment.interaction.type === 'whatsapp' && <MessageCircle className="w-3 h-3" />}
                          {comment.interaction.type === 'viewing' && <Eye className="w-3 h-3" />}
                          {comment.interaction.type === 'meeting' && <Users className="w-3 h-3" />}
                          {comment.interaction.type === 'offer' && <DollarSign className="w-3 h-3" />}
                          <span>{comment.interaction.type}</span>
                        </span>
                        {comment.interaction.clientName && (
                          <span className="font-semibold text-text">
                            {comment.interaction.clientName}
                          </span>
                        )}
                        {comment.interaction.clientPhone && (
                          <span className="text-[11px] font-mono text-text-muted">
                            ({comment.interaction.clientPhone})
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] font-mono text-text-muted">
                        {comment.interaction.date} {comment.interaction.time && `• ${comment.interaction.time}`}
                      </div>
                    </div>

                    {comment.interaction.outcome && (
                      <div className="text-[11px] text-blue-200 flex items-center gap-1.5 pt-0.5">
                        <strong className="text-blue-400">{isArabic ? 'النتيجة والمتابعة:' : 'Outcome:'}</strong>
                        <span>{comment.interaction.outcome}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* TAGS FOOTER */}
                {comment.tags && comment.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2.5 mt-2 border-t border-border">
                    {comment.tags.map((t, tidx) => (
                      <span
                        key={tidx}
                        className="px-2 py-0.5 rounded-md bg-surface-raised text-text-muted hover:text-text text-[10px] font-mono transition"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
