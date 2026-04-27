import { Link } from "react-router-dom";

import logoImage from "@/assets/the-hub-logo.png";

interface WellnessLogoProps {
  variant?: "navbar" | "hero" | "footer";
  tone?: "default" | "inverse";
}

type LogoLayout = {
  frame: string;
};

const layouts: Record<NonNullable<WellnessLogoProps["variant"]>, LogoLayout> = {
  navbar: {
    frame: "h-[3.65rem] w-[10.25rem]",
  },
  hero: {
    frame: "h-[4.75rem] w-[12.15rem] sm:h-[6.2rem] sm:w-[16.2rem] md:h-[8rem] md:w-[21.8rem] lg:h-[9.35rem] lg:w-[25.8rem]",
  },
  footer: {
    frame: "h-[4.55rem] w-[12.7rem]",
  },
};

const WellnessLogo = ({ variant = "navbar", tone = "default" }: WellnessLogoProps) => {
  const layout = layouts[variant];
  const imageToneClass =
    variant === "navbar"
      ? tone === "inverse"
        ? "brightness-[1.4] saturate-[0.94] contrast-[1.06] drop-shadow-[0_0_24px_rgba(248,244,236,0.34)]"
        : "brightness-[1.16] saturate-[1.02] drop-shadow-[0_0_20px_rgba(248,244,236,0.24)]"
      : tone === "inverse"
        ? "brightness-[1.18] saturate-[1.02] drop-shadow-[0_0_22px_rgba(248,244,236,0.24)]"
        : "drop-shadow-[0_14px_28px_rgba(35,72,61,0.16)]";
  const isNavbar = variant === "navbar";
  const showHeroMobileTheAccent = variant === "hero";

  const content = (
    <div className={`relative inline-flex select-none items-center ${layout.frame}`}>
      <img
        src={logoImage}
        alt={isNavbar ? "" : "The Wellness Hub"}
        aria-hidden={isNavbar ? "true" : undefined}
        className={`block h-full w-full object-contain object-left transition-[filter] duration-300 ease-out ${imageToneClass}`}
      />
      {showHeroMobileTheAccent ? (
        <span className="pointer-events-none absolute left-[4.55rem] top-[0.28rem] font-heading text-[1.02rem] tracking-[0.18em] text-primary/85 [text-shadow:0_4px_10px_rgba(255,255,255,0.55)] sm:hidden">
          THE
        </span>
      ) : null}
    </div>
  );

  if (variant === "hero" || variant === "footer") {
    return content;
  }

  return (
    <Link to="/" className="flex items-center transition-colors duration-300 ease-out" aria-label="The Wellness Hub home">
      {content}
    </Link>
  );
};

export default WellnessLogo;
