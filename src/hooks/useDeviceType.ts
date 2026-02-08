import { useState, useEffect } from "react";

export type ScreenClass = "mobile" | "tablet" | "desktop";
export type PointerType = "coarse" | "fine";
export type Orientation = "portrait" | "landscape";

export interface DeviceInfo {
  screen: ScreenClass;
  pointer: PointerType;
  orientation: Orientation;
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

function getScreenClass(width: number): ScreenClass {
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getPointerType(): PointerType {
  if (typeof window === "undefined") return "fine";
  return window.matchMedia("(pointer: coarse)").matches ? "coarse" : "fine";
}

function getOrientation(): Orientation {
  if (typeof window === "undefined") return "portrait";
  return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}

export function useDeviceType(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(() => {
    const screen = getScreenClass(typeof window !== "undefined" ? window.innerWidth : 1024);
    const pointer = getPointerType();
    const orientation = getOrientation();
    return {
      screen,
      pointer,
      orientation,
      isTouch: pointer === "coarse",
      isMobile: screen === "mobile",
      isTablet: screen === "tablet",
      isDesktop: screen === "desktop",
    };
  });

  useEffect(() => {
    const update = () => {
      const screen = getScreenClass(window.innerWidth);
      const pointer = getPointerType();
      const orientation = getOrientation();
      setInfo({
        screen,
        pointer,
        orientation,
        isTouch: pointer === "coarse",
        isMobile: screen === "mobile",
        isTablet: screen === "tablet",
        isDesktop: screen === "desktop",
      });
    };

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    const pointerMq = window.matchMedia("(pointer: coarse)");
    pointerMq.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      pointerMq.removeEventListener("change", update);
    };
  }, []);

  return info;
}
