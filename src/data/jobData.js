import { isSkillMatch } from "../services/skillMatchingService.js";

/**
 * jobData.js - Canonical Job & Skill Data
 *
 * jobRoles            - authoritative job requirement specifications
 * assessmentQuestions - skill-tagged MCQ bank (each question has a skillId)
 * defaultUserSkills   - legacy baseline data kept for backward compat; not used
 *                       as the canonical source of job requirements anymore.
 * roleAssignments     - practical assignment definitions
 * roleLearningPaths   - course & lesson definitions
 *
 * Helper functions:
 *   getJobRequirements(title) - returns skills[] for a job from jobRoles (AUTHORITATIVE)
 *   getSkillsForJob(title)    - alias → getJobRequirements (all callers already use this name)
 *   getJobByTitle(title)      - returns full job object
 *   getAssessmentForJob(title)
 *   getAssignmentsForJob(title)
 *   getLearningPathForJob(title)
 */

export const jobRoles = [
  {
    id: "backend-developer",
    title: "Backend Developer",
    companyType: "Technology",
    level: "Entry Level",
    description: "Develop server-side logic, manage database connections, and build robust APIs.",
    skills: [
      { name: "Java", required: 80, importance: "High", category: "Language" },
      { name: "Spring Boot", required: 80, importance: "High", category: "Framework" },
      { name: "REST API", required: 80, importance: "High", category: "Concept" },
      { name: "SQL", required: 75, importance: "Medium", category: "Database" },
      { name: "Docker", required: 75, importance: "High", category: "Tool" },
      { name: "Git", required: 75, importance: "Low", category: "Tool" }
    ]
  },
  {
    id: "full-stack-developer",
    title: "Full Stack Developer",
    companyType: "Technology",
    level: "Entry Level",
    description: "Develop both frontend and backend of web applications.",
    skills: [
      { name: "Java", required: 80, importance: "Low", category: "Language" },
      { name: "React", required: 80, importance: "High", category: "Framework" },
      { name: "Spring Boot", required: 75, importance: "High", category: "Framework" },
      { name: "SQL", required: 75, importance: "Medium", category: "Database" },
      { name: "JavaScript", required: 80, importance: "High", category: "Language" },
      { name: "Git", required: 75, importance: "Low", category: "Tool" }
    ]
  },
  {
    id: "software-engineer",
    title: "Software Engineer",
    companyType: "Technology",
    level: "Entry Level",
    description: "Design and build efficient software systems.",
    skills: [
      { name: "Java", required: 80, importance: "Low", category: "Language" },
      { name: "DSA", required: 80, importance: "High", category: "Concept" },
      { name: "OOP", required: 80, importance: "High", category: "Concept" },
      { name: "SQL", required: 75, importance: "Medium", category: "Database" },
      { name: "Git", required: 75, importance: "Low", category: "Tool" }
    ]
  },
  {
    id: "java-developer",
    title: "Java Developer",
    companyType: "Technology",
    level: "Entry Level",
    description: "Develop Java-based applications, mostly backend.",
    skills: [
      { name: "Java", required: 80, importance: "Low", category: "Language" },
      { name: "Spring", required: 80, importance: "High", category: "Framework" },
      { name: "Hibernate", required: 75, importance: "High", category: "Framework" },
      { name: "SQL", required: 75, importance: "Medium", category: "Database" },
      { name: "REST API", required: 80, importance: "High", category: "Concept" }
    ]
  }
];

/**
 * Assessment questions - each question is tagged with a skillId that
 * maps to a skill name so per-skill scores can be computed after submission.
 *
 * skillId must exactly match the `name` field in jobRoles[x].skills.
 */
