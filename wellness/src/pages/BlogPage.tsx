import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";

import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { pageHeaderBackgrounds, softPageBackgroundStyle } from "@/lib/pageBackground";
import { formatDisplayDate, stripHtml } from "@/lib/wellness";

const BlogPage = () => {
  const { blogPosts, isInitializing } = useWellnessHub();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const filterRailRef = useRef<HTMLDivElement | null>(null);

  const sortedPosts = useMemo(
    () => [...blogPosts].sort((left, right) => right.publishDate.localeCompare(left.publishDate)),
    [blogPosts],
  );

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(sortedPosts.map((post) => post.category)))],
    [sortedPosts],
  );

  const query = search.trim().toLowerCase();

  const searchMatchedPosts = useMemo(() => {
    if (!query) {
      return sortedPosts;
    }

    return sortedPosts.filter((post) => {
      const searchText = `${post.title} ${post.category} ${post.excerpt} ${post.tags.join(" ")} ${stripHtml(post.contentHtml)}`.toLowerCase();
      return searchText.includes(query);
    });
  }, [query, sortedPosts]);

  const visibleCategories = useMemo(() => {
    if (!query) {
      return categories;
    }

    const matchingCategories = new Set(searchMatchedPosts.map((post) => post.category));
    return ["All", ...categories.filter((category) => category !== "All" && matchingCategories.has(category))];
  }, [categories, query, searchMatchedPosts]);

  useEffect(() => {
    if (!visibleCategories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [activeCategory, visibleCategories]);

  useEffect(() => {
    const rail = filterRailRef.current;

    if (!rail) {
      return;
    }

    const updateScrollState = () => {
      setCanScrollLeft(rail.scrollLeft > 8);
      setCanScrollRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 8);
    };

    const frame = window.requestAnimationFrame(updateScrollState);

    rail.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [search, visibleCategories]);

  const filteredPosts = useMemo(
    () =>
      searchMatchedPosts.filter((post) => {
        return activeCategory === "All" || post.category === activeCategory;
      }),
    [activeCategory, searchMatchedPosts],
  );

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);
  const searchWidthCh = search.length <= 1 ? 10 : Math.min(30, Math.max(10, search.length + 7));

  const scrollFilters = (direction: "left" | "right") => {
    const rail = filterRailRef.current;

    if (!rail) {
      return;
    }

    rail.scrollBy({
      left: direction === "right" ? 280 : -280,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen" style={softPageBackgroundStyle}>
      <PageHeader
        title="Blog"
        description="Explore real-time articles from The Wellness Hub on anxiety, grief, family wellbeing, neurodivergence, daily wellness, and the emotional work of healing."
        detailLabel="Inside the journal"
        detailItems={[
          "Fresh reflections from the practice in real time.",
          "Topics include anxiety, grief, family wellbeing, and neurodivergence.",
          "Search by theme or filter by category below.",
        ]}
        backgroundImage={pageHeaderBackgrounds.blog.src}
        backgroundPosition={pageHeaderBackgrounds.blog.position}
      >
        <div className="relative mx-auto w-full">
          <div
            ref={filterRailRef}
            className="no-scrollbar overflow-x-auto scroll-smooth px-0 sm:px-12 lg:px-14"
          >
            <div className="flex min-w-max items-center gap-3 pr-14 sm:pr-8">
              <div
                className="relative w-[10rem] shrink-0 transition-[width] duration-200 ease-out"
                style={search.length > 1 ? { width: `min(24rem, ${searchWidthCh}ch)` } : undefined}
              >
                <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/80" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search"
                  className="h-14 rounded-full border-white/16 bg-white/10 pl-12 pr-4 text-[0.98rem] text-white shadow-soft backdrop-blur-md placeholder:text-white/66 focus-visible:ring-1 focus-visible:ring-white/28"
                />
              </div>

              {visibleCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-5 py-3 text-[0.98rem] transition-all ${
                    activeCategory === category
                      ? "border border-white/20 bg-white/18 text-white shadow-card backdrop-blur-md"
                      : "border border-white/10 bg-white/8 text-white/88 backdrop-blur-md hover:bg-white/14 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {canScrollLeft ? (
            <button
              type="button"
              onClick={() => scrollFilters("left")}
              className="absolute left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary/70 bg-primary text-primary-foreground shadow-[0_16px_32px_-20px_rgba(35,72,61,0.9)] transition-all hover:bg-primary/90 sm:flex"
              aria-label="Scroll filters left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : null}

          {canScrollRight ? (
            <button
              type="button"
              onClick={() => scrollFilters("right")}
              className="absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary/70 bg-primary text-primary-foreground shadow-[0_16px_32px_-20px_rgba(35,72,61,0.9)] transition-all hover:bg-primary/90 sm:flex"
              aria-label="Scroll filters right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </PageHeader>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          {isInitializing ? (
            <div className="rounded-[2rem] bg-card p-10 text-center shadow-card">
              <p className="text-muted-foreground">Loading the latest articles...</p>
            </div>
          ) : null}

          {!isInitializing && featuredPost ? (
            <div className="rounded-[2rem] border border-border/60 bg-card p-5 shadow-card">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="overflow-hidden rounded-[1.75rem]">
                  <img src={featuredPost.featuredImage} alt={featuredPost.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col justify-center text-center lg:text-left">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Featured read</p>
                  <h2 className="mt-4 font-heading text-3xl font-semibold text-foreground md:text-4xl">
                    {featuredPost.title}
                  </h2>
                  <p className="mt-4 text-muted-foreground leading-8">{featuredPost.excerpt}</p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground lg:justify-start">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{featuredPost.category}</span>
                    <span>{featuredPost.readTime}</span>
                    <span>{formatDisplayDate(featuredPost.publishDate)}</span>
                  </div>
                  <Button variant="hero" className="mt-8 w-full rounded-full sm:w-fit" asChild>
                    <Link to={`/blog/${featuredPost.slug}`}>
                      Read Article
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : !isInitializing ? (
            <div className="rounded-[2rem] bg-card p-10 text-center shadow-card">
              <p className="text-muted-foreground">No articles match your search right now.</p>
            </div>
          ) : null}

          {!isInitializing && remainingPosts.length ? (
            <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {remainingPosts.map((post) => (
                <article key={post.id} className="group overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-hover">
                  <Link to={`/blog/${post.slug}`} className="block h-full">
                    <div className="h-56 overflow-hidden">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] text-primary/70">
                        <span>{post.category}</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h3 className="mt-4 font-heading text-2xl font-semibold leading-8 text-foreground">{post.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
                      <div className="mt-6 flex flex-col items-center gap-3 border-t border-border/50 pt-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          {formatDisplayDate(post.publishDate)}
                        </span>
                        <span className="inline-flex items-center gap-2 text-primary transition-transform group-hover:translate-x-1">
                          Read
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPage;
