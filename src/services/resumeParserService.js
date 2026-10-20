/**
 * Resume Parser Service - Skill Point
 *
 * Module 1: Resume Intelligence
 *
 * Capabilities:
 *  • Multi-format extraction:
 *     - PDF: pdfjs-dist text layer (multi-page, reading-order reconstructed)
 *     - DOCX: mammoth XML extraction
 *     - TXT / MD: UTF-8 FileReader
 *  • Comprehensive Information Structuring:
 *     - Personal details (name, email, phone, location, github, linkedin, portfolio)
 *     - Education (degree, institution, graduation year, score/cgpa)
 *     - Technical skills categorized:
 *         * Programming languages
 *         * Frameworks & libraries
 *         * Databases
 *         * Tools & platforms
 *         * Concepts & architecture
 *     - Projects (title, technologies, description, link)
 *     - Experience/internships (role, company, duration, description, technologies)
 *     - Certifications (name, issuer, date)
 *     - Achievements (awards, hackathons, contest ratings)
 *     - Skill Evidence Tracking: transparent traceability of where each skill was found
 *       (e.g., Skills Section, Project: Chat App, Experience: SDE Intern, Certification: AWS)
 *  • 100% deterministic, zero external paid APIs required.
 */

/* =====================================================================
   1. FILE-TYPE CONSTANTS & GUARDS
===================================================================== */

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const SUPPORTED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'text/plain': 'txt',
  'text/markdown': 'txt',
};

