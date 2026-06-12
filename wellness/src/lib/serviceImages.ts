export const individualServiceImage =
  "https://images.pexels.com/photos/5234624/pexels-photo-5234624.jpeg?auto=compress&cs=tinysrgb&w=1400&h=960&fit=crop";

export const familyServiceImage =
  "https://images.pexels.com/photos/33622171/pexels-photo-33622171.jpeg?auto=compress&cs=tinysrgb&w=1400&h=960&fit=crop";

export const homeSpecializedSupportImage =
  "https://images.pexels.com/photos/7353060/pexels-photo-7353060.jpeg?auto=compress&cs=tinysrgb&w=1400";

export const specializedServiceImage =
  "https://images.pexels.com/photos/19957220/pexels-photo-19957220.jpeg?auto=compress&cs=tinysrgb&w=1400&h=960&fit=crop";

export const servicePageIndividualImage =
  "https://images.pexels.com/photos/5699447/pexels-photo-5699447.jpeg?auto=compress&cs=tinysrgb&w=1400&h=960&fit=crop";

export const servicePageSpecializedImage =
  "https://images.pexels.com/photos/7579310/pexels-photo-7579310.jpeg?auto=compress&cs=tinysrgb&w=1400&h=960&fit=crop";

export const homepageApproachImage =
  "https://images.pexels.com/photos/30677715/pexels-photo-30677715.jpeg?auto=compress&cs=tinysrgb&w=1800&h=1200&fit=crop";

const pexelsServiceImage = (photoId: number) =>
  `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=820&fit=crop`;

export const servicesPageImages = {
  individualTherapy: servicePageIndividualImage,
  groupTherapy: servicePageSpecializedImage,
  addictionTreatment:
    "https://www.ndnu.edu/articles/images/Black%20male%20therapist%20gives%20advice%20to%20%20a%20substance%20abuse%20patient%20working%20on%20their%20recovery%20.jpg",
  psychotherapy: pexelsServiceImage(8560221),
  mindfulnessStressReset: pexelsServiceImage(3822622),
  griefAndLoss: pexelsServiceImage(8553653),
  childAndAdolescentSupport: pexelsServiceImage(20333029),
  traumaAndCbt: pexelsServiceImage(6382655),
  anxietyAndMentalHealth: "https://www.blackmenshealth.com/wp-content/uploads/2021/11/stress-1024x683.png",
  neurodivergence: pexelsServiceImage(6578397),
  bariatricPsychology: pexelsServiceImage(5215008),
  corporateHealthWellnessTalk: pexelsServiceImage(30677713),
  communityOutreaches: pexelsServiceImage(33763195),
  mentalHealthAwarenessForSchools: pexelsServiceImage(34526411),
  upgradedBoychild: "https://trustafrica.org/wp-content/uploads/2025/11/IMG_9081-scaled.jpg",
  lgbtqSupport: pexelsServiceImage(6579051),
} as const;

export const servicesPageCardImages = Object.values(servicesPageImages);
