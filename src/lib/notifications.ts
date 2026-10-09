import type { AppNotification, Unit, FollowUpTask } from '../types';
import type { SalesContract } from '../data/mockContracts';
import type { TFunction } from '../i18n/I18nProvider';
import { formatNumber } from '../i18n/format';

type ExpiryInfo = { daysRemaining: number; isExpired: boolean; isExpiringSoon: boolean };

/**
 * Factories return catalog keys (+ interpolation vars) so the notification is
 * rendered in whatever language is active at display time. Data-driven
 * notifications (calendar, imports) still set literal `title`/`message` and
 * keep working through the same resolvers.
 */
export function mergeNotifications(existing: AppNotification[], incoming: AppNotification[]): AppNotification[] {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map(x => x.id));
  const fresh = incoming.filter(x => !seen.has(x.id));
  return [...fresh, ...existing].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function notificationTitle(notification: AppNotification, t: TFunction): string {
  return notification.titleKey ? t(notification.titleKey, notification.titleVars) : notification.title ?? '';
}

export function notificationMessage(notification: AppNotification, t: TFunction): string {
  return notification.messageKey ? t(notification.messageKey, notification.messageVars) : notification.message ?? '';
}

export function makeImminentTaskNotification(task: FollowUpTask): AppNotification {
  return {
    id: `task-imminent-${task.id}`,
    titleKey: 'notifications.taskDue.title',
    messageKey: 'notifications.taskDue.message',
    messageVars: {
      title: task.title,
      client: task.clientName,
      due: task.dueTime || task.dueDate,
    },
    taskId: task.id,
    clientName: task.clientName,
    dueTime: task.dueTime,
    unitId: task.unitId,
    compound: task.compound,
    type: 'task_due',
    timestamp: new Date(),
    read: false
  };
}

export function makeContractExpiryNotification(cnt: SalesContract, expiryInfo: ExpiryInfo): AppNotification {
  const isExpSoon = expiryInfo.isExpiringSoon;
  return {
    id: `cnt-expiry-${cnt.id}`,
    titleKey: isExpSoon ? 'notifications.contractExpiring.title' : 'notifications.contractExpired.title',
    titleVars: isExpSoon
      ? { days: expiryInfo.daysRemaining }
      : { number: cnt.contractNumber },
    messageKey: 'notifications.contract.message',
    messageVars: {
      unit: cnt.unitId,
      compound: cnt.compound,
      client: cnt.clientName,
      value: formatNumber(cnt.dealValue),
    },
    unitId: cnt.unitId,
    compound: cnt.compound,
    price: cnt.dealValue,
    type: 'alert',
    timestamp: new Date(),
    read: false
  };
}

export function makeUnitTransitionAlerts(previousUnits: Unit[], incomingUnits: Unit[]): AppNotification[] {
  const newAlerts: AppNotification[] = [];

  incomingUnits.forEach((incomingUnit) => {
    const previousUnit = previousUnits.find(u => u.id === incomingUnit.id);
    if (previousUnit) {
      const prevSt = (previousUnit.status || '').toLowerCase();
      const nextSt = (incomingUnit.status || '').toLowerCase();

      const wasSold = prevSt.includes('sold') || prevSt.includes('مباع') || prevSt.includes('تم البيع');
      const isNowSold = nextSt.includes('sold') || nextSt.includes('مباع') || nextSt.includes('تم البيع');

      const wasReserved = prevSt.includes('reserv') || prevSt.includes('حجز') || prevSt.includes('محجوز');
      const isNowReserved = nextSt.includes('reserv') || nextSt.includes('حجز') || nextSt.includes('محجوز');

      if (!wasSold && isNowSold) {
        newAlerts.push({
          id: `notif-sold-${incomingUnit.id}-${Date.now()}`,
          titleKey: 'notifications.sold.title',
          messageKey: 'notifications.sold.message',
          messageVars: {
            unit: incomingUnit.id,
            compound: incomingUnit.compound,
            value: formatNumber(incomingUnit.price),
          },
          unitId: incomingUnit.id,
          compound: incomingUnit.compound,
          price: incomingUnit.price,
          type: 'sold',
          timestamp: new Date(),
          read: false
        });
      } else if (!wasReserved && isNowReserved) {
        newAlerts.push({
          id: `notif-res-${incomingUnit.id}-${Date.now()}`,
          titleKey: 'notifications.reserved.title',
          messageKey: 'notifications.reserved.message',
          messageVars: {
            unit: incomingUnit.id,
            compound: incomingUnit.compound,
            value: formatNumber(incomingUnit.price),
          },
          unitId: incomingUnit.id,
          compound: incomingUnit.compound,
          price: incomingUnit.price,
          type: 'reserved',
          timestamp: new Date(),
          read: false
        });
      }
    }
  });

  return newAlerts;
}

export function makeSoldToast(unit: Unit): AppNotification | null {
  if (!unit.status.toLowerCase().includes('sold')) return null;
  return {
    id: `sold-${unit.id}-${Date.now()}`,
    titleKey: 'notifications.soldMarked.title',
    messageKey: 'notifications.soldMarked.message',
    messageVars: {
      unit: unit.id,
      compound: unit.compound,
      value: formatNumber(unit.price),
      currency: unit.currency,
    },
    unitId: unit.id,
    compound: unit.compound,
    price: Number(unit.price),
    type: 'sold',
    timestamp: new Date(),
    read: false
  };
}
