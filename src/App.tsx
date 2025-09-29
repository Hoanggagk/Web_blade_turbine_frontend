// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { UserProvider, useUser } from "../src/context";

// Public pages
import LoginLogic from "./logic/LoginLogic";
import OtpSignupLogic from "./logic/OtpSignupLogic";
import OtpLoginLogic from "./logic/OtpLoginLogic";
import SignUpLogic from "./logic/SignUplogic";
import ForgotMailPasswordLogic from "./logic/ForgotMailPasswordLogic";
import ForgotChangePasswordLogic from "./logic/ForgotChangePasswordLogic";
import OtpChangeLogic from "./logic/OtpChangeLogic";

// Protected pages
import ProjectLogic from "./logic/ProjectLogic";
import SettingLogic from "./logic/SettingLogic";
import SessionsListLogic from "./logic/SessionsListLoic";
import UserManagementLogic from "./logic/UserManagementLogic";
import ProjectManagementLogic from "./logic/ProjectManagementLogic";
import MemberProjectLogic from "./logic/MemberProjectLogic";
import WindfarmLogic from "./logic/WinfarmLogic"; // ✅ giữ nguyên
import WindfarmAdminLogic from "./logic/WindfarmAdminLogic"; // ✅ giữ nguyên 
import TurbinePageLogic from "./logic/TurbinePageLogic";
import AuditLogsLogic from "./logic/AuditLogic"; // ✅ thêm mới
// ===== Guards =====
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

// ===== Wrapper: Members =====
function MemberProjectRouteWrapper() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const projectFromState = location.state?.project as { id: string; name?: string } | undefined;

  return (
    <MemberProjectLogic
      projectId={projectId!}
      projectTitle={projectFromState?.name ?? "Project Members"}
      canManage={true} // TODO: map quyền thực tế
      onBack={() => navigate(-1)}
    />
  );
}

// ===== Wrapper: Windfarms in Project =====
function WindfarmRouteWrapper() {
  // WindfarmLogic tự đọc useParams + useLocation bên trong
  return <WindfarmLogic />;
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
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
          {/* ✅ Windfarms trong project */}
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
          <Route path="/windfarm-management" element={<ProtectedRoute>< WindfarmAdminLogic/></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute><AuditLogsLogic /></ProtectedRoute>} />  {/* ✅ thêm mới */}
          <Route path="/setting" element={<ProtectedRoute><SettingLogic /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><SessionsListLogic /></ProtectedRoute>} />
          <Route path="/user" element={<ProtectedRoute><UserManagementLogic /></ProtectedRoute>} />

          {/* Wildcard */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
