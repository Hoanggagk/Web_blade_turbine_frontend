// src/logic/OtpLoginLogic.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OtpPage from "../../presentation/pages/OtpPage";
import { useUser, AUTH_SESSION_STORAGE_KEY } from "../../shared/context/UserContext";
import { authServiceLong } from "../../infrastructure/http/auth/authService"; // ✅ giữ đúng path

function OtpLoginLogic() {
  const { setUser } = useUser();
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const code = otp.trim();
    if (!code) {
      setError("Vui lòng nhập OTP.");
      return;
    }

    setLoadingSubmit(true);
    try {
      const res = await authServiceLong.verifyOtp({ otp: code });

      if (!res.ok) {
        setError(res.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
        return;
      }

      // res.ok === true → LoginSuccessResponse { message, user }
      const user = res.data.user;
      if (!user) {
        setError("Không thể xác thực người dùng.");
        return;
      }

      // Đánh dấu đã đăng nhập sau khi OTP hợp lệ
      sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, "true");
      setUser({
        id: user.id,
        name: user.name,
        role: user.role,
        // (tuỳ schema context có hỗ trợ thêm) email: user.email, phone: user.phone
      });

      setInfo(res.data.message || res.message || "Đăng nhập thành công!");
      navigate("/project");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setLoadingResend(true);
    try {
      const res = await authServiceLong.resendOtp();

      if (!res.ok) {
        setError(res.message || "Không thể gửi lại OTP.");
        return;
      }

      setInfo(res.data.message || res.message || "OTP đã được gửi lại.");
    } finally {
      setLoadingResend(false);
    }
  };

  return (
    <OtpPage
      otp={otp}
      error={error}
      info={info}
      onOtpChange={setOtp}
      onSubmit={handleSubmit}
      onResend={handleResend}
      loadingSubmit={loadingSubmit}
      loadingResend={loadingResend}
    />
  );
}

export default OtpLoginLogic;
