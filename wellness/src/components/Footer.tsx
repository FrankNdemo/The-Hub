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
  const mapEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=k&z=18&hl=en&ie=UTF8&iwloc=A&output=embed`;
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

        <div className="mt-12" data-mobile-contact-hide>
          <div className="mb-4 text-center">
            <h4 className="font-heading text-lg font-medium text-primary-foreground">Find us</h4>
            <p className="mt-2 text-sm text-primary-foreground/65">Your path to care starts here. Tap for directions.</p>
          </div>

          <div className="group mx-auto block w-full max-w-5xl overflow-hidden rounded-none border border-primary-foreground/28 bg-white/5 shadow-none transition-all duration-300 hover:border-white/20 md:rounded-[1.75rem] md:border-white/12 md:shadow-[0_24px_52px_-34px_rgba(6,12,10,0.62)] md:hover:shadow-[0_30px_64px_-34px_rgba(6,12,10,0.72)]">
            <div className="relative h-[20rem] overflow-hidden bg-primary/20 sm:h-[22rem] md:h-[24rem] lg:h-[28rem]">
              <iframe
                title="The Wellness Hub location map"
                src={mapEmbedSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-x-0 top-0 h-[12.5rem] w-full border-0 grayscale-[0.12] contrast-[1.04] saturate-[1.18] sm:h-[14rem] md:inset-0 md:h-full"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-28 bg-gradient-to-t from-foreground/48 via-foreground/12 to-transparent md:block" />
              <div className="absolute inset-x-0 bottom-0 min-h-[7.5rem] w-full rounded-none border-t border-primary-foreground/22 bg-primary p-4 text-left text-primary-foreground shadow-none sm:min-h-[8rem] sm:p-5 md:bottom-auto md:left-0 md:right-auto md:top-0 md:min-h-[10rem] md:w-[min(25rem,100%)] md:rounded-br-2xl md:rounded-tl-[1.75rem] md:border md:border-primary-foreground/18 md:p-5 md:shadow-[0_20px_44px_-24px_rgba(6,12,10,0.75)] lg:p-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-primary-foreground md:h-10 md:w-10 md:rounded-full md:bg-primary-foreground/14">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <a
                      href={mapHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/78 transition-colors hover:text-primary-foreground md:hidden"
                      aria-label={`Open map for ${mapQuery}`}
                    >
                      Open in Maps
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <span className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/72 md:flex">
                      Find us here
                    </span>
                    <span className="mt-1 block text-sm font-semibold leading-5 text-primary-foreground sm:text-base sm:leading-6">
                      {mapLocationLines[0]}
                      <br />
                      {mapLocationLines[1]}
                    </span>
                    <a
                      href={mapHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 hidden items-center gap-2 rounded-full border border-primary-foreground/28 bg-primary-foreground/14 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 md:inline-flex"
                      aria-label={`Open map for ${mapQuery}`}
                    >
                      Open in Maps
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </div>
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
