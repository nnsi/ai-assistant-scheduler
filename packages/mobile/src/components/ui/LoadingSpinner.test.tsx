import React from "react";
import { render } from "@testing-library/react-native";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  test("renders ActivityIndicator", () => {
    const { UNSAFE_getByType } = render(<LoadingSpinner />);
    const { ActivityIndicator } = require("react-native");
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  test("renders with custom message", () => {
    const { getByText } = render(
      <LoadingSpinner message="Loading data..." />
    );
    expect(getByText("Loading data...")).toBeTruthy();
  });

  test("renders without message by default", () => {
    const { queryByText } = render(<LoadingSpinner />);
    // No message text should be present
    expect(queryByText(/loading/i)).toBeNull();
  });

  test("applies large size by default", () => {
    const { UNSAFE_getByType } = render(<LoadingSpinner />);
    const { ActivityIndicator } = require("react-native");
    const indicator = UNSAFE_getByType(ActivityIndicator);
    expect(indicator.props.size).toBe("large");
  });

  test("applies small size when specified", () => {
    const { UNSAFE_getByType } = render(<LoadingSpinner size="small" />);
    const { ActivityIndicator } = require("react-native");
    const indicator = UNSAFE_getByType(ActivityIndicator);
    expect(indicator.props.size).toBe("small");
  });

  test("applies custom color", () => {
    const { UNSAFE_getByType } = render(<LoadingSpinner color="#ff0000" />);
    const { ActivityIndicator } = require("react-native");
    const indicator = UNSAFE_getByType(ActivityIndicator);
    expect(indicator.props.color).toBe("#ff0000");
  });

  test("renders in fullScreen mode", () => {
    const { UNSAFE_getAllByType } = render(<LoadingSpinner fullScreen />);
    const { View } = require("react-native");
    // Should have View wrapper
    const views = UNSAFE_getAllByType(View);
    expect(views.length).toBeGreaterThan(0);
  });
});
