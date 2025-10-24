import Button from "../components/button";
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
    <div className="change-password-page">
      <div className="auth-form">
        <div className="auth-form__header">
          <h2 className="auth-form__title">{title}</h2>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            className="form-input"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="confirm-password">
            Confirm password
          </label>
          <input
            id="confirm-password"
            className="form-input"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>

        {error && <p className="form-error">{error}</p>}
        {info && <p className="auth-form__subtitle">{info}</p>}

        <div className="auth-form__actions">
          <Button variant="submit" onClick={onSave} type="button">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ForgotChangePasswordPage;



