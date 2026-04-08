import type { CSSProperties } from "react";

import pageBackgroundImage from "@/assets/about-approach-bg.jpg";

export const softPageBackgroundStyle: CSSProperties = {
  backgroundImage: `linear-gradient(180deg, hsl(42 31% 97% / 0.92), hsl(42 31% 97% / 0.9)), url(${pageBackgroundImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

export interface PageHeaderBackground {
  src: string;
  position: CSSProperties["objectPosition"];
}

// Remote hero imagery keeps the top of each linked page calm, clear, and topic-specific.
export const pageHeaderBackgrounds: Record<"about" | "services" | "team" | "blog" | "contact", PageHeaderBackground> = {
  about: {
    src: "https://images.pexels.com/photos/7699530/pexels-photo-7699530.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop",
    position: "center 38%",
  },
  services: {
    src: "https://images.pexels.com/photos/3958375/pexels-photo-3958375.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop",
    position: "center 26%",
  },
  team: {
    src: "https://images.pexels.com/photos/3958398/pexels-photo-3958398.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop",
    position: "center 28%",
  },
  blog: {
    src: "https://images.pexels.com/photos/4467633/pexels-photo-4467633.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop",
    position: "center 52%",
  },
  contact: {
    src: "https://images.pexels.com/photos/3782317/pexels-photo-3782317.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop",
    position: "center 48%",
  },
};
