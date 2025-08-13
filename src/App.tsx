import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <main>
      <LoginPage
        username=""
        password=""
        onUsernameChange={() => {}}
        onPasswordChange={() => {}}
        onSubmit={(e) => e.preventDefault()}
      />
    </main>
  );
}
