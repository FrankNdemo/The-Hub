import { Link } from "react-router-dom";

interface WellnessLogoProps {
  variant?: "navbar" | "hero" | "footer";
}

const WellnessLogo = ({ variant = "navbar" }: WellnessLogoProps) => {
  const sizes = {
    navbar: {
      wrapper: "pt-3 pb-2 pr-12",
      top: "right-8 top-0 text-[11px] tracking-[0.35em]",
      center: "text-[2.4rem] leading-none",
      bottom: "right-0 bottom-0 text-[0.9rem] tracking-[0.28em]",
    },
    hero: {
      wrapper: "pt-1 pb-2 pr-11 md:pt-3 md:pb-3 md:pr-12",
      top: "right-8 top-0 text-[0.54rem] tracking-[0.4em] md:right-9 md:text-[0.56rem]",
      center: "text-[3.15rem] leading-[0.8] md:text-[3.2rem] lg:text-[3.75rem]",
      bottom: "right-0 bottom-[0.24rem] text-[0.84rem] tracking-[0.32em] md:text-[0.92rem]",
    },
    footer: {
      wrapper: "pt-4 pb-3 pr-14",
      top: "right-10 top-0 text-[11px] tracking-[0.35em]",
      center: "text-[2.8rem] leading-none",
      bottom: "right-0 bottom-0 text-[0.98rem] tracking-[0.32em]",
    },
  }[variant];

  const content = (
    <div className={`relative inline-block select-none ${sizes.wrapper}`}>
      <span className={`absolute font-body font-medium uppercase text-primary/90 ${sizes.top}`}>
        The
      </span>
      <span className={`brand-script block text-primary ${sizes.center}`}>
        Wellness
      </span>
      <span className={`absolute font-body font-semibold uppercase text-primary/95 ${sizes.bottom}`}>
        Hub
      </span>
    </div>
  );

  if (variant === "hero" || variant === "footer") {
    return content;
  }

  return (
    <Link to="/" className="flex items-center" aria-label="The Wellness Hub home">
      {content}
    </Link>
  );
};

export default WellnessLogo;
