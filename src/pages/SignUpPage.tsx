import "../styles/SignUpPage.css";

interface SignUpPageProps {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  errorMessage?: string;
  infoMessage?: string;
  loading?: boolean;
  onChangeName: (val: string) => void;
  onChangeEmail: (val: string) => void;
  onChangePhone: (val: string) => void;
  onChangePassword: (val: string) => void;
  onChangeConfirmPassword: (val: string) => void;
  onSignUp: (e: React.FormEvent<HTMLFormElement>) => void;
  signUpDisabled: boolean;
}

function SignUpPage({
  name,
  email,
  phone,
  password,
  confirmPassword,
  errorMessage,
  infoMessage,
  loading = false,
  onChangeName,
  onChangeEmail,
  onChangePhone,
  onChangePassword,
  onChangeConfirmPassword,
  onSignUp,
  signUpDisabled,
}: SignUpPageProps) {
  return (
    <div className="sign-up-page">
      <div className="sign-up-form-container">
        <h1 className="sign-up-title">SIGN UP</h1>

        <form onSubmit={onSignUp}>
          {/* Name */}
          <div className="input-form-container">
            <label className="input-label" htmlFor="name">Your name</label>
            <div className="input-container">
              <input
                className="sign-up-input"
                type="text"
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => onChangeName(e.target.value)}
                required
                minLength={2}
              />
            </div>
          </div>

          {/* Email */}
          <div className="input-form-container">
            <label className="input-label" htmlFor="email">Your email</label>
            <div className="input-container">
              <input
                className="sign-up-input"
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => onChangeEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="input-form-container">
            <label className="input-label" htmlFor="phone">Your phone</label>
            <div className="input-container">
              <input
                className="sign-up-input"
                type="tel"
                id="phone"
                placeholder="Enter your phone"
                value={phone}
                onChange={(e) => onChangePhone(e.target.value)}
                required
                pattern="^[0-9]{10,11}$"
                title="Số điện thoại phải có 10–11 chữ số"
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-form-container">
            <label className="input-label" htmlFor="password">Your password</label>
            <div className="input-container">
              <input
                className="sign-up-input"
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => onChangePassword(e.target.value)}
                required
                minLength={6}
                title="Mật khẩu phải có ít nhất 6 ký tự"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="input-form-container">
            <label className="input-label" htmlFor="confirmPassword">Confirm password</label>
            <div className="input-container">
              <input
                className="sign-up-input"
                type="password"
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => onChangeConfirmPassword(e.target.value)}
                required
                minLength={6}
                title="Mật khẩu phải có ít nhất 6 ký tự"
              />
            </div>
          </div>

          {/* Error & Info */}
          {errorMessage && <p style={{ color: "red", marginTop: "8px" }}>{errorMessage}</p>}
          {infoMessage && <p style={{ color: "green", marginTop: "8px" }}>{infoMessage}</p>}

          {/* Submit Button */}
          <button
            className="signup-btn"
            type="submit"
            disabled={signUpDisabled || loading}
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignUpPage;
