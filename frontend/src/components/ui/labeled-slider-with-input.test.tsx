import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LabeledSliderWithInput } from "./labeled-slider-with-input";

describe("LabeledSliderWithInput", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("cancels pending debounced changes on unmount", () => {
    vi.useFakeTimers();
    const onValueChange = vi.fn();
    const { unmount } = render(
      <LabeledSliderWithInput
        label="Min"
        value={2}
        onValueChange={onValueChange}
        min={0}
        max={100}
      />,
    );

    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "5" } });
    unmount();
    vi.advanceTimersByTime(50);

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
