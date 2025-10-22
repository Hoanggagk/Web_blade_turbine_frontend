import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginPage from "../../presentation/pages/LoginPage";
import { authServiceLong } from "../../infrastructure/http/auth/authService"; // ✅ giữ đúng path

function LoginLogic() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(""); // ✅ thêm info message
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const identifier = username.trim();
    if (!identifier || !password) {
      setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      setLoading(false);
      return;
    }

    try {
      // ✅ Service không throw; luôn trả ApiResult
      const loginRes = await authServiceLong.login({ identifier, password });

      if (!loginRes.ok) {
        setError(loginRes.message ?? "Đăng nhập thất bại, vui lòng thử lại.");
        return;
      }

      // ✅ Theo DTO: LoginPendingResponse chỉ có { message }, chuyển sang màn OTP
      navigate("/otp-login", { state: { identifier } });

      // (Tuỳ chọn) gửi lại OTP ngay sau khi điều hướng
      const resendRes = await authServiceLong.resendOtp();
      if (!resendRes.ok) {
        setError(resendRes.message ?? "Không gửi lại OTP được.");
      } else {
        setInfo("OTP đã được gửi lại. Vui lòng kiểm tra email/SMS.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginPage
      username={username}
      password={password}
      error={error}
      info={info}
      loading={loading}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  );
}

export default LoginLogic;