export const assessmentQuestions = {
  "Backend Developer": {
    label: "BACKEND DEVELOPMENT",
    title: "Backend Development",
    description: "This assessment evaluates your understanding of Java, Spring Boot, REST APIs and backend development fundamentals.",
    recommendation1: "Review Spring Boot fundamentals",
    recommendation1Text: "Strengthening your backend framework knowledge can improve your target-role readiness.",
    recommendation2: "Practice REST API concepts",
    recommendation2Text: "Focus on HTTP methods, status codes, request handling and API design.",
    questions: [
      {
        skillId: "Spring Boot",
        question: "Which annotation is commonly used to create a REST controller in Spring Boot?",
        options: ["@Controller", "@RestController", "@Service", "@Repository"],
        answer: 1,
      },
      {
        skillId: "REST API",
        question: "Which HTTP method is normally used to retrieve data from a REST API?",
        options: ["POST", "PUT", "GET", "DELETE"],
        answer: 2,
      },
      {
        skillId: "Spring Boot",
        question: "Which annotation is used to inject a dependency in Spring?",
        options: ["@Autowired", "@Override", "@Entity", "@RequestBody"],
        answer: 0,
      },
      {
        skillId: "REST API",
        question: "Which status code normally represents a successful HTTP request?",
        options: ["404", "500", "200", "401"],
        answer: 2,
      },
      {
        skillId: "Docker",
        question: "Which tool is commonly used to containerize applications?",
        options: ["Docker", "Git", "Postman", "Maven"],
        answer: 0,
      },
    ],
  },
  "Full Stack Developer": {
    label: "FULL STACK DEVELOPMENT",
    title: "Full Stack Development",
    description: "This assessment evaluates your understanding of React, JavaScript, Spring Boot, SQL and full stack development fundamentals.",
    recommendation1: "Strengthen React fundamentals",
    recommendation1Text: "Improve component design, state management and frontend development skills.",
    recommendation2: "Practice API integration",
    recommendation2Text: "Focus on connecting frontend applications with backend REST APIs.",
    questions: [
      {
        skillId: "React",
        question: "Which React hook is commonly used to manage component state?",
        options: ["useState", "useRoute", "useServer", "useHTML"],
        answer: 0,
      },
      {
        skillId: "REST API",
        question: "Which HTTP method is normally used to retrieve data from a REST API?",
        options: ["POST", "PUT", "GET", "DELETE"],
        answer: 2,
      },
      {
        skillId: "JavaScript",
        question: "Which language is primarily used to add interactivity to web pages?",
        options: ["SQL", "JavaScript", "CSS", "XML"],
        answer: 1,
      },
      {
        skillId: "Spring Boot",
        question: "Which technology is commonly used to build backend REST APIs in Java?",
        options: ["Spring Boot", "React", "HTML", "CSS"],
        answer: 0,
      },
      {
        skillId: "SQL",
        question: "Which language is commonly used to query relational databases?",
        options: ["SQL", "HTML", "CSS", "JSON"],
        answer: 0,
      },
    ],
  },
  "Software Engineer": {
    label: "SOFTWARE ENGINEERING",
    title: "Software Engineering",
    description: "This assessment evaluates your understanding of DSA, OOP, Java, SQL and software engineering fundamentals.",
    recommendation1: "Practice DSA fundamentals",
    recommendation1Text: "Strengthen problem-solving skills using common data structures and algorithms.",
    recommendation2: "Review object-oriented programming",
    recommendation2Text: "Focus on abstraction, encapsulation, inheritance and polymorphism.",
    questions: [
      {
        skillId: "DSA",
        question: "Which data structure follows the First In, First Out principle?",
        options: ["Stack", "Queue", "Tree", "Graph"],
        answer: 1,
      },
      {
        skillId: "OOP",
        question: "Which OOP concept allows one class to acquire properties of another?",
        options: ["Inheritance", "Encapsulation", "Abstraction", "Polymorphism"],
        answer: 0,
      },
      {
        skillId: "Java",
        question: "Which keyword is used to create an object in Java?",
        options: ["class", "new", "object", "create"],
        answer: 1,
      },
      {
        skillId: "SQL",
        question: "Which language is commonly used to query relational databases?",
        options: ["SQL", "HTML", "CSS", "JSON"],
        answer: 0,
      },
      {
        skillId: "DSA",
        question: "Which data structure uses LIFO ordering?",
        options: ["Queue", "Array", "Stack", "Linked List"],
        answer: 2,
      },
    ],
  },
  "Java Developer": {
    label: "JAVA DEVELOPMENT",
    title: "Java Development",
    description: "This assessment evaluates your understanding of Java, Spring, Hibernate, REST APIs and database fundamentals.",
    recommendation1: "Review Spring fundamentals",
    recommendation1Text: "Strengthening your Spring framework knowledge can improve your Java developer readiness.",
    recommendation2: "Practice Hibernate and REST APIs",
    recommendation2Text: "Focus on persistence, entity mapping and backend API development.",
    questions: [
      {
        skillId: "Java",
        question: "Which keyword is used to create an object in Java?",
        options: ["class", "new", "object", "create"],
        answer: 1,
      },
      {
        skillId: "Spring",
        question: "Which annotation is commonly used to mark a Spring component for service-layer logic?",
        options: ["@Service", "@Entity", "@Override", "@RequestBody"],
        answer: 0,
      },
      {
        skillId: "Hibernate",
        question: "Which framework is commonly used for object-relational mapping in Java applications?",
        options: ["Hibernate", "React", "Docker", "Git"],
        answer: 0,
      },
      {
        skillId: "REST API",
        question: "Which HTTP method is normally used to retrieve data from a REST API?",
        options: ["POST", "PUT", "GET", "DELETE"],
        answer: 2,
      },
      {
        skillId: "SQL",
        question: "Which language is commonly used to query relational databases?",
        options: ["SQL", "HTML", "CSS", "JSON"],
        answer: 0,
      },
    ],
  }
};

/**
 * Legacy baseline data - kept for reference only.
 * NOT used as authoritative job requirements. Pages should call
 * getJobRequirements() for required skill specs.
 */
