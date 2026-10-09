import { ClientLead } from '../types';

export const INITIAL_CLIENTS: ClientLead[] = [
  {
    id: 'CLT-801',
    name: 'م/ ياسر سلام',
    phone: '+201001234567',
    email: 'yasser.sallam@eng-group.com',
    company: 'سيكتور للاستشارات الهندسية',
    rating: 'hot',
    source: 'referral',
    stage: 'viewing',
    targetBudgetMin: 8000000,
    targetBudgetMax: 12000000,
    purpose: 'buy',
    targetPropertyType: 'شقة فاخرة / بنتهاوس',
    targetCompound: 'ماونتن فيو آي سيتي (Mountain View iCity)',
    assignedAgent: 'سارة نبيل',
    dealValue: 8750000,
    probability: 75,
    expectedCloseDate: '2026-10-15',
    notes: 'العميل جاهز بمقدم 2.5 مليون كاش، يبحث عن تسليم فوري أو خلال 6 أشهر مع فيو مباشر على الكريستال لاجون.',
    interactionLogs: [
      {
        id: 'LOG-01',
        date: '2026-09-22',
        time: '14:30',
        type: 'meeting',
        agent: 'سارة نبيل',
        summary: 'جلسة تعارف بالمكتب وعرض مخطط مشروع آي سيتي، وتم اختيار عمارة 12 الدور الثاني.',
        outcome: 'تم الاتفاق على موعد معاينة ميدانية اليوم الساعة 3:00 عصراً'
      },
      {
        id: 'LOG-02',
        date: '2026-09-20',
        time: '11:15',
        type: 'whatsapp',
        agent: 'سارة نبيل',
        summary: 'إرسال بروشور الوحدات المتاحة مع كراسة الشروط وجداول السداد للريسيل.'
      }
    ],
    createdAt: '2026-09-18'
  },
  {
    id: 'CLT-802',
    name: 'د/ خالد رضوان',
    phone: '+201556678899',
    email: 'dr.khaled.radwan@medcare.org',
    company: 'مجموعة مستشفيات الصفا',
    rating: 'hot',
    source: 'direct',
    stage: 'negotiation',
    targetBudgetMin: 22000000,
    targetBudgetMax: 28000000,
    purpose: 'buy',
    targetPropertyType: 'فيلا ستاند ألون (Standalone Villa)',
    targetCompound: 'بالم هيلز جولف (Palm Hills Golf)',
    assignedAgent: 'عمر عادل',
    dealValue: 24500000,
    probability: 90,
    expectedCloseDate: '2026-10-05',
    notes: 'تم التفاوض على خصم 5% للدفع الكاش، وصياغة مسودة العقد الابتدائي مع المستشار القانوني.',
    interactionLogs: [
      {
        id: 'LOG-03',
        date: '2026-09-23',
        time: '11:00',
        type: 'call',
        agent: 'عمر عادل',
        summary: 'مكالمة هاتفية لتأكيد استلام مسودة العقد وتحديد موعد التوقيع غداً الساعة 11:30 صباحاً.',
        outcome: 'موافقة العميل على البنود وتجهيز شيك مقدم الحجز'
      }
    ],
    createdAt: '2026-09-10'
  },
  {
    id: 'CLT-803',
    name: 'أ/ طارق عبد الحميد',
    phone: '+201223345566',
    email: 'tareq.h@capital-invest.eg',
    company: 'كابيتال تداول واستثمار',
    rating: 'warm',
    source: 'property_finder',
    stage: 'qualified',
    targetBudgetMin: 10000000,
    targetBudgetMax: 14000000,
    purpose: 'invest',
    targetPropertyType: 'بنتهاوس مع روف خاص',
    targetCompound: 'تشيل أوت بارك (Chillout Park)',
    assignedAgent: 'أحمد علي',
    dealValue: 12000000,
    probability: 60,
    expectedCloseDate: '2026-10-25',
    notes: 'مهتم بعائد الإيجار السنوي المتوقع (ROI) لا يقل عن 10% سنوياً.',
    interactionLogs: [
      {
        id: 'LOG-04',
        date: '2026-09-21',
        time: '16:00',
        type: 'call',
        agent: 'أحمد علي',
        summary: 'مناقشة تحليل العائد الاستثماري لإيجار البنتهاوس المفروش للمغتربين والشركات بالأسبوع والشهر.'
      }
    ],
    createdAt: '2026-09-15'
  },
  {
    id: 'CLT-804',
    name: 'د/ منى الشريف',
    phone: '+201119876543',
    email: 'mona.elsharif@pharma.com',
    rating: 'hot',
    source: 'facebook',
    stage: 'new',
    targetBudgetMin: 8500000,
    targetBudgetMax: 10500000,
    purpose: 'buy',
    targetPropertyType: 'تاون هاوس كورنر (Townhouse Corner)',
    targetCompound: 'أو ويست أوراسكوم (O West Orascom)',
    assignedAgent: 'نور طارق',
    dealValue: 9500000,
    probability: 40,
    expectedCloseDate: '2026-11-10',
    notes: 'استفسار قادم من حملة الفيسبوك الإعلانية، ميزانية واضحة، تفضل استلام 2026 بأقساط متساوية.',
    interactionLogs: [
      {
        id: 'LOG-05',
        date: '2026-09-23',
        time: '10:15',
        type: 'call',
        agent: 'نور طارق',
        summary: 'مكالمة ترحيبية وتحديد المتطلبات الأساسية، وطلب مشاركة المخطط العام عبر واتساب.'
      }
    ],
    createdAt: '2026-09-23'
  },
  {
    id: 'CLT-805',
    name: 'أ/ داليا فاروق',
    phone: '+201064457788',
    email: 'dalia.f@fintech-hub.com',
    rating: 'warm',
    source: 'aqarmap',
    stage: 'contacted',
    targetBudgetMin: 5500000,
    targetBudgetMax: 7000000,
    purpose: 'buy',
    targetPropertyType: 'شقة 3 غرف نوم',
    targetCompound: 'بادية بالم هيلز (Badya Palm Hills)',
    assignedAgent: 'سارة نبيل',
    dealValue: 6200000,
    probability: 50,
    expectedCloseDate: '2026-11-01',
    notes: 'تبحث عن شقة تسليم قريب بجوار المدارس الدولية وجامعة بادية.',
    interactionLogs: [
      {
        id: 'LOG-06',
        date: '2026-09-22',
        time: '18:20',
        type: 'whatsapp',
        agent: 'سارة نبيل',
        summary: 'إرسال بروشور تفصيلي لوحدات بادية بالم هيلز المتاحة بخطط سداد حتى 8 سنوات.'
      }
    ],
    createdAt: '2026-09-19'
  },
  {
    id: 'CLT-806',
    name: 'م/ مصطفى كامل',
    phone: '+201009988776',
    email: 'm.kamel@techventures.io',
    company: 'تك فينتشرز للبرمجيات',
    rating: 'cold',
    source: 'referral',
    stage: 'won',
    targetBudgetMin: 14000000,
    targetBudgetMax: 16000000,
    purpose: 'buy',
    targetPropertyType: 'تاون هاوس ميدل',
    targetCompound: 'كارميل سوديك (Karmell Sodic)',
    assignedAgent: 'عمر عادل',
    dealValue: 15200000,
    probability: 100,
    expectedCloseDate: '2026-09-20',
    notes: 'تم إتمام الصفقة واستلام المفاتيح ومخالصة الصيانة بنجاح.',
    interactionLogs: [
      {
        id: 'LOG-07',
        date: '2026-09-20',
        time: '13:00',
        type: 'proposal',
        agent: 'عمر عادل',
        summary: 'توقيع العقد النهائي بمكتب الشهر العقاري ونقل ملكية عدادات الكهرباء والمياه.'
      }
    ],
    createdAt: '2026-08-25'
  }
];
