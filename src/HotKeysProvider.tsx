import React, { useState, useEffect, useCallback } from "react";
import { HotKeysContext } from "./Scene";

const initialKeys = { w: false, a: false, s: false, d: false, space: false };

export const HotKeysProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [keys, setKeys] = useState(initialKeys);

  // Robust native event listeners
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    switch (e.key.toLowerCase()) {
      case "w": setKeys((k) => k.w ? k : { ...k, w: true }); break;
      case "a": setKeys((k) => k.a ? k : { ...k, a: true }); break;
      case "s": setKeys((k) => k.s ? k : { ...k, s: true }); break;
      case "d": setKeys((k) => k.d ? k : { ...k, d: true }); break;
      case " ":
      case "space": setKeys((k) => k.space ? k : { ...k, space: true }); break;
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case "w": setKeys((k) => k.w ? { ...k, w: false } : k); break;
      case "a": setKeys((k) => k.a ? { ...k, a: false } : k); break;
      case "s": setKeys((k) => k.s ? { ...k, s: false } : k); break;
      case "d": setKeys((k) => k.d ? { ...k, d: false } : k); break;
      case " ":
      case "space": setKeys((k) => k.space ? { ...k, space: false } : k); break;
    }
  }, []);

  // Reset all keys on window blur
  const handleBlur = useCallback(() => {
    setKeys(initialKeys);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [handleKeyDown, handleKeyUp, handleBlur]);

  return (
    <HotKeysContext.Provider value={{ keys, setKeys }}>
      {children}
    </HotKeysContext.Provider>
  );
};
