/**
 * Adaptive Skill-Level Evaluation Service - Skill Point
 * 
 * Module 5: Adaptive Skill-Level Evaluation + Full Existing-System Integration
 * 
 * Responsibilities:
 *  1. Evaluates candidate skill levels (Beginner, Intermediate, Advanced) based on:
 *     - Technical assessment scores & question performance
 *     - Resume evidence & project proof
 *     - Practical assignments & learning modules
 *  2. Tracks skill level transitions:
 *     - Current level vs Previous level
 *     - Performance score & delta (Improvement / Decline / Maintained)
 *     - Chronological assessment history per skill
 *     - Audit-ready assessment evidence strings
 *  3. Propagates skill updates through:
 *     - Skill Gap recalculation
 *     - Overall Job Readiness recalculation
 *     - Target Job match scores
 *     - Next Adaptive Assessment planning (calibrating difficulty & question quotas)
 */

export const SKILL_LEVELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

/**
 * Maps a numerical score (0-100) to a formal Skill Level tier
 * 
 * Thresholds:
 *  - Advanced: >= 75% (Verified high competency, benchmark satisfied)
 *  - Intermediate: 50% - 74% (Core engineering working knowledge)
 *  - Beginner: < 50% (Foundational / theoretical / unassessed)
 */
export function determineSkillLevel(score = 0) {
  const numeric = typeof score === "number" ? score : parseFloat(score) || 0;
  if (numeric >= 75) return SKILL_LEVELS.ADVANCED;
  if (numeric >= 50) return SKILL_LEVELS.INTERMEDIATE;
  return SKILL_LEVELS.BEGINNER;
}

/**
 * Returns numeric rank for level comparison
 */
export function getLevelRank(level) {
  switch (level) {
    case SKILL_LEVELS.ADVANCED:
      return 3;
    case SKILL_LEVELS.INTERMEDIATE:
      return 2;
    case SKILL_LEVELS.BEGINNER:
    default:
      return 1;
  }
}

/**
 * Computes trend between previous and current performance
 */
export function calculateLevelTrend(previousLevel, currentLevel, previousScore, currentScore) {
  const prevRank = getLevelRank(previousLevel);
  const currRank = getLevelRank(currentLevel);
  const delta = (currentScore || 0) - (previousScore || 0);

  if (currRank > prevRank || delta >= 5) {
    return {
      trend: "Improved",
      isPromoted: currRank > prevRank,
      label: currRank > prevRank ? `Promoted to ${currentLevel}` : `Improved (+${Math.abs(delta)}%)`,
      delta,
    };
  }

  if (currRank < prevRank || delta <= -10) {
    return {
      trend: "Declined",
      isPromoted: false,
      label: currRank < prevRank ? `Re-evaluated to ${currentLevel}` : `Declined (${delta}%)`,
      delta,
    };
  }

  return {
    trend: "Maintained",
    isPromoted: false,
    label: `Maintained ${currentLevel}`,
    delta,
  };
}

/**
 * Evaluates and updates skill levels following an assessment submission.
 * 
 * @param {Object} assessmentResult - Assessment result object { level, score, skillScores, date, targetJob }
 * @param {Object} currentSkillLevels - Existing skill level dictionary { [skillName]: record }
 * @param {Array}  skillGaps - Live skill gaps array from Module 3
 * @returns {Object} Updated skill levels registry and promotion analytics
 */
