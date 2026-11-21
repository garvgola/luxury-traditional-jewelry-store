import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";

const categories = ["Earrings", "Necklaces", "Bangles", "Rings"];

export default function CollectionsPage() {
  return (
    <section className="page-section">
      <SectionHeading eyebrow="Explore the edit" title="The collections" description="A considered starting point for discovering the NAMO NAMO world." />
      <div className="collection-link-grid">
        {categories.map((name) => (
          <Link className="collection-link-card" href={`/collections/${name.toLowerCase()}`} key={name}>
            <span>{name}</span><span aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
      <p className="simple-page-note">Product photography and verified catalogue details will be added when the product catalogue is supplied.</p>
    </section>
  );
}