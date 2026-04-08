import type { BlogPost } from "@/types/wellness";
import { markdownToHtml } from "@/lib/wellness";

import blogAnxiety from "@/assets/blog-anxiety.jpg";
import blogHabits from "@/assets/blog-habits.jpg";
import blogFamily from "@/assets/blog-family.jpg";
import blogVulnerability from "@/assets/blog-vulnerability.jpg";
import blogGrief from "@/assets/blog-grief.jpg";
import blogNeurodivergent from "@/assets/blog-neurodivergent.jpg";

interface SeedBlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  publishDate: string;
  excerpt: string;
  featuredImage: string;
  tags: string[];
  content: string;
}

export const blogImageMap = {
  anxiety: blogAnxiety,
  habits: blogHabits,
  family: blogFamily,
  vulnerability: blogVulnerability,
  grief: blogGrief,
  neurodivergent: blogNeurodivergent,
};

const seedBlogPostsContent: SeedBlogPost[] = [
  {
    id: "post-anxiety",
    slug: "understanding-anxiety",
    title: "Understanding Anxiety: Signs, Causes, and Coping Strategies",
    category: "Mental Health",
    publishDate: "2025-12-01",
    excerpt:
      "Anxiety is more than worry. Learn how it shows up in the body, what can trigger it, and a few grounded ways to regain a sense of calm.",
    featuredImage: blogImageMap.anxiety,
    tags: ["Anxiety", "Stress", "CBT", "Coping Skills"],
    content: `Anxiety is one of the most common mental health concerns, and it can affect how you think, feel, and function in everyday life. While anxiety is a normal response to stress, persistent anxiety can make work, relationships, sleep, and concentration feel much harder than they need to.

## Signs of Anxiety

- **Racing thoughts** that are difficult to slow down.
- **A tense body** including headaches, chest tightness, or stomach discomfort.
- **Restlessness** or a constant feeling of being on edge.
- **Sleep difficulties** such as struggling to fall asleep or stay asleep.
- **Avoidance** of places, tasks, or conversations that feel overwhelming.

## What Can Cause It?

Anxiety can be shaped by many factors, including ongoing stress, difficult life transitions, trauma, personality, family history, and physical exhaustion. Often, it is not just one thing. It can build slowly over time until the nervous system begins to feel overworked.

## Coping Strategies That Help

### Slow your breathing

Gentle breathing exercises can calm the body enough for the mind to feel safer.

### Name what you notice

Labeling your thoughts, emotions, and physical sensations can reduce their intensity.

### Stay connected to the present

Grounding exercises such as noticing five things you can see or feel can help bring you back to the moment.

### Build support

Talking to a trusted person or therapist can help you understand what your anxiety is trying to communicate.

## When to Seek Support

If anxiety is interfering with your daily life, relationships, or confidence, therapy can help. You do not need to wait until things become unbearable. Support can be helpful early, gently, and consistently.`,
  },
  {
    id: "post-habits",
    slug: "daily-habits-mental-wellness",
    title: "5 Daily Habits That Support Your Mental Wellness",
    category: "Wellness Tips",
    publishDate: "2026-02-01",
    excerpt:
      "Small routines can create meaningful emotional stability. These five daily habits are simple, realistic, and supportive of long-term mental wellness.",
    featuredImage: blogImageMap.habits,
    tags: ["Habits", "Mindfulness", "Routine", "Wellness"],
    content: `Mental wellness is often built through small choices repeated with care. You do not need a dramatic reset to feel better. Gentle consistency matters.

## 1. Begin your morning with intention

Instead of rushing into the day, pause for a few minutes. Stretch, breathe, pray, journal, or simply sit in quiet.

## 2. Move your body

Walking, stretching, dancing, or yoga can ease stress and support emotional regulation.

## 3. Limit digital overload

Constant notifications can keep the nervous system activated. Giving yourself pockets of quiet can be deeply regulating.

## 4. Make room for real connection

A short conversation with someone safe can improve your sense of grounding and belonging.

## 5. Create a calm ending to the day

Reduce stimulation before bed. A consistent evening wind-down routine can support better rest and a steadier mood.

## Start Small

Choose one habit, not all five. Let it become natural before adding another. Mental wellness grows through compassionate repetition, not pressure.`,
  },
  {
    id: "post-family",
    slug: "family-therapy-relationships",
    title: "How Family Therapy Can Strengthen Your Relationships",
    category: "Family",
    publishDate: "2026-01-01",
    excerpt:
      "Family relationships can hold deep love and deep frustration at the same time. Family therapy creates space to repair patterns and build healthier communication.",
    featuredImage: blogImageMap.family,
    tags: ["Family Therapy", "Relationships", "Communication"],
    content: `Family therapy offers a supportive environment where each person can be heard without blame. It helps families move away from repeating painful patterns and toward healthier ways of understanding one another.

## What Family Therapy Supports

- Communication breakdowns
- Parent and adolescent tension
- Life transitions such as grief, relocation, or separation
- Emotional distance or recurring conflict

## Why It Helps

Instead of focusing on one person as the problem, family therapy looks at how everyone affects the system. This can reduce shame and create room for shared responsibility.

## What Sessions Feel Like

Sessions are guided conversations. The therapist helps each person speak honestly, listen more fully, and identify patterns that keep the family stuck.

## The Goal

The goal is not perfection. It is greater understanding, safer communication, and a stronger emotional foundation for the family as a whole.`,
  },
  {
    id: "post-vulnerability",
    slug: "power-of-vulnerability",
    title: "The Power of Vulnerability: Why It Is Okay to Ask for Help",
    category: "Personal Growth",
    publishDate: "2025-12-15",
    excerpt:
      "Vulnerability is not weakness. It is often the doorway to healing, connection, and courage. Asking for help can be one of the strongest choices you make.",
    featuredImage: blogImageMap.vulnerability,
    tags: ["Vulnerability", "Healing", "Personal Growth"],
    content: `Many people grow up believing that strength means handling everything alone. In reality, emotional honesty takes courage. Vulnerability is often where healing begins.

## Why We Resist Asking for Help

- Fear of judgment
- Pressure to appear strong
- Past experiences of being dismissed
- Uncertainty about where to begin

## What Changes When You Open Up

When you allow yourself to be supported, you create room for relief, connection, and perspective. You also stop carrying pain in isolation.

## Therapy as a Safe Space

Therapy offers a structured, confidential place where you do not have to perform strength. You can be human, uncertain, grieving, hopeful, or tired. All of it belongs.`,
  },
  {
    id: "post-grief",
    slug: "navigating-grief",
    title: "Navigating Grief: A Gentle Guide to Healing",
    category: "Grief and Loss",
    publishDate: "2025-11-01",
    excerpt:
      "Grief has no straight path. This guide offers compassionate reminders for moving through loss with honesty, softness, and support.",
    featuredImage: blogImageMap.grief,
    tags: ["Grief", "Loss", "Healing"],
    content: `Grief can touch every part of life. It may follow the loss of a loved one, a relationship, a home, a dream, or a former version of yourself. There is no single correct way to grieve.

## Common Grief Responses

- Sadness or numbness
- Anger or guilt
- Fatigue and brain fog
- Changes in sleep or appetite
- A sense of disorientation

## What Helps

### Let grief move at its own pace

Healing cannot be rushed.

### Stay connected to care

Supportive people, rituals, and therapeutic spaces can help carry some of the weight.

### Honor what was lost

Remembering, writing, praying, speaking, or creating can all be meaningful expressions of grief.

## A Gentle Reminder

You are not grieving incorrectly. Your process may be slow, layered, and deeply personal. That does not make it less valid.`,
  },
  {
    id: "post-neurodivergent",
    slug: "supporting-neurodivergent-children",
    title: "Supporting Neurodivergent Children: A Parent's Guide",
    category: "Neurodivergence",
    publishDate: "2025-10-01",
    excerpt:
      "Every child experiences the world differently. This guide helps parents support neurodivergent children with more understanding, structure, and confidence.",
    featuredImage: blogImageMap.neurodivergent,
    tags: ["ADHD", "Autism", "Parenting", "Neurodivergence"],
    content: `Neurodivergent children often process information, emotion, routine, and social connection in ways that differ from their peers. Support begins with understanding rather than trying to force sameness.

## What Support Can Look Like

- Clear routines and expectations
- Sensory-aware environments
- Strength-based encouragement
- Collaboration with schools and caregivers
- Professional support when needed

## Focus on the Child, Not Just the Diagnosis

Labels can be useful, but the child in front of you matters most. Their needs, strengths, stressors, and style of communication all deserve attention.

## Supporting the Family Too

Parents need support as well. Therapy can help families navigate overwhelm, build confidence, and create systems that feel more sustainable for everyone.`,
  },
];

export const seedBlogPosts: BlogPost[] = seedBlogPostsContent.map((post) => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  category: post.category,
  publishDate: post.publishDate,
  author: "Caroline Gichia",
  readTime: post.slug === "understanding-anxiety" ? "5 min read" : post.slug === "navigating-grief" ? "6 min read" : "4 min read",
  excerpt: post.excerpt,
  featuredImage: post.featuredImage,
  contentHtml: markdownToHtml(post.content),
  tags: post.tags,
}));
