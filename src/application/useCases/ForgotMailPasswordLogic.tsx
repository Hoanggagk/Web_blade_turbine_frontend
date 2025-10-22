import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ForgotMailPassword from "../../presentation/pages/ForgotMailPassword";
import { authServiceLong } from "../../infrastructure/http/auth/authService"; // ✅ đúng path

function ForgotMailPasswordLogic() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Vui lòng nhập email.");
      setLoading(false);
      return;
    }

    try {
      // ✅ api không ném lỗi: luôn trả ApiResult
      const res = await authServiceLong.forgotPassword({ email: trimmed });

      if (!res.ok) {
        setError(res.message || "Network error, please try again.");
        return;
      }

      // ✅ SuccessResponse chỉ có { message }
      // Có thể hiển thị toast res.data.message nếu muốn
      navigate("/otp-forgot", { state: { email: trimmed } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ForgotMailPassword
      email={email}
      error={error || undefined}
      loading={loading}
      onEmailChange={setEmail}
      onSubmit={handleSubmit}
    />
  );
}

export default ForgotMailPasswordLogic;
