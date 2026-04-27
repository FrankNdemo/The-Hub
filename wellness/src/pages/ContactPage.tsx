import { useState } from "react";
import { Clock3, Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";

import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import LeafBannerHeading from "@/components/LeafBannerHeading";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { pageHeaderBackgrounds, softPageBackgroundStyle } from "@/lib/pageBackground";

const ContactPage = () => {
  const { therapist } = useWellnessHub();
  const [sent, setSent] = useState(false);
  const mapArea = therapist.location[0] ?? "Nairobi, Westlands";
  const locationLines = [...therapist.location.slice(1), mapArea];
  const mapQuery = [...therapist.location.slice(1), mapArea].join(", ");
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const phoneHref = `tel:${therapist.phone.replace(/[^\d+]/g, "")}`;
  const emailHref = `mailto:${therapist.email}`;
  const contactItems = [
    {
      icon: MapPin,
      title: "Location",
      lines: locationLines,
      href: mapHref,
      target: "_blank",
      rel: "noreferrer",
      actionLabel: "Open in Google Maps",
    },
    { icon: Phone, title: "Phone", lines: [therapist.phone], href: phoneHref, actionLabel: "Tap to call" },
    {
      icon: Mail,
      title: "Email",
      lines: [therapist.email],
      href: emailHref,
      actionLabel: "Open email app",
    },
    { icon: Clock3, title: "Hours", lines: ["Tuesday to Saturday", "10:00 AM to 7:00 PM"] },
  ];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSent(true);
    toast.success("Your message has been sent.");
  };

  return (
    <div className="min-h-screen" style={softPageBackgroundStyle}>
      <PageHeader
        title="Contact"
        contentClassName="pt-6 sm:pt-8 lg:pt-10"
        descriptionClassName="mt-6 sm:mt-8"
        description="We don't just talk healing, we live it."
        detailLabel="Ways to connect"
        detailItems={[
          "Call, email, or send a message whenever you feel ready.",
          "Visit the practice in Westlands or book support online.",
          "We keep the first step simple, private, and clear.",
        ]}
        backgroundImage={pageHeaderBackgrounds.contact.src}
        backgroundPosition={pageHeaderBackgrounds.contact.position}
      />

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5">
              <div className="text-center lg:text-left">
                <LeafBannerHeading
                  eyebrow="Contact details"
                  title="Everything you need in one place"
                  className="w-full"
                  innerClassName="px-6 py-6 sm:px-7 sm:py-7"
                  titleClassName="text-4xl"
                />
                <p className="mt-4 text-muted-foreground leading-8">
                  Prefer a direct route? Call, email, or visit the centre. We keep the process calm and clear from the
                  first contact.
                </p>
              </div>

              {contactItems.map((item) => {
                const cardContent = (
                  <div
                    className={`wellness-panel rounded-[1.75rem] border border-border/60 p-5 shadow-card transition-all duration-300 ${
                      item.href
                        ? "cursor-pointer hover:-translate-y-1 hover:border-primary/30 hover:shadow-hover"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/75">{item.title}</p>
                        {item.lines.map((line) => (
                          <p key={line} className="mt-2 text-sm leading-7 text-muted-foreground">
                            {line}
                          </p>
                        ))}
                        {item.actionLabel ? (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/65">
                            {item.actionLabel}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );

                if (!item.href) {
                  return <div key={item.title}>{cardContent}</div>;
                }

                return (
                  <a
                    key={item.title}
                    href={item.href}
                    target={item.target}
                    rel={item.rel}
                    className="block rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
                    aria-label={`${item.title}: ${item.lines.join(", ")}`}
                  >
                    {cardContent}
                  </a>
                );
              })}
            </div>

            <div
              id="contact-message-area"
              className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-border/60 bg-card p-6 shadow-card sm:p-8"
            >
              <div className="text-center">
                <LeafBannerHeading
                  eyebrow="Send us a message"
                  title="We would love to hear from you"
                  align="center"
                  className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8"
                  innerClassName="px-6 py-6 sm:px-8 sm:py-7"
                  titleClassName="text-4xl"
                />
                <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-8">
                  Share a question, tell us what support you are looking for, or ask for help choosing a first step.
                </p>
              </div>

              {sent ? (
                <div className="mt-8 rounded-[1.75rem] bg-primary/8 p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/12 text-primary">
                    <Send className="h-8 w-8" />
                  </div>
                  <h3 className="mt-5 font-heading text-3xl font-semibold text-foreground">Message sent</h3>
                  <p className="mt-3 text-muted-foreground leading-8">
                    Thank you for reaching out. We will get back to you as soon as possible.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="contact-name" className="text-primary">Your name</Label>
                      <Input id="contact-name" className="mt-2" placeholder="Full name" required />
                    </div>
                    <div>
                      <Label htmlFor="contact-email" className="text-primary">Email address</Label>
                      <Input id="contact-email" type="email" className="mt-2" placeholder="you@example.com" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contact-subject" className="text-primary">Subject</Label>
                    <Input id="contact-subject" className="mt-2" placeholder="How can we help?" />
                  </div>
                  <div>
                    <Label htmlFor="contact-message" className="text-primary">Message</Label>
                    <Textarea
                      id="contact-message"
                      className="mt-2 min-h-[170px]"
                      placeholder="Tell us a little about what you are looking for."
                      required
                    />
                  </div>
                  <Button variant="hero" size="lg" className="w-full rounded-full" type="submit">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
      <Footer />
    </div>
  );
};

export default ContactPage;
