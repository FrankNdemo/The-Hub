import { useEffect } from "react";

import storyHeroImage from "@/assets/hero-calm-therapy.jpg";
import { pageHeaderBackgrounds } from "@/lib/pageBackground";

const preloadImage = (src: string) => {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
};

const NavigationImagePreloader = () => {
  useEffect(() => {
    const sources = [
      pageHeaderBackgrounds.about.src,
      pageHeaderBackgrounds.services.src,
      pageHeaderBackgrounds.team.src,
      pageHeaderBackgrounds.blog.src,
      storyHeroImage,
      pageHeaderBackgrounds.contact.src,
    ];

    const preload = () => sources.forEach(preloadImage);

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 2200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(preload, 900);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return null;
};

export default NavigationImagePreloader;
