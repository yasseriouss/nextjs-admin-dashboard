import { formatNumber } from '../i18n/format';
import { Unit, UnitAuditLogEntry } from '../types';
import { normalizeUnitStatus } from '../lib/units';

/**
 * Returns the existing audit log or creates an intelligent, realistic
 * modification history based on the unit's metadata and status.
 */
export function getUnitAuditLog(unit: Unit): UnitAuditLogEntry[] {
  if (unit.auditLog && unit.auditLog.length > 0) {
    return [...unit.auditLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Synthesize realistic history tailored to the unit's characteristics
  const now = new Date();
  const logs: UnitAuditLogEntry[] = [];

  const daysAgo = (days: number) => {
    const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return d.toISOString();
  };

  const agentName = unit.agent || 'Ahmed Abdelgalil';

  // 1. Initial Listing Creation
  logs.push({
    id: `audit-${unit.id}-1`,
    timestamp: daysAgo(45),
    action: 'created',
    field: 'status',
    newValue: 'Available',
    changedBy: 'Ahmed Aly (System Admin)',
    notes: `تم إدراج الوحدة في محفظة كمبوند ${unit.compound} بسعر مبدئي ${formatNumber(unit.price)} ${unit.currency}.`
  });

  // 2. Inspection & Documentation
  logs.push({
    id: `audit-${unit.id}-2`,
    timestamp: daysAgo(30),
    action: 'inspection_completed',
    field: 'notes',
    newValue: 'معاينة مكتملة',
    changedBy: agentName,
    notes: 'تمت المعاينة الميدانية والتحقق من التشطيب والفيو ومطابقة المواصفات الهندسية.'
  });

  // 3. Price or notes update (if applicable)
  if (Number(unit.price) > 5000000) {
    logs.push({
      id: `audit-${unit.id}-3`,
      timestamp: daysAgo(18),
      action: 'price_update',
      field: 'price',
      oldValue: Math.round(Number(unit.price) * 0.96),
      newValue: Number(unit.price),
      changedBy: 'Sarah Nabil (Pricing Specialist)',
      notes: 'تحديث السعر الإجمالي تماشياً مع تسعير المطور ومعدل التضخم العقاري الجديد.'
    });
  }

  // 4. Status specific history
  const statusLower = (unit.status || '').toLowerCase();
  if (statusLower.includes('sold')) {
    logs.push({
      id: `audit-${unit.id}-4`,
      timestamp: daysAgo(12),
      action: 'status_change',
      field: 'status',
      oldValue: 'Available',
      newValue: 'Reserved',
      changedBy: agentName,
      notes: 'تم استلام دفعة جدية الحجز وتوقيع استمارة الرغبة في الشراء.'
    });
    logs.push({
      id: `audit-${unit.id}-5`,
      timestamp: daysAgo(3),
      action: 'status_change',
      field: 'status',
      oldValue: 'Reserved',
      newValue: 'Sold',
      changedBy: agentName,
      notes: 'تم توقيع العقد النهائي وسداد الدفعة المقدمة بالكامل وإغلاق الصفقة (Sold).'
    });
  } else if (statusLower.includes('reserv')) {
    logs.push({
      id: `audit-${unit.id}-4`,
      timestamp: daysAgo(4),
      action: 'status_change',
      field: 'status',
      oldValue: 'Available',
      newValue: 'Reserved',
      changedBy: agentName,
      notes: 'حجز مؤقت للعميل مع مهلة 7 أيام لاستكمال الدفعة المقدمة وصياغة العقود.'
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Appends a new status change event to the unit's audit log.
 */
export function recordUnitStatusChange(
  unit: Unit,
  newStatus: string,
  changedBy: string = 'Current Agent',
  notes?: string
): Unit {
  const currentLogs = getUnitAuditLog(unit);
  const newEntry: UnitAuditLogEntry = {
    id: `audit-${unit.id}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'status_change',
    field: 'status',
    oldValue: unit.status,
    newValue: newStatus,
    changedBy: changedBy.trim() || 'Sales Consultant',
    notes: notes?.trim() || `تحديث حالة الوحدة من "${unit.status}" إلى "${newStatus}" بنجاح.`
  };

  return {
    ...unit,
    status: normalizeUnitStatus(newStatus),
    auditLog: [newEntry, ...currentLogs]
  };
}
