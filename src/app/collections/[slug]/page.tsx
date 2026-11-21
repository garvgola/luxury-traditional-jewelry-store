import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/section-heading";

const allowed = ["new-arrivals", "earrings", "necklaces", "bangles", "rings"];

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!allowed.includes(slug)) notFound();
  const title = slug.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
  return (
    <section className="page-section collection-page">
      <SectionHeading eyebrow="NAMO NAMO jewels" title={title} description="This collection space is ready for verified products, imagery and product details." />
      <div className="catalogue-empty">
        <span className="catalogue-empty-mark">✧</span>
        <h2>The collection is taking shape.</h2>
        <p>Product listings will appear here once the catalogue and product photography are provided.</p>
      </div>
    </section>
  );
}