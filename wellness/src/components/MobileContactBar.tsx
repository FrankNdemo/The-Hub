import { useEffect, useRef, useState, type SVGProps } from "react";
import { Link, useLocation } from "react-router-dom";
import { PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWhatsAppHref } from "@/lib/whatsapp";
import { useFormDrafts } from "@/context/FormDraftContext";
import { primaryTherapist } from "@/data/siteData";

const WHATSAPP_HREF = getWhatsAppHref(primaryTherapist.phone);
const EXPLORATION_CALL_PATH = "/exploration-call#book-exploration-call";

const WhatsAppIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 32 32"
    aria-hidden="true"
    focusable="false"
    className={className}
    {...props}
  >
    <path
      fill="currentColor"
      d="M16.01 3.2c-7.05 0-12.8 5.73-12.8 12.78 0 2.24.59 4.44 1.71 6.37L3.1 29l6.82-1.79a12.8 12.8 0 0 0 6.09 1.55h.01c7.05 0 12.78-5.74 12.78-12.79 0-3.41-1.33-6.62-3.74-9.04a12.7 12.7 0 0 0-9.05-3.73Z"
    />
    <path
      fill="#fff"
      d="M23.53 21.23c-.31.88-1.82 1.68-2.56 1.79-.68.1-1.54.15-2.48-.15-.57-.18-1.31-.42-2.25-.82-3.96-1.71-6.54-5.66-6.74-5.92-.2-.26-1.61-2.14-1.61-4.09s1.02-2.91 1.38-3.31c.36-.4.79-.5 1.05-.5h.76c.24.01.57-.09.89.68.34.81 1.15 2.8 1.25 3 .1.2.17.44.03.7-.13.26-.2.43-.4.67-.2.23-.42.52-.6.69-.2.2-.41.41-.18.81.23.4 1.01 1.66 2.16 2.69 1.49 1.33 2.74 1.74 3.14 1.94.4.2.64.17.87-.1.23-.27 1-.94 1.26-1.26.27-.34.54-.28.91-.17.37.13 2.36 1.11 2.76 1.31.4.2.67.3.77.47.1.17.1.98-.2 1.86Z"
    />
  </svg>
);

const MobileContactBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [hasPassedHomeHero, setHasPassedHomeHero] = useState(true);
  const [isTherapistAccessActive, setIsTherapistAccessActive] = useState(false);
  const [isFooterMapVisible, setIsFooterMapVisible] = useState(false);
  const [tone, setTone] = useState<"default" | "inverse">("default");
  const barRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const { bookingDraft } = useFormDrafts();
  const isHomePage = location.pathname === "/";
  const isActiveBookingFlow = location.pathname === "/booking" && bookingDraft.step !== "details";
  const shouldHide =
    isMenuOpen ||
    isTherapistAccessActive ||
    isFooterMapVisible ||
    isActiveBookingFlow ||
    location.pathname.startsWith("/therapist") ||
    location.pathname === "/exploration-call" ||
    (isHomePage && !hasPassedHomeHero);

  useEffect(() => {
    const handleMenuState = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      setIsMenuOpen(Boolean(detail?.open));
    };

    window.addEventListener("wellness-mobile-menu-state", handleMenuState);
    return () => window.removeEventListener("wellness-mobile-menu-state", handleMenuState);
  }, []);

  useEffect(() => {
    const handleTherapistAccessState = (event: Event) => {
      const detail = (event as CustomEvent<{ active?: boolean }>).detail;
      setIsTherapistAccessActive(Boolean(detail?.active));
    };

    window.addEventListener("wellness-therapist-access-state", handleTherapistAccessState);
    return () => window.removeEventListener("wellness-therapist-access-state", handleTherapistAccessState);
  }, []);

  useEffect(() => {
    const footerHideTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-mobile-contact-hide]"));

    if (!footerHideTargets.length) {
      setIsFooterMapVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setIsFooterMapVisible(entries.some((entry) => entry.isIntersecting));
      },
      {
        threshold: 0.08,
      },
    );

    footerHideTargets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    if (!isHomePage) {
      setHasPassedHomeHero(true);
      return;
    }

    let frameId = 0;

    const updateHomeHeroState = () => {
      const heroSection = document.getElementById("home-hero");

      if (!heroSection) {
        setHasPassedHomeHero(true);
        return;
      }

      setHasPassedHomeHero(heroSection.getBoundingClientRect().bottom <= window.innerHeight * 0.36);
    };

    const queueHeroStateUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateHomeHeroState);
    };

    queueHeroStateUpdate();
    window.addEventListener("scroll", queueHeroStateUpdate, { passive: true });
    window.addEventListener("resize", queueHeroStateUpdate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", queueHeroStateUpdate);
      window.removeEventListener("resize", queueHeroStateUpdate);
    };
  }, [isHomePage]);

  useEffect(() => {
    if (shouldHide) {
      return;
    }

    let frameId = 0;
    let delayedTimeoutId = 0;

    const resolveToneAtPoint = (x: number, y: number): "default" | "inverse" => {
      const barElement = barRef.current;

      if (!barElement) {
        return "default";
      }

      const stackedElements = document.elementsFromPoint(x, y);

      for (const element of stackedElements) {
        if (!(element instanceof HTMLElement) || barElement.contains(element)) {
          continue;
        }

        const themedAncestor = element.closest<HTMLElement>("[data-nav-theme]");

        if (themedAncestor) {
          return themedAncestor.dataset.navTheme === "inverse" ? "inverse" : "default";
        }

        const style = window.getComputedStyle(element);
        const hasImageBackground = style.backgroundImage !== "none";
        const isMedia = element.tagName === "IMG" || element.tagName === "VIDEO" || element.tagName === "PICTURE";

        if (hasImageBackground || isMedia) {
          return "inverse";
        }

        return "default";
      }

      return "default";
    };

    const updateTone = () => {
      const barElement = barRef.current;

      if (!barElement) {
        return;
      }

      const bounds = barElement.getBoundingClientRect();
      const sampleY = Math.max(1, Math.min(window.innerHeight - 1, bounds.top + bounds.height * 0.5));
      const sampleXs = [0.25, 0.5, 0.75].map((ratio) =>
        Math.max(1, Math.min(window.innerWidth - 1, bounds.left + bounds.width * ratio)),
      );
      const nextTone = sampleXs.some((sampleX) => resolveToneAtPoint(sampleX, sampleY) === "inverse")
        ? "inverse"
        : "default";

      setTone((currentTone) => (currentTone === nextTone ? currentTone : nextTone));
    };

    const queueToneUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateTone);
    };

    queueToneUpdate();
    delayedTimeoutId = window.setTimeout(queueToneUpdate, 180);
    window.addEventListener("scroll", queueToneUpdate, { passive: true });
    window.addEventListener("resize", queueToneUpdate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(delayedTimeoutId);
      window.removeEventListener("scroll", queueToneUpdate);
      window.removeEventListener("resize", queueToneUpdate);
    };
  }, [location.pathname, shouldHide]);

  useEffect(() => {
    if (!isContactOpen) {
      return;
    }

    let frameId = 0;

    const closeOnScroll = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => setIsContactOpen(false));
    };

    window.addEventListener("scroll", closeOnScroll, { passive: true });
    window.addEventListener("resize", closeOnScroll);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", closeOnScroll);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [isContactOpen]);

  useEffect(() => {
    setIsContactOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (shouldHide) {
      setIsContactOpen(false);
    }
  }, [shouldHide]);

  if (shouldHide) {
    return null;
  }

  return (
    <>
      <div className="h-[5.5rem] md:hidden" aria-hidden="true" />
      <aside
        ref={barRef}
        aria-label="Quick contact options"
        className="fixed inset-x-0 bottom-[max(0.9rem,env(safe-area-inset-bottom))] z-[70] flex justify-center px-4 md:hidden"
      >
        <div className="relative flex min-h-[10rem] w-full max-w-[18rem] items-end justify-center">
          <div
            className={cn(
              "absolute bottom-[5.15rem] left-1/2 flex -translate-x-1/2 items-center justify-center gap-3 transition-all duration-500 ease-out",
              isContactOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-9 scale-75 opacity-0",
            )}
            aria-hidden={!isContactOpen}
          >
            <a
              href={WHATSAPP_HREF}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full border border-white/65 bg-white/96 text-[#2f6f4e] shadow-[0_18px_40px_-20px_rgba(18,45,32,0.58)] backdrop-blur-xl transition-all duration-300",
                isContactOpen ? "-translate-x-1" : "translate-x-8",
              )}
              aria-label="Chat on WhatsApp"
              target="_blank"
              rel="noreferrer"
              tabIndex={isContactOpen ? undefined : -1}
              onClick={() => setIsContactOpen(false)}
            >
              <WhatsAppIcon className="h-8 w-8" />
            </a>
            <Link
              to={EXPLORATION_CALL_PATH}
              className={cn(
                "flex h-14 items-center gap-2 rounded-full border border-white/65 bg-white/96 px-4 text-xs font-bold uppercase tracking-[0.08em] text-primary shadow-[0_18px_40px_-20px_rgba(18,45,32,0.58)] backdrop-blur-xl transition-all duration-300",
                isContactOpen ? "translate-x-1" : "-translate-x-8",
              )}
              aria-label="Book an exploration call"
              tabIndex={isContactOpen ? undefined : -1}
              onClick={() => setIsContactOpen(false)}
            >
              <PhoneCall className="h-5 w-5 shrink-0 text-[#5e8673]" strokeWidth={2.45} aria-hidden="true" />
              <span className="max-w-[6.75rem] leading-tight">Exploration Call</span>
            </Link>
          </div>

          <button
            type="button"
            aria-expanded={isContactOpen}
            aria-label={isContactOpen ? "Close contact options" : "Open contact options"}
            onClick={() => setIsContactOpen((current) => !current)}
            className={cn(
              "group relative flex h-[4.85rem] w-[4.85rem] items-center justify-center rounded-full border border-white/55 bg-[#3f5d4d] text-white shadow-[0_22px_52px_-24px_rgba(20,43,33,0.8)] outline-none transition-[filter,transform,box-shadow] duration-500 animate-mobile-contact-float focus-visible:ring-4 focus-visible:ring-primary/25",
              "before:absolute before:inset-[-0.45rem] before:rounded-full before:bg-[radial-gradient(circle,rgba(190,218,198,0.75),rgba(146,183,158,0.3)_48%,transparent_72%)] before:blur-[1px] before:content-['']",
              "after:absolute after:inset-0 after:rounded-full after:border-[5px] after:border-[#b7d5bf]/85 after:shadow-[inset_0_0_16px_rgba(240,255,244,0.38),0_0_28px_rgba(128,173,143,0.55)] after:content-[''] after:animate-mobile-contact-glow",
              tone === "inverse"
                ? "drop-shadow-[0_5px_16px_rgba(0,0,0,0.55)]"
                : "drop-shadow-[0_10px_20px_rgba(60,86,70,0.26)]",
              isContactOpen && "scale-[1.03] shadow-[0_25px_58px_-22px_rgba(20,43,33,0.9)]",
            )}
          >
            <span className="absolute inset-[0.66rem] rounded-full bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.22),transparent_34%),linear-gradient(145deg,#63886e,#2f4a3d)]" />
            <span className="relative z-10 text-center text-[0.58rem] font-bold uppercase leading-[1.15] tracking-[0.14em]">
              Talk
              <br />
              With Us
            </span>
          </button>
        </div>
        <span
          className={cn(
            "pointer-events-none fixed inset-0 z-[-1] bg-transparent transition-colors duration-300",
            isContactOpen && "bg-foreground/[0.02]",
          )}
          aria-hidden="true"
        />
      </aside>
    </>
  );
};

export default MobileContactBar;
