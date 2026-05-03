import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Heart, ImagePlus, Lock, Quote, Send, ShieldCheck, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import storyClosingImage from "@/assets/cta-therapy.jpg";
import storyHeroImage from "@/assets/hero-calm-therapy.jpg";
import leafDecor from "@/assets/leaf-decoration.png";
import Footer from "@/components/Footer";
import WellnessLogo from "@/components/WellnessLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { useDesktopImageEffects } from "@/hooks/useDesktopImageEffects";
import { getApiErrorMessage } from "@/lib/api";
import { getClientStoryTestimonials } from "@/lib/clientTestimonials";
import type { StoryServiceType } from "@/types/wellness";

interface StoryFormState {
  fullName: string;
  image: string;
  serviceType: StoryServiceType;
  story: string;
}

const initialStoryForm: StoryFormState = {
  fullName: "",
  image: "",
  serviceType: "individual",
  story: "",
};

const closingHeadlineWords = [
  "You",
  "are",
  "not",
  "alone.",
  "Your",
  "story",
  "could",
  "be",
  "someone",
  "else's",
  "hope.",
];

const optimizeStoryImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to process the selected image."));
        return;
      }

      const source = reader.result;
      const image = new window.Image();

      image.onerror = () => resolve(source);
      image.onload = () => {
        const longestSide = Math.max(image.width, image.height);
        const scale = longestSide > 960 ? 960 / longestSide : 1;
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          resolve(source);
          return;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };

      image.src = source;
    };

    reader.readAsDataURL(file);
  });