export const defaultUserSkills = {
  "Backend Developer": [
    { name: "Spring Boot", current: 0, required: 80, priority: "High", status: "Weak" },
    { name: "REST API", current: 0, required: 80, priority: "High", status: "Weak" },
    { name: "Docker", current: 0, required: 75, priority: "High", status: "Weak" },
    { name: "SQL", current: 0, required: 75, priority: "Medium", status: "Weak" },
    { name: "Java", current: 0, required: 80, priority: "Low", status: "Weak" },
    { name: "Git", current: 0, required: 75, priority: "Low", status: "Weak" }
  ],
  "Full Stack Developer": [
    { name: "React", current: 0, required: 80, priority: "High", status: "Weak" },
    { name: "JavaScript", current: 0, required: 80, priority: "High", status: "Weak" },
    { name: "Spring Boot", current: 0, required: 75, priority: "High", status: "Weak" },
    { name: "SQL", current: 0, required: 75, priority: "Medium", status: "Weak" },
    { name: "Java", current: 0, required: 80, priority: "Low", status: "Weak" },
    { name: "Git", current: 0, required: 75, priority: "Low", status: "Weak" }
  ],
  "Software Engineer": [
    { name: "DSA", current: 0, required: 80, priority: "High", status: "Weak" },
    { name: "OOP", current: 0, required: 80, priority: "High", status: "Weak" },
    { name: "Java", current: 0, required: 80, priority: "Low", status: "Weak" },
    { name: "SQL", current: 0, required: 75, priority: "Medium", status: "Weak" },
    { name: "Git", current: 0, required: 75, priority: "Low", status: "Weak" }
  ],
  "Java Developer": [
    { name: "Spring", current: 0, required: 80, priority: "High", status: "Weak" },
    { name: "Hibernate", current: 0, required: 75, priority: "High", status: "Weak" },
    { name: "REST API", current: 0, required: 80, priority: "High", status: "Weak" },
    { name: "SQL", current: 0, required: 75, priority: "Medium", status: "Weak" },
    { name: "Java", current: 0, required: 80, priority: "Low", status: "Weak" }
  ]
};

export const roleAssignments = {
  "Backend Developer": [
    {
      id: "be-01",
      number: "01",
      title: "Build a REST API with Spring Boot",
      skill: "Spring Boot",
      difficulty: "Intermediate",
      duration: "2 hrs",
      priority: "High",
      description: "Create a basic REST API using Spring Boot with CRUD operations and proper request handling."
    },
    {
      id: "be-02",
      number: "02",
      title: "Dockerize a Spring Boot Application",
      skill: "Docker",
      difficulty: "Intermediate",
      duration: "90 min",
      priority: "High",
      description: "Create a Dockerfile and containerize a Spring Boot backend application."
    },
    {
      id: "be-03",
      number: "03",
      title: "Design a REST API",
      skill: "REST API",
      difficulty: "Beginner",
      duration: "60 min",
      priority: "Medium",
      description: "Design REST endpoints using appropriate HTTP methods, status codes and request structures."
    }
  ],
  "Full Stack Developer": [
    {
      id: "fs-01",
      number: "01",
      title: "Build a React Frontend",
      skill: "React",
      difficulty: "Intermediate",
      duration: "2 hrs",
      priority: "High",
      description: "Create a React application that consumes a REST API using hooks and state management."
    },
    {
      id: "fs-02",
      number: "02",
      title: "Full Stack Integration",
      skill: "JavaScript",
      difficulty: "Advanced",
      duration: "3 hrs",
      priority: "High",
      description: "Integrate a React frontend with a Spring Boot backend, handling CORS and data fetching."
    },
    {
      id: "fs-03",
      number: "03",
      title: "Database Schema Design",
      skill: "SQL",
      difficulty: "Intermediate",
      duration: "60 min",
      priority: "Medium",
      description: "Design a relational database schema for a typical web application."
    }
  ],
  "Software Engineer": [
    {
      id: "se-01",
      number: "01",
      title: "Implement Core Data Structures",
      skill: "DSA",
      difficulty: "Advanced",
      duration: "3 hrs",
      priority: "High",
      description: "Implement custom lists, trees, and graph data structures in Java."
    },
    {
      id: "se-02",
      number: "02",
      title: "Design Patterns Practice",
      skill: "OOP",
      difficulty: "Intermediate",
      duration: "2 hrs",
      priority: "High",
      description: "Apply Singleton, Factory, and Observer patterns to solve common design problems."
    },
    {
      id: "se-03",
      number: "03",
      title: "SQL Query Optimization",
      skill: "SQL",
      difficulty: "Intermediate",
      duration: "90 min",
      priority: "Medium",
      description: "Analyze and optimize slow SQL queries using indexing and execution plans."
    }
  ],
  "Java Developer": [
    {
      id: "jd-01",
      number: "01",
      title: "Spring Security Setup",
      skill: "Spring",
      difficulty: "Advanced",
      duration: "2.5 hrs",
      priority: "High",
      description: "Implement JWT authentication and role-based access control in a Spring application."
    },
    {
      id: "jd-02",
      number: "02",
      title: "Hibernate Entity Mapping",
      skill: "Hibernate",
      difficulty: "Intermediate",
      duration: "2 hrs",
      priority: "High",
      description: "Create complex JPA entity mappings including OneToMany and ManyToMany relationships."
    },
    {
      id: "jd-03",
      number: "03",
      title: "REST API Documentation",
      skill: "REST API",
      difficulty: "Beginner",
      duration: "60 min",
      priority: "Medium",
      description: "Implement Swagger/OpenAPI documentation for an existing REST API."
    }
  ]
};

