// src/logic/OtpSignupLogic.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OtpPage from "../../presentation/pages/OtpPage";
import { authServiceLong } from "../../infrastructure/http/auth/authService"; // ✅ giữ đúng path

function OtpSignupLogic() {
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
      setError("Vui long nhap OTP.");
      return;
    }

    setLoadingSubmit(true);
    try {
      // ✅ Service không ném lỗi: luôn trả ApiResult
      const res = await authServiceLong.verifyRegistration({ otp: code });

      if (!res.ok) {
        setError(res.message || "Co loi xay ra, vui long thu lai.");
        return;
      }

      setInfo(res.data.message || res.message || "Xac thuc thanh cong!");
      // Điều hướng thẳng về login (có thể đổi sang setTimeout nếu muốn hiển thị info lâu hơn)
      navigate("/login", { replace: true });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setLoadingResend(true);
    try {
      const res = await authServiceLong.resendRegistrationOtp();

      if (!res.ok) {
        setError(res.message || "Khong the gui lai OTP.");
        return;
      }

      setInfo(res.data.message || res.message || "OTP da duoc gui lai.");
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

export default OtpSignupLogic;
