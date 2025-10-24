import React from "react";
import Button from "../components/button";
import "../styles/ForgotMailPassword.css";

type ForgotMailPasswordProps = {
  email: string;
  error?: string;
  loading?: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

function ForgotMailPassword({
  email,
  error,
  loading = false,
  onEmailChange,
  onSubmit,
}: ForgotMailPasswordProps) {
    return (
    <div className="forgot-mail-page">
      <form className="auth-form" onSubmit={onSubmit}>
        <div className="auth-form__header">
          <h2 className="auth-form__title">Forgot Password</h2>
          <p className="auth-form__subtitle">Enter your email to receive an OTP.</p>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="forgot-email">
            Your email
          </label>
          <input
            id="forgot-email"
            type="email"
            className="form-input"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="auth-form__actions">
          <Button variant="submit" type="submit" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ForgotMailPassword;



