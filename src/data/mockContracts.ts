export type ContractType = 'sale' | 'rent' | 'exclusive_marketing' | 'brokerage_agreement';

export interface SalesContract {
  id: string;
  contractNumber: string;
  unitId: string;
  compound: string;
  area: string;
  clientName: string;
  clientPhone?: string;
  dealValue: number; // in EGP
  closingDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD - تاريخ انتهاء العقد الموثق لمتابعة التجديد
  contractType?: ContractType; // طبيعة العقد (بيع / إيجار / تسويق حصري / وساطة)
  renewalStatus?: 'active' | 'expiring_soon' | 'expired' | 'renewed';
  agentName: string;
  commissionRate: number; // e.g. 2.5%
  totalCommission: number; // dealValue * commissionRate / 100
  agentShareRate: number; // e.g. 45% or 50%
  agentCommissionAmount: number; // totalCommission * agentShareRate / 100
  status: 'paid' | 'approved' | 'pending';
  paymentDate?: string;
  notes?: string;
  renewedUntil?: string;
}

// Generate dynamic dates relative to current date so the 7-day alert is always accurate and active
const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const INITIAL_CONTRACTS: SalesContract[] = [
  {
    id: 'CNT-001',
    contractNumber: '6O-2026-081',
    unitId: 'S-0001',
    compound: 'Mountain View iCity',
    area: '6 October',
    clientName: 'د. طارق السعيد',
    clientPhone: '01019876543',
    dealValue: 7850000,
    closingDate: '2026-03-25',
    expiryDate: getRelativeDate(3), // ⚠️ ينتهي خلال 3 أيام (أقل من 7 أيام!)
    contractType: 'exclusive_marketing',
    agentName: 'سارة نبيل',
    commissionRate: 2.5,
    totalCommission: 196250,
    agentShareRate: 50,
    agentCommissionAmount: 98125,
    status: 'paid',
    paymentDate: '2026-09-18',
    notes: 'عقد تسويق ووساطة حصري موثق - يتطلب التجديد السنوي لضمان حصرية البيع'
  },
  {
    id: 'CNT-002',
    contractNumber: '6O-2026-079',
    unitId: 'OCT-102',
    compound: 'Palm Hills October',
    area: '6 October',
    clientName: 'م. أحمد توفيق',
    clientPhone: '01122334455',
    dealValue: 12500000,
    closingDate: '2025-09-28',
    expiryDate: getRelativeDate(5), // ⚠️ ينتهي خلال 5 أيام (أقل من 7 أيام!)
    contractType: 'brokerage_agreement',
    agentName: 'عمر عادل',
    commissionRate: 2.5,
    totalCommission: 312500,
    agentShareRate: 50,
    agentCommissionAmount: 156250,
    status: 'paid',
    paymentDate: '2026-09-14',
    notes: 'اتفاقية عمولة وساطة عقارية للفيلا المستقلة - تنتهي بعد 5 أيام وتحتاج متابعة التجديد'
  },
  {
    id: 'CNT-003',
    contractNumber: '6O-2026-084',
    unitId: 'UNT-1049',
    compound: 'Badya Palm Hills',
    area: '6 October',
    clientName: 'أ. سامح عبد الفتاح',
    clientPhone: '01234567890',
    dealValue: 5600000,
    closingDate: '2026-09-20',
    expiryDate: getRelativeDate(7), // ⚠️ ينتهي تماماً خلال 7 أيام!
    contractType: 'sale',
    agentName: 'نور طارق',
    commissionRate: 2.5,
    totalCommission: 140000,
    agentShareRate: 45,
    agentCommissionAmount: 63000,
    status: 'approved',
    notes: 'عقد حجز ابتدائي موثق لمدة محددة - يجب استكمال التوقيع النهائي قبل الانتهاء'
  },
  {
    id: 'CNT-004',
    contractNumber: '6O-2026-088',
    unitId: 'ZAY-204',
    compound: 'Beverly Hills Sodic',
    area: 'Sheikh Zayed',
    clientName: 'م. خالد الحجازي',
    clientPhone: '01099887766',
    dealValue: 9200000,
    closingDate: '2026-09-22',
    expiryDate: getRelativeDate(-2), // ❌ منتهي منذ يومين
    contractType: 'exclusive_marketing',
    agentName: 'أحمد علي',
    commissionRate: 2.5,
    totalCommission: 230000,
    agentShareRate: 45,
    agentCommissionAmount: 103500,
    status: 'pending',
    notes: 'عقد تسويق حصري منتهي - يتطلب تجديد عاجل مع المالك بالشهر العقاري'
  },
  {
    id: 'CNT-005',
    contractNumber: '6O-2026-090',
    unitId: 'OCT-105',
    compound: 'O West Orascom',
    area: '6 October',
    clientName: 'د. منى الشناوي',
    clientPhone: '01155443322',
    dealValue: 8400000,
    closingDate: '2026-09-23',
    expiryDate: getRelativeDate(180), // ساري لـ 6 أشهر قادمة
    contractType: 'sale',
    agentName: 'سارة نبيل',
    commissionRate: 2.5,
    totalCommission: 210000,
    agentShareRate: 50,
    agentCommissionAmount: 105000,
    status: 'approved',
    notes: 'استلام مقدم الحجز والتعاقد الابتدائي - العقد ساري'
  },
  {
    id: 'CNT-006',
    contractNumber: '6O-2026-094',
    unitId: 'RNT-201',
    compound: 'Zed Towers',
    area: 'Sheikh Zayed',
    clientName: 'أ. طه الديب',
    clientPhone: '01055667788',
    dealValue: 1800000,
    closingDate: '2026-09-10',
    expiryDate: getRelativeDate(4), // ⚠️ ينتهي خلال 4 أيام! عقد إيجار
    contractType: 'rent',
    agentName: 'عمر عادل',
    commissionRate: 10.0,
    totalCommission: 180000,
    agentShareRate: 50,
    agentCommissionAmount: 90000,
    status: 'paid',
    paymentDate: '2026-09-12',
    notes: 'عقد إيجار سنوي موثق - موعد تجديد عقد الإيجار وتحصيل عمولة التجديد السنوية'
  }
];

