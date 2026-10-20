/* =========================================
   useReadiness - Deterministic Readiness Score
   
   Calculates an explainable job readiness score
   based on the weighted formula from PRD §25:
   
   Skill Match:             40%
   Technical Assessment:    30%
   Practical Assignments:   20%
   Profile/Resume Evidence: 10%
   ========================================= */


/**
 * Helper to validate and clamp numeric scores strictly to [0, 100].
 * Rejects NaN, infinite, or non-numeric inputs gracefully to 0.
 *
 * @param {*} val - Input score value
 * @returns {number} Clamped integer between 0 and 100
 */
function clampScore(val) {
  if (typeof val !== "number" || isNaN(val) || !isFinite(val)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(val)));
}

/**
 * Calculates the job readiness score and its explainable breakdown.
 *
 * Requirements:
 * 1. Weights: 40% Resume-based Skill Match, 30% Technical Assessment, 20% Practical Assignments, 10% Profile Completeness.
 * 2. Assessment scores do NOT leak into the 40% resume skill match.
 * 3. Profile completeness does NOT duplicate resume-upload credit.
 * 4. Distinguishes unavailable inputs from genuine zero scores, exposing provisional vs complete readiness.
 * 5. All scores strictly validated and bounded to 0-100.
 *
 * @param {Object} params
 * @param {Array}  params.skillGaps       - Array of { current, required, resumeScore } skill objects
 * @param {Object} params.assessment      - Latest assessment result { score, completed }
 * @param {Object} params.assignmentStats - { completed, total }
 * @param {Object|number} params.profileStats - { profileCompletion (0-100), resumeUploaded (bool) } or direct number
 * @param {number} [params.skillMatchScore] - Optional direct override for resume skill match score (0-100)
 * @returns {{
 *   overall: number,
 *   status: string,
 *   isProvisional: boolean,
 *   isComplete: boolean,
 *   readinessType: string,
 *   breakdown: Object
 * }}
 */