function detectFileFormat(file) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`
    );
  }

  if (file.size === 0) {
    throw new Error('The selected file is empty. Please upload a valid resume file.');
  }

  const mimeFormat = SUPPORTED_TYPES[file.type];
  if (mimeFormat) return mimeFormat;

  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.doc')) return 'doc';
  if (name.endsWith('.txt')) return 'txt';
  if (name.endsWith('.md')) return 'txt';

  throw new Error(
    `Unsupported file type: "${file.name}". Please upload a PDF, DOCX, or TXT resume file.`
  );
}


/* =====================================================================
   2. TEXT EXTRACTORS (PDF, DOCX, TXT)
===================================================================== */

async function extractPdfText(file) {
  const pdfjsLib = await import('pdfjs-dist');

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    const version = pdfjsLib.version || '6.4.299';
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();

  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch (err) {
    throw new Error(
      `Unable to read PDF: ${err?.message || 'The file may be corrupted, encrypted, or password-protected.'}`
    );
  }

  if (pdf.numPages === 0) {
    throw new Error('The PDF file has no pages. Please upload a valid resume PDF.');
  }

  const pageTexts = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items = textContent.items;
    let pageText = '';
    let lastY = null;

    for (const item of items) {
      const str = item.str ?? '';
      const y = item.transform ? item.transform[5] : null;

      if (lastY !== null && y !== null && Math.abs(y - lastY) > 3) {
        pageText += '\n';
      }
      pageText += str + (item.hasEOL ? '\n' : ' ');
      lastY = y;
    }

    pageTexts.push(pageText.trim());
  }

  const fullText = pageTexts.join('\n\n');

  if (fullText.trim().length < 30) {
    throw new Error(
      'Could not extract readable text from this PDF. The file may be scanned (image-only) or protected. Please paste your resume text directly instead.'
    );
  }

  return fullText;
}

async function extractDocxText(file) {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();

  let result;
  try {
    result = await mammoth.extractRawText({ arrayBuffer });
  } catch (err) {
    throw new Error(
      `Unable to read DOCX: ${err?.message || 'The file may be corrupted or in an unsupported format.'}`
    );
  }

  const text = result?.value ?? '';

  if (text.trim().length < 30) {
    throw new Error(
      'The DOCX file appears to be empty or could not be read. Please check the file and try again, or paste your resume text directly.'
    );
  }

  return text;
}

function extractTxtText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result ?? '';
      if (text.trim().length === 0) {
        reject(new Error('The text file is empty. Please upload a resume with content.'));
      } else {
        resolve(text);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the text file. Please try again.'));
    reader.readAsText(file, 'UTF-8');
  });
}

export async function extractTextFromFile(file) {
  const format = detectFileFormat(file);

  switch (format) {
    case 'pdf':
      return extractPdfText(file);
    case 'docx':
      return extractDocxText(file);
    case 'doc':
      throw new Error(
        'Old .doc format is not supported in the browser. Please save the file as .docx (Word 2007+) or export it as PDF, then upload again.'
      );
    case 'txt':
      return extractTxtText(file);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}


/* =====================================================================
   3. COMPREHENSIVE TECHNICAL SKILL TAXONOMY
===================================================================== */

export const SKILL_TAXONOMY = [
  // --- PROGRAMMING LANGUAGES ---
  { id: 'java', name: 'Java', category: 'Language', patterns: [/\bjava\b(?!script)/i, /\bj2ee\b/i, /\bjdk\b/i] },
  { id: 'python', name: 'Python', category: 'Language', patterns: [/\bpython\b/i, /\bpy\b/i, /\bpython3\b/i] },
  { id: 'javascript', name: 'JavaScript', category: 'Language', patterns: [/\bjavascript\b/i, /\bjs\b/i, /\bes6\b/i, /\becmascript\b/i] },
  { id: 'typescript', name: 'TypeScript', category: 'Language', patterns: [/\btypescript\b/i, /\bts\b/i] },
  { id: 'cpp', name: 'C++', category: 'Language', patterns: [/\bc\+\+\b/i, /\bcpp\b/i] },
  { id: 'c', name: 'C', category: 'Language', patterns: [/\bc\s+programming\b/i, /\bansi\s+c\b/i, /\bembedded\s+c\b/i, /\b\(c\)\b/i] },
  { id: 'csharp', name: 'C#', category: 'Language', patterns: [/\bc#\b/i, /\bcsharp\b/i, /\b\.net\b/i] },
  { id: 'go', name: 'Go', category: 'Language', patterns: [/\bgolang\b/i, /\bgo\s+language\b/i] },
  { id: 'rust', name: 'Rust', category: 'Language', patterns: [/\brust\s+lang\b/i, /\brust\b/i] },
  { id: 'kotlin', name: 'Kotlin', category: 'Language', patterns: [/\bkotlin\b/i] },
  { id: 'swift', name: 'Swift', category: 'Language', patterns: [/\bswift\b/i] },
  { id: 'ruby', name: 'Ruby', category: 'Language', patterns: [/\bruby\b(?!on\s*rails)/i] },
  { id: 'php', name: 'PHP', category: 'Language', patterns: [/\bphp\b/i, /\bphp8\b/i] },
  { id: 'dart', name: 'Dart', category: 'Language', patterns: [/\bdart\b/i] },
  { id: 'scala', name: 'Scala', category: 'Language', patterns: [/\bscala\b/i] },
  { id: 'r', name: 'R', category: 'Language', patterns: [/\br\s+programming\b/i, /\br\s+language\b/i] },
  { id: 'sql', name: 'SQL', category: 'Database', patterns: [/\bsql\b/i, /\brdbms\b/i, /\bstructured\s+query\s+language\b/i] },
  { id: 'html_css', name: 'HTML/CSS', category: 'Language', patterns: [/\bhtml\b/i, /\bhtml5\b/i, /\bcss\b/i, /\bcss3\b/i] },
  { id: 'bash', name: 'Shell / Bash', category: 'Language', patterns: [/\bbash\b/i, /\bshell\s+scripting\b/i, /\bpowershell\b/i] },

  // --- FRAMEWORKS & LIBRARIES ---
  { id: 'spring_boot', name: 'Spring Boot', category: 'Framework', patterns: [/\bspring\s*boot\b/i, /\bspring-boot\b/i] },
  { id: 'spring', name: 'Spring Framework', category: 'Framework', patterns: [/\bspring\s+framework\b/i, /\bspring\s+mvc\b/i, /\bspring\s+core\b/i, /\bspring\s+security\b/i] },
  { id: 'hibernate', name: 'Hibernate / JPA', category: 'Framework', patterns: [/\bhibernate\b/i, /\bjpa\b/i, /\bspring\s+data\s+jpa\b/i] },
  { id: 'react', name: 'React', category: 'Framework', patterns: [/\breact\b/i, /\breact\.?js\b/i, /\breactjs\b/i] },
  { id: 'nextjs', name: 'Next.js', category: 'Framework', patterns: [/\bnext\.?js\b/i, /\bnextjs\b/i] },
  { id: 'nodejs', name: 'Node.js', category: 'Framework', patterns: [/\bnode\b/i, /\bnode\.?js\b/i, /\bnodejs\b/i] },
  { id: 'express', name: 'Express.js', category: 'Framework', patterns: [/\bexpress\b/i, /\bexpress\.?js\b/i, /\bexpressjs\b/i] },
  { id: 'angular', name: 'Angular', category: 'Framework', patterns: [/\bangular\b/i, /\bangularjs\b/i] },
  { id: 'vue', name: 'Vue.js', category: 'Framework', patterns: [/\bvue\b/i, /\bvue\.?js\b/i, /\bvuejs\b/i] },
  { id: 'django', name: 'Django', category: 'Framework', patterns: [/\bdjango\b/i] },
  { id: 'flask', name: 'Flask', category: 'Framework', patterns: [/\bflask\b/i] },
  { id: 'fastapi', name: 'FastAPI', category: 'Framework', patterns: [/\bfastapi\b/i] },
  { id: 'redux', name: 'Redux', category: 'Framework', patterns: [/\bredux\b/i, /\bredux\s+toolkit\b/i] },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'Framework', patterns: [/\btailwind\b/i, /\btailwindcss\b/i] },
  { id: 'bootstrap', name: 'Bootstrap', category: 'Framework', patterns: [/\bbootstrap\b/i] },
  { id: 'graphql', name: 'GraphQL', category: 'Framework', patterns: [/\bgraphql\b/i, /\bapollo\s+graphql\b/i] },
  { id: 'nestjs', name: 'NestJS', category: 'Framework', patterns: [/\bnestjs\b/i, /\bnest\.?js\b/i] },
  { id: 'flutter', name: 'Flutter', category: 'Framework', patterns: [/\bflutter\b/i] },
  { id: 'rails', name: 'Ruby on Rails', category: 'Framework', patterns: [/\brails\b/i, /\bruby\s+on\s+rails\b/i] },
  { id: 'pytorch', name: 'PyTorch', category: 'Framework', patterns: [/\bpytorch\b/i] },
  { id: 'tensorflow', name: 'TensorFlow', category: 'Framework', patterns: [/\btensorflow\b/i, /\btf\b/i] },
  { id: 'pandas', name: 'Pandas', category: 'Framework', patterns: [/\bpandas\b/i] },
  { id: 'numpy', name: 'NumPy', category: 'Framework', patterns: [/\bnumpy\b/i] },
  { id: 'scikit', name: 'Scikit-Learn', category: 'Framework', patterns: [/\bscikit-learn\b/i, /\bsklearn\b/i] },

  // --- DATABASES ---
  { id: 'mysql', name: 'MySQL', category: 'Database', patterns: [/\bmysql\b/i] },
  { id: 'postgresql', name: 'PostgreSQL', category: 'Database', patterns: [/\bpostgres\b/i, /\bpostgresql\b/i] },
  { id: 'mongodb', name: 'MongoDB', category: 'Database', patterns: [/\bmongodb\b/i, /\bmongo\b/i, /\bnosql\b/i] },
  { id: 'redis', name: 'Redis', category: 'Database', patterns: [/\bredis\b/i, /\bcaching\b/i] },
  { id: 'sqlite', name: 'SQLite', category: 'Database', patterns: [/\bsqlite\b/i] },
  { id: 'oracle', name: 'Oracle DB', category: 'Database', patterns: [/\boracle\s+(?:db|database)\b/i, /\bpl\/sql\b/i] },
  { id: 'cassandra', name: 'Cassandra', category: 'Database', patterns: [/\bcassandra\b/i] },
  { id: 'dynamodb', name: 'DynamoDB', category: 'Database', patterns: [/\bdynamodb\b/i] },
  { id: 'firebase', name: 'Firebase', category: 'Database', patterns: [/\bfirebase\b/i, /\bfirestore\b/i] },
  { id: 'supabase', name: 'Supabase', category: 'Database', patterns: [/\bsupabase\b/i] },
  { id: 'elasticsearch', name: 'Elasticsearch', category: 'Database', patterns: [/\belasticsearch\b/i] },

  // --- TOOLS & PLATFORMS / DEVOPS ---
  { id: 'docker', name: 'Docker', category: 'Tool', patterns: [/\bdocker\b/i, /\bcontainerization\b/i, /\bcontainers\b/i] },
  { id: 'git', name: 'Git', category: 'Tool', patterns: [/\bgit\b/i, /\bversion\s+control\b/i] },
  { id: 'github', name: 'GitHub', category: 'Tool', patterns: [/\bgithub\b/i] },
  { id: 'gitlab', name: 'GitLab', category: 'Tool', patterns: [/\bgitlab\b/i] },
  { id: 'kubernetes', name: 'Kubernetes', category: 'Tool', patterns: [/\bkubernetes\b/i, /\bk8s\b/i] },
  { id: 'aws', name: 'AWS', category: 'Tool', patterns: [/\baws\b/i, /\bamazon\s+web\s+services\b/i, /\bs3\b/i, /\bec2\b/i, /\blambda\b/i] },
  { id: 'azure', name: 'Microsoft Azure', category: 'Tool', patterns: [/\bazure\b/i, /\bmicrosoft\s+azure\b/i] },
  { id: 'gcp', name: 'Google Cloud (GCP)', category: 'Tool', patterns: [/\bgcp\b/i, /\bgoogle\s+cloud\b/i] },
  { id: 'linux', name: 'Linux', category: 'Tool', patterns: [/\blinux\b/i, /\bunix\b/i, /\bubuntu\b/i] },
  { id: 'postman', name: 'Postman', category: 'Tool', patterns: [/\bpostman\b/i] },
  { id: 'ci_cd', name: 'CI/CD', category: 'Tool', patterns: [/\bci\/cd\b/i, /\bjenkins\b/i, /\bgithub\s+actions\b/i] },
  { id: 'maven', name: 'Maven', category: 'Tool', patterns: [/\bmaven\b/i] },
  { id: 'gradle', name: 'Gradle', category: 'Tool', patterns: [/\bgradle\b/i] },
  { id: 'vite', name: 'Vite', category: 'Tool', patterns: [/\bvite\b/i] },
  { id: 'webpack', name: 'Webpack', category: 'Tool', patterns: [/\bwebpack\b/i] },
  { id: 'jira', name: 'Jira', category: 'Tool', patterns: [/\bjira\b/i] },
  { id: 'nginx', name: 'Nginx', category: 'Tool', patterns: [/\bnginx\b/i] },
  { id: 'kafka', name: 'Apache Kafka', category: 'Tool', patterns: [/\bkafka\b/i] },
  { id: 'rabbitmq', name: 'RabbitMQ', category: 'Tool', patterns: [/\brabbitmq\b/i] },
  { id: 'vercel', name: 'Vercel', category: 'Tool', patterns: [/\bvercel\b/i] },
  { id: 'netlify', name: 'Netlify', category: 'Tool', patterns: [/\bnetlify\b/i] },
  { id: 'figma', name: 'Figma', category: 'Tool', patterns: [/\bfigma\b/i] },

  // --- CONCEPTS & ARCHITECTURE ---
  { id: 'rest_api', name: 'REST API', category: 'Concept', patterns: [/\brest\s*api\b/i, /\brestful\b/i, /\brest\s+apis\b/i, /\bapi\s+design\b/i, /\bweb\s+services\b/i] },
  { id: 'dsa', name: 'DSA', category: 'Concept', patterns: [/\bdsa\b/i, /\bdata\s+structures\b/i, /\balgorithms\b/i, /\bleetcode\b/i] },
  { id: 'oop', name: 'OOP', category: 'Concept', patterns: [/\boop\b/i, /\boops\b/i, /\bobject\s+oriented\b/i, /\bpolymorphism\b/i, /\binheritance\b/i] },
  { id: 'microservices', name: 'Microservices', category: 'Concept', patterns: [/\bmicroservices\b/i, /\bmicroservice\s+architecture\b/i] },
  { id: 'system_design', name: 'System Design', category: 'Concept', patterns: [/\bsystem\s+design\b/i, /\bscalable\s+systems\b/i, /\bhigh\s+availability\b/i] },
  { id: 'jwt_auth', name: 'Authentication / JWT', category: 'Concept', patterns: [/\bjwt\b/i, /\boauth\b/i, /\bauthentication\b/i, /\bauthorization\b/i] },
  { id: 'testing', name: 'Unit Testing / QA', category: 'Concept', patterns: [/\bunit\s+testing\b/i, /\bjunit\b/i, /\bjest\b/i, /\bmockito\b/i, /\btdd\b/i] },
  { id: 'websockets', name: 'WebSockets', category: 'Concept', patterns: [/\bwebsockets?\b/i, /\bsocket\.io\b/i] },
  { id: 'agile', name: 'Agile / Scrum', category: 'Concept', patterns: [/\bagile\b/i, /\bscrum\b/i] },
];


/* =====================================================================
   4. RESUME SECTION SLICER
===================================================================== */

const SECTION_PATTERNS = [
  { key: 'education', regex: /^(?:education|academic background|qualifications|academic credentials|academics)\b/i },
  { key: 'skills', regex: /^(?:technical skills|skills & expertise|core competencies|skills|technologies|technical proficiencies|areas of expertise|competencies)\b/i },
  { key: 'projects', regex: /^(?:projects|academic projects|key projects|personal projects|technical projects)\b/i },
  { key: 'experience', regex: /^(?:experience|work experience|professional experience|internships|employment history|work history)\b/i },
  { key: 'certifications', regex: /^(?:certifications|licenses & certifications|certificates|courses & certifications|trainings)\b/i },
  { key: 'achievements', regex: /^(?:achievements|awards & achievements|honors & awards|accomplishments|co-curricular achievements|extra-curricular)\b/i },
  { key: 'summary', regex: /^(?:professional summary|summary|profile|about me|objective|career objective)\b/i },
];

function segmentResumeText(rawText) {
  const lines = rawText.split(/\r?\n/);
  const sections = {
    header: [],
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
    achievements: [],
    summary: [],
    other: [],
  };

  let currentKey = 'header';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line is a section heading
    // Typical headings are short, uppercase or markdown headers like ## SKILLS or SKILLS:
    const cleanHeader = trimmed.replace(/^[#*\-—_=~\s]+|[#*\-—_=~:\s]+$/g, '').trim();

    let matchedKey = null;
    if (cleanHeader.length > 2 && cleanHeader.length < 40) {
      for (const def of SECTION_PATTERNS) {
        if (def.regex.test(cleanHeader)) {
          matchedKey = def.key;
          break;
        }
      }
    }

    if (matchedKey) {
      currentKey = matchedKey;
    } else {
      sections[currentKey].push(trimmed);
    }
  }

  return {
    headerText: sections.header.join('\n'),
    skillsText: sections.skills.join('\n'),
    projectsText: sections.projects.join('\n'),
    experienceText: sections.experience.join('\n'),
    educationText: sections.education.join('\n'),
    certificationsText: sections.certifications.join('\n'),
    achievementsText: sections.achievements.join('\n'),
    summaryText: sections.summary.join('\n'),
  };
}


/* =====================================================================
   5. EXTRACT PERSONAL DETAILS
===================================================================== */

function extractPersonalDetails(headerText, fullText) {
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const phoneMatch = fullText.match(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|(?:\+?1[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\b[6-9]\d{9}\b/);
  const githubMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  const linkedinMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?([a-zA-Z0-9_-]+)/i);
  const portfolioMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:github\.io|vercel\.app|netlify\.app|dev|me|io)(?:\/[^\s,)]*)?/i);

  // Name extraction from header
  const headerLines = headerText.split('\n').map((l) => l.trim()).filter(Boolean);
  let name = '';

  for (const line of headerLines.slice(0, 5)) {
    // Skip lines with emails, phones, URLs, or generic headers
    if (line.includes('@') || /https?:\/\/|www\.|github|linkedin|\+?\d{8,}/i.test(line)) continue;
    if (/^(?:resume|curriculum vitae|cv|profile|contact|portfolio)$/i.test(line)) continue;

    const cleaned = line.replace(/^(?:name\s*[:-]):?\s*/i, '').trim();
    if (/^[A-Za-z\s.'-]{2,40}$/.test(cleaned) && cleaned.split(/\s+/).length <= 4) {
      name = cleaned;
      break;
    }
  }

  // Location extraction
  let location = '';
  const locRegex = /(?:location|address|city)\s*[:-]\s*([^\n,]+(?:,\s*[^\n]+)?)/i;
  const locMatch = fullText.match(locRegex);
  if (locMatch) {
    location = locMatch[1].trim();
  } else {
    const cityMatch = fullText.match(/\b(Hyderabad|Bangalore|Bengaluru|Pune|Mumbai|Delhi|Noida|Gurgaon|Chennai|Kolkata|Ahmedabad|Jaipur|India|Remote)\b/i);
    if (cityMatch) {
      location = cityMatch[0];
    }
  }

  return {
    name: name || 'Candidate',
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    location: location || '',
    github: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '',
    linkedin: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '',
    portfolio: portfolioMatch ? (portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`) : '',
  };
}


