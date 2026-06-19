import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { pageHeaderBackgrounds, softPageBackgroundStyle } from "@/lib/pageBackground";
import { servicesPageImages } from "@/lib/serviceImages";

const getBookingLink = (serviceTitle: string) =>
  `/booking?service=${encodeURIComponent(serviceTitle)}#schedule-appointment`;

const featuredServices = [
  {
    image: servicesPageImages.individualTherapy,
    imageAlt: "A Black client speaking with a counselor during a supportive individual therapy session",
    title: "Individual Therapy",
    description:
      "At The Wellness Hub, we offer a private, compassionate space where you can speak honestly, understand what you are experiencing, and work toward meaningful change at your own pace. We support anxiety, depression, stress, burnout, grief, relationship challenges, low self-esteem, life transitions, and emotional overwhelm using practical, evidence-based approaches shaped around your needs, strengths, and goals.",
    imageClassName: "object-[center_28%] sm:object-[center_30%] lg:object-[center_32%]",
  },
  {
    image: servicesPageImages.groupTherapy,
    imageAlt: "A Black male client participating in a supportive group therapy conversation",
    title: "Group Therapy",
    description:
      "Besides individual therapy, at The Wellness Hub we also offer group therapy sessions designed around shared concerns such as depression, obesity, panic disorder, social anxiety, substance abuse, and other life challenges. Group therapy creates a compassionate support network where you can meet people facing similar circumstances, feel understood, learn from shared experiences, build practical coping skills, and gain the encouragement and motivation needed to recover and grow.",
    imageClassName: "object-[center_62%] sm:object-[center_64%] lg:object-[center_66%]",
  },
];

const therapyServices = [
  {
    title: "Addiction Treatment",
    image: servicesPageImages.addictionTreatment,
    imageAlt: "A Black male addiction counselor supporting a client during one-on-one recovery therapy",
    description:
      "Addiction recovery needs compassion, structure, and honesty. At The Wellness Hub, we help clients and families understand the roots of alcohol, cigarette, substance, or hard drug dependence, then build a treatment path that may include relapse prevention, therapy, family support, residential referral, or long-term outpatient rehabilitation.",
    imageClassName: "object-[center_44%]",
  },
  {
    title: "Psychotherapy",
    image: servicesPageImages.psychotherapy,
    imageAlt: "A therapist conducting a calm psychotherapy session with a client in an office",
    description:
      "Psychotherapy gives language and direction to what feels heavy, confusing, or repeated. We address emotional difficulties, relationship patterns, trauma responses, workplace strain, low mood, anxiety, and life transitions with professional psychological support that helps you understand yourself and move with more clarity.",
    imageClassName: "object-[center_48%]",
  },
  {
    title: "Mindfulness & Stress Reset",
    image: servicesPageImages.mindfulnessStressReset,
    imageAlt: "A Black woman practicing a calm mindfulness reset in a peaceful indoor setting",
    description:
      "For people who feel constantly on, this reset creates room to slow the nervous system. At The Wellness Hub, we blend grounding skills, breathwork, reflective exercises, stress education, and simple daily practices that help restore clarity, improve sleep, and build calmer routines.",
    imageClassName: "object-[center_48%]",
  },
  {
    title: "Grief and Loss",
    image: servicesPageImages.griefAndLoss,
    imageAlt: "A Black woman processing grief in a quiet reflective moment",
    description:
      "Grief does not follow a neat timetable. We support loss after death, separation, illness, migration, major change, or lost opportunities, addressing shock, anger, guilt, numbness, longing, faith questions, family strain, and meaning-making without forcing someone to heal on command.",
    imageClassName: "object-[center_66%]",
  },
  {
    title: "Child and Adolescent Support",
    image: servicesPageImages.childAndAdolescentSupport,
    imageAlt: "Black African children listening attentively in a classroom",
    description:
      "Children and teenagers need support that respects their age, voice, and development. We address emotional regulation, behaviour concerns, school stress, identity questions, peer pressure, family change, grief, and early signs of anxiety or low mood with warmth, structure, and caregiver involvement where helpful.",
    imageClassName: "object-[center_58%]",
  },
  {
    title: "Trauma and CBT",
    image: servicesPageImages.traumaAndCbt,
    imageAlt: "A Black woman sitting quietly during a reflective emotional support moment",
    description:
      "Trauma can live in thoughts, body responses, relationships, sleep, anger, avoidance, or numbness. We use CBT-informed care to help clients understand triggers, challenge painful beliefs, rebuild safety, develop coping skills, and move toward recovery without being rushed or reduced to the painful event.",
    imageClassName: "object-[center_66%]",
  },
  {
    title: "Anxiety and Mental Health",
    image: servicesPageImages.anxietyAndMentalHealth,
    imageAlt: "A Black man experiencing stress and anxiety in a quiet moment",
    description:
      "Anxiety and mental health struggles can affect sleep, focus, appetite, relationships, confidence, and daily decisions. At The Wellness Hub, we address worry, panic, overwhelm, emotional shutdown, depressive symptoms, and stress patterns while building tools for grounding, self-care, and long-term stability.",
    imageClassName: "object-[center_38%]",
  },
  {
    title: "Neurodivergence",
    image: servicesPageImages.neurodivergence,
    imageAlt: "A focused Black man working on a laptop with a calm planning routine",
    description:
      "Neurodivergent support should honour both strengths and strain. We address ADHD, autism, dyslexia, dyspraxia, sensory differences, executive functioning, emotional regulation, identity, relationships, and school or workplace accommodations while building systems that fit the person, not the other way around.",
    imageClassName: "object-[center_20%]",
  },
  {
    title: "Bariatric Psychology",
    image: servicesPageImages.bariatricPsychology,
    imageAlt: "An African patient discussing a health plan with a medical professional",
    description:
      "Bariatric psychology supports the emotional side of major body and lifestyle change. We address readiness for surgery, expectations, identity shifts, mood, relationships, emotional eating, relapse prevention, post-surgery adjustment, and the mindset needed for sustainable health changes.",
    imageClassName: "object-[center_62%]",
  },
];

