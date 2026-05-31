import { type FormEvent, useState } from "react";
import { Clock3, Mail, MapPin, MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";

import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import LeafBannerHeading from "@/components/LeafBannerHeading";
import PageHeader from "@/components/PageHeader";
import WellnessLogo from "@/components/WellnessLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { emptyContactDraft, useFormDrafts } from "@/context/FormDraftContext";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { getApiErrorMessage, sendContactInquiry } from "@/lib/api";
import { pageHeaderBackgrounds, softPageBackgroundStyle } from "@/lib/pageBackground";

const WELLNESS_HUB_MAP_URL = "https://maps.app.goo.gl/CzPK4ad5eeTAANLP6?g_st=aw";
const contactGardenImage =
  "https://images.pexels.com/photos/8121670/pexels-photo-8121670.jpeg?auto=compress&cs=tinysrgb&w=1400&h=650&fit=crop";

const ContactPage = () => {
  const { therapist } = useWellnessHub();
  const { contactDraft, setContactDraft } = useFormDrafts();
  const [sent, setSent] = useState(false);
  const [showMobileSentPopup, setShowMobileSentPopup] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mapArea = therapist.location[0] ?? "Nairobi, Westlands";
  const locationLines = [mapArea, ...therapist.location.slice(1)];
  const mapHref = WELLNESS_HUB_MAP_URL;
  const emailHref = `mailto:${therapist.email}`;
  const whatsappNumber = therapist.phone.replace(/\D/g, "");
  const whatsappHref = `https://wa.me/${whatsappNumber}`;
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
    { icon: Mail, title: "Email", lines: [therapist.email], href: emailHref, actionLabel: "Tap to email" },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      lines: [therapist.phone],
      href: whatsappHref,
      target: "_blank",
      rel: "noreferrer",
      actionLabel: "Open WhatsApp",
    },
    { icon: Clock3, title: "Hours", lines: ["Tuesday to Saturday", "10:00 AM to 7:00 PM"] },
  ];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = contactDraft.name.trim();
    const email = contactDraft.email.trim();
    const mobile = contactDraft.whatsappMobile.trim();
    const subject = contactDraft.subject.trim() || "General enquiry";
    const message = contactDraft.message.trim();

    setIsSending(true);
    try {
      await sendContactInquiry({ name, email, whatsappMobile: mobile, subject, message });
      setSent(true);
      setContactDraft(emptyContactDraft);
      const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches;

      if (isDesktop) {
        window.requestAnimationFrame(() => {
          document.getElementById("contact-message-area")?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      } else {
        setShowMobileSentPopup(true);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Your inquiry could not be sent right now."));
    } finally {
      setIsSending(false);
    }
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
          "Call, WhatsApp, or send a message whenever you feel ready.",
          "Visit the practice in Westlands or book support online.",
          "We keep the first step simple, private, and clear.",
        ]}
        backgroundImage={pageHeaderBackgrounds.contact.src}
        backgroundPosition={pageHeaderBackgrounds.contact.position}
      />

      <section className="pb-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="hidden space-y-5 lg:block">
              <div className="text-center lg:text-left">
                <LeafBannerHeading
                  eyebrow="Contact details"
                  title="Everything you need in one place"
                  className="w-full"
                  innerClassName="px-6 py-6 sm:px-7 sm:py-7"
                  titleClassName="text-4xl"
                />
                <p className="mt-4 text-muted-foreground leading-8">
                  Prefer a direct route? Call, WhatsApp, or visit the centre. We keep the process calm and clear from the
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
              className="scroll-mt-28 overflow-hidden rounded-none border border-border/60 bg-card p-6 shadow-card sm:p-8"
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
                <div className="mt-8 hidden rounded-[1.75rem] bg-primary/8 p-8 text-center sm:block">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/12 text-primary">
                    <Send className="h-8 w-8" />
                  </div>
                  <h3 className="mt-5 font-heading text-3xl font-semibold text-foreground">Inquiry sent</h3>
                  <p className="mt-3 text-muted-foreground leading-8">
                    Your message has been sent to the therapist team. The first therapist to reply will mark it as
                    replied for everyone else.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="contact-name" className="text-primary">Your name</Label>
                      <Input
                        id="contact-name"
                        name="name"
                        value={contactDraft.name}
                        onChange={(event) => setContactDraft((current) => ({ ...current, name: event.target.value }))}
                        className="mt-2"
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-mobile" className="text-primary">WhatsApp mobile number</Label>
                      <Input
                        id="contact-mobile"
                        name="whatsappMobile"
                        type="tel"
                        value={contactDraft.whatsappMobile}
                        onChange={(event) => setContactDraft((current) => ({ ...current, whatsappMobile: event.target.value }))}
                        className="mt-2"
                        placeholder="+254 7XX XXX XXX"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="contact-subject" className="text-primary">Subject</Label>
                      <Input
                        id="contact-subject"
                        name="subject"
                        value={contactDraft.subject}
                        onChange={(event) => setContactDraft((current) => ({ ...current, subject: event.target.value }))}
                        className="mt-2"
                        placeholder="How can we help?"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-email" className="text-primary">Email address</Label>
                      <Input
                        id="contact-email"
                        name="email"
                        type="email"
                        value={contactDraft.email}
                        onChange={(event) => setContactDraft((current) => ({ ...current, email: event.target.value }))}
                        className="mt-2"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contact-message" className="text-primary">Message</Label>
                    <Textarea
                      id="contact-message"
                      name="message"
                      value={contactDraft.message}
                      onChange={(event) => setContactDraft((current) => ({ ...current, message: event.target.value }))}
                      className="mt-2 min-h-[170px]"
                      placeholder="Tell us a little about what you are looking for."
                      required
                    />
                  </div>
                  <Button variant="hero" size="lg" className="w-full rounded-none" type="submit" disabled={isSending}>
                    {isSending ? "Sending..." : "Send Inquiry"}
                  </Button>
                  <div className="hidden overflow-hidden lg:block">
                    <img
                      src={contactGardenImage}
                      alt="People sitting together in a green park"
                      loading="lazy"
                      className="h-48 w-full object-cover object-center"
                    />
                  </div>
                </form>
              )}
            </div>
          </div>
          <div className="mx-auto mt-10 max-w-6xl overflow-hidden lg:hidden">
            <img
              src={contactGardenImage}
              alt="People sitting together in a green park"
              loading="lazy"
              className="h-44 w-full object-cover object-center sm:h-52 lg:h-56"
            />
          </div>
        </div>
      </section>

      {showMobileSentPopup ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/24 px-4 py-5 backdrop-blur-[5px] sm:hidden">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-success-title"
            className="relative max-h-[calc(100svh-2rem)] w-full max-w-[21.5rem] overflow-y-auto rounded-[1.85rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,250,0.96),rgba(239,247,239,0.94))] px-5 pb-6 pt-5 text-center shadow-[0_32px_72px_-34px_rgba(15,32,25,0.5)] backdrop-blur-2xl"
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowMobileSentPopup(false);
              }}
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-primary/12 bg-white/76 text-primary shadow-soft"
              aria-label="Close inquiry confirmation"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,hsl(136_22%_88%_/_0.34),transparent_28%),radial-gradient(circle_at_86%_78%,hsl(42_31%_88%_/_0.42),transparent_30%)]" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="scale-[0.66]">
                <WellnessLogo variant="footer" />
              </div>
              <div className="mt-1 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/12 text-primary shadow-soft">
                <Send className="h-8 w-8" />
              </div>
              <h3 id="contact-success-title" className="mt-5 font-heading text-3xl font-semibold text-foreground">
                Inquiry sent
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Your message has been sent to the therapist team. The first therapist to reply will mark it as replied.
              </p>
              <Button
                type="button"
                variant="hero"
                className="mt-6 w-full rounded-full"
                onClick={() => setShowMobileSentPopup(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <FAQSection />
      <Footer />
    </div>
  );
};

export default ContactPage;
