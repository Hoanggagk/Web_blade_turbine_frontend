import type { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "../shared/context/UserContext";

/**
 * Centralises global providers so presentation layer stays UI focused.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <UserProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </UserProvider>
  );
}

