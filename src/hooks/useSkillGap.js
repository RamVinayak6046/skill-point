/* =========================================
   useSkillGap - Skill Gap Calculation
   Module 3: Intelligent Resume ↔ Job Description Skill Matching

   Computes skill gaps by comparing user-demonstrated
   resume evidence and assessments against target job requirements.
   ========================================= */

import { matchResumeWithJobDescriptionIntelligence } from "../services/skillMatchingService.js";
import { enrichSkillGapsWithSkillLevels } from "../services/skillLevelService.js";

/**
 * Determines the status label for a skill based on its current proficiency.
 *
 * @param {number} current - Current proficiency (0-100)
 * @param {number} required - Required proficiency (0-100)
 * @returns {string} 'Strong' | 'Developing' | 'Weak' | 'Missing'
 */
export function getSkillStatus(current, required) {
  if (current <= 0) return "Missing";
  if (current >= required) return "Strong";
  if (current >= required * 0.7) return "Developing";
  return "Weak";
}

/**
 * Determines the priority of a skill gap.
 *
 * @param {number} gap - The proficiency gap (required - current)
 * @param {string} importance - The skill's importance ('High' | 'Medium' | 'Low')
 * @returns {string} 'High' | 'Medium' | 'Low'
 */
export function getSkillPriority(gap, importance) {
  if (gap <= 0) return "Low";
  if (importance === "High" && gap > 15) return "High";
  if (importance === "High" || gap > 25) return "High";
  if (importance === "Medium" || gap > 10) return "Medium";
  return "Low";
}

/**
 * Calculates the complete skill gap analysis for a user
 * against a target job / active JD requirements using Resume Intelligence and Adaptive Skill Levels.
 */
export function calculateSkillGaps({
  requiredSkills = [],
  baselineSkills = [],
  assessment = null,
  skillLevels = {},
  targetJob = "",
  assignmentCompletions = {},
  assignments = [],
  completedLessons = [],
  lessons = [],
  parsedResume = null,
  activeJD = null,
}) {
  // If we have activeJD or parsedResume, execute Module 3 Intelligent Matching
  if (parsedResume || activeJD) {
    // Only use activeJD if it aligns with targetJob; otherwise construct authoritative requirements for targetJob
    const jdMatchesTarget = Boolean(
      !targetJob ||
      !activeJD ||
      !activeJD.jobTitle ||
      activeJD.jobTitle.toLowerCase() === targetJob.toLowerCase() ||
      activeJD.jobTitle.toLowerCase().includes(targetJob.toLowerCase()) ||
      targetJob.toLowerCase().includes(activeJD.jobTitle.toLowerCase())
    );

    const effectiveJD = (activeJD && jdMatchesTarget) ? activeJD : {
      jobTitle: targetJob || "Target Role",
      company: "Target Company",
      requiredSkills: requiredSkills.map((s) => ({
        ...s,
        requiredScore: s.required || 80,
        source: "Required",
      })),
      preferredSkills: [],
    };

    // Ensure assessment results are scoped to the active target job
    const assessmentMatches = Boolean(
      !assessment ||
      !assessment.targetJob ||
      !targetJob ||
      assessment.targetJob.toLowerCase() === targetJob.toLowerCase() ||
      assessment.targetJob.toLowerCase().includes(targetJob.toLowerCase()) ||
      targetJob.toLowerCase().includes(assessment.targetJob.toLowerCase())
    );
    const activeAssessment = assessmentMatches ? assessment : null;

    const matchAnalysis = matchResumeWithJobDescriptionIntelligence({
      parsedResume,
      activeJD: effectiveJD,
      assessment: activeAssessment,
      skillLevels,
      assignmentCompletions,
      assignments,
      completedLessons,
      lessons,
    });

    return matchAnalysis.allSkillsAnalysis;
  }

  // Fallback for cold start (no resume and no JD)
  const baseGaps = requiredSkills.map((reqSkill) => {
    const baseline = baselineSkills.find((s) => s.name === reqSkill.name);
    const baselineScore = baseline ? (baseline.current || 0) : 0;
    let current = baselineScore;

    if (
      assessment &&
      assessment.completed &&
      assessment.targetJob === targetJob &&
      typeof assessment.score === "number"
    ) {
      const skillScores = assessment.skillScores || {};
      const perSkillScore = skillScores[reqSkill.name];
      if (typeof perSkillScore === "number") {
        current = Math.max(current, perSkillScore);
      } else {
        current = Math.round(current * 0.7 + assessment.score * 0.3);
      }
    }

    const skillAssignments = assignments.filter((a) => a.skill === reqSkill.name);
    const completedAssignmentCount = skillAssignments.filter(
      (a) => assignmentCompletions[a.id]
    ).length;
    current = Math.min(100, current + completedAssignmentCount * 5);

    const skillLessons = lessons.filter((l) => l.skill === reqSkill.name);
    const completedLessonCount = skillLessons.filter(
      (l) => completedLessons.includes(l.id)
    ).length;
    current = Math.min(100, current + completedLessonCount * 3);

    const gap = Math.max(reqSkill.required - current, 0);
    const status = getSkillStatus(current, reqSkill.required);
    const priority = getSkillPriority(gap, reqSkill.importance);

    return {
      name: reqSkill.name,
      current,
      resumeScore: baselineScore,
      required: reqSkill.required,
      gap,
      status,
      matchClassification: current >= reqSkill.required ? "Matched" : current > 0 ? "Partially Matched" : "Missing",
      priority,
      importance: reqSkill.importance,
      category: reqSkill.category || "General",
      source: "Required",
      evidence: [],
      explanation: current === 0 ? "No resume evidence found. Upload resume to analyze." : "Evaluated via platform baseline.",
    };
  });

  return enrichSkillGapsWithSkillLevels(baseGaps, skillLevels);
}