export function updateSkillLevelsFromAssessment({
  assessmentResult,
  currentSkillLevels = {},
  skillGaps = [],
}) {
  if (!assessmentResult || !assessmentResult.skillScores) {
    return {
      updatedSkillLevels: { ...currentSkillLevels },
      promotedSkills: [],
      evaluatedSkillsCount: 0,
      summary: { advancedCount: 0, intermediateCount: 0, beginnerCount: 0 },
    };
  }

  const updatedSkillLevels = { ...currentSkillLevels };
  const promotedSkills = [];
  const assessedSkillNames = Object.keys(assessmentResult.skillScores);
  const assessmentDate = assessmentResult.date || new Date().toISOString();
  const testLevel = assessmentResult.level || 1;

  assessedSkillNames.forEach((skillName) => {
    const rawAssessedScore = assessmentResult.skillScores[skillName];
    if (typeof rawAssessedScore !== "number") return;

    // Normalize name key
    const key = skillName.trim();
    const existing = updatedSkillLevels[key] || {};

    // Find baseline from skill gaps if not previously in skillLevels
    const currentGap = (skillGaps || []).find(
      (g) => g.name.toLowerCase() === key.toLowerCase()
    );

    const previousScore = typeof existing.score === "number"
      ? existing.score
      : currentGap ? currentGap.current : 0;

    const previousLevel = existing.currentLevel || determineSkillLevel(previousScore);

    // Calculate updated score:
    // If not previously assessed (or 0), use the verified test score directly.
    // If reassessed, blend previous with latest assessment (30% prior + 70% current)
    // so repeated assessments reflect updated performance, enabling genuine promotions or declines.
    const updatedScore = previousScore === 0
      ? rawAssessedScore
      : Math.round(previousScore * 0.3 + rawAssessedScore * 0.7);
    const currentLevel = determineSkillLevel(updatedScore);

    const trendMeta = calculateLevelTrend(
      previousLevel,
      currentLevel,
      previousScore,
      updatedScore
    );

    // Generate verified evidence string
    const evidenceEntry = `Assessment Verified: Level ${testLevel} (${rawAssessedScore}%) - ${currentLevel}`;

    // Update history timeline
    const history = Array.isArray(existing.history) ? [...existing.history] : [];
    history.push({
      date: assessmentDate,
      levelTested: testLevel,
      score: rawAssessedScore,
      skillLevel: currentLevel,
      previousLevel,
      trend: trendMeta.trend,
      delta: trendMeta.delta,
      targetJob: assessmentResult.targetJob,
    });

    const updatedRecord = {
      name: key,
      currentLevel,
      previousLevel,
      score: updatedScore,
      previousScore,
      trend: trendMeta.trend,
      delta: trendMeta.delta,
      trendLabel: trendMeta.label,
      isPromoted: trendMeta.isPromoted,
      lastAssessedAt: assessmentDate,
      lastAssessedLevel: testLevel,
      lastAssessedScore: rawAssessedScore,
      assessmentCount: (existing.assessmentCount || 0) + 1,
      evidence: evidenceEntry,
      history,
    };

    updatedSkillLevels[key] = updatedRecord;

    if (trendMeta.isPromoted) {
      promotedSkills.push({
        skill: key,
        from: previousLevel,
        to: currentLevel,
        previousLevel,
        newLevel: currentLevel,
        previousScore,
        newScore: updatedScore,
        score: updatedScore,
        delta: trendMeta.delta,
        trend: trendMeta.trend,
      });
    }
  });

  // Calculate overall summary counts
  const allRecords = Object.values(updatedSkillLevels);
  const advancedCount = allRecords.filter((r) => r.currentLevel === SKILL_LEVELS.ADVANCED).length;
  const intermediateCount = allRecords.filter((r) => r.currentLevel === SKILL_LEVELS.INTERMEDIATE).length;
  const beginnerCount = allRecords.filter((r) => r.currentLevel === SKILL_LEVELS.BEGINNER).length;

  return {
    updatedSkillLevels,
    skillLevels: updatedSkillLevels,
    promotedSkills,
    evaluatedSkillsCount: assessedSkillNames.length,
    summary: {
      totalTracked: allRecords.length,
      advancedCount,
      intermediateCount,
      beginnerCount,
    },
  };
}

/**
 * Enriches a skill gap array with adaptive skill level data and level transitions
 * 
 * @param {Array}  skillGaps - Output from calculateSkillGaps
 * @param {Object} skillLevels - Skill levels registry
 * @returns {Array} Enriched skill gaps with adaptive level properties
 */
export function enrichSkillGapsWithSkillLevels(skillGaps = [], skillLevels = {}) {
  if (!Array.isArray(skillGaps)) return [];

  return skillGaps.map((skill) => {
    const key = skill.name || "";
    // Match case-insensitively
    const matchKey = Object.keys(skillLevels).find(
      (k) => k.toLowerCase() === key.toLowerCase()
    );
    const levelRecord = matchKey ? skillLevels[matchKey] : null;

    let currentScore = skill.current || 0;
    let currentLevel = SKILL_LEVELS.BEGINNER;
    let previousLevel = SKILL_LEVELS.BEGINNER;
    let trend = "Maintained";
    let trendLabel = "";
    let isPromoted = false;
    let assessmentEvidence = null;
    let assessmentHistory = [];

    if (levelRecord) {
      currentScore = Math.max(currentScore, levelRecord.score || 0);
      currentLevel = levelRecord.currentLevel || determineSkillLevel(currentScore);
      previousLevel = levelRecord.previousLevel || currentLevel;
      trend = levelRecord.trend || "Maintained";
      trendLabel = levelRecord.trendLabel || "";
      isPromoted = Boolean(levelRecord.isPromoted);
      assessmentEvidence = levelRecord.evidence || null;
      assessmentHistory = levelRecord.history || [];
    } else {
      currentLevel = determineSkillLevel(currentScore);
      previousLevel = currentLevel;
    }

    // Recompute gap and matchClassification if elevated by verified assessment
    const targetRequired = skill.required || 80;
    const gap = Math.max(targetRequired - currentScore, 0);

    let matchClassification = skill.matchClassification;
    if (currentLevel === SKILL_LEVELS.ADVANCED && currentScore >= targetRequired * 0.9) {
      matchClassification = "Matched";
    } else if (currentLevel === SKILL_LEVELS.INTERMEDIATE && matchClassification === "Missing") {
      matchClassification = "Partially Matched";
    }

    // Append assessment evidence to skill's evidence list if not already included
    const evidenceList = Array.isArray(skill.evidence) ? [...skill.evidence] : [];
    if (assessmentEvidence && !evidenceList.includes(assessmentEvidence)) {
      evidenceList.unshift(assessmentEvidence);
    }

    return {
      ...skill,
      current: currentScore,
      gap,
      currentLevel,
      previousLevel,
      levelTrend: trend,
      levelTrendLabel: trendLabel,
      isPromoted,
      matchClassification,
      evidence: evidenceList,
      assessmentHistory,
    };
  });
}

