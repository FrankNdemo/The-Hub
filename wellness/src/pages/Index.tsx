import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarClock, Eye, Leaf, Lock, Quote, ShieldCheck, Sun, Video } from "lucide-react";

import aboutImg from "@/assets/about-therapy.jpg";
import leafDecor from "@/assets/leaf-decoration.png";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import HeroSection from "@/components/HeroSection";
import JourneyQuoteSection from "@/components/JourneyQuoteSection";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { useWellnessHub } from "@/context/WellnessHubContext";
import {
  familyServiceImage,
  homeSpecializedSupportImage,
  homepageApproachImage,
  individualServiceImage,
} from "@/lib/serviceImages";

const whyChooseUs = [
  {
    icon: ShieldCheck,
    title: "Certified Therapists",
    description: "Work with trained, compassionate professionals who balance clinical expertise with warmth.",
  },
  {
    icon: CalendarClock,
    title: "Flexible Scheduling",
    description: "Choose a session time that respects the demands of work, school, family, and recovery.",
  },
  {
    icon: Video,
    title: "Virtual and Physical Sessions",
    description: "Meet online or visit the centre in person depending on what feels most supportive.",
  },
  {
    icon: Lock,
    title: "Confidential and Safe",
    description: "Your story is treated with care, privacy, and a calm professional atmosphere from start to finish.",
  },
];

const homepageAwarenessImage =
  "https://images.pexels.com/photos/7979455/pexels-photo-7979455.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop";
const homepageCtaImage =
  "https://images.pexels.com/photos/7275311/pexels-photo-7275311.jpeg?auto=compress&cs=tinysrgb&w=1800&h=1200&fit=crop";
const homepageCloserLookImage =
  "https://images.pexels.com/photos/33837391/pexels-photo-33837391.jpeg?auto=compress&cs=tinysrgb&w=1400&h=1200&fit=crop";

const featuredServices = [
  {
    image: individualServiceImage,
    imageAlt: "A Black woman in a calm one-on-one therapy session with a counselor in a bright office",
    title: "Individual Therapy",
    description: "Gentle, evidence-based support for anxiety, stress, depression, and personal growth.",
    imageClassName: "object-[center_46%] sm:object-[center_50%] lg:object-[center_54%]",
  },
  {
    image: familyServiceImage,
    imageAlt: "A calm Black family sharing time together in a bright living room setting",
    title: "Family and Adolescent Care",
    description: "Guided support for communication, emotional regulation, transitions, and healthier family dynamics.",
    imageClassName: "object-[center_36%] sm:object-[center_42%] lg:object-[center_48%]",
  },
  {
    image: homeSpecializedSupportImage,
    imageAlt: "An African male client speaking during a therapy session with a clinician seated opposite him",
    title: "Specialized Wellness Support",
    description: "Thoughtful care for trauma, grief, neurodivergence, oncopsychology, LGBTQ+ wellbeing, and more.",
    imageClassName: "object-[center_44%] sm:object-[center_50%] lg:object-[center_56%]",
  },
];

const testimonials = [
  {
    text: "The Wellness Hub helped me slow down, name what I was carrying, and finally feel like I had tools I could trust.",
    name: "Sarah M.",
    role: "Individual Therapy Client",
    image:
      "https://images.pexels.com/photos/17746102/pexels-photo-17746102.jpeg?auto=compress&cs=tinysrgb&w=240&h=240&fit=crop&crop=faces",
  },
  {
    text: "Our family conversations feel softer now. We are listening more, reacting less, and reconnecting in healthier ways.",
    name: "James K.",
    role: "Family Therapy Client",
    image:
      "https://images.pexels.com/photos/19379640/pexels-photo-19379640.jpeg?auto=compress&cs=tinysrgb&w=240&h=240&fit=crop&crop=faces",
  },
  {
    text: "The sessions brought clarity to our workplace wellbeing strategy and gave our team practical emotional support.",
    name: "Aisha N.",
    role: "Corporate Wellness Client",
    image:
      "https://images.pexels.com/photos/18500501/pexels-photo-18500501.jpeg?auto=compress&cs=tinysrgb&w=240&h=240&fit=crop&crop=faces",
  },
];

const approachPillars = [
  {
    icon: Leaf,
    title: "Holistic Healing",
    description: "We consider your emotional world, relationships, daily reality, and nervous system together.",
  },
  {
    icon: Sun,
    title: "Evidence-Based Care",
    description: "Support is grounded in proven therapeutic methods while still feeling warm, practical, and human.",
  },
  {
    icon: Eye,
    title: "Cultural Sensitivity",
    description: "Care is offered with respect for your background, values, lived experience, and wider context.",
  },
];

