import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";

import { useNavigationPreview } from "@/context/NavigationPreviewContext";
import { useWellnessHub } from "@/context/WellnessHubContext";
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
  const previewHoverTimeoutRef = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { previewPath, setPreviewPath, clearPreviewPath } = useNavigationPreview();
  const { isTherapistAuthenticated, logoutTherapist } = useWellnessHub();

  const activePath = previewPath ?? location.pathname;
  const isTherapistPortal = location.pathname.startsWith("/therapist/portal");
  const showTherapistHeader = isTherapistAuthenticated;

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
    <nav className="fixed left-0 right-0 top-0 z-50 overflow-x-hidden" onMouseLeave={handleNavMouseLeave} style={{ backgroundColor: showTherapistHeader ? undefined : "transparent" }}>
      <div
        className={`mx-auto pt-3 sm:pt-4 ${
          showTherapistHeader ? "max-w-6xl px-4 sm:px-6" : "container px-3 sm:px-4"
        }`}
      >
        <div
          className={`flex min-h-[4.5rem] items-center justify-between gap-3 rounded-[2rem] px-3 py-3 sm:h-20 sm:rounded-full sm:px-5 ${
            showTherapistHeader
              ? "bg-white/10 shadow-[0_20px_40px_-32px_rgba(35,72,61,0.16)]"
              : "bg-transparent shadow-none backdrop-blur-none md:bg-background/80 md:shadow-[0_18px_40px_-32px_rgba(35,72,61,0.28)] md:backdrop-blur-xl"
          }`}
        >
          <div className="relative min-w-0 shrink origin-left ml-2 sm:ml-0">
            <img
              src={leafDecor}
              alt=""
              className="pointer-events-none absolute -left-4 -top-4 z-0 w-16 opacity-24 animate-float md:hidden"
            />
            <div className="relative z-10 scale-[0.96] sm:scale-[1.04]">
              <WellnessLogo variant="navbar" />
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
                      style={{ transitionDuration: "100ms" }}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ease-out ${
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/16 hover:text-primary"
                          : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                <Button variant="hero" size="sm" className="ml-3 rounded-full px-5 ease-out" asChild>
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
                className="rounded-full border border-white/45 bg-background/65 p-3 text-foreground shadow-[0_12px_24px_-18px_rgba(35,72,61,0.28)] backdrop-blur-md transition-colors hover:bg-background/80 md:hidden"
                onClick={() => setOpen((value) => !value)}
                aria-label="Toggle menu"
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          )}
        </div>

        {open && !showTherapistHeader ? (
          <div className="glass-nav mt-3 rounded-[2rem] px-5 py-5 md:hidden" style={{ animation: "slideDown 0.2s ease-out" }}>
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={handleLinkClick}
                  className="block rounded-2xl px-4 py-3 text-center text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <Button variant="hero" size="sm" className="mt-4 w-full rounded-full" asChild>
              <Link to="/booking" onClick={handleLinkClick}>
                Book a Session
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;
