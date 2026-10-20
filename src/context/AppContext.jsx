/* =========================================
   AppContext - Centralized Application State
   
   Single source of truth for all Skill Point
   data. Replaces fragmented localStorage access
   across pages with a unified React Context.
   
   All state auto-syncs to localStorage via
   the storageService abstraction layer.
   ========================================= */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { useAuth } from "./AuthContext";
import { userPersistenceApi } from "../services/apiService";

import {
  getProfile,
  saveProfile as persistProfile,
  DEFAULT_PROFILE,
  getTargetJob,
  saveTargetJob as persistTargetJob,
  getLatestAssessment,
  saveAssessmentResult as persistAssessment,
  getAssessmentHistory,
  getResumeData,
  saveResumeData as persistResume,
  clearResumeData,
  getParsedResume,
  saveParsedResume as persistParsedResume,
  getActiveJD,
  saveActiveJD as persistActiveJD,
  clearActiveJD,
  getSavedJDs,
  saveStructuredJD,
  deleteSavedJD,
  getDynamicAssignments,
  saveDynamicAssignments as persistDynamicAssignments,
  getAssessmentLevel,
  saveAssessmentLevel as persistAssessmentLevel,
  getAssignmentCompletions,
  saveAssignmentCompletions as persistAssignments,
  getAssignmentSubmissions,
  saveAssignmentSubmissions as persistAssignmentSubmissions,
  getLearningProgress,
  saveLearningProgress as persistLearning,
  addActivity,
  getActivityLog,
  saveProgressSnapshot,
  getProgressHistory,
  getCustomJobs,
  saveCustomJob as persistCustomJob,
  deleteCustomJob as removeCustomJob,
  getSkillLevels,
  saveSkillLevels as persistSkillLevels,
  resetProgressData,
  importData,
  getThemePreference,
  saveThemePreference,
  applyTheme,
  KEYS,
  safeSetItem,
} from "../services/storageService";

import {
  updateSkillLevelsFromAssessment,
} from "../services/skillLevelService.js";

import {
  calculateReadiness,
  calculateProfileCompletion,
  compareReadiness,
} from "../hooks/useReadiness";

import {
  calculateSkillGaps,
} from "../hooks/useSkillGap";

import {
  matchResumeWithJobDescriptionIntelligence,
} from "../services/skillMatchingService.js";

import {
  getJobRequirements,
  getAssignmentsForJob,
  getLearningPathForJob,
} from "../data/jobData";

import { parseResumeText } from "../services/resumeParserService";
import { parseJobDescription, matchResumeWithJobDescription } from "../services/jdParserService";
import { generatePersonalizedAssignments } from "../services/assignmentGeneratorService";


/* =========================================
   CONTEXT
   ========================================= */

const AppContext = createContext(null);


/* =========================================
   PROVIDER
   ========================================= */

