import { useEffect, useState } from "react";

const DESKTOP_EFFECTS_QUERY = "(min-width: 768px)";

export const useDesktopImageEffects = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_EFFECTS_QUERY);
    const updateEnabled = () => setEnabled(mediaQuery.matches);

    updateEnabled();
    mediaQuery.addEventListener("change", updateEnabled);

    return () => mediaQuery.removeEventListener("change", updateEnabled);
  }, []);

  return enabled;
};
