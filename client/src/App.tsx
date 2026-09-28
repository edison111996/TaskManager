import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
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
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="modules" element={<ModulesPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="forms" element={<FormsListPage />} />
          <Route path="forms/admin" element={<FormsAdminPage />} />
          <Route path="forms/admin/new" element={<FormEditorPage />} />
          <Route path="forms/admin/:id" element={<FormEditorPage />} />
          <Route path="forms/admin/:id/submissions" element={<FormSubmissionsPage />} />
          <Route path="forms/:id" element={<FormFillPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
