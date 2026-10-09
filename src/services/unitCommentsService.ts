import { formatNumber } from '../i18n/format';
import { Unit, UnitCommentEntry } from '../types';

/**
 * Returns existing unit comments/notes or generates realistic default history
 * tailored specifically to the unit's compound, pricing, and status.
 */
export function getUnitComments(unit: Unit): UnitCommentEntry[] {
  if (unit.comments && unit.comments.length > 0) {
    return sortComments(unit.comments);
  }

  // Synthesize realistic default comments, pinned notes, and interactions
  const now = new Date();
  const daysAgo = (days: number, hours = 0) => {
    const d = new Date(now.getTime() - (days * 24 * 60 + hours * 60) * 60 * 1000);
    return d.toISOString();
  };

  const agentName = unit.agent || 'Karim Samy';
  const ownerName = unit.ownerName || 'Haj Mahmoud El-Gohary';

  const defaultComments: UnitCommentEntry[] = [
    // 1. PINNED INTERNAL NOTE WITH ATTACHED FOLLOW-UP REMINDER
    {
      id: `comment-${unit.id}-1`,
      unitId: unit.id,
      author: agentName,
      authorRole: 'Senior Property Consultant',
      createdAt: daysAgo(2, 4),
      isPinned: true,
      pinnedAt: daysAgo(2, 4),
      category: 'internal_note',
      tags: ['تنبيه_داخلي', 'مفاوضات_المالك', 'أولوية_قصوى'],
      content: `📌 **ملاحظة إدارية سرية للمستشارين:**\n` +
        `• المالك (${ownerName}) متفهم وقابل للتفاوض النقدي حتى **${(formatNumber(Math.round(Number(unit.price) * 0.94)))} ${unit.currency}** كحد أدنى في حال سداد دفعة فورية.\n` +
        `• مفاتيح المعاينة مودعة حالياً لدى مكتب الأمن الداخلي ببوابة رقم 2 - كمبوند ${unit.compound}.\n` +
        `• يرجى إبراز كارنيه الشركة المعتمد لأفراد الحراسة قبل موعد المعاينة بربع ساعة.`,
      reminder: {
        id: `rem-${unit.id}-1`,
        title: `الاتصال بالمالك (${ownerName}) لتأكيد موعد معاينة وفد المستثمرين`,
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dueTime: '15:30',
        assignedAgent: agentName,
        priority: 'urgent',
        completed: false,
        clientName: 'د. طارق الشناوي (مشتري محتمل)'
      }
    },

    // 2. RECENT CLIENT INTERACTION (Field Viewing)
    {
      id: `comment-${unit.id}-2`,
      unitId: unit.id,
      author: 'Sarah Nabil',
      authorRole: 'Property Advisor',
      createdAt: daysAgo(1, 6),
      isPinned: false,
      category: 'client_interaction',
      tags: ['معاينة_ميدانية', 'عميل_مهتم', 'تقييم_فني'],
      content: `🏡 **تمت المعاينة الميدانية مع العميل (م. ياسين السعدني):**\n` +
        `• العميل أبدى إعجابه الكبير بفيو المساحات الخضراء والتهوية الطبيعية للدور.\n` +
        `• استفسر عن إمكانية تعديل جدار المطبخ المفتوح على الريسبشن (American Kitchen).\n` +
        `• طلب جدولاً مفصلاً للأقساط الربع سنوية على 5 سنوات بدون فوائد.`,
      interaction: {
        id: `int-${unit.id}-1`,
        type: 'viewing',
        clientName: 'م. ياسين السعدني',
        clientPhone: '+20 101 234 5678',
        agent: 'Sarah Nabil',
        date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '16:00',
        summary: 'معاينة عائلية شاملة لمطابقة المساحة وارتفاع الأسقف',
        outcome: 'العميل بانتظار عرض السعر الرسمي المعتمد خلال 48 ساعة'
      }
    },

    // 3. WHATSAPP & PRICE NEGOTIATION LOG
    {
      id: `comment-${unit.id}-3`,
      unitId: unit.id,
      author: agentName,
      authorRole: 'Senior Property Consultant',
      createdAt: daysAgo(3, 2),
      isPinned: false,
      category: 'price_negotiation',
      tags: ['واتساب', 'عرض_سعر', 'سداد_كاش'],
      content: `💬 **محادثة واتساب ومتابعة شروط السداد:**\n` +
        `تم إرسال بروشور الوحدة الرسمي عبر الواتساب مع توضيح خصم الكاش الفوري (8%).\n` +
        `العميل يدرس سداد دفعة مقدمة 30% مع تقسيط المتبقي على سنتين ونصف.`,
      interaction: {
        id: `int-${unit.id}-2`,
        type: 'whatsapp',
        clientName: 'د. منى عبد الرحمن',
        clientPhone: '+20 109 876 5432',
        agent: agentName,
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '11:45',
        summary: 'إرسال البروشور الرقمي وقائمة التشطيبات',
        outcome: 'موافقة مبدئية وجاري مراجعة جدول التدفقات المالية'
      }
    },

    // 4. TECHNICAL INSPECTION & LEGAL STATUS
    {
      id: `comment-${unit.id}-4`,
      unitId: unit.id,
      author: 'Eng. Karim Samy',
      authorRole: 'Quality & Inspection Lead',
      createdAt: daysAgo(6),
      isPinned: false,
      category: 'inspection',
      tags: ['فحص_هندسي', 'موقف_قانوني', 'توثيق'],
      content: `📝 **تقرير الفحص الفني والموقف القانوني:**\n` +
        `• تم فحص تمديدات التكييف والكهرباء ومطابقة العدادات.\n` +
        `• سلامة تسلسل الملكية وتوافر مخالصة الصيانة ورسوم الجراج تحت الأرض.\n` +
        `• الوحدة جاهزة فوراً للإفراغ وتوقيع استمارة الحجز النهائي.`
    }
  ];

  return sortComments(defaultComments);
}

