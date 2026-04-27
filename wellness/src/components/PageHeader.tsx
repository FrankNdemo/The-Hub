import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  detailLabel: string;
  detailItems: string[];
  children?: ReactNode;
  backgroundImage?: string;
  backgroundPosition?: CSSProperties["objectPosition"];
  backgroundImageClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
}

const PageHeader = ({
  eyebrow,
  title,
  description,
  children,
  backgroundImage,
  backgroundPosition = "center",
  backgroundImageClassName,
  descriptionClassName,
  contentClassName,
}: PageHeaderProps) => {
  const hasBackgroundImage = Boolean(backgroundImage);

  return (
    <section className="overflow-x-clip pb-10 pt-0 sm:pb-16" data-nav-theme={hasBackgroundImage ? "inverse" : undefined}>
      <div className="w-full px-0">
        <div
          className={cn(
            "relative overflow-hidden border border-border/60 px-4 pb-8 pt-24 shadow-card sm:px-8 sm:pb-10 sm:pt-32 lg:px-10 lg:pb-12 lg:pt-36",
            hasBackgroundImage ? "min-h-[22rem] sm:min-h-[27rem] lg:min-h-[31rem]" : "",
            hasBackgroundImage ? "rounded-none" : "rounded-none",
            hasBackgroundImage
              ? "bg-[hsl(150_19%_18%)] text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_label]:text-white [&_p]:text-white [&_span]:text-white/90 [&_svg]:text-white/80"
              : "wellness-section-surface",
          )}
        >
          {hasBackgroundImage ? (
            <>
              <img
                src={backgroundImage}
                alt=""
                aria-hidden="true"
                className={cn("absolute inset-0 h-full w-full object-cover", backgroundImageClassName)}
                style={backgroundImageClassName ? undefined : { objectPosition: backgroundPosition }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,29,25,0.62),rgba(17,29,25,0.38),rgba(17,29,25,0.72))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(190_18%_78%_/_0.16),transparent_34%),radial-gradient(circle_at_bottom_left,hsl(145_23%_28%_/_0.32),transparent_32%)]" />
            </>
          ) : null}

          <div className={cn("mx-auto max-w-4xl text-center", hasBackgroundImage && "relative z-10 text-white", contentClassName)}>
            {eyebrow ? (
              <p className={cn("text-[0.76rem] font-semibold uppercase tracking-[0.3em]", hasBackgroundImage ? "text-white/90" : "text-primary/70")}>
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={cn(
                "mx-auto max-w-5xl font-heading text-[1.95rem] font-semibold leading-[0.94] sm:text-4xl md:text-[3.35rem] lg:text-[4rem]",
                eyebrow ? "mt-2 sm:mt-4" : "mt-1 sm:mt-2",
                hasBackgroundImage ? "text-white [text-shadow:0_10px_30px_rgba(0,0,0,0.28)]" : "text-foreground",
              )}
            >
              {title}
            </h1>
            <p
              className={cn(
                "mx-auto mt-3 max-w-3xl px-1 text-[0.92rem] leading-6 sm:mt-5 sm:px-0 sm:text-base sm:leading-8 md:text-[1.05rem]",
                hasBackgroundImage ? "text-white [text-shadow:0_4px_20px_rgba(0,0,0,0.24)]" : "text-muted-foreground",
                descriptionClassName,
              )}
            >
              {description}
            </p>
          </div>

          {children ? (
            <div
              className={cn(
                "mt-5 pt-4 sm:mt-8 sm:pt-6",
                hasBackgroundImage ? "relative z-10 border-t border-white/18" : "border-t border-border/50",
              )}
            >
                <div
                className={cn(
                  "w-full",
                  hasBackgroundImage &&
                    "mx-auto max-w-6xl rounded-[1.2rem] border border-white/12 bg-white/8 p-2.5 backdrop-blur-[10px] sm:rounded-[1.75rem] sm:p-4",
                )}
              >
                {children}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default PageHeader;
