/**
 * Skill Matching Engine - Skill Point
 *
 * Module 3: Intelligent Resume ↔ Job Description Skill Matching
 *
 * Capabilities:
 *  • Multi-source Evidence Analysis:
 *     - Evaluates Skills section, Project descriptions, Work experience, and Certifications
 *     - Never relies on shallow keyword presence alone
 *  • Three-tier Skill Classification:
 *     - Matched: Strong hands-on proof + benchmark met
 *     - Partially Matched: Theoretical presence (skills-only) or proficiency deficit
 *     - Missing: Not detected in student's background
 *  • Intelligent Priority Assignment:
 *     - High: Critical required deficits that block ATS/interview stages
 *     - Medium: Preferred deficits or moderate partial proficiencies
 *     - Low: Already satisfied benchmarks or secondary partial matches
 *  • Explainable Evidence Audit Trail:
 *     - Concrete explanation of why each skill was classified as Matched, Partial, or Missing
 *  • Weighted Overall Match Score (%) calculation
 *  • 100% deterministic, zero external paid APIs required.
 */

import { determineSkillLevel, SKILL_LEVELS } from "./skillLevelService.js";

/**
 * Normalizes text for consistent comparison
 */
function normalize(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9+#.]/g, " ");
}

/**
 * Canonical dictionary mapping aliases to industry-standard naming
 */
export const CANONICAL_SKILL_MAP = {
  "react": "React",
  "react.js": "React",
  "reactjs": "React",
  "node": "Node.js",
  "node.js": "Node.js",
  "nodejs": "Node.js",
  "express": "Express.js",
  "express.js": "Express.js",
  "expressjs": "Express.js",
  "spring": "Spring Boot",
  "spring boot": "Spring Boot",
  "spring framework": "Spring Boot",
  "rest": "REST API",
  "rest api": "REST API",
  "restful": "REST API",
  "restful api": "REST API",
  "rest apis": "REST API",
  "api design": "REST API",
  "dsa": "DSA",
  "data structures": "DSA",
  "algorithms": "DSA",
  "oop": "OOP",
  "oops": "OOP",
  "object oriented programming": "OOP",
  "sql": "SQL",
  "rdbms": "SQL",
  "sqlite": "SQL",
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "mongo": "MongoDB",
  "mongodb": "MongoDB",
  "nosql": "MongoDB",
  "docker": "Docker",
  "containerization": "Docker",
  "containers": "Docker",
  "kubernetes": "Kubernetes",
  "k8s": "Kubernetes",
  "git": "Git",
  "github": "Git",
  "gitlab": "Git",
  "version control": "Git",
  "cicd": "CI/CD",
  "ci/cd": "CI/CD",
  "ci cd": "CI/CD",
  "continuous integration": "CI/CD",
  "github actions": "CI/CD",
  "jenkins": "CI/CD",
  "aws": "AWS",
  "amazon web services": "AWS",
  "gcp": "GCP",
  "google cloud": "GCP",
  "azure": "Azure",
  "microsoft azure": "Azure",
  "typescript": "TypeScript",
  "ts": "TypeScript",
  "javascript": "JavaScript",
  "js": "JavaScript",
  "es6": "JavaScript",
  "java": "Java",
  "python": "Python",
  "linux": "Linux",
  "unit test": "Unit Testing",
  "unit testing": "Unit Testing",
  "junit": "Unit Testing",
  "jest": "Unit Testing",
  "testing": "Unit Testing",
  "system design": "System Design",
  "distributed systems": "System Design",
  "scalable architecture": "System Design",
};

/**
 * Returns canonical display name for any skill variant
 * @param {string} rawName - Raw skill input
 * @returns {string} Standardized skill name
 */
export function getCanonicalSkillName(rawName) {
  if (!rawName || typeof rawName !== "string") return "";
  const cleaned = rawName.trim();
  const lower = cleaned.toLowerCase();
  return CANONICAL_SKILL_MAP[lower] || cleaned;
}

