import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

vi.mock("@/features/views/components/views-page/views-page.tsx", () => ({
  ViewsPage: () => <div data-testid="views-page" />,
}));

vi.mock("@/features/views/components/view-detail/view-detail.tsx", () => ({
  ViewDetail: () => <div data-testid="view-detail" />,
}));

vi.mock("@/features/auth/LoginPage.tsx", () => ({
  LoginPage: () => <div data-testid="login-page" />,
}));

vi.mock("@/shared/components/spinner.tsx", () => ({ Spinner: () => null }));
vi.mock("@/shared/components/footer.tsx", () => ({ Footer: () => null }));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe("App routing", () => {
  it("renders ViewsPage at /", () => {
    renderAt("/");
    expect(screen.getByTestId("views-page")).toBeInTheDocument();
  });

  it("renders ViewDetail at /:viewId", () => {
    renderAt("/some-view-id");
    expect(screen.getByTestId("view-detail")).toBeInTheDocument();
  });

  it("renders LoginPage at /login", () => {
    renderAt("/login");
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("redirects unknown paths to /", () => {
    renderAt("/unknown/deep/path");
    expect(screen.getByTestId("views-page")).toBeInTheDocument();
  });
});
