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
  className?: string;
}

// Remote hero imagery keeps the top of each linked page calm, clear, and topic-specific.
export const pageHeaderBackgrounds: Record<"about" | "services" | "team" | "blog" | "contact", PageHeaderBackground> = {
  about: {
    src: "https://images.pexels.com/photos/30690397/pexels-photo-30690397.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop",
    position: "center 38%",
    className: "object-[center_34%] sm:object-[center_38%]",
  },
  services: {
    src: "https://images.pexels.com/photos/8550659/pexels-photo-8550659.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop",
    position: "center 40%",
    className: "object-[center_46%] brightness-[0.66] saturate-[0.94] sm:object-[center_50%] lg:object-[center_54%]",
  },
  team: {
    src: "https://images.pexels.com/photos/9852957/pexels-photo-9852957.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop",
    position: "center 36%",
    className: "object-[54%_58%] brightness-[1.02] contrast-[1.04] saturate-[1.03] sm:object-[56%_54%] lg:object-[58%_48%]",
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
