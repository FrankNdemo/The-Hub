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
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    className={className}
    fill="currentColor"
    {...props}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const MobileContactBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [hasPassedHomeHero, setHasPassedHomeHero] = useState(true);
  const [isTherapistAccessActive, setIsTherapistAccessActive] = useState(false);
  const [isFooterContactSuppressed, setIsFooterContactSuppressed] = useState(false);
  const lastScrollYRef = useRef(0);
  const location = useLocation();
  const { bookingDraft } = useFormDrafts();
  const isHomePage = location.pathname === "/";
  const isActiveBookingFlow = location.pathname === "/booking" && bookingDraft.step !== "details";
  const shouldHide =
    isMenuOpen ||
    isTherapistAccessActive ||
    isFooterContactSuppressed ||
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
    const findUsSection = document.querySelector<HTMLElement>("[data-mobile-contact-hide]");

    if (!findUsSection || !("IntersectionObserver" in window)) {
      setIsFooterContactSuppressed(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterContactSuppressed(entry.isIntersecting),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
    );
    observer.observe(findUsSection);

    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    if (!isHomePage) {
      setHasPassedHomeHero(true);
      return;
    }

    const heroSection = document.getElementById("home-hero");

    if (!heroSection || !("IntersectionObserver" in window)) {
      setHasPassedHomeHero(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setHasPassedHomeHero(!entry.isIntersecting),
      { rootMargin: "0px 0px -64% 0px", threshold: 0 },
    );
    observer.observe(heroSection);

    return () => observer.disconnect();
  }, [isHomePage]);

  useEffect(() => {
    setIsContactOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (shouldHide) {
      setIsContactOpen(false);
    }
  }, [shouldHide]);

  useEffect(() => {
    if (!isContactOpen) {
      return;
    }

    lastScrollYRef.current = window.scrollY;

    const collapseOnScrollUp = () => {
      const nextScrollY = window.scrollY;

      if (nextScrollY < lastScrollYRef.current - 4) {
        setIsContactOpen(false);
      }

      lastScrollYRef.current = nextScrollY;
    };

    window.addEventListener("scroll", collapseOnScrollUp, { passive: true });
    return () => window.removeEventListener("scroll", collapseOnScrollUp);
  }, [isContactOpen]);

  if (shouldHide) {
    return null;
  }

  return (
    <aside
      aria-label="Quick contact options"
      className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[70] md:hidden"
    >
      <div className="relative h-[8.75rem] w-[12.5rem]">
          <div
            className={cn(
              "absolute bottom-0 right-0 flex flex-col items-end gap-2 transition-all duration-200 ease-out",
              isContactOpen
                ? "pointer-events-auto translate-x-0 opacity-100"
                : "pointer-events-none translate-x-8 opacity-0",
            )}
            aria-hidden={!isContactOpen}
          >
            <a
              href={WHATSAPP_HREF}
              className={cn(
                "flex h-12 items-center gap-2.5 rounded-full border border-[#5e8673]/45 bg-white/96 px-4 text-xs font-bold text-primary shadow-[0_18px_40px_-20px_rgba(18,45,32,0.58)] backdrop-blur-xl transition-all duration-200",
                isContactOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0",
              )}
              aria-label="Chat on WhatsApp"
              target="_blank"
              rel="noreferrer"
              tabIndex={isContactOpen ? undefined : -1}
              onClick={() => setIsContactOpen(false)}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5e8673] text-primary-foreground">
                <WhatsAppIcon className="h-[1.1rem] w-[1.1rem]" />
              </span>
              <span>WhatsApp</span>
            </a>
            <Link
              to={EXPLORATION_CALL_PATH}
              className={cn(
                "flex h-12 items-center gap-2.5 rounded-full border border-primary/20 bg-white/96 px-4 text-xs font-bold text-primary shadow-[0_18px_40px_-20px_rgba(18,45,32,0.58)] backdrop-blur-xl transition-all duration-200",
                isContactOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0",
              )}
              aria-label="Book an exploration call"
              tabIndex={isContactOpen ? undefined : -1}
              onClick={() => setIsContactOpen(false)}
            >
              <PhoneCall className="h-5 w-5 shrink-0 text-[#5e8673]" strokeWidth={2.45} aria-hidden="true" />
              <span>Exploration Call</span>
            </Link>
          </div>

          <div
            className={cn(
              "absolute bottom-0 right-0 transition-all duration-200 ease-out",
              isContactOpen
                ? "pointer-events-none translate-x-5 scale-75 opacity-0"
                : "pointer-events-auto translate-x-0 scale-100 opacity-100",
            )}
          >
            <button
              type="button"
              aria-expanded={isContactOpen}
              aria-label="Open contact options"
              onClick={() => setIsContactOpen(true)}
              className={cn(
                "group relative flex h-[4.6rem] w-[4.6rem] animate-mobile-contact-bounce items-center justify-center rounded-full border border-white/55 bg-[#3f5d4d] text-white shadow-[0_22px_52px_-24px_rgba(20,43,33,0.8)] outline-none transition-[filter,box-shadow] duration-200 focus-visible:ring-4 focus-visible:ring-primary/25 motion-reduce:animate-none",
                "before:absolute before:inset-[-0.4rem] before:rounded-full before:bg-[radial-gradient(circle,rgba(190,218,198,0.68),rgba(146,183,158,0.26)_48%,transparent_72%)] before:blur-[1px] before:content-['']",
                "after:absolute after:inset-0 after:rounded-full after:border-[5px] after:border-[#b7d5bf]/80 after:shadow-[inset_0_0_16px_rgba(240,255,244,0.34),0_0_24px_rgba(128,173,143,0.48)] after:content-[''] after:animate-mobile-contact-glow motion-reduce:after:animate-none",
                "drop-shadow-[0_8px_18px_rgba(35,59,46,0.38)]",
              )}
            >
              <span className="absolute inset-[0.62rem] rounded-full bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.22),transparent_34%),linear-gradient(145deg,#63886e,#2f4a3d)]" />
              <span className="relative z-10 text-center text-[0.56rem] font-bold uppercase leading-[1.15] tracking-[0.13em]">
                Talk
                <br />
                With Us
              </span>
            </button>
          </div>
        </div>
      <span
        className={cn(
          "pointer-events-none fixed inset-0 z-[-1] bg-transparent transition-colors duration-300",
          isContactOpen && "bg-foreground/[0.02]",
        )}
        aria-hidden="true"
      />
    </aside>
  );
};

export default MobileContactBar;
