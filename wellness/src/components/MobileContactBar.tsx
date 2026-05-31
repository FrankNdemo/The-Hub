import { useEffect, useRef, useState, type SVGProps } from "react";
import { Link, useLocation } from "react-router-dom";
import { PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormDrafts } from "@/context/FormDraftContext";

const HOME_VISIT_PHONE_E164 = "254730490000";
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

  if (shouldHide) {
    return null;
  }

  return (
    <>
      <div className="h-[4.75rem] md:hidden" aria-hidden="true" />
      <section
        ref={barRef}
        aria-label="Quick contact options"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[70] border-0 px-5 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md transition-[background-color,color,filter] duration-700 ease-in-out md:hidden",
          tone === "inverse"
            ? "bg-foreground/36 text-white drop-shadow-[0_1px_5px_rgba(0,0,0,0.75)]"
            : "bg-background/82 text-primary",
        )}
      >
        <p className="text-center text-xs font-bold uppercase leading-none tracking-[0.16em]">Talk With Us</p>
        <span
          className={cn(
            "mx-auto mt-2 block h-px w-full transition-colors duration-700 ease-in-out",
            tone === "inverse" ? "bg-white/50" : "bg-primary/35",
          )}
          aria-hidden="true"
        />
        <div className="grid min-h-9 grid-cols-[1fr_auto_1fr] items-center px-3 pt-2 text-xs font-semibold leading-none min-[380px]:text-[13px]">
          <a
            href={`https://wa.me/${HOME_VISIT_PHONE_E164}`}
            className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap px-1"
            aria-label="Chat on WhatsApp"
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon className="h-[1.15rem] w-[1.15rem] shrink-0 text-[#5e8673]" />
            <span className="truncate">WhatsApp</span>
          </a>
          <span
            className={cn(
              "h-7 w-px transition-colors duration-700 ease-in-out",
              tone === "inverse" ? "bg-white/55" : "bg-primary/35",
            )}
            aria-hidden="true"
          />
          <Link
            to={EXPLORATION_CALL_PATH}
            className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap px-1"
            aria-label="Book an exploration call"
          >
            <PhoneCall className="h-[1.2rem] w-[1.2rem] shrink-0 text-[#5e8673]" strokeWidth={2.45} aria-hidden="true" />
            <span className="truncate">Exploration Call</span>
          </Link>
        </div>
      </section>
    </>
  );
};

export default MobileContactBar;