export const roleLearningPaths = {
  "Backend Developer": {
    courses: [
      { id: 1, skill: "Spring Boot", title: "Spring Boot Backend Fundamentals", level: "Intermediate", duration: "6 hours", lessons: 8, progress: 0, priority: "High", description: "Learn how to build production-ready backend applications using Spring Boot." },
      { id: 2, skill: "Docker", title: "Docker for Backend Developers", level: "Intermediate", duration: "4 hours", lessons: 6, progress: 0, priority: "High", description: "Learn containers, images, Dockerfiles and deployment fundamentals." },
      { id: 3, skill: "REST API", title: "REST API Design & Development", level: "Beginner", duration: "3 hours", lessons: 5, progress: 0, priority: "High", description: "Understand REST principles, HTTP methods, status codes and API design." },
      { id: 4, skill: "SQL", title: "SQL for Developers", level: "Beginner", duration: "3 hours", lessons: 5, progress: 0, priority: "Medium", description: "Build strong database fundamentals with SQL queries and schema design." }
    ],
    lessons: [
      { id: 101, title: "Introduction to Spring Boot", skill: "Spring Boot", duration: "35 min", type: "Video" },
      { id: 102, title: "Creating Your First REST Controller", skill: "Spring Boot", duration: "42 min", type: "Tutorial" },
      { id: 103, title: "HTTP Methods & Status Codes", skill: "REST API", duration: "30 min", type: "Reading" },
      { id: 104, title: "Docker Containers Explained", skill: "Docker", duration: "38 min", type: "Video" }
    ]
  },
  "Full Stack Developer": {
    courses: [
      { id: 5, skill: "React", title: "React Frontend Masterclass", level: "Intermediate", duration: "8 hours", lessons: 10, progress: 0, priority: "High", description: "Master React hooks, component lifecycle, and state management." },
      { id: 6, skill: "JavaScript", title: "Advanced JavaScript", level: "Intermediate", duration: "5 hours", lessons: 7, progress: 0, priority: "High", description: "Deep dive into ES6+, closures, promises, and async programming." },
      { id: 7, skill: "Spring Boot", title: "Spring Boot Basics", level: "Beginner", duration: "4 hours", lessons: 6, progress: 0, priority: "High", description: "Learn basic backend concepts for full stack integration." }
    ],
    lessons: [
      { id: 105, title: "Understanding React Hooks", skill: "React", duration: "40 min", type: "Video" },
      { id: 106, title: "State Management with Context", skill: "React", duration: "45 min", type: "Tutorial" },
      { id: 107, title: "Async/Await in JavaScript", skill: "JavaScript", duration: "30 min", type: "Reading" }
    ]
  },
  "Software Engineer": {
    courses: [
      { id: 8, skill: "DSA", title: "Data Structures & Algorithms", level: "Advanced", duration: "10 hours", lessons: 15, progress: 0, priority: "High", description: "Master core algorithms and complex data structures." },
      { id: 9, skill: "OOP", title: "Object-Oriented Design", level: "Intermediate", duration: "6 hours", lessons: 8, progress: 0, priority: "High", description: "Learn SOLID principles and common design patterns." },
      { id: 10, skill: "SQL", title: "Database Architecture", level: "Intermediate", duration: "5 hours", lessons: 7, progress: 0, priority: "Medium", description: "Understand database normalization and indexing." }
    ],
    lessons: [
      { id: 108, title: "Big O Notation Explained", skill: "DSA", duration: "45 min", type: "Video" },
      { id: 109, title: "Implementing Binary Search Trees", skill: "DSA", duration: "55 min", type: "Tutorial" },
      { id: 110, title: "The Factory Pattern", skill: "OOP", duration: "35 min", type: "Reading" }
    ]
  },
  "Java Developer": {
    courses: [
      { id: 11, skill: "Spring", title: "Spring Framework Deep Dive", level: "Advanced", duration: "8 hours", lessons: 12, progress: 0, priority: "High", description: "In-depth look at Spring Core, MVC, and Security." },
      { id: 12, skill: "Hibernate", title: "Hibernate & JPA", level: "Intermediate", duration: "6 hours", lessons: 9, progress: 0, priority: "High", description: "Master object-relational mapping and database persistence." },
      { id: 13, skill: "REST API", title: "Advanced REST APIs", level: "Intermediate", duration: "4 hours", lessons: 6, progress: 0, priority: "High", description: "Learn API versioning, security, and documentation." }
    ],
    lessons: [
      { id: 111, title: "Spring Dependency Injection", skill: "Spring", duration: "40 min", type: "Video" },
      { id: 112, title: "JPA Entity Mapping Basics", skill: "Hibernate", duration: "50 min", type: "Tutorial" },
      { id: 113, title: "API Security with JWT", skill: "REST API", duration: "45 min", type: "Reading" }
    ]
  }
};

