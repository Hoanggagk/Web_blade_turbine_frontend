/*
  DOCUMENT TREE - LoginPage Component
  
  LoginPage (div.LoginPage)
  ├── LoginBackgroundImage (img.LoginBackgroundImage)
  └── LoginFormContainer (div.LoginFormContainer)
      ├── LoginTitle (h1.LoginTitle)
      └── form
          ├── InputFormContainer (div.InputFormContainer) — Username field
          │    ├── InputLabel (label.InputLabel)
          │    └── InputContainer (div.InputContainer)
          │         └── LoginInput (input.LoginInput) [type="text"]
          ├── InputFormContainer (div.InputFormContainer) — Password field
          │    ├── InputLabel (label.InputLabel)
          │    └── InputContainer (div.InputContainer)
          │         └── LoginInput (input.LoginInput) [type="password"]
          ├── Error message (p) — rendered conditionally if error exists
          └── LoginSubmitButton (button.LoginSubmitButton)
*/
import React from "react";
import "../styles/LoginPage.css"; // Import file CSS cho trang đăng nhập

type LoginPageProps = {
  username: string;                     // Giá trị của input username
  password: string;                     // Giá trị của input password
  error?: string;                        // Thông báo lỗi (nếu có)
  onUsernameChange: (value: string) => void; // Hàm xử lý khi thay đổi username
  onPasswordChange: (value: string) => void; // Hàm xử lý khi thay đổi password
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; // Hàm xử lý khi submit form
};

function LoginPage({
  username,
  password,
  error,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: LoginPageProps) {
  return (
    <div className="LoginPage">
      {/* Ảnh nền của trang login */}
      <img
        className="LoginBackgroundImage"
        src="https://api.builder.io/api/v1/image/assets/TEMP/511e3cb0e9861b7035f20692202ab4aa709aae7f?width=1676"
        alt="Industrial background"
      />

      {/* Container bọc form login */}
      <div className="LoginFormContainer">
        {/* Tiêu đề form */}
        <h1 className="LoginTitle">Log in</h1>

        {/* Form đăng nhập */}
        <form onSubmit={onSubmit}>
          {/* Trường nhập username */}
          <div className="InputFormContainer">
            <label className="InputLabel">Your username</label>
            <div className="InputContainer">
              <input
                type="text"
                className="LoginInput"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          {/* Trường nhập password */}
          <div className="InputFormContainer">
            <label className="InputLabel">Your password</label>
            <div className="InputContainer">
              <input
                type="password"
                className="LoginInput"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Hiển thị thông báo lỗi nếu có */}
          {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}

          {/* Nút submit */}
          <button type="submit" className="LoginSubmitButton">
            Login
          </button>
        </form>

      </div>
    </div>
  );
}

export default LoginPage;
