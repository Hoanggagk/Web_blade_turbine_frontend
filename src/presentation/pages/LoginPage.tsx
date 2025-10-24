import React from "react";
import Button from "../components/button";
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
      <form className="auth-form" onSubmit={onSubmit}>
        <div className="auth-form__header">
          <h2 className="auth-form__title">Login</h2>
          {info && <p className="auth-form__subtitle">{info}</p>}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="login-username">
            Your email or phone
          </label>
          <input
            id="login-username"
            type="text"
            className="form-input"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            placeholder="Enter your email or phone"
            required
            disabled={loading}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="login-password">
            Your password
          </label>
          <input
            id="login-password"
            type="password"
            className="form-input"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          type="button"
          className="login-page__forgot"
          onClick={() => navigate("/forgot-password")}
          disabled={loading}
        >
          Forgot Password?
        </button>

        <div className="auth-form__actions">
          <Button variant="submit" type="submit" disabled={loading}>
            {loading ? "Login..." : "Login"}
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate("/sign-up")}
            disabled={loading}
          >
            Sign Up
          </Button>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;