/**
 * Compares two assessment attempts and yields granular score, skill-wise, and promotion deltas.
 *
 * @param {Object} params
 * @param {Object} params.currentAttempt - Current assessment result { score, skillScores, level, ... }
 * @param {Object} params.previousAttempt - Previous assessment result or null
 * @param {Object} params.skillLevels - Current skill levels registry
 * @returns {Object} Structured attempt comparison
 */
export function compareAssessmentAttempts({ currentAttempt, previousAttempt, skillLevels = {} }) {
  if (!currentAttempt) return null;

  const currentScore = currentAttempt.score ?? 0;
  const hasPrevious = !!previousAttempt && typeof previousAttempt.score === "number";
  const previousScore = hasPrevious ? previousAttempt.score : null;
  const scoreDelta = hasPrevious ? currentScore - previousScore : 0;

  const currentSkillScores = currentAttempt.skillScores || {};
  const previousSkillScores = hasPrevious ? (previousAttempt.skillScores || {}) : {};

  const skillComparisons = [];
  const promotedSkills = [];
  const demotedSkills = [];
  const unchangedSkills = [];

  Object.entries(currentSkillScores).forEach(([skill, score]) => {
    const prevScore = typeof previousSkillScores[skill] === "number" ? previousSkillScores[skill] : null;
    const skillDelta = prevScore !== null ? score - prevScore : null;

    const record = skillLevels[skill] || {};
    const currentLevel = record.currentLevel || determineSkillLevel(score);
    const previousLevel = record.previousLevel || (prevScore !== null ? determineSkillLevel(prevScore) : currentLevel);

    const prevRank = getLevelRank(previousLevel);
    const currRank = getLevelRank(currentLevel);

    let status = "unchanged";
    if (currRank > prevRank || record.isPromoted || (skillDelta !== null && skillDelta >= 15)) {
      status = "promoted";
    } else if (currRank < prevRank || (skillDelta !== null && skillDelta <= -15)) {
      status = "demoted";
    } else {
      status = "unchanged";
    }

    const item = {
      skill,
      currentScore: score,
      previousScore: prevScore,
      delta: skillDelta,
      deltaFormatted: skillDelta !== null ? (skillDelta > 0 ? `+${skillDelta}%` : `${skillDelta}%`) : "N/A",
      currentLevel,
      previousLevel,
      status, // 'promoted' | 'demoted' | 'unchanged'
      trend: record.trend || (skillDelta > 0 ? "Improved" : skillDelta < 0 ? "Declined" : "Maintained"),
    };

    skillComparisons.push(item);
    if (status === "promoted") promotedSkills.push(item);
    else if (status === "demoted") demotedSkills.push(item);
    else unchangedSkills.push(item);
  });

  return {
    hasPrevious,
    currentScore,
    previousScore,
    scoreDelta,
    deltaFormatted: hasPrevious ? (scoreDelta > 0 ? `+${scoreDelta}%` : `${scoreDelta}%`) : "Baseline",
    scoreTrend: scoreDelta > 0 ? "improved" : scoreDelta < 0 ? "declined" : "equal",
    skillComparisons,
    promotedSkills,
    demotedSkills,
    unchangedSkills,
    summary: {
      totalAssessed: skillComparisons.length,
      promotedCount: promotedSkills.length,
      demotedCount: demotedSkills.length,
      unchangedCount: unchangedSkills.length,
    },
  };
}

export default {
  SKILL_LEVELS,
  determineSkillLevel,
  getLevelRank,
  calculateLevelTrend,
  updateSkillLevelsFromAssessment,
  enrichSkillGapsWithSkillLevels,
  compareAssessmentAttempts,
};
