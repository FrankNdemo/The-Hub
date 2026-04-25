import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";

import { useNavigationPreview } from "@/context/NavigationPreviewContext";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { cn } from "@/lib/utils";
import leafDecor from "@/assets/leaf-decoration.png";
import { Button } from "@/components/ui/button";
import WellnessLogo from "./WellnessLogo";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Team", href: "/team" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const NAV_PREVIEW_DELAY_MS = 100;

const matchesPath = (currentPath: string, href: string) => {
  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasPassedHomeHero, setHasPassedHomeHero] = useState(true);
  const [navTone, setNavTone] = useState<"default" | "inverse">("default");
  const navRef = useRef<HTMLElement | null>(null);
  const navShellRef = useRef<HTMLDivElement | null>(null);
  const previewHoverTimeoutRef = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { previewPath, setPreviewPath, clearPreviewPath } = useNavigationPreview();
  const { isTherapistAuthenticated, logoutTherapist } = useWellnessHub();

  const activePath = previewPath ?? location.pathname;
  const isHomePage = location.pathname === "/";
  const isTherapistPortal = location.pathname.startsWith("/therapist/portal");
  const showTherapistHeader = isTherapistAuthenticated;
  const showHeroMenuTrigger = !showTherapistHeader && isHomePage && !hasPassedHomeHero;
  const showMainNavbar = showTherapistHeader || !isHomePage || hasPassedHomeHero;
  const shouldFloatHomeMobileNav = !showTherapistHeader && isHomePage && hasScrolled && hasPassedHomeHero;
  const isInverseTone = navTone === "inverse";

  const clearPendingPreview = () => {
    if (previewHoverTimeoutRef.current !== null) {
      window.clearTimeout(previewHoverTimeoutRef.current);
      previewHoverTimeoutRef.current = null;
    }
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
  };

  const handleLinkClick = () => {
    clearPendingPreview();
    clearPreviewPath();
    setOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const handleTherapistLogout = () => {
    void logoutTherapist();
    clearPendingPreview();
    clearPreviewPath();
    setOpen(false);
    navigate("/", { replace: true });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    toast.success("Therapist session closed.");
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
                  onClick={() => setOpen((value) => !value)}
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
              onClick={() => setOpen((value) => !value)}
              aria-label="Open navigation menu"
              aria-expanded={open}
            >
              {open ? <X size={25} strokeWidth={3.1} className="mx-auto" /> : <Menu size={25} strokeWidth={3.1} className="mx-auto" />}
            </button>
          </div>
        )}

        {open && !showTherapistHeader ? (
          showHeroMenuTrigger ? (
            <div
              className="mt-3 ml-auto w-full max-w-[18.5rem] rounded-[2rem] border border-white/40 bg-[rgba(250,247,242,0.9)] px-5 py-5 shadow-[0_24px_54px_-28px_rgba(35,72,61,0.38)] backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 ease-out"
              style={{ animation: "slideDown 0.2s ease-out" }}
            >
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={handleLinkClick}
                    className="block rounded-2xl px-4 py-3 text-center text-sm font-medium text-foreground/82 transition-colors duration-300 hover:bg-primary/6 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <Button variant="hero" size="sm" className="mt-4 w-full rounded-full transition-all duration-300" asChild>
                <Link to="/booking" onClick={handleLinkClick}>
                  Book a Session
                </Link>
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "mt-3 rounded-[2rem] px-5 py-5 transition-[background-color,border-color,box-shadow] duration-300 ease-out md:hidden",
                isInverseTone
                  ? "border border-white/10 bg-foreground/34 shadow-[0_18px_40px_-28px_rgba(7,13,11,0.5)] backdrop-blur-xl"
                  : "glass-nav",
              )}
              style={{ animation: "slideDown 0.2s ease-out" }}
            >
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "block rounded-2xl px-4 py-3 text-center text-sm transition-colors duration-300",
                      isInverseTone
                        ? "text-white/80 hover:bg-white/10 hover:text-white"
                        : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <Button
                variant={isInverseTone ? "heroBorder" : "hero"}
                size="sm"
                className={cn(
                  "mt-4 w-full rounded-full transition-all duration-300",
                  isInverseTone &&
                    "border-white/35 bg-white/8 text-white shadow-[0_18px_36px_-24px_rgba(7,13,11,0.45)] hover:bg-white hover:text-foreground",
                )}
                asChild
              >
                <Link to="/booking" onClick={handleLinkClick}>
                  Book a Session
                </Link>
              </Button>
            </div>
          )
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;
