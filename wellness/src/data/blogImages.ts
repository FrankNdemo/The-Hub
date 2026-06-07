import blogAnxiety from "@/assets/blog-anxiety.jpg";
import blogFamily from "@/assets/blog-family.jpg";
import blogGrief from "@/assets/blog-grief.jpg";
import blogHabits from "@/assets/blog-habits.jpg";
import blogNeurodivergent from "@/assets/blog-neurodivergent.jpg";
import blogVulnerability from "@/assets/blog-vulnerability.jpg";

type BlogImageInput = {
  featuredImage?: string;
  slug?: string;
  category?: string;
  title?: string;
  tags?: string[];
};

const blogImageBySlug: Record<string, string> = {
  "understanding-anxiety": blogAnxiety,
  "daily-habits-mental-wellness": blogHabits,
  "family-therapy-relationships": blogFamily,
  "power-of-vulnerability": blogVulnerability,
  "navigating-grief": blogGrief,
  "supporting-neurodivergent-children": blogNeurodivergent,
};

export const instantBlogImages = [
  blogAnxiety,
  blogHabits,
  blogFamily,
  blogVulnerability,
  blogGrief,
  blogNeurodivergent,
];

const blogImageByFileName: Record<string, string> = {
  "blog-anxiety.jpg": blogAnxiety,
  "blog-family.jpg": blogFamily,
  "blog-grief.jpg": blogGrief,
  "blog-habits.jpg": blogHabits,
  "blog-neurodivergent.jpg": blogNeurodivergent,
  "blog-vulnerability.jpg": blogVulnerability,
};

const fallbackRules: Array<{ image: string; pattern: RegExp }> = [
  { image: blogAnxiety, pattern: /anxiety|stress|mental health|cbt/i },
  { image: blogHabits, pattern: /habit|mindfulness|routine|wellness/i },
  { image: blogFamily, pattern: /family|relationship|communication/i },
  { image: blogVulnerability, pattern: /vulnerability|personal growth|healing|help/i },
  { image: blogGrief, pattern: /grief|loss/i },
  { image: blogNeurodivergent, pattern: /neurodiverg|adhd|autism|parent/i },
];

const hasRenderableImageSource = (value: string) =>
  /^(https?:|data:image\/|blob:|\/)/i.test(value) && !value.includes("/src/assets/");

export const resolveBlogImage = ({ featuredImage = "", slug = "", category = "", title = "", tags = [] }: BlogImageInput) => {
  const trimmedImage = featuredImage.trim();

  if (trimmedImage) {
    const fileName = trimmedImage.split(/[\\/]/).pop() ?? "";
    const localAssetImage = blogImageByFileName[fileName];

    if (localAssetImage) {
      return localAssetImage;
    }

    if (hasRenderableImageSource(trimmedImage)) {
      return trimmedImage;
    }
  }

  const slugImage = blogImageBySlug[slug];

  if (slugImage) {
    return slugImage;
  }

  const searchText = `${slug} ${category} ${title} ${tags.join(" ")}`;
  return fallbackRules.find((rule) => rule.pattern.test(searchText))?.image ?? blogAnxiety;
};

export const resolveInstantBlogImage = ({ featuredImage = "", slug = "", category = "", title = "", tags = [] }: BlogImageInput) => {
  const trimmedImage = featuredImage.trim();

  if (trimmedImage) {
    const fileName = trimmedImage.split(/[\\/]/).pop() ?? "";
    const localAssetImage = blogImageByFileName[fileName];

    if (localAssetImage) {
      return localAssetImage;
    }

    if (hasRenderableImageSource(trimmedImage)) {
      return trimmedImage;
    }
  }

  const slugImage = blogImageBySlug[slug];

  if (slugImage) {
    return slugImage;
  }

  const searchText = `${slug} ${category} ${title} ${tags.join(" ")}`;
  return fallbackRules.find((rule) => rule.pattern.test(searchText))?.image ?? blogAnxiety;
};
