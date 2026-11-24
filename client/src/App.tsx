import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { RequirePermission } from "./auth/RequirePermission";
import { AppLayout } from "./layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";
import { ModulesPage } from "./pages/ModulesPage";
import { TasksPage } from "./pages/TasksPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { FormsAdminPage } from "./pages/FormsAdminPage";
import { FormEditorPage } from "./pages/FormEditorPage";
import { FormSubmissionsPage } from "./pages/FormSubmissionsPage";
import { FormsListPage } from "./pages/FormsListPage";
import { FormFillPage } from "./pages/FormFillPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route
            path="users"
            element={
              <RequirePermission permission="Users:Read">
                <UsersPage />
              </RequirePermission>
            }
          />
          <Route
            path="roles"
            element={
              <RequirePermission permission="Roles:Read">
                <RolesPage />
              </RequirePermission>
            }
          />
          <Route
            path="modules"
            element={
              <RequirePermission permission="Modules:Read">
                <ModulesPage />
              </RequirePermission>
            }
          />
          <Route
            path="tasks"
            element={
              <RequirePermission permission="Tasks:Read">
                <TasksPage />
              </RequirePermission>
            }
          />
          <Route
            path="tasks/:id"
            element={
              <RequirePermission permission="Tasks:Read">
                <TaskDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="projects"
            element={
              <RequirePermission permission="Tasks:Read">
                <ProjectsPage />
              </RequirePermission>
            }
          />
          <Route
            path="reports"
            element={
              <RequirePermission permission="Reports:Read">
                <ReportsPage />
              </RequirePermission>
            }
          />
          <Route path="forms" element={<FormsListPage />} />
          <Route
            path="forms/admin"
            element={
              <RequirePermission permission="Forms:Read">
                <FormsAdminPage />
              </RequirePermission>
            }
          />
          <Route
            path="forms/admin/new"
            element={
              <RequirePermission permission="Forms:Read">
                <FormEditorPage />
              </RequirePermission>
            }
          />
          <Route
            path="forms/admin/:id"
            element={
              <RequirePermission permission="Forms:Read">
                <FormEditorPage />
              </RequirePermission>
            }
          />
          <Route
            path="forms/admin/:id/submissions"
            element={
              <RequirePermission permission="Forms:Read">
                <FormSubmissionsPage />
              </RequirePermission>
            }
          />
          <Route path="forms/:id" element={<FormFillPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