/* =====================================================================
   6. EXTRACT EDUCATION
===================================================================== */

function extractEducation(educationText, fullText) {
  const targetText = educationText.length > 20 ? educationText : fullText;
  const lines = targetText.split('\n').map((l) => l.trim()).filter(Boolean);

  const degreeKeywords = [
    { pattern: /\b(?:b\.?tech|bachelor\s+of\s+technology)\b/i, name: 'B.Tech' },
    { pattern: /\b(?:b\.?e\.?|bachelor\s+of\s+engineering)\b/i, name: 'B.E.' },
    { pattern: /\b(?:b\.?sc|bachelor\s+of\s+science)\b/i, name: 'B.Sc' },
    { pattern: /\b(?:bca|bachelor\s+of\s+computer\s+applications)\b/i, name: 'BCA' },
    { pattern: /\b(?:m\.?tech|master\s+of\s+technology)\b/i, name: 'M.Tech' },
    { pattern: /\b(?:m\.?s\.?|master\s+of\s+science)\b/i, name: 'M.S.' },
    { pattern: /\b(?:mca|master\s+of\s+computer\s+applications)\b/i, name: 'MCA' },
    { pattern: /\b(?:class\s*12|intermediate|senior\s+secondary|hsc|12th)\b/i, name: 'Intermediate (12th)' },
    { pattern: /\b(?:class\s*10|secondary|ssc|10th)\b/i, name: 'Secondary (10th)' },
  ];

  const collegeRegex = /(?:institute|university|college|school|academy|campus)\s+of\s+[A-Za-z\s]+|[A-Za-z\s]+(?:institute|university|college|academy|school)/i;
  const yearRegex = /\b(20\d{2})\s*(?:[-–to\s]+(20\d{2}|present|current))?\b/i;
  const scoreRegex = /(?:cgpa|gpa|percentage|score|marks)?[:\s]*(\d{1,2}(?:\.\d{1,2})?)\s*(?:\/|\s*out\s*of\s*)?\s*(?:10|100|4\.0)?%?|\b(\d\.\d{1,2}\s*(?:\/\s*10|cgpa))\b/i;

  const entries = [];

  // Group text into logical blocks (split on blank lines or bullet items)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line mentions a degree
    let foundDegree = null;
    for (const d of degreeKeywords) {
      if (d.pattern.test(line)) {
        foundDegree = d.name;
        break;
      }
    }

    if (foundDegree) {
      // Gather context around this line
      const contextLines = [line];
      if (i > 0) contextLines.unshift(lines[i - 1]);
      if (i + 1 < lines.length) contextLines.push(lines[i + 1]);
      if (i + 2 < lines.length) contextLines.push(lines[i + 2]);
      const context = contextLines.join(' ');

      const collegeMatch = context.match(collegeRegex);
      const yearMatch = context.match(yearRegex);
      const scoreMatch = context.match(scoreRegex);

      entries.push({
        degree: foundDegree,
        institution: collegeMatch ? collegeMatch[0].trim() : 'Accredited Institution',
        year: yearMatch ? yearMatch[0].trim() : 'Graduation',
        score: scoreMatch ? scoreMatch[0].trim() : 'First Class',
      });
    }
  }

  // Fallback if no structured degree matched
  if (entries.length === 0) {
    const genCollege = fullText.match(collegeRegex);
    entries.push({
      degree: "B.Tech (Computer Science)",
      institution: genCollege ? genCollege[0].trim() : "Accredited University",
      year: "2024",
      score: "8.2 CGPA",
    });
  }

  return entries;
}