/* =========================================
   HELPER FUNCTIONS
========================================= */

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
  "dsa": "DSA",
  "data structures": "DSA",
  "algorithms": "DSA",
  "oop": "OOP",
  "oops": "OOP",
  "object oriented programming": "OOP",
  "sql": "SQL",
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "mongo": "MongoDB",
  "mongodb": "MongoDB",
  "docker": "Docker",
  "containerization": "Docker",
  "kubernetes": "Kubernetes",
  "k8s": "Kubernetes",
  "git": "Git",
  "github": "Git",
  "gitlab": "Git",
  "cicd": "CI/CD",
  "ci/cd": "CI/CD",
  "aws": "AWS",
  "typescript": "TypeScript",
  "ts": "TypeScript",
  "javascript": "JavaScript",
  "js": "JavaScript",
  "java": "Java",
  "python": "Python",
  "linux": "Linux",
};

export const getCanonicalSkillName = (rawName) => {
  if (!rawName || typeof rawName !== "string") return "";
  const cleaned = rawName.trim();
  const lower = cleaned.toLowerCase();
  return CANONICAL_SKILL_MAP[lower] || cleaned;
};

export const getCanonicalSkillId = (rawName) => {
  const canonical = getCanonicalSkillName(rawName);
  return canonical.toLowerCase().replace(/[^a-z0-9]/g, "_");
};

export const STANDARD_ROLE_ALIASES = {
  // Backend Developer
  "backend developer": "Backend Developer",
  "backend": "Backend Developer",
  "backend engineer": "Backend Developer",
  "backend software engineer": "Backend Developer",
  "java backend developer": "Backend Developer",
  "node backend developer": "Backend Developer",

  // Full Stack Developer
  "full stack developer": "Full Stack Developer",
  "full stack": "Full Stack Developer",
  "fullstack": "Full Stack Developer",
  "full-stack": "Full Stack Developer",
  "fullstack developer": "Full Stack Developer",
  "full-stack developer": "Full Stack Developer",
  "full stack engineer": "Full Stack Developer",
  "fullstack engineer": "Full Stack Developer",
  "full-stack engineer": "Full Stack Developer",
  "web developer": "Full Stack Developer",

  // Software Engineer
  "software engineer": "Software Engineer",
  "swe": "Software Engineer",
  "sde": "Software Engineer",
  "software developer": "Software Engineer",
  "software development engineer": "Software Engineer",

  // Java Developer
  "java developer": "Java Developer",
  "java": "Java Developer",
  "java engineer": "Java Developer",
  "core java developer": "Java Developer",
};

export const resolveStandardRole = (title) => {
  if (!title || typeof title !== "string") return null;
  const cleaned = title.trim();
  if (roleLearningPaths[cleaned]) return cleaned;
  const lower = cleaned.toLowerCase();
  if (STANDARD_ROLE_ALIASES[lower]) return STANDARD_ROLE_ALIASES[lower];
  const foundKey = Object.keys(roleLearningPaths).find(k => k.toLowerCase() === lower);
  if (foundKey) return foundKey;
  return null;
};

export const getJobByTitle = (title, customJobsList = null) => {
  let customJobs = Array.isArray(customJobsList) ? customJobsList : [];
  if (customJobs.length === 0) {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem("skillPointCustomJobs");
        if (raw) customJobs = JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }
  const allRoles = [...jobRoles, ...customJobs];
  if (!title || typeof title !== "string") return null;
  const query = title.trim().toLowerCase();

  // 1. Exact or case-insensitive title match
  const exact = allRoles.find(job => (job.title || "").trim().toLowerCase() === query);
  if (exact) return exact;

  // 2. ID match
  const idMatch = allRoles.find(job => (job.id || "").toLowerCase() === query);
  if (idMatch) return idMatch;

  // 3. Standard role alias match
  const standardAlias = STANDARD_ROLE_ALIASES[query];
  if (standardAlias) {
    const aliasMatch = allRoles.find(job => (job.title || "").trim().toLowerCase() === standardAlias.toLowerCase());
    if (aliasMatch) return aliasMatch;
  }

  return null;
};

/**
 * Returns the authoritative skill requirements for a job from jobRoles or customJobs.
 * Each skill: { name, required, importance, category }
 * @param {string} title - Job title
 * @param {Array|null} customJobsList - Optional list of custom jobs
 * @returns {Array} Required skills
 */
export const getJobRequirements = (title, customJobsList = null) => {
  const job = getJobByTitle(title, customJobsList);
  return job ? job.skills : [];
};

/**
 * Alias for getJobRequirements - all existing callers use this name.
 * Returns job REQUIREMENTS (not user skill baselines).
 */
export const getSkillsForJob = getJobRequirements;

export const getAssessmentForJob = (title) => {
  const standardRole = resolveStandardRole(title);
  if (standardRole && assessmentQuestions[standardRole]) {
    return assessmentQuestions[standardRole];
  }
  return assessmentQuestions[title] || assessmentQuestions["Backend Developer"];
};

export const getAssignmentsForJob = (title) => {
  const standardRole = resolveStandardRole(title);
  if (standardRole && roleAssignments[standardRole]) {
    return roleAssignments[standardRole];
  }
  return roleAssignments[title] || roleAssignments["Backend Developer"];
};

