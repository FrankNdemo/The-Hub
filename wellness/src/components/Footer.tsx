import { Link } from "react-router-dom";

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
  const mapQuery = "Real Lite by Broadcom, The Crescent, Nairobi";
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
            <div className="relative h-32 sm:h-40 md:h-64">
              <iframe
                title="The Wellness Hub location map"
                src={mapEmbedSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="pointer-events-none h-full w-full border-0"
              />
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
