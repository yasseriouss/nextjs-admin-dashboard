import { Unit, DashboardKPIs, Owner, UnitStatus } from '../types';

export type TableCell = string | number | boolean | null | undefined;

/**
 * Parses raw tabular text (TSV / Tab-delimited, CSV, or Semicolon-delimited) into a 2D array of cells.
 */
export function parseDelimitedText(text: string): TableCell[][] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;

  const isTab = tabCount >= commaCount && tabCount >= semiCount;
  const isSemi = semiCount > commaCount && semiCount > tabCount;

  return lines.map((line) => {
    if (isTab) {
      return line.split('\t').map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
    }
    if (isSemi) {
      return line.split(';').map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
    }
    return line.split(',').map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
  });
}

/**
 * Parses tabular rows (English and Arabic columns) into strongly typed CRM Unit objects.
 */
export const parseTableRows = (
  rows: TableCell[][],
  defaultCategory: 'sales' | 'rent' = 'sales'
): { units: Unit[]; kpis: DashboardKPIs } => {
  if (!rows || rows.length < 2) {
    return {
      units: [],
      kpis: {
        totalUnits: 0,
        availableUnits: 0,
        reservedUnits: 0,
        soldUnits: 0,
        totalMarketValue: 0,
        avgUnitPrice: 0,
      },
    };
  }

  const headers = rows[0].map((h: TableCell) => String(h || '').trim().toLowerCase());
  const dataRows = rows.slice(1);

  const colIndex = {
    id: headers.findIndex((h) => h.includes('unit id') || h.includes('كود') || h.includes('رقم الوحدة') || h.includes('id')),
    status: headers.findIndex((h) => h.includes('status') || h.includes('حالة')),
    area: headers.findIndex((h) => h.includes('area') || h.includes('منطقة') || h.includes('المنطقة')),
    compound: headers.findIndex((h) => h.includes('compound') || h.includes('كمباوند') || h.includes('مشروع') || h.includes('كمبوند') || h.includes('اسم')),
    propertyType: headers.findIndex((h) => h.includes('property type') || h.includes('نوع العقار')),
    unitType: headers.findIndex((h) => h.includes('unit type') || h.includes('نوع الوحدة') || h.includes('النوع')),
    size: headers.findIndex((h) => h.includes('built-up') || h.includes('مساحة') || h.includes('المساحة') || h.includes('size')),
    beds: headers.findIndex((h) => h.includes('bedroom') || h.includes('غرف') || h.includes('نوم') || h.includes('beds')),
    baths: headers.findIndex((h) => h.includes('bathroom') || h.includes('حمام') || h.includes('حمامات') || h.includes('baths')),
    floor: headers.findIndex((h) => h.includes('floor') || h.includes('دور') || h.includes('الدور')),
    price: headers.findIndex((h) => h.includes('asking price') || h.includes('سعر') || h.includes('price') || h.includes('السعر') || h.includes('سعر البيع') || h.includes('rent') || h.includes('إيجار') || h.includes('ايجار') || h.includes('شهري')),
    currency: headers.findIndex((h) => h.includes('currency') || h.includes('عملة') || h.includes('العملة')),
    owner: headers.findIndex((h) => h.includes('owner name') || h.includes('اسم المالك') || h.includes('owner') || h.includes('مالك')),
    phone: headers.findIndex((h) => h.includes('owner phone') || h.includes('رقم المالك') || h.includes('phone') || h.includes('هاتف') || h.includes('موبايل')),
    notes: headers.findIndex((h) => h.includes('note') || h.includes('ملاحظات')),
    delivery: headers.findIndex((h) => h.includes('delivery') || h.includes('استلام') || h.includes('موعد')),
    agent: headers.findIndex((h) => h.includes('agent') || h.includes('مسؤول') || h.includes('المسؤول') || h.includes('الوسيط') || h.includes('broker')),
  };

  const isRentCategory = defaultCategory === 'rent' || headers.some((h) => h.includes('monthly rent') || h.includes('إيجار شهري'));

  let totalUnits = 0;
  let availableUnits = 0;
  let reservedUnits = 0;
  let soldUnits = 0;
  let totalMarketValue = 0;
  let priceCount = 0;

  const units: Unit[] = [];

  dataRows.forEach((r, idx) => {
    const rawId = colIndex.id !== -1 ? r[colIndex.id] : r[0];
    const unitId = String(rawId || '').trim();
    if (!unitId || unitId === '#REF!' || unitId === '#VALUE!') return;

    const hasDetails = r.some((val: TableCell, cIdx: number) => {
      if (cIdx === colIndex.id) return false;
      const str = String(val || '').trim();
      return str.length > 0 && str !== '-' && str !== '0';
    });
    if (!hasDetails) return;

    totalUnits++;
    const rawStatus = colIndex.status !== -1 ? String(r[colIndex.status] || 'Available').trim() : 'Available';
    const statusLower = rawStatus.toLowerCase();

    let normalizedStatus: UnitStatus = 'Available';
    if (/reserved|محجوز/i.test(statusLower)) {
      normalizedStatus = 'Reserved';
      reservedUnits++;
    } else if (/sold|تم البيع|مباع|مؤجر/i.test(statusLower)) {
      normalizedStatus = 'Sold';
      soldUnits++;
    } else {
      normalizedStatus = 'Available';
      availableUnits++;
    }

    const rawPrice = colIndex.price !== -1 ? r[colIndex.price] : 0;
    const cleanPrice = typeof rawPrice === 'number'
      ? rawPrice
      : parseFloat(String(rawPrice || '0').replace(/[^0-9.-]+/g, '')) || 0;

    if (cleanPrice > 0) {
      totalMarketValue += cleanPrice;
      priceCount++;
    }

    const rawSize = colIndex.size !== -1 ? r[colIndex.size] : 0;
    const cleanSize = typeof rawSize === 'number'
      ? rawSize
      : parseFloat(String(rawSize || '0').replace(/[^0-9.-]+/g, '')) || 0;

    const rawBeds = colIndex.beds !== -1 ? r[colIndex.beds] : 0;
    const cleanBeds = typeof rawBeds === 'number' ? rawBeds : parseInt(String(rawBeds || '0'), 10) || 0;

    const rawBaths = colIndex.baths !== -1 ? r[colIndex.baths] : 0;
    const cleanBaths = typeof rawBaths === 'number' ? rawBaths : parseInt(String(rawBaths || '0'), 10) || 0;

    const unit: Unit = {
      id: unitId || `U-${idx + 1}`,
      status: normalizedStatus,
      area: colIndex.area !== -1 ? String(r[colIndex.area] || '6 October').trim() : '6 October',
      compound: colIndex.compound !== -1 ? String(r[colIndex.compound] || 'General').trim() : 'General',
      propertyType: colIndex.propertyType !== -1 ? String(r[colIndex.propertyType] || 'Residential').trim() : 'Residential',
      unitType: colIndex.unitType !== -1 ? String(r[colIndex.unitType] || 'Apartment').trim() : 'Apartment',
      size: cleanSize,
      beds: cleanBeds,
      baths: cleanBaths,
      floor: colIndex.floor !== -1 ? String(r[colIndex.floor] || '-').trim() : '-',
      price: cleanPrice,
      currency: colIndex.currency !== -1 ? String(r[colIndex.currency] || 'EGP').trim() : 'EGP',
      ownerName: colIndex.owner !== -1 ? String(r[colIndex.owner] || '-').trim() : '-',
      ownerPhone: colIndex.phone !== -1 ? String(r[colIndex.phone] || '-').trim() : '-',
      notes: colIndex.notes !== -1 ? String(r[colIndex.notes] || '').trim() : '',
      deliveryDate: colIndex.delivery !== -1 ? String(r[colIndex.delivery] || 'Immediate').trim() : 'Immediate',
      agent: colIndex.agent !== -1 ? String(r[colIndex.agent] || 'Unassigned').trim() : 'Unassigned',
      category: isRentCategory ? 'rent' : 'sales',
    };

    units.push(unit);
  });

  const avgUnitPrice = priceCount > 0 ? Math.round(totalMarketValue / priceCount) : 0;

  return {
    units,
    kpis: {
      totalUnits,
      availableUnits,
      reservedUnits,
      soldUnits,
      totalMarketValue,
      avgUnitPrice,
    },
  };
};

