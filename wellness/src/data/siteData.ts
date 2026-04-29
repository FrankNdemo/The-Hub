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
  email: "likentnerg@gmail.com",
  phone: "+254114470441",
  location: [
    "Real Lite by Broadcom",
    "Nairobi, Westlands",
  ],
  image: therapistImage,
};

export const kelvinTherapist: TherapistProfile = {
  id: "kelvin-kagiri",
  name: "Kelvin Kagiri",
  title: "Psychologist",
  bio:
    "Kelvin supports teenagers, young adults, individuals, and groups with practical DBT-informed care for emotional challenges, substance abuse recovery, and healthier coping skills.",
  qualifications: "Psychologist",
  approach: "DBT-informed youth and substance abuse therapy",
  experience: "Early teenage and youth therapy, group sessions, substance abuse support, and employee wellness",
  focusAreas:
    "Youth mentorship, drug and substance abuse support, suicide prevention, employee wellness, and team building",
  specialties: [
    "Detection of mental health issues",
    "Drug and substance abuse support",
    "Suicide prevention",
    "Teenage and youth mentorship",
    "Employee wellness training",
    "Team building",
  ],
  email: "ndemojnrr@gmail.com",
  phone: "+254114470441",
  location: [
    "Real Lite by Broadcom",
    "Nairobi, Westlands",
  ],
  image: "/kelvin.png",
};

export const publicTherapists = [primaryTherapist, kelvinTherapist];

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
