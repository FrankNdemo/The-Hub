import { useEffect, useState, type SVGProps } from "react";
import { useLocation } from "react-router-dom";

import { useWellnessHub } from "@/context/WellnessHubContext";
import { cn } from "@/lib/utils";

const WhatsAppIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const DesktopWhatsAppFloat = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { therapist } = useWellnessHub();
  const location = useLocation();
  const whatsappNumber = therapist.phone.replace(/\D/g, "");
  const shouldHide = isMenuOpen || !whatsappNumber || location.pathname.startsWith("/therapist");
  const shouldFloatLeft = location.pathname === "/booking" || location.pathname === "/contact";

  useEffect(() => {
    const handleMenuState = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      setIsMenuOpen(Boolean(detail?.open));
    };

    window.addEventListener("wellness-mobile-menu-state", handleMenuState);
    return () => window.removeEventListener("wellness-mobile-menu-state", handleMenuState);
  }, []);

  if (shouldHide) {
    return null;
  }

  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Talk to us on WhatsApp"
      className={cn(
        "fixed bottom-6 z-[65] hidden items-center gap-3 rounded-full border border-[#25D366]/30 bg-white/92 px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] text-primary shadow-[0_22px_48px_-26px_rgba(15,32,25,0.45)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_28px_54px_-26px_rgba(15,32,25,0.55)] md:flex",
        shouldFloatLeft ? "left-6" : "right-6",
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5e8673] text-primary-foreground shadow-[0_14px_28px_-18px_rgba(94,134,115,0.8)]">
        <WhatsAppIcon className="h-6 w-6" />
      </span>
      <span>Talk to us</span>
    </a>
  );
};

export default DesktopWhatsAppFloat;
