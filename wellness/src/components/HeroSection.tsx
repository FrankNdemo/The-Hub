import { CalendarClock, MessageCircle, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";

import heroImg from "@/assets/hero-wellness-custom.png";
import leafDecor from "@/assets/leaf-decoration.png";
import { Button } from "@/components/ui/button";
import WellnessLogo from "./WellnessLogo";

const HeroSection = () => (
  <section id="home-hero" className="relative overflow-hidden pb-14 pt-0">
    <div className="w-full">
      <div className="relative min-h-[34rem] overflow-hidden border-b border-border/60 bg-[linear-gradient(135deg,hsl(42_31%_99%),hsl(42_31%_97%))] shadow-hover sm:min-h-[36rem] md:min-h-[38rem] lg:min-h-[40rem]">
        <img
          src={heroImg}
          alt="A smiling client seated in a bright, calm wellness-inspired living room"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-y-0 right-0 h-full w-[106%] max-w-none object-cover object-[78%_6%] brightness-[1.08] saturate-[1.08] contrast-[1.12] sm:-right-[4%] sm:w-[112%] sm:object-[82%_16%] sm:brightness-[1.06] sm:saturate-[1.02] sm:contrast-[1.08] md:-right-[5%] md:w-[110%] md:object-[79%_18%] md:brightness-[1.01] md:saturate-[0.9] md:contrast-[1.01] lg:-right-[2%] lg:w-[104%] lg:object-[77%_16%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(250,247,242,0.92)_0%,rgba(250,247,242,0.72)_30%,rgba(250,247,242,0.26)_58%,rgba(250,247,242,0.04)_86%)] sm:bg-[linear-gradient(118deg,rgba(250,247,242,0.9)_0%,rgba(250,247,242,0.68)_28%,rgba(250,247,242,0.24)_56%,rgba(250,247,242,0.04)_84%)] md:bg-[linear-gradient(90deg,rgba(250,247,242,0.96)_0%,rgba(250,247,242,0.89)_22%,rgba(250,247,242,0.68)_36%,rgba(250,247,242,0.3)_52%,rgba(250,247,242,0.1)_68%,rgba(250,247,242,0.03)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(136_22%_92%_/_0.14),transparent_22%),radial-gradient(circle_at_bottom_left,hsl(42_31%_95%_/_0.08),transparent_26%)] sm:bg-[radial-gradient(circle_at_top_left,hsl(136_22%_92%_/_0.16),transparent_24%),radial-gradient(circle_at_bottom_left,hsl(42_31%_95%_/_0.1),transparent_28%)] md:bg-[radial-gradient(circle_at_top_left,hsl(136_22%_92%_/_0.38),transparent_24%),radial-gradient(circle_at_bottom_left,hsl(42_31%_95%_/_0.24),transparent_28%)]" />
        <img
          src={leafDecor}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1 top-4 z-10 w-24 opacity-[0.58] mix-blend-multiply saturate-175 contrast-135 drop-shadow-[0_16px_30px_rgba(76,106,92,0.22)] animate-float sm:left-2 sm:top-6 sm:w-28 md:left-4 md:top-8 md:w-32 lg:left-6 lg:top-10 lg:w-36"
        />
        <img
          src={leafDecor}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -left-1 bottom-0 z-10 w-28 rotate-[178deg] opacity-[0.52] mix-blend-multiply saturate-170 contrast-135 drop-shadow-[0_16px_30px_rgba(76,106,92,0.18)] animate-float animation-delay-200 sm:left-0 sm:w-32 md:left-1 md:bottom-2 md:w-36 lg:left-3 lg:w-40"
        />
        <img
          src={leafDecor}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-1 bottom-0 z-10 w-28 rotate-[220deg] opacity-[0.52] mix-blend-multiply saturate-170 contrast-135 drop-shadow-[0_16px_30px_rgba(76,106,92,0.18)] animate-float animation-delay-400 sm:right-0 sm:w-32 md:right-1 md:bottom-2 md:w-36 lg:right-3 lg:w-40"
        />

        <div className="absolute inset-x-0 top-0 z-30">
          <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-14 md:px-8 md:pt-14 lg:px-10 lg:pt-14">
            <div className="pl-2 text-left sm:pl-4 md:pl-6 lg:pl-8">
              <div className="inline-block">
                <div className="relative z-10 origin-left -translate-x-[2.4rem] translate-y-3 rotate-[1.75deg] scale-[1.02] scale-x-[1.1] scale-y-[1.18] sm:-translate-x-[3rem] sm:translate-y-4 sm:scale-[1.04] sm:scale-x-[1.12] sm:scale-y-[1.22] md:-translate-x-[5rem] md:translate-y-5 md:rotate-[1.5deg] md:scale-x-[1.18] md:scale-y-[1.24] lg:-translate-x-[6.25rem] lg:translate-y-6 lg:rotate-[1.5deg] lg:scale-x-[1.26] lg:scale-y-[1.3]">
                  <WellnessLogo variant="hero" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-20 mx-auto flex min-h-[34rem] max-w-7xl items-start px-4 pb-10 pt-44 sm:min-h-[36rem] sm:px-6 sm:pb-12 sm:pt-48 md:min-h-[38rem] md:px-8 md:pt-48 lg:min-h-[40rem] lg:px-10 lg:pb-14 lg:pt-52">
          <div className="animate-fade-up mt-9 max-w-[24rem] pl-2 text-left sm:mt-10 sm:max-w-[26rem] sm:pl-4 md:mt-14 md:max-w-[30rem] md:pl-6 lg:mt-16 lg:max-w-[33rem] lg:pl-8">
            <h1 className="max-w-[19rem] font-heading text-[2.4rem] font-medium leading-[0.92] text-foreground [text-shadow:0_10px_24px_rgba(255,255,255,0.18)] sm:max-w-[21rem] sm:text-[2.8rem] md:max-w-[23rem] md:text-[3.1rem] lg:max-w-[26rem] lg:text-[3.45rem]">
              <span className="block whitespace-nowrap">Discover your</span>
              <em className="mt-1 block font-normal italic">best self!</em>
            </h1>

            <p className="mt-6 max-w-[18rem] text-[0.84rem] font-semibold leading-6 text-foreground/92 [text-shadow:0_4px_14px_rgba(255,255,255,0.16)] sm:mt-7 sm:max-w-[19rem] sm:text-[0.92rem] sm:leading-7 md:max-w-[20rem]">
              Compassionate therapy and consultancy for Corporates, Adults, and Adolescents.
            </p>

            <div className="mt-8 grid w-full max-w-[19.25rem] grid-cols-3 gap-1.5 sm:mt-9 sm:max-w-[24rem] sm:gap-2 md:mt-10 md:max-w-[33rem] md:gap-2.5 lg:max-w-[37rem]">
              <Button
                variant="hero"
                size="lg"
                className="h-9 min-w-0 rounded-full px-2 text-[0.56rem] font-medium tracking-normal sm:h-10 sm:px-3 sm:text-[0.68rem] md:h-11 md:px-5 md:text-[0.82rem]"
                asChild
              >
                <Link to="/contact#contact-message-area">
                  <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                    <MessageCircle className="h-3.25 w-3.25 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    <span className="sm:hidden">Make Enquiry</span>
                    <span className="hidden sm:inline">Make an Enquiry</span>
                  </span>
                </Link>
              </Button>
              <Button
                variant="heroBorder"
                size="lg"
                className="h-9 min-w-0 rounded-full border-primary/24 bg-white/42 px-2 text-[0.54rem] font-semibold tracking-normal backdrop-blur-sm hover:bg-primary hover:text-primary-foreground sm:h-10 sm:px-3 sm:text-[0.68rem] sm:font-medium md:h-11 md:px-5 md:text-[0.82rem]"
                asChild
              >
                <Link to="/exploration-call#book-exploration-call">
                  <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                    <PhoneCall className="h-3.25 w-3.25 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    <span className="sm:hidden">Exploration Call</span>
                    <span className="hidden sm:inline">Exploration Call</span>
                  </span>
                </Link>
              </Button>
              <Button
                variant="heroBorder"
                size="lg"
                className="h-9 min-w-0 rounded-full border-primary/24 bg-white/42 px-2 text-[0.54rem] font-semibold tracking-normal backdrop-blur-sm hover:bg-primary hover:text-primary-foreground sm:h-10 sm:px-3 sm:text-[0.68rem] sm:font-medium md:h-11 md:px-5 md:text-[0.82rem]"
                asChild
              >
                <Link to="/booking">
                  <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                    <CalendarClock className="h-3.25 w-3.25 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    <span className="sm:hidden">Session</span>
                    <span className="hidden sm:inline">Book a Session</span>
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
