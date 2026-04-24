import { Link } from "react-router-dom";

interface WellnessLogoProps {
  variant?: "navbar" | "hero" | "footer";
  tone?: "default" | "inverse";
}

type LogoLayout = {
  frame: string;
  viewBox: string;
  word: {
    x: number;
    y: number;
    size: number;
    rotate: number;
  };
  the: {
    x: number;
    y: number;
    size: number;
    spacing: number;
  };
  hub: {
    x: number;
    y: number;
    size: number;
    rotate: number;
  };
};

const layouts: Record<NonNullable<WellnessLogoProps["variant"]>, LogoLayout> = {
  navbar: {
    frame: "h-[3.45rem] w-[9.4rem]",
    viewBox: "0 -6 180 82",
    word: { x: 4, y: 49, size: 47, rotate: -7 },
    the: { x: 47, y: 7, size: 10.2, spacing: 0.08 },
    hub: { x: 129, y: 57, size: 19.5, rotate: -5 },
  },
  hero: {
    frame: "h-[4.9rem] w-[13rem] sm:h-[5.1rem] sm:w-[13.5rem] lg:h-[5.9rem] lg:w-[15.2rem]",
    viewBox: "0 0 180 72",
    word: { x: 4, y: 47, size: 50, rotate: -7 },
    the: { x: 42, y: 2, size: 9.5, spacing: 0.14 },
    hub: { x: 132, y: 59, size: 23, rotate: -5 },
  },
  footer: {
    frame: "h-[4.2rem] w-[11.3rem]",
    viewBox: "0 0 180 72",
    word: { x: 4, y: 47, size: 50, rotate: -7 },
    the: { x: 42, y: 2, size: 9.5, spacing: 0.14 },
    hub: { x: 132, y: 59, size: 23, rotate: -5 },
  },
};

const WellnessLogo = ({ variant = "navbar", tone = "default" }: WellnessLogoProps) => {
  const layout = layouts[variant];
  const svgToneClass = tone === "inverse" ? "text-white" : "text-primary";

  const content = (
    <div className={`inline-block select-none ${layout.frame}`}>
      <svg
        viewBox={layout.viewBox}
        className={`block h-full w-full overflow-visible transition-colors duration-300 ease-out ${svgToneClass}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g transform={`translate(${layout.word.x} ${layout.word.y}) rotate(${layout.word.rotate})`}>
          <text
            x="0"
            y="0"
            fill="currentColor"
            style={{
              fontFamily: "var(--font-logo)",
              fontSize: `${layout.word.size}px`,
              letterSpacing: "-0.03em",
            }}
          >
            Wellness
          </text>
        </g>

        <text
          x={layout.the.x}
          y={layout.the.y}
          fill="currentColor"
          opacity="0.94"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: `${layout.the.size}px`,
            fontWeight: 600,
            letterSpacing: `${layout.the.spacing}em`,
          }}
        >
          THE
        </text>

        <g transform={`translate(${layout.hub.x} ${layout.hub.y}) rotate(${layout.hub.rotate})`}>
          <text
            x="0"
            y="0"
            fill="currentColor"
            opacity="0.95"
            style={{
              fontFamily: "var(--font-logo)",
              fontSize: `${layout.hub.size}px`,
              letterSpacing: "-0.02em",
            }}
          >
            Hub
          </text>
        </g>
      </svg>
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