const specialProgrammes = [
  {
    title: "Corporate Health & Wellness Talk",
    image: servicesPageImages.corporateHealthWellnessTalk,
    imageAlt: "Black professionals in a workplace conversation about wellbeing and team support",
    description:
      "At The Wellness Hub, we help teams talk about mental health before pressure becomes crisis. These sessions address burnout, harassment, bullying, grief, work-life strain, leadership stress, and low morale while giving staff practical language for resilience, communication, psychological safety, and healthier workplace culture.",
    imageClassName: "object-[center_62%]",
  },
  {
    title: "Community Outreaches",
    image: servicesPageImages.communityOutreaches,
    imageAlt: "African volunteers supporting a community outreach gathering outdoors",
    description:
      "We are committed to taking mental health education beyond the clinic. Through community outreaches, we address stigma, poverty-related stress, family conflict, debt pressure, grief, substance use concerns, and emotional safety in familiar spaces where people can ask questions, feel seen, and discover support pathways.",
    imageClassName: "object-[center_60%]",
  },
  {
    title: "Mental Health Awareness for Schools",
    image: servicesPageImages.mentalHealthAwarenessForSchools,
    imageAlt: "African students taking part in a calm school wellbeing discussion",
    description:
      "School life can carry silent pressure. At The Wellness Hub, we create age-appropriate conversations for learners, teachers, and caregivers around exam stress, bullying, identity, relationships, self-esteem, emotional regulation, warning signs, and where to turn when a young person is struggling.",
    imageClassName: "object-[center_58%]",
  },
  {
    title: "Upgraded Boychild",
    image: servicesPageImages.upgradedBoychild,
    imageAlt: "Young African men participating in a focused group discussion",
    description:
      "Upgraded Boychild is a growth and mentorship programme helping boys and young men build emotional confidence, healthy masculinity, purpose, discipline, and practical life skills. Through honest conversations and guided activities, participants learn to communicate well, manage pressure, form respectful relationships, make responsible choices, and become grounded men who can thrive at home, in school, at work, and in their communities.",
    imageClassName: "object-[center_52%]",
  },
  {
    title: "LGBTQ+ Support",
    image: servicesPageImages.lgbtqSupport,
    imageAlt: "A supportive Black couple smiling together in a warm home setting",
    description:
      "We are intentional about affirming care that honours identity, safety, and mental wellbeing. This support addresses belonging, self-acceptance, family dynamics, relationships, boundaries, discrimination, faith questions, and the emotional load of being misunderstood in spaces that should feel safe.",
    imageClassName: "object-[center_62%]",
  },
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
      <div className="mx-auto w-full max-w-[112rem] px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="mx-auto mb-10 max-w-4xl text-center">
          <h2 className="mx-auto mt-5 font-heading text-4xl font-semibold leading-[1.04] text-foreground md:text-5xl">
            <span className="sm:hidden">Awareness today, better mental health tomorrow</span>
            <span className="hidden sm:block">
              Awareness today, better mental
              <br />
              health tomorrow
            </span>
          </h2>
          <p className="mt-6 text-base leading-8 text-muted-foreground md:text-[1.02rem]">
            Life gets heavy sometimes, but our services are here to help you unpack, heal, and grow at your pace, in your
            way with real support. Real change. Explore services designed to help you heal, grow, and take back
            control of your life.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:gap-8 2xl:gap-10">
          {[...featuredServices, ...therapyServices].map((service) => (
            <div
              key={service.title}
              className="group overflow-hidden rounded-[2rem] border border-border/60 bg-card text-left shadow-[0_20px_40px_-32px_rgba(35,72,61,0.34)] transition-all duration-300 ease-out hover:-translate-y-3 hover:shadow-[0_28px_56px_-28px_rgba(35,72,61,0.42)]"
            >
              <div className="h-56 overflow-hidden bg-secondary/40 xl:h-64 2xl:h-72">
                <img
                  src={service.image}
                  alt={service.imageAlt}
                  loading="eager"
                  decoding="async"
                  className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${service.imageClassName}`}
                />
              </div>
              <div className="wellness-panel flex min-h-[22rem] flex-col p-6 xl:min-h-[24rem] xl:p-7 2xl:min-h-[25rem] 2xl:p-8">
                <h3 className="font-heading text-2xl font-semibold leading-tight text-foreground transition-colors duration-300 group-hover:text-primary md:text-[1.7rem] 2xl:text-[2rem]">
                  {service.title}
                </h3>
                <p className="mt-4 flex-1 text-sm leading-7 text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80 2xl:text-[0.98rem] 2xl:leading-8">
                  {service.description}
                </p>
                <Button variant="hero" className="mt-6 w-full rounded-full sm:w-auto" asChild>
                  <Link to={getBookingLink(service.title)}>Book This Service</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="py-16">
      <div className="mx-auto w-full max-w-[112rem] px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="px-0 py-0 sm:rounded-[2.25rem] sm:bg-secondary/40 sm:px-6 sm:py-8 lg:px-8 2xl:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center justify-center gap-2 rounded-full bg-background/95 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.24em] text-primary shadow-card sm:bg-transparent sm:px-0 sm:py-0 sm:font-semibold sm:tracking-[0.28em] sm:text-primary/75 sm:shadow-none">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Our Special Programmes</span>
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:gap-8 2xl:gap-10">
            {specialProgrammes.map((service) => (
              <div
                key={service.title}
                className="group overflow-hidden rounded-[2rem] border border-border/60 bg-card text-left shadow-[0_20px_40px_-32px_rgba(35,72,61,0.34)] transition-all duration-300 ease-out hover:-translate-y-3 hover:shadow-[0_28px_56px_-28px_rgba(35,72,61,0.42)]"
              >
                <div className="h-56 overflow-hidden bg-secondary/40 xl:h-64 2xl:h-72">
                  <img
                    src={service.image}
                    alt={service.imageAlt}
                    loading="eager"
                    decoding="async"
                    className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${service.imageClassName}`}
                  />
                </div>
                <div className="wellness-panel flex min-h-[22rem] flex-col p-6 xl:min-h-[24rem] xl:p-7 2xl:min-h-[25rem] 2xl:p-8">
                  <h3 className="font-heading text-2xl font-semibold leading-tight text-foreground transition-colors duration-300 group-hover:text-primary md:text-[1.7rem] 2xl:text-[2rem]">
                    {service.title}
                  </h3>
                  <p className="mt-4 flex-1 text-sm leading-7 text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80 2xl:text-[0.98rem] 2xl:leading-8">
                    {service.description}
                  </p>
                  <Button variant="hero" className="mt-6 w-full rounded-full sm:w-auto" asChild>
                    <Link to={getBookingLink(service.title)}>Book This Service</Link>
                  </Button>
                </div>
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
