import { Link } from "react-router-dom";
import { Eye, Heart, Leaf, Shield, Sprout, Sun, Target } from "lucide-react";

import aboutImg from "@/assets/about-therapy.jpg";
import founderGichiaImg from "@/assets/founder-gichia-cutout.png";
import leafDecor from "@/assets/leaf-decoration.png";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ParallaxBackgroundImage from "@/components/ParallaxBackgroundImage";
import { Button } from "@/components/ui/button";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { pageHeaderBackgrounds, softPageBackgroundStyle } from "@/lib/pageBackground";
import { getWhatsAppHref } from "@/lib/whatsapp";

const values = [
  { icon: Heart, title: "Authenticity", description: "A space where you can be honest, human, and emotionally unguarded without fear of judgment." },
  { icon: Shield, title: "Integrity", description: "Ethical, respectful care that keeps trust, confidentiality, and professional clarity at the centre." },
  { icon: Target, title: "Purpose", description: "Support that helps you move toward a more aligned, meaningful, and emotionally grounded life." },
];

const pillars = [
  { icon: Leaf, title: "Holistic Healing", description: "We consider your emotional world, daily reality, relationships, and nervous system together." },
  { icon: Sun, title: "Evidence-Based Care", description: "Support is grounded in proven therapeutic methods, especially CBT, while still feeling human and warm." },
  { icon: Eye, title: "Cultural Sensitivity", description: "Care is offered with respect for your background, context, values, and lived experience." },
];

const aboutValueBackgroundImage =
  "https://images.pexels.com/photos/5700164/pexels-photo-5700164.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop";

const aboutApproachBackgroundImage =
  "https://images.pexels.com/photos/30688913/pexels-photo-30688913.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop";

const aboutMissionBackgroundImage =
  "https://images.pexels.com/photos/6621441/pexels-photo-6621441.jpeg?auto=compress&cs=tinysrgb&w=900&h=1100&fit=crop";

const aboutVisionBackgroundImage =
  "https://images.pexels.com/photos/6621452/pexels-photo-6621452.jpeg?auto=compress&cs=tinysrgb&w=900&h=1100&fit=crop";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M27.1 4.7A15.1 15.1 0 0 0 3.4 22.8L2 30l7.4-1.9A15.1 15.1 0 0 0 27.1 4.7Z"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.4 9.4c-.3 0-.7.1-1 .5-.4.4-1.4 1.4-1.4 3.4s1.5 4 1.7 4.3c.2.3 3 4.7 7.3 6.3 3.6 1.4 4.3.9 5.1.8.8-.1 2.5-1 2.8-2 .4-1 .4-1.8.3-2-.1-.2-.4-.3-.8-.5l-2.9-1.4c-.4-.2-.7-.2-1 .2-.3.4-1.1 1.4-1.4 1.7-.2.3-.5.3-.9.1a11.7 11.7 0 0 1-5.9-5.2c-.2-.4 0-.7.2-.9l.7-.8c.2-.3.3-.4.5-.7.1-.3.1-.5 0-.7l-1.3-3c-.3-.8-.7-.8-1-.8h-.9Z"
      fill="currentColor"
    />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="2.6" />
    <circle cx="16" cy="16" r="5.1" stroke="currentColor" strokeWidth="2.6" />
    <circle cx="22" cy="10.2" r="1.5" fill="currentColor" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6l16.6 20h3.5L9.5 6H6Z" fill="currentColor" />
    <path d="M6 26 14.1 16 22 6h4L17.8 16 10 26H6Z" fill="currentColor" />
  </svg>
);