const StoryPage = () => {
  const { clientStories, submitClientStory } = useWellnessHub();
  const formSectionRef = useRef<HTMLElement | null>(null);
  const [form, setForm] = useState<StoryFormState>(initialStoryForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 64, damping: 18, mass: 0.28 });
  const heroImageY = useTransform(smoothProgress, [0, 0.28], ["0%", "16%"]);
  const heroImageScale = useTransform(smoothProgress, [0, 0.28], [1.06, 1.16]);
  const heroGlowY = useTransform(smoothProgress, [0, 0.55], ["0%", "34%"]);
  const formRotateX = useTransform(smoothProgress, [0.28, 0.58], [8, 0]);
  const formScale = useTransform(smoothProgress, [0.3, 0.58], [0.94, 1]);
  const closingImageY = useTransform(smoothProgress, [0.72, 1], ["0%", "16%"]);
  const closingImageScale = useTransform(smoothProgress, [0.72, 1], [1.06, 1.16]);
  const closingFloatY = useTransform(smoothProgress, [0.72, 1], ["16%", "-8%"]);
  const desktopImageEffects = useDesktopImageEffects();
  const storyTestimonials = useMemo(() => getClientStoryTestimonials(clientStories), [clientStories]);
  const activeStoryTestimonial = storyTestimonials[testimonialIndex];

  const showPreviousStoryTestimonial = () => {
    setTestimonialIndex((current) => (current === 0 ? storyTestimonials.length - 1 : current - 1));
  };

  const showNextStoryTestimonial = () => {
    setTestimonialIndex((current) => (current + 1) % storyTestimonials.length);
  };

  useEffect(() => {
    setTestimonialIndex((current) => (current >= storyTestimonials.length ? 0 : current));
  }, [storyTestimonials.length]);

  const setField = <K extends keyof StoryFormState>(field: K, value: StoryFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const image = await optimizeStoryImage(file);
      setField("image", image);
      toast.success("Image added to your story.");
    } catch {
      toast.error("That image could not be processed.");
    } finally {
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.story.trim().length < 20) {
      toast.error("Please share a little more so the story can be reviewed with care.");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitClientStory({
        fullName: form.fullName.trim(),
        image: form.image,
        serviceType: form.serviceType,
        story: form.story.trim(),
      });
      setForm(initialStoryForm);
      setIsSuccessOpen(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Your story could not be submitted right now."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <main>
        <section
          className="relative flex min-h-[100svh] items-center overflow-hidden px-4 py-28 sm:px-6 lg:px-10"
          data-nav-theme="inverse"
        >
          <motion.img
            src={storyHeroImage}
            alt="Soft morning light over a calm therapy-inspired space"
            className="absolute inset-0 h-full w-full object-cover object-[center_45%]"
            style={desktopImageEffects ? { y: heroImageY, scale: heroImageScale } : undefined}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(19,35,31,0.32),rgba(20,39,34,0.42)),radial-gradient(circle_at_28%_18%,rgba(250,247,242,0.34),transparent_32%)]" />
          <motion.div
            className="absolute left-[7%] top-[18%] h-36 w-36 rounded-full bg-white/18 blur-3xl sm:h-52 sm:w-52"
            style={{ y: heroGlowY }}
          />
          <motion.img
            src={leafDecor}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-28 w-32 rotate-[24deg] opacity-20 sm:right-[8%] sm:w-44"
            animate={{ y: [0, -16, 0], rotate: [20, 28, 20] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-[14%] left-[8%] h-20 w-20 rounded-full border border-white/30 bg-white/10 shadow-[0_24px_80px_-40px_rgba(255,255,255,0.6)] backdrop-blur-md"
            animate={{ y: [0, 18, 0], rotateX: [0, 18, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="flex max-w-4xl flex-col items-center pt-10 text-white"
            >
              <h1 className="max-w-4xl font-heading text-[clamp(2.15rem,5.8vw,4.75rem)] font-semibold leading-[1.05] tracking-normal text-white [text-shadow:0_16px_44px_rgba(0,0,0,0.28)]">
                Your story matters. Your voice can help someone heal.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/86 [text-shadow:0_8px_28px_rgba(0,0,0,0.22)]">
                Share a moment from your therapy journey in a space designed for care, consent, and gentle review.
              </p>
              <Button
                type="button"
                size="lg"
                variant="hero"
                className="mt-8 rounded-full px-8 shadow-[0_24px_48px_-26px_rgba(250,247,242,0.82)] transition-all duration-300 hover:-translate-y-1"
                onClick={scrollToForm}
              >
                Share Your Story
                <ArrowDown className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </section>

        <section
          ref={formSectionRef}
          className="relative overflow-hidden bg-[linear-gradient(180deg,hsl(var(--secondary)/0.54),hsl(var(--background)))] px-4 py-24 sm:px-6 lg:px-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,hsl(205_58%_88%_/_0.42),transparent_28%),radial-gradient(circle_at_86%_62%,hsl(var(--secondary)_/_0.7),transparent_30%)]" />
          <div className="relative z-10 mx-auto flex w-full max-w-3xl justify-center">
            <motion.form
              onSubmit={handleSubmit}
              className="w-full rounded-[2rem] border border-white/58 bg-white/58 p-5 shadow-[0_34px_90px_-52px_rgba(35,72,61,0.46)] backdrop-blur-2xl sm:p-7"
              style={{ rotateX: formRotateX, scale: formScale, transformPerspective: 1200 }}
              initial={{ opacity: 0, y: 42 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.86, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Your voice</p>
                  <h2 className="mt-2 font-heading text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                    Share Your Story
                  </h2>
                </div>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="story-full-name">Full Name (optional)</Label>
                  <Input
                    id="story-full-name"
                    value={form.fullName}
                    onChange={(event) => setField("fullName", event.target.value)}
                    className="mt-2 rounded-2xl border-border/70 bg-background/72 transition-shadow focus-visible:ring-primary/30 focus-visible:shadow-[0_0_0_6px_hsl(var(--primary)/0.08)]"
                    placeholder="Your name or initials"
                  />
                </div>
                <div>
                  <Label htmlFor="story-service-type">Service Type</Label>
                  <Select value={form.serviceType} onValueChange={(value) => setField("serviceType", value as StoryServiceType)}>
                    <SelectTrigger
                      id="story-service-type"
                      className="mt-2 h-10 rounded-2xl border-border/70 bg-background/72 focus:ring-primary/30"
                    >
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual Therapy</SelectItem>
                      <SelectItem value="family">Family Therapy</SelectItem>
                      <SelectItem value="corporate">Corporate Wellness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-5">
                <Label htmlFor="story-image">Upload Image (optional)</Label>
                <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <Input
                    id="story-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="rounded-2xl border-border/70 bg-background/72 file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-primary"
                  />
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-2 text-xs font-medium text-primary">
                    <ImagePlus className="h-4 w-4" />
                    Be featured on our platform
                  </span>
                </div>
                {form.image ? (
                  <img
                    src={form.image}
                    alt="Selected story preview"
                    className="mt-4 h-40 w-full rounded-[1.5rem] object-cover shadow-card"
                  />
                ) : null}
              </div>

              <div className="mt-5">
                <Label htmlFor="story-text">Story</Label>
                <Textarea
                  id="story-text"
                  value={form.story}
                  onChange={(event) => setField("story", event.target.value)}
                  className="mt-2 min-h-[12rem] rounded-[1.5rem] border-border/70 bg-background/72 leading-7 transition-shadow focus-visible:ring-primary/30 focus-visible:shadow-[0_0_0_6px_hsl(var(--primary)/0.08)]"
                  placeholder="Share the part of your journey that might help someone feel less alone."
                  required
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="mt-6 w-full rounded-full shadow-[0_24px_48px_-28px_hsl(var(--primary)/0.55)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_60px_-30px_hsl(var(--primary)/0.62)] sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sharing..." : "Share My Story"}
                <Send className="h-4 w-4" />
              </Button>
            </motion.form>
          </div>
        </section>

        <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-10">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.48))]" />
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.7 }}
              className="mx-auto max-w-3xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl"
            >
              Your story is reviewed with care before being shared.
            </motion.p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, label: "Reviewed" },
                { icon: Heart, label: "Handled with care" },
                { icon: Lock, label: "Shared only after approval" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  className="rounded-[1.5rem] border border-border/50 bg-card/80 p-6 shadow-card backdrop-blur"
                  initial={{ opacity: 0, y: 24, rotateX: 12 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, amount: 0.55 }}
                  transition={{ delay: index * 0.1, duration: 0.65 }}
                  whileHover={{ y: -6, rotateX: 3 }}
                >
                  <item.icon className="mx-auto h-8 w-8 text-primary" />
                  <p className="mt-4 font-medium text-foreground">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-background px-4 py-24 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              <h2 className="font-heading text-4xl font-semibold text-foreground md:text-5xl">
                Real voices. Gentle breakthroughs.
              </h2>
            </motion.div>

            <div className="mt-6 md:hidden">
              <div className="wellness-panel relative mx-auto min-h-[18rem] max-w-[21.5rem] overflow-hidden rounded-[1.75rem] border border-border/60 px-8 py-7 text-left shadow-[0_28px_55px_-32px_rgba(16,24,20,0.42)]">
                <img
                  src={leafDecor}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-2 top-0 w-28 rotate-180 opacity-12"
                />
                <Quote className="h-8 w-8 text-primary/28" />
                <p className="mt-5 text-[1.02rem] font-medium italic leading-8 text-foreground/75">
                  {activeStoryTestimonial.text}
                </p>
                <div className="mt-6 flex items-center gap-4 border-t border-border/60 pt-4">
                  <div className="h-12 w-12 overflow-hidden rounded-full border border-border/60 bg-background shadow-soft">
                    <img
                      src={activeStoryTestimonial.image}
                      alt={activeStoryTestimonial.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{activeStoryTestimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{activeStoryTestimonial.role}</p>
                  </div>
                </div>
              </div>

              <div className="mx-auto mt-5 grid max-w-[16rem] grid-cols-[3rem_1fr_3rem] items-center gap-4">
                <button
                  type="button"
                  onClick={showPreviousStoryTestimonial}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/12 bg-background text-primary shadow-soft transition-colors hover:bg-primary/8"
                  aria-label="Previous story"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center justify-center gap-3">
                  {storyTestimonials.map((testimonial, index) => (
                    <button
                      key={`${testimonial.name}-${index}`}
                      type="button"
                      onClick={() => setTestimonialIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        testimonialIndex === index ? "w-2 bg-primary" : "w-2 border border-primary/28 bg-transparent"
                      }`}
                      aria-label={`Show story ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={showNextStoryTestimonial}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
                  aria-label="Next story"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="pause-marquee relative mt-10 hidden overflow-hidden md:block">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-background to-transparent" />
              <div className="flex w-max gap-6 animate-testimonial-marquee">
                {[...storyTestimonials, ...storyTestimonials].map((testimonial, index) => (
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
          </div>
        </section>

        <section className="relative flex min-h-[74svh] items-center overflow-hidden px-4 py-24 text-center sm:px-6 lg:px-10" data-nav-theme="inverse">
          <motion.img
            src={storyClosingImage}
            alt="A calm therapy space prepared for a hopeful client conversation"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-[center_45%]"
            style={desktopImageEffects ? { y: closingImageY, scale: closingImageScale } : undefined}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,32,28,0.28),rgba(18,32,28,0.58))]" />
          <motion.div
            aria-hidden="true"
            className="absolute left-[12%] top-[18%] h-44 w-44 rounded-full bg-white/12 blur-3xl"
            style={{ y: closingFloatY }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute bottom-[14%] right-[10%] h-64 w-64 rounded-full bg-secondary/16 blur-3xl"
            animate={{ y: [0, -18, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="relative z-10 mx-auto max-w-4xl text-white"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.82 }}
          >
            <h2
              className="font-heading text-[clamp(2.8rem,9vw,6rem)] font-semibold leading-[0.94] [text-shadow:0_18px_46px_rgba(0,0,0,0.32)]"
              aria-label="You are not alone. Your story could be someone else's hope."
            >
              {closingHeadlineWords.map((word, index) => (
                <motion.span
                  key={word}
                  aria-hidden="true"
                  className="inline-block"
                  initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.8 }}
                  transition={{
                    delay: index * 0.055,
                    duration: 0.62,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {word}
                  {index < closingHeadlineWords.length - 1 ? "\u00A0" : null}
                </motion.span>
              ))}
            </h2>
            <Button
              type="button"
              variant="hero"
              size="lg"
              className="mt-9 rounded-full px-8 transition-all duration-300 hover:-translate-y-1"
              onClick={scrollToForm}
            >
              Submit Your Story
              <ArrowUp className="h-4 w-4" />
            </Button>
          </motion.div>
        </section>
      </main>
      {isSuccessOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/28 px-4 py-4 backdrop-blur-[6px]">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-success-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="relative max-h-[calc(100svh-2rem)] w-full max-w-[28rem] overflow-y-auto rounded-[2rem] border border-white/75 bg-[linear-gradient(160deg,rgba(255,255,250,0.94),rgba(239,247,239,0.9))] px-5 py-5 text-center shadow-[0_36px_90px_-42px_rgba(15,32,25,0.55)] backdrop-blur-2xl sm:rounded-[2.35rem] sm:px-7 md:max-h-[calc(100vh-2rem)] md:overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setIsSuccessOpen(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-primary/12 bg-white/70 text-primary shadow-soft transition-colors hover:bg-white"
              aria-label="Close story confirmation"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,hsl(136_22%_88%_/_0.34),transparent_24%),radial-gradient(circle_at_88%_76%,hsl(42_31%_88%_/_0.42),transparent_28%)]" />
            <img
              src={leafDecor}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-24 w-16 rotate-[18deg] opacity-20"
            />
            <img
              src={leafDecor}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-20 right-4 w-16 rotate-[196deg] opacity-18"
            />

            <div className="relative z-10 flex flex-col items-center">
              <div className="h-12 w-36 overflow-hidden [&>div]:h-12 [&>div]:w-36">
                <WellnessLogo variant="footer" />
              </div>
              <div className="mt-1 flex h-20 w-20 items-center justify-center rounded-full border border-primary/10 bg-white/62 shadow-[inset_0_0_0_8px_rgba(255,255,255,0.5),0_20px_44px_-28px_rgba(35,72,61,0.5)]">
                <Check className="h-10 w-10 text-primary" strokeWidth={3} />
              </div>
              <h2 id="story-success-title" className="mt-4 font-heading text-4xl font-semibold leading-none text-foreground sm:text-5xl">
                Thank You!
              </h2>
              <p className="mt-2 text-base font-medium text-primary">Your story has been received.</p>
              <div className="my-3 flex items-center gap-3 text-primary">
                <span className="h-px w-12 bg-primary/16" />
                <Heart className="h-5 w-5 fill-primary text-primary" />
                <span className="h-px w-12 bg-primary/16" />
              </div>
              <p className="max-w-[18rem] text-base leading-7 text-foreground/82">
                Thank you for sharing. Your story is safe with us.
              </p>

              <div className="mt-5 grid w-full grid-cols-3 overflow-hidden rounded-[1.5rem] border border-primary/8 bg-white/42 shadow-soft backdrop-blur">
                {[
                  { icon: ShieldCheck, label: "Reviewed with care" },
                  { icon: Heart, label: "Handled with empathy" },
                  { icon: Lock, label: "Always kept private" },
                ].map((item) => (
                  <div key={item.label} className="flex min-h-[4.8rem] flex-col items-center justify-center border-r border-primary/8 px-2 py-2.5 last:border-r-0">
                    <item.icon className="h-6 w-6 text-primary" />
                    <p className="mt-2 text-xs font-medium leading-4 text-foreground/74">{item.label}</p>
                  </div>
                ))}
              </div>

              <Button variant="hero" className="mt-5 rounded-full px-8" asChild>
                <Link to="/" onClick={() => setIsSuccessOpen(false)}>
                  <Heart className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
};

export default StoryPage;
