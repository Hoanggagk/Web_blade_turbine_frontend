import React from "react";
import "../styles/LoginPage.css";
import { useNavigate } from "react-router-dom";

type LoginPageProps = {
  username: string;
  password: string;
  error?: string;
  info?: string; // ✅ thêm info message
  loading?: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

function LoginPage({
  username,
  password,
  error,
  info,
  loading = false,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: LoginPageProps) {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <div className="login-form-container">
        <h2 className="login-title">Login</h2>
        <form onSubmit={onSubmit}>
          <div className="input-form-container">
            <label className="input-label">Your email or phone</label>
            <div className="input-container">
              <input
                type="text"
                className="login-input"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="Enter your email or phone"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-form-container">
            <label className="input-label">Your password</label>
            <div className="input-container">
              <input
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* ✅ Hiển thị error */}
          {error && <p className="error-message">{error}</p>}

          {/* ✅ Hiển thị info */}
          {info && <p className="info-message">{info}</p>}

          <button
            type="button"
            className="forgot-password-button"
            onClick={() => navigate("/forgot-password")}
            disabled={loading}
          >
            Forgot Password?
          </button>

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading ? "Login..." : "Login"}
          </button>

          <button
            type="button"
            className="sign-up-button"
            onClick={() => navigate("/sign-up")}
            disabled={loading}
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
