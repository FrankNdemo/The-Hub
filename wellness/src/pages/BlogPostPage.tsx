import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, User2 } from "lucide-react";

import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { formatDisplayDate } from "@/lib/wellness";

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { blogPosts } = useWellnessHub();

  const post = blogPosts.find((entry) => entry.slug === slug);
  const relatedPosts = blogPosts.filter((entry) => entry.slug !== slug).slice(0, 3);

  if (!post) {
    return (
      <div className="min-h-screen">
        <section className="pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-[2rem] border border-border/60 bg-card p-10 text-center shadow-card">
              <h1 className="font-heading text-4xl font-semibold text-foreground">Article not found</h1>
              <p className="mt-4 text-muted-foreground leading-8">
                This blog post may have been removed or renamed. Return to the blog to explore the latest published
                resources.
              </p>
              <Button variant="hero" className="mt-8 w-full rounded-full sm:w-auto" asChild>
                <Link to="/blog">Back to Blog</Link>
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <article className="pt-24 pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <button
              type="button"
              onClick={() => navigate("/blog")}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-transform hover:-translate-x-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </button>

            <div className="mt-6 overflow-hidden rounded-[2.25rem] border border-border/60 bg-card shadow-card">
              <div className="h-[260px] overflow-hidden md:h-[420px]">
                <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover" />
              </div>

              <div className="px-6 py-8 md:px-10">
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground md:justify-start">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{post.category}</span>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {formatDisplayDate(post.publishDate)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <User2 className="h-4 w-4 text-primary" />
                    {post.author}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary" />
                    {post.readTime}
                  </span>
                </div>

                <h1 className="mt-5 text-center font-heading text-4xl font-semibold leading-tight text-foreground md:text-left md:text-5xl">
                  {post.title}
                </h1>
                <p className="mt-5 max-w-3xl text-center text-lg leading-8 text-muted-foreground md:text-left">{post.excerpt}</p>

                <div className="prose-wellness mt-10" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
              </div>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="wellness-panel rounded-[2rem] border border-border/60 p-6 text-center shadow-card lg:text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Need support now?</p>
                <h2 className="mt-4 font-heading text-3xl font-semibold text-foreground">Continue the conversation in session</h2>
                <p className="mt-4 text-muted-foreground leading-8">
                  If this topic feels close to home, you do not have to carry it alone. Book a session and talk it
                  through with compassionate professional support.
                </p>
                <Button variant="hero" className="mt-6 w-full rounded-full sm:w-auto" asChild>
                  <Link to="/booking">Book a Session</Link>
                </Button>
              </div>

              <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-card">
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Read next</p>
                    <h2 className="mt-3 font-heading text-3xl font-semibold text-foreground">More resources</h2>
                  </div>
                  <Button variant="heroBorder" className="w-full rounded-full sm:w-auto" asChild>
                    <Link to="/blog">View All</Link>
                  </Button>
                </div>

                <div className="mt-6 space-y-4">
                  {relatedPosts.map((entry) => (
                    <Link
                      key={entry.id}
                      to={`/blog/${entry.slug}`}
                      className="group flex flex-col items-center gap-4 rounded-[1.5rem] bg-secondary/35 p-4 text-center transition-all hover:bg-primary/6 sm:flex-row sm:items-start sm:text-left"
                    >
                      <img src={entry.featuredImage} alt={entry.title} className="h-24 w-24 rounded-[1.25rem] object-cover" />
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-primary/70">{entry.category}</p>
                        <p className="mt-2 font-heading text-2xl font-semibold leading-7 text-foreground">{entry.title}</p>
                        <span className="mt-3 inline-flex items-center gap-2 text-sm text-primary transition-transform group-hover:translate-x-1">
                          Read article
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
