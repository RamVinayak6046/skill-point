/**
 * Dynamic Assignment Generator Service - Skill Point
 * 
 * Generates tailored, project-based engineering assignments
 * dynamically derived from candidate's identified resume gaps and job requirements.
 */

import { getCanonicalSkillName } from "./skillMatchingService.js";
import { getJobRequirements } from "../data/jobData.js";

// Assignment Templates by Skill Domain
const ASSIGNMENT_TEMPLATES = {
  "Spring Boot": [
    {
      titleSuffix: "RESTful Service with CRUD & Validation",
      difficulty: "Intermediate",
      duration: "2.5 hrs",
      scenario: "Build a production-grade backend service for an e-commerce catalog featuring input validation, error handling, and H2 database integration.",
      steps: [
        "Initialize a Spring Boot project with Web, JPA, and Validation starters.",
        "Design domain entities (Product, Category) and implement Spring Data JPA repositories.",
        "Create REST controllers exposing GET, POST, PUT, DELETE with HTTP status codes.",
        "Add @ControllerAdvice global exception handler with clean JSON error responses.",
      ],
      deliverable: "GitHub repository with functional controllers and unit tests.",
    },
    {
      titleSuffix: "Secure API Gateway with JWT Authentication",
      difficulty: "Advanced",
      duration: "3 hrs",
      scenario: "Implement stateless token-based authorization to protect backend endpoints.",
      steps: [
        "Configure Spring Security filter chain with JWT authentication filter.",
        "Create login endpoint issuing HMAC-SHA256 signed JWT tokens.",
        "Protect private endpoints verifying user role claims from the Authorization header.",
        "Write integration tests validating token expiration and forbidden access.",
      ],
      deliverable: "Secure Spring Boot application with JWT validation middleware.",
    },
  ],

  "Java": [
    {
      titleSuffix: "Multi-threaded Task Execution Engine",
      difficulty: "Intermediate",
      duration: "2 hrs",
      scenario: "Develop a high-throughput worker queue that processes background jobs asynchronously using Java Concurrency APIs.",
      steps: [
        "Use ExecutorService and ThreadPoolExecutor to manage worker threads.",
        "Implement Callable tasks with Future / CompletableFuture for non-blocking aggregation.",
        "Prevent race conditions using Atomic variables and ReentrantLock.",
        "Benchmark throughput comparing single-threaded vs multi-threaded execution.",
      ],
      deliverable: "Java application demonstrating concurrent execution and thread safety.",
    },
    {
      titleSuffix: "Clean Architecture OOP Library",
      difficulty: "Beginner",
      duration: "90 min",
      scenario: "Refactor a legacy application adhering to SOLID principles and common design patterns.",
      steps: [
        "Implement Factory pattern for object creation decoupling.",
        "Apply Dependency Inversion with interfaces and loose coupling.",
        "Write JUnit 5 test cases with 80%+ test coverage.",
      ],
      deliverable: "Modular Java library with clean documentation.",
    },
  ],

  "REST API": [
    {
      titleSuffix: "Idempotent Web API with Pagination & Filtering",
      difficulty: "Beginner",
      duration: "90 min",
      scenario: "Design an API specification and implementation that handles large datasets cleanly.",
      steps: [
        "Design endpoints with standard HTTP verbs and status codes (200, 201, 204, 400, 404).",
        "Implement cursor/offset pagination with limit parameters.",
        "Add query parameter filters and sorting mechanisms.",
        "Generate OpenAPI 3.0 / Swagger documentation.",
      ],
      deliverable: "Swagger/OpenAPI UI and working API endpoints.",
    },
  ],

  "SQL": [
    {
      titleSuffix: "Complex Query Optimization & Indexing",
      difficulty: "Intermediate",
      duration: "90 min",
      scenario: "Diagnose slow queries on a multi-million row relational database and optimize execution plans.",
      steps: [
        "Write complex multi-table JOINs, subqueries, and window functions (ROW_NUMBER, RANK).",
        "Run EXPLAIN / EXPLAIN ANALYZE to identify sequential table scans.",
        "Create compound and covering indexes to reduce query latency by 80%+.",
        "Implement ACID transactions with appropriate isolation levels.",
      ],
      deliverable: "SQL optimization report with before/after query execution plans.",
    },
  ],

  "Docker": [
    {
      titleSuffix: "Multi-Stage Dockerfile & Container Orchestration",
      difficulty: "Intermediate",
      duration: "2 hrs",
      scenario: "Package an enterprise application into a minimal, secure Docker container image and spin up dependent services with Docker Compose.",
      steps: [
        "Write a multi-stage Dockerfile separating build dependencies from the runtime image.",
        "Configure non-root user execution inside the container for security.",
        "Create docker-compose.yml orchestrating the app alongside PostgreSQL and Redis.",
        "Verify health checks and volume persistence across container restarts.",
      ],
      deliverable: "Dockerfile and docker-compose.yml with running container instructions.",
    },
  ],

  "React": [
    {
      titleSuffix: "State Management & Responsive Dashboard",
      difficulty: "Intermediate",
      duration: "2 hrs",
      scenario: "Build an interactive client-side dashboard with live charts, filtering, and theme toggling.",
      steps: [
        "Create modular functional components using React hooks (useState, useEffect, useMemo).",
        "Manage global state with Context API or lightweight state stores.",
        "Connect to a public REST API handling loading states and error boundaries.",
        "Ensure responsive layout on mobile, tablet, and desktop viewports.",
      ],
      deliverable: "React application deployed to GitHub Pages or local preview.",
    },
  ],

  "DSA": [
    {
      titleSuffix: "High-Performance Data Structures & Search Algorithms",
      difficulty: "Intermediate",
      duration: "2 hrs",
      scenario: "Implement foundational structures and solve algorithmic placement challenges.",
      steps: [
        "Implement custom Binary Search Tree / Trie with search and insertion.",
        "Solve Graph traversal (BFS/DFS) algorithms for shortest-path problems.",
        "Analyze Time and Space Complexity with Big-O notation for every method.",
      ],
      deliverable: "Tested algorithms repository with test cases.",
    },
  ],

  "OOP": [
    {
      titleSuffix: "Design Patterns Case Study: Payment Gateway",
      difficulty: "Intermediate",
      duration: "90 min",
      scenario: "Model a flexible payment processing engine using Strategy and Observer patterns.",
      steps: [
        "Create PaymentStrategy interface with implementations for CreditCard, UPI, and PayPal.",
        "Implement Observer pattern to notify logging, receipt, and analytics listeners upon payment.",
        "Demonstrate Open/Closed Principle by adding a new payment mode without altering core engine.",
      ],
      deliverable: "Extensible OOP application with clean class diagrams.",
    },
  ],

  "Git": [
    {
      titleSuffix: "Branching Strategy & Pull Request Workflow",
      difficulty: "Beginner",
      duration: "60 min",
      scenario: "Simulate a collaborative team Git workflow with merge conflict resolution and interactive rebase.",
      steps: [
        "Create feature branches from main and simulate parallel feature commits.",
        "Trigger a merge conflict and resolve it cleanly using Git CLI.",
        "Perform interactive rebase to squash commits into atomic, clean messages.",
        "Write a conventional commit history following industry standards.",
      ],
      deliverable: "Git commit tree demonstrating clean branching and rebase.",
    },
  ],
};

