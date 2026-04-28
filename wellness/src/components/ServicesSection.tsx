import { Link } from "react-router-dom";
import { Brain, Briefcase, Heart, Shield, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  familyServiceImage,
  individualServiceImage,
  specializedServiceImage,
} from "@/lib/serviceImages";

const featuredServices = [
  {
    img: individualServiceImage,
    title: "Individual Support",
    desc: "Personalized therapy for adults facing challenges with stress, anxiety, depression, and finding healing from trauma.",
  },
  {
    img: familyServiceImage,
    title: "Family & Adolescent Support",
    desc: "Support for families, children, and teens addressing emotional, behavioral, and developmental challenges.",
  },
  {
    img: specializedServiceImage,
    title: "Specialized Care",
    desc: "Expert care for trauma, bariatric psychology, neurodivergence (ADHD, Autism, Dyslexia, Dyspraxia), oncopsychology, grief, LGBTQ+, and existential issues.",
  },
];

const allServices = [
  { icon: Heart, title: "Individual Therapy", desc: "One-on-one CBT-based sessions for anxiety, depression, and personal growth." },
  { icon: Users, title: "Family Therapy", desc: "Strengthen family bonds and communication patterns." },
  { icon: Brain, title: "Trauma & CBT", desc: "Evidence-based approaches to heal from traumatic experiences." },
  { icon: Briefcase, title: "Corporate Wellness", desc: "Training, consultancy, and employee assistance programs." },
  { icon: Shield, title: "Grief & Loss Support", desc: "Compassionate guidance through life's most difficult transitions." },
  { icon: Sparkles, title: "Neurodivergence", desc: "Specialized support for ADHD, Autism, Dyslexia, and Dyspraxia." },
];

const ServicesSection = () => (
  <section id="services" className="py-24">
    <div className="container mx-auto px-4">
      <h2 className="font-heading text-4xl font-semibold text-foreground md:text-5xl">Our Services</h2>
      <p className="mt-2 font-heading text-xl italic text-primary">How We Can Help You Thrive</p>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        We provide professional, compassionate therapy and wellness support tailored to your unique needs.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {featuredServices.map((service) => (
          <div
            key={service.title}
            className="group overflow-hidden rounded-2xl bg-card shadow-card transition-shadow duration-300 hover:shadow-hover"
          >
            <div className="h-52 overflow-hidden">
              <img
                src={service.img}
                alt={service.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <h3 className="font-heading text-xl font-semibold text-foreground">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.desc}</p>
              <Button variant="hero" size="sm" className="mt-4" asChild>
                <Link
                  to="/booking"
                  onClick={() => {
                    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                  }}
                >
                  Book a Session →
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {allServices.map((service) => (
          <div
            key={service.title}
            className="rounded-xl border border-border/50 bg-card/60 p-5 transition-shadow duration-300 hover:shadow-card"
          >
            <service.icon className="mb-3 h-8 w-8 text-primary" />
            <h4 className="font-heading text-lg font-medium text-foreground">{service.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{service.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
