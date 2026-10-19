import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { Rotation3D } from "./scene3d";

export interface IllustrationRotationOptions {
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  returnOnRelease?: boolean;
  returnDuration?: number;
}

interface DragState {
  pointerId: number;
  x: number;
  y: number;
  timestamp: number;
}

const MAX_PITCH = Math.PI * 0.44;
const KEY_STEP = Math.PI / 18;
const MIN_DRAG_WIDTH = 300;
const RELEASE_IDLE_TIME = 80;
const INERTIA_DECAY_TIME = 110;
const MIN_VELOCITY = 0.00008;
const DEFAULT_AUTO_ROTATE_SPEED = 0.18;
const DEFAULT_RETURN_DURATION = 650;
const KEY_ROTATIONS: Record<string, Rotation3D> = {
  ArrowUp: { pitch: -KEY_STEP, yaw: 0 },
  ArrowDown: { pitch: KEY_STEP, yaw: 0 },
  ArrowLeft: { pitch: 0, yaw: -KEY_STEP },
  ArrowRight: { pitch: 0, yaw: KEY_STEP },
};

function normalizeAngle(angle: number): number {
  const fullTurn = 2 * Math.PI;
  return ((angle + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI;
}

function shortestAngleDiff(target: number, current: number): number {
  return normalizeAngle(target - current);
}

function addRotation(rotation: Rotation3D, delta: Rotation3D): Rotation3D {
  const yaw = rotation.yaw + delta.yaw;
  const fullTurn = 2 * Math.PI;
  return {
    pitch: Math.max(-MAX_PITCH, Math.min(MAX_PITCH, rotation.pitch + delta.pitch)),
    yaw: ((yaw + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI,
  };
}

/** Shared mouse, touch and keyboard controls; scene components only draw geometry. */
export function useIllustrationRotation(
  initialRotation: Rotation3D,
  options: IllustrationRotationOptions = {},
) {
  const {
    autoRotate = false,
    autoRotateSpeed = DEFAULT_AUTO_ROTATE_SPEED,
    returnOnRelease = true,
    returnDuration = DEFAULT_RETURN_DURATION,
  } = options;

  const [rotation, setRotation] = useState(initialRotation);
  const [dragging, setDragging] = useState(false);
  const reducedMotion = useReducedMotion();
  const rotationRef = useRef(initialRotation);
  const dragRef = useRef<DragState | null>(null);
  const returningRef = useRef(false);
  const velocityRef = useRef({ pitch: 0, yaw: 0 });
  const frameRef = useRef(0);

  function stopMotion() {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
  }

  function startAutoRotate() {
    stopMotion();
    returningRef.current = false;
    let previousTime = performance.now();

    function step(now: number) {
      const elapsed = Math.max(0, Math.min(64, now - previousTime));
      previousTime = now;
      if (elapsed > 0) {
        const deltaYaw = (elapsed / 1000) * autoRotateSpeed;
        rotationRef.current = addRotation(rotationRef.current, {
          pitch: 0,
          yaw: deltaYaw,
        });
        setRotation(rotationRef.current);
      }
      frameRef.current = requestAnimationFrame(step);
    }

    frameRef.current = requestAnimationFrame(step);
  }

  function startReturn() {
    stopMotion();
    returningRef.current = true;
    const startTime = performance.now();
    const startRotation = { ...rotationRef.current };
    const target = initialRotation;
    const deltaPitch = target.pitch - startRotation.pitch;
    const deltaYaw = shortestAngleDiff(target.yaw, startRotation.yaw);

    if (Math.abs(deltaPitch) < 0.001 && Math.abs(deltaYaw) < 0.001) {
      returningRef.current = false;
      rotationRef.current = { ...target };
      setRotation(rotationRef.current);
      if (autoRotate && !reducedMotion) {
        startAutoRotate();
      }
      return;
    }

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / returnDuration);
      const ease = 1 - Math.pow(1 - progress, 3);

      rotationRef.current = {
        pitch: startRotation.pitch + deltaPitch * ease,
        yaw: normalizeAngle(startRotation.yaw + deltaYaw * ease),
      };
      setRotation(rotationRef.current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        returningRef.current = false;
        rotationRef.current = { ...target };
        setRotation(rotationRef.current);
        if (autoRotate && !reducedMotion) {
          startAutoRotate();
        }
      }
    }

    frameRef.current = requestAnimationFrame(step);
  }

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  useEffect(() => {
    if (reducedMotion) {
      stopMotion();
      returningRef.current = false;
      rotationRef.current = { ...initialRotation };
      setRotation(rotationRef.current);
      return;
    }
    if (autoRotate && !dragRef.current && !returningRef.current) {
      startAutoRotate();
    }
    return () => stopMotion();
  }, [autoRotate, reducedMotion, initialRotation.pitch, initialRotation.yaw, autoRotateSpeed]);

  function publishRotation() {
    // Pointer events may arrive faster than the display; render at most once per frame.
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      setRotation(rotationRef.current);
    });
  }

  function rotateBy(delta: Rotation3D) {
    rotationRef.current = addRotation(rotationRef.current, delta);
    publishRotation();
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary || dragRef.current) return;
    stopMotion();
    returningRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      timestamp: event.timeStamp,
    };
    velocityRef.current = { pitch: 0, yaw: 0 };
    setDragging(true);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const sensitivity = (2 * Math.PI) / Math.max(MIN_DRAG_WIDTH, event.currentTarget.clientWidth);
    const delta = {
      pitch: (event.clientY - drag.y) * sensitivity,
      yaw: (event.clientX - drag.x) * sensitivity,
    };
    const elapsed = Math.max(16, event.timeStamp - drag.timestamp);
    velocityRef.current = { pitch: delta.pitch / elapsed, yaw: delta.yaw / elapsed };
    dragRef.current = {
      pointerId: drag.pointerId,
      x: event.clientX,
      y: event.clientY,
      timestamp: event.timeStamp,
    };
    rotateBy(delta);
  }

  function startInertia() {
    let previousTime = performance.now();
    function glide(now: number) {
      const elapsed = Math.max(0, Math.min(32, now - previousTime));
      previousTime = now;
      const velocity = velocityRef.current;
      const damping = Math.exp(-elapsed / INERTIA_DECAY_TIME);
      velocity.pitch *= damping;
      velocity.yaw *= damping;
      rotationRef.current = addRotation(rotationRef.current, {
        pitch: velocity.pitch * elapsed,
        yaw: velocity.yaw * elapsed,
      });
      setRotation(rotationRef.current);
      frameRef.current =
        Math.abs(velocity.pitch) + Math.abs(velocity.yaw) > MIN_VELOCITY
          ? requestAnimationFrame(glide)
          : 0;
    }
    frameRef.current = requestAnimationFrame(glide);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    stopMotion();
    setRotation(rotationRef.current);

    if (returnOnRelease && !reducedMotion) {
      startReturn();
    } else {
      const releasedRecently = event.timeStamp - drag.timestamp <= RELEASE_IDLE_TIME;
      if (event.type === "pointerup" && !reducedMotion && releasedRecently) {
        startInertia();
      } else if (autoRotate && !reducedMotion) {
        startAutoRotate();
      }
    }
  }

  function reset() {
    stopMotion();
    returningRef.current = false;
    rotationRef.current = { ...initialRotation };
    velocityRef.current = { pitch: 0, yaw: 0 };
    setRotation(rotationRef.current);
    if (autoRotate && !reducedMotion) {
      startAutoRotate();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const delta = Object.hasOwn(KEY_ROTATIONS, event.key) ? KEY_ROTATIONS[event.key] : undefined;
    if (event.key !== "Home" && !delta) return;
    event.preventDefault();
    stopMotion();
    returningRef.current = false;
    if (event.key === "Home") {
      reset();
      return;
    }
    rotateBy(delta!);
  }

  return { rotation, dragging, reducedMotion, startDrag, moveDrag, endDrag, reset, handleKeyDown };
}
