import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Input } from "./Input";

describe("Input", () => {
  test("renders without label", () => {
    const { UNSAFE_getByType } = render(
      <Input placeholder="Enter text" />
    );
    const { TextInput } = require("react-native");
    expect(UNSAFE_getByType(TextInput)).toBeTruthy();
  });

  test("renders with label", () => {
    const { getByText } = render(
      <Input label="Email" placeholder="Enter email" />
    );
    expect(getByText("Email")).toBeTruthy();
  });

  test("renders with error message", () => {
    const { getByText } = render(
      <Input error="This field is required" />
    );
    expect(getByText("This field is required")).toBeTruthy();
  });

  test("calls onChangeText when typing", () => {
    const onChangeText = jest.fn();
    const { UNSAFE_getByType } = render(
      <Input onChangeText={onChangeText} />
    );
    const { TextInput } = require("react-native");
    fireEvent.changeText(UNSAFE_getByType(TextInput), "hello");
    expect(onChangeText).toHaveBeenCalledWith("hello");
  });

  test("forwards value prop", () => {
    const { UNSAFE_getByType } = render(
      <Input value="test value" />
    );
    const { TextInput } = require("react-native");
    const input = UNSAFE_getByType(TextInput);
    expect(input.props.value).toBe("test value");
  });

  test("applies placeholder text", () => {
    const { UNSAFE_getByType } = render(
      <Input placeholder="Type here..." />
    );
    const { TextInput } = require("react-native");
    const input = UNSAFE_getByType(TextInput);
    expect(input.props.placeholder).toBe("Type here...");
  });
});
