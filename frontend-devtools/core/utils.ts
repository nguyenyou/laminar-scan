import { DRAG_CONFIG } from "./config";
import type { PanelPosition, Position } from "../ui/dt-panel";

export function calculatePositionForCorner(
  corner: PanelPosition,
  width: number,
  height: number
): Position {
  const safeArea = DRAG_CONFIG.dimensions.safeArea;
  const rightX = window.innerWidth - width - safeArea;
  const bottomY = window.innerHeight - height - safeArea;

  switch (corner) {
    case "top-left":
      return { x: safeArea, y: safeArea };
    case "top-right":
      return { x: rightX, y: safeArea };
    case "bottom-left":
      return { x: safeArea, y: bottomY };
    case "bottom-right":
    default:
      return { x: rightX, y: bottomY };
  }
}
