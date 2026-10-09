import { FollowUpTask } from '../types';

// Helper to guarantee an active task is scheduled within the next 2 hours for live alerts
const getImminentDueTime = (offsetMinutes = 75) => {
  const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export const INITIAL_TASKS: FollowUpTask[] = [
  {
    id: 'TSK-1008',
    title: 'متابعة شيك جدية الحجز المنتهي لفيلا جراند هايتس (متأخرة)',
    clientName: 'م/ إبراهيم شكري',
    clientPhone: '+201019988443',
    unitId: 'OCT-105',
    compound: 'O West Orascom',
    dealValue: 16800000,
    stage: 'negotiation',
    type: 'payment',
    category: 'followup',
    priority: 'urgent',
    dueDate: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10), // 2 days overdue
    dueTime: '11:00',
    agent: 'كريم عز الدين',
    notes: 'تأخر العميل يومين عن إيداع شيك جدية الحجز، والمطور يهدد بإلغاء تخصيص الفيلا وطرحها لمشترٍ آخر.',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    timeInStageDays: 6,
    subtasks: [
      { id: 'sub-81', title: 'الاتصال بالعميل لتأكيد موعد الإيداع البنكي', completed: true },
      { id: 'sub-82', title: 'طلب مهلة استثنائية 24 ساعة من إدارة مبيعات المطور', completed: false },
      { id: 'sub-83', title: 'استلام صورة إشعار التحويل البنكي', completed: false }
    ]
  },
  {
    id: 'TSK-1009',
    title: 'إرسال عقود الصيانة ورسوم التنازل لشقة بادية (متأخرة)',
    clientName: 'أ/ نهال سامي',
    clientPhone: '+201123344556',
    unitId: 'UNT-1049',
    compound: 'Badya Palm Hills',
    dealValue: 7400000,
    stage: 'contract',
    type: 'contract',
    category: 'contract',
    priority: 'high',
    dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10), // 1 day overdue
    dueTime: '16:30',
    agent: 'سارة نبيل',
    notes: 'كان يجب إرسال بيان وديعة الصيانة ومصاريف التنازل أمس قبل نهاية ساعات العمل بالمقر الإداري.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    timeInStageDays: 4,
    subtasks: [
      { id: 'sub-91', title: 'استخراج كشف حساب وديعة الصيانة من قسم الحسابات', completed: true },
      { id: 'sub-92', title: 'إرسال المستندات للعميل وتحديد موعد التوقيع', completed: false }
    ]
  },
  {
    id: 'TSK-1001',
    title: 'معاينة ميدانية لوحدة ماونتن فيو آي سيتي عمارة 12',
    clientName: 'م/ ياسر سلام',
    clientPhone: '+201001234567',
    unitId: 'S-0001',
    compound: 'Mountain View iCity',
    dealValue: 8750000,
    stage: 'viewing',
    type: 'visit',
    category: 'visit',
    priority: 'urgent',
    dueDate: new Date().toISOString().slice(0, 10), // Today
    dueTime: getImminentDueTime(75), // Within next 2 hours for alert
    agent: 'سارة نبيل',
    notes: 'العميل مهتم جداً بوحدة الدور الثاني، وتأكيد موعد الدخول من بوابة كلوب بارك مع إحضار بطاقة الرقم القومي.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    timeInStageDays: 2,
    subtasks: [
      { id: 'sub-1', title: 'إصدار تصريح بوابة كمبوند ماونتن فيو', completed: true },
      { id: 'sub-2', title: 'مراجعة مفاتيح الوحدة مع أمن المرحلة', completed: true },
      { id: 'sub-3', title: 'مرافقة العميل ومعاينة الإطلالة وموقف السيارات', completed: false },
      { id: 'sub-4', title: 'توقيع إقرار المعاينة واستطلاع رأي العميل', completed: false }
    ]
  },
  {
    id: 'TSK-1002',
    title: 'توقيع عقد ابتدائي واستلام شيك مقدم الحجز',
    clientName: 'د/ خالد رضوان',
    clientPhone: '+201556678899',
    unitId: 'OCT-102',
    compound: 'Palm Hills Golf',
    dealValue: 24500000,
    stage: 'contract',
    type: 'contract',
    category: 'contract',
    priority: 'urgent',
    dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // Tomorrow
    dueTime: '11:30',
    agent: 'عمر عادل',
    notes: 'تم الاتفاق النهائي على خصم 5% للدفع الكاش، العقد جاهز مع الشؤون القانونية ومطلوب نسخة من التوكيل.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    dependsOnTaskId: 'TSK-1007',
    dependsOnTitle: 'اعتماد مسودة العقد من الإدارة القانونية',
    timeInStageDays: 3,
    subtasks: [
      { id: 'sub-21', title: 'مراجعة بنود غرامة التأخير والتسليم', completed: true },
      { id: 'sub-22', title: 'تجهيز دفاتر الشيكات البنكية للمشتري', completed: true },
      { id: 'sub-23', title: 'جلسة التوقيع بحضور المالك والمشتري', completed: false }
    ]
  },
  {
    id: 'TSK-1003',
    title: 'جلسة مفاوضات واجتماع لمناقشة سداد بنتهاوس تشيل أوت بارك',
    clientName: 'أ/ طارق عبد الحميد',
    clientPhone: '+201223345566',
    unitId: 'OCT-101',
    compound: 'Chillout Park',
    dealValue: 12000000,
    stage: 'negotiation',
    type: 'meeting',
    category: 'meeting',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    dueTime: '14:00',
    agent: 'أحمد علي',
    notes: 'العميل يطلب مد فترة الأقساط إلى 8 سنوات بدلاً من 7 مع زيادة دفعة الاستلام بنسبة 5%.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    dependsOnTaskId: 'TSK-1001',
    dependsOnTitle: 'إتمام المعاينة الميدانية الأولى',
    timeInStageDays: 4,
    subtasks: [
      { id: 'sub-31', title: 'طلب موافقة المطور على جدول السداد المعدل', completed: true },
      { id: 'sub-32', title: 'إرسال جدول الأقساط المحدث للعميل', completed: false }
    ]
  },
  {
    id: 'TSK-1004',
    title: 'متابعة إرسال بروشور وخطة أسعار بادية بالم هيلز عبر واتساب',
    clientName: 'أ/ داليا فاروق',
    clientPhone: '+201064457788',
    compound: 'Badya Palm Hills',
    dealValue: 6200000,
    stage: 'contacted',
    type: 'whatsapp',
    category: 'followup',
    priority: 'medium',
    dueDate: new Date().toISOString().slice(0, 10), // Today
    dueTime: '15:00', // Same hour as TSK-1001 for سارة نبيل -> Overlap Conflict!
    agent: 'سارة نبيل',
    notes: 'تبحث عن شقة 3 غرف تسليم 2026 بالقرب من الجامعة البريطانية في بادية أكتوبر.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    timeInStageDays: 1,
    subtasks: [
      { id: 'sub-41', title: 'تجهيز ملف الـ Master Plan والمساحات', completed: true },
      { id: 'sub-42', title: 'إرسال جدول الأقساط وتحديد موعد اتصال هاتفي', completed: false }
    ]
  },
  {
    id: 'TSK-1005',
    title: 'مكالمة هاتفية ترحيبية وتحديد متطلبات عميل جديد من إعلان الفيسبوك',
    clientName: 'د/ منى الشريف',
    clientPhone: '+201119876543',
    compound: 'O West Orascom',
    dealValue: 9500000,
    stage: 'lead',
    type: 'call',
    category: 'call',
    priority: 'high',
    dueDate: new Date().toISOString().slice(0, 10), // Today
    dueTime: '12:00',
    agent: 'نور طارق',
    notes: 'مهتمة بتاون هاوس كورنر في O West أوراسكوم، الميزانية بين 9 إلى 10 ملايين جنيه.',
    createdAt: new Date().toISOString(),
    timeInStageDays: 1,
    subtasks: [
      { id: 'sub-51', title: 'تسجيل المتطلبات في بطاقة العميل', completed: true },
      { id: 'sub-52', title: 'ترشيح وحدتين مطابقتين للميزانية', completed: false }
    ]
  },
  {
    id: 'TSK-1006',
    title: 'إتمام نقل الملكية وتوثيق الشهر العقاري وتسليم المفاتيح',
    clientName: 'م/ مصطفى كامل',
    clientPhone: '+201009988776',
    compound: 'Karmell Sodic',
    dealValue: 15200000,
    stage: 'completed',
    type: 'contract',
    category: 'contract',
    priority: 'medium',
    dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    dueTime: '10:00',
    agent: 'عمر عادل',
    notes: 'تم استلام الشيكات وإيداعها في حساب الشركة، واستلام المشتري لمفتاح الشقة ومخالصة الصيانة.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    timeInStageDays: 5,
    subtasks: [
      { id: 'sub-61', title: 'سداد رسوم التنازل والمصروفات الإدارية', completed: true },
      { id: 'sub-62', title: 'استلام مخالصة نهائية من شركة سوديك', completed: true },
      { id: 'sub-63', title: 'تسليم محاضر الاستلام والمفاتيح للمشتري', completed: true }
    ]
  },
  {
    id: 'TSK-1007',
    title: 'اجتماع مع الإدارة القانونية لصياغة ومراجعة مسودة العقد النهائي لفيلا بالم هيلز',
    clientName: 'د/ خالد رضوان',
    clientPhone: '+201556678899',
    unitId: 'OCT-102',
    compound: 'Palm Hills Golf',
    dealValue: 24500000,
    stage: 'negotiation',
    type: 'meeting',
    category: 'meeting',
    priority: 'urgent',
    dueDate: new Date().toISOString().slice(0, 10),
    dueTime: '13:00',
    agent: 'عمر عادل',
    notes: 'مهمة مسبقة تسبق التوقيع النهائي، وتتضمن التأكد من خلو الوحدة من أي التزامات بنكية.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    timeInStageDays: 2,
    subtasks: [
      { id: 'sub-71', title: 'التأكد من التوكيلات وسندات الملكية', completed: true },
      { id: 'sub-72', title: 'إرسال المسودة للمشتري للموافقة المبدئية', completed: true }
    ]
  }
];