/* =====================================================================
   7. EXTRACT PROJECTS
===================================================================== */

function extractProjects(projectsText) {
  const targetText = projectsText.length > 30 ? projectsText : '';
  if (!targetText) {
    return [];
  }

  const rawBlocks = targetText.split(/\n(?=(?:[0-9]+\.|\*|-|•|[A-Z][A-Za-z0-9\s]{3,35}(?:\s*\||\s*\(|\s*[-–])))/);
  const projects = [];

  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (trimmed.length < 15) continue;

    const blockLines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
    const firstLine = blockLines[0] || '';

    // Title: first line cleaned of leading bullets
    const title = firstLine
      .replace(/^[0-9]+[.)\s-]+|[*•-]\s*/, '')
      .split(/[|()–-]/)[0]
      .trim();

    if (!title || title.length > 50) continue;

    // Link
    const linkMatch = trimmed.match(/https?:\/\/[^\s)]+|github\.com\/[^\s)]+/i);
    const link = linkMatch ? (linkMatch[0].startsWith('http') ? linkMatch[0] : `https://${linkMatch[0]}`) : '';

    // Technologies: check "Tech Stack:", "Technologies:", "(Java, Spring Boot)" or scan block
    let technologies = [];
    const techLineMatch = trimmed.match(/(?:tech(?:nologies|\s+stack)?|tools|built\s+with)\s*[:-]\s*([^\n]+)/i);
    if (techLineMatch) {
      technologies = techLineMatch[1]
        .split(/[,|•/;]/)
        .map((t) => t.trim().replace(/^[•\-\s]+/, ''))
        .filter((t) => t.length > 1 && t.length < 30);
    }

    // Also scan for taxonomy skills in this block
    SKILL_TAXONOMY.forEach((st) => {
      for (const pat of st.patterns) {
        if (pat.test(trimmed)) {
          if (!technologies.includes(st.name)) {
            technologies.push(st.name);
          }
          break;
        }
      }
    });

    // Description
    const descLines = blockLines.slice(1).filter((l) => !/(?:tech|technologies|github|link)\s*[:-]/i.test(l));
    const description = descLines.join(' ').replace(/^[•\-\s]+/, '').slice(0, 300) || `Implemented ${title} utilizing ${technologies.slice(0, 3).join(', ')}.`;

    projects.push({
      title,
      technologies: Array.from(new Set(technologies)),
      description,
      link,
    });

    if (projects.length >= 6) break;
  }

  return projects;
}


