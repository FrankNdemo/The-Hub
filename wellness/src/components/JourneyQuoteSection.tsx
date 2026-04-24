import { Quote } from "lucide-react";

import ScrollReveal from "@/components/ScrollReveal";

const journeyQuoteImage =
  "https://images.pexels.com/photos/23385268/pexels-photo-23385268.jpeg?auto=compress&cs=tinysrgb&w=1400&h=700&fit=crop";

const JourneyQuoteSection = () => (
  <section className="relative z-10 -mt-2 pb-10 sm:-mt-4 sm:pb-12">
    <ScrollReveal direction="up">
      <div className="relative w-full overflow-hidden">
        <div className="grid min-h-[7.5rem] grid-cols-[minmax(0,1.45fr)_minmax(6.75rem,0.95fr)] sm:min-h-[8.5rem] sm:grid-cols-[minmax(0,1.55fr)_minmax(9rem,0.9fr)] lg:min-h-[9.5rem] lg:grid-cols-[minmax(0,1.72fr)_minmax(15rem,0.78fr)]">
          <div className="relative z-10 flex items-center bg-[linear-gradient(90deg,hsl(136_18%_89%_/_0.98)_0%,hsl(42_24%_94%_/_0.95)_56%,hsl(42_24%_94%_/_0.72)_76%,transparent_100%)] px-4 py-4 sm:px-8 md:px-12 lg:px-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_28%,rgba(255,255,255,0.52),transparent_34%),linear-gradient(90deg,rgba(235,244,236,0.3),rgba(235,244,236,0.08),transparent_74%)]" />
            <div className="relative z-10 flex items-start gap-3 sm:gap-4">
              <Quote className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary/72 sm:h-5 sm:w-5 lg:h-5.5 lg:w-5.5" />
              <p className="max-w-[38rem] font-heading text-[clamp(0.98rem,2vw,1.72rem)] leading-[1.42] text-foreground">
                Healing is not a destination,
                <span className="block sm:inline"> it&apos;s a journey. </span>
                <em className="font-normal italic text-primary/90">Let&apos;s take it together.</em>
              </p>
            </div>
          </div>

          <div className="relative z-0 min-h-[7.5rem] overflow-hidden sm:min-h-[8.5rem] lg:min-h-[9.5rem]">
            <img
              src={journeyQuoteImage}
              alt="A lit candle beside books and a plant in soft warm light"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-y-0 left-0 w-12 bg-[linear-gradient(90deg,rgba(229,238,226,0.82),rgba(229,238,226,0.44),transparent)] blur-xl sm:w-16 lg:w-24" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(229,238,226,0.7)_0%,rgba(243,236,227,0.26)_14%,rgba(243,236,227,0.04)_32%,rgba(243,236,227,0)_46%,rgba(32,26,21,0.14)_100%)]" />
          </div>
        </div>
      </div>
    </ScrollReveal>
  </section>
);

export default JourneyQuoteSection;
