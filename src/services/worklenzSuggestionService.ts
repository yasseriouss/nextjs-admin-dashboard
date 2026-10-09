import { TeamMember, FollowUpTask } from '../types';

export interface WorklenzAgentSuggestion {
  member: TeamMember;
  score: number;
  loadRatio: number;
  activeCount: number;
  capacity: number;
  hasCompoundExpertise: boolean;
  matchedSpecialty?: string;
  reasonAr: string;
  reasonEn: string;
}

/**
 * Normalizes text for matching compound names across Arabic and English.
 */
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\s\-_]/g, '');
}

/**
 * Checks if a member's specialty matches the target compound name.
 */
function matchesCompound(specialty: string, compound: string): boolean {
  if (!specialty || !compound) return false;
  const normSpec = normalizeText(specialty);
  const normComp = normalizeText(compound);

  // Direct substring or inclusion
  if (normSpec.includes(normComp) || normComp.includes(normSpec)) return true;

  // Cross-lingual keyword checks
  const compoundPairs: [string[], string[]][] = [
    [['palm', 'hills', 'بالم', 'هيلز'], ['palm hills', 'بالم هيلز', 'بالم']],
    [['mountain', 'view', 'ماونتن', 'فيو', 'icity', 'اي سيتي'], ['mountain view', 'ماونتن فيو']],
    [['sodic', 'سوديك', 'beverly', 'بيفرلي', 'زايد', 'zayed'], ['sodic', 'سوديك', 'beverly hills']],
    [['zed', 'زد', 'towers', 'ابراج'], ['zed', 'زد', 'ابراج زد']],
    [['badya', 'باديه', 'بادية'], ['badya', 'بادية']],
    [['owest', 'او ويست', 'اويست', 'orascom', 'اوراسكوم'], ['o west', 'اوراسكوم', 'o-west']],
    [['chillout', 'تشيل', 'اوت'], ['chillout park', 'تشيل اوت بارك']]
  ];

  for (const [terms] of compoundPairs) {
    const specHas = terms.some(t => normSpec.includes(normalizeText(t)));
    const compHas = terms.some(t => normComp.includes(normalizeText(t)));
    if (specHas && compHas) return true;
  }

  return false;
}

/**
 * Evaluates all team members and suggests the best candidate for a new task
 * based on Worklenz workload capacity and compound expertise.
 */
export function getWorklenzSuggestions(
  compound: string,
  team: TeamMember[],
  tasks: FollowUpTask[]
): WorklenzAgentSuggestion[] {
  if (!team || team.length === 0) return [];

  const suggestions: WorklenzAgentSuggestion[] = team.map((member) => {
    // 1. Calculate active tasks workload from tasks list
    const activeTasks = tasks.filter(
      (t) => (t.agent === member.name || t.agent === member.id) && t.stage !== 'completed'
    );
    const activeCount = activeTasks.length;
    const capacity = member.maxCapacity || 8;
    const loadRatio = activeCount / capacity;
    const isOverloaded = loadRatio >= 0.85;

    // 2. Workload / Capacity Score (Max 45 points)
    // Lower load = higher availability score
    let workloadScore = Math.max(0, (1 - Math.min(1, loadRatio)) * 45);
    if (isOverloaded) {
      workloadScore -= 20; // Heavy penalty for members nearing burnout/capacity
    }

    // 3. Compound Expertise Score (Max 45 points)
    let hasCompoundExpertise = false;
    let matchedSpecialty: string | undefined = undefined;
    let expertiseScore = 0;

    if (compound && compound.trim()) {
      // Check member specialties list
      if (member.specialties && Array.isArray(member.specialties)) {
        for (const spec of member.specialties) {
          if (matchesCompound(spec, compound)) {
            hasCompoundExpertise = true;
            matchedSpecialty = spec;
            expertiseScore += 35;
            break;
          }
        }
      }

      // Check member's track record in this compound from past tasks
      const compoundDeals = tasks.filter(
        (t) => (t.agent === member.name || t.agent === member.id) && 
               t.compound && 
               matchesCompound(t.compound, compound)
      );
      if (compoundDeals.length > 0) {
        expertiseScore += Math.min(15, compoundDeals.length * 5);
        if (!hasCompoundExpertise) {
          hasCompoundExpertise = true;
          matchedSpecialty = compound;
        }
      }
    } else {
      // If no compound is specified, favor overall top performers
      expertiseScore += 10;
    }

    // 4. Status Availability Bonus (Max 10 points)
    let statusScore = 0;
    if (member.status === 'available') statusScore += 10;
    else if (member.status === 'on_viewing') statusScore += 5;
    else if (member.status === 'in_meeting') statusScore += 2;
    else if (member.status === 'offline') statusScore -= 10;

    // 5. Total Combined Score
    const totalScore = Math.round(workloadScore + expertiseScore + statusScore);

    // 6. Formulate clear justification reasons in Arabic and English
    const loadPercent = Math.round(loadRatio * 100);
    let reasonAr = '';
    let reasonEn = '';

    if (hasCompoundExpertise && !isOverloaded) {
      reasonAr = `خبير متخصص في ${matchedSpecialty || compound} • عبء عمل متاح (${activeCount}/${capacity} مهام - ${loadPercent}%)`;
      reasonEn = `Expert in ${matchedSpecialty || compound} • Low Worklenz load (${activeCount}/${capacity} tasks - ${loadPercent}%)`;
    } else if (hasCompoundExpertise && isOverloaded) {
      reasonAr = `خبير في ${matchedSpecialty || compound} ولكن لديه عبء عمل مرتفع (${activeCount}/${capacity} مهام)`;
      reasonEn = `Expert in ${matchedSpecialty || compound} but currently near capacity (${activeCount}/${capacity} tasks)`;
    } else if (!isOverloaded) {
      reasonAr = `طاقة استيعابية عالية شاغرة (${activeCount}/${capacity} مهام - ${loadPercent}%) • متاح فوراً`;
      reasonEn = `High Worklenz capacity available (${activeCount}/${capacity} tasks - ${loadPercent}%) • Ready now`;
    } else {
      reasonAr = `عبء عمل ممتلئ (${activeCount}/${capacity} مهام) • لا يُنصح بزيادة المهام`;
      reasonEn = `Workload full (${activeCount}/${capacity} tasks) • Additional task not recommended`;
    }

    return {
      member,
      score: totalScore,
      loadRatio,
      activeCount,
      capacity,
      hasCompoundExpertise,
      matchedSpecialty,
      reasonAr,
      reasonEn
    };
  });

  // Sort descending by highest score
  return suggestions.sort((a, b) => b.score - a.score);
}
