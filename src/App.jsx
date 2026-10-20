import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/landing/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import NotFound from "./pages/NotFound";

import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/profile/Profile";
import Job from "./pages/job/job.jsx";
import JobDescription from "./pages/jd/JobDescription";
import Resume from "./pages/resume/Resume";
import SkillGap from "./pages/skills/SkillGap";
import Assessment from "./pages/assessment/Assessment";
import Assignments from "./pages/assignments/Assignments";
import Learning from "./pages/learning/Learning";
import Readiness from "./pages/readiness/Readiness";
import Progress from "./pages/progress/Progress";
import Settings from "./pages/settings/Settings";

import ScrollToTop from "./components/common/ScrollToTop";
import "./App.css";


function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <AppProvider>

          <Routes>

            {/* =========================
                PUBLIC PAGES
            ========================= */}

            <Route
              path="/"
              element={<Landing />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            <Route
              path="/privacy"
              element={<PrivacyPolicy />}
            />

            <Route
              path="/terms"
              element={<TermsOfService />}
            />


            {/* =========================
                PROTECTED APPLICATION PAGES
            ========================= */}

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>

                {/* Dashboard */}
                <Route
                  path="/dashboard"
                  element={<Dashboard />}
                />

                {/* Profile */}
                <Route
                  path="/profile"
                  element={<Profile />}
                />

                {/* Job Readiness */}
                <Route
                  path="/job"
                  element={<Job />}
                />

                {/* Module 2: Job Description Intelligence */}
                <Route
                  path="/jd"
                  element={<JobDescription />}
                />
                <Route
                  path="/job-description"
                  element={<JobDescription />}
                />

                <Route
                  path="/resume"
                  element={<Resume />}
                />

                <Route
                  path="/skills"
                  element={<SkillGap />}
                />

                <Route
                  path="/assessment"
                  element={<Assessment />}
                />

                {/* Development */}
                <Route
                  path="/assignments"
                  element={<Assignments />}
                />

                <Route
                  path="/learning"
                  element={<Learning />}
                />

                <Route
                  path="/progress"
                  element={<Progress />}
                />

                <Route
                  path="/readiness"
                  element={<Readiness />}
                />

                {/* Settings */}
                <Route
                  path="/settings"
                  element={<Settings />}
                />

              </Route>
            </Route>


            {/* =========================
                404 CATCH-ALL
            ========================= */}

            <Route
              path="*"
              element={<NotFound />}
            />

          </Routes>

        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;