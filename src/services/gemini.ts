import { formatNumber } from '../i18n/format';
import { GoogleGenAI } from '@google/genai';
import { Unit, DashboardKPIs } from '../types';

declare global {
  interface Window {
    __GEMINI_API_KEY__?: string;
  }
}

export const askGeminiInventoryAI = async (
  userPrompt: string,
  kpis: DashboardKPIs,
  units: Unit[],
  customApiKey?: string
): Promise<string> => {
  try {
    const effectiveKey = customApiKey || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GEMINI_API_KEY : undefined) || (typeof window !== 'undefined' ? (window as any).__GEMINI_API_KEY__ : undefined);
    
    // Summary context tailored for 6th of October / Sheikh Zayed Real Estate CRM
    const summaryContext = {
      agency: '6O Real Estate CRM (شقق وعقارات 6 أكتوبر)',
      areasCovered: ['6th of October', 'Sheikh Zayed', 'October Gardens', 'New October'],
      kpis: {
        totalUnits: kpis.totalUnits,
        availableUnits: kpis.availableUnits,
        reservedUnits: kpis.reservedUnits,
        soldUnits: kpis.soldUnits,
        totalMarketValueEGP: formatNumber(kpis.totalMarketValue) + ' EGP',
        avgUnitPriceEGP: formatNumber(kpis.avgUnitPrice) + ' EGP',
        activeClients: kpis.activeClientsCount,
        todayFollowUps: kpis.todayFollowUpsCount
      },
      sampleListings: units.slice(0, 35).map(u => ({
        id: u.id,
        compound: u.compound,
        area: u.area,
        type: u.unitType,
        beds: u.beds,
        size: u.size,
        price: `${formatNumber(u.price)} ${u.currency}`,
        status: u.status,
        delivery: u.deliveryDate
      }))
    };

    const systemInstruction = `You are the lead Real Estate AI Copilot for '6O Real Estate CRM' (شقق وعقارات 6 أكتوبر - بيع / شراء / إيجار).
Areas of expertise: 6th of October (أكتوبر), Sheikh Zayed (الشيخ زايد), October Gardens (حدائق أكتوبر), and New October (أكتوبر الجديدة).

You have live access to the CRM's current unit inventory and sales KPI metrics:
${JSON.stringify(summaryContext, null, 2)}

Instructions:
1. Provide accurate, professional, consultative advice for brokers, sales agents, and property managers.
2. If the user asks in Arabic, answer in fluent, polished Egyptian/Arabic real estate terminology (e.g. مقدم، أقساط، استلام فوري، كمبوند، نصف تشطيب، لاجون).
3. If the user asks in English, reply in crisp professional English.
4. Calculate averages, suggest matching available units by compound or budget, and highlight standout property features.
5. Format your responses with clear bullet points, bold numbers, and markdown tables where suitable.`;

    if (effectiveKey) {
      const ai = new GoogleGenAI({ apiKey: effectiveKey });
      
      // Use gemini-3.5-flash with googleMaps tool grounding for up to date compound & location intelligence
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.2,
            maxOutputTokens: 1400,
            tools: [{ googleMaps: {} }]
          }
        });
        return response.text || 'No response generated from Gemini.';
      } catch (mapsErr) {
        // Fallback to standard generateContent if googleMaps tool is not supported in the active tier
        const responseFallback = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.2,
            maxOutputTokens: 1400
          }
        });
        return responseFallback.text || 'No response generated from Gemini.';
      }
    } else {
      // Fallback intelligent offline/mock response generator based on the real inventory if no API key is provided
      return generateOfflineInventoryInsight(userPrompt, kpis, units);
    }
  } catch (error) {
    console.warn('Gemini API call returned error, providing smart local analysis:', error);
    return generateOfflineInventoryInsight(userPrompt, kpis, units, error instanceof Error ? error.message : String(error));
  }
};

function generateOfflineInventoryInsight(prompt: string, kpis: DashboardKPIs, units: Unit[], _errorDetail?: string): string {
  const p = prompt.toLowerCase();
  
  if (p.includes('متوسط') || p.includes('average') || p.includes('سعر') || p.includes('price')) {
    return `📊 **تحليل الأسعار ومتوسطات المحفظة العقارية (6O Real Estate):**\n\n` +
      `- **متوسط سعر الوحدة:** ${formatNumber(kpis.avgUnitPrice)} جنيه مصري.\n` +
      `- **إجمالي القيمة السوقية للمحفظة:** ${formatNumber(kpis.totalMarketValue)} جنيه مصري.\n` +
      `- **الوحدات المتاحة حالياً:** ${kpis.availableUnits} من أصل ${kpis.totalUnits} وحدة.\n\n` +
      `💡 *تنويه:* الأسعار في مناطق الشيخ زايد (مثل سوديك واليغريا) تتراوح بين 16 إلى 38 مليون جنيه، بينما حدائق وأكتوبر تتراوح بين 3.6 إلى 11 مليون جنيه.`;
  }

  if (p.includes('متاح') || p.includes('available') || p.includes('3') || p.includes('غرف') || p.includes('beds')) {
    const avail = units.filter(u => u.status.toLowerCase().includes('avail'));
    const threeBeds = avail.filter(u => String(u.beds) === '3');
    return `🏡 **الوحدات المتاحة المكونة من 3 غرف نوم:**\n\n` +
      `يوجد حالياً **${threeBeds.length} وحدات متاحة** بمواصفات 3 غرف في محفظتك العقارية:\n` +
      threeBeds.map(u => `• **${u.id}** في **${u.compound}** (${u.area}) - مساحة ${u.size}م² - السعر: **${formatNumber(u.price)} ${u.currency}**`).join('\n') +
      `\n\nتواصل مع العميل لتحديد موعد معاينة ميدانية فورية.`;
  }

  return `🤖 **تحليل المساعد الذكي لمخزون 6O Real Estate:**\n\n` +
    `بناءً على قاعدة بيانات الوحدات المسجلة حالياً:\n` +
    `- **إجمالي الوحدات المسجلة:** ${kpis.totalUnits} وحدة.\n` +
    `- **الوحدات المتاحة للبيع الفوري:** ${kpis.availableUnits} وحدة.\n` +
    `- **الوحدات المحجوزة:** ${kpis.reservedUnits} وحدة.\n` +
    `- **الوحدات المباعة:** ${kpis.soldUnits} وحدة.\n\n` +
    `يمكنك الاستفسار عن تفاصيل أي كمبوند محدد (Palm Hills, Mountain View, O West, Allegria) أو السؤال عن شقق أو فيلات بميزانية محددة!`;
}
