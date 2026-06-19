import { Quote } from "lucide-react";

import journeyHealingPath from "@/assets/journey-healing-path.jpg";
import HomeImage from "@/components/HomeImage";
import ScrollReveal from "@/components/ScrollReveal";

const journeyQuoteImage = journeyHealingPath;

const JourneyQuoteSection = () => (
  <section className="relative z-10 -mt-px bg-secondary/30">
    <ScrollReveal direction="up">
      <div className="relative grid min-h-[8.5rem] w-full grid-cols-[minmax(0,1.4fr)_minmax(9.5rem,0.6fr)] overflow-hidden border-y border-primary/10 sm:min-h-[10rem] sm:grid-cols-[minmax(0,1.52fr)_minmax(18rem,0.72fr)] lg:min-h-[11rem] lg:grid-cols-[minmax(0,1.65fr)_minmax(27rem,0.75fr)]">
        <div className="relative z-10 flex items-center gap-4 px-5 py-6 sm:gap-7 sm:px-10 md:px-14 lg:px-16">
          <div className="flex shrink-0 items-center gap-4 sm:gap-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/70 bg-white/60 text-primary shadow-sm sm:h-14 sm:w-14">
              <Quote className="h-5 w-5 fill-primary/15 sm:h-6 sm:w-6" aria-hidden="true" />
            </div>
            <div className="h-14 w-px bg-primary/55 sm:h-20" />
          </div>

          <div className="min-w-0 pr-2 sm:pr-10 lg:pr-20">
            <p className="max-w-[35rem] font-heading text-[clamp(1rem,1.65vw,1.55rem)] leading-[1.35] text-foreground">
              Healing is not a destination.
              <span className="block">
                It&apos;s a journey, we take it <em className="font-normal italic text-[#35a853]">together.</em>
              </span>
            </p>
          </div>
        </div>

        <div className="relative min-h-full overflow-hidden rounded-tl-[100%] border-l border-t border-primary/60 bg-primary/10">
          <HomeImage
            src={journeyQuoteImage}
            fallbackSrc={journeyHealingPath}
            alt="Bright green woodland illuminated by warm sunlight"
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[42%_center] brightness-[1.12] saturate-[1.08]"
          />
          <div className="absolute inset-0 bg-primary/5" />
        </div>
      </div>
    </ScrollReveal>
  </section>
);

export default JourneyQuoteSection;
