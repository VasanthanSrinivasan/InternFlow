import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import GuestRoute from "./components/auth/GuestRoute";

// Auth + account
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";

// Dashboard
import Dashboard from "./features/dashboard/Dashboard";

// Internship Management
import Openings from "./features/openings/Openings";
import Applications from "./features/applications/FeatureApplications";
import Mentors from "./pages/Mentors";
import Attendance from "./features/attendance/Attendance";
import Evaluations from "./features/evaluations/Evaluations";

// Online Courses & Recorded Classes
import Courses from "./features/learning/Courses";
import CourseDetails from "./features/learning/CourseDetails";
import MyLearning from "./features/learning/MyLearning";
import CourseStudio from "./features/learning/CourseStudio";
import MyTasks from "./features/learning/MyTasks";

// Trainer + Admin
import Enrollments from "./features/staff/Enrollments";
import Assessments from "./features/staff/Assessments";
import Submissions from "./features/staff/Submissions";
import Reports from "./features/staff/Reports";
import Users from "./features/staff/Users";

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "12px",
            background: "#1f2937",
            color: "#ffffff",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#ffffff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#ffffff" } },
        }}
      />

      <Routes>
        {/* Public pages (logged-in users are redirected to Home) */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Private pages: need a logged-in user */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />

            {/* Internship Management */}
            <Route path="openings" element={<Openings />} />
            <Route path="applications" element={<Applications />} />
            <Route path="mentors" element={<Mentors />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="evaluations" element={<Evaluations />} />

            {/* Online Courses & Recorded Video Classes */}
            <Route path="learning/courses" element={<Courses />} />
            <Route path="learning/courses/:courseId" element={<CourseDetails />} />

            {/* Students only */}
            <Route element={<ProtectedRoute roles={["student"]} />}>
              <Route path="learning/my-learning" element={<MyLearning />} />
              <Route path="learning/tasks" element={<MyTasks />} />
            </Route>

            {/* Trainer + Admin only */}
            <Route element={<ProtectedRoute roles={["admin", "trainer"]} />}>
              <Route path="learning/studio" element={<CourseStudio />} />
              <Route path="staff/enrollments" element={<Enrollments />} />
              <Route path="staff/assessments" element={<Assessments />} />
              <Route path="staff/submissions" element={<Submissions />} />
              <Route path="staff/reports" element={<Reports />} />
            </Route>

            {/* Admin only */}
            <Route element={<ProtectedRoute roles={["admin"]} />}>
              <Route path="staff/users" element={<Users />} />
            </Route>

            {/* 404 - Page Not Found */}
            <Route
              path="*"
              element={
                <div className="panel">
                  <h2>404 — Page not found</h2>
                  <p>The page you are looking for does not exist.</p>
                  <Link to="/home">Go to Home</Link>
                </div>
              }
            />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