/**
 * Summarizes skill gap data into dashboard-level statistics.
 *
 * @param {Array} skillGaps - Output of calculateSkillGaps
 * @returns {Object} Summary stats
 */
export function getSkillGapSummary(skillGaps = []) {
  const total = skillGaps.length;

  const covered = skillGaps.filter(
    (s) => s.current >= s.required || s.matchClassification === "Matched"
  ).length;

  const matchedCount = skillGaps.filter(
    (s) => s.matchClassification === "Matched"
  ).length;

  const partialCount = skillGaps.filter(
    (s) => s.matchClassification === "Partially Matched"
  ).length;

  const missingCount = skillGaps.filter(
    (s) => s.matchClassification === "Missing"
  ).length;

  const highPriority = skillGaps.filter(
    (s) => s.priority === "High"
  ).length;

  const averageGap = total > 0
    ? Math.round(
        skillGaps.reduce((sum, s) => sum + s.gap, 0) / total
      )
    : 0;

  // Weighted overall match score
  let weightedEarned = 0;
  let totalWeight = 0;
  skillGaps.forEach((s) => {
    const weight = s.source === "Preferred" ? 1 : 3;
    totalWeight += weight;
    if (s.matchClassification === "Matched") {
      weightedEarned += weight * Math.min(s.current / s.required, 1.15);
    } else if (s.matchClassification === "Partially Matched") {
      weightedEarned += weight * 0.55;
    }
  });

  const overallMatchScore = totalWeight > 0
    ? Math.min(Math.max(Math.round((weightedEarned / totalWeight) * 100), 10), 98)
    : 0;

  let matchStatus = "Needs Development";
  if (overallMatchScore >= 80) matchStatus = "Interview Ready";
  else if (overallMatchScore >= 65) matchStatus = "Strong Alignment";
  else if (overallMatchScore >= 45) matchStatus = "Moderate Alignment";

  const strengths = skillGaps.filter((s) => s.matchClassification === "Matched" || s.status === "Strong");
  const weaknesses = skillGaps
    .filter((s) => s.gap > 0 || s.matchClassification !== "Matched")
    .sort((a, b) => b.gap - a.gap);

  return {
    total,
    covered,
    matchedCount,
    partialCount,
    missingCount,
    highPriority,
    averageGap,
    overallMatchScore,
    matchStatus,
    strengths,
    weaknesses,
  };
}

export default calculateSkillGaps;

