import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "What should I expect in my first session?", a: "Your first session is a safe space for introduction. We'll discuss your concerns, goals, and how therapy can support you. There's no pressure—just an open conversation." },
  { q: "How long does each session last?", a: "Sessions typically last 50 minutes. Some specialized sessions may be longer depending on your needs." },
  { q: "Is therapy confidential?", a: "Absolutely. Everything discussed in therapy is strictly confidential, in accordance with professional ethical guidelines." },
  { q: "Do you offer online/virtual sessions?", a: "Yes, we offer virtual sessions via Google Meet for clients who prefer remote therapy or are outside Nairobi." },
  { q: "How do I know if I need therapy?", a: "If you're feeling overwhelmed, anxious, stuck, or simply want to understand yourself better, therapy can help. You don't need to be in crisis to benefit." },
  { q: "What are your working hours?", a: "We're available Tuesday through Saturday, 10:00 AM to 7:00 PM." },
];

const FAQSection = () => (
  <section id="faqs" className="scroll-mt-28 py-16">
    <div className="container mx-auto px-4">
      <div className="wellness-section-surface mx-auto max-w-4xl rounded-[2.5rem] border border-border/60 px-6 py-10 shadow-card sm:px-8">
        <h2 className="text-center font-heading text-4xl font-semibold text-foreground md:text-5xl">
          Frequently Asked Questions
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground leading-8">
          Clear answers for common questions about therapy, privacy, scheduling, and getting started.
        </p>

        <Accordion type="single" collapsible className="mt-12 space-y-3">
        {faqs.map((f, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="wellness-panel rounded-[1.5rem] border border-border/60 px-6 shadow-card"
          >
            <AccordionTrigger className="font-heading text-base font-medium text-foreground hover:no-underline">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
        </Accordion>
      </div>
    </div>
  </section>
);

export default FAQSection;
