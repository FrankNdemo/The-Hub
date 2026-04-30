import { Link } from "react-router-dom";
import { ExternalLink, MapPin } from "lucide-react";

import { useWellnessHub } from "@/context/WellnessHubContext";
import TherapistPortalAccess from "./TherapistPortalAccess";
import WellnessLogo from "./WellnessLogo";

const quickLinkColumns = [
  [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Services", to: "/services" },
    { label: "Team", to: "/team" },
  ],
  [
    { label: "Blog", to: "/blog" },
    { label: "FAQs", to: "/#faqs" },
    { label: "Contact", to: "/contact" },
    { label: "Book a Session", to: "/booking" },
  ],
];

const WELLNESS_HUB_MAP_URL = "https://maps.app.goo.gl/CzPK4ad5eeTAANLP6?g_st=aw";

const Footer = () => {
  const { therapist, isTherapistAuthenticated } = useWellnessHub();
  const mapLocationLines = ["1st Floor Realite Building", "Crescent Lane off Parklands Road"];
  const mapQuery = "Real Lite by Broadcom, Nairobi";
  const mapHref = WELLNESS_HUB_MAP_URL;
  const mapEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=18&hl=en&output=embed`;
  const handleRouteLinkClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  if (isTherapistAuthenticated) {
    return null;
  }

  return (
    <footer className="bg-foreground py-14" data-nav-theme="inverse">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 text-center md:grid-cols-[1.2fr_0.8fr_0.8fr] md:text-left">
          <div>
            <div className="inline-flex max-w-full">
              <WellnessLogo variant="footer" />
            </div>
            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-primary-foreground/70 md:mx-0">
              Compassionate therapy and consultancy for corporates, adults, adolescents, and families seeking calmer,
              more supported lives.
            </p>
            <p className="mt-4 text-sm text-primary-foreground/55">
              {therapist.location[0] ?? "Nairobi, Westlands"}
              <br />
              Tuesday to Saturday, 10:00 AM to 7:00 PM
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-lg font-medium text-primary-foreground">Quick Links</h4>
            <div className="mx-auto grid max-w-[18rem] grid-cols-2 gap-x-8 text-left md:mx-0">
              {quickLinkColumns.map((column, index) => (
                <div key={`quick-links-column-${index}`} className="space-y-3">
                  {column.map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      onClick={handleRouteLinkClick}
                      className="block text-sm text-primary-foreground/65 transition-colors hover:text-primary-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-lg font-medium text-primary-foreground">Contact</h4>
            <div className="space-y-3 text-sm text-primary-foreground/65">
              <p>{therapist.phone}</p>
              <p>{therapist.email}</p>
              {therapist.location.slice(1).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-4 text-center">
            <h4 className="font-heading text-lg font-medium text-primary-foreground">Find us</h4>
            <p className="mt-2 text-sm text-primary-foreground/65">Your path to care starts here. Tap for directions.</p>
          </div>

          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="group mx-auto block w-[18rem] max-w-full overflow-hidden border border-white/12 bg-white/5 transition-all duration-300 hover:border-white/20 hover:shadow-[0_24px_48px_-32px_rgba(6,12,10,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-foreground md:mx-auto md:w-3/4 md:max-w-3xl"
            aria-label={`Open map for ${mapQuery}`}
          >
            <div className="relative h-32 overflow-hidden sm:h-40 md:h-64">
              <iframe
                title="The Wellness Hub location map"
                src={mapEmbedSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="pointer-events-none absolute -top-12 left-0 h-[calc(100%+3rem)] w-full border-0 sm:-top-14 sm:h-[calc(100%+3.5rem)]"
              />
              <div className="pointer-events-none absolute hidden border border-primary-foreground/18 bg-primary text-left text-primary-foreground shadow-[0_16px_34px_-24px_rgba(6,12,10,0.65)] sm:left-3 sm:top-3 sm:block sm:w-auto sm:max-w-sm sm:rounded-xl sm:p-3 md:left-4 md:top-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground/14 text-primary-foreground sm:h-9 sm:w-9">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/72 sm:gap-1.5 sm:text-xs sm:tracking-[0.18em]">
                      Open in Maps
                      <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </span>
                    <span className="mt-0.5 block truncate text-[0.68rem] font-semibold leading-4 text-primary-foreground sm:mt-1 sm:text-sm sm:leading-5">
                      {mapLocationLines[0]}
                      <span className="hidden sm:inline">
                        <br />
                        {mapLocationLines[1]}
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-white/12 bg-primary px-3 py-2 text-left text-primary-foreground sm:hidden">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/14">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/72">
                  Open in Maps
                  <ExternalLink className="h-3 w-3" />
                </span>
                <span className="mt-0.5 block truncate text-xs font-semibold leading-4 text-primary-foreground">
                  {mapLocationLines[0]}
                </span>
              </span>
            </div>
          </a>
        </div>

        <div className="mt-10 border-t border-primary-foreground/10 pt-8 text-center">
          <p className="text-sm text-primary-foreground/45">(c) 2026 The Wellness Hub. All rights reserved.</p>
          <TherapistPortalAccess />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
