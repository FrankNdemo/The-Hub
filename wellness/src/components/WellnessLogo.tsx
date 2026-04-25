import { Link } from "react-router-dom";

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
    frame: "h-[6.1rem] w-[15.75rem] sm:h-[6.9rem] sm:w-[18.4rem] md:h-[8rem] md:w-[21.8rem] lg:h-[9.35rem] lg:w-[25.8rem]",
  },
  footer: {
    frame: "h-[4.55rem] w-[12.7rem]",
  },
};

const WellnessLogo = ({ variant = "navbar", tone = "default" }: WellnessLogoProps) => {
  const layout = layouts[variant];
  const svgToneClass = tone === "inverse" ? "text-white" : "text-primary";

  const content = (
    <div className={`inline-block select-none ${layout.frame}`}>
      <svg
        viewBox="0 0 690 320"
        className={`block h-full w-full overflow-visible transition-colors duration-300 ease-out ${svgToneClass}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M58 85
             C42 130 40 200 58 244
             C68 268 87 277 101 260
             C120 236 121 169 131 112
             C134 96 144 93 148 106
             C159 141 155 190 151 245
             C149 271 175 279 189 259
             C214 223 235 141 259 55
             L238 53
             C219 123 203 188 186 228
             C190 182 190 137 184 109
             C177 77 149 70 137 92
             C123 116 123 190 110 233
             C107 243 99 245 93 237
             C79 216 78 157 89 83
             Z"
          fill="currentColor"
          opacity="0.94"
        />

        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.94"
        >
          <path d="M166 246 C197 174 227 106 262 35" strokeWidth="8.4" />
          <path d="M183 246 C217 176 246 108 282 42 C291 26 300 17 313 18" strokeWidth="4.4" opacity="0.95" />
          <path d="M176 238 C169 198 171 154 191 109" strokeWidth="3.4" opacity="0.9" />
        </g>

        <text
          x="334"
          y="72"
          fill="currentColor"
          opacity="0.94"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "44px",
            fontWeight: 450,
            letterSpacing: "0.18em",
          }}
        >
          THE
        </text>

        <g transform="translate(228 0) skewX(-8)" opacity="0.95">
          <text
            x="26"
            y="210"
            fill="currentColor"
            style={{
              fontFamily: "var(--font-logo)",
              fontSize: "148px",
              letterSpacing: "-0.03em",
            }}
          >
            ELLNESS
          </text>

          <text
            x="336"
            y="308"
            fill="currentColor"
            style={{
              fontFamily: "var(--font-logo)",
              fontSize: "96px",
              letterSpacing: "-0.01em",
            }}
          >
            HUB
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
