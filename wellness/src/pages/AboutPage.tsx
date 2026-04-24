import { Link } from "react-router-dom";
import { Eye, Heart, Leaf, Shield, Sun, Target } from "lucide-react";

import aboutImg from "@/assets/about-therapy.jpg";
import approachBg from "@/assets/about-approach-session.jpg";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { pageHeaderBackgrounds, softPageBackgroundStyle } from "@/lib/pageBackground";

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
  "https://images.pexels.com/photos/5699426/pexels-photo-5699426.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop";

const AboutPage = () => {
  const { therapist } = useWellnessHub();

  return (
    <div className="min-h-screen" style={softPageBackgroundStyle}>
    <PageHeader
      title="About Us"
      contentClassName="pt-6 sm:pt-8 lg:pt-10"
      descriptionClassName="mt-6 sm:mt-8"
      description="“You don’t have to figure it out alone.”"
      detailLabel="What guides us"
      detailItems={[
        "Compassionate care grounded in evidence-based therapy.",
        "Support for individuals, families, and organizations across Africa.",
        "A practice designed to feel calm, clear, and deeply personal.",
      ]}
      backgroundImage={pageHeaderBackgrounds.about.src}
      backgroundPosition={pageHeaderBackgrounds.about.position}
    />

    <section className="pb-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="order-2 relative mx-auto w-full max-w-xl lg:order-1">
            <div className="overflow-hidden rounded-[2.25rem] shadow-card">
              <img src={aboutImg} alt="Therapy space" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-8 right-6 hidden h-28 w-28 overflow-hidden rounded-[1.5rem] border-4 border-background shadow-hover md:block">
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
      <div className="container mx-auto px-0 md:px-4">
        <div
          className="relative overflow-hidden border-y border-border/60 bg-[linear-gradient(135deg,hsl(42_31%_99%),hsl(42_31%_97%))] px-6 py-10 shadow-card md:rounded-[2.5rem] md:border md:px-8 lg:px-10 lg:py-12"
          data-nav-theme="inverse"
        >
          <img
            src={aboutValueBackgroundImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-[center_28%] opacity-[0.9] contrast-[1.12] saturate-[1.08]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(42_31%_99%_/_0.14),hsl(42_31%_98%_/_0.08),hsl(42_31%_97%_/_0.1))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(203_94%_92%_/_0.04),transparent_24%),radial-gradient(circle_at_top_right,hsl(31_100%_91%_/_0.06),transparent_28%),radial-gradient(circle_at_bottom_left,hsl(42_40%_96%_/_0.08),transparent_30%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0.02))]" />

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
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="wellness-panel rounded-[2rem] border border-border/60 p-7 text-center shadow-card lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Mission</p>
            <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground">To improve mental health outcomes with compassionate, evidence-based care.</h2>
            <p className="mt-4 text-muted-foreground leading-8">
              We support individuals and communities through therapy and wellbeing guidance that helps people feel more
              understood, better resourced, and more able to thrive.
            </p>
          </div>

          <div className="wellness-panel rounded-[2rem] border border-border/60 p-7 text-center shadow-card lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Vision</p>
            <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground">A world where every person can discover their best self.</h2>
            <p className="mt-4 text-muted-foreground leading-8">
              We imagine a future where mental wellness is accessible, prioritized, and free from stigma, and where
              people feel supported enough to live purposeful inner lives.
            </p>
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
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-border/60 px-6 py-8 shadow-card lg:px-8 lg:py-10">
          <img
            src={approachBg}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-[center_32%] opacity-95 contrast-[1.02] saturate-[1.02]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(42_31%_98%_/_0.34),hsl(42_31%_98%_/_0.08),hsl(42_31%_97%_/_0.28))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(42_31%_99%_/_0.1),transparent_42%)]" />

          <div className="relative z-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Our approach</p>
            <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground md:text-5xl">
              Healing that feels human, thoughtful, and grounded.
            </h2>
          </div>

          <div className="relative z-10 mt-10 grid gap-6 md:grid-cols-3">
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
