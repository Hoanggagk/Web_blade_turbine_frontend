import React from "react";

type LoginFormProps = {
  username: string;                     // Giá trị của input username
  password: string;                     // Giá trị của input password
  error?: string;                        // Thông báo lỗi (nếu có)
  onUsernameChange: (value: string) => void; // Hàm xử lý khi thay đổi username
  onPasswordChange: (value: string) => void; // Hàm xử lý khi thay đổi password
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; // Hàm xử lý khi submit form
};

function LoginForm({
  username,
  password,
  error,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps) {
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
        <div className="LoginForm">
          {/* Tiêu đề form */}
          <h1 className="LoginTitle">Log in</h1>

          {/* Form đăng nhập */}
          <form onSubmit={onSubmit}>
            {/* Trường nhập username */}
            <div className="InputFormContainer">
              <label className="UsernameLabel">Your username</label>
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
              <label className="PasswordLabel">Your password</label>
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
    </div>
  );
}

export default LoginForm;