export function calculateReadiness({
  skillGaps = [],
  assessment = null,
  assignmentStats = { completed: 0, total: 1 },
  profileStats = { profileCompletion: 0, resumeUploaded: false },
  skillMatchScore: directSkillMatchScore,
} = {}) {

  /* =========================================
     1. RESUME-BASED SKILL MATCH (40% weight)
     Measures match of resume evidence against target JD.
     Assessment results are explicitly excluded to prevent double counting.
  ========================================= */

  let skillMatchScore = 0;
  const skillMatchAvailable = Array.isArray(skillGaps) && skillGaps.length > 0;

  if (typeof directSkillMatchScore === "number" && !isNaN(directSkillMatchScore)) {
    skillMatchScore = clampScore(directSkillMatchScore);
  } else if (skillMatchAvailable) {
    const totalMatch = skillGaps.reduce((sum, skill) => {
      // Use pure resume-extracted evidence score if available, avoiding assessment boosts
      let demonstrated = 0;
      if (typeof skill.resumeScore === "number" && !isNaN(skill.resumeScore)) {
        demonstrated = skill.resumeScore;
      } else if (typeof skill.evidenceScore === "number" && !isNaN(skill.evidenceScore)) {
        demonstrated = skill.evidenceScore;
      } else if (typeof skill.rawResumeScore === "number" && !isNaN(skill.rawResumeScore)) {
        demonstrated = skill.rawResumeScore;
      } else if (typeof skill.baselineScore === "number" && !isNaN(skill.baselineScore)) {
        demonstrated = skill.baselineScore;
      } else if (assessment && assessment.completed === true) {
        // Guard against assessment-influenced skill.current when resumeScore is missing:
        // Strip out any assessment scores. If candidate has documented resume evidence,
        // use baseline evidence; otherwise demonstrated is strictly 0.
        const assessedSkillScore = assessment.skillScores?.[skill.name] ?? assessment.score;
        if (Array.isArray(skill.evidence) && skill.evidence.length > 0 && skill.current !== assessedSkillScore) {
          demonstrated = typeof skill.current === "number" ? skill.current : 0;
        } else {
          demonstrated = 0;
        }
      } else {
        demonstrated = typeof skill.current === "number" && !isNaN(skill.current) ? skill.current : 0;
      }

      const required = typeof skill.required === "number" && skill.required > 0
        ? skill.required
        : (typeof skill.requiredScore === "number" && skill.requiredScore > 0 ? skill.requiredScore : 80);

      const ratio = Math.min(Math.max(0, demonstrated) / required, 1);
      return sum + ratio;
    }, 0);

    skillMatchScore = clampScore((totalMatch / skillGaps.length) * 100);
  }


  /* =========================================
     2. TECHNICAL ASSESSMENT (30% weight)
     Assesses diagnostic coding and engineering tests.
     Distinguishes not taken (unavailable) from a genuine score of 0.
  ========================================= */

  const assessmentAvailable = Boolean(
    assessment &&
    assessment.completed === true &&
    typeof assessment.score === "number" &&
    !isNaN(assessment.score)
  );

  let assessmentScore = 0;
  if (assessmentAvailable) {
    assessmentScore = clampScore(assessment.score);
  }


  /* =========================================
     3. PRACTICAL ASSIGNMENTS (20% weight)
     Percentage of hands-on project assignments completed.
     Distinguishes no assignments assigned from 0 completed.
  ========================================= */

  const assignmentTotal = typeof assignmentStats?.total === "number" ? assignmentStats.total : 0;
  const assignmentCompleted = typeof assignmentStats?.completed === "number" ? assignmentStats.completed : 0;
  const practicalAvailable = assignmentTotal > 0;

  let practicalScore = 0;
  if (practicalAvailable) {
    practicalScore = clampScore((assignmentCompleted / assignmentTotal) * 100);
  }


  /* =========================================
     4. PROFILE COMPLETENESS (10% weight)
     Measures student credential completeness.
     Does not apply secondary duplicate resume multiplier.
  ========================================= */

  let profileScore = 0;
  let profileAvailable = false;

  if (typeof profileStats === "number") {
    profileAvailable = !isNaN(profileStats);
    profileScore = clampScore(profileStats);
  } else if (profileStats && typeof profileStats === "object") {
    if (typeof profileStats.profileCompletion === "number") {
      profileAvailable = !isNaN(profileStats.profileCompletion);
      profileScore = clampScore(profileStats.profileCompletion);
    } else if (typeof profileStats.resumeUploaded === "boolean") {
      profileAvailable = true;
      profileScore = profileStats.resumeUploaded ? 100 : 0;
    }
  }


  /* =========================================
     5. WEIGHTED OVERALL SCORE & INTEGRITY
  ========================================= */

  const weights = {
    skillMatch: 0.4,
    assessment: 0.3,
    practical: 0.2,
    profile: 0.1,
  };

  const clampedSkillMatchScore = clampScore(skillMatchScore);
  const clampedAssessmentScore = clampScore(assessmentScore);
  const clampedPracticalScore = clampScore(practicalScore);
  const clampedProfileScore = clampScore(profileScore);

  const overall = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        clampedSkillMatchScore * weights.skillMatch +
        clampedAssessmentScore * weights.assessment +
        clampedPracticalScore * weights.practical +
        clampedProfileScore * weights.profile
      )
    )
  );


  /* =========================================
     6. PROVISIONAL vs COMPLETE EVALUATION
     Readiness is provisional if critical inputs (assessment or skill match)
     are unavailable/not yet evaluated.
  ========================================= */

  const isProvisional = !assessmentAvailable || !skillMatchAvailable;
  const isComplete = !isProvisional;
  const readinessType = isProvisional ? "provisional" : "complete";


  /* =========================================
     7. STATUS DETERMINATION
  ========================================= */

  let status = "Not Started";

  if (overall >= 85) {
    status = "Job Ready";
  } else if (overall >= 70) {
    status = "Almost Ready";
  } else if (overall >= 50) {
    status = "Developing";
  } else if (overall > 0) {
    status = "Getting Started";
  }


  /* =========================================
     8. RETURN EXPLAINABLE RESULT
  ========================================= */

  return {

    overall,

    status,

    isProvisional,

    isComplete,

    readinessType,

    breakdown: {
      skillMatch: {
        score: clampedSkillMatchScore,
        weight: weights.skillMatch,
        weighted: Math.round(
          clampedSkillMatchScore * weights.skillMatch
        ),
        label: "Skill Match",
        isAvailable: skillMatchAvailable,
        status: !skillMatchAvailable
          ? "unavailable"
          : clampedSkillMatchScore === 0
            ? "zero"
            : "completed",
      },
      assessment: {
        score: clampedAssessmentScore,
        weight: weights.assessment,
        weighted: Math.round(
          clampedAssessmentScore * weights.assessment
        ),
        label: "Technical Assessment",
        isAvailable: assessmentAvailable,
        status: !assessmentAvailable
          ? "not_taken"
          : clampedAssessmentScore === 0
            ? "zero"
            : "completed",
      },
      practical: {
        score: clampedPracticalScore,
        weight: weights.practical,
        weighted: Math.round(
          clampedPracticalScore * weights.practical
        ),
        label: "Practical Assignments",
        isAvailable: practicalAvailable,
        status: !practicalAvailable
          ? "unavailable"
          : clampedPracticalScore === 0
            ? "zero"
            : "completed",
      },
      profile: {
        score: clampedProfileScore,
        weight: weights.profile,
        weighted: Math.round(
          clampedProfileScore * weights.profile
        ),
        label: "Profile Evidence",
        isAvailable: profileAvailable,
        status: !profileAvailable
          ? "unavailable"
          : clampedProfileScore === 0
            ? "zero"
            : "completed",
      },
    },

  };
}