export const calculateContractExpiryInfo = (expiryDateStr?: string) => {
  if (!expiryDateStr) {
    return {
      daysRemaining: 999,
      isExpired: false,
      isExpiringSoon: false, // <= 7 days
      badgeColor: 'bg-surface-raised text-text-muted border-border',
      labelAr: 'غير محدد',
      labelEn: 'Unspecified'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(expiryDateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      daysRemaining: diffDays,
      isExpired: true,
      isExpiringSoon: false,
      badgeColor: 'bg-red-500/15 text-red-400 border-red-500/30',
      labelAr: `منتهي منذ ${Math.abs(diffDays)} يوم`,
      labelEn: `Expired ${Math.abs(diffDays)}d ago`
    };
  }

  if (diffDays === 0) {
    return {
      daysRemaining: 0,
      isExpired: false,
      isExpiringSoon: true,
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
      labelAr: 'ينتهي اليوم!',
      labelEn: 'Expires Today!'
    };
  }

  if (diffDays <= 7) {
    return {
      daysRemaining: diffDays,
      isExpired: false,
      isExpiringSoon: true,
      badgeColor: 'bg-accent text-accent border-accent font-bold animate-pulse',
      labelAr: `ينتهي خلال ${diffDays} أيام (تنبيه)`,
      labelEn: `Expires in ${diffDays} days`
    };
  }

  if (diffDays <= 30) {
    return {
      daysRemaining: diffDays,
      isExpired: false,
      isExpiringSoon: false,
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      labelAr: `ساري (${diffDays} يوم متبقي)`,
      labelEn: `Active (${diffDays}d left)`
    };
  }

  return {
    daysRemaining: diffDays,
    isExpired: false,
    isExpiringSoon: false,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    labelAr: `ساري (${Math.round(diffDays / 30)} شهر)`,
    labelEn: `Active (${Math.round(diffDays / 30)} mo)`
  };
};