/**
 * Fallback generator for any arbitrary skill
 */
function generateGenericAssignment(skillName, priority = "Medium", difficulty = "Intermediate") {
  return {
    title: `Practical Implementation: Hands-on ${skillName} Project`,
    skill: skillName,
    difficulty,
    duration: "2 hrs",
    priority,
    scenario: `Build a functional, practical module demonstrating proficiency in ${skillName} to satisfy target job requirements.`,
    steps: [
      `Review core fundamentals and documentation for ${skillName}.`,
      `Set up a local development environment and scaffold a mini-project.`,
      `Implement core functionality highlighting practical ${skillName} capabilities.`,
      `Document your architecture, implementation choices, and test results in a README.`,
    ],
    deliverable: `Working code repository and technical documentation for ${skillName}.`,
  };
}

/**
 * Generates personalized assignments based on candidate's resume gaps and job requirements
 * @param {Object} params
 * @param {string} params.targetJob - Selected target job title
 * @param {Object} params.parsedResume - Output from resume parser
 * @param {Object} params.parsedJD - Output from JD parser (optional)
 * @param {Array}  params.skillGaps - Current skill gaps array
 * @param {Object} [params.skillLevels] - Current skill levels map from Module 5
 * @returns {Array} Array of dynamically generated assignments
 */
