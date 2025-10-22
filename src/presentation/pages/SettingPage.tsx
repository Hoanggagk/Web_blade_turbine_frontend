import Sidebar from "../components/sidebar";
import "../styles/SettingPage.css";

type SettingPageProps = {
  onLogout: () => void;
  onSave: () => void; // 👈 KHÔNG nhận event nữa
  current: string;
  newPass: string;
  confirm: string;
  setCurrent: (val: string) => void;
  setNewPass: (val: string) => void;
  setConfirm: (val: string) => void;
  title?: string;
  error?: string;
  info?: string;
  loadingSave: boolean;
  loadingLogout: boolean;
};

function SettingPage({
  onLogout,
  onSave,
  current,
  newPass,
  confirm,
  setCurrent,
  setNewPass,
  setConfirm,
  info,
  error,
  title = "Change password",
  loadingSave,
  loadingLogout,
}: SettingPageProps) {
  return (
    <div className="SettingPage">
      <aside className="sidebar-content">
        <Sidebar />
      </aside>

      <main className="main-content">
        <div className="header-bar">
          <button className="btn-logout" onClick={onLogout} disabled={loadingLogout}>
            {loadingLogout ? "Logging out..." : "Log out"}
          </button>
        </div>

        <form
          className="change-password-form"
          onSubmit={(e) => {            // 👈 chặn submit mặc định, tránh reload
            e.preventDefault();
            onSave();
          }}
        >
          <h2>{title}</h2>

          <div className="input-group">
            <label className="title-group">
              <span style={{ color: "red" }}>*</span> Current password
            </label>
            <input
              className="input-field"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
              minLength={6}
            />
          </div>

          <div className="input-group">
            <label className="title-group">
              <span style={{ color: "red" }}>*</span> New password
            </label>
            <input
              className="input-field"
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <div className="input-group">
            <label className="title-group">
              <span style={{ color: "red" }}>*</span> Confirm password
            </label>
            <input
              className="input-field"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
          {info && <p style={{ color: "green", marginTop: 8 }}>{info}</p>}

          <button className="save-btn" type="submit" disabled={loadingSave}>
            {loadingSave ? "Saving..." : "Save"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default SettingPage;
