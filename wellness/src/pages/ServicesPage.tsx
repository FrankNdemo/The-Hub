import { Link } from "react-router-dom";
import {
  Baby,
  BookHeart,
  Brain,
  Briefcase,
  Church,
  Heart,
  Rainbow,
  Ribbon,
  Scale,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { pageHeaderBackgrounds, softPageBackgroundStyle } from "@/lib/pageBackground";
import {
  servicePageFamilyImage,
  servicePageIndividualImage,
  servicePageSpecializedImage,
} from "@/lib/serviceImages";

const featuredServices = [
  {
    image: servicePageIndividualImage,
    imageAlt: "A Black male client speaking with a therapist during an individual counseling session",
    title: "Individual Therapy",
    description: "One-on-one support for anxiety, stress, depression, burnout, and emotional growth using a calm, collaborative pace.",
    imageClassName: "object-[center_42%] sm:object-[center_48%] lg:object-[center_54%]",
  },
  {
    image: servicePageFamilyImage,
    imageAlt: "An African couple sharing a calm and connected moment together on a couch at home",
    title: "Family and Relationship Support",
    description: "Guided sessions that improve communication, reduce tension, and help families reconnect with more empathy.",
    imageClassName: "object-[center_40%] sm:object-[center_46%] lg:object-[center_52%]",
  },
  {
    image: servicePageSpecializedImage,
    imageAlt: "A Black male client sitting on a couch and talking with a therapist in a bright office",
    title: "Specialized Therapeutic Care",
    description: "Focused support for trauma, neurodivergence, grief, oncopsychology, LGBTQ+ wellbeing, and existential concerns.",
    imageClassName: "object-[center_48%] sm:object-[center_52%] lg:object-[center_56%]",
  },
];

const serviceList = [
  { icon: Heart, title: "Individual Therapy", description: "Gentle CBT-based support for anxiety, low mood, stress, and self-understanding." },
  { icon: Users, title: "Family Therapy", description: "A shared space for healthier communication, clearer boundaries, and steadier family connection." },
  { icon: Baby, title: "Child and Adolescent Support", description: "Age-appropriate care for young people navigating emotional, behavioral, and developmental challenges." },
  { icon: Briefcase, title: "Corporate Wellness", description: "Supportive workplace wellbeing programs, consultancy, and mental health training for teams." },
  { icon: Brain, title: "Trauma and CBT", description: "Evidence-based therapeutic care for people healing from painful experiences and recurring emotional triggers." },
  { icon: Shield, title: "Anxiety and Mental Health", description: "Structured emotional support for panic, overwhelm, generalized anxiety, and related concerns." },
  { icon: Sparkles, title: "Neurodivergence", description: "Strengths-based support for ADHD, autism, dyslexia, dyspraxia, and neurodivergent identity work." },
  { icon: Ribbon, title: "Oncopsychology", description: "Compassionate psychological care for people and families affected by cancer and treatment journeys." },
  { icon: BookHeart, title: "Grief and Loss", description: "Support for bereavement, life transitions, and the emotional weight of meaningful endings." },
  { icon: Rainbow, title: "LGBTQ+ Support", description: "Affirming therapy that honours identity, safety, relationships, and mental wellbeing." },
  { icon: Church, title: "Religious and Existential Therapy", description: "Open exploration of meaning, faith, purpose, doubt, and spiritual complexity." },
  { icon: Scale, title: "Bariatric Psychology", description: "Psychological support for people preparing for or adjusting to weight management surgery journeys." },
];

const ServicesPage = () => (
  <div className="min-h-screen" style={softPageBackgroundStyle}>
    <PageHeader
      title="Our Services"
      contentClassName="pt-6 sm:pt-8 lg:pt-10"
      descriptionClassName="mt-6 sm:mt-8"
      description="It's okay to not be okay, but you don't have to stay there."
      detailLabel="What to expect"
      detailItems={[
        "Virtual and in-person sessions tailored to real life.",
        "Evidence-based support with a calm, collaborative pace.",
        "Care across individual, family, and specialized needs.",
      ]}
      backgroundImage={pageHeaderBackgrounds.services.src}
      backgroundPosition={pageHeaderBackgrounds.services.position}
      backgroundImageClassName={pageHeaderBackgrounds.services.className}
    />

    <section className="pb-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-4xl text-center">
          <p className="text-base leading-8 text-muted-foreground md:text-[1.02rem]">
            Life gets heavy sometimes.but Our services are here to help you unpack, heal, and grow at your pace, in your
            way with Real support. Real change. Explore services designed to help you heal, grow, and take back
            control of your life.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {featuredServices.map((service) => (
            <div key={service.title} className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-card">
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
                <h2 className="font-heading text-3xl font-semibold text-foreground">{service.title}</h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{service.description}</p>
                <Button variant="hero" className="mt-6 w-full rounded-full sm:w-auto" asChild>
                  <Link to="/booking">Book This Service</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="rounded-[2.25rem] bg-secondary/40 px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-primary/75">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>WHAT WE OFFER</span>
            </p>
            <h2 className="mx-auto mt-5 font-heading text-4xl font-semibold leading-[1.04] text-foreground md:text-5xl">
              <span className="sm:hidden">Awareness today, better mental health tomorrow</span>
              <span className="hidden sm:block">
                Awareness today, better mental
                <br />
                health tomorrow
              </span>
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {serviceList.map((service) => (
              <div
                key={service.title}
                className="group wellness-panel rounded-[2rem] border border-border/60 p-6 text-center shadow-[0_20px_40px_-32px_rgba(35,72,61,0.34)] transition-all duration-300 ease-out hover:-translate-y-3 hover:shadow-[0_28px_56px_-28px_rgba(35,72,61,0.42)]"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/16">
                  <service.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-heading text-3xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                  {service.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="pb-24 pt-10">
      <div className="container mx-auto px-4">
        <div className="rounded-[2.25rem] border border-border/60 bg-card px-6 py-8 text-center shadow-card sm:px-8">
          <h2 className="font-heading text-4xl font-semibold text-foreground">Not sure where to start?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-8">
            That is completely okay. Reach out or book a first session and we will help you choose the right care path.
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
              <Link to="/contact">Get In Touch</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default ServicesPage;
