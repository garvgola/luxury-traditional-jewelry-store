import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { createClient } from "@/lib/supabase/server";

const fallbackCategories = [
  { name: "Earrings", note: "Details that frame every moment", tone: "category-rose", href: "/collections/earrings" },
  { name: "Necklaces", note: "The art of a graceful statement", tone: "category-sand", href: "/collections/necklaces" },
  { name: "Bangles", note: "A little rhythm in every gesture", tone: "category-olive", href: "/collections/bangles" },
  { name: "Rings", note: "Small pieces, personal meaning", tone: "category-plum", href: "/collections/rings" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: liveCategories } = supabase
    ? await supabase.from("categories").select("name,slug,description,sort_order").eq("is_active",true).order("sort_order").order("name")
    : { data: null };
  const tones = ["category-rose","category-sand","category-olive","category-plum"];
  const categories = liveCategories?.length
    ? liveCategories.map((category,index)=>({name:category.name,note:category.description || "Explore the NAMO NAMO collection",tone:tones[index % tones.length],href:`/collections/${category.slug}`}))
    : fallbackCategories;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow"><Sparkles size={13} /> Heritage, reimagined</span>
          <h1>Jewellery that carries <em>stories</em>.</h1>
          <p>Rooted in the beauty of Indian tradition. Refined for the way you live today.</p>
          <div className="hero-actions">
            <Link href="/collections" className="button button-primary">Explore the collection <ArrowRight size={16} /></Link>
            <Link href="/about" className="text-link">Discover our world <ArrowUpRight size={15} /></Link>
          </div>
        </div>
        <div className="hero-art" role="img" aria-label="Decorative abstract heritage-inspired composition in burgundy, ivory and antique gold">
          <div className="hero-art-frame">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-gem">✦</div>
            <span className="hero-art-caption">A modern heirloom</span>
          </div>
          <span className="hero-side-note">THE ART OF ADORNMENT · EST. WITH INTENTION</span>
        </div>
      </section>

      <section className="category-section page-section">
        <SectionHeading eyebrow="Find your expression" title="A world of adornment" description="Explore pieces for celebrations, everyday rituals and everything in between." />
        <div className="category-grid">
          {categories.map((category, index) => (
            <Link className="category-card" href={category.href} key={category.name}>
              <div className={`category-art ${category.tone}`}>
                <span className="category-number">0{index + 1}</span>
                <span className="category-symbol" aria-hidden="true">{["❋", "◈", "⌁", "✧"][index]}</span>
                <span className="category-discover">Discover <ArrowUpRight size={15} /></span>
              </div>
              <div className="category-meta"><h3>{category.name}</h3><p>{category.note}</p></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="story-band">
        <div className="story-ornament" aria-hidden="true">❧</div>
        <div className="story-content">
          <span className="eyebrow">The NAMO NAMO point of view</span>
          <h2>Tradition is not <em>stood still.</em><br />It moves with us.</h2>
          <p>We bring heritage-inspired design into a considered, contemporary world. Each detail has room to be noticed; every piece has space to become your own.</p>
          <Link href="/about" className="button button-light">Our story <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="editorial-section page-section">
        <div className="editorial-copy">
          <span className="eyebrow">A note on choosing well</span>
          <h2>Made to be part of <em>your story.</em></h2>
          <p>Discover the details, finishes and care notes that help you choose with confidence. Verified product information and clear delivery guidance will accompany each piece as our collection takes shape.</p>
          <Link href="/collections" className="text-link">Browse jewellery <ArrowRight size={15} /></Link>
        </div>
        <div className="editorial-art" aria-hidden="true">
          <div className="editorial-arch"><span>✧</span></div>
          <div className="editorial-stamp">NAMO<br />NAMO<br /><small>JEWELS</small></div>
        </div>
      </section>

      <section className="newsletter-section">
        <span className="eyebrow">A considered note, now and then</span>
        <h2>Stay close to the story.</h2>
        <p>Our newsletter will arrive when there is something meaningful to share.</p>
        <span className="newsletter-note">Newsletter sign-up will be enabled after the email and consent workflow is configured.</span>
      </section>
    </>
  );
}