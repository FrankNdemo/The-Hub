import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  FileText,
  Home,
  LayoutDashboard,
  Leaf,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useNavigationPreview } from "@/context/NavigationPreviewContext";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { cn } from "@/lib/utils";
import leafDecor from "@/assets/leaf-decoration.png";
import { Button } from "@/components/ui/button";
import WellnessLogo from "./WellnessLogo";

const WELLNESS_HUB_MAP_URL = "https://maps.app.goo.gl/CzPK4ad5eeTAANLP6?g_st=aw";

const navLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "About", href: "/about", icon: UserRound },
  { label: "Services", href: "/services", icon: Leaf },
  { label: "Team", href: "/team", icon: Users },
  { label: "Blog", href: "/blog", icon: FileText },
  { label: "Contact", href: "/contact", icon: Mail },
];

const NAV_PREVIEW_DELAY_MS = 100;
const MENU_ANIMATION_MS = 140;
const MENU_SWIPE_CLOSE_THRESHOLD = 14;

const matchesPath = (currentPath: string, href: string) => {
  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [menuHoverPath, setMenuHoverPath] = useState<string | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasPassedHomeHero, setHasPassedHomeHero] = useState(true);
  const [navTone, setNavTone] = useState<"default" | "inverse">("default");
  const navRef = useRef<HTMLElement | null>(null);
  const navShellRef = useRef<HTMLDivElement | null>(null);
  const previewHoverTimeoutRef = useRef<number | null>(null);
  const menuTouchStartYRef = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { previewPath, setPreviewPath, clearPreviewPath } = useNavigationPreview();
  const { therapist, isTherapistAuthenticated, logoutTherapist } = useWellnessHub();

  const activePath = previewPath ?? location.pathname;
  const activeMenuPath = menuHoverPath ?? location.pathname;
  const isHomePage = location.pathname === "/";
  const isTherapistPortal = location.pathname.startsWith("/therapist/portal");
  const showTherapistHeader = isTherapistAuthenticated;
  const showHeroMenuTrigger = !showTherapistHeader && isHomePage && !hasPassedHomeHero;
  const showMainNavbar = showTherapistHeader || !isHomePage || hasPassedHomeHero;
  const shouldFloatHomeMobileNav = !showTherapistHeader && isHomePage && hasScrolled && hasPassedHomeHero;
  const isInverseTone = navTone === "inverse";
  const menuWhatsAppNumber = therapist.phone.replace(/\D/g, "");
  const menuLocationQuery = therapist.location.filter(Boolean).join(", ");
  const menuMapHref = menuLocationQuery ? WELLNESS_HUB_MAP_URL : "";
  const menuQuickActions = [
    { label: "Exploration Call", to: "/exploration-call#book-exploration-call", icon: Phone },
    { label: "Email", href: `mailto:${therapist.email}`, icon: Mail },
    menuWhatsAppNumber
      ? { label: "WhatsApp", href: `https://wa.me/${menuWhatsAppNumber}`, icon: MessageCircle }
      : null,
    menuMapHref ? { label: "Directions", href: menuMapHref, icon: MapPin } : null,
  ].filter((action): action is { label: string; href?: string; to?: string; icon: LucideIcon } => Boolean(action));

  const clearPendingPreview = () => {
    if (previewHoverTimeoutRef.current !== null) {
      window.clearTimeout(previewHoverTimeoutRef.current);
      previewHoverTimeoutRef.current = null;
    }
  };

  const closeMenu = ({ instant = false }: { instant?: boolean } = {}) => {
    setMenuHoverPath(null);
    setOpen(false);

    if (instant) {
      setIsMenuVisible(false);
      setIsMenuClosing(false);
    }
  };

  const toggleMenu = () => {
    if (open) {
      closeMenu();
      return;
    }

    setMenuHoverPath(null);
    setIsMenuClosing(false);
    setIsMenuVisible(true);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    
    const handleScroll = () => {
      setOpen(false);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearPendingPreview();
    };
  }, [open]);

  useEffect(() => {
    if (showTherapistHeader) {
      setIsMenuVisible(false);
      setIsMenuClosing(false);
      return;
    }

    if (open) {
      setIsMenuVisible(true);
      setIsMenuClosing(false);
      return;
    }

    if (!isMenuVisible) {
      return;
    }

    setIsMenuClosing(true);

    const closeTimeout = window.setTimeout(() => {
      setIsMenuVisible(false);
      setIsMenuClosing(false);
    }, MENU_ANIMATION_MS);

    return () => {
      window.clearTimeout(closeTimeout);
    };
  }, [isMenuVisible, open, showTherapistHeader]);

  useEffect(() => {
    if (!isMenuVisible || showTherapistHeader) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuVisible, showTherapistHeader]);

  useEffect(() => {
    const handleScrollPosition = () => {
      setHasScrolled(window.scrollY > 24);
    };

    handleScrollPosition();
    window.addEventListener("scroll", handleScrollPosition, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScrollPosition);
    };
  }, []);

  useEffect(() => {
    if (!isHomePage || showTherapistHeader) {
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

      setHasPassedHomeHero(heroSection.getBoundingClientRect().bottom <= 92);
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
  }, [isHomePage, location.pathname, showTherapistHeader]);

  useEffect(() => {
    if (isHomePage && !showHeroMenuTrigger) {
      setOpen(false);
    }
  }, [isHomePage, showHeroMenuTrigger]);

  useEffect(() => {
    if (showTherapistHeader) {
      setNavTone("default");
      return;
    }

    if (!showMainNavbar) {
      setNavTone("default");
      return;
    }

    let frameId = 0;
    let immediateTimeoutId = 0;
    let delayedTimeoutId = 0;

    const resolveToneAtPoint = (x: number, y: number): "default" | "inverse" => {
      const navElement = navRef.current;
      const navShell = navShellRef.current;

      if (!navElement || !navShell) {
        return "default";
      }

      const stackedElements = document.elementsFromPoint(x, y);

      for (const element of stackedElements) {
        if (!(element instanceof HTMLElement) || navElement.contains(element)) {
          continue;
        }

        const themedAncestor = element.closest<HTMLElement>("[data-nav-theme]");

        if (!themedAncestor) {
          return "default";
        }

        return themedAncestor.dataset.navTheme === "inverse" ? "inverse" : "default";
      }

      return "default";
    };

    const updateTone = () => {
      const navShell = navShellRef.current;

      if (!navShell) {
        return;
      }

      const bounds = navShell.getBoundingClientRect();
      const sampleY = Math.max(1, Math.min(window.innerHeight - 1, bounds.top + Math.min(bounds.height * 0.5, 42)));
      const sampleXs = [0.24, 0.5, 0.76].map((ratio) =>
        Math.max(1, Math.min(window.innerWidth - 1, bounds.left + bounds.width * ratio)),
      );
      const nextTone = sampleXs.some((sampleX) => resolveToneAtPoint(sampleX, sampleY) === "inverse")
        ? "inverse"
        : "default";

      setNavTone((currentTone) => (currentTone === nextTone ? currentTone : nextTone));
    };

    const queueToneUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateTone);
    };

    queueToneUpdate();
    immediateTimeoutId = window.setTimeout(queueToneUpdate, 0);
    delayedTimeoutId = window.setTimeout(queueToneUpdate, 180);

    window.addEventListener("scroll", queueToneUpdate, { passive: true });
    window.addEventListener("resize", queueToneUpdate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(immediateTimeoutId);
      window.clearTimeout(delayedTimeoutId);
      window.removeEventListener("scroll", queueToneUpdate);
      window.removeEventListener("resize", queueToneUpdate);
    };
  }, [location.pathname, open, previewPath, showMainNavbar, showTherapistHeader]);

  const handleDesktopHover = (href: string) => {
    clearPendingPreview();

    if (href !== location.pathname) {
      previewHoverTimeoutRef.current = window.setTimeout(() => {
        setPreviewPath(href);
        previewHoverTimeoutRef.current = null;
      }, NAV_PREVIEW_DELAY_MS);
    }
  };

  const handleNavMouseLeave = () => {
    clearPendingPreview();
    clearPreviewPath();
    setMenuHoverPath(null);
  };

  const handleLinkClick = () => {
    clearPendingPreview();
    clearPreviewPath();
    setMenuHoverPath(null);
    closeMenu({ instant: true });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const handleMenuActionClick = () => {
    clearPendingPreview();
    clearPreviewPath();
    setMenuHoverPath(null);
    closeMenu({ instant: true });
  };

  const handleTherapistLogout = () => {
    void logoutTherapist();
    clearPendingPreview();
    clearPreviewPath();
    setMenuHoverPath(null);
    closeMenu();
    navigate("/", { replace: true });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    toast.success("Therapist session closed.");
  };

  const handleMenuTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    menuTouchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleMenuTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const startY = menuTouchStartYRef.current;
    const currentY = event.touches[0]?.clientY;

    if (startY === null || typeof currentY !== "number") {
      return;
    }

    if (Math.abs(currentY - startY) >= MENU_SWIPE_CLOSE_THRESHOLD) {
      menuTouchStartYRef.current = null;
      closeMenu();
    }
  };

  const handleMenuTouchEnd = () => {
    menuTouchStartYRef.current = null;
  };

  return (
    <nav
      ref={navRef}
      className="fixed left-0 right-0 top-0 z-50 overflow-x-hidden"
      onMouseLeave={handleNavMouseLeave}
      style={{ backgroundColor: showTherapistHeader ? undefined : "transparent" }}
    >
      <div
        className={`mx-auto transition-[padding] duration-300 ease-out ${
          showHeroMenuTrigger
            ? "max-w-7xl px-4 pt-12 sm:px-6 sm:pt-14 md:px-8 md:pt-14 lg:px-10 lg:pt-14"
            : showTherapistHeader
            ? "max-w-6xl px-4 pt-3 sm:px-6 sm:pt-4"
            : shouldFloatHomeMobileNav
              ? "container px-3 pt-5 sm:px-4 sm:pt-4"
              : "container px-3 pt-3 sm:px-4 sm:pt-4"
        }`}
      >
        {showMainNavbar ? (
          <div
            ref={navShellRef}
            className={cn(
              "flex min-h-[4.5rem] items-center justify-between gap-3 rounded-[2rem] px-3 py-3 transition-[background-color,border-color,box-shadow,color] duration-300 ease-out sm:h-20 sm:rounded-full sm:px-5",
              showTherapistHeader
                ? "bg-white/10 shadow-[0_20px_40px_-32px_rgba(35,72,61,0.16)]"
                : isInverseTone
                  ? "bg-transparent shadow-none backdrop-blur-none md:border md:border-white/20 md:bg-white/10 md:shadow-[0_18px_40px_-32px_rgba(7,13,11,0.46)] md:backdrop-blur-xl"
                  : "bg-transparent shadow-none backdrop-blur-none md:bg-background/80 md:shadow-[0_18px_40px_-32px_rgba(35,72,61,0.28)] md:backdrop-blur-xl",
            )}
          >
            <div className="relative ml-2 min-w-0 shrink origin-left sm:ml-0">
              <img
                src={leafDecor}
                alt=""
                className="pointer-events-none absolute -left-4 -top-4 z-0 w-16 opacity-24 animate-float md:hidden"
              />
              <div className="relative z-10 scale-[0.96] sm:scale-[1.04]">
                <WellnessLogo variant="navbar" tone={isInverseTone ? "inverse" : "default"} />
              </div>
            </div>

            {showTherapistHeader ? (
              <div className="flex shrink-0 items-center justify-end gap-2">
                {!isTherapistPortal ? (
                  <Button variant="hero" size="sm" className="rounded-full px-2.5 text-xs sm:px-5 sm:text-sm" asChild>
                    <Link to="/therapist/portal" onClick={handleLinkClick}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="max-[390px]:hidden">Dashboard</span>
                    </Link>
                  </Button>
                ) : null}
                <Button
                  variant="heroBorder"
                  size="sm"
                  className="rounded-full px-2.5 text-xs sm:px-5 sm:text-sm"
                  onClick={handleTherapistLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="max-[390px]:hidden">Logout</span>
                </Button>
              </div>
            ) : (
              <>
                <div className="hidden items-center gap-2 md:flex">
                  {navLinks.map((link) => {
                    const isActive = matchesPath(activePath, link.href);

                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        onMouseEnter={() => handleDesktopHover(link.href)}
                        onClick={handleLinkClick}
                        className={cn(
                          "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ease-out",
                          isInverseTone
                            ? isActive
                              ? "bg-white/20 text-white hover:bg-white/20 hover:text-white"
                              : "text-white/80 hover:bg-white/10 hover:text-white"
                            : isActive
                              ? "bg-primary/10 text-primary hover:bg-primary/16 hover:text-primary"
                              : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}

                  <Button
                    variant={isInverseTone ? "heroBorder" : "hero"}
                    size="sm"
                    className={cn(
                      "ml-3 rounded-full px-5 ease-out transition-all duration-300",
                      isInverseTone &&
                        "border-white/35 bg-white/8 text-white shadow-[0_18px_36px_-24px_rgba(7,13,11,0.45)] hover:bg-white hover:text-foreground",
                    )}
                    asChild
                  >
                    <Link
                      to="/booking"
                      onMouseEnter={() => handleDesktopHover("/booking")}
                      onClick={handleLinkClick}
                      style={{ transitionDuration: "100ms" }}
                    >
                      Book a Session
                    </Link>
                  </Button>
                </div>

                <button
                  type="button"
                  className={cn(
                    "h-12 w-12 rounded-xl bg-transparent p-0 shadow-none backdrop-blur-none transition-colors duration-300 ease-out hover:bg-transparent md:hidden",
                    isInverseTone
                      ? "border-transparent text-white hover:text-white/78"
                      : "border-transparent text-primary hover:text-primary/80",
                  )}
                  onClick={toggleMenu}
                  aria-label="Toggle menu"
                  aria-expanded={open}
                >
                  {open ? <X size={22} className="mx-auto" /> : <Menu size={22} className="mx-auto" />}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              type="button"
              className="mt-1 h-11 w-11 bg-transparent p-0 text-primary shadow-none transition-all duration-300 ease-out hover:bg-transparent hover:text-primary/80 sm:mt-1.5 sm:h-12 sm:w-12"
              onClick={toggleMenu}
              aria-label="Open navigation menu"
              aria-expanded={open}
            >
              {open ? <X size={25} strokeWidth={3.1} className="mx-auto" /> : <Menu size={25} strokeWidth={3.1} className="mx-auto" />}
            </button>
          </div>
        )}

        {isMenuVisible && !showTherapistHeader ? (
          <div className="fixed inset-0 z-[70]" aria-label="Navigation menu">
            <div className="absolute inset-0 bg-transparent" onClick={closeMenu} aria-hidden="true" />

            <div
              className={cn(
                "absolute inset-x-0 top-0 h-[75svh] overflow-hidden rounded-none bg-[radial-gradient(circle_at_top_left,rgba(94,134,115,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(75,115,94,0.18),transparent_28%),linear-gradient(160deg,rgba(7,24,18,0.985)_0%,rgba(10,34,25,0.985)_48%,rgba(13,45,32,0.97)_100%)] text-white shadow-[0_34px_80px_-36px_rgba(3,8,6,0.8)] backdrop-blur-xl md:inset-0 md:h-full md:overflow-y-auto md:overscroll-contain md:no-scrollbar",
                isMenuClosing ? "animate-menu-sheet-out" : "animate-menu-sheet-in",
              )}
              data-nav-theme="inverse"
              onTouchStart={handleMenuTouchStart}
              onTouchMove={handleMenuTouchMove}
              onTouchEnd={handleMenuTouchEnd}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.01)_24%,rgba(255,255,255,0)_100%)]" />
              <img
                src={leafDecor}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[-7rem] right-[-4rem] z-0 w-[18rem] rotate-[8deg] opacity-[0.18] saturate-[0.62] brightness-[0.82] contrast-125 sm:bottom-[-8rem] sm:right-[-4rem] sm:w-[22rem] md:bottom-[-9rem] md:right-[-3rem] md:w-[30rem] lg:w-[34rem]"
              />
              <img
                src={leafDecor}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[10rem] right-[5rem] z-0 hidden w-[9.5rem] rotate-[24deg] opacity-[0.08] saturate-[0.58] brightness-[0.84] md:block lg:right-[6rem] lg:w-[11rem]"
              />

              <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 md:min-h-full md:px-10 md:pb-8 md:pt-7 lg:px-14 lg:pb-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 origin-left scale-[0.82] sm:scale-[0.92] md:scale-[1.08]">
                    <WellnessLogo variant="navbar" tone="inverse" />
                  </div>
                  <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/7 text-white/92 shadow-[0_18px_32px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md transition-colors hover:bg-white/14 hover:text-white sm:h-12 sm:w-12 md:h-14 md:w-14"
                    onClick={closeMenu}
                    aria-label="Close navigation menu"
                  >
                    <X size={24} strokeWidth={2.3} />
                  </button>
                </div>

                <div className="mt-3 flex min-h-0 flex-1 flex-col gap-4 sm:mt-4 sm:gap-4 md:mt-6 md:gap-5">
                  <div
                    className={cn(
                      "flex w-full max-w-[24rem] flex-col overflow-visible sm:max-w-[28rem] md:max-w-none md:pr-0",
                      isMenuClosing ? "animate-menu-links-curtain-out" : "",
                    )}
                  >
                    {navLinks.map((link, index) => {
                      const Icon = link.icon;
                      const isCurrentRoute = matchesPath(location.pathname, link.href);
                      const isHoveredRoute = matchesPath(activeMenuPath, link.href);

                      return (
                        <div
                          key={link.href}
                          className={cn(
                            "w-full",
                            !isCurrentRoute && index !== navLinks.length - 1 && "border-b border-white/14",
                            isCurrentRoute && "pb-1.5 sm:pb-2",
                          )}
                        >
                          <Link
                            to={link.href}
                            onClick={handleLinkClick}
                            onMouseEnter={() => setMenuHoverPath(link.href)}
                            onMouseLeave={() => setMenuHoverPath(null)}
                            className={cn(
                              "group flex w-full items-center gap-3 transition-all duration-200 sm:gap-4",
                              isMenuClosing ? "animate-menu-link-out" : "",
                              isCurrentRoute
                                ? "rounded-full bg-white/10 px-3.5 py-2 shadow-[0_24px_40px_-32px_rgba(0,0,0,0.95)] sm:px-4 sm:py-2.5 md:px-5 md:py-3"
                                : "px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-[0.9rem]",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.95rem] text-white/82 transition-all duration-300 sm:h-9 sm:w-9 md:h-11 md:w-11",
                                isCurrentRoute
                                  ? "border border-white/10 bg-[#57755d]/70 text-white shadow-[0_18px_30px_-24px_rgba(0,0,0,0.8)]"
                                  : "bg-transparent text-white/80 group-hover:text-white",
                              )}
                            >
                              <Icon className="h-[0.94rem] w-[0.94rem] sm:h-[1rem] sm:w-[1rem] md:h-[1.2rem] md:w-[1.2rem]" strokeWidth={2.1} />
                            </span>
                            <span
                              className={cn(
                                "font-normal tracking-[0.01em] text-white/92 transition-all duration-300",
                                isCurrentRoute
                                  ? "text-[1rem] sm:text-[1.06rem] md:text-[clamp(1rem,1.8vh,1.16rem)]"
                                  : "text-[0.92rem] sm:text-[0.98rem] md:text-[clamp(0.92rem,1.6vh,1.02rem)]",
                                isHoveredRoute && "underline decoration-[1.5px] underline-offset-6",
                              )}
                            >
                              {link.label}
                            </span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-1 flex w-full max-w-[24rem] flex-col gap-2.5 sm:max-w-[28rem] sm:gap-3 md:mx-auto md:max-w-[32rem] lg:max-w-[38rem]">
                    <div
                      className={cn(
                        "w-full",
                        isMenuClosing ? "animate-menu-link-out" : "",
                      )}
                    >
                      <Button
                        size="lg"
                        className="h-10 w-full rounded-full border border-white/18 bg-[linear-gradient(180deg,rgba(250,247,242,0.98)_0%,rgba(237,245,238,0.94)_100%)] px-5 text-[0.88rem] font-normal text-[#173c2d] shadow-[0_26px_44px_-28px_rgba(234,245,234,0.66)] transition-all duration-300 hover:bg-[linear-gradient(180deg,rgba(252,249,245,1)_0%,rgba(243,248,243,0.96)_100%)] hover:text-[#10271d] sm:h-11 sm:text-[0.96rem] md:h-13 md:text-[1.08rem]"
                        asChild
                      >
                        <Link to="/booking" onClick={handleLinkClick}>
                          <CalendarDays className="h-[1rem] w-[1rem] md:h-[1.35rem] md:w-[1.35rem]" />
                          Book a Session
                        </Link>
                      </Button>
                    </div>

                    <div
                      className={cn(
                        "flex items-center justify-center gap-2.5 sm:gap-3",
                        isMenuClosing ? "animate-menu-link-out" : "animate-menu-link-in",
                      )}
                    >
                      {menuQuickActions.map((action) => {
                        const ActionIcon = action.icon;
                        const shouldOpenNewTab = action.href?.startsWith("http");

                        if (action.to) {
                          return (
                            <Link
                              key={action.label}
                              to={action.to}
                              onClick={handleLinkClick}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/82 transition-colors duration-200 hover:bg-white/12 hover:text-white sm:h-11 sm:w-11"
                              aria-label={action.label}
                            >
                              <ActionIcon className="h-4 w-4 sm:h-[1.05rem] sm:w-[1.05rem]" strokeWidth={2.05} />
                            </Link>
                          );
                        }

                        return (
                          <a
                            key={action.label}
                            href={action.href}
                            target={shouldOpenNewTab ? "_blank" : undefined}
                            rel={shouldOpenNewTab ? "noreferrer" : undefined}
                            onClick={handleMenuActionClick}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/82 transition-colors duration-200 hover:bg-white/12 hover:text-white sm:h-11 sm:w-11"
                            aria-label={action.label}
                          >
                            <ActionIcon className="h-4 w-4 sm:h-[1.05rem] sm:w-[1.05rem]" strokeWidth={2.05} />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;