/**
 * Calculates profile completion percentage based on filled profile fields.
 * Includes single equal credit for resume upload without duplication.
 *
 * @param {Object} profile - User profile object
 * @param {boolean} resumeUploaded - Whether resume is uploaded
 * @param {string} targetJob - Selected target job
 * @returns {number} Completion percentage (0-100)
 */
export function calculateProfileCompletion(
  profile = {},
  resumeUploaded = false,
  targetJob = "",
) {
  const safeProfile = profile || {};

  const checks = [
    // Personal info (4 fields)
    Boolean(safeProfile.name),
    Boolean(safeProfile.email),
    Boolean(safeProfile.phone),
    Boolean(safeProfile.location),
    // Education (3 fields)
    Boolean(safeProfile.college),
    Boolean(safeProfile.degree),
    Boolean(safeProfile.branch),
    // Academic details (2 fields)
    Boolean(safeProfile.graduation),
    Boolean(safeProfile.cgpa || safeProfile.rollNo),
    // Resume (single credit - duplicate removed)
    Boolean(resumeUploaded),
    // Target job selected (1 field)
    Boolean(targetJob),
  ];

  const filled = checks.filter(Boolean).length;

  return Math.round(
    (filled / checks.length) * 100
  );
}


/**
 * Calculates curriculum / learning progress percentage based on completed lessons.
 * Strictly distinct from job readiness: measures educational roadmap completion (0-100).
 *
 * @param {Array|number} completedLessons - Array of completed lesson IDs or count
 * @param {Array|number} totalLessons - Array of total lessons or count
 * @returns {number} Clamped completion percentage between 0 and 100
 */
export function calculateLearningCompletion(completedLessons = [], totalLessons = []) {
  const completedCount = Array.isArray(completedLessons)
    ? completedLessons.length
    : (typeof completedLessons === "number" && !isNaN(completedLessons) ? completedLessons : 0);
  const totalCount = Array.isArray(totalLessons)
    ? totalLessons.length
    : (typeof totalLessons === "number" && !isNaN(totalLessons) ? totalLessons : 0);

  if (totalCount <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((completedCount / totalCount) * 100)));
}


/**
 * Compares two readiness calculations and yields component-level deltas.
 *
 * @param {Object} currentReadiness - Current calculateReadiness result
 * @param {Object} previousReadiness - Previous calculateReadiness result
 * @returns {Object} Structured comparison containing overall delta and per-pillar breakdown deltas
 */
export function compareReadiness(currentReadiness, previousReadiness) {
  if (!previousReadiness || typeof previousReadiness.overall !== "number") {
    return {
      hasPrevious: false,
      currentOverall: currentReadiness?.overall ?? 0,
      previousOverall: null,
      overallDelta: 0,
      deltaFormatted: "Baseline",
      isImproved: false,
      isDeclined: false,
      components: {
        skillMatch: {
          label: "Skill Match",
          current: currentReadiness?.breakdown?.skillMatch?.score ?? 0,
          previous: null,
          delta: 0,
          deltaFormatted: "N/A",
        },
        assessment: {
          label: "Technical Assessment",
          current: currentReadiness?.breakdown?.assessment?.score ?? 0,
          previous: null,
          delta: 0,
          deltaFormatted: "N/A",
        },
        practical: {
          label: "Practical Assignments",
          current: currentReadiness?.breakdown?.practical?.score ?? 0,
          previous: null,
          delta: 0,
          deltaFormatted: "N/A",
        },
        profile: {
          label: "Profile Evidence",
          current: currentReadiness?.breakdown?.profile?.score ?? 0,
          previous: null,
          delta: 0,
          deltaFormatted: "N/A",
        },
      },
    };
  }

  const currentOverall = currentReadiness?.overall ?? 0;
  const previousOverall = previousReadiness?.overall ?? 0;
  const overallDelta = currentOverall - previousOverall;

  const getCompDelta = (key, label) => {
    const curr = currentReadiness?.breakdown?.[key]?.score ?? 0;
    const prev = previousReadiness?.breakdown?.[key]?.score ?? 0;
    const delta = curr - prev;
    return {
      label,
      current: curr,
      previous: prev,
      delta,
      deltaFormatted: delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : "0%",
    };
  };

  return {
    hasPrevious: true,
    currentOverall,
    previousOverall,
    overallDelta,
    deltaFormatted: overallDelta > 0 ? `+${overallDelta}%` : overallDelta < 0 ? `${overallDelta}%` : "0%",
    isImproved: overallDelta > 0,
    isDeclined: overallDelta < 0,
    components: {
      skillMatch: getCompDelta("skillMatch", "Skill Match (40%)"),
      assessment: getCompDelta("assessment", "Technical Assessment (30%)"),
      practical: getCompDelta("practical", "Practical Work (20%)"),
      profile: getCompDelta("profile", "Profile Evidence (10%)"),
    },
  };
}

export default calculateReadiness;
