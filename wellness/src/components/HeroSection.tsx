import { CalendarClock, Compass, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import leafDecor from "@/assets/leaf-decoration.png";
import { Button } from "@/components/ui/button";
import WellnessLogo from "./WellnessLogo";

const heroImg =
  "https://images.unsplash.com/photo-1765438863298-56a145f86d05?auto=format&fit=crop&w=2200&q=80";

const HeroSection = () => (
  <section className="relative overflow-hidden pb-14 pt-24 md:pt-28">
    <div className="w-full">
      <div className="relative min-h-[calc(100svh-5.75rem)] overflow-hidden border-y border-border/60 bg-[linear-gradient(135deg,hsl(42_31%_99%),hsl(42_31%_97%))] shadow-hover md:min-h-[32rem] lg:min-h-[33rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(136_22%_91%_/_0.28),transparent_26%),radial-gradient(circle_at_bottom_right,hsl(42_31%_95%_/_0.4),transparent_24%)]" />

        <div className="absolute inset-0 md:hidden">
          <img
            src={heroImg}
            alt="A client seated in a calm, bright therapy space"
            className="h-full w-full object-cover object-[72%_22%] brightness-[1.05] saturate-[0.82] contrast-[0.96]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,247,242,0.9),rgba(250,247,242,0.7),rgba(250,247,242,0.88))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(42_31%_99%_/_0.22),transparent_36%)]" />
        </div>

        <img
          src={leafDecor}
          alt=""
          className="pointer-events-none absolute -left-8 top-8 z-[1] w-24 opacity-16 md:left-0 md:top-0 md:w-32 md:opacity-24"
        />
        <img
          src={leafDecor}
          alt=""
          className="pointer-events-none absolute bottom-0 right-0 z-[1] w-24 rotate-180 opacity-18 md:w-36"
        />

        <div className="absolute inset-y-0 right-0 left-[39%] hidden md:block lg:left-[41%]">
          <img
            src={heroImg}
            alt="A client seated in a calm, bright therapy space"
            className="h-full w-full object-cover object-[66%_24%] brightness-[1.06] saturate-[0.8] contrast-[0.95]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(42_31%_99%)_0%,hsl(42_31%_99%_/_0.96)_22%,hsl(42_31%_99%_/_0.84)_42%,transparent_76%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_36%,hsl(42_31%_99%_/_0.54),transparent_28%),linear-gradient(180deg,hsl(42_31%_99%_/_0.26),transparent_24%,transparent_78%,hsl(42_31%_99%_/_0.16))]" />
        </div>

        <div className="relative z-20 min-h-[calc(100svh-5.75rem)] px-5 py-8 sm:px-8 md:hidden">
          <div className="mx-auto flex min-h-full max-w-[20rem] flex-col items-start justify-start pt-4 text-left">
            <WellnessLogo variant="hero" />

            <h1 className="mt-8 font-heading text-[3.35rem] font-semibold leading-[0.88] text-foreground [text-shadow:0_6px_18px_rgba(255,255,255,0.22)]">
              Discover your
              <br />
              <em className="font-normal italic">best self!</em>
            </h1>

            <p className="mt-5 max-w-[18rem] text-[1.02rem] leading-8 text-foreground/84 [text-shadow:0_4px_14px_rgba(255,255,255,0.16)]">
              Compassionate therapy and consultancy for Corporates, Adults, and Adolescents.
            </p>

            <div className="mt-8 grid w-full grid-cols-3 gap-1.5">
              <Button
                variant="hero"
                size="lg"
                className="h-9 min-w-0 rounded-full px-1.5 text-[0.54rem] font-medium uppercase tracking-[0.08em] text-center leading-none sm:text-[0.62rem]"
                asChild
              >
                <Link to="/contact#contact-message-area">
                  <span className="sm:hidden">Make Enquiry</span>
                  <span className="hidden sm:inline-flex sm:items-center sm:gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Make an Enquiry
                  </span>
                </Link>
              </Button>
              <Button
                variant="heroBorder"
                size="lg"
                className="h-9 min-w-0 rounded-full px-1.5 text-[0.52rem] font-medium uppercase tracking-[0.08em] text-center leading-none sm:text-[0.62rem]"
                asChild
              >
                <Link to="/exploration-call">
                  <span className="sm:hidden">Explore Call</span>
                  <span className="hidden sm:inline-flex sm:items-center sm:gap-1.5">
                    <Compass className="h-3.5 w-3.5" />
                    Exploration Call
                  </span>
                </Link>
              </Button>
              <Button
                variant="heroBorder"
                size="lg"
                className="h-9 min-w-0 rounded-full px-1.5 text-[0.52rem] font-medium uppercase tracking-[0.08em] text-center leading-none sm:text-[0.62rem]"
                asChild
              >
                <Link to="/booking">
                  <span className="sm:hidden">Session</span>
                  <span className="hidden sm:inline-flex sm:items-center sm:gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Book a Session
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="relative z-20 hidden min-h-[32rem] gap-6 px-5 py-8 sm:px-8 md:grid lg:min-h-[33rem] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:px-10 lg:py-10">
          <div className="flex items-center justify-start md:pl-2 lg:pl-5 xl:pl-6">
            <div className="animate-fade-up max-w-[31.5rem] text-left lg:max-w-[32rem]">
              <div className="relative -mt-5 inline-block">
                <img
                  src={leafDecor}
                  alt=""
                  className="pointer-events-none absolute -left-6 -top-5 z-[1] w-24 opacity-18"
                />
                <div className="relative z-10">
                  <WellnessLogo variant="hero" />
                </div>
              </div>

              <p className="relative z-10 mt-5 max-w-xl text-[1.01rem] leading-relaxed text-muted-foreground">
                Compassionate therapy and consultancy for Corporates, Adults, and Adolescents.
              </p>

              <h1 className="relative z-10 mt-7 font-heading text-[3.7rem] font-semibold leading-[0.94] text-foreground lg:text-[4.1rem]">
                Discover your
                <br />
                <em className="font-normal italic">best self!</em>
              </h1>

              <div className="relative z-10 mt-9 flex max-w-[42rem] flex-nowrap items-center gap-2">
                <Button
                  variant="hero"
                  size="lg"
                  className="h-8.5 rounded-full px-2.5 text-[0.5rem] font-medium uppercase tracking-[0.05em] lg:h-9 lg:px-3 lg:text-[0.54rem]"
                  asChild
                >
                  <Link to="/contact#contact-message-area" className="inline-flex items-center justify-center gap-1.25 whitespace-nowrap">
                    <MessageCircle className="h-3.25 w-3.25 lg:h-3.5 lg:w-3.5" />
                    Make an Enquiry
                  </Link>
                </Button>
                <Button
                  variant="heroBorder"
                  size="lg"
                  className="h-8.5 rounded-full px-2.5 text-[0.48rem] font-medium uppercase tracking-[0.05em] lg:h-9 lg:px-3 lg:text-[0.52rem]"
                  asChild
                >
                  <Link to="/exploration-call" className="inline-flex items-center justify-center gap-1.25 whitespace-nowrap">
                    <Compass className="h-3.25 w-3.25 lg:h-3.5 lg:w-3.5" />
                    Exploration Call
                  </Link>
                </Button>
                <Button
                  variant="heroBorder"
                  size="lg"
                  className="h-8.5 rounded-full px-2.5 text-[0.5rem] font-medium uppercase tracking-[0.05em] lg:h-9 lg:px-3 lg:text-[0.54rem]"
                  asChild
                >
                  <Link to="/booking" className="inline-flex items-center justify-center gap-1.25 whitespace-nowrap">
                    <CalendarClock className="h-3.25 w-3.25 lg:h-3.5 lg:w-3.5" />
                    Book a Session
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden md:block" />
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
