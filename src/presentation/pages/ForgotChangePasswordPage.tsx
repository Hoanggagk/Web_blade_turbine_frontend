import "../styles/ForgotChangePasswordPage.css";
type ForgotChangePasswordPageProps = {
  onSave: () => void;
  newPassword: string;
  confirmPassword: string;
  setNewPassword: (val: string) => void;
  setConfirmPassword: (val: string) => void;
  title?: string;
  error?: string;
  info?: string;
};

function ForgotChangePasswordPage({
  onSave,
  newPassword,
  confirmPassword,
  setNewPassword,
  setConfirmPassword,
  info,
  error,
  title = "Change password",
}: ForgotChangePasswordPageProps) {
  return (
    <div className="ChangePasswordPage">
      {/* Change password form */}
      <div className="change-password-form">
        <h2>{title}</h2>

        <div className="input-group">
          <label className="title-group">
            <span style={{ color: "red" }}>*</span> New password
          </label>
          <input
            className="input-field"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="title-group">
            <span style={{ color: "red" }}>*</span> Confirm password
          </label>
          <input
            className="input-field"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        {info && <p className="info-text">{info}</p>}


        <button className="save-btn" onClick={onSave}>
          Save
        </button>
      </div>
    </div>
  );
}

export default ForgotChangePasswordPage;
