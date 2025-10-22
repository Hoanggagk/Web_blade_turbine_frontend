import React, { useState } from "react";
import OtpPage from "../../presentation/pages/OtpPage";
import { useNavigate } from "react-router-dom";
import { authServiceLong } from "../../infrastructure/http/auth/authService"; // ✅ giữ đúng path

function OtpChangeLogic() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [info, setInfo] = useState<string | undefined>(undefined);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    setInfo(undefined);
    setLoadingSubmit(true);

    const code = otp.trim();
    if (!code) {
      setError("Vui long nhap ma OTP.");
      setLoadingSubmit(false);
      return;
    }

    // ✅ Service không ném lỗi: luôn trả ApiResult
    const res = await authServiceLong.verifyResetOtp({ otp: code });

    if (!res.ok) {
      setError(res.message || "Xac thuc OTP that bai.");
      setLoadingSubmit(false);
      return;
    }

    // ✅ SuccessResponse chỉ có { message }
    setInfo(res.data.message || "Xac thuc OTP thanh cong.");
    navigate("/change-password"); // dùng router thay vì window.location
    setLoadingSubmit(false);
  };

  const handleResend = async () => {
    setError(undefined);
    setInfo(undefined);
    setLoadingResend(true);

    const res = await authServiceLong.resendResetOtp();

    if (!res.ok) {
      setError(res.message || "Gui lai OTP that bai.");
      setLoadingResend(false);
      return;
    }

    // ✅ SuccessResponse chỉ có { message }
    setInfo(res.data.message || "OTP moi da duoc gui.");
    setLoadingResend(false);
  };

  return (
    <OtpPage
      otp={otp}
      error={error}
      info={info}
      loadingSubmit={loadingSubmit}
      loadingResend={loadingResend}
      onOtpChange={setOtp}
      onSubmit={handleSubmit}
      onResend={handleResend}
    />
  );
}

export default OtpChangeLogic;