/* =========================================
   LEARNING PATH CATALOG & RESOLVER
========================================= */

export const ALL_COURSES = [
  { id: 1, skill: "Spring Boot", title: "Spring Boot Backend Fundamentals", level: "Intermediate", duration: "6 hours", lessons: 8, progress: 0, priority: "High", description: "Learn how to build production-ready backend applications using Spring Boot." },
  { id: 2, skill: "Docker", title: "Docker for Backend Developers", level: "Intermediate", duration: "4 hours", lessons: 6, progress: 0, priority: "High", description: "Learn containers, images, Dockerfiles and deployment fundamentals." },
  { id: 3, skill: "REST API", title: "REST API Design & Development", level: "Beginner", duration: "3 hours", lessons: 5, progress: 0, priority: "High", description: "Understand REST principles, HTTP methods, status codes and API design." },
  { id: 4, skill: "SQL", title: "SQL for Developers", level: "Beginner", duration: "3 hours", lessons: 5, progress: 0, priority: "Medium", description: "Build strong database fundamentals with SQL queries and schema design." },
  { id: 5, skill: "React", title: "React Frontend Masterclass", level: "Intermediate", duration: "8 hours", lessons: 10, progress: 0, priority: "High", description: "Master React hooks, component lifecycle, and state management." },
  { id: 6, skill: "JavaScript", title: "Advanced JavaScript", level: "Intermediate", duration: "5 hours", lessons: 7, progress: 0, priority: "High", description: "Deep dive into ES6+, closures, promises, and async programming." },
  { id: 7, skill: "Spring Boot", title: "Spring Boot Basics", level: "Beginner", duration: "4 hours", lessons: 6, progress: 0, priority: "High", description: "Learn basic backend concepts for full stack integration." },
  { id: 8, skill: "DSA", title: "Data Structures & Algorithms", level: "Advanced", duration: "10 hours", lessons: 15, progress: 0, priority: "High", description: "Master core algorithms and complex data structures." },
  { id: 9, skill: "OOP", title: "Object-Oriented Design", level: "Intermediate", duration: "6 hours", lessons: 8, progress: 0, priority: "High", description: "Learn SOLID principles and common design patterns." },
  { id: 10, skill: "SQL", title: "Database Architecture", level: "Intermediate", duration: "5 hours", lessons: 7, progress: 0, priority: "Medium", description: "Understand database normalization and indexing." },
  { id: 11, skill: "Spring", title: "Spring Framework Deep Dive", level: "Advanced", duration: "8 hours", lessons: 12, progress: 0, priority: "High", description: "In-depth look at Spring Core, MVC, and Security." },
  { id: 12, skill: "Hibernate", title: "Hibernate & JPA", level: "Intermediate", duration: "6 hours", lessons: 9, progress: 0, priority: "High", description: "Master object-relational mapping and database persistence." },
  { id: 13, skill: "REST API", title: "Advanced REST APIs", level: "Intermediate", duration: "4 hours", lessons: 6, progress: 0, priority: "High", description: "Learn API versioning, security, and documentation." },
  { id: 14, skill: "Git", title: "Git Version Control Fundamentals", level: "Beginner", duration: "3 hours", lessons: 4, progress: 0, priority: "Medium", description: "Master version control, branching workflows, and collaborative development with Git." }
];

export const ALL_LESSONS = [
  { id: 101, title: "Introduction to Spring Boot", skill: "Spring Boot", duration: "35 min", type: "Video" },
  { id: 102, title: "Creating Your First REST Controller", skill: "Spring Boot", duration: "42 min", type: "Tutorial" },
  { id: 103, title: "HTTP Methods & Status Codes", skill: "REST API", duration: "30 min", type: "Reading" },
  { id: 104, title: "Docker Containers Explained", skill: "Docker", duration: "38 min", type: "Video" },
  { id: 105, title: "Understanding React Hooks", skill: "React", duration: "40 min", type: "Video" },
  { id: 106, title: "State Management with Context", skill: "React", duration: "45 min", type: "Tutorial" },
  { id: 107, title: "Async/Await in JavaScript", skill: "JavaScript", duration: "30 min", type: "Reading" },
  { id: 108, title: "Big O Notation Explained", skill: "DSA", duration: "45 min", type: "Video" },
  { id: 109, title: "Implementing Binary Search Trees", skill: "DSA", duration: "55 min", type: "Tutorial" },
  { id: 110, title: "The Factory Pattern", skill: "OOP", duration: "35 min", type: "Reading" },
  { id: 111, title: "Spring Dependency Injection", skill: "Spring", duration: "40 min", type: "Video" },
  { id: 112, title: "JPA Entity Mapping Basics", skill: "Hibernate", duration: "50 min", type: "Tutorial" },
  { id: 113, title: "API Security with JWT", skill: "REST API", duration: "45 min", type: "Reading" },
  { id: 114, title: "Git Branching and Merging Strategies", skill: "Git", duration: "30 min", type: "Tutorial" },
  { id: 115, title: "Resolving Merge Conflicts and Rebasing", skill: "Git", duration: "35 min", type: "Reading" },
  { id: 116, title: "SQL Queries and Table Joins", skill: "SQL", duration: "35 min", type: "Tutorial" },
];

