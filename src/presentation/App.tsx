// src/presentation/App.tsx
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../shared/context/UserContext";

// Public flows
import LoginLogic from "../application/useCases/LoginLogic";
import OtpSignupLogic from "../application/useCases/OtpSignupLogic";
import OtpLoginLogic from "../application/useCases/OtpLoginLogic";
import SignUpLogic from "../application/useCases/SignUplogic";
import ForgotMailPasswordLogic from "../application/useCases/ForgotMailPasswordLogic";
import ForgotChangePasswordLogic from "../application/useCases/ForgotChangePasswordLogic";
import OtpChangeLogic from "../application/useCases/OtpChangeLogic";

// Protected flows
import ProjectLogic from "../application/useCases/ProjectLogic";
import SettingLogic from "../application/useCases/SettingLogic";
import UserManagementLogic from "../application/useCases/UserManagementLogic";
import ProjectManagementLogic from "../application/useCases/ProjectManagementLogic";
import MemberProjectLogic from "../application/useCases/MemberProjectLogic";
import WindfarmLogic from "../application/useCases/WinfarmLogic";
import WindfarmAdminLogic from "../application/useCases/WindfarmAdminLogic";
import TurbinePageLogic from "../application/useCases/TurbinePageLogic";
import AuditLogsLogic from "../application/useCases/AuditLogic";
import InspectionListPage from "./pages/InspectionListPage";
import InspectionDetailPage from "./pages/InspectionDetailPage";
import UploadPage from "./pages/UploadPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/project" replace />;
  return <>{children}</>;
}

function MemberProjectRouteWrapper() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { project?: { id: string; name?: string } } };
  const projectFromState = location.state?.project;

  return (
    <MemberProjectLogic
      projectId={projectId!}
      projectTitle={projectFromState?.name ?? "Project Members"}
      canManage
      onBack={() => navigate(-1)}
    />
  );
}

function WindfarmRouteWrapper() {
  return <WindfarmLogic />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginLogic /></PublicRoute>} />
      <Route path="/sign-up" element={<PublicRoute><SignUpLogic /></PublicRoute>} />
      <Route path="/otp-login" element={<PublicRoute><OtpLoginLogic /></PublicRoute>} />
      <Route path="/otp-sign-up" element={<PublicRoute><OtpSignupLogic /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotMailPasswordLogic /></PublicRoute>} />
      <Route path="/change-password" element={<PublicRoute><ForgotChangePasswordLogic /></PublicRoute>} />
      <Route path="/otp-forgot" element={<PublicRoute><OtpChangeLogic /></PublicRoute>} />

      {/* Protected */}
      <Route path="/project" element={<ProtectedRoute><ProjectLogic /></ProtectedRoute>} />
      <Route path="/project-management" element={<ProtectedRoute><ProjectManagementLogic /></ProtectedRoute>} />
      <Route
        path="/project-management/:projectId/members"
        element={
          <ProtectedRoute>
            <MemberProjectRouteWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/turbine/:turbineId"
        element={
          <ProtectedRoute>
            <InspectionListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/turbine/:turbineId/inspection/:inspectionId"
        element={
          <ProtectedRoute>
            <InspectionDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:projectId/windfarms"
        element={
          <ProtectedRoute>
            <WindfarmRouteWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:projectId/windfarms/:windfarmId/turbines"
        element={
          <ProtectedRoute>
            <TurbinePageLogic />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        }
      />
      <Route path="/windfarm-management" element={<ProtectedRoute><WindfarmAdminLogic /></ProtectedRoute>} />
      <Route path="/audit-logs" element={<ProtectedRoute><AuditLogsLogic /></ProtectedRoute>} />
      <Route path="/setting" element={<ProtectedRoute><SettingLogic /></ProtectedRoute>} />
      <Route path="/user" element={<ProtectedRoute><UserManagementLogic /></ProtectedRoute>} />

      {/* Wildcard */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

