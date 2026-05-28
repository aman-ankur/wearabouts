import type { StylistChip } from "./stylistTypes";

const COLLAPSED_CHIP_CONTROL_LIMIT = 9;

export function getVisibleStylistChips(chips: StylistChip[], chipsExpanded: boolean) {
  if (chipsExpanded) {
    return {
      chips,
      hiddenChipCount: 0,
      totalVisibleControls: chips.length + (chips.length > COLLAPSED_CHIP_CONTROL_LIMIT ? 1 : 0),
    };
  }

  const hasHiddenChips = chips.length > COLLAPSED_CHIP_CONTROL_LIMIT;
  const visibleLimit = hasHiddenChips ? COLLAPSED_CHIP_CONTROL_LIMIT - 1 : COLLAPSED_CHIP_CONTROL_LIMIT;
  const visibleChips = chips.slice(0, visibleLimit);

  return {
    chips: visibleChips,
    hiddenChipCount: Math.max(chips.length - visibleChips.length, 0),
    totalVisibleControls: visibleChips.length + (hasHiddenChips ? 1 : 0),
  };
}
