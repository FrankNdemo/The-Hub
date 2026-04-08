import type { TherapistProfile } from "@/types/wellness";

import therapistImage from "@/assets/therapist-caroline.jpg";

export const primaryTherapist: TherapistProfile = {
  id: "caroline-gichia",
  name: "Caroline Gichia",
  title: "CBT Psychologist",
  bio:
    "Caroline is a compassionate CBT psychologist who supports individuals, families, adolescents, and organizations with calm, evidence-based care rooted in warmth and dignity.",
  qualifications: "Certified CBT Psychologist",
  approach: "Cognitive Behavioral Therapy",
  experience: "Individual, Family, Adolescent, and Corporate Wellness",
  focusAreas: "Anxiety, grief, ADHD, trauma, family support, and LGBTQ+ care",
  specialties: [
    "Anxiety",
    "Depression",
    "Bariatric Psychology",
    "ADHD",
    "Autism",
    "Oncopsychology",
    "Grief and Loss",
    "LGBTQ+ Support",
    "Religious and Existential Therapy",
    "Corporate Wellness",
    "Family Therapy",
    "Trauma and CBT",
  ],
  email: "caroline@thewellnesshub.co.ke",
  phone: "+254 726 759 850",
  location: [
    "Nairobi, Westlands",
    "1st Floor Realite Building",
    "Crescent Lane off Parklands Road",
  ],
  image: therapistImage,
};

export const contactCards = [
  {
    title: "Location",
    lines: primaryTherapist.location,
  },
  {
    title: "Phone",
    lines: [primaryTherapist.phone],
  },
  {
    title: "Email",
    lines: [primaryTherapist.email],
  },
  {
    title: "Hours",
    lines: ["Tuesday to Saturday", "10:00 AM to 7:00 PM"],
  },
];
