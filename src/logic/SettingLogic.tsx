// src/logic/SettingLogic.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SettingPage from "../pages/SettingPage";
import { useUser, AUTH_SESSION_STORAGE_KEY } from "../context";
import { authServiceLong } from "../api/auth/authService"; // ✅ giữ đúng path

function SettingLogic() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);

  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoadingLogout(true);
    setError(undefined);
    setInfo(undefined);

    // ✅ Service không ném lỗi: luôn trả ApiResult
    const res = await authServiceLong.logout();

    if (!res.ok) {
      setError(res.message || "Logout failed");
      setLoadingLogout(false);
      return;
    }

    // ✅ SuccessResponse chỉ có { message }
    setInfo(res.data.message || "Logged out");
    sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    setUser(null);
    navigate("/login", { replace: true });

    setLoadingLogout(false);
  };

  const handleSave = async () => { // 👈 không nhận event
    if (!current || !newPass || !confirm) {
      setError("Please fill in all fields");
      return;
    }
    if (newPass !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoadingSave(true);
    setError(undefined);
    setInfo(undefined);

    const res = await authServiceLong.changePassword({
      current_password: current,
      new_password: newPass,
      confirm_password: confirm,
    });

    if (!res.ok) {
      setError(res.message || "Change password failed");
      setLoadingSave(false);
      return;
    }

    setInfo(res.data.message || "Password changed successfully");
    setCurrent("");
    setNewPass("");
    setConfirm("");
    setLoadingSave(false);
  };

  return (
    <SettingPage
      onLogout={handleLogout}
      onSave={handleSave}
      current={current}
      newPass={newPass}
      confirm={confirm}
      setCurrent={setCurrent}
      setNewPass={setNewPass}
      setConfirm={setConfirm}
      error={error}
      info={info}
      loadingSave={loadingSave}
      loadingLogout={loadingLogout}
    />
  );
}

export default SettingLogic;