/**
 * Parses tabular rows into CRM Owner profiles.
 */
export const parseOwnersRows = (rows: TableCell[][]): Owner[] => {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map((h: TableCell) => String(h || '').trim().toLowerCase());
  const dataRows = rows.slice(1);

  const colIndex = {
    id: headers.findIndex((h) => h.includes('owner id') || h.includes('كود')),
    name: headers.findIndex((h) => h.includes('name') || h.includes('اسم')),
    phone: headers.findIndex((h) => h.includes('mobile 1') || h.includes('هاتف') || h.includes('phone') || h.includes('موبايل')),
    phone2: headers.findIndex((h) => h.includes('mobile 2')),
    whatsapp: headers.findIndex((h) => h.includes('whatsapp') || h.includes('واتساب')),
    email: headers.findIndex((h) => h.includes('email') || h.includes('بريد')),
    area: headers.findIndex((h) => h.includes('area') || h.includes('منطقة')),
    address: headers.findIndex((h) => h.includes('address') || h.includes('عنوان')),
    unitsCount: headers.findIndex((h) => h.includes('units') || h.includes('عدد الوحدات')),
    notes: headers.findIndex((h) => h.includes('note') || h.includes('ملاحظات')),
  };

  const owners: Owner[] = [];
  dataRows.forEach((r, idx) => {
    const rawName = colIndex.name !== -1 ? r[colIndex.name] : r[1];
    const name = String(rawName || '').trim();
    if (!name || name === '#REF!' || name === '#VALUE!') return;

    owners.push({
      id: colIndex.id !== -1 ? String(r[colIndex.id] || `O-${idx + 1}`).trim() : `O-${idx + 1}`,
      name,
      phone: colIndex.phone !== -1 ? String(r[colIndex.phone] || '').trim() : '',
      phone2: colIndex.phone2 !== -1 ? String(r[colIndex.phone2] || '').trim() : undefined,
      whatsapp: colIndex.whatsapp !== -1 ? String(r[colIndex.whatsapp] || '').trim() : undefined,
      email: colIndex.email !== -1 ? String(r[colIndex.email] || '').trim() : undefined,
      area: colIndex.area !== -1 ? String(r[colIndex.area] || '').trim() : undefined,
      address: colIndex.address !== -1 ? String(r[colIndex.address] || '').trim() : undefined,
      unitsCount: (colIndex.unitsCount !== -1 ? r[colIndex.unitsCount] : undefined) as number | string | undefined,
      notes: colIndex.notes !== -1 ? String(r[colIndex.notes] || '').trim() : undefined,
    });
  });

  return owners;
};
