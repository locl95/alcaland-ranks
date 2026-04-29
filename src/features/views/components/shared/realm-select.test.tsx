import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RealmSelect } from "./realm-select.tsx";

describe("RealmSelect", () => {
  it("renders EU and NA region options", () => {
    render(
      <RealmSelect region="eu" realm="" onRegionChange={vi.fn()} onRealmChange={vi.fn()} />,
    );
    expect(screen.getByRole("option", { name: "EU" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "NA" })).toBeInTheDocument();
  });

  it("calls onRegionChange with the new region value", async () => {
    const onRegionChange = vi.fn();
    render(
      <RealmSelect
        region="eu"
        realm=""
        onRegionChange={onRegionChange}
        onRealmChange={vi.fn()}
      />,
    );
    const [regionSelect] = screen.getAllByRole("combobox");
    await userEvent.selectOptions(regionSelect, "us");
    expect(onRegionChange).toHaveBeenCalledWith("us");
  });

  it("calls onRealmChange with empty string when region changes", async () => {
    const onRealmChange = vi.fn();
    render(
      <RealmSelect
        region="eu"
        realm="tarren-mill"
        onRegionChange={vi.fn()}
        onRealmChange={onRealmChange}
      />,
    );
    const [regionSelect] = screen.getAllByRole("combobox");
    await userEvent.selectOptions(regionSelect, "us");
    expect(onRealmChange).toHaveBeenCalledWith("");
  });

  it("calls onRealmChange when a realm is selected", async () => {
    const onRealmChange = vi.fn();
    render(
      <RealmSelect
        region="eu"
        realm=""
        onRegionChange={vi.fn()}
        onRealmChange={onRealmChange}
      />,
    );
    const [, realmSelect] = screen.getAllByRole("combobox");
    await userEvent.selectOptions(realmSelect, "tarren-mill");
    expect(onRealmChange).toHaveBeenCalledWith("tarren-mill");
  });

  it("shows NA realms when region is us", () => {
    render(
      <RealmSelect region="us" realm="" onRegionChange={vi.fn()} onRealmChange={vi.fn()} />,
    );
    expect(screen.getByRole("option", { name: "Aegwynn" })).toBeInTheDocument();
  });
});
