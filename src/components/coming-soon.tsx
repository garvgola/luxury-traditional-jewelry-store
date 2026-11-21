import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <section className="simple-page">
      <span className="eyebrow">NAMO NAMO jewels</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <p className="simple-page-note">This section is part of the storefront roadmap and is not connected to live commerce services yet.</p>
      <Link href="/" className="button button-primary"><ArrowLeft size={15} /> Back to home</Link>
    </section>
  );
}