import { fireEvent, render } from "@testing-library/react-native";
import { ErrorMessage } from "./ErrorMessage";

// Mock @expo/vector-icons
jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

describe("ErrorMessage", () => {
  test("renders error message text", () => {
    const { getByText } = render(<ErrorMessage message="Something went wrong" />);
    expect(getByText("Something went wrong")).toBeTruthy();
  });

  test("renders retry button when onRetry provided", () => {
    const { getByText } = render(<ErrorMessage message="Error" onRetry={() => {}} />);
    expect(getByText("再試行")).toBeTruthy();
  });

  test("does not render retry button when onRetry not provided", () => {
    const { queryByText } = render(<ErrorMessage message="Error" />);
    expect(queryByText("再試行")).toBeNull();
  });

  test("calls onRetry when retry button pressed", () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorMessage message="Error" onRetry={onRetry} />);
    fireEvent.press(getByText("再試行"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("renders in fullScreen mode", () => {
    const { UNSAFE_getAllByType } = render(<ErrorMessage message="Error" fullScreen />);
    const { View } = require("react-native");
    const views = UNSAFE_getAllByType(View);
    expect(views.length).toBeGreaterThan(0);
  });

  test("renders in non-fullScreen mode by default", () => {
    const { UNSAFE_getAllByType } = render(<ErrorMessage message="Error" />);
    const { View } = require("react-native");
    const views = UNSAFE_getAllByType(View);
    expect(views.length).toBeGreaterThan(0);
  });
});
