import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { CalendarClock, MessageCircle, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";

import heroImg from "@/assets/hero-wellness-custom.png";
import leafDecor from "@/assets/leaf-decoration.png";
import { Button } from "@/components/ui/button";
import { useDesktopImageEffects } from "@/hooks/useDesktopImageEffects";
import WellnessLogo from "./WellnessLogo";

const heroTitleWords = ["Discover", "your"];

const HeroSection = () => {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 64, damping: 18, mass: 0.28 });
  const heroImageY = useTransform(smoothProgress, [0, 0.28], ["0%", "20%"]);
  const heroImageScale = useTransform(smoothProgress, [0, 0.28], [1.08, 1.24]);
  const heroGlowY = useTransform(smoothProgress, [0, 0.55], ["0%", "34%"]);
  const desktopImageEffects = useDesktopImageEffects();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="home-hero" className="relative overflow-hidden pb-0 pt-0 sm:pb-14" data-nav-theme="inverse">
      <div className="w-full">
        <div
          className="relative min-h-[100svh] overflow-hidden border-b border-border/60 bg-[linear-gradient(135deg,hsl(42_31%_99%),hsl(42_31%_97%))] shadow-hover sm:min-h-[36rem] md:min-h-[38rem] lg:min-h-[40rem]"
        >
          <motion.img
            src={heroImg}
            alt="A smiling client seated in a bright, calm wellness-inspired living room"
            loading="eager"
            fetchpriority="high"
            className="absolute inset-y-0 -right-[8%] h-full w-[128%] max-w-none object-cover object-[66%_8%] brightness-[1.03] saturate-[1.03] contrast-[1.05] sm:-right-[4%] sm:w-[112%] sm:object-[82%_16%] sm:brightness-[1.06] sm:saturate-[1.02] sm:contrast-[1.08] md:-right-[5%] md:w-[110%] md:object-[79%_18%] md:brightness-[1.02] md:saturate-[0.92] md:contrast-[1.02] lg:-right-[2%] lg:w-[104%] lg:object-[77%_16%]"
            style={desktopImageEffects ? { y: heroImageY, scale: heroImageScale } : undefined}
          />
          <div className="absolute inset-0 bg-[linear-gradient(102deg,rgba(9,24,19,0.78)_0%,rgba(9,24,19,0.52)_38%,rgba(9,24,19,0.15)_70%,rgba(9,24,19,0.02)_100%)] sm:bg-[linear-gradient(108deg,rgba(9,24,19,0.72)_0%,rgba(9,24,19,0.44)_34%,rgba(9,24,19,0.12)_68%,rgba(9,24,19,0.01)_100%)] md:bg-[linear-gradient(90deg,rgba(9,24,19,0.72)_0%,rgba(9,24,19,0.5)_26%,rgba(9,24,19,0.24)_48%,rgba(9,24,19,0.06)_72%,rgba(9,24,19,0.01)_100%),radial-gradient(circle_at_28%_18%,rgba(250,247,242,0.25),transparent_32%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(8,24,19,0.28),transparent_34%)] sm:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(8,24,19,0.22),transparent_34%)] md:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(8,24,19,0.18),transparent_32%)]" />
          <motion.div
            className="pointer-events-none absolute left-[7%] top-[18%] hidden h-36 w-36 rounded-full bg-white/18 blur-3xl sm:h-52 sm:w-52 md:block"
            style={desktopImageEffects ? { y: heroGlowY } : undefined}
          />
          <motion.img
            src={leafDecor}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-28 z-10 hidden w-32 rotate-[24deg] opacity-20 sm:right-[8%] sm:w-44 md:block"
            animate={shouldReduceMotion ? undefined : { y: [0, -16, 0], rotate: [20, 28, 20] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-[14%] left-[8%] z-10 hidden h-20 w-20 rounded-full border border-white/30 bg-white/10 shadow-[0_24px_80px_-40px_rgba(255,255,255,0.6)] backdrop-blur-md md:block"
            animate={shouldReduceMotion ? undefined : { y: [0, 18, 0], rotateX: [0, 18, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <img
            src={leafDecor}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1 top-4 z-10 w-24 opacity-[0.78] saturate-175 contrast-135 brightness-[1.16] drop-shadow-[0_16px_30px_rgba(76,106,92,0.28)] animate-float sm:left-2 sm:top-6 sm:w-28 sm:opacity-[0.68] md:left-4 md:top-8 md:w-32 lg:left-6 lg:top-10 lg:w-36"
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
                  <div className="relative z-10 origin-left -translate-x-3 translate-y-4 rotate-[1.15deg] scale-[1.03] scale-x-[1.08] scale-y-[1.24] sm:translate-x-[0.15rem] sm:translate-y-3 sm:scale-[1.02] sm:scale-x-[1.04] sm:scale-y-[1.1] md:-translate-x-[0.95rem] md:translate-y-5 md:rotate-[1.2deg] md:scale-x-[1.1] md:scale-y-[1.16] lg:-translate-x-[1.35rem] lg:translate-y-6 lg:rotate-[1.15deg] lg:scale-x-[1.14] lg:scale-y-[1.2]">
                    <WellnessLogo variant="hero" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-20 mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 pb-16 pt-40 sm:min-h-[36rem] sm:items-start sm:px-6 sm:pb-12 sm:pt-48 md:min-h-[38rem] md:px-8 md:pt-48 lg:min-h-[40rem] lg:px-10 lg:pb-14 lg:pt-52">
            <div className="animate-fade-up max-w-[24rem] pl-2 text-left sm:mt-10 sm:max-w-[26rem] sm:pl-4 md:mt-14 md:max-w-[30rem] md:pl-6 lg:mt-16 lg:max-w-[33rem] lg:pl-8">
              <h1
                className="max-w-[22rem] font-heading text-[2.68rem] font-medium leading-[0.92] text-white [text-shadow:0_12px_30px_rgba(0,0,0,0.42)] sm:max-w-[21rem] sm:text-[2.8rem] md:max-w-[23rem] md:text-[3.1rem] lg:max-w-[26rem] lg:text-[3.45rem]"
                aria-label="Discover your best self!"
              >
                <span className="block whitespace-nowrap">
                  {heroTitleWords.map((word, index) => (
                    <motion.span
                      key={word}
                      aria-hidden="true"
                      className="inline-block"
                      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      viewport={{ once: true, amount: 0.9 }}
                      transition={{
                        delay: index * 0.08,
                        duration: 0.62,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {word}
                      {index < heroTitleWords.length - 1 ? "\u00A0" : null}
                    </motion.span>
                  ))}
                </span>
                <motion.em
                  aria-hidden="true"
                  className="mt-1 block font-normal italic"
                  initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.9 }}
                  transition={{ delay: 0.18, duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                >
                  best self!
                </motion.em>
              </h1>

              <p className="mt-6 max-w-[18rem] text-[0.84rem] font-semibold leading-6 text-white [text-shadow:0_8px_22px_rgba(0,0,0,0.42)] sm:mt-7 sm:max-w-[19rem] sm:text-[0.92rem] sm:leading-7 md:max-w-[20rem]">
                Compassionate therapy and consultancy for Corporates, Adults, and Adolescents.
              </p>

              <div className="mt-10 grid w-full max-w-[19.25rem] grid-cols-3 gap-1.5 sm:mt-9 sm:max-w-[24rem] sm:gap-2 md:mt-10 md:max-w-[33rem] md:gap-2.5 lg:max-w-[37rem]">
                <Button
                  variant="hero"
                  size="lg"
                  className="h-[2.65rem] min-w-0 rounded-full px-2 text-[0.56rem] font-medium tracking-normal sm:h-10 sm:px-3 sm:text-[0.68rem] md:h-11 md:px-5 md:text-[0.82rem]"
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
                  className="h-[2.65rem] min-w-0 rounded-full border-white/65 bg-white/12 px-2 text-[0.54rem] font-semibold tracking-normal text-white backdrop-blur-[2px] hover:bg-white hover:text-primary sm:h-10 sm:border-primary/24 sm:bg-white/42 sm:px-3 sm:text-[0.68rem] sm:font-medium sm:text-primary sm:backdrop-blur-sm sm:hover:bg-primary sm:hover:text-primary-foreground md:h-11 md:px-5 md:text-[0.82rem]"
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
                  className="h-[2.65rem] min-w-0 rounded-full border-white/65 bg-white/12 px-2 text-[0.54rem] font-semibold tracking-normal text-white backdrop-blur-[2px] hover:bg-white hover:text-primary sm:h-10 sm:border-primary/24 sm:bg-white/42 sm:px-3 sm:text-[0.68rem] sm:font-medium sm:text-primary sm:backdrop-blur-sm sm:hover:bg-primary sm:hover:text-primary-foreground md:h-11 md:px-5 md:text-[0.82rem]"
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
};

export default HeroSection;
