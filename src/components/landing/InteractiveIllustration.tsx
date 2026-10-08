import { useState, type PointerEvent, type ReactNode } from "react";
import { useIllustrationRotation } from "./useIllustrationRotation";
import type { Rotation3D } from "./scene3d";
import "./InteractiveIllustration.css";

interface InteractiveIllustrationProps {
  label: string;
  className?: string;
  initialRotation: Rotation3D;
  shape?: "rectangle" | "circle";
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  returnOnRelease?: boolean;
  returnDuration?: number;
  children: (rotation: Rotation3D, reducedMotion: boolean) => ReactNode;
}

function isInsideCircle(event: PointerEvent<HTMLDivElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const radius = bounds.width / 2;
  const x = event.clientX - bounds.left - radius;
  const y = event.clientY - bounds.top - bounds.height / 2;
  return radius === 0 || x * x + y * y <= radius * radius;
}

export function InteractiveIllustration({
  label,
  className = "",
  initialRotation,
  shape = "rectangle",
  autoRotate = false,
  autoRotateSpeed,
  returnOnRelease = true,
  returnDuration,
  children,
}: InteractiveIllustrationProps) {
  const scene = useIllustrationRotation(initialRotation, {
    autoRotate,
    autoRotateSpeed,
    returnOnRelease,
    returnDuration,
  });
  const isCircle = shape === "circle";
  const [keyboardFocused, setKeyboardFocused] = useState(false);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (isCircle && !isInsideCircle(event)) return;
    scene.startDrag(event);
    setKeyboardFocused(false);
  }

  return (
    <div className={`interactive-illustration interactive-illustration--${shape} ${className}`}>
      <div
        className="interactive-illustration__viewport"
        role="group"
        aria-label={`Xoay ${label}`}
        tabIndex={0}
        data-dragging={scene.dragging}
        data-keyboard-focus={keyboardFocused}
        data-pitch={scene.rotation.pitch}
        data-yaw={scene.rotation.yaw}
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={scene.moveDrag}
        onPointerUp={scene.endDrag}
        onPointerCancel={scene.endDrag}
        onLostPointerCapture={scene.endDrag}
        onFocus={(event) => setKeyboardFocused(event.currentTarget.matches(":focus-visible"))}
        onBlur={() => setKeyboardFocused(false)}
        onKeyDown={(event) => {
          setKeyboardFocused(true);
          scene.handleKeyDown(event);
        }}
        onDoubleClick={scene.reset}
      >
        {children(scene.rotation, scene.reducedMotion)}
      </div>
    </div>
  );
}
