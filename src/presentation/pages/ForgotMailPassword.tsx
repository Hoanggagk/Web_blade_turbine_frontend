import React from "react";
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
      <div className="mail-form-container">
        <h2 className="forgot-title">Forgot Password</h2>
        <form onSubmit={onSubmit}>
          <div className="input-form-container">
            <label className="input-label">Your email</label>
            <div className="input-container">
              <input
                type="text"
                className="mail-input"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            className="send-submit-button"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotMailPassword;
