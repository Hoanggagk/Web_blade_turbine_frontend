import Button from "../components/button";
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
      <form className="auth-form" onSubmit={onSignUp}>
        <div className="auth-form__header">
          <h2 className="auth-form__title">Sign Up</h2>
          {infoMessage && <p className="auth-form__subtitle">{infoMessage}</p>}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="sign-up-name">
            Your name
          </label>
          <input
            id="sign-up-name"
            className="form-input"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(event) => onChangeName(event.target.value)}
            required
            minLength={2}
            disabled={loading}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="sign-up-email">
            Your email
          </label>
          <input
            id="sign-up-email"
            className="form-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => onChangeEmail(event.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="sign-up-phone">
            Your phone
          </label>
          <input
            id="sign-up-phone"
            className="form-input"
            type="tel"
            placeholder="Enter your phone"
            value={phone}
            onChange={(event) => onChangePhone(event.target.value)}
            required
            pattern="^[0-9]{10,11}$"
            disabled={loading}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="sign-up-password">
            Your password
          </label>
          <input
            id="sign-up-password"
            className="form-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => onChangePassword(event.target.value)}
            required
            minLength={6}
            disabled={loading}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="sign-up-confirm-password">
            Confirm password
          </label>
          <input
            id="sign-up-confirm-password"
            className="form-input"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(event) => onChangeConfirmPassword(event.target.value)}
            required
            minLength={6}
            disabled={loading}
          />
        </div>

        {errorMessage && <p className="form-error">{errorMessage}</p>}

        <div className="auth-form__actions">
          <Button
            variant="submit"
            type="submit"
            disabled={signUpDisabled || loading}
          >
            {loading ? "Signing up..." : "Sign up"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default SignUpPage;