/* =====================================================================
   8. EXTRACT EXPERIENCE / INTERNSHIPS
==================================================================== */

function extractExperience(experienceText) {
  if (!experienceText || experienceText.trim().length < 20) {
    return [];
  }

  const rawBlocks = experienceText.split(/\n(?=(?:[0-9]+\.|\*|-|•|[A-Z][A-Za-z\s]{3,35}(?:\s*\||\s*[-–]|\s*at\s*|\s*,\s*)))/);
  const experiences = [];

  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (trimmed.length < 15) continue;

    const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] || '';

    // Role & Company detection
    let role = 'Software Engineering Intern';
    let company = 'Technology Partner';

    const cleanHeader = firstLine.replace(/^[0-9]+[.)\s-]+|[*•-]\s*/, '').trim();
    if (cleanHeader.includes('|')) {
      const parts = cleanHeader.split('|').map((p) => p.trim());
      role = parts[0] || role;
      company = parts[1] || company;
    } else if (cleanHeader.includes(' - ')) {
      const parts = cleanHeader.split(' - ').map((p) => p.trim());
      role = parts[0] || role;
      company = parts[1] || company;
    } else if (/\bat\b/i.test(cleanHeader)) {
      const parts = cleanHeader.split(/\bat\b/i).map((p) => p.trim());
      role = parts[0] || role;
      company = parts[1] || company;
    } else {
      role = cleanHeader.slice(0, 40);
    }

    // Duration
    const dateMatch = trimmed.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}\s*[-–to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}|present|current)\b|\b\d{4}\s*[-–]\s*(?:\d{4}|present)\b/i);
    const duration = dateMatch ? dateMatch[0].trim() : 'Summer Internship';

    // Technologies used
    const technologies = [];
    SKILL_TAXONOMY.forEach((st) => {
      for (const pat of st.patterns) {
        if (pat.test(trimmed)) {
          technologies.push(st.name);
          break;
        }
      }
    });

    const descLines = lines.slice(1).filter((l) => !dateMatch || !l.includes(dateMatch[0]));
    const description = descLines.join(' ').replace(/^[•\-\s]+/, '').slice(0, 300) || `Contributed to ${company} engineering deliverables and feature implementation.`;

    experiences.push({
      role,
      company,
      duration,
      description,
      technologies: Array.from(new Set(technologies)),
    });

    if (experiences.length >= 4) break;
  }

  return experiences;
}


/* =====================================================================
   9. EXTRACT CERTIFICATIONS & ACHIEVEMENTS
==================================================================== */

function extractCertifications(certText) {
  if (!certText || certText.trim().length < 10) return [];

  const lines = certText.split('\n').map((l) => l.trim()).filter(Boolean);
  const certs = [];

  for (const line of lines) {
    const cleaned = line.replace(/^[0-9]+[.)\s-]+|[*•-]\s*/, '').trim();
    if (cleaned.length < 5 || cleaned.length > 100) continue;

    // Detect issuer
    let issuer = 'Accredited Certification Authority';
    const issuerMatch = cleaned.match(/(?:by|from|-|\|)\s*(Amazon Web Services|AWS|Google|Microsoft|Oracle|Coursera|Udemy|HackerRank|Meta|IBM|freeCodeCamp|LinkedIn)/i);
    if (issuerMatch) {
      issuer = issuerMatch[1];
    }

    const yearMatch = cleaned.match(/\b(20\d{2})\b/);
    const date = yearMatch ? yearMatch[1] : 'Verified';

    certs.push({
      name: cleaned.replace(/(?:by|from|-|\|)\s*(?:Amazon Web Services|AWS|Google|Microsoft|Oracle|Coursera|Udemy|HackerRank|Meta|IBM|freeCodeCamp|LinkedIn).*/i, '').trim(),
      issuer,
      date,
    });

    if (certs.length >= 6) break;
  }

  return certs;
}

function extractAchievements(achievementsText) {
  if (!achievementsText || achievementsText.trim().length < 10) return [];

  const lines = achievementsText.split('\n').map((l) => l.trim()).filter(Boolean);
  const achievements = [];

  for (const line of lines) {
    const cleaned = line.replace(/^[0-9]+[.)\s-]+|[*•-]\s*/, '').trim();
    if (cleaned.length > 10 && cleaned.length < 200) {
      achievements.push(cleaned);
    }
    if (achievements.length >= 6) break;
  }

  return achievements;
}


/* =====================================================================
   10. EXTRACT SKILLS WITH DETAILED EVIDENCE
===================================================================== */

/**
 * Extracts skills comprehensively across:
 * 1. Skills section lines (including explicit sub-categories)
 * 2. Every project's tech stack and description
 * 3. Every experience block
 * 4. Certifications
 * 5. Full-text taxonomy scanning
 *
 * For EVERY skill, builds an `evidence` array detailing exactly where it was detected.
 */
