import leafDecor from "@/assets/leaf-decoration.png";
import { cn } from "@/lib/utils";

interface LeafBannerHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  titleTag?: "h1" | "h2" | "h3";
  align?: "left" | "center";
  className?: string;
  innerClassName?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

const LeafBannerHeading = ({
  eyebrow,
  title,
  description,
  titleTag = "h2",
  align = "left",
  className,
  innerClassName,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
}: LeafBannerHeadingProps) => {
  const TitleTag = titleTag;
  const isCentered = align === "center";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-none bg-[linear-gradient(135deg,rgba(7,31,21,0.98),rgba(10,48,33,0.95))] shadow-[0_24px_42px_-28px_rgba(5,18,12,0.72)]",
        className,
      )}
    >
      <img
        src={leafDecor}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-[150%] w-auto rotate-[8deg] opacity-[0.1] mix-blend-screen"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(146,192,161,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />

      <div
        className={cn(
          "relative z-10 flex flex-col gap-3 px-5 py-5 sm:px-6 sm:py-6",
          isCentered ? "items-center text-center" : "items-start text-left",
          innerClassName,
        )}
      >
        {eyebrow ? (
          <p
            className={cn(
              "text-sm font-semibold uppercase tracking-[0.24em] text-white",
              eyebrowClassName,
            )}
          >
            {eyebrow}
          </p>
        ) : null}

        <TitleTag
          className={cn(
            "font-heading font-semibold leading-tight text-white",
            titleClassName,
          )}
        >
          {title}
        </TitleTag>

        {description ? (
          <p
            className={cn(
              "max-w-2xl text-sm leading-7 text-white sm:text-base sm:leading-8",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default LeafBannerHeading;