const AboutPage = () => {
  const { therapist } = useWellnessHub();
  const whatsappHref = getWhatsAppHref(therapist.phone);
  const founderSocials = [
    { label: "WhatsApp", icon: WhatsAppIcon },
    { label: "Instagram", icon: InstagramIcon },
    { label: "X (Twitter)", icon: XIcon },
  ];

  return (
    <div className="min-h-screen" style={softPageBackgroundStyle}>
      <PageHeader
        title="About Us"
        contentClassName="pt-6 sm:pt-8 lg:pt-10"
        descriptionClassName="mt-6 sm:mt-8"
        description="You don't have to figure it out alone."
        detailLabel="What guides us"
        detailItems={[
          "Compassionate care grounded in evidence-based therapy.",
          "Support for individuals, families, and organizations across Africa.",
          "A practice designed to feel calm, clear, and deeply personal.",
        ]}
        backgroundImage={pageHeaderBackgrounds.about.src}
        backgroundPosition={pageHeaderBackgrounds.about.position}
        backgroundImageClassName={pageHeaderBackgrounds.about.className}
      />

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="order-2 relative mx-auto w-full max-w-xl pb-12 sm:pb-14 lg:order-1 lg:pb-0">
              <div className="overflow-hidden rounded-[2.25rem] shadow-card">
                <img src={aboutImg} alt="Therapy space" className="h-full w-full object-cover" />
              </div>
              <div className="absolute -bottom-6 right-4 h-24 w-24 overflow-hidden rounded-[1.5rem] border-4 border-background shadow-hover sm:-bottom-7 sm:right-5 sm:h-28 sm:w-28 md:-bottom-8 md:right-6">
                <img src={therapist.image} alt={`${therapist.name} portrait`} className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="order-1 text-center lg:order-2 lg:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Our story</p>
              <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground">Professional support that still feels deeply personal.</h2>
              <p className="mt-5 text-muted-foreground leading-8">
                The Wellness Hub was founded with a simple conviction: mental health care should not feel cold,
                inaccessible, or intimidating. It should feel safe enough for honesty and structured enough for progress.
              </p>
              <p className="mt-4 text-muted-foreground leading-8">
                Based in Nairobi, the practice supports clients across Africa through both virtual and in-person care,
                offering a steady space for reflection, healing, emotional insight, and sustainable growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-0 md:py-16">
        <div className="w-full px-0">
          <div
            className="relative overflow-hidden border-y border-border/60 bg-[linear-gradient(135deg,hsl(42_31%_99%),hsl(42_31%_97%))] px-6 py-10 shadow-card md:px-8 lg:px-10 lg:py-14 2xl:py-20"
            data-nav-theme="inverse"
          >
            <ParallaxBackgroundImage
              src={aboutValueBackgroundImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-[center_70%] opacity-[0.94] brightness-[0.62] contrast-[1.02] saturate-[0.82] sm:object-[center_72%] md:object-[center_74%] 2xl:object-[center_76%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(24,33,30,0.82),rgba(24,33,30,0.5),rgba(24,33,30,0.78))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(145_24%_34%_/_0.18),transparent_30%),radial-gradient(circle_at_bottom_right,hsl(42_34%_26%_/_0.18),transparent_34%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0.01))]" />

            <div className="relative z-10 mx-auto max-w-4xl">
              <div className="px-2 py-4 text-center sm:px-4 sm:py-6">
                <div className="inline-flex items-center justify-center">
                  <p className="text-[0.95rem] font-semibold uppercase tracking-[0.28em] text-white [text-shadow:0_10px_26px_rgba(0,0,0,0.38)]">Our value</p>
                </div>
                <h2 className="mt-5 font-heading text-4xl font-semibold leading-tight text-white [text-shadow:0_12px_34px_rgba(0,0,0,0.34)] md:text-5xl lg:text-[3.6rem]">
                  Rooted in hope, guided by care, built on genuine human connection.
                </h2>
                <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-white [text-shadow:0_10px_24px_rgba(0,0,0,0.34)] md:text-lg">
                  Healing works best when care feels collaborative. We create space for encouragement, practical guidance,
                  and shared progress so each client feels supported, respected, and never alone in the process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
            <div className="relative min-h-[30rem] overflow-hidden rounded-[1.65rem] border border-border/70 bg-card p-8 text-center shadow-card sm:p-10 lg:text-left">
              <img
                src={aboutMissionBackgroundImage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-45"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(42_31%_99%_/_0.96),hsl(42_31%_99%_/_0.78),hsl(42_31%_99%_/_0.38))]" />
              <div className="relative z-10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center text-primary">
                  <Sprout className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.34em] text-primary/75">Mission</p>
                <h2 className="mt-5 max-w-md font-heading text-[2rem] font-semibold leading-tight text-foreground sm:text-[2.35rem]">
                  To improve mental health outcomes with compassionate, evidence-based care.
                </h2>
                <div className="mx-auto mt-6 h-px w-16 bg-primary/45" />
                <p className="mt-6 max-w-md text-sm font-medium leading-7 text-muted-foreground">
                  We support individuals and communities through therapy and wellbeing guidance that helps people feel more
                  understood, better resourced, and more able to thrive.
                </p>
              </div>
            </div>

            <div className="relative min-h-[30rem] overflow-hidden rounded-[1.65rem] border border-primary/20 bg-primary p-8 text-center text-primary-foreground shadow-card sm:p-10 lg:text-left">
              <img
                src={aboutVisionBackgroundImage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-center opacity-48"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--primary)_/_0.98),hsl(var(--primary)_/_0.82),hsl(var(--primary)_/_0.42))]" />
              <div className="relative z-10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center text-primary-foreground/88">
                  <Eye className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.34em] text-primary-foreground/76">Vision</p>
                <h2 className="mt-5 max-w-md font-heading text-[2rem] font-semibold leading-tight text-primary-foreground sm:text-[2.35rem]">
                  A world where every person can discover their best self.
                </h2>
                <div className="mx-auto mt-6 h-px w-16 bg-primary-foreground/55" />
                <p className="mt-6 max-w-md text-sm font-medium leading-7 text-primary-foreground/82">
                  We imagine a future where mental wellness is accessible, prioritized, and free from stigma, and where
                  people feel supported enough to live purposeful lives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Core values</p>
            <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground md:text-5xl">The principles behind the work</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="wellness-panel rounded-[2rem] border border-border/60 p-6 text-center shadow-card">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <value.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-heading text-3xl font-semibold text-foreground">{value.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="w-full px-0">
          <div className="relative overflow-hidden border-y border-border/60 px-6 py-8 shadow-card lg:px-8 lg:py-12 2xl:py-16">
            <ParallaxBackgroundImage
              src={aboutApproachBackgroundImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-[center_52%] opacity-[0.96] brightness-[0.74] contrast-[1.03] saturate-[0.9] sm:object-[center_54%] lg:object-[center_58%] 2xl:object-[center_60%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(42_31%_98%_/_0.58),hsl(42_31%_98%_/_0.2),hsl(42_31%_97%_/_0.52))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(42_31%_99%_/_0.18),transparent_42%)]" />

            <div className="relative z-10 mx-auto max-w-7xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Our approach</p>
              <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground md:text-5xl">
                Healing that feels human, thoughtful, and grounded.
              </h2>
            </div>

            <div className="relative z-10 mx-auto mt-10 grid max-w-7xl gap-6 md:grid-cols-3">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="group rounded-[2rem] border border-white/42 bg-[linear-gradient(180deg,hsl(42_31%_99%_/_0.2),hsl(42_31%_98%_/_0.1))] p-6 text-center shadow-[0_24px_46px_-30px_rgba(35,72,61,0.18)] backdrop-blur-[4px] transition-all duration-300 hover:-translate-y-2 hover:border-white/58 hover:bg-[linear-gradient(180deg,hsl(42_31%_99%_/_0.3),hsl(42_31%_98%_/_0.16))] hover:shadow-[0_30px_55px_-30px_rgba(35,72,61,0.24)]"
                >
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/26 bg-white/28 text-primary transition-all duration-300 group-hover:border-primary/34 group-hover:bg-white/40">
                    <pillar.icon className="h-[18px] w-[18px]" />
                  </div>
                  <h3 className="mt-5 font-heading text-[2rem] font-semibold text-foreground transition-all duration-300 [text-shadow:0_1px_6px_rgba(255,255,255,0.16)] group-hover:font-bold">
                    {pillar.title}
                  </h3>
                  <p className="mt-4 text-[0.98rem] font-medium leading-8 text-foreground/90 transition-all duration-300 [text-shadow:0_1px_6px_rgba(255,255,255,0.12)] group-hover:text-foreground">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-4 text-[#d99a2b]">
              <span className="h-px w-14 bg-current sm:w-24" />
              <p className="text-base font-semibold uppercase text-[#d99a2b] sm:text-xl">Meet the</p>
              <span className="h-px w-14 bg-current sm:w-24" />
            </div>
            <h2 className="founder-script relative mx-auto mt-1 inline-flex pb-3 text-6xl font-bold leading-none text-foreground sm:text-7xl md:text-8xl">
              <span>Founder</span>
              <span className="absolute bottom-0 left-[8%] h-[0.18rem] w-[86%] -rotate-2 rounded-full bg-foreground" />
            </h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-[92rem] overflow-hidden bg-background shadow-card lg:grid-cols-[1.12fr_0.88fr] 2xl:max-w-[104rem]">
            <div className="relative flex min-h-[420px] items-end justify-start overflow-hidden bg-background sm:min-h-[520px] lg:min-h-[620px] 2xl:min-h-[700px]">
              <img
                src={founderGichiaImg}
                alt={`${therapist.name}, founder of The Wellness Hub`}
                className="h-full min-h-[420px] w-[112%] max-w-none -translate-x-[5%] object-contain object-bottom drop-shadow-[0_28px_44px_hsl(var(--foreground)/0.22)] sm:min-h-[520px] lg:min-h-[620px] lg:w-[118%] lg:-translate-x-[9%] 2xl:min-h-[700px] 2xl:w-[122%] 2xl:-translate-x-[11%]"
              />
            </div>

            <div className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden bg-foreground px-6 py-12 text-center text-primary-foreground sm:px-10 lg:min-h-[620px] lg:px-12 2xl:min-h-[700px] 2xl:px-16">
              <div className="relative z-10 -mt-10 sm:-mt-14 lg:ml-auto lg:max-w-[34rem]">
                <h3 className="font-heading text-3xl font-semibold leading-tight text-[#d99a2b] sm:text-4xl 2xl:text-5xl">
                  Dr. Caroline Gichia
                </h3>
                <div className="mt-5 font-heading text-6xl leading-none text-[#d99a2b]">“</div>
                <p className="mx-auto mt-2 max-w-sm text-2xl font-semibold leading-snug sm:text-3xl 2xl:max-w-md 2xl:text-[2.35rem]">
                  Rewriting mental wellness through meaningful human connection.
                </p>
                <div className="mx-auto mt-8 flex max-w-xs items-center justify-center gap-3 text-[#d99a2b]">
                  <span className="h-px flex-1 bg-current" />
                  <Leaf className="h-6 w-6" strokeWidth={1.7} />
                  <span className="h-px flex-1 bg-current" />
                </div>

                <div className="mt-9 grid grid-cols-3 divide-x divide-[#d99a2b]/60">
                  {founderSocials.map((social) => (
                    <a
                      key={social.label}
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${social.label} - open WhatsApp`}
                      className="group flex min-h-[94px] flex-col items-center justify-center px-3 text-primary-foreground transition-colors duration-300 hover:text-[#d99a2b]"
                    >
                      <social.icon className="h-10 w-10 sm:h-12 sm:w-12" />
                      <span className="mt-3 text-[0.62rem] font-bold uppercase sm:text-xs">{social.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="rounded-[2.25rem] border border-border/60 bg-card px-6 py-8 text-center shadow-card sm:px-8">
            <h2 className="font-heading text-4xl font-semibold text-foreground">Ready to begin your journey?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-8">
              Start with a first session or reach out if you want help deciding what type of support would fit best.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-2.5 sm:flex sm:flex-row sm:justify-center">
              <Button
                variant="hero"
                size="lg"
                className="h-10 min-w-0 rounded-full px-3 text-[0.78rem] tracking-normal sm:h-11 sm:w-auto sm:px-8 sm:text-sm"
                asChild
              >
                <Link to="/booking">Book a Session</Link>
              </Button>
              <Button
                variant="heroBorder"
                size="lg"
                className="h-10 min-w-0 rounded-full px-3 text-[0.78rem] tracking-normal sm:h-11 sm:w-auto sm:px-8 sm:text-sm"
                asChild
              >
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