export const GENERAL_SUPPLEMENTARY_COURSES = [
  { ...ALL_COURSES.find(c => c.id === 14), priority: "Medium", recommendationType: "supplementary", recommendationReason: "General supplementary learning" },
  { ...ALL_COURSES.find(c => c.id === 9), priority: "Medium", recommendationType: "supplementary", recommendationReason: "General supplementary learning" },
  { ...ALL_COURSES.find(c => c.id === 4), priority: "Medium", recommendationType: "supplementary", recommendationReason: "General supplementary learning" },
];

export const GENERAL_SUPPLEMENTARY_LESSONS = [
  ALL_LESSONS.find(l => l.id === 114),
  ALL_LESSONS.find(l => l.id === 115),
  ALL_LESSONS.find(l => l.id === 110),
  ALL_LESSONS.find(l => l.id === 116),
];

export const calculateCourseProgress = (course, lessonsList, completedLessonsList) => {
  const completed = Array.isArray(completedLessonsList) ? completedLessonsList : [];
  const courseLessons = (lessonsList || []).filter(l => isSkillMatch(course.skill, l.skill));
  if (courseLessons.length === 0) {
    return 0;
  }
  const completedCount = courseLessons.filter(l => completed.includes(l.id)).length;
  return Math.round((completedCount / courseLessons.length) * 100);
};

