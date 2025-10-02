import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SignUpPage from "../pages/SignUpPage";
import { authServiceLong } from "../api/auth/authService"; // ✅ giữ đúng path

function SignUpLogic() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      confirm_password: confirmPassword,
    };

    // ✅ Validate required
    if (!payload.name || !payload.email || !payload.phone || !password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      setLoading(false);
      return;
    }

    // ✅ Validate password confirm
    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận không khớp.");
      setLoading(false);
      return;
    }

    // ✅ Validate email local-part (trước @ ≤ 20 ký tự)
    const [localPart, domain] = payload.email.split("@");
    if (!domain) {
      setError("Email không hợp lệ. Vui lòng nhập theo dạng name@example.com");
      setLoading(false);
      return;
    }
    if (localPart.length > 20) {
      setError("Email không hợp lệ: phần trước @ tối đa 20 ký tự.");
      setLoading(false);
      return;
    }

    // ✅ Service không throw: luôn trả ApiResult
    const registerRes = await authServiceLong.register(payload);

    if (!registerRes.ok) {
      setError(registerRes.message || "Có lỗi xảy ra, vui lòng thử lại.");
      setLoading(false);
      return;
    }

    // ✅ Đăng ký thành công → chuyển sang màn OTP
    navigate("/otp-sign-up", { state: { email: payload.email, phone: payload.phone } });

    // (Tùy chọn) Gửi lại OTP (async, không block UI)
    authServiceLong.resendRegistrationOtp().then((res) => {
      if (!res.ok) {
        console.error("Resend registration OTP failed:", res.message);
      }
    });

    setLoading(false);
  };

  return (
    <SignUpPage
      name={name}
      email={email}
      phone={phone}
      password={password}
      confirmPassword={confirmPassword}
      errorMessage={error}
      loading={loading}
      onChangeName={setName}
      onChangeEmail={setEmail}
      onChangePhone={setPhone}
      onChangePassword={setPassword}
      onChangeConfirmPassword={setConfirmPassword}
      onSignUp={handleSignUp}
      signUpDisabled={loading}
    />
  );
}

export default SignUpLogic;