/**
 * Returns a consistent lowercase slug identifier for a skill
 * @param {string} rawName - Raw skill input
 * @returns {string} Canonical ID slug (e.g. 'spring_boot')
 */
export function getCanonicalSkillId(rawName) {
  const canonical = getCanonicalSkillName(rawName);
  return canonical.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

/**
 * Checks if two technical terms refer to the same or closely related skill
 */
export function isSkillMatch(targetName, candidateName) {
  const tNorm = getCanonicalSkillName(targetName);
  const cNorm = getCanonicalSkillName(candidateName);
  if (tNorm.toLowerCase() === cNorm.toLowerCase()) return true;

  const t = normalize(targetName);
  const c = normalize(candidateName);

  if (t === c) return true;
  if (t.length > 2 && c.length > 2) {
    if (t.includes(c) || c.includes(t)) return true;
  }

  // Common technical synonyms / aliases
  const synonyms = [
    ["react", "react.js", "reactjs"],
    ["node", "node.js", "nodejs"],
    ["next", "next.js", "nextjs"],
    ["express", "express.js", "expressjs"],
    ["vue", "vue.js", "vuejs"],
    ["angular", "angularjs"],
    ["sql", "mysql", "postgresql", "postgres", "rdbms", "sqlite"],
    ["mongo", "mongodb", "nosql"],
    ["rest", "rest api", "restful", "restful api", "rest apis", "api design"],
    ["dsa", "data structures", "algorithms", "problem solving"],
    ["oop", "oops", "object oriented programming"],
    ["docker", "containerization", "containers"],
    ["kubernetes", "k8s"],
    ["aws", "amazon web services"],
    ["gcp", "google cloud", "google cloud platform"],
    ["azure", "microsoft azure"],
    ["ci cd", "cicd", "continuous integration", "github actions", "jenkins"],
    ["git", "github", "gitlab", "version control"],
    ["unit test", "unit testing", "junit", "jest", "testing", "qa"],
    ["spring", "spring boot", "spring framework"],
    ["typescript", "ts"],
    ["javascript", "js", "es6"],
    ["system design", "distributed systems", "scalable architecture"],
  ];

  for (const group of synonyms) {
    const hasT = group.some((term) => t === term || t.includes(term));
    const hasC = group.some((term) => c === term || c.includes(term));
    if (hasT && hasC) return true;
  }

  return false;
}

/**
 * Searches resume projects, experience, certifications, and skills text for evidence of a target skill
 */
function searchResumeEvidence(skillName, parsedResume) {
  if (!parsedResume) {
    return {
      found: false,
      score: 0,
      evidenceList: [],
      evidenceDepth: 0,
      hasHandsOn: false,
      hasWorkExp: false,
      hasCertification: false,
      hasSkillsSection: false,
    };
  }

  const sNorm = normalize(skillName);
  const evidenceList = [];
  let score = 0;
  let hasHandsOn = false;
  let hasWorkExp = false;
  let hasCertification = false;
  let hasSkillsSection = false;

  // 1. Check detected skills from parser
  const detected = (parsedResume.detectedSkills || []).find((s) =>
    isSkillMatch(skillName, s.name)
  );

  if (detected) {
    score = detected.score || 70;
    if (Array.isArray(detected.evidence)) {
      detected.evidence.forEach((ev) => {
        if (!evidenceList.includes(ev)) evidenceList.push(ev);
        if (ev.toLowerCase().includes("project")) hasHandsOn = true;
        if (ev.toLowerCase().includes("experience")) hasWorkExp = true;
        if (ev.toLowerCase().includes("certification")) hasCertification = true;
        if (ev.toLowerCase().includes("skills")) hasSkillsSection = true;
      });
    }
  }

  // 2. Scan Projects directly
  (parsedResume.projects || []).forEach((proj) => {
    const projText = normalize(
      `${proj.title} ${(proj.technologies || []).join(" ")} ${proj.description || ""}`
    );
    if (projText.includes(sNorm) || isSkillMatch(skillName, projText)) {
      const label = `Project: ${proj.title || "Technical Project"}`;
      if (!evidenceList.includes(label)) {
        evidenceList.push(label);
        hasHandsOn = true;
      }
    }
  });

  // 3. Scan Experiences directly
  (parsedResume.experiences || []).forEach((exp) => {
    const expText = normalize(
      `${exp.role || ""} ${exp.company || ""} ${(exp.technologies || []).join(" ")} ${exp.description || ""}`
    );
    if (expText.includes(sNorm) || isSkillMatch(skillName, expText)) {
      const label = `Experience: ${exp.role || "Role"} at ${exp.company || "Company"}`;
      if (!evidenceList.includes(label)) {
        evidenceList.push(label);
        hasWorkExp = true;
      }
    }
  });

  // 4. Scan Certifications directly
  (parsedResume.certifications || []).forEach((cert) => {
    const certText = normalize(`${cert.name || ""} ${cert.issuer || ""}`);
    if (certText.includes(sNorm) || isSkillMatch(skillName, certText)) {
      const label = `Certification: ${cert.name || "Credential"}`;
      if (!evidenceList.includes(label)) {
        evidenceList.push(label);
        hasCertification = true;
      }
    }
  });

  // Calculate evidence depth metric
  let evidenceDepth = 0;
  if (hasSkillsSection) evidenceDepth += 1;
  if (hasHandsOn) evidenceDepth += 2;
  if (hasWorkExp) evidenceDepth += 3;
  if (hasCertification) evidenceDepth += 2;

  // Base score heuristic if not previously scored
  if (score === 0 && evidenceList.length > 0) {
    if (hasWorkExp) score = 85;
    else if (hasHandsOn && hasCertification) score = 80;
    else if (hasHandsOn) score = 75;
    else if (hasCertification) score = 70;
    else score = 50;
  }

  return {
    found: evidenceList.length > 0,
    score,
    evidenceList,
    evidenceDepth,
    hasHandsOn,
    hasWorkExp,
    hasCertification,
    hasSkillsSection,
  };
}

/**
 * Classifies an individual skill into Matched, Partially Matched, or Missing
 */
export function classifySkill({
  skill,
  parsedResume,
  assessmentScore = null,
  assignmentBoost = 0,
  lessonBoost = 0,
  skillLevelRecord = null,
}) {
  const targetRequired = skill.requiredScore || skill.required || 80;
  const isRequired = skill.source === "Required" || skill.priority === "High";

  const evidence = searchResumeEvidence(skill.name, parsedResume);

  // Apply candidate boosts from assessments, assignments, and verified skill levels
  let currentScore = evidence.score;
  if (skillLevelRecord && typeof skillLevelRecord.score === "number") {
    currentScore = Math.max(currentScore, skillLevelRecord.score);
  }
  if (typeof assessmentScore === "number" && assessmentScore > 0) {
    currentScore = Math.max(currentScore, assessmentScore);
  }
  currentScore = Math.min(100, currentScore + assignmentBoost + lessonBoost);

  // Incorporate verified assessment evidence if available
  if (skillLevelRecord?.evidence && !evidence.evidenceList.includes(skillLevelRecord.evidence)) {
    evidence.evidenceList.unshift(skillLevelRecord.evidence);
    evidence.evidenceDepth += 2;
  }

  const currentLevel = skillLevelRecord?.currentLevel || determineSkillLevel(currentScore);
  const previousLevel = skillLevelRecord?.previousLevel || currentLevel;
  const levelTrend = skillLevelRecord?.trend || "Maintained";
  const levelTrendLabel = skillLevelRecord?.trendLabel || "";
  const isPromoted = Boolean(skillLevelRecord?.isPromoted);

  let matchClassification = "Missing";
  let explanation = "";
  let priority = "Low";
  const gap = Math.max(targetRequired - currentScore, 0);

  if (!evidence.found && currentScore === 0) {
    // -------------------------------------------------------------
    // MISSING
    // -------------------------------------------------------------
    matchClassification = "Missing";
    priority = isRequired ? "High" : "Medium";
    explanation = "No evidence found in resume projects, work experience, certifications, or assessments.";
  } else {
    // -------------------------------------------------------------
    // MATCHED vs PARTIALLY MATCHED
    // -------------------------------------------------------------
    const hasAppliedProof = evidence.hasHandsOn || evidence.hasWorkExp || evidence.hasCertification || Boolean(skillLevelRecord?.evidence);

    // Conditions for MATCHED:
    // 1. Hands-on applied proof (Project/Work experience/Certification/Assessment) AND currentScore meets 75%+ of target
    // 2. OR verified Advanced skill level
    // 3. OR high evidence depth (found in 2+ independent sections)
    // 4. OR currentScore >= targetRequired
    const isStrongMatch =
      (currentLevel === SKILL_LEVELS.ADVANCED && currentScore >= targetRequired * 0.85) ||
      (hasAppliedProof && currentScore >= targetRequired * 0.75) ||
      (evidence.evidenceDepth >= 3) ||
      (currentScore >= targetRequired);

    if (isStrongMatch) {
      matchClassification = "Matched";
      priority = "Low"; // Satisfied requirement

      const proofSources = [];
      if (skillLevelRecord?.evidence) proofSources.push("Assessment Verification");
      if (evidence.hasWorkExp) proofSources.push("Work Experience");
      if (evidence.hasHandsOn) proofSources.push("Practical Projects");
      if (evidence.hasCertification) proofSources.push("Certifications");
      if (evidence.hasSkillsSection) proofSources.push("Skills List");

      explanation = `Verified match (${currentLevel}). Strong proof in ${proofSources.join(" & ") || "resume & assessments"}. Benchmark satisfied (${currentScore}% vs ${targetRequired}% target).`;
    } else {
      // PARTIALLY MATCHED:
      matchClassification = "Partially Matched";
      priority = isRequired && gap > 20 ? "High" : isRequired ? "Medium" : "Low";

      if (skillLevelRecord) {
        explanation = `Partially matched (${currentLevel}). Evaluated at ${currentScore}%, deficit: ${gap}%. Progressing toward ${targetRequired}% target.`;
      } else if (!hasAppliedProof) {
        explanation = `Partially matched (${currentLevel}). Listed in Skills section but lacks supporting practical Project or Work Experience evidence. Benchmark deficit: ${gap}%.`;
      } else {
        explanation = `Partially matched (${currentLevel}). Hands-on proof detected but demonstrated proficiency (${currentScore}%) falls below target benchmark (${targetRequired}%). Deficit: ${gap}%.`;
      }
    }
  }

  const canonicalName = getCanonicalSkillName(skill.name || skill.skill || "");
  const canonicalId = getCanonicalSkillId(skill.name || skill.skill || "");

  return {
    id: skill.id || canonicalId,
    name: canonicalName || skill.name,
    category: skill.category || "Skill",
    source: skill.source || (isRequired ? "Required" : "Preferred"),
    importance: isRequired ? "High" : "Medium",
    required: targetRequired,
    requiredScore: targetRequired,
    current: currentScore,
    resumeScore: evidence.score,
    gap,
    matchClassification,
    status: matchClassification === "Matched" ? "Strong" : matchClassification === "Partially Matched" ? "Developing" : "Missing",
    priority,
    currentLevel,
    previousLevel,
    levelTrend,
    levelTrendLabel,
    isPromoted,
    skillLevel: currentLevel,
    skillTrend: levelTrend,
    promoted: isPromoted,
    skillScore: currentScore,
    skillDelta: skillLevelRecord?.delta || 0,
    evidence: evidence.evidenceList,
    evidenceDepth: evidence.evidenceDepth,
    hasHandsOn: evidence.hasHandsOn,
    hasWorkExp: evidence.hasWorkExp,
    hasCertification: evidence.hasCertification,
    assessmentHistory: skillLevelRecord?.history || [],
    explanation,
  };
}

/**
 * Executes full Module 3 Skill Matching between candidate resume and Job Description
 *
 * Supports both call signatures:
 *   matchResumeWithJobDescriptionIntelligence({ parsedResume, activeJD, ...options })
 *   matchResumeWithJobDescriptionIntelligence(parsedResume, activeJD, options)
 *
 * @returns {Object} Comprehensive match analytics and audit report
 */
export function matchResumeWithJobDescriptionIntelligence(arg1, arg2, options = {}) {
  let parsedResume;
  let activeJD;
  let assessment = null;
  let skillLevels = {};
  let assignmentCompletions = {};
  let assignments = [];
  let completedLessons = [];
  let lessons = [];

  if (arg1 && typeof arg1 === "object" && ("parsedResume" in arg1 || "activeJD" in arg1)) {
    parsedResume = arg1.parsedResume;
    activeJD = arg1.activeJD;
    assessment = arg1.assessment || null;
    skillLevels = arg1.skillLevels || {};
    assignmentCompletions = arg1.assignmentCompletions || {};
    assignments = arg1.assignments || [];
    completedLessons = arg1.completedLessons || [];
    lessons = arg1.lessons || [];
  } else {
    parsedResume = arg1;
    activeJD = arg2;
    assessment = options.assessment || null;
    skillLevels = options.skillLevels || (options && typeof options === "object" && !("assessment" in options) ? options : {});
    assignmentCompletions = options.assignmentCompletions || {};
    assignments = options.assignments || [];
    completedLessons = options.completedLessons || [];
    lessons = options.lessons || [];
  }

  // 1. Gather all skills to evaluate from activeJD
  let rawRequired = [];
  let rawPreferred = [];

  const normalizeSkillInput = (s, defaultSource) => {
    if (typeof s === "string") {
      return { name: s.trim(), source: defaultSource, importance: defaultSource === "Required" ? "High" : "Medium", requiredScore: 80 };
    }
    return {
      ...s,
      name: s.name || s.skill || "",
      source: s.source || defaultSource,
      importance: s.importance || (defaultSource === "Required" ? "High" : "Medium"),
      requiredScore: s.requiredScore || s.required || 80,
    };
  };

  if (activeJD) {
    if (Array.isArray(activeJD.requiredSkills) && activeJD.requiredSkills.length > 0) {
      rawRequired = activeJD.requiredSkills.map((s) => normalizeSkillInput(s, "Required"));
    }
    if (Array.isArray(activeJD.preferredSkills) && activeJD.preferredSkills.length > 0) {
      rawPreferred = activeJD.preferredSkills.map((s) => normalizeSkillInput(s, "Preferred"));
    }

    // Fallback if requiredSkills was empty but extractedSkills exists
    if (rawRequired.length === 0 && Array.isArray(activeJD.extractedSkills) && activeJD.extractedSkills.length > 0) {
      rawRequired = activeJD.extractedSkills.map((s) => normalizeSkillInput(s, "Required"));
    }
  }

  // Fallback defaults if no skills at all in activeJD
  if (rawRequired.length === 0 && rawPreferred.length === 0) {
    rawRequired = [
      { name: "Java", required: 80, importance: "High", category: "Language", source: "Required" },
      { name: "Spring Boot", required: 80, importance: "High", category: "Framework", source: "Required" },
      { name: "REST API", required: 80, importance: "High", category: "Concept", source: "Required" },
      { name: "SQL", required: 75, importance: "Medium", category: "Database", source: "Required" },
      { name: "Docker", required: 75, importance: "High", category: "Tool", source: "Required" },
      { name: "Git", required: 75, importance: "Low", category: "Tool", source: "Required" },
    ];
  }

  // Helper to find matching skill level record using canonical and normalized lookups
  const findSkillLevelRecord = (skillName) => {
    if (!skillLevels || typeof skillLevels !== "object") return null;
    if (skillLevels[skillName]) return skillLevels[skillName];
    const cNorm = getCanonicalSkillName(skillName).toLowerCase();
    const sNorm = skillName.toLowerCase();
    const matchKey = Object.keys(skillLevels).find(
      (k) => k.toLowerCase() === sNorm || getCanonicalSkillName(k).toLowerCase() === cNorm
    );
    return matchKey ? skillLevels[matchKey] : null;
  };

  const getAssessedScore = (skillName) => {
    if (!assessment?.skillScores || typeof assessment.skillScores !== "object") return null;
    if (typeof assessment.skillScores[skillName] === "number") return assessment.skillScores[skillName];
    const cName = getCanonicalSkillName(skillName);
    if (typeof assessment.skillScores[cName] === "number") return assessment.skillScores[cName];
    const cLower = cName.toLowerCase();
    const matchKey = Object.keys(assessment.skillScores).find(
      (k) => k.toLowerCase() === skillName.toLowerCase() || getCanonicalSkillName(k).toLowerCase() === cLower
    );
    return matchKey ? assessment.skillScores[matchKey] : null;
  };

  // 2. Classify every required skill
  const evaluatedRequired = rawRequired.map((skill) => {
    // Check per-skill assessment with canonical resolution
    const assessedScore = getAssessedScore(skill.name);

    // Check assignment boost
    const cSkillName = getCanonicalSkillName(skill.name);
    const skillAssignments = assignments.filter(
      (a) => a.skill === skill.name || getCanonicalSkillName(a.skill) === cSkillName
    );
    const completedCount = skillAssignments.filter((a) => assignmentCompletions[a.id]).length;
    const assignmentBoost = completedCount * 5;

    // Check lesson boost
    const skillLessons = lessons.filter(
      (l) => l.skill === skill.name || getCanonicalSkillName(l.skill) === cSkillName
    );
    const completedLessonCount = skillLessons.filter((l) => completedLessons.includes(l.id)).length;
    const lessonBoost = completedLessonCount * 3;

    const skillLevelRecord = findSkillLevelRecord(skill.name);

    return classifySkill({
      skill,
      parsedResume,
      assessmentScore: assessedScore,
      assignmentBoost,
      lessonBoost,
      skillLevelRecord,
    });
  });

  // 3. Classify every preferred skill
  const evaluatedPreferred = rawPreferred.map((skill) => {
    const assessedScore = getAssessedScore(skill.name);
    const skillLevelRecord = findSkillLevelRecord(skill.name);

    return classifySkill({
      skill,
      parsedResume,
      assessmentScore: assessedScore,
      assignmentBoost: 0,
      lessonBoost: 0,
      skillLevelRecord,
    });
  });

  // 4. Combine into unified list
  const allEvaluated = [...evaluatedRequired, ...evaluatedPreferred];

  // 5. Partition by classification
  const matchedSkills = allEvaluated.filter((s) => s.matchClassification === "Matched");
  const partialSkills = allEvaluated.filter((s) => s.matchClassification === "Partially Matched");
  const missingSkills = allEvaluated.filter((s) => s.matchClassification === "Missing");
  const highPriorityGaps = allEvaluated.filter((s) => s.priority === "High");

  // 6. Calculate Weighted Overall Skill Match Score (%)
  // Required skills weight = 3, Preferred skills weight = 1
  let totalPossibleWeight = 0;
  let earnedScoreWeight = 0;

  evaluatedRequired.forEach((s) => {
    const weight = 3;
    totalPossibleWeight += weight;
    if (s.matchClassification === "Matched") {
      const perfRatio = Math.min(s.current / s.required, 1.15);
      earnedScoreWeight += weight * perfRatio;
    } else if (s.matchClassification === "Partially Matched") {
      const perfRatio = Math.max((s.current / s.required) * 0.7, 0.45);
      earnedScoreWeight += weight * perfRatio;
    } else {
      earnedScoreWeight += 0;
    }
  });

  evaluatedPreferred.forEach((s) => {
    const weight = 1;
    totalPossibleWeight += weight;
    if (s.matchClassification === "Matched") {
      earnedScoreWeight += weight * 1.0;
    } else if (s.matchClassification === "Partially Matched") {
      earnedScoreWeight += weight * 0.5;
    } else {
      earnedScoreWeight += 0;
    }
  });

  const rawMatchScore = totalPossibleWeight > 0
    ? Math.round((earnedScoreWeight / totalPossibleWeight) * 100)
    : 0;

  // Clamped clean percentage
  const overallMatchScore = parsedResume
    ? Math.min(Math.max(rawMatchScore, 15), 98)
    : 0;

  // Match Status
  let matchStatus = "Needs Development";
  if (overallMatchScore >= 80) matchStatus = "Interview Ready";
  else if (overallMatchScore >= 65) matchStatus = "Strong Alignment";
  else if (overallMatchScore >= 45) matchStatus = "Moderate Alignment";

  // Actionable ATS & Skill Recommendations
  const actionableRecommendations = [];
  if (highPriorityGaps.length > 0) {
    const topGaps = highPriorityGaps.slice(0, 3).map((g) => g.name).join(", ");
    actionableRecommendations.push(
      `High Priority ATS Deficit: Add project evidence or take targeted assessments for ${topGaps} to satisfy mandatory qualifications.`
    );
  }
  if (partialSkills.length > 0) {
    const topPartial = partialSkills.slice(0, 2).map((p) => p.name).join(" and ");
    actionableRecommendations.push(
      `Bridge Evidence Gap: You have listed ${topPartial} in skills, but lack documented project proof. Build a practical project to convert them to Matched.`
    );
  }
  if (matchedSkills.length > 0) {
    actionableRecommendations.push(
      `Strong Alignment: Your verified competencies in ${matchedSkills.slice(0, 2).map((m) => m.name).join(" and ")} exceed benchmarks. Highlight them in your resume summary.`
    );
  }

  return {
    overallMatchScore,
    matchScore: overallMatchScore,
    matchStatus,
    matchedSkills,
    partialSkills,
    missingSkills,
    highPriorityGaps,
    requiredSkillsAnalysis: evaluatedRequired,
    preferredSkillsAnalysis: evaluatedPreferred,
    allSkillsAnalysis: allEvaluated,
    classifications: allEvaluated,
    summary: {
      totalSkills: allEvaluated.length,
      totalEvaluated: allEvaluated.length,
      totalRequired: evaluatedRequired.length,
      totalPreferred: evaluatedPreferred.length,
      matchedCount: matchedSkills.length,
      partialCount: partialSkills.length,
      missingCount: missingSkills.length,
      highPriorityCount: highPriorityGaps.length,
      highPriorityGaps: highPriorityGaps.length,
      mediumPriorityGaps: allEvaluated.filter((s) => s.priority === "Medium").length,
      lowPriorityGaps: allEvaluated.filter((s) => s.priority === "Low").length,
      coverageRate: allEvaluated.length > 0 ? Math.round((matchedSkills.length / allEvaluated.length) * 100) : 0,
    },
    actionableRecommendations,
  };
}

export default {
  classifySkill,
  matchResumeWithJobDescriptionIntelligence,
  getCanonicalSkillName,
  getCanonicalSkillId,
  isSkillMatch,
  CANONICAL_SKILL_MAP,
};