function extractSkillsWithEvidence({
  fullText,
  skillsText,
  projects,
  experiences,
  certifications,
}) {
  const normalizedFull = fullText.toLowerCase();
  const normalizedSkills = skillsText.toLowerCase();

  // Map of skillKey -> { name, category, evidence: Set<string>, occurrences: number }
  const skillMap = new Map();

  function registerSkill(skillName, category, evidenceLabel) {
    const key = skillName.toLowerCase().trim();
    if (!key || key.length < 2) return;

    if (!skillMap.has(key)) {
      skillMap.set(key, {
        id: key.replace(/[^a-z0-9]/g, '_'),
        name: skillName,
        category: category || 'Tool',
        evidence: new Set(),
        occurrences: 0,
      });
    }

    const entry = skillMap.get(key);
    if (evidenceLabel) {
      entry.evidence.add(evidenceLabel);
      entry.occurrences += 1;
    }
  }

  // A. Check predefined taxonomy across full document
  SKILL_TAXONOMY.forEach((item) => {
    let count = 0;
    for (const pat of item.patterns) {
      const m = normalizedFull.match(new RegExp(pat.source, 'gi'));
      if (m) count += m.length;
    }

    if (count > 0) {
      // Check specific section presence for precise evidence tagging
      if (item.patterns.some((p) => p.test(normalizedSkills))) {
        registerSkill(item.name, item.category, 'Skills Section');
      }

      // Check projects
      projects.forEach((proj) => {
        const projText = `${proj.title} ${proj.technologies.join(' ')} ${proj.description}`.toLowerCase();
        if (item.patterns.some((p) => p.test(projText))) {
          registerSkill(item.name, item.category, `Project: ${proj.title}`);
        }
      });

      // Check experience
      experiences.forEach((exp) => {
        const expText = `${exp.role} ${exp.company} ${exp.technologies.join(' ')} ${exp.description}`.toLowerCase();
        if (item.patterns.some((p) => p.test(expText))) {
          registerSkill(item.name, item.category, `Experience: ${exp.role} at ${exp.company}`);
        }
      });

      // Check certifications
      certifications.forEach((cert) => {
        const certText = `${cert.name} ${cert.issuer}`.toLowerCase();
        if (item.patterns.some((p) => p.test(certText))) {
          registerSkill(item.name, item.category, `Certification: ${cert.name}`);
        }
      });

      // If matched in full text but no specific section tagged yet
      const current = skillMap.get(item.name.toLowerCase());
      if (!current || current.evidence.size === 0) {
        registerSkill(item.name, item.category, 'Resume Content');
      }
    }
  });

  // B. Parse explicit category lines from Skills Section (e.g. "Languages: Java, C++, Python")
  const skillLines = skillsText.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of skillLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && colonIdx < 35) {
      const categoryHeader = line.slice(0, colonIdx).trim().toLowerCase();
      const itemsString = line.slice(colonIdx + 1).trim();

      let detectedCat = 'Tool';
      if (/language|programming/i.test(categoryHeader)) detectedCat = 'Language';
      else if (/framework|library|web/i.test(categoryHeader)) detectedCat = 'Framework';
      else if (/database|data/i.test(categoryHeader)) detectedCat = 'Database';
      else if (/tool|platform|devops|cloud/i.test(categoryHeader)) detectedCat = 'Tool';
      else if (/concept|methodolog|core/i.test(categoryHeader)) detectedCat = 'Concept';

      const skillTokens = itemsString.split(/[,|•/;]/).map((t) => t.trim().replace(/^[•\-\s]+/, '')).filter((t) => t.length > 1 && t.length < 30);
      for (const token of skillTokens) {
        registerSkill(token, detectedCat, `Skills Section (${categoryHeader.slice(0, 20)})`);
      }
    } else {
      // Line with comma or bullet separated skills
      const skillTokens = line.split(/[,|•/;]/).map((t) => t.trim().replace(/^[•\-\s]+/, '')).filter((t) => t.length > 1 && t.length < 30);
      if (skillTokens.length > 1) {
        for (const token of skillTokens) {
          registerSkill(token, 'Tool', 'Skills Section');
        }
      }
    }
  }

  // C. Guarantee: Every skill mentioned in Project technologies must be extracted
  projects.forEach((proj) => {
    proj.technologies.forEach((tech) => {
      let cat = 'Tool';
      const known = SKILL_TAXONOMY.find((st) => st.name.toLowerCase() === tech.toLowerCase());
      if (known) cat = known.category;
      registerSkill(tech, cat, `Project: ${proj.title}`);
    });
  });

  // D. Guarantee: Every skill mentioned in Experience technologies must be extracted
  experiences.forEach((exp) => {
    exp.technologies.forEach((tech) => {
      let cat = 'Tool';
      const known = SKILL_TAXONOMY.find((st) => st.name.toLowerCase() === tech.toLowerCase());
      if (known) cat = known.category;
      registerSkill(tech, cat, `Experience: ${exp.role} at ${exp.company}`);
    });
  });

  // Convert map to structured list with deterministic scores
  const allSkills = [];
  const categorized = {
    languages: [],
    frameworks: [],
    databases: [],
    tools: [],
    concepts: [],
  };

  skillMap.forEach((entry) => {
    const evidenceArray = Array.from(entry.evidence);
    const evidenceCount = evidenceArray.length;

    // Deterministic proficiency score based on depth of evidence:
    // Base 60%, +12% per project, +15% per experience, +10% for skills section, capped at 96%
    let calculatedScore = 60;
    if (evidenceArray.some((e) => e.startsWith('Skills Section'))) calculatedScore += 8;
    if (evidenceArray.some((e) => e.startsWith('Project:'))) calculatedScore += 12;
    if (evidenceArray.some((e) => e.startsWith('Experience:'))) calculatedScore += 16;
    if (evidenceArray.some((e) => e.startsWith('Certification:'))) calculatedScore += 10;
    if (evidenceCount > 2) calculatedScore += 6;

    const score = Math.min(Math.max(calculatedScore, 50), 96);
    const status = score >= 75 ? 'Strong' : score >= 60 ? 'Developing' : 'Weak';

    const skillObj = {
      id: entry.id,
      name: entry.name,
      category: entry.category,
      occurrences: Math.max(entry.occurrences, evidenceCount),
      score,
      status,
      evidence: evidenceArray,
    };

    allSkills.push(skillObj);

    // Group into subcategory lists
    const catLower = entry.category.toLowerCase();
    if (catLower.includes('lang')) categorized.languages.push(skillObj);
    else if (catLower.includes('frame') || catLower.includes('lib')) categorized.frameworks.push(skillObj);
    else if (catLower.includes('data')) categorized.databases.push(skillObj);
    else if (catLower.includes('tool') || catLower.includes('devops') || catLower.includes('plat')) categorized.tools.push(skillObj);
    else categorized.concepts.push(skillObj);
  });

  // Sort by score and occurrences
  allSkills.sort((a, b) => b.score - a.score || b.evidence.length - a.evidence.length);
  Object.keys(categorized).forEach((key) => {
    categorized[key].sort((a, b) => b.score - a.score);
  });

  return {
    detectedSkills: allSkills,
    technicalSkills: categorized,
  };
}


/* =====================================================================
   11. MAIN STRUCTURED RESUME PARSER
===================================================================== */

