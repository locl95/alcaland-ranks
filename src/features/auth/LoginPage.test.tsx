import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer from "@/app/authSlice.ts";
import { LoginPage } from "./LoginPage.tsx";
import { ApiError } from "@/shared/api/ApiError.ts";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
}));

const navMock = vi.hoisted(() => ({
  navigate: vi.fn(),
  from: "/",
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navMock.navigate,
  useLocation: () => ({ state: { from: navMock.from }, pathname: "/login" }),
}));

vi.mock("@/features/auth/authApi", () => ({
  login: (...args: unknown[]) => authMocks.login(...args),
}));

vi.mock("@/shared/components/spinner", () => ({
  Spinner: () => null,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { accessToken: null, refreshToken: null, username: null },
    },
  });

const renderPage = () => {
  const store = makeStore();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    </Provider>,
  );
  return { store };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.login.mockResolvedValue({
      accessToken: "acc",
      refreshToken: "ref",
    });
    navMock.from = "/";
  });

  it("renders username and password inputs", () => {
    renderPage();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("disables submit when fields are empty", () => {
    renderPage();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });

  it("enables submit when both fields are filled", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText("Username"), "xavier");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    expect(screen.getByRole("button", { name: "Sign in" })).not.toBeDisabled();
  });

  it("calls login with username and password on submit", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText("Username"), "xavier");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(authMocks.login).toHaveBeenCalledWith("xavier", "secret");
  });

  it("dispatches setTokens and navigates on success", async () => {
    const { store } = renderPage();
    await userEvent.type(screen.getByLabelText("Username"), "xavier");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(navMock.navigate).toHaveBeenCalledWith("/", { replace: true }),
    );
    expect(store.getState().auth.accessToken).toBe("acc");
  });

  it("shows invalid credentials error on 401", async () => {
    authMocks.login.mockRejectedValue(new ApiError(401, "Unauthorized"));
    renderPage();
    await userEvent.type(screen.getByLabelText("Username"), "bad");
    await userEvent.type(screen.getByLabelText("Password"), "creds");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(
        screen.getByText("Invalid username or password."),
      ).toBeInTheDocument(),
    );
    expect(navMock.navigate).not.toHaveBeenCalled();
  });

  it("shows server error message on non-401 failure", async () => {
    authMocks.login.mockRejectedValue(new Error("Network error"));
    renderPage();
    await userEvent.type(screen.getByLabelText("Username"), "xavier");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(
        screen.getByText("Unable to connect to the server. Try again later."),
      ).toBeInTheDocument(),
    );
  });

  it("navigates to the 'from' location after login", async () => {
    navMock.from = "/my-ladder";
    renderPage();
    await userEvent.type(screen.getByLabelText("Username"), "xavier");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(navMock.navigate).toHaveBeenCalledWith("/my-ladder", {
        replace: true,
      }),
    );
  });
});
