import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireSession } from "./auth/RequireSession";

import { PupilLoginPage } from "./pages/PupilLoginPage";
import { TeacherLoginPage } from "./pages/TeacherLoginPage";
import { ParentLoginPage } from "./pages/ParentLoginPage";
import { PressroomPage } from "./pages/PressroomPage";
import { ZonePage } from "./pages/ZonePage";
import { TaskPage } from "./pages/TaskPage";
import { WallPage } from "./pages/WallPage";
import { RankingsPage } from "./pages/RankingsPage";
import { GoatListPage } from "./pages/GoatListPage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";
import { ParentViewPage } from "./pages/ParentViewPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public login routes */}
          <Route path="/login" element={<PupilLoginPage />} />
          <Route path="/staff/login" element={<TeacherLoginPage />} />
          <Route path="/parent/login" element={<ParentLoginPage />} />

          {/* Pupil */}
          <Route
            path="/"
            element={
              <RequireSession kind="pupil">
                <PressroomPage />
              </RequireSession>
            }
          />
          <Route
            path="/zone/:type"
            element={
              <RequireSession kind="pupil">
                <ZonePage />
              </RequireSession>
            }
          />
          <Route
            path="/task/:taskId"
            element={
              <RequireSession kind="pupil">
                <TaskPage />
              </RequireSession>
            }
          />
          <Route
            path="/wall"
            element={
              <RequireSession kind="pupil">
                <WallPage />
              </RequireSession>
            }
          />
          <Route
            path="/rankings"
            element={
              <RequireSession kind="pupil">
                <RankingsPage />
              </RequireSession>
            }
          />
          <Route
            path="/goat"
            element={
              <RequireSession kind="pupil">
                <GoatListPage />
              </RequireSession>
            }
          />

          {/* Teacher / admin */}
          <Route
            path="/staff"
            element={
              <RequireSession kind="teacher">
                <TeacherDashboardPage />
              </RequireSession>
            }
          />

          {/* Parent */}
          <Route
            path="/parent"
            element={
              <RequireSession kind="parent">
                <ParentViewPage />
              </RequireSession>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
