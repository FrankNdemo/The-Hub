import { ArrowRight } from "lucide-react";

const posts = [
  { title: "Understanding Anxiety: Signs, Symptoms & Coping Strategies", category: "Mental Health", date: "March 2026" },
  { title: "5 Daily Habits That Support Your Mental Wellness", category: "Wellness Tips", date: "February 2026" },
  { title: "How Family Therapy Can Strengthen Your Relationships", category: "Family", date: "January 2026" },
];

const BlogSection = () => (
  <section id="blog" className="py-24 bg-secondary/30">
    <div className="container mx-auto px-4">
      <h2 className="font-heading text-4xl md:text-5xl font-semibold text-foreground">Resources & Insights</h2>
      <p className="text-muted-foreground mt-3 max-w-lg">Mental health education, tips, and wellness guidance.</p>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {posts.map((p) => (
          <article key={p.title} className="bg-card rounded-2xl p-6 shadow-card hover:shadow-hover transition-shadow duration-300 group cursor-pointer">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">{p.category}</span>
            <h3 className="font-heading text-lg font-semibold text-foreground mt-2 leading-snug">{p.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{p.date}</p>
            <div className="flex items-center gap-1 text-primary text-sm font-medium mt-4 group-hover:gap-2 transition-all">
              Read More <ArrowRight className="w-4 h-4" />
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default BlogSection;
