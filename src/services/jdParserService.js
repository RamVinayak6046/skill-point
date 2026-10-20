/**
 * Job Description (JD) Intelligence Parser & Matcher Service - Skill Point
 * 
 * Module 2: Job Description Intelligence
 *
 * Capabilities:
 *  • Multi-format text extraction integration (PDF, DOCX, TXT, Raw text)
 *  • Automated structuring & extraction:
 *     - Job Title & Company detection (explicit tags, header analysis, contextual patterns)
 *     - Required Skills (mandatory / must-have qualifications with required benchmarks)
 *     - Preferred Skills (nice-to-have, bonus, plus qualifications)
 *     - Technologies & Tools categorized (Languages, Frameworks, Databases, Cloud/DevOps, Tools)
 *     - Responsibilities & Key Duties (bullet point extraction & action-oriented parsing)
 *     - Experience Requirements (years of experience, degree, seniority level)
 *     - Core Engineering Competencies (System Design, API Engineering, Problem Solving, etc.)
 *  • Edit & Manual Correction compatibility
 *  • 100% deterministic, zero external paid APIs required.
 */

import { SKILL_TAXONOMY } from "./resumeParserService.js";

/* =====================================================================
   1. SECTION SLICER PATTERNS FOR JDs
===================================================================== */

const SECTION_HEADERS = [
  {
    key: "responsibilities",
    patterns: [
      /^(?:responsibilities|key responsibilities|what you(?:'ll| will) do|role & responsibilities|job responsibilities|duties|your impact|day[- ]to[- ]day|core responsibilities|what you will be doing|what you will do here)\b/i,
    ],
  },
  {
    key: "required",
    patterns: [
      /^(?:basic qualifications|minimum qualifications|required qualifications|requirements|required skills|what we(?:'re| are) looking for|what you bring|must have|key requirements|qualifications|eligibility|what you need to succeed|core requirements)\b/i,
    ],
  },
  {
    key: "preferred",
    patterns: [
      /^(?:preferred qualifications|desired qualifications|preferred skills|nice to have|bonus points|good to have|desired skills|preferred|pluses|additional qualifications|what would make you stand out|bonus)\b/i,
    ],
  },
  {
    key: "about",
    patterns: [
      /^(?:about us|about the company|who we are|company overview|our mission|the team|about the role)\b/i,
    ],
  },
];

/**
 * Segments JD text into logical sections based on common headings
 */
function segmentJDText(rawText) {
  const lines = rawText.split(/\r?\n/);
  const sections = {
    header: [],
    about: [],
    responsibilities: [],
    required: [],
    preferred: [],
    other: [],
  };

  let currentKey = "header";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line matches a known section header
    let matchedKey = null;
    for (const sec of SECTION_HEADERS) {
      if (sec.patterns.some((regex) => regex.test(trimmed))) {
        matchedKey = sec.key;
        break;
      }
    }

    if (matchedKey) {
      currentKey = matchedKey;
      continue;
    }

    sections[currentKey].push(trimmed);
  }

  return sections;
}

/* =====================================================================
   2. COMPETENCY DEFINITIONS TAXONOMY
===================================================================== */

const COMPETENCY_DEFINITIONS = [
  {
    id: "system_design",
    name: "System Design & Architecture",
    description: "Designing scalable, resilient distributed systems and architectural patterns.",
    category: "Architecture",
    keywords: [/\bsystem\s+design\b/i, /\bdistributed\s+systems\b/i, /\bscalable\s+systems\b/i, /\bhigh\s+availability\b/i, /\bmicroservices?\b/i, /\bsoftware\s+architecture\b/i],
  },
  {
    id: "api_engineering",
    name: "API Design & Integration",
    description: "Building, documenting, and securing RESTful and modern GraphQL APIs.",
    category: "Backend",
    keywords: [/\brest(?:ful)?\s*apis?\b/i, /\bapi\s+design\b/i, /\bgraphql\b/i, /\bweb\s*services\b/i, /\bendpoint\b/i, /\bhttp\s+protocols?\b/i],
  },
  {
    id: "algorithms_dsa",
    name: "Algorithms & Problem Solving",
    description: "Data structures, algorithmic complexity (Big-O), and analytical problem solving.",
    category: "Core",
    keywords: [/\bdata\s+structures\b/i, /\balgorithms?\b/i, /\bproblem\s+solving\b/i, /\bdsa\b/i, /\bcomplexity\s+analysis\b/i, /\bcomputational\s+thinking\b/i],
  },
  {
    id: "database_design",
    name: "Database Modeling & Querying",
    description: "Relational/NoSQL database schema design, indexing, and query optimization.",
    category: "Data",
    keywords: [/\bdatabases?\b/i, /\bsql\b/i, /\bnosql\b/i, /\bschema\s+design\b/i, /\bindexing\b/i, /\bdata\s+modeling\b/i, /\bquery\s+optimization\b/i],
  },
  {
    id: "cloud_devops",
    name: "Cloud Infrastructure & DevOps",
    description: "Cloud computing services, containerization, and automated deployment pipelines.",
    category: "DevOps",
    keywords: [/\bcloud\b/i, /\baws\b/i, /\bazure\b/i, /\bgcp\b/i, /\bdocker\b/i, /\bkubernetes\b/i, /\bci\/cd\b/i, /\bdevops\b/i, /\bcontainerization\b/i],
  },
  {
    id: "code_quality_testing",
    name: "Code Quality & Automated Testing",
    description: "Unit testing, integration testing, code reviews, and clean code principles (SOLID).",
    category: "Quality",
    keywords: [/\bunit\s+testing?\b/i, /\btdd\b/i, /\bcode\s+reviews?\b/i, /\bclean\s+code\b/i, /\btest\s+automation\b/i, /\bqa\b/i, /\bsolid\b/i, /\brefactoring\b/i],
  },
  {
    id: "security_auth",
    name: "Security & Authentication",
    description: "Identity management, token-based authentication (JWT/OAuth), and secure coding.",
    category: "Security",
    keywords: [/\bsecurity\b/i, /\bauthentication\b/i, /\bauthorization\b/i, /\bjwt\b/i, /\boauth\b/i, /\bencryption\b/i, /\bweb\s+security\b/i, /\bvulnerabilities\b/i],
  },
  {
    id: "agile_collaboration",
    name: "Agile Development & Teamwork",
    description: "Working in agile sprint cycles, cross-functional collaboration, and communication.",
    category: "Methodology",
    keywords: [/\bagile\b/i, /\bscrum\b/i, /\bcross-functional\b/i, /\bteamwork\b/i, /\bcollaboration\b/i, /\bsprint\b/i, /\bjira\b/i],
  },
  {
    id: "frontend_ui_ux",
    name: "Frontend Architecture & UI/UX",
    description: "Component-driven user interfaces, responsive design, and state management.",
    category: "Frontend",
    keywords: [/\bfrontend\b/i, /\bui\/ux\b/i, /\bresponsive\s+design\b/i, /\buser\s+interface\b/i, /\bstate\s+management\b/i, /\bweb\s+applications\b/i],
  },
  {
    id: "performance_monitoring",
    name: "Performance & Observability",
    description: "System latency reduction, performance profiling, and application logging/monitoring.",
    category: "Operations",
    keywords: [/\bperformance\b/i, /\blatency\b/i, /\bmonitoring\b/i, /\bobservability\b/i, /\blogging\b/i, /\bprofiling\b/i, /\bcaching\b/i],
  },
];

/* =====================================================================
   3. CORE PARSING ENGINE
===================================================================== */

/**
 * Parses a Job Description text to extract and structure key requirements.
 *
 * @param {string} jdText - The raw job description text
 * @param {string} [companyName] - Optional override / default company name
 * @param {string} [jobTitle] - Optional override / default job title
 * @returns {Object} Structured Job Description representation
 */
export function parseJobDescription(jdText = "", companyName = "", jobTitle = "") {
  if (!jdText || typeof jdText !== "string" || jdText.trim().length === 0) {
    return {
      id: `jd-${Date.now()}`,
      jobTitle: jobTitle.trim() || "Software Engineer",
      company: companyName.trim() || "Target Company",
      companyName: companyName.trim() || "Target Company",
      requiredSkills: [],
      preferredSkills: [],
      technologies: { languages: [], frameworks: [], databases: [], cloudDevOps: [], tools: [] },
      technologiesList: [],
      responsibilities: [],
      experienceRequirements: {
        text: "Entry Level / 0-2 Years",
        minYears: 0,
        maxYears: 2,
        degree: "Bachelor's in Computer Science or related field",
        level: "Entry Level",
      },
      experienceRequirement: "Entry Level / 0-2 Years",
      competencies: [],
      extractedSkills: [],
      focusAreas: ["Core Software Engineering"],
      wordCount: 0,
      characterCount: 0,
      rawText: "",
      parsedAt: new Date().toISOString(),
    };
  }

  const cleanText = jdText.trim();
  const normalizedText = cleanText.toLowerCase();
  const lines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const segmented = segmentJDText(cleanText);

  // -------------------------------------------------------------
  // A. EXTRACT JOB TITLE
  // -------------------------------------------------------------
  let detectedTitle = jobTitle ? jobTitle.trim() : "";

  if (!detectedTitle) {
    // 1. Check explicit label
    const titleLabelMatch = cleanText.match(
      /(?:(?:job\s*)?title|position|role|designation)\s*[:\-–]\s*([^\r\n,]+)/i
    );
    if (titleLabelMatch && titleLabelMatch[1].trim().length > 3) {
      detectedTitle = titleLabelMatch[1].trim();
    }
  }

  if (!detectedTitle) {
    // 2. Scan first 5 lines for common role patterns
    const roleRegex = /\b(?:Senior|Junior|Lead|Principal|Associate|Staff|Graduate|Entry[- ]Level)?\s*(?:Software|Full[- ]Stack|Backend|Frontend|DevOps|Cloud|Data|Machine[- ]Learning|AI|Mobile|iOS|Android|QA|Test|Systems|Platform|Infrastructure)?\s*(?:Engineer|Developer|Architect|Scientist|Specialist|Consultant|Analyst|Programmer)\b/i;
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const match = lines[i].match(roleRegex);
      if (match) {
        detectedTitle = match[0].trim();
        break;
      }
    }
  }

  if (!detectedTitle) {
    detectedTitle = lines[0] && lines[0].length < 60 ? lines[0] : "Software Engineer";
  }

  // Clean up any trailing colons or punctuation
  detectedTitle = detectedTitle.replace(/[:\-–|].*$/, "").trim();

  // -------------------------------------------------------------
  // B. EXTRACT COMPANY NAME
  // -------------------------------------------------------------
  let detectedCompany = companyName ? companyName.trim() : "";

  if (!detectedCompany) {
    // 1. Explicit label
    const compLabelMatch = cleanText.match(
      /(?:company(?:\s*name)?|organization|employer|client)\s*[:\-–]\s*([^\r\n,]+)/i
    );
    if (compLabelMatch && compLabelMatch[1].trim().length > 2) {
      detectedCompany = compLabelMatch[1].trim();
    }
  }

  if (!detectedCompany) {
    // 2. Contextual "About <Company>" or "<Company> is hiring/seeking"
    const aboutMatch = cleanText.match(
      /(?:about|at|welcome to)\s+([A-Z][A-Za-z0-9&.,'\s]{1,35}?)(?:,|\.|\s+is\s+|\s+we\s+are|\s+team)/i
    );
    if (aboutMatch && aboutMatch[1].trim().length > 1) {
      const candidate = aboutMatch[1].trim();
      // Filter out non-company words
      if (!/^(the|our|this|a|an|role|position|job)\b/i.test(candidate)) {
        detectedCompany = candidate;
      }
    }
  }

  if (!detectedCompany) {
    const isHiringMatch = cleanText.match(
      /([A-Z][A-Za-z0-9&]{2,25})\s+is\s+(?:looking|hiring|seeking)\s+for/i
    );
    if (isHiringMatch) {
      detectedCompany = isHiringMatch[1].trim();
    }
  }

  if (!detectedCompany) {
    detectedCompany = "Target Company";
  }

  // -------------------------------------------------------------
  // C. EXTRACT REQUIRED & PREFERRED SKILLS
  // -------------------------------------------------------------
  const requiredText = segmented.required.join(" ").toLowerCase();
  const preferredText = segmented.preferred.join(" ").toLowerCase();

  const requiredSkills = [];
  const preferredSkills = [];
  const detectedSkillMap = new Map();

  SKILL_TAXONOMY.forEach((skillDef) => {
    let totalMatches = 0;
    let reqMatches = 0;
    let prefMatches = 0;

    skillDef.patterns.forEach((regex) => {
      const allM = normalizedText.match(regex);
      if (allM) totalMatches += allM.length;

      const rM = requiredText.match(regex);
      if (rM) reqMatches += rM.length;

      const pM = preferredText.match(regex);
      if (pM) prefMatches += pM.length;
    });

    if (totalMatches > 0) {
      detectedSkillMap.set(skillDef.id, {
        def: skillDef,
        total: totalMatches,
        req: reqMatches,
        pref: prefMatches,
      });
    }
  });

  // Categorize into required vs preferred
  detectedSkillMap.forEach((data) => {
    const { def, total, req, pref } = data;

    // Check if skill was explicitly in preferred section
    const isExplicitPreferred = pref > 0 && req === 0;

    // Check if line context contains preferred keywords
    const isPreferredContext = new RegExp(
      `(?:preferred|nice to have|plus|bonus|good to have|familiarity with|exposure to)\\s+[^.\\n]*?\\b${def.name}\\b`,
      "i"
    ).test(cleanText);

    // Check if line context contains mandatory keywords
    const isMandatoryContext = new RegExp(
      `(?:must have|mandatory|required|essential|core requirement|proficiency in|strong knowledge of)\\s+[^.\\n]*?\\b${def.name}\\b`,
      "i"
    ).test(cleanText);

    if (isExplicitPreferred || (isPreferredContext && !isMandatoryContext)) {
      preferredSkills.push({
        id: def.id,
        name: def.name,
        category: def.category,
        priority: "Medium",
        requiredScore: 70,
        mentions: total,
        source: "Preferred",
      });
    } else {
      const priority = isMandatoryContext || req > 0 || total >= 2 ? "High" : "Medium";
      requiredSkills.push({
        id: def.id,
        name: def.name,
        category: def.category,
        priority,
        requiredScore: priority === "High" ? 80 : 75,
        mentions: total,
        source: "Required",
      });
    }
  });

  // Sort by priority and mentions
  requiredSkills.sort((a, b) => b.mentions - a.mentions);
  preferredSkills.sort((a, b) => b.mentions - a.mentions);

  // If no required skills were detected from taxonomy, fall back to core defaults
  if (requiredSkills.length === 0 && preferredSkills.length === 0) {
    requiredSkills.push(
      { id: "problem_solving", name: "Problem Solving", category: "Concept", priority: "High", requiredScore: 80, mentions: 1, source: "Required" },
      { id: "software_engineering", name: "Software Engineering", category: "Concept", priority: "High", requiredScore: 80, mentions: 1, source: "Required" }
    );
  }

  // Combined extracted skills for backward compatibility with matchers
  const extractedSkills = [...requiredSkills, ...preferredSkills];

  // -------------------------------------------------------------
  // D. TECHNOLOGIES & TOOLS CATEGORIZED
  // -------------------------------------------------------------
  const technologies = {
    languages: [],
    frameworks: [],
    databases: [],
    cloudDevOps: [],
    tools: [],
  };

  extractedSkills.forEach((skill) => {
    if (skill.category === "Language") {
      technologies.languages.push(skill.name);
    } else if (skill.category === "Framework") {
      technologies.frameworks.push(skill.name);
    } else if (skill.category === "Database") {
      technologies.databases.push(skill.name);
    } else if (skill.category === "Tool") {
      const isCloudDevOps = /docker|kubernetes|aws|azure|gcp|linux|ci\/cd|nginx|kafka/i.test(skill.id);
      if (isCloudDevOps) {
        technologies.cloudDevOps.push(skill.name);
      } else {
        technologies.tools.push(skill.name);
      }
    }
  });

  // Flat list of unique technologies
  const technologiesList = Array.from(
    new Set([
      ...technologies.languages,
      ...technologies.frameworks,
      ...technologies.databases,
      ...technologies.cloudDevOps,
      ...technologies.tools,
    ])
  );

  // -------------------------------------------------------------
  // E. RESPONSIBILITIES EXTRACTION
  // -------------------------------------------------------------
  let responsibilities = [];

  // 1. Try segmented responsibilities section
  if (segmented.responsibilities.length > 0) {
    responsibilities = segmented.responsibilities
      .map((line) => line.replace(/^[•\-*–—\d.)\s]+/, "").trim())
      .filter((line) => line.length >= 15 && line.length <= 350)
      .filter((line) => !/^(responsibilities|what you will do|role|duties):?$/i.test(line));
  }

  // 2. If empty or too few, scan for bulleted action lines across all lines
  if (responsibilities.length < 2) {
    const actionVerbRegex = /^[•\-*–—\d.)\s]*(?:Design|Develop|Build|Create|Implement|Maintain|Collaborate|Lead|Optimize|Write|Architect|Participate|Manage|Deploy|Troubleshoot|Ensure|Deliver|Work|Integrate|Test)\b/i;
    for (const line of lines) {
      if (actionVerbRegex.test(line)) {
        const cleaned = line.replace(/^[•\-*–—\d.)\s]+/, "").trim();
        if (cleaned.length >= 20 && cleaned.length <= 350 && !responsibilities.includes(cleaned)) {
          responsibilities.push(cleaned);
        }
      }
    }
  }

  // Cap at 10 items
  responsibilities = responsibilities.slice(0, 10);

  // Fallback defaults if still empty
  if (responsibilities.length === 0) {
    responsibilities = [
      `Design, build, and maintain efficient, reusable, and reliable code for ${detectedTitle}.`,
      "Collaborate with cross-functional team members to define, design, and ship new features.",
      "Identify bottlenecks, bugs, and optimize performance and overall code quality.",
      "Participate in code reviews, design discussions, and sprint planning.",
    ];
  }

  // -------------------------------------------------------------
  // F. EXPERIENCE REQUIREMENTS EXTRACTION
  // -------------------------------------------------------------
  let experienceText = "Entry Level / 0-2 Years";
  let minYears = 0;
  let maxYears = 2;
  let detectedDegree = "Bachelor's degree in Computer Science, Engineering, or related technical field";
  let seniorityLevel = "Entry Level";

  // Match years of experience
  const rangeMatch = cleanText.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?|yrs?)(?:\s*(?:of\b)?[^.\n]{0,45}?\bexperience)?/i);
  const plusMatch = cleanText.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s*(?:of\b)?[^.\n]{0,45}?\bexperience)?/i);

  if (rangeMatch) {
    minYears = parseInt(rangeMatch[1], 10);
    maxYears = parseInt(rangeMatch[2], 10);
    experienceText = `${minYears}-${maxYears} Years of Experience`;
  } else if (plusMatch) {
    minYears = parseInt(plusMatch[1], 10);
    maxYears = minYears + 3;
    experienceText = `${minYears}+ Years of Experience`;
  } else if (/fresher|intern|trainee|college graduate|new grad|entry[- ]level/i.test(cleanText)) {
    minYears = 0;
    maxYears = 1;
    experienceText = "Fresher / Campus Placement (0-1 Years)";
  }

  // Determine Seniority Level
  if (minYears >= 8 || /principal|lead|staff/i.test(detectedTitle)) {
    seniorityLevel = "Lead / Principal";
  } else if (minYears >= 5 || /senior|sr\./i.test(detectedTitle)) {
    seniorityLevel = "Senior Level (5+ Years)";
  } else if (minYears >= 3) {
    seniorityLevel = "Mid-Level (3-5 Years)";
  } else if (minYears >= 1) {
    seniorityLevel = "Associate / Junior (1-3 Years)";
  } else if (/intern/i.test(detectedTitle) || /internship/i.test(cleanText)) {
    seniorityLevel = "Internship";
  } else {
    seniorityLevel = "Entry Level (0-2 Years)";
  }

  // Degree detection
  const degreeMatch = cleanText.match(
    /\b(?:bachelor(?:'s)?|master(?:'s)?|b\.?tech|b\.?e\.?|m\.?tech|\bm\.s\b|ph\.?d)(?:\s+(?:degree|in))?(?:\s+(?:or|and)\s+[a-zA-Z\s']+)?(?:\s+in\s+[a-zA-Z\s]+)?/i
  );
  if (degreeMatch) {
    detectedDegree = degreeMatch[0].trim();
  }

  const experienceRequirements = {
    text: experienceText,
    minYears,
    maxYears,
    degree: detectedDegree,
    level: seniorityLevel,
  };

  // -------------------------------------------------------------
  // G. CORE ENGINEERING COMPETENCIES
  // -------------------------------------------------------------
  const competencies = [];
  COMPETENCY_DEFINITIONS.forEach((compDef) => {
    const isMatched = compDef.keywords.some((regex) => regex.test(cleanText));
    if (isMatched) {
      competencies.push({
        id: compDef.id,
        name: compDef.name,
        description: compDef.description,
        category: compDef.category,
      });
    }
  });

  // Ensure at least 3 competencies are captured
  if (competencies.length === 0) {
    competencies.push(
      {
        id: "problem_solving",
        name: "Algorithms & Problem Solving",
        description: "Data structures, algorithmic complexity, and analytical problem solving.",
        category: "Core",
      },
      {
        id: "api_engineering",
        name: "API Design & Integration",
        description: "Building, documenting, and integrating standard backend services.",
        category: "Backend",
      },
      {
        id: "agile_collaboration",
        name: "Agile Development & Teamwork",
        description: "Sprint execution, cross-functional collaboration, and communication.",
        category: "Methodology",
      }
    );
  }

  // -------------------------------------------------------------
  // H. FOCUS AREAS
  // -------------------------------------------------------------
  const focusAreas = [];
  if (/backend|server|api|microservice|database/i.test(cleanText)) focusAreas.push("Backend & API Architecture");
  if (/frontend|ui|ux|responsive|client|react|vue|angular/i.test(cleanText)) focusAreas.push("Frontend & User Experience");
  if (/database|sql|nosql|query|data model|kafka|pipeline/i.test(cleanText)) focusAreas.push("Data Engineering & Databases");
  if (/cloud|devops|docker|kubernetes|ci\/cd|aws|azure/i.test(cleanText)) focusAreas.push("Cloud & Containerization");
  if (/dsa|algorithms|problem solving|leetcode/i.test(cleanText)) focusAreas.push("Algorithms & Problem Solving");

  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const characterCount = cleanText.length;

  return {
    id: `jd-${Date.now()}`,
    jobTitle: detectedTitle,
    company: detectedCompany,
    companyName: detectedCompany, // backward compat
    requiredSkills,
    preferredSkills,
    technologies,
    technologiesList,
    responsibilities,
    experienceRequirements,
    experienceRequirement: experienceText, // backward compat
    competencies,
    extractedSkills, // backward compat
    focusAreas: focusAreas.length > 0 ? focusAreas : ["Core Software Engineering"],
    wordCount,
    characterCount,
    rawText: cleanText,
    parsedAt: new Date().toISOString(),
  };
}

/**
 * Compare candidate's parsed resume against a parsed Job Description
 * @param {Object} parsedResume - Output from resumeParserService
 * @param {Object} parsedJD - Output from parseJobDescription
 * @returns {Object} Comprehensive match prediction and actionable gap report
 */
export function matchResumeWithJobDescription(parsedResume, parsedJD) {
  if (!parsedJD || (!parsedJD.extractedSkills && !parsedJD.requiredSkills)) {
    return {
      predictionScore: 0,
      readinessStatus: "Awaiting Job Description",
      matchedSkills: [],
      missingSkills: [],
      recommendations: ["Please enter a job description to generate an ATS match prediction."],
    };
  }

  const resumeSkills = (parsedResume && parsedResume.detectedSkills) ? parsedResume.detectedSkills : [];
  const jdSkills = (parsedJD.requiredSkills && parsedJD.requiredSkills.length > 0)
    ? parsedJD.requiredSkills
    : (parsedJD.extractedSkills || []);

  const matchedSkills = [];
  const missingSkills = [];
  let scoreSum = 0;

  jdSkills.forEach((req) => {
    const found = resumeSkills.find(
      (s) => s.name.toLowerCase() === req.name.toLowerCase() ||
             s.name.toLowerCase().includes(req.name.toLowerCase()) ||
             req.name.toLowerCase().includes(s.name.toLowerCase())
    );

    if (found) {
      matchedSkills.push({
        name: req.name,
        category: req.category,
        priority: req.priority || "High",
        userScore: found.score || 75,
        requiredScore: req.requiredScore || 80,
        status: "Matched",
      });
      scoreSum += Math.min((found.score || 75) / (req.requiredScore || 80), 1.2);
    } else {
      missingSkills.push({
        name: req.name,
        category: req.category,
        priority: req.priority || "High",
        requiredScore: req.requiredScore || 80,
        status: "Missing",
      });
    }
  });

  const predictionScore = jdSkills.length > 0
    ? Math.min(Math.max(Math.round((scoreSum / jdSkills.length) * 100), 15), 98)
    : 50;

  let readinessStatus = "Developing Alignment";
  if (predictionScore >= 80) readinessStatus = "Interview Ready";
  else if (predictionScore >= 65) readinessStatus = "Strong Alignment";
  else if (predictionScore >= 45) readinessStatus = "Moderate Match";
  else readinessStatus = "High Skill Deficit";

  // Actionable ATS & Interview Recommendations
  const recommendations = [];
  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 3).map((s) => s.name).join(", ");
    recommendations.push(
      `Direct ATS Gap: Add evidence or projects covering ${topMissing} to match ${parsedJD.company || parsedJD.companyName}'s requirements.`
    );
  }
  if (parsedJD.company || parsedJD.companyName) {
    recommendations.push(
      `Tailor your resume headline specifically for "${parsedJD.jobTitle} at ${parsedJD.company || parsedJD.companyName}".`
    );
  }
  if (matchedSkills.length > 0) {
    recommendations.push(
      `Highlight your validated competencies in ${matchedSkills.slice(0, 2).map((s) => s.name).join(" and ")} at the top of your experience section.`
    );
  }

  return {
    companyName: parsedJD.company || parsedJD.companyName,
    jobTitle: parsedJD.jobTitle,
    predictionScore,
    readinessStatus,
    matchedSkills,
    missingSkills,
    recommendations,
    matchedCount: matchedSkills.length,
    totalRequired: jdSkills.length,
  };
}

export default {
  parseJobDescription,
  matchResumeWithJobDescription,
};