const ctaTypedPhrase = "Cherish yourself";
const careDescriptionQuote =
  "You do not have to carry everything alone. Healing grows in spaces where you feel safe, seen, and gently supported.";

const Index = () => {
  const { therapists } = useWellnessHub();
  const [typedCtaText, setTypedCtaText] = useState("");
  const [isDeletingCtaText, setIsDeletingCtaText] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const featuredTherapists = therapists;
  const activeTestimonial = testimonials[testimonialIndex];

  const showPreviousTestimonial = () => {
    setTestimonialIndex((current) => (current === 0 ? testimonials.length - 1 : current - 1));
  };

  const showNextTestimonial = () => {
    setTestimonialIndex((current) => (current + 1) % testimonials.length);
  };

  useEffect(() => {
    if (!isDeletingCtaText && typedCtaText === ctaTypedPhrase) {
      const timeoutId = window.setTimeout(() => setIsDeletingCtaText(true), 3000);
      return () => window.clearTimeout(timeoutId);
    }

    if (isDeletingCtaText && typedCtaText === "") {
      const timeoutId = window.setTimeout(() => setIsDeletingCtaText(false), 250);
      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      setTypedCtaText((current) =>
        isDeletingCtaText
          ? ctaTypedPhrase.slice(0, Math.max(0, current.length - 1))
          : ctaTypedPhrase.slice(0, current.length + 1),
      );
    }, isDeletingCtaText ? 70 : 120);

    return () => window.clearTimeout(timeoutId);
  }, [isDeletingCtaText, typedCtaText]);

  return (
    <div id="homepage-top" className="min-h-screen overflow-x-hidden">
      <HeroSection />
      <JourneyQuoteSection />

    <section className="bg-secondary/30 py-24">
      <div className="container mx-auto px-4">
        <ScrollReveal direction="left">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="text-center md:text-left">
              <p className="font-body text-sm uppercase tracking-[0.2em] text-primary">About Us</p>
              <h2 className="mt-2 font-heading text-4xl font-semibold text-foreground md:text-5xl">
                Empowering Your Mind and Heart
              </h2>
              <div className="mx-auto mb-6 mt-4 h-0.5 w-16 bg-primary/40 md:mx-0" />
              <p className="mb-4 leading-relaxed text-muted-foreground">
                At The Wellness Hub, our mission is to improve mental health in Africa by offering compassionate
                therapy and professional guidance. We envision a world where everyone discovers their best self.
              </p>

              <div className="my-6 grid gap-3">
                {[
                  "Authenticity - Be your true self.",
                  "Integrity - Ethical, compassionate care.",
                  "Purpose - A meaningful, fulfilling life.",
                ].map((value) => (
                  <div key={value} className="flex items-start justify-center gap-3 md:justify-start">
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <p className="text-muted-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <Button variant="hero" className="w-full sm:w-auto" asChild>
                <Link to="/about">Learn More About Us</Link>
              </Button>
            </div>

            <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl shadow-soft">
              <img src={aboutImg} alt="Peaceful therapy office" loading="lazy" className="h-auto w-full object-cover" />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>

    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-0 sm:px-4">
        <ScrollReveal direction="up">
          <div className="relative overflow-hidden rounded-none border-y border-border/60 shadow-card sm:rounded-[2.4rem] sm:border" data-nav-theme="inverse">
            <img
              src={homepageAwarenessImage}
              alt="A woman speaking with an African man and woman in a bright, supportive office conversation"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-[center_50%] sm:object-[center_50%] lg:object-[center_54%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,39,34,0.64),rgba(22,39,34,0.32),rgba(22,39,34,0.58))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(136_22%_90%_/_0.16),transparent_34%)]" />

            <div className="relative z-10 mx-auto flex min-h-[26rem] max-w-3xl flex-col items-center justify-center px-6 py-12 text-center sm:min-h-[30rem] sm:px-10">
              <h2 className="font-heading text-4xl font-semibold leading-[1.05] text-white [text-shadow:0_10px_30px_rgba(0,0,0,0.34)] sm:text-5xl">
                <span className="sm:hidden">Feel calm, safe, and supported from the first conversation</span>
                <span className="hidden sm:block">
                  Feel calm, safe, and supported
                  <br />
                  from the first conversation
                </span>
              </h2>
              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-white [text-shadow:0_4px_18px_rgba(0,0,0,0.32)] sm:text-lg">
                A clean, compassionate space where mental health support feels clear, human, and gently guided from the start.
              </p>
              <Button variant="hero" size="lg" className="mt-8 rounded-full px-8" asChild>
                <Link to="/#homepage-top">Learn More</Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>

    <section className="py-24">
      <div className="container mx-auto px-4">
        <ScrollReveal direction="up">
          <h2 className="text-center font-heading text-4xl font-semibold text-foreground md:text-5xl">
            Why Choose Us
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            What makes The Wellness Hub a trusted space for your mental health journey.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyChooseUs.map((item) => (
              <div
                key={item.title}
                className="wellness-panel rounded-2xl p-6 text-center shadow-card transition-shadow duration-300 hover:shadow-hover"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>

    <section className="py-16">
      <div className="container mx-auto px-4">
        <ScrollReveal direction="right">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Our services</p>
              <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground md:text-5xl">
                Care pathways designed around real life.
              </h2>
            </div>
            <Button variant="heroBorder" className="w-full rounded-full sm:w-auto" asChild>
              <Link to="/services">View All Services</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <div
                key={service.title}
                className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-hover"
              >
                <div className="h-60 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.imageAlt}
                    loading="lazy"
                    className={`h-full w-full object-cover transition-transform duration-500 hover:scale-105 ${
                      service.imageClassName ?? ""
                    }`}
                  />
                </div>
                <div className="wellness-panel p-6 text-center lg:text-left">
                  <h3 className="font-heading text-3xl font-semibold text-foreground">{service.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>

    <section className="bg-secondary/20 py-20">
      <div className="container mx-auto px-4">
        <ScrollReveal direction="up">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/60">Meet your therapist</p>
            <h2 className="mx-auto mt-5 max-w-2xl font-heading text-4xl font-semibold leading-tight text-foreground md:text-5xl">
                Care that understands you. Guidance you can trust.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              Connect with experienced therapists offering personalized support for your mental and emotional
              well-being.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-7xl gap-8 lg:grid-cols-2 xl:gap-10">
            {featuredTherapists.map((profile) => (
              <article
                key={profile.id}
                className="flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-border/60 bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-hover"
              >
                <div className="grid flex-1 gap-5 sm:grid-cols-[15rem_1fr] sm:items-start">
                  <div className="flex h-full flex-col">
                    <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-xl bg-primary/8 px-3 py-2 text-xs font-semibold text-primary sm:mx-0">
                      <ShieldCheck className="h-4 w-4" />
                      {profile.title}
                    </div>
                    <div className="mt-4 h-[18rem] overflow-hidden rounded-lg bg-secondary/35 sm:h-[19rem]">
                      <img
                        src={profile.image}
                        alt={profile.name}
                        loading="lazy"
                        className="h-full w-full object-contain object-top"
                      />
                    </div>
                  </div>
                  <div className="flex h-full flex-col justify-start px-1 pt-1 text-center sm:pt-12 sm:text-left">
                    <h3 className="font-heading text-3xl font-semibold leading-tight text-foreground">
                      {profile.name}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{profile.bio}</p>
                    <Button
                      variant="ghost"
                      className="mx-auto mt-5 h-auto min-h-11 max-w-full whitespace-normal rounded-full px-0 text-left text-sm font-semibold leading-5 text-primary hover:bg-transparent hover:text-primary sm:mx-0"
                      asChild
                    >
                      <Link to={`/team#${profile.id}`}>
                        <span>Learn more about {profile.name.split(" ")[0]}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>

    <section className="py-16">
      <div className="w-full px-0">
        <ScrollReveal direction="right">
          <div className="relative overflow-hidden border-y border-border/60 px-4 py-6 shadow-card sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <img
              src={homepageApproachImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-[center_44%] opacity-[0.97] brightness-[0.99] contrast-[1.04] saturate-[1.02] sm:object-[center_50%] lg:object-[center_56%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(42_31%_98%_/_0.48),hsl(42_31%_98%_/_0.14),hsl(42_31%_97%_/_0.4))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(42_31%_99%_/_0.22),transparent_40%)]" />

            <img
              src={leafDecor}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-2 top-2 w-20 opacity-20 sm:w-24"
            />
            <img
              src={leafDecor}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-2 top-2 hidden w-24 rotate-180 opacity-18 sm:block lg:w-28"
            />

            <div className="relative z-10 mx-auto max-w-7xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/75">Our approach</p>
              <h2 className="mx-auto mt-4 max-w-5xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-[4rem]">
                Healing that feels human, thoughtful, and grounded.
              </h2>
            </div>

            <div className="relative z-10 mx-auto mt-8 grid max-w-7xl gap-4 md:grid-cols-3 lg:mt-10 lg:gap-6">
              {approachPillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="group rounded-[2rem] border border-white/36 bg-[linear-gradient(180deg,hsl(42_31%_99%_/_0.7),hsl(42_31%_98%_/_0.56))] p-5 shadow-[0_24px_46px_-30px_rgba(35,72,61,0.24)] backdrop-blur-[10px] transition-all duration-300 hover:-translate-y-1 hover:border-white/50 hover:bg-[linear-gradient(180deg,hsl(42_31%_99%_/_0.8),hsl(42_31%_98%_/_0.64))] hover:shadow-[0_30px_55px_-30px_rgba(35,72,61,0.3)] sm:p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/24 bg-white/58 text-primary transition-all duration-300 group-hover:border-primary/34 group-hover:bg-white/74">
                    <pillar.icon className="h-[18px] w-[18px]" />
                  </div>
                  <h3 className="mt-5 text-center font-heading text-3xl font-semibold text-foreground [text-shadow:0_1px_6px_rgba(255,255,255,0.16)] md:text-left">
                    {pillar.title}
                  </h3>
                  <p className="mt-4 text-center text-sm font-medium leading-7 text-foreground/90 [text-shadow:0_1px_6px_rgba(255,255,255,0.12)] sm:text-[0.98rem] sm:leading-8 md:text-left">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>

    <section className="py-16">
      <div className="container mx-auto px-4">
        <ScrollReveal direction="left">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Client stories</p>
            <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground md:text-5xl">
              What our clients say
            </h2>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4 md:hidden">
            <button
              type="button"
              onClick={showPreviousTestimonial}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/15 bg-background text-primary shadow-soft transition-colors hover:bg-primary/8"
              aria-label="Previous client story"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={showNextTestimonial}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
              aria-label="Next client story"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <div className="ml-2 flex items-center gap-3">
              {testimonials.map((testimonial, index) => (
                <button
                  key={testimonial.name}
                  type="button"
                  onClick={() => setTestimonialIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    testimonialIndex === index ? "w-2 bg-primary" : "w-2 border border-primary/20 bg-transparent"
                  }`}
                  aria-label={`Show story ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 md:hidden">
            <div className="wellness-panel overflow-hidden rounded-[2rem] border border-border/60 p-7 shadow-[0_26px_48px_-28px_rgba(16,24,20,0.34)]">
              <Quote className="h-8 w-8 text-primary/30" />
              <p className="mt-4 italic leading-8 text-muted-foreground">{activeTestimonial.text}</p>
              <div className="mt-6 flex items-center gap-4 border-t border-border/60 pt-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-border/60 bg-background shadow-soft">
                  <img
                    src={activeTestimonial.image}
                    alt={activeTestimonial.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground">{activeTestimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{activeTestimonial.role}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pause-marquee relative mt-10 hidden overflow-hidden md:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-background to-transparent" />
            <div className="flex w-max gap-6 animate-testimonial-marquee">
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <div
                  key={`${testimonial.name}-${index}`}
                  className="wellness-panel w-[min(82vw,24rem)] shrink-0 overflow-hidden rounded-[2rem] border border-border/60 p-7 shadow-[0_26px_48px_-28px_rgba(16,24,20,0.34)]"
                >
                  <Quote className="h-8 w-8 text-primary/30" />
                  <p className="mt-4 italic leading-8 text-muted-foreground">{testimonial.text}</p>
                  <div className="mt-6 flex items-center gap-4 border-t border-border/60 pt-4">
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-border/60 bg-background shadow-soft">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>

    <section className="py-0 md:py-20">
      <div className="container mx-auto px-0 md:px-4">
        <ScrollReveal direction="up">
          <div className="relative min-h-[100svh] overflow-hidden shadow-hover md:min-h-0 md:rounded-[2.5rem]" data-nav-theme="inverse">
            <img
              src={homepageCtaImage}
              alt="A calm Black woman seated on a sofa near indoor plants in a bright wellness-inspired room"
              className="h-[100svh] w-full object-cover object-[56%_50%] brightness-[1.04] contrast-[1.04] saturate-[1.03] sm:h-[540px] sm:object-[54%_44%] md:h-[560px] md:object-[52%_40%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,37,31,0.24),rgba(26,37,31,0.34))] sm:bg-[linear-gradient(180deg,rgba(26,37,31,0.2),rgba(26,37,31,0.3))]" />
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center md:px-8">
              <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-foreground/70">
                  Start the next chapter gently
                </p>
                <h2 className="mt-4 font-heading text-[clamp(2rem,8vw,2.5rem)] font-semibold leading-[0.95] text-primary-foreground sm:text-4xl md:text-5xl lg:text-[3.6rem]">
                  <span className="block">Mental health is wealth.</span>
                  <span className="relative mt-2 block h-[1.1em] text-center">
                    <span className="invisible">Cherish yourself</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      {typedCtaText || "\u00A0"}
                      <span className="ml-1 inline-block h-[0.9em] w-px bg-primary-foreground/80 animate-pulse" />
                    </span>
                  </span>
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#f5ede0]">
                  Whether you need a first conversation, consistent therapy, or support for your family or workplace,
                  we can help you take the next step with care.
                </p>
                <div className="mt-8 grid w-full max-w-[22rem] grid-cols-2 gap-2.5 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center">
                  <Button
                    variant="hero"
                    size="lg"
                    className="h-10 min-w-0 rounded-full bg-background px-3 text-[0.78rem] tracking-normal text-foreground hover:bg-background/90 sm:h-11 sm:px-8 sm:text-sm"
                    asChild
                  >
                    <Link to="/booking">
                      <span className="sm:hidden">Book Session</span>
                      <span className="hidden sm:inline">Book Your First Session</span>
                    </Link>
                  </Button>
                  <Button
                    variant="heroBorder"
                    size="lg"
                    className="h-10 min-w-0 rounded-full border-primary-foreground/50 px-3 text-[0.78rem] tracking-normal text-primary-foreground hover:bg-primary-foreground hover:text-foreground sm:h-11 sm:px-8 sm:text-sm"
                    asChild
                  >
                    <Link to="/contact">
                      Contact Us
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>

    <section className="py-20">
      <div className="container mx-auto px-4">
        <ScrollReveal direction="right">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-primary/75">A closer look</p>
              <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground md:text-5xl">
                Feel calm, supported, and truly understood.
              </h2>
              <p className="mx-auto mt-5 max-w-5xl text-base leading-8 text-muted-foreground md:text-lg">
                From your first enquiry to each session that follows, we create room for thoughtful care, emotional
                safety, and practical support. The Wellness Hub blends professional guidance with warmth so healing can
                feel grounded in real life, not distant from it.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
              <div className="overflow-hidden rounded-[2.4rem] border border-border/60 bg-card shadow-card">
                <img
                  src={homepageCloserLookImage}
                  alt="Portrait of an African woman in a calm indoor setting"
                  loading="lazy"
                  className="h-full min-h-[20rem] w-full object-cover object-[center_24%] md:min-h-[24rem]"
                />
              </div>

              <div className="relative overflow-hidden rounded-[2.4rem] border border-primary/12 bg-[linear-gradient(180deg,hsl(149_36%_94%),hsl(150_34%_92%))] px-6 py-8 text-center shadow-[0_26px_50px_-34px_rgba(35,72,61,0.28)] sm:px-8 sm:py-10 md:flex md:min-h-[24rem] md:flex-col md:justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(42_31%_99%_/_0.42),transparent_40%)]" />
                <div className="relative z-10">
                  <Quote className="mx-auto h-14 w-14 text-primary/38" />
                  <p className="mx-auto mt-5 max-w-md font-body text-2xl leading-[1.55] text-primary md:text-[2rem]">
                    {careDescriptionQuote}
                  </p>
                  <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-primary/80">
                    The Wellness Hub
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>

    <section className="pb-24">
      <div className="container mx-auto px-4">
        <ScrollReveal
          direction="up"
          className="rounded-[2.25rem] border border-border/60 bg-card px-6 py-8 text-center shadow-card sm:px-8"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Ready when you are</p>
          <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground md:text-5xl">
            Choose support that meets you where you are.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-8">
            Book a first session, explore the blog, or send a message if you need help deciding what kind of support
            would fit best.
          </p>
          <div className="mt-8 grid w-full max-w-[22rem] grid-cols-2 gap-2.5 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center">
            <Button
              variant="hero"
              size="lg"
              className="h-10 min-w-0 rounded-full px-3 text-[0.78rem] tracking-normal sm:h-11 sm:px-8 sm:text-sm"
              asChild
            >
              <Link to="/booking">
                <span className="sm:hidden">Book Session</span>
                <span className="hidden sm:inline">Book Your First Session</span>
              </Link>
            </Button>
            <Button
              variant="heroBorder"
              size="lg"
              className="h-10 min-w-0 rounded-full px-3 text-[0.78rem] tracking-normal sm:h-11 sm:px-8 sm:text-sm"
              asChild
            >
              <Link to="/blog">
                <span className="sm:hidden">Explore Blog</span>
                <span className="hidden sm:inline">Explore the Blog</span>
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>

    <FAQSection />

    <Footer />
    </div>
  );
};

export default Index;