/**
 * Sorts comments: Pinned items first (ordered by pinnedAt or createdAt desc),
 * followed by unpinned items ordered by createdAt desc.
 */
export function sortComments(comments: UnitCommentEntry[]): UnitCommentEntry[] {
  return [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Adds a new comment or interaction to the unit, returning the updated Unit object.
 */
export function addCommentToUnit(
  unit: Unit,
  newCommentData: Omit<UnitCommentEntry, 'id' | 'createdAt' | 'unitId'>
): Unit {
  const existingComments = unit.comments && unit.comments.length > 0 
    ? unit.comments 
    : getUnitComments(unit);

  const newComment: UnitCommentEntry = {
    ...newCommentData,
    id: `comment-${unit.id}-${Date.now()}`,
    unitId: unit.id,
    createdAt: new Date().toISOString(),
    pinnedAt: newCommentData.isPinned ? new Date().toISOString() : undefined
  };

  const updatedComments = sortComments([newComment, ...existingComments]);

  return {
    ...unit,
    comments: updatedComments
  };
}

/**
 * Toggles the pinned status of a comment on the unit.
 */
export function toggleCommentPin(unit: Unit, commentId: string): Unit {
  const existingComments = unit.comments && unit.comments.length > 0 
    ? unit.comments 
    : getUnitComments(unit);

  const updated = existingComments.map(c => {
    if (c.id === commentId) {
      const nextPinned = !c.isPinned;
      return {
        ...c,
        isPinned: nextPinned,
        pinnedAt: nextPinned ? new Date().toISOString() : undefined
      };
    }
    return c;
  });

  return {
    ...unit,
    comments: sortComments(updated)
  };
}

/**
 * Toggles a reminder's completed state.
 */
export function toggleReminderState(unit: Unit, commentId: string): Unit {
  const existingComments = unit.comments && unit.comments.length > 0 
    ? unit.comments 
    : getUnitComments(unit);

  const updated = existingComments.map(c => {
    if (c.id === commentId && c.reminder) {
      const nextCompleted = !c.reminder.completed;
      return {
        ...c,
        reminder: {
          ...c.reminder,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined
        }
      };
    }
    return c;
  });

  return {
    ...unit,
    comments: sortComments(updated)
  };
}

/**
 * Deletes a comment from the unit.
 */
export function deleteCommentFromUnit(unit: Unit, commentId: string): Unit {
  const existingComments = unit.comments && unit.comments.length > 0 
    ? unit.comments 
    : getUnitComments(unit);

  const updated = existingComments.filter(c => c.id !== commentId);

  return {
    ...unit,
    comments: sortComments(updated)
  };
}
