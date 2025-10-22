import { useState } from "react";
import ForgotChangePasswordPage from "../../presentation/pages/ForgotChangePasswordPage";
import { authServiceLong } from "../../infrastructure/http/auth/authService"; // ✅ đúng path

function ForgotChangePasswordLogic() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [info, setInfo] = useState<string | undefined>(undefined);

  const handleSave = async () => {
    setError(undefined);
    setInfo(undefined);

    if (!newPassword || !confirmPassword) {
      setError("Vui long nhap day du mat khau moi va xac nhan.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mat khau va xac nhan mat khau khong khop.");
      return;
    }

    // ✅ api không throw: luôn trả ApiResult<T>
    const res = await authServiceLong.resetPassword({
      password: newPassword,
      confirm_password: confirmPassword,
    });

    if (!res.ok) {
      // ApiErr: lấy message từ wrapper
      setError(res.message || "Dat lai mat khau that bai.");
      return;
    }

    // ApiOk<SuccessResponse>: chỉ có { message: string }
    const msg =
      res.data?.message ||
      res.message ||
      "Dat lai mat khau thanh cong. Vui long dang nhap lai.";

    setInfo(msg);
  };

  return (
    <ForgotChangePasswordPage
      onSave={handleSave}
      newPassword={newPassword}
      confirmPassword={confirmPassword}
      setNewPassword={setNewPassword}
      setConfirmPassword={setConfirmPassword}
      error={error}
      info={info}
      title="Dat lai mat khau"
    />
  );
}

export default ForgotChangePasswordLogic;