export function AppProvider({ children }) {

  /* -----------------------------------------
     ACCOUNT ISOLATION & USER ID SCOPING
  ----------------------------------------- */
  const { user } = useAuth() || {};
  const currentUserId = user?.id || user?.email || null;

  /* -----------------------------------------
     CLOUD PERSISTENCE & SYNCHRONIZATION STATE
  ----------------------------------------- */
  const [syncStatus, setSyncStatus] = useState("idle"); // 'idle' | 'syncing' | 'synced' | 'saving' | 'error' | 'offline'
  const [syncError, setSyncError] = useState(null);
  const activeUserIdRef = useRef(currentUserId);

  useEffect(() => {
    activeUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const saveCloudUpdates = useCallback(async (updates) => {
    const targetUid = currentUserId;
    if (!targetUid || !updates || Object.keys(updates).length === 0) return;
    if (activeUserIdRef.current !== targetUid) return;

    setSyncStatus("saving");
    try {
      const res = await userPersistenceApi.saveUserData(updates);
      // Drop response if user changed while in flight
      if (activeUserIdRef.current !== targetUid) {
        console.warn(`[AppContext] Dropping saveCloudUpdates response for ${targetUid} (user switched)`);
        return;
      }
      if (res.success) {
        setSyncStatus("synced");
        setSyncError(null);
      } else {
        setSyncStatus(res.isNetworkError ? "offline" : "error");
        setSyncError(res.error || "Failed to sync changes with cloud.");
      }
    } catch (err) {
      if (activeUserIdRef.current !== targetUid) return;
      setSyncStatus("error");
      setSyncError(err?.message || "Sync error");
    }
  }, [currentUserId]);

  /* -----------------------------------------
     PROFILE STATE
  ----------------------------------------- */

  const [profile, setProfile] = useState(
    () => getProfile(currentUserId)
  );

  const updateProfile = useCallback((newProfile) => {
    setProfile(newProfile);
    persistProfile(newProfile, currentUserId);
    saveCloudUpdates({ skillPointProfile: newProfile });

    addActivity({
      title: "Profile updated",
      type: "Profile",
      time: "Just now",
      icon: "◎",
    }, currentUserId);
  }, [currentUserId, saveCloudUpdates]);


  /* -----------------------------------------
     TARGET JOB STATE
  ----------------------------------------- */

  const [targetJob, setTargetJob] = useState(
    () => getTargetJob(currentUserId)
  );

  /* -----------------------------------------
     CUSTOM JOBS STATE
  ----------------------------------------- */

  const [customJobs, setCustomJobs] = useState(
    () => getCustomJobs(currentUserId)
  );


  /* -----------------------------------------
     RESUME & JOB DESCRIPTION STATE
  ----------------------------------------- */

  const [resume, setResume] = useState(
    () => getResumeData(currentUserId)
  );

  const [parsedResume, setParsedResume] = useState(
    () => getParsedResume(currentUserId)
  );

  const [activeJD, setActiveJD] = useState(
    () => getActiveJD(currentUserId)
  );

  const [savedJDs, setSavedJDs] = useState(
    () => getSavedJDs(currentUserId)
  );

  const [assessmentLevel, setAssessmentLevel] = useState(
    () => getAssessmentLevel(currentUserId)
  );

  const [dynamicAssignments, setDynamicAssignments] = useState(
    () => getDynamicAssignments(currentUserId)
  );


  /* -----------------------------------------
     ASSESSMENT & ADAPTIVE SKILL LEVEL STATE (Module 5)
  ----------------------------------------- */

  const [latestAssessment, setLatestAssessment] = useState(
    () => getLatestAssessment(currentUserId)
  );

  const [assessmentHistory, setAssessmentHistory] = useState(
    () => getAssessmentHistory(currentUserId)
  );

  const [skillLevels, setSkillLevels] = useState(
    () => getSkillLevels(currentUserId)
  );

  const [assignmentCompletions, setAssignmentCompletions] = useState(
    () => getAssignmentCompletions(currentUserId)
  );

  const [assignmentSubmissions, setAssignmentSubmissions] = useState(
    () => getAssignmentSubmissions(currentUserId)
  );

  const [learningProgress, setLearningProgress] = useState(
    () => getLearningProgress(currentUserId)
  );

  const [activities, setActivities] = useState(
    () => getActivityLog(currentUserId)
  );

  /* -----------------------------------------
     APPEARANCE & THEME MANAGEMENT
  ----------------------------------------- */
  const [theme, setThemeState] = useState(() => getThemePreference());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [theme]);

  const updateTheme = useCallback((newTheme) => {
    const valid = saveThemePreference(newTheme);
    setThemeState(valid);
  }, []);

  const toggleTheme = useCallback(() => {
    const isDark = typeof document !== "undefined" && document.documentElement.getAttribute("data-color-mode") === "dark";
    const next = isDark ? "light" : "dark";
    updateTheme(next);
  }, [updateTheme]);

  /* -----------------------------------------
     ACCOUNT ISOLATION & DATA RELOADING
     Re-initializes state whenever the authenticated user changes.
  ----------------------------------------- */
  const reloadAllUserData = useCallback((uid = currentUserId) => {
    if (!uid) {
      setProfile({ ...DEFAULT_PROFILE });
      setTargetJob("");
      setCustomJobs([]);
      setResume({ uploaded: false, fileName: "", targetJob: "" });
      setParsedResume(null);
      setActiveJD(null);
      setSavedJDs([]);
      setAssessmentLevel(1);
      setDynamicAssignments([]);
      setLatestAssessment(null);
      setAssessmentHistory([]);
      setSkillLevels({});
      setAssignmentCompletions({});
      setAssignmentSubmissions({});
      setLearningProgress({ completedLessons: [], courseProgress: {} });
      setActivities([]);
      return;
    }

    setProfile(getProfile(uid));
    setTargetJob(getTargetJob(uid));
    setCustomJobs(getCustomJobs(uid));
    setResume(getResumeData(uid));
    setParsedResume(getParsedResume(uid));
    setActiveJD(getActiveJD(uid));
    setSavedJDs(getSavedJDs(uid));
    setAssessmentLevel(getAssessmentLevel(uid));
    setDynamicAssignments(getDynamicAssignments(uid));
    setLatestAssessment(getLatestAssessment(uid));
    setAssessmentHistory(getAssessmentHistory(uid));
    setSkillLevels(getSkillLevels(uid));
    setAssignmentCompletions(getAssignmentCompletions(uid));
    setAssignmentSubmissions(getAssignmentSubmissions(uid));
    setLearningProgress(getLearningProgress(uid));
    setActivities(getActivityLog(uid));
  }, [currentUserId]);

  const syncFromCloud = useCallback(async (uid = currentUserId) => {
    if (!uid) return;
    if (activeUserIdRef.current !== uid) return;
    setSyncStatus("syncing");
    setSyncError(null);

    try {
      const res = await userPersistenceApi.fetchAllUserData();
      // Drop stale response if active user changed during network call
      if (activeUserIdRef.current !== uid) {
        console.warn(`[AppContext] Dropping stale syncFromCloud response for ${uid}`);
        return;
      }

      if (!res.success) {
        setSyncStatus(res.isNetworkError ? "offline" : "error");
        setSyncError(res.error || "Failed to fetch cloud records.");
        return;
      }

      const cloudData = res.data || {};

      // Authoritative cloud mirror: write cloud state (or clean defaults for missing keys) to user-scoped storage
      const resolvedProfile = cloudData.skillPointProfile || { ...DEFAULT_PROFILE, name: user?.name || '', email: user?.email || '' };
      persistProfile(resolvedProfile, uid);

      const resolvedTargetJob = (cloudData.skillPointTargetJob && typeof cloudData.skillPointTargetJob === 'string') ? cloudData.skillPointTargetJob.trim() : '';
      persistTargetJob(resolvedTargetJob, uid);

      const hasResume = Boolean(cloudData.skillPointResumeUploaded === true || cloudData.skillPointResumeUploaded === "true");
      persistResume({
        uploaded: hasResume,
        fileName: hasResume ? (cloudData.skillPointResumeFileName || "") : "",
        targetJob: hasResume ? (cloudData.skillPointResumeTargetJob || "") : "",
      }, uid);

      persistParsedResume(cloudData.skillPointParsedResume || null, uid);
      persistActiveJD(cloudData.skillPointActiveJD || null, uid);
      safeSetItem(KEYS.SAVED_JDS, Array.isArray(cloudData.skillPointSavedJDs) ? cloudData.skillPointSavedJDs : [], uid);
      persistAssessmentLevel(cloudData.skillPointAssessmentLevel || 1, uid);
      persistDynamicAssignments(Array.isArray(cloudData.skillPointDynamicAssignments) ? cloudData.skillPointDynamicAssignments : [], uid);
      persistAssessment(cloudData.skillPointAssessment || null, uid);
      safeSetItem(KEYS.ASSESSMENT_HISTORY, Array.isArray(cloudData.skillPointAssessmentHistory) ? cloudData.skillPointAssessmentHistory : [], uid);
      persistSkillLevels(cloudData.skillPointSkillLevels && typeof cloudData.skillPointSkillLevels === 'object' ? cloudData.skillPointSkillLevels : {}, uid);
      persistAssignments(cloudData.skillPointAssignments && typeof cloudData.skillPointAssignments === 'object' ? cloudData.skillPointAssignments : {}, uid);
      persistAssignmentSubmissions(cloudData.skillPointAssignmentSubmissions && typeof cloudData.skillPointAssignmentSubmissions === 'object' ? cloudData.skillPointAssignmentSubmissions : {}, uid);
      persistLearning(cloudData.skillPointLearningProgress || { completedLessons: [], courseProgress: {} }, uid);
      safeSetItem(KEYS.ACTIVITY_LOG, Array.isArray(cloudData.skillPointActivityLog) ? cloudData.skillPointActivityLog : [], uid);
      safeSetItem(KEYS.PROGRESS_HISTORY, Array.isArray(cloudData.skillPointProgressHistory) ? cloudData.skillPointProgressHistory : [], uid);
      safeSetItem(KEYS.CUSTOM_JOBS, Array.isArray(cloudData.skillPointCustomJobs) ? cloudData.skillPointCustomJobs : [], uid);

      // Reload state from synced store
      reloadAllUserData(uid);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (err) {
      if (activeUserIdRef.current !== uid) return;
      console.warn("[AppContext] Cloud sync error:", err);
      setSyncStatus("error");
      setSyncError(err?.message || "Sync failure");
    }
  }, [currentUserId, user, reloadAllUserData]);

  useEffect(() => {
    activeUserIdRef.current = currentUserId;
    reloadAllUserData(currentUserId);
    if (currentUserId) {
      syncFromCloud(currentUserId);
    }
  }, [currentUserId, reloadAllUserData, syncFromCloud]);

  /**
   * Resets active user's progress data while preserving profile and custom roles.
   */
  const resetProgress = useCallback(async () => {
    try {
      await userPersistenceApi.resetUserProgress();
    } catch {}
    resetProgressData(currentUserId);
    reloadAllUserData(currentUserId);
    setSyncStatus("synced");
  }, [currentUserId, reloadAllUserData]);

  /**
   * Validates and imports user data atomically, then reloads context state.
   */
  const importUserData = useCallback((payload) => {
    const res = importData(payload, currentUserId);
    if (res.success) {
      reloadAllUserData(currentUserId);
    }
    return res;
  }, [currentUserId, reloadAllUserData]);

  /* -----------------------------------------
     TARGET JOB & SCOPED ASSESSMENT SELECTORS
     Associates assessments with the active target role
  ----------------------------------------- */

  const getLatestAssessmentForJob = useCallback((jobTitle = targetJob) => {
    if (!jobTitle) return null;
    const norm = jobTitle.trim().toLowerCase();
    if (Array.isArray(assessmentHistory) && assessmentHistory.length > 0) {
      for (let i = assessmentHistory.length - 1; i >= 0; i--) {
        const a = assessmentHistory[i];
        if (a?.targetJob && a.targetJob.trim().toLowerCase() === norm && a.completed) {
          return a;
        }
      }
    }
    if (latestAssessment?.targetJob && latestAssessment.targetJob.trim().toLowerCase() === norm && latestAssessment.completed) {
      return latestAssessment;
    }
    return null;
  }, [assessmentHistory, latestAssessment, targetJob]);

  const getPreviousAssessmentForJob = useCallback((jobTitle = targetJob) => {
    if (!jobTitle) return null;
    const norm = jobTitle.trim().toLowerCase();
    const attemptsForJob = (assessmentHistory || []).filter(
      (a) => a?.targetJob && a.targetJob.trim().toLowerCase() === norm && a.completed
    );
    if (attemptsForJob.length >= 2) {
      return attemptsForJob[attemptsForJob.length - 2];
    }
    return null;
  }, [assessmentHistory, targetJob]);

  const activeLatestAssessment = useMemo(() => {
    return getLatestAssessmentForJob(targetJob);
  }, [getLatestAssessmentForJob, targetJob]);

  /**
   * Authoritative resolution of active assignments for a job role.
   * Guarantees unique assignments with stable IDs matching the role's requirements.
   */
  const getActiveAssignmentsForJob = useCallback((jobTitle = targetJob) => {
    if (!jobTitle) return [];
    // If dynamicAssignments exists and aligns with jobTitle, use dynamicAssignments
    if (Array.isArray(dynamicAssignments) && dynamicAssignments.length > 0) {
      // Check if dynamic assignments were generated for this job
      const firstSource = dynamicAssignments[0]?.source || "";
      const matchesJob = firstSource.toLowerCase().includes(jobTitle.toLowerCase()) ||
                         jobTitle.toLowerCase().includes(targetJob.toLowerCase());
      if (matchesJob) {
        // Deduplicate by ID
        const seen = new Set();
        return dynamicAssignments.filter((a) => {
          if (!a?.id || seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        });
      }
    }

    const matchingJD = (activeJD && (
      activeJD.jobTitle?.trim().toLowerCase() === jobTitle.trim().toLowerCase() ||
      activeJD.jobTitle?.toLowerCase().includes(jobTitle.toLowerCase()) ||
      jobTitle.toLowerCase().includes(activeJD.jobTitle?.toLowerCase())
    )) ? activeJD : null;

    const generated = generatePersonalizedAssignments({
      targetJob: jobTitle,
      parsedResume,
      parsedJD: matchingJD,
      skillGaps: [],
      skillLevels,
    });

    const seen = new Set();
    return (generated || []).filter((a) => {
      if (!a?.id || seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  }, [dynamicAssignments, targetJob, activeJD, parsedResume, skillLevels]);

  const activeAssignments = useMemo(() => {
    return getActiveAssignmentsForJob(targetJob);
  }, [getActiveAssignmentsForJob, targetJob]);

  /**
   * Calculates practical stats: completed active assignments / total active assignments
   * Strictly scopes completion to active assignments for targetJob.
   */
  const calculatePracticalStats = useCallback((jobTitle = targetJob) => {
    const list = getActiveAssignmentsForJob(jobTitle);
    const total = list.length;
    if (total === 0) {
      return { completed: 0, total: 0 };
    }
    const completed = list.filter((a) => Boolean(assignmentCompletions[a.id])).length;
    return { completed, total };
  }, [getActiveAssignmentsForJob, assignmentCompletions, targetJob]);

  const selectTargetJob = useCallback((jobTitle) => {
    if (!jobTitle) return;
    setTargetJob(jobTitle);
    persistTargetJob(jobTitle, currentUserId);

    // Check if activeJD matches this newly selected jobTitle
    const jdMatches = Boolean(
      activeJD &&
      (activeJD.jobTitle?.trim().toLowerCase() === jobTitle.trim().toLowerCase() ||
       activeJD.jobTitle?.toLowerCase().includes(jobTitle.toLowerCase()) ||
       jobTitle.toLowerCase().includes(activeJD.jobTitle?.toLowerCase()))
    );

    const matchingJD = jdMatches ? activeJD : null;

    // Immediately regenerate dynamic assignments for the new target job
    const dynAssignments = generatePersonalizedAssignments({
      targetJob: jobTitle,
      parsedResume,
      parsedJD: matchingJD,
      skillGaps: [],
    });
    setDynamicAssignments(dynAssignments);
    persistDynamicAssignments(dynAssignments, currentUserId);
    saveCloudUpdates({
      skillPointTargetJob: jobTitle,
      skillPointDynamicAssignments: dynAssignments,
    });

    addActivity({
      title: `Target role set to ${jobTitle}`,
      type: "Career",
      time: "Just now",
      icon: "◈",
    }, currentUserId);
  }, [activeJD, parsedResume, currentUserId, saveCloudUpdates]);

  const addCustomJob = useCallback((job) => {
    const updated = persistCustomJob(job);
    setCustomJobs(updated);
    saveCloudUpdates({ skillPointCustomJobs: updated });

    addActivity({
      title: `Added custom job "${job.title}"`,
      type: "Career",
      time: "Just now",
      icon: "◈",
    });
  }, [saveCloudUpdates]);

  const removeCustomJobById = useCallback((jobId) => {
    const updated = removeCustomJob(jobId);
    setCustomJobs(updated);
    saveCloudUpdates({ skillPointCustomJobs: updated });
  }, [saveCloudUpdates]);

  const submitAssessment = useCallback((result) => {
    // Module 5 & 6B: Calculate previous readiness and updated readiness
    const currentStoredLevels = getSkillLevels(currentUserId);
    const activeReqSkills = getJobRequirements(result.targetJob || targetJob) || [];
    
    const baselineGaps = calculateSkillGaps({
      requiredSkills: activeReqSkills,
      assessment: latestAssessment,
      targetJob: result.targetJob || targetJob,
      parsedResume,
      activeJD,
      skillLevels: currentStoredLevels,
    });

    const targetRole = result.targetJob || targetJob;
    const practicalStats = calculatePracticalStats(targetRole);
    const profileComp = calculateProfileCompletion(profile, resume?.uploaded, targetRole);

    const prevReadiness = calculateReadiness({
      skillGaps: baselineGaps,
      assessment: latestAssessment,
      assignmentStats: practicalStats,
      profileStats: { profileCompletion: profileComp, resumeUploaded: !!resume?.uploaded },
    });

    const { updatedSkillLevels, promotedSkills } = updateSkillLevelsFromAssessment({
      assessmentResult: result,
      currentSkillLevels: currentStoredLevels,
      skillGaps: baselineGaps,
    });

    setSkillLevels(updatedSkillLevels);
    persistSkillLevels(updatedSkillLevels, currentUserId);

    const updatedGaps = calculateSkillGaps({
      requiredSkills: activeReqSkills,
      assessment: result,
      targetJob: targetRole,
      parsedResume,
      activeJD,
      skillLevels: updatedSkillLevels,
    });

    const newReadiness = calculateReadiness({
      skillGaps: updatedGaps,
      assessment: result,
      assignmentStats: practicalStats,
      profileStats: { profileCompletion: profileComp, resumeUploaded: !!resume?.uploaded },
    });

    // Enrich result with readiness metrics for fast, immutable history review
    const enrichedResult = {
      ...result,
      readiness: newReadiness,
      previousReadiness: prevReadiness,
    };

    setLatestAssessment(enrichedResult);
    persistAssessment(enrichedResult, currentUserId);
    const updatedHistory = getAssessmentHistory(currentUserId);
    setAssessmentHistory(updatedHistory);

    addActivity({
      title: `${result.targetJob} assessment completed (${result.levelName || `Level ${result.level || 1}`})`,
      type: "Assessment",
      time: "Just now",
      icon: "assessment",
      result: `${result.score}%`,
    }, currentUserId);

    // Log individual skill level promotions
    promotedSkills.forEach((p) => {
      addActivity({
        title: `${p.skill} elevated from ${p.from} to ${p.to}`,
        type: "Skill Level",
        time: "Just now",
        icon: "promotion",
        result: `${p.score}%`,
      }, currentUserId);
    });

    // Save a comprehensive progress snapshot
    saveProgressSnapshot({
      date: new Date().toISOString(),
      type: "assessment",
      score: result.score,
      targetJob: result.targetJob || targetJob,
      skillLevels: updatedSkillLevels,
      readiness: newReadiness,
      previousReadiness: prevReadiness,
    }, currentUserId);

    saveCloudUpdates({
      skillPointAssessment: enrichedResult,
      skillPointAssessmentHistory: updatedHistory,
      skillPointSkillLevels: updatedSkillLevels,
      skillPointActivityLog: getActivityLog(currentUserId),
      skillPointProgressHistory: getProgressHistory(currentUserId),
    });
  }, [targetJob, parsedResume, activeJD, latestAssessment, calculatePracticalStats, profile, resume, currentUserId, saveCloudUpdates]);

  const uploadResume = useCallback((fileName) => {
    const data = {
      uploaded: true,
      fileName,
      targetJob: getTargetJob(currentUserId),
    };

    setResume(data);
    persistResume(data, currentUserId);
    saveCloudUpdates({
      skillPointResumeUploaded: true,
      skillPointResumeFileName: fileName,
      skillPointResumeTargetJob: data.targetJob,
    });

    addActivity({
      title: "Resume uploaded",
      type: "Resume",
      time: "Just now",
      icon: "▤",
    }, currentUserId);
  }, [currentUserId, saveCloudUpdates]);

  const parseAndSaveResume = useCallback((rawText, fileName) => {
    const currentTarget = getTargetJob(currentUserId);
    const jobReqs = getJobRequirements(currentTarget);
    const parsed = parseResumeText(rawText, fileName, currentTarget, jobReqs);

    setParsedResume(parsed);
    persistParsedResume(parsed, currentUserId);

    const resumeData = {
      uploaded: true,
      fileName,
      targetJob: currentTarget,
    };
    setResume(resumeData);
    persistResume(resumeData, currentUserId);

    // Auto-enrich profile credentials if blank
    let updatedProfile = null;
    setProfile((prev) => {
      const updated = {
        ...prev,
        degree: prev.degree || parsed.degree,
        college: (prev.college && prev.college.trim().length > 0) ? prev.college : (parsed.college !== "Accredited University" ? parsed.college : prev.college),
        experience: prev.experience === "Fresher" ? parsed.experienceLevel : prev.experience,
      };
      persistProfile(updated, currentUserId);
      updatedProfile = updated;
      return updated;
    });

    // Refresh activeJD ATS alignment if activeJD exists
    let updatedActiveJD = activeJD;
    if (activeJD) {
      const matchResult = matchResumeWithJobDescription(parsed, activeJD);
      const updatedJD = { ...activeJD, matchResult };
      setActiveJD(updatedJD);
      persistActiveJD(updatedJD, currentUserId);
      updatedActiveJD = updatedJD;
    }

    // Auto-generate dynamic assignments based on resume gaps
    const dynAssignments = generatePersonalizedAssignments({
      targetJob: currentTarget,
      parsedResume: parsed,
      parsedJD: activeJD,
      skillGaps: [],
    });
    setDynamicAssignments(dynAssignments);
    persistDynamicAssignments(dynAssignments, currentUserId);

    saveCloudUpdates({
      skillPointParsedResume: parsed,
      skillPointResumeUploaded: true,
      skillPointResumeFileName: fileName,
      skillPointResumeTargetJob: currentTarget,
      skillPointProfile: updatedProfile || getProfile(currentUserId),
      skillPointActiveJD: updatedActiveJD,
      skillPointDynamicAssignments: dynAssignments,
    });

    addActivity({
      title: `Resume analyzed: ${parsed.detectedSkills.length} skills detected`,
      type: "Resume",
      time: "Just now",
      icon: "▤",
      result: `${parsed.matchScore}% Match`,
    }, currentUserId);

    return parsed;
  }, [activeJD, currentUserId, saveCloudUpdates]);

  const updateParsedResume = useCallback((updatedParsed) => {
    const currentTarget = getTargetJob(currentUserId);
    const jobReqs = getJobRequirements(currentTarget) || [];
    
    // Recalculate match metrics if detectedSkills exist
    let updated = { ...updatedParsed };
    if (updated.detectedSkills && Array.isArray(updated.detectedSkills)) {
      const detected = updated.detectedSkills;
      const matched = [];
      const missing = [];
      let totalScoreContribution = 0;

      jobReqs.forEach((req) => {
        const found = detected.find(
          (s) =>
            s.name.toLowerCase() === req.name.toLowerCase() ||
            s.name.toLowerCase().includes(req.name.toLowerCase()) ||
            req.name.toLowerCase().includes(s.name.toLowerCase())
        );

        if (found) {
          matched.push({
            name: req.name,
            userScore: found.score || 75,
            requiredScore: req.required,
            status: found.status || "Strong",
          });
          totalScoreContribution += Math.min((found.score || 75) / req.required, 1.2);
        } else {
          missing.push({
            name: req.name,
            userScore: 0,
            requiredScore: req.required,
            status: "Missing",
          });
        }
      });

      const matchScore = jobReqs.length > 0
        ? Math.round((totalScoreContribution / jobReqs.length) * 100)
        : 65;

      updated.matchedSkills = matched;
      updated.missingSkills = missing;
      updated.matchScore = Math.min(Math.max(matchScore, 20), 96);
    }

    setParsedResume(updated);
    persistParsedResume(updated, currentUserId);

    // Synchronize to Profile
    let syncedProfile = null;
    setProfile((prev) => {
      const personal = updated.personalDetails || {};
      const newProf = {
        ...prev,
        name: personal.name || prev.name,
        email: personal.email || prev.email,
        phone: personal.phone || prev.phone,
        location: personal.location || prev.location,
        github: personal.github || prev.github,
        linkedin: personal.linkedin || prev.linkedin,
        degree: updated.degree || prev.degree,
        college: (updated.college && updated.college !== "Accredited University") ? updated.college : prev.college,
        experience: updated.experienceLevel && updated.experienceLevel !== "Fresher" ? updated.experienceLevel : prev.experience,
      };
      persistProfile(newProf, currentUserId);
      syncedProfile = newProf;
      return newProf;
    });

    // Re-generate dynamic assignments
    const dynAssignments = generatePersonalizedAssignments({
      targetJob: currentTarget,
      parsedResume: updated,
      parsedJD: activeJD,
      skillGaps: [],
    });
    setDynamicAssignments(dynAssignments);
    persistDynamicAssignments(dynAssignments, currentUserId);

    saveCloudUpdates({
      skillPointParsedResume: updated,
      skillPointProfile: syncedProfile || getProfile(currentUserId),
      skillPointDynamicAssignments: dynAssignments,
    });

    addActivity({
      title: "Resume profile updated with manual corrections",
      type: "Resume",
      time: "Just now",
      icon: "edit",
      result: `${updated.detectedSkills?.length || 0} Skills`,
    }, currentUserId);

    return updated;
  }, [activeJD, currentUserId, saveCloudUpdates]);

  const parseAndSaveJD = useCallback((rawText, { companyName = "", jobTitle = "", fileName = "" } = {}) => {
    const parsedJD = parseJobDescription(rawText, companyName, jobTitle || targetJob);
    if (fileName) {
      parsedJD.fileName = fileName;
    }

    let matchResult = null;
    if (parsedResume) {
      matchResult = matchResumeWithJobDescription(parsedResume, parsedJD);
    } else {
      matchResult = {
        predictionScore: 0,
        readinessStatus: "Upload resume to see match",
        matchedSkills: [],
        missingSkills: parsedJD.requiredSkills.map(s => ({ ...s, status: "Missing" })),
        recommendations: ["Upload your resume in the Resume module to see personalized ATS alignment."],
        matchedCount: 0,
        totalRequired: parsedJD.requiredSkills.length,
      };
    }

    const combined = { ...parsedJD, matchResult };

    // Save as active and in saved JDs list
    saveStructuredJD(combined, currentUserId);
    setActiveJD(combined);
    const updatedJDs = getSavedJDs(currentUserId);
    setSavedJDs(updatedJDs);

    // Regenerate personalized assignments targeting this company's gaps
    const dynAssignments = generatePersonalizedAssignments({
      targetJob: combined.jobTitle || targetJob,
      parsedResume,
      parsedJD: combined,
      skillGaps: [],
    });
    setDynamicAssignments(dynAssignments);
    persistDynamicAssignments(dynAssignments, currentUserId);

    saveCloudUpdates({
      skillPointActiveJD: combined,
      skillPointSavedJDs: updatedJDs,
      skillPointDynamicAssignments: dynAssignments,
    });

    addActivity({
      title: `Job Description structured for ${combined.company} (${combined.jobTitle})`,
      type: "Career",
      time: "Just now",
      icon: "◈",
      result: `${combined.requiredSkills.length} Required Skills`,
    }, currentUserId);

    return combined;
  }, [parsedResume, targetJob, currentUserId, saveCloudUpdates]);

  const updateStructuredJD = useCallback((updatedJD) => {
    let matchResult = null;
    if (parsedResume) {
      matchResult = matchResumeWithJobDescription(parsedResume, updatedJD);
    } else {
      matchResult = updatedJD.matchResult || {
        predictionScore: 0,
        readinessStatus: "Upload resume to see match",
        matchedSkills: [],
        missingSkills: (updatedJD.requiredSkills || []).map(s => ({ ...s, status: "Missing" })),
        recommendations: ["Upload your resume in the Resume module to see personalized ATS alignment."],
        matchedCount: 0,
        totalRequired: (updatedJD.requiredSkills || []).length,
      };
    }

    const combined = { ...updatedJD, matchResult, updatedAt: new Date().toISOString() };

    saveStructuredJD(combined, currentUserId);
    setActiveJD(combined);
    const updatedJDs = getSavedJDs(currentUserId);
    setSavedJDs(updatedJDs);

    // Regenerate dynamic assignments
    const dynAssignments = generatePersonalizedAssignments({
      targetJob: combined.jobTitle || targetJob,
      parsedResume,
      parsedJD: combined,
      skillGaps: [],
    });
    setDynamicAssignments(dynAssignments);
    persistDynamicAssignments(dynAssignments, currentUserId);

    saveCloudUpdates({
      skillPointActiveJD: combined,
      skillPointSavedJDs: updatedJDs,
      skillPointDynamicAssignments: dynAssignments,
    });

    addActivity({
      title: `Job Description corrected: ${combined.jobTitle} at ${combined.company}`,
      type: "Career",
      time: "Just now",
      icon: "edit",
      result: `${combined.requiredSkills?.length || 0} Skills`,
    }, currentUserId);

    return combined;
  }, [parsedResume, targetJob, currentUserId, saveCloudUpdates]);

  const selectSavedJD = useCallback((id) => {
    const list = getSavedJDs(currentUserId);
    const found = list.find((item) => item.id === id);
    if (found) {
      let combined = found;
      if (parsedResume) {
        const matchResult = matchResumeWithJobDescription(parsedResume, found);
        combined = { ...found, matchResult };
      }
      persistActiveJD(combined, currentUserId);
      setActiveJD(combined);

      addActivity({
        title: `Switched active JD to ${combined.company} (${combined.jobTitle})`,
        type: "Career",
        time: "Just now",
        icon: "◈",
      }, currentUserId);
      return combined;
    }
    return null;
  }, [parsedResume, currentUserId]);

  const deleteSavedJDById = useCallback((id) => {
    const updated = deleteSavedJD(id, currentUserId);
    setSavedJDs(updated);
    const active = getActiveJD(currentUserId);
    setActiveJD(active);
    saveCloudUpdates({
      skillPointSavedJDs: updated,
      skillPointActiveJD: active,
    });
  }, [currentUserId, saveCloudUpdates]);

  const setJDAsTargetJob = useCallback((jd) => {
    if (!jd || !jd.jobTitle) return;

    const title = jd.jobTitle;
    selectTargetJob(title);

    // Register into customJobs so all downstream analytics (dashboard, skill gap, assessments) recognize it
    const existingCustom = getCustomJobs();
    const alreadyExists = existingCustom.some(
      (j) => j.title.toLowerCase() === title.toLowerCase()
    );

    if (!alreadyExists) {
      const customJobObj = {
        id: jd.id || `custom-${Date.now()}`,
        title,
        company: jd.company || jd.companyName || "Target Company",
        companyType: jd.company || "Target Company",
        level: jd.experienceRequirements?.level || "Entry Level",
        description: jd.rawText ? jd.rawText.slice(0, 350) : `${title} at ${jd.company}`,
        skills: (jd.requiredSkills && jd.requiredSkills.length > 0)
          ? jd.requiredSkills.map((s) => ({
              name: s.name,
              required: s.requiredScore || 80,
              importance: s.priority || "High",
              category: s.category || "Skill",
            }))
          : (jd.extractedSkills || []),
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      addCustomJob(customJobObj);
    }

    addActivity({
      title: `Set ${title} (${jd.company}) as active Target Job`,
      type: "Career",
      time: "Just now",
      icon: "target",
    });
  }, [selectTargetJob, addCustomJob]);

  const analyzeJobDescription = useCallback((jdText, companyName, jobTitle) => {
    return parseAndSaveJD(jdText, { companyName, jobTitle });
  }, [parseAndSaveJD]);

  const clearActiveJobDescription = useCallback(() => {
    clearActiveJD(currentUserId);
    setActiveJD(null);
  }, [currentUserId]);

  const setAssessmentLevelState = useCallback((level) => {
    const lvl = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
    setAssessmentLevel(lvl);
    persistAssessmentLevel(lvl, currentUserId);
  }, [currentUserId]);

  const removeResume = useCallback(() => {
    setResume({
      uploaded: false,
      fileName: "",
      targetJob: "",
    });
    setParsedResume(null);
    clearResumeData(currentUserId);

    // If activeJD exists, update its matchResult to empty baseline
    if (activeJD) {
      const resetJD = {
        ...activeJD,
        matchResult: {
          predictionScore: 0,
          readinessStatus: "Upload resume to see match",
          matchedSkills: [],
          missingSkills: (activeJD.requiredSkills || []).map((s) => ({ ...s, status: "Missing" })),
          recommendations: ["Upload your resume in the Resume module to see personalized ATS alignment."],
          matchedCount: 0,
          totalRequired: (activeJD.requiredSkills || []).length,
        },
      };
      setActiveJD(resetJD);
      persistActiveJD(resetJD, currentUserId);
    }

    // Reset dynamic assignments to default role
    const defAssignments = generatePersonalizedAssignments({
      targetJob,
      parsedResume: null,
      parsedJD: activeJD,
      skillGaps: [],
    });
    setDynamicAssignments(defAssignments);
    persistDynamicAssignments(defAssignments, currentUserId);

    saveCloudUpdates({
      skillPointResumeUploaded: false,
      skillPointResumeFileName: "",
      skillPointResumeTargetJob: "",
      skillPointParsedResume: null,
      skillPointActiveJD: activeJD ? getActiveJD(currentUserId) : null,
      skillPointDynamicAssignments: defAssignments,
    });
  }, [targetJob, activeJD, currentUserId, saveCloudUpdates]);


  /* -----------------------------------------
     ASSIGNMENTS ACTIONS
  ----------------------------------------- */

  const toggleAssignment = useCallback((assignmentId, assignmentTitle) => {

    setAssignmentCompletions((prev) => {

      const updated = {
        ...prev,
        [assignmentId]: !prev[assignmentId],
      };

      persistAssignments(updated, currentUserId);
      saveCloudUpdates({ skillPointAssignments: updated });

      if (updated[assignmentId]) {
        addActivity({
          title: `${assignmentTitle || "Assignment"} completed`,
          type: "Assignment",
          time: "Just now",
          icon: "assignment",
        }, currentUserId);
      }

      return updated;
    });

  }, [currentUserId, saveCloudUpdates]);

  const submitAssignmentSolution = useCallback((assignmentId, { url = "", notes = "", title = "" } = {}) => {
    let updatedSubmissions = null;
    // 1. Record submission details
    setAssignmentSubmissions((prev) => {
      const updated = {
        ...prev,
        [assignmentId]: {
          url,
          notes,
          title,
          targetJob,
          submittedAt: new Date().toISOString(),
        },
      };
      persistAssignmentSubmissions(updated, currentUserId);
      updatedSubmissions = updated;
      return updated;
    });

    // 2. Mark assignment completed
    setAssignmentCompletions((prev) => {
      const updated = {
        ...prev,
        [assignmentId]: true,
      };
      persistAssignments(updated, currentUserId);
      saveCloudUpdates({
        skillPointAssignments: updated,
        skillPointAssignmentSubmissions: updatedSubmissions || getAssignmentSubmissions(currentUserId),
      });
      return updated;
    });

    addActivity({
      title: `${title || "Assignment"} submitted with solution proof`,
      type: "Assignment",
      time: "Just now",
      icon: "submission",
    }, currentUserId);
  }, [targetJob, currentUserId, saveCloudUpdates]);


  /* -----------------------------------------
     LEARNING ACTIONS
  ----------------------------------------- */

  const toggleLesson = useCallback((lessonId, lessonTitle) => {

    setLearningProgress((prev) => {

      const completedLessons = prev.completedLessons || [];

      const isCompleted = completedLessons.includes(lessonId);

      const updated = {
        ...prev,
        completedLessons: isCompleted
          ? completedLessons.filter((id) => id !== lessonId)
          : [...completedLessons, lessonId],
      };

      persistLearning(updated, currentUserId);
      saveCloudUpdates({ skillPointLearningProgress: updated });

      if (!isCompleted) {
        addActivity({
          title: `${lessonTitle || "Lesson"} completed`,
          type: "Learning",
          time: "Just now",
          icon: "learning",
        }, currentUserId);
      }

      return updated;
    });

  }, [currentUserId, saveCloudUpdates]);


  /* -----------------------------------------
     COMPUTED: SKILL GAPS
     Requires jobData.js - we import helpers
     lazily to avoid circular deps
  ----------------------------------------- */

  // This will be recomputed when dependencies change.
  // Pages that need skill gaps should call computeSkillGaps()
  // with the jobData they import.

  const computeSkillGaps = useCallback(
    (requiredSkills, baselineSkills, assignments, lessons, assessmentOverride = null) => {
      // Use authoritative job requirements from jobRoles, not user baseline data
      const activeRequiredSkills = requiredSkills || getJobRequirements(targetJob) || [];
      // Use verified resume detected skills as starting baseline if available, otherwise 0
      let activeBaselineSkills = baselineSkills || [];
      if (activeBaselineSkills.length === 0 && parsedResume && parsedResume.detectedSkills && parsedResume.detectedSkills.length > 0) {
        activeBaselineSkills = parsedResume.detectedSkills.map((s) => ({
          name: s.name,
          current: s.score,
        }));
      }

      const activeAssignments = (assignments && assignments.length > 0)
        ? assignments
        : (dynamicAssignments && dynamicAssignments.length > 0)
        ? dynamicAssignments
        : (getAssignmentsForJob(targetJob) || []);

      // Check if activeJD matches targetJob
      const jdMatchesTarget = Boolean(
        activeJD &&
        (activeJD.jobTitle?.trim().toLowerCase() === targetJob.trim().toLowerCase() ||
         activeJD.jobTitle?.toLowerCase().includes(targetJob.toLowerCase()) ||
         targetJob.toLowerCase().includes(activeJD.jobTitle?.toLowerCase()))
      );
      const effectiveActiveJD = jdMatchesTarget ? activeJD : null;

      let activeLessons = lessons;
      if (!activeLessons) {
        activeLessons = getLearningPathForJob(targetJob, { customJobs, activeJD: effectiveActiveJD })?.lessons || [];
      } else if (activeLessons && activeLessons.lessons) {
        activeLessons = activeLessons.lessons;
      }

      const effectiveAssessment = assessmentOverride !== null
        ? assessmentOverride
        : getLatestAssessmentForJob(targetJob);

      return calculateSkillGaps({
        requiredSkills: activeRequiredSkills,
        baselineSkills: activeBaselineSkills,
        assessment: effectiveAssessment,
        skillLevels,
        targetJob,
        assignmentCompletions,
        assignments: activeAssignments,
        completedLessons: learningProgress.completedLessons || [],
        lessons: Array.isArray(activeLessons) ? activeLessons : [],
        parsedResume,
        activeJD: effectiveActiveJD,
      });
    },
    [getLatestAssessmentForJob, skillLevels, targetJob, assignmentCompletions, learningProgress, parsedResume, activeJD, dynamicAssignments, customJobs]
  );

  const getSkillMatchingAnalysis = useCallback(() => {
    const requiredSkills = getJobRequirements(targetJob) || [];
    const jdMatchesTarget = Boolean(
      activeJD &&
      (activeJD.jobTitle?.trim().toLowerCase() === targetJob.trim().toLowerCase() ||
       activeJD.jobTitle?.toLowerCase().includes(targetJob.toLowerCase()) ||
       targetJob.toLowerCase().includes(activeJD.jobTitle?.toLowerCase()))
    );

    const effectiveJD = jdMatchesTarget && activeJD ? activeJD : {
      jobTitle: targetJob,
      company: "Target Role",
      requiredSkills: requiredSkills.map((s) => ({
        ...s,
        requiredScore: s.required || 80,
        source: "Required",
      })),
      preferredSkills: [],
    };

    return matchResumeWithJobDescriptionIntelligence({
      parsedResume,
      activeJD: effectiveJD,
      assessment: getLatestAssessmentForJob(targetJob),
      skillLevels,
      assignmentCompletions,
      assignments: dynamicAssignments?.length > 0 ? dynamicAssignments : (getAssignmentsForJob(targetJob) || []),
      completedLessons: learningProgress.completedLessons || [],
      lessons: getLearningPathForJob(targetJob, { customJobs, activeJD: effectiveJD })?.lessons || [],
    });
  }, [parsedResume, activeJD, targetJob, getLatestAssessmentForJob, skillLevels, assignmentCompletions, dynamicAssignments, learningProgress, customJobs]);


  /* -----------------------------------------
     COMPUTED: READINESS
  ----------------------------------------- */

  const computeReadiness = useCallback(
    (customSkillGaps) => {
      const activeSkillGaps = (customSkillGaps && customSkillGaps.length > 0)
        ? customSkillGaps
        : computeSkillGaps();

      const practicalStats = calculatePracticalStats(targetJob);

      const profileCompletion = calculateProfileCompletion(
        profile,
        resume.uploaded,
        targetJob,
      );

      const scopedAssessment = getLatestAssessmentForJob(targetJob);

      return calculateReadiness({
        skillGaps: activeSkillGaps || [],
        assessment: scopedAssessment,
        assignmentStats: practicalStats,
        profileStats: {
          profileCompletion,
          resumeUploaded: resume.uploaded,
        },
      });

    },
    [profile, resume, targetJob, getLatestAssessmentForJob, calculatePracticalStats, computeSkillGaps]
  );

  const computePreviousReadiness = useCallback(() => {
    const previousAttempt = getPreviousAssessmentForJob(targetJob);
    if (!previousAttempt) {
      return null;
    }

    const scopedCurrentAssessment = getLatestAssessmentForJob(targetJob);

    // Check if the current assessment for this job stored previousReadiness
    if (scopedCurrentAssessment?.previousReadiness) {
      return scopedCurrentAssessment.previousReadiness;
    }

    // Check if any progress snapshot for this targetJob recorded it
    const snapshots = getProgressHistory();
    if (snapshots && snapshots.length > 0) {
      const match = [...snapshots].reverse().find(
        (s) => s.targetJob?.trim().toLowerCase() === targetJob.trim().toLowerCase() && s.previousReadiness && s.readiness
      );
      if (match?.previousReadiness) {
        return match.previousReadiness;
      }
    }

    // Otherwise calculate previous readiness deterministically using previousAttempt
    const practicalStats = calculatePracticalStats(targetJob);
    const profileComp = calculateProfileCompletion(profile, resume?.uploaded, targetJob);

    return calculateReadiness({
      skillGaps: computeSkillGaps(null, null, null, null, previousAttempt),
      assessment: previousAttempt,
      assignmentStats: practicalStats,
      profileStats: {
        profileCompletion: profileComp,
        resumeUploaded: !!resume?.uploaded,
      },
    });
  }, [getPreviousAssessmentForJob, getLatestAssessmentForJob, calculatePracticalStats, profile, resume, targetJob, computeSkillGaps]);

  const getReadinessComparison = useCallback(() => {
    const current = computeReadiness();
    const previous = computePreviousReadiness();
    return compareReadiness(current, previous);
  }, [computeReadiness, computePreviousReadiness]);

  const getActiveJobContext = useCallback(() => {
    const jdMatchesTarget = Boolean(
      activeJD &&
      (activeJD.jobTitle?.trim().toLowerCase() === targetJob.trim().toLowerCase() ||
       activeJD.jobTitle?.toLowerCase().includes(targetJob.toLowerCase()) ||
       targetJob.toLowerCase().includes(activeJD.jobTitle?.toLowerCase()))
    );
    return {
      targetJob,
      activeJD: jdMatchesTarget ? activeJD : null,
      latestAssessment: getLatestAssessmentForJob(targetJob),
      previousAssessment: getPreviousAssessmentForJob(targetJob),
      assignments: dynamicAssignments?.length > 0 ? dynamicAssignments : (getAssignmentsForJob(targetJob) || []),
    };
  }, [targetJob, activeJD, getLatestAssessmentForJob, getPreviousAssessmentForJob, dynamicAssignments]);


  /* -----------------------------------------
     CONTEXT VALUE
  ----------------------------------------- */

  const value = useMemo(
    () => ({

      // Profile
      profile,
      updateProfile,

      // Target Job
      targetJob,
      selectTargetJob,

      // Custom Jobs
      customJobs,
      addCustomJob,
      removeCustomJobById,

      // Assessment
      latestAssessment: activeLatestAssessment,
      rawLatestAssessment: latestAssessment,
      assessmentHistory,
      submitAssessment,
      assessmentLevel,
      setAssessmentLevel: setAssessmentLevelState,
      skillLevels,
      setSkillLevels,
      getLatestAssessmentForJob,
      getPreviousAssessmentForJob,
      getActiveJobContext,

      // Resume & JD
      resume,
      parsedResume,
      uploadResume,
      parseAndSaveResume,
      updateParsedResume,
      removeResume,
      // Job Description Intelligence (Module 2)
      activeJD,
      savedJDs,
      parseAndSaveJD,
      updateStructuredJD,
      analyzeJobDescription,
      clearActiveJobDescription,
      selectSavedJD,
      deleteSavedJDById,
      setJDAsTargetJob,

      // Assignments
      assignments: activeAssignments,
      dynamicAssignments,
      assignmentCompletions,
      assignmentSubmissions,
      toggleAssignment,
      submitAssignmentSolution,
      getActiveAssignmentsForJob,
      calculatePracticalStats,

      // Learning
      learningProgress,
      toggleLesson,

      // Activities
      activities,

      // Reset & Import
      reloadAllUserData,
      resetProgress,
      importUserData,

      // Computed
      computeSkillGaps,
      getSkillMatchingAnalysis,
      computeReadiness,
      computePreviousReadiness,
      getReadinessComparison,

      // Appearance & Theme
      theme,
      setTheme: updateTheme,
      toggleTheme,

      // Cloud Persistence & Synchronization
      syncStatus,
      syncError,
      syncFromCloud,
      saveCloudUpdates,

    }),
    [
      profile,
      updateProfile,
      targetJob,
      selectTargetJob,
      customJobs,
      addCustomJob,
      removeCustomJobById,
      activeLatestAssessment,
      latestAssessment,
      assessmentHistory,
      submitAssessment,
      assessmentLevel,
      setAssessmentLevelState,
      skillLevels,
      getLatestAssessmentForJob,
      getPreviousAssessmentForJob,
      getActiveJobContext,
      resume,
      parsedResume,
      uploadResume,
      parseAndSaveResume,
      updateParsedResume,
      removeResume,
      activeJD,
      savedJDs,
      parseAndSaveJD,
      updateStructuredJD,
      analyzeJobDescription,
      clearActiveJobDescription,
      selectSavedJD,
      deleteSavedJDById,
      setJDAsTargetJob,
      activeAssignments,
      dynamicAssignments,
      assignmentCompletions,
      assignmentSubmissions,
      toggleAssignment,
      submitAssignmentSolution,
      getActiveAssignmentsForJob,
      calculatePracticalStats,
      learningProgress,
      toggleLesson,
      activities,
      reloadAllUserData,
      resetProgress,
      importUserData,
      computeSkillGaps,
      getSkillMatchingAnalysis,
      computeReadiness,
      computePreviousReadiness,
      getReadinessComparison,
      theme,
      updateTheme,
      toggleTheme,
      syncStatus,
      syncError,
      syncFromCloud,
      saveCloudUpdates,
    ]
  );


  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}


/* =========================================
   HOOK
   ========================================= */

export function useApp() {

  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useApp must be used within an AppProvider"
    );
  }

  return context;
}


export default AppContext;
