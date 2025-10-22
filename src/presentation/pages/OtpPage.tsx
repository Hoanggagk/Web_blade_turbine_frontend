import React from "react";
import "../styles/OtpPage.css";

// OtpPage.tsx
type OtpPageProps = {
  otp: string;
  error?: string;
  info?: string;
  loadingSubmit?: boolean; // trạng thái submit
  loadingResend?: boolean; // trạng thái resend
  onOtpChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onResend: () => void;
};

function OtpPage({
  otp,
  error,
  info,
  loadingSubmit = false,
  loadingResend = false,
  onOtpChange,
  onSubmit,
  onResend,
}: OtpPageProps) {
  return (
    <div className="OtpPage">
      <div className="OtpFormContainer">
        <h1 className="OtpTitle">Enter OTP</h1>
        <form onSubmit={onSubmit}>
          <div className="InputFormContainer">
            <label className="InputLabel">Your OTP</label>
            <div className="InputContainer">
              <input
                type="text"
                className="OtpInput"
                value={otp}
                onChange={(e) => onOtpChange(e.target.value)}
                placeholder="Enter your OTP"
                required
                disabled={loadingSubmit || loadingResend} // disable khi đang submit hoặc resend
              />
            </div>
          </div>

          {error && <p className="OtpError">{error}</p>}
          {info && <p className="OtpInfo">{info}</p>}

          <button
            type="submit"
            className="OtpSubmitButton"
            disabled={loadingSubmit || loadingResend}
          >
            {loadingSubmit ? "Submitting..." : "Submit"}
          </button>

          <button
            type="button"
            className="ResendOtpButton"
            onClick={onResend}
            disabled={loadingResend || loadingSubmit}
          >
            {loadingResend ? "Resending..." : "Resend OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OtpPage;