export const getLearningPathForJob = (title, options = {}) => {
  const {
    skillGaps = [],
    learningProgress = null,
    customJobs = null,
    activeJD = null,
    requiredSkills: optRequiredSkills = null,
  } = options || {};

  // Extract completed lessons list safely
  let completedLessons = [];
  if (learningProgress && Array.isArray(learningProgress.completedLessons)) {
    completedLessons = learningProgress.completedLessons;
  } else {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem("skillPointLearningProgress");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.completedLessons)) {
            completedLessons = parsed.completedLessons;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 1. Resolve standard role (case-insensitive & aliases)
  const resolvedStandardRole = resolveStandardRole(title);

  let rawCourses = [];
  let rawLessons = [];
  let isCustom = false;
  let hasSpecializedCurriculum = true;
  let isCustomUnsupported = false;
  let message = "";
  let unmatchedSkills = [];

  if (resolvedStandardRole && roleLearningPaths[resolvedStandardRole]) {
    // Curated standard curriculum
    rawCourses = roleLearningPaths[resolvedStandardRole].courses.map(c => ({ ...c }));
    rawLessons = roleLearningPaths[resolvedStandardRole].lessons.map(l => ({ ...l }));
  } else {
    // Custom target job or JD intelligence
    isCustom = true;

    // Determine required skills
    let reqSkills = [];
    if (Array.isArray(optRequiredSkills) && optRequiredSkills.length > 0) {
      reqSkills = optRequiredSkills;
    } else if (activeJD && Array.isArray(activeJD.requiredSkills) && activeJD.requiredSkills.length > 0) {
      const jdTitle = (activeJD.jobTitle || "").trim().toLowerCase();
      const query = (title || "").trim().toLowerCase();
      if (jdTitle === query || jdTitle.includes(query) || query.includes(jdTitle)) {
        reqSkills = activeJD.requiredSkills;
      }
    }

    if (reqSkills.length === 0) {
      reqSkills = getJobRequirements(title, customJobs);
    }

    if (!Array.isArray(reqSkills) || reqSkills.length === 0) {
      // No skills found for this custom role
      isCustomUnsupported = true;
      hasSpecializedCurriculum = false;
      message = title
        ? `A specialized curriculum for "${title}" is not currently available in our course catalog. We have recommended foundational engineering modules below.`
        : "A specialized curriculum for this role is not currently available in our course catalog. We have recommended foundational engineering modules below.";
      rawCourses = GENERAL_SUPPLEMENTARY_COURSES.map(c => ({ ...c }));
      rawLessons = GENERAL_SUPPLEMENTARY_LESSONS.map(l => ({ ...l }));
    } else {
      // Map required skills to ALL_COURSES and ALL_LESSONS
      const matchedCourses = [];
      const matchedLessons = [];
      const seenCourseIds = new Set();
      const seenLessonIds = new Set();

      for (const req of reqSkills) {
        const skillName = typeof req === "string" ? req : req.name;
        if (!skillName) continue;

        let foundCourse = false;
        for (const course of ALL_COURSES) {
          if (isSkillMatch(skillName, course.skill)) {
            foundCourse = true;
            if (!seenCourseIds.has(course.id)) {
              seenCourseIds.add(course.id);
              matchedCourses.push({ ...course });
            }
          }
        }

        for (const lesson of ALL_LESSONS) {
          if (isSkillMatch(skillName, lesson.skill)) {
            if (!seenLessonIds.has(lesson.id)) {
              seenLessonIds.add(lesson.id);
              matchedLessons.push({ ...lesson });
            }
          }
        }

        if (!foundCourse) {
          unmatchedSkills.push(skillName);
        }
      }

      if (matchedCourses.length === 0) {
        // Required skills exist, but none match catalog courses
        isCustomUnsupported = true;
        hasSpecializedCurriculum = false;
        message = title
          ? `A specialized curriculum for "${title}" is not currently available in our course catalog. We have recommended foundational engineering modules below.`
          : "A specialized curriculum for this role is not currently available in our course catalog. We have recommended foundational engineering modules below.";
        rawCourses = GENERAL_SUPPLEMENTARY_COURSES.map(c => ({ ...c }));
        rawLessons = GENERAL_SUPPLEMENTARY_LESSONS.map(l => ({ ...l }));
      } else {
        rawCourses = matchedCourses;
        rawLessons = matchedLessons;
        hasSpecializedCurriculum = true;
        if (unmatchedSkills.length > 0) {
          message = `Curriculum generated for available competencies. Dedicated modules for ${unmatchedSkills.join(", ")} are currently in development.`;
        }
      }
    }
  }

  // Deduplicate raw courses and lessons
  const uniqueCourses = [];
  const courseIdSet = new Set();
  for (const c of rawCourses) {
    if (!courseIdSet.has(c.id)) {
      courseIdSet.add(c.id);
      uniqueCourses.push(c);
    }
  }

  const uniqueLessons = [];
  const lessonIdSet = new Set();
  for (const l of rawLessons) {
    if (!lessonIdSet.has(l.id)) {
      lessonIdSet.add(l.id);
      uniqueLessons.push(l);
    }
  }

  // 2. Skill Gap Prioritization & Recommendation Labeling
  const evaluatedCourses = uniqueCourses.map((course) => {
    // If it's a supplementary course from unsupported fallback
    if (isCustomUnsupported) {
      const progress = calculateCourseProgress(course, uniqueLessons, completedLessons);
      return {
        ...course,
        progress,
        priority: "Medium",
        recommendationType: "supplementary",
        recommendationReason: "General supplementary learning",
        gapDeficit: 0,
        isGapEvaluated: false,
      };
    }

    // Check for matching skill gap
    let matchingGap = null;
    if (Array.isArray(skillGaps) && skillGaps.length > 0) {
      matchingGap = skillGaps.find(g => {
        const gName = g.name || g.skill || g.skillName || "";
        return isSkillMatch(course.skill, gName);
      });
    }

    let gapDeficit = 0;
    let isGapEvaluated = false;

    if (matchingGap) {
      isGapEvaluated = true;
      if (typeof matchingGap.gap === "number") {
        gapDeficit = matchingGap.gap;
      } else if (typeof matchingGap.deficit === "number") {
        gapDeficit = matchingGap.deficit;
      } else if (typeof matchingGap.required === "number" && typeof matchingGap.current === "number") {
        gapDeficit = Math.max(0, matchingGap.required - matchingGap.current);
      }
    }

    let recommendationType = "target_job";
    let recommendationReason = "Recommended for your target job";
    let priority = course.priority || "High";

    if (isGapEvaluated) {
      if (gapDeficit > 0) {
        recommendationType = "skill_gap";
        recommendationReason = "Recommended to address a skill gap";
        priority = gapDeficit >= 40 ? "High" : "Medium";
      } else {
        // Benchmark satisfied / mastered
        recommendationType = "target_job";
        recommendationReason = "Recommended for your target job (Skill requirement satisfied)";
        priority = "Low";
      }
    }

    const progress = calculateCourseProgress(course, uniqueLessons, completedLessons);

    return {
      ...course,
      progress,
      priority,
      recommendationType,
      recommendationReason,
      gapDeficit,
      isGapEvaluated,
    };
  });

  // Sort courses by skill gap deficit descending
  evaluatedCourses.sort((a, b) => {
    if (a.isGapEvaluated && b.isGapEvaluated) {
      if (b.gapDeficit !== a.gapDeficit) {
        return b.gapDeficit - a.gapDeficit;
      }
    } else if (a.isGapEvaluated && a.gapDeficit > 0) {
      return -1;
    } else if (b.isGapEvaluated && b.gapDeficit > 0) {
      return 1;
    }
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    const pA = priorityWeight[a.priority] || 2;
    const pB = priorityWeight[b.priority] || 2;
    if (pB !== pA) return pB - pA;

    return 0;
  });

  // Reorder lessons so lessons for higher-gap courses appear first
  const courseOrderMap = new Map();
  evaluatedCourses.forEach((c, index) => {
    courseOrderMap.set(c.skill.toLowerCase(), index);
  });

  const sortedLessons = [...uniqueLessons].sort((a, b) => {
    const orderA = courseOrderMap.has(a.skill.toLowerCase()) ? courseOrderMap.get(a.skill.toLowerCase()) : 999;
    const orderB = courseOrderMap.has(b.skill.toLowerCase()) ? courseOrderMap.get(b.skill.toLowerCase()) : 999;
    return orderA - orderB;
  });

  return {
    courses: evaluatedCourses,
    lessons: sortedLessons,
    isCustom,
    isCustomUnsupported,
    hasSpecializedCurriculum,
    message,
    unmatchedSkills,
  };
};
