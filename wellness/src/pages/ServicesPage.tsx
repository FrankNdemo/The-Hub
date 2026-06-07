import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

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
    imageClassName: "object-[center_34%] sm:object-[center_36%] lg:object-[center_38%]",
  },
  {
    image: servicePageFamilyImage,
    imageAlt: "An African couple sharing a calm and connected moment together on a couch at home",
    title: "Family and Relationship Support",
    description: "Guided sessions that improve communication, reduce tension, and help families reconnect with more empathy.",
    imageClassName: "object-[center_58%] sm:object-[center_60%] lg:object-[center_62%]",
  },
  {
    image: servicePageSpecializedImage,
    imageAlt: "A Black male client sitting on a couch and talking with a therapist in a bright office",
    title: "Specialized Therapeutic Care",
    description: "Focused support for trauma, neurodivergence, grief, oncopsychology, LGBTQ+ wellbeing, and existential concerns.",
    imageClassName: "object-[center_62%] sm:object-[center_64%] lg:object-[center_66%]",
  },
];

const pexelsImage = (photoId: number) =>
  `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=820&fit=crop`;

const serviceList = [
  {
    title: "Corporate Health & Wellness Talk",
    image: pexelsImage(30677713),
    imageAlt: "Black professionals in a workplace conversation about wellbeing and team support",
    description:
      "Workplace stress, burnout, harassment, bullying, grief, and work-life strain can quietly affect performance and morale. Our corporate wellness talks help teams name these pressures early, reduce stigma around mental health, and build healthier habits for communication, resilience, leadership, and employee support.",
    imageClassName: "object-[center_62%]",
  },
  {
    title: "Community Outreaches",
    image: pexelsImage(33763195),
    imageAlt: "African volunteers supporting a community outreach gathering outdoors",
    description:
      "We bring mental health awareness closer to the communities that need it most. Through targeted outreach, we support conversations around stigma, poverty-related stress, family conflict, debt pressure, emotional safety, and access to care so people can find help within familiar community spaces.",
    imageClassName: "object-[center_60%]",
  },
  {
    title: "Mental Health Awareness for Schools",
    image: pexelsImage(34526411),
    imageAlt: "African students taking part in a calm school wellbeing discussion",
    description:
      "Young people face exam pressure, social expectations, identity questions, difficult relationships, and intense emotional changes. Our school awareness sessions create age-appropriate spaces for learners, teachers, and caregivers to understand warning signs, reduce shame, and support wellbeing before a crisis grows.",
    imageClassName: "object-[center_58%]",
  },
  {
    title: "Home-Based Care",
    image: pexelsImage(33127869),
    imageAlt: "African healthcare volunteers offering supportive care during a community visit",
    description:
      "For clients who need ongoing care but not full admission, home-based support offers continuity in a familiar environment. Care plans can include clinical check-ins, psychological support, medication guidance, caregiver education, and practical recovery planning that helps families participate with confidence.",
    imageClassName: "object-[center_62%]",
  },
  {
    title: "Individual Therapy",
    image: pexelsImage(5234624),
    imageAlt: "A Black woman speaking with a psychologist during a supportive therapy session",
    description:
      "Gentle one-on-one therapy for anxiety, depression, stress, burnout, grief, emotional overwhelm, and self-understanding. Sessions move at your pace, with practical CBT-informed tools that help you notice patterns, regulate emotions, and rebuild a steadier relationship with yourself.",
    imageClassName: "object-[center_42%]",
  },
  {
    title: "Addiction Treatment",
    image: pexelsImage(5711174),
    imageAlt: "A diverse group seated in a supportive group therapy circle for recovery",
    description:
      "Weaning off addiction, alcohol, cigarettes, or hard drugs can be a daunting experience. Through compassionate care and customised addiction treatment plans, we help you or someone you love take back control without stigma or shame. Our goal is to work with you in finding the root cause of addiction and charting a recovery path through residential or long-term outpatient rehabilitation support.",
    imageClassName: "object-[center_50%]",
  },
  {
    title: "Psychotherapy",
    image: pexelsImage(8560221),
    imageAlt: "A therapist conducting a calm psychotherapy session with a client in an office",
    description:
      "Sometimes the problems that life throws at us can be overwhelming, even for the strongest among us. We offer psychotherapy for a wide variety of mental illnesses and emotional difficulties, with professional psychologists helping you navigate the dark storms rocking your boat, either at work or home.",
    imageClassName: "object-[center_48%]",
  },
  {
    title: "Art Therapy",
    image: pexelsImage(6925366),
    imageAlt: "Women painting together in a bright art therapy class with canvases",
    description:
      "Facilitated by a professional art therapist, art therapy supports personal and relational treatment goals. It can help improve cognitive and sensorimotor functions, foster self-esteem and self-awareness, cultivate emotional resilience, and enhance social skills through guided creative expression.",
    imageClassName: "object-[center_46%]",
  },
  {
    title: "Occupational Therapy",
    image: pexelsImage(7551611),
    imageAlt: "A caregiver supporting an older adult through a therapeutic home exercise",
    description:
      "We offer occupational therapy for clients with disability or older adults experiencing cognitive or physical changes. Interventions are tailored for each client, helping you participate in desired occupations through the therapeutic use of everyday activities based on your personal interests and needs.",
    imageClassName: "object-[center_46%]",
  },
  {
    title: "Mindfulness & Stress Reset",
    image: pexelsImage(3822622),
    imageAlt: "A Black woman practicing a calm mindfulness reset in a peaceful indoor setting",
    description:
      "A focused wellbeing programme for people who feel stretched, wired, or constantly on. Sessions blend grounding skills, breathwork, reflective exercises, and simple daily practices that help the nervous system slow down, restore clarity, and create calmer routines.",
    imageClassName: "object-[center_48%]",
  },
  {
    title: "Child and Adolescent Support",
    image: pexelsImage(20333029),
    imageAlt: "Black African children listening attentively in a classroom",
    description:
      "Children and teenagers need care that respects their age, personality, and stage of development. We support emotional regulation, behavior concerns, school stress, identity questions, peer relationships, family change, and early signs of anxiety or low mood with warmth and structure.",
    imageClassName: "object-[center_58%]",
  },
  {
    title: "Trauma and CBT",
    image: pexelsImage(6382655),
    imageAlt: "A Black woman sitting quietly during a reflective emotional support moment",
    description:
      "Trauma can show up as fear, numbness, avoidance, anger, intrusive memories, or difficulty trusting your own body again. CBT-informed care helps you understand triggers, challenge painful beliefs, rebuild safety, and develop coping skills that support recovery without rushing your story.",
    imageClassName: "object-[center_66%]",
  },
  {
    title: "Anxiety and Mental Health",
    image: pexelsImage(6382522),
    imageAlt: "A Black client receiving comfort during a difficult emotional moment",
    description:
      "Anxiety can affect sleep, focus, relationships, appetite, confidence, and everyday decision-making. We help you make sense of panic, worry, overwhelm, and emotional shutdown while building practical tools for grounding, thought patterns, self-care, and long-term mental health.",
    imageClassName: "object-[center_64%]",
  },
  {
    title: "Neurodivergence",
    image: pexelsImage(6578397),
    imageAlt: "A focused Black man working on a laptop with a calm planning routine",
    description:
      "Strengths-based support for ADHD, autism, dyslexia, dyspraxia, sensory differences, and neurodivergent identity. Sessions focus on self-acceptance, executive functioning, emotional regulation, relationships, workplace or school accommodations, and practical systems that fit your real life.",
    imageClassName: "object-[center_42%]",
  },
  {
    title: "Oncopsychology",
    image: pexelsImage(19963131),
    imageAlt: "A Black healthcare professional offering calm support in a clinical setting",
    description:
      "A cancer diagnosis can bring fear, grief, body changes, treatment fatigue, and uncertainty for both clients and families. Oncopsychology support offers space to process emotions, strengthen coping, communicate needs, and navigate treatment or recovery with dignity.",
    imageClassName: "object-[center_42%]",
  },
  {
    title: "Grief and Loss",
    image: pexelsImage(8553653),
    imageAlt: "A Black woman processing grief in a quiet reflective moment",
    description:
      "Grief can follow death, separation, illness, migration, lost opportunities, or major life changes. We offer compassionate support for the shock, anger, guilt, numbness, longing, and meaning-making that can come with loss, without forcing a timeline for healing.",
    imageClassName: "object-[center_66%]",
  },
  {
    title: "LGBTQ+ Support",
    image: pexelsImage(6579051),
    imageAlt: "A supportive Black couple smiling together in a warm home setting",
    description:
      "Affirming therapy honours identity, safety, relationships, family dynamics, self-acceptance, and mental wellbeing. We provide a confidential space to explore stress, belonging, boundaries, discrimination, faith questions, and the emotional load that can come with being misunderstood.",
    imageClassName: "object-[center_62%]",
  },
  {
    title: "Religious and Existential Therapy",
    image: pexelsImage(13742663),
    imageAlt: "A crowd of Black people gathered in a reflective communal prayer moment",
    description:
      "Sometimes distress is connected to meaning, faith, doubt, purpose, guilt, identity, or major questions about life. This therapy gives room for open, respectful exploration of spiritual complexity and existential concerns while supporting emotional clarity and grounded decision-making.",
    imageClassName: "object-[center_60%]",
  },
  {
    title: "Bariatric Psychology",
    image: pexelsImage(30678208),
    imageAlt: "An African patient discussing a health plan with a medical professional",
    description:
      "Weight management surgery and major body changes can affect identity, mood, habits, relationships, and expectations. Bariatric psychology supports readiness, emotional eating patterns, adjustment after surgery, relapse prevention, and the mindset needed for sustainable lifestyle change.",
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
      <div className="container mx-auto px-4">
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
              <span>Our Special Programmes</span>
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {serviceList.map((service) => (
              <div
                key={service.title}
                className="group overflow-hidden rounded-[2rem] border border-border/60 bg-card text-left shadow-[0_20px_40px_-32px_rgba(35,72,61,0.34)] transition-all duration-300 ease-out hover:-translate-y-3 hover:shadow-[0_28px_56px_-28px_rgba(35,72,61,0.42)]"
              >
                <div className="h-56 overflow-hidden bg-secondary/40">
                  <img
                    src={service.image}
                    alt={service.imageAlt}
                    loading="lazy"
                    className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${service.imageClassName}`}
                  />
                </div>
                <div className="wellness-panel flex min-h-[22rem] flex-col p-6">
                  <h3 className="font-heading text-2xl font-semibold leading-tight text-foreground transition-colors duration-300 group-hover:text-primary md:text-[1.7rem]">
                    {service.title}
                  </h3>
                  <p className="mt-4 flex-1 text-sm leading-7 text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
                    {service.description}
                  </p>
                  <Button variant="hero" className="mt-6 w-full rounded-full sm:w-auto" asChild>
                    <Link to="/contact">Contact Us</Link>
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
