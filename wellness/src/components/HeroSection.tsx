import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import heroImg from "@/assets/hero-calm-therapy.jpg";
import leafDecor from "@/assets/leaf-decoration.png";
import { Button } from "@/components/ui/button";
import WellnessLogo from "./WellnessLogo";

const HeroSection = () => (
  <section className="relative overflow-hidden pb-14 pt-24 md:pt-28">
    <div className="container mx-auto px-0 md:px-4">
      <div className="relative min-h-[calc(100svh-5.75rem)] overflow-hidden border-y border-border/60 bg-[linear-gradient(135deg,hsl(42_31%_99%),hsl(42_31%_97%))] shadow-hover md:min-h-[34rem] md:rounded-[2.5rem] md:border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(136_22%_91%_/_0.28),transparent_26%),radial-gradient(circle_at_bottom_right,hsl(42_31%_95%_/_0.4),transparent_24%)]" />

        <div className="absolute inset-0 md:hidden">
          <img
            src={heroImg}
            alt="A calm client in a bright, elegant therapy setting"
            className="h-full w-full object-cover object-[center_22%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,247,242,0.82),rgba(250,247,242,0.74),rgba(250,247,242,0.88))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(42_31%_99%_/_0.22),transparent_34%)]" />
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

        <div className="absolute inset-y-0 right-0 left-[36%] hidden md:block">
          <img
            src={heroImg}
            alt="A calm client in a bright, elegant therapy setting"
            className="h-full w-full object-cover object-[center_22%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 via-[24%] to-transparent to-[68%]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(42_31%_99%_/_0.34),transparent_24%,transparent_78%,hsl(42_31%_99%_/_0.14))]" />
        </div>

        <div className="relative z-20 min-h-[calc(100svh-5.75rem)] px-5 py-8 sm:px-8 md:hidden">
          <div className="mx-auto flex min-h-full max-w-[20rem] flex-col items-start justify-start pt-4 text-left">
            <div className="relative inline-block">
              <span className="ml-[7.2rem] block font-body text-[0.62rem] font-medium uppercase tracking-[0.42em] text-primary/90">
                The
              </span>
              <span className="brand-script mt-1 block text-[4.2rem] leading-[0.76] text-primary">
                Wellness
              </span>
              <span className="brand-script -mt-3 ml-[9.7rem] block text-[2.2rem] leading-none text-primary/95">
                Hub
              </span>
            </div>

            <h1 className="mt-8 font-heading text-[3.35rem] font-semibold leading-[0.88] text-foreground [text-shadow:0_6px_18px_rgba(255,255,255,0.22)]">
              Discover your
              <br />
              <em className="font-normal italic">best self!</em>
            </h1>

            <p className="mt-5 max-w-[18rem] text-[1.02rem] leading-8 text-foreground/84 [text-shadow:0_4px_14px_rgba(255,255,255,0.16)]">
              Compassionate therapy and consultancy for Corporates, Adults, and Adolescents.
            </p>

            <div className="mt-9 flex w-full flex-col gap-4">
              <Button variant="hero" size="lg" className="w-full rounded-3xl px-10" asChild>
                <Link to="/booking">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="heroBorder" size="lg" className="w-full rounded-3xl px-10" asChild>
                <Link to="/booking">Book a Session</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="relative z-20 hidden min-h-[34rem] gap-6 px-5 py-8 sm:px-8 md:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:px-10 lg:py-10">
          <div className="flex items-center justify-start">
            <div className="animate-fade-up max-w-[28rem] text-left">
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

              <p className="relative z-10 mt-5 max-w-xl text-[1.02rem] leading-relaxed text-muted-foreground">
                Compassionate therapy and consultancy for Corporates, Adults, and Adolescents.
              </p>

              <h1 className="relative z-10 mt-7 font-heading text-5xl font-semibold leading-[0.95] text-foreground lg:text-[4rem]">
                Discover your
                <br />
                <em className="font-normal italic">best self!</em>
              </h1>

              <div className="relative z-10 mt-9 flex flex-col gap-4 sm:flex-row lg:justify-start">
                <Button variant="hero" size="lg" className="w-full rounded-3xl px-10 sm:w-auto" asChild>
                  <Link to="/booking">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="heroBorder" size="lg" className="w-full rounded-3xl px-10 sm:w-auto" asChild>
                  <Link to="/booking">Book a Session</Link>
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