export function generatePersonalizedAssignments({
  targetJob = "Backend Developer",
  parsedResume = null,
  parsedJD = null,
  skillGaps = [],
  skillLevels = {},
}) {
  const assignments = [];
  const generatedSkills = new Set();

  const getSkillLevelRecord = (skillName) => {
    if (!skillLevels || typeof skillLevels !== "object") return null;
    const canonical = getCanonicalSkillName(skillName);
    if (skillLevels[canonical]) return skillLevels[canonical];
    if (skillLevels[skillName]) return skillLevels[skillName];
    const lower = (canonical || skillName || "").toLowerCase();
    for (const [k, v] of Object.entries(skillLevels)) {
      if (k.toLowerCase() === lower || getCanonicalSkillName(k).toLowerCase() === lower) return v;
    }
    return null;
  };

  const getTemplateForSkill = (skillName) => {
    const canonical = getCanonicalSkillName(skillName);
    return ASSIGNMENT_TEMPLATES[canonical] || ASSIGNMENT_TEMPLATES[skillName] || null;
  };

  // Helper to select template matching current evaluated skill level
  const selectTemplateForSkill = (skillName, templates, userLevel = "Beginner") => {
    if (!templates || templates.length === 0) return null;
    // Prefer matching difficulty
    const matched = templates.find((t) => t.difficulty?.toLowerCase() === userLevel?.toLowerCase());
    return matched || templates[0];
  };

  // 1. Prioritize critical gaps from parsed JD if available
  if (parsedJD && parsedJD.missingSkills && parsedJD.missingSkills.length > 0) {
    parsedJD.missingSkills.slice(0, 3).forEach((gap) => {
      const canonicalName = getCanonicalSkillName(gap.name);
      if (!generatedSkills.has(canonicalName)) {
        generatedSkills.add(canonicalName);
        const lvlRec = getSkillLevelRecord(canonicalName);
        const currentLevel = lvlRec?.currentLevel || "Beginner";
        const templates = getTemplateForSkill(canonicalName);
        if (templates && templates.length > 0) {
          const t = selectTemplateForSkill(canonicalName, templates, currentLevel);
          assignments.push({
            id: `dyn-${canonicalName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-01`,
            number: String(assignments.length + 1).padStart(2, "0"),
            title: `Master ${canonicalName}: ${t.titleSuffix}`,
            skill: canonicalName,
            targetSkillLevel: currentLevel,
            difficulty: t.difficulty,
            duration: t.duration,
            priority: gap.priority || "High",
            description: t.scenario,
            steps: t.steps,
            deliverable: t.deliverable,
            source: `Tailored for ${parsedJD.companyName || parsedJD.company} (${canonicalName} missing in resume • Level: ${currentLevel})`,
          });
        } else {
          const gen = generateGenericAssignment(canonicalName, gap.priority || "High", currentLevel);
          assignments.push({
            id: `dyn-${canonicalName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-01`,
            number: String(assignments.length + 1).padStart(2, "0"),
            ...gen,
            targetSkillLevel: currentLevel,
            source: `Tailored for ${parsedJD.companyName || parsedJD.company} (Level: ${currentLevel})`,
          });
        }
      }
    });
  }

  // 2. Identify top skill gaps from live skillGaps matrix or resume missing skills
  const gapsToAddress = skillGaps && skillGaps.length > 0
    ? skillGaps.filter((g) => g.gap > 0).sort((a, b) => b.gap - a.gap)
    : (parsedResume && parsedResume.missingSkills)
    ? parsedResume.missingSkills
    : [];

  gapsToAddress.forEach((gap) => {
    const canonicalName = getCanonicalSkillName(gap.name);
    if (assignments.length < 5 && !generatedSkills.has(canonicalName)) {
      generatedSkills.add(canonicalName);
      const lvlRec = getSkillLevelRecord(canonicalName);
      const currentLevel = gap.skillLevel || lvlRec?.currentLevel || "Beginner";
      const templates = getTemplateForSkill(canonicalName);
      if (templates && templates.length > 0) {
        const t = selectTemplateForSkill(canonicalName, templates, currentLevel);
        assignments.push({
          id: `dyn-${canonicalName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-01`,
          number: String(assignments.length + 1).padStart(2, "0"),
          title: `Build with ${canonicalName}: ${t.titleSuffix}`,
          skill: canonicalName,
          targetSkillLevel: currentLevel,
          difficulty: t.difficulty,
          duration: t.duration,
          priority: gap.priority || "High",
          description: t.scenario,
          steps: t.steps,
          deliverable: t.deliverable,
          source: `Personalized for ${targetJob} (Skill deficit: ${gap.gap || 25}% • Level: ${currentLevel})`,
        });
      } else {
        const gen = generateGenericAssignment(canonicalName, gap.priority || "Medium", currentLevel);
        assignments.push({
          id: `dyn-${canonicalName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-01`,
          number: String(assignments.length + 1).padStart(2, "0"),
          ...gen,
          targetSkillLevel: currentLevel,
          source: `Personalized for ${targetJob} (Level: ${currentLevel})`,
        });
      }
    }
  });

  // 3. Fallback: if user has no gaps or resume is blank, generate core role assignments from authoritative requirements
  if (assignments.length === 0) {
    const roleReqs = getJobRequirements(targetJob);
    const defaultSkills = (roleReqs && roleReqs.length > 0)
      ? roleReqs.slice(0, 4).map((r) => r.name)
      : ["Spring Boot", "Docker", "REST API", "SQL"];

    defaultSkills.forEach((skillName, idx) => {
      const canonicalName = getCanonicalSkillName(skillName);
      const templates = getTemplateForSkill(canonicalName) || [];
      const t = templates[0] || generateGenericAssignment(canonicalName);
      assignments.push({
        id: `dyn-${canonicalName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-01`,
        number: String(idx + 1).padStart(2, "0"),
        title: `Practical Task: ${t.titleSuffix || t.title}`,
        skill: canonicalName,
        difficulty: t.difficulty,
        duration: t.duration,
        priority: "High",
        description: t.scenario || t.description,
        steps: t.steps,
        deliverable: t.deliverable,
        source: `Core Benchmark for ${targetJob}`,
      });
    });
  }

  return assignments;
}

export default {
  ASSIGNMENT_TEMPLATES,
  generatePersonalizedAssignments,
};
