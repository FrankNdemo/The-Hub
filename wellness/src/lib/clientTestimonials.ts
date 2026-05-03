import {
  familyServiceImage,
  homeSpecializedSupportImage,
  individualServiceImage,
} from "@/lib/serviceImages";
import type { ClientStory, StoryServiceType } from "@/types/wellness";

export interface ClientTestimonial {
  text: string;
  name: string;
  role: string;
  image: string;
}

export const defaultClientTestimonials: ClientTestimonial[] = [
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

const getClientStoryRole = (serviceType: StoryServiceType) => {
  switch (serviceType) {
    case "family":
      return "Family Therapy Client";
    case "corporate":
      return "Corporate Wellness Client";
    default:
      return "Individual Therapy Client";
  }
};

const getClientStoryFallbackImage = (serviceType: StoryServiceType) => {
  switch (serviceType) {
    case "family":
      return familyServiceImage;
    case "corporate":
      return homeSpecializedSupportImage;
    default:
      return individualServiceImage;
  }
};

export const getClientStoryTestimonials = (clientStories: ClientStory[]): ClientTestimonial[] => {
  const publishedStories = clientStories
    .filter((story) => story.status === "published")
    .map((story) => ({
      text: story.publishedText,
      name: story.displayName,
      role: getClientStoryRole(story.serviceType),
      image: story.image || getClientStoryFallbackImage(story.serviceType),
    }));

  return publishedStories.length ? publishedStories : defaultClientTestimonials;
};