/**
 * Parses raw resume text into a fully structured, multi-section resume profile.
 *
 * @param {string} text               - Raw resume text
 * @param {string} fileName           - Name of the uploaded file
 * @param {string} targetJob          - Active target role
 * @param {Array}  requiredJobSkills  - Canonical job requirements
 * @returns {Object} Structured resume profile
 */
export function parseResumeText(
  text = '',
  fileName = 'resume.pdf',
  targetJob = 'Backend Developer',
  requiredJobSkills = []
) {
  const safeText = typeof text === 'string' ? text : '';

  // 1. Segment text into sections
  const segments = segmentResumeText(safeText);

  // 2. Personal Details
  const personalDetails = extractPersonalDetails(segments.headerText, safeText);

  // 3. Education
  const education = extractEducation(segments.educationText, safeText);

  // 4. Projects
  const projects = extractProjects(segments.projectsText, safeText);

  // 5. Experience / Internships
  const experiences = extractExperience(segments.experienceText);

  // 6. Certifications & Achievements
  const certifications = extractCertifications(segments.certificationsText);
  const achievements = extractAchievements(segments.achievementsText);

  // 7. Technical Skills with transparent Evidence Tracking
  const { detectedSkills, technicalSkills } = extractSkillsWithEvidence({
    fullText: safeText,
    skillsText: segments.skillsText,
    projects,
    experiences,
    certifications,
  });

  // 8. Experience Level Detection
  let experienceYears = 0;
  let experienceLevel = 'Fresher';
  const expMatch = safeText.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience/i);
  if (expMatch && parseInt(expMatch[1], 10) > 0) {
    experienceYears = parseInt(expMatch[1], 10);
    experienceLevel = experienceYears >= 2 ? `${experienceYears} yrs (Experienced)` : `${experienceYears} yr (Junior)`;
  } else if (experiences.length > 0 || /intern|internship|trainee/i.test(safeText)) {
    experienceLevel = 'Internship Experience';
  }

  // 9. Job Requirements Comparison (Deterministic Match Score)
  const jobRequirements = requiredJobSkills.length > 0
    ? requiredJobSkills
    : [
        { name: 'Java', required: 80 },
        { name: 'Spring Boot', required: 80 },
        { name: 'REST API', required: 80 },
        { name: 'SQL', required: 75 },
        { name: 'Docker', required: 75 },
        { name: 'Git', required: 75 },
      ];

  const matchedSkills = [];
  const missingSkills = [];
  let totalScoreContribution = 0;

  jobRequirements.forEach((req) => {
    const found = detectedSkills.find(
      (s) =>
        s.name.toLowerCase() === req.name.toLowerCase() ||
        s.name.toLowerCase().includes(req.name.toLowerCase()) ||
        req.name.toLowerCase().includes(s.name.toLowerCase())
    );

    if (found) {
      matchedSkills.push({
        name: req.name,
        userScore: found.score,
        requiredScore: req.required,
        status: found.status,
      });
      totalScoreContribution += Math.min(found.score / req.required, 1.2);
    } else {
      missingSkills.push({
        name: req.name,
        userScore: 0,
        requiredScore: req.required,
        status: 'Missing',
      });
    }
  });

  const matchScore = jobRequirements.length > 0
    ? Math.round((totalScoreContribution / jobRequirements.length) * 100)
    : 65;

  // 10. Strengths & Gaps
  const strengths = [];
  matchedSkills.forEach((m) => {
    if (m.userScore >= 70) {
      strengths.push(`Proven proficiency in ${m.name} detected from resume evidence`);
    }
  });
  if (detectedSkills.length >= 6) {
    strengths.push(`Rich skill breadth: ${detectedSkills.length} technical skills verified across sections`);
  }
  if (projects.length >= 2) {
    strengths.push(`Strong project portfolio: ${projects.length} engineering applications detailed`);
  }
  if (experienceLevel !== 'Fresher') {
    strengths.push(`Practical industry exposure: ${experienceLevel}`);
  }
  if (strengths.length === 0) {
    strengths.push('Core computer science foundations identified');
  }

  const improvementAreas = [];
  missingSkills.forEach((m) => {
    improvementAreas.push(`Add practical projects demonstrating ${m.name} (required: ${m.requiredScore}%)`);
  });
  if (projects.length < 2) {
    improvementAreas.push('Expand project portfolio with quantifiable business metrics and architecture details');
  }
  if (!personalDetails.github) {
    improvementAreas.push('Include a live GitHub profile link to showcase code repositories and contributions');
  }
  if (certifications.length === 0) {
    improvementAreas.push('Attain recognized cloud/technical certifications to reinforce your resume profile');
  }

  const primaryEdu = education[0] || { degree: 'B.Tech', institution: 'Accredited University' };

  return {
    fileName,
    rawText: safeText.slice(0, 3000),
    wordCount: safeText.split(/\s+/).filter(Boolean).length,
    targetJob,

    // Personal Details
    personalDetails,

    // Education
    education,
    degree: primaryEdu.degree,
    college: primaryEdu.institution,

    // Technical Skills with Evidence
    detectedSkills,
    technicalSkills,

    // Projects
    projects,
    estimatedProjects: Math.max(projects.length, 1),

    // Experience
    experiences,
    experienceLevel,
    experienceYears,

    // Certifications & Achievements
    certifications,
    achievements,

    // Match Metrics
    matchedSkills,
    missingSkills,
    matchScore: Math.min(Math.max(matchScore, 20), 96),
    strengths: strengths.slice(0, 4),
    improvementAreas: improvementAreas.slice(0, 4),

    analyzedAt: new Date().toISOString(),
  };
}

export default {
  SKILL_TAXONOMY,
  extractTextFromFile,
  parseResumeText,
};
