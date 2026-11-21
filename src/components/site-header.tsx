"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";

const links = [
  { label: "New Arrivals", href: "/collections/new-arrivals" },
  { label: "Earrings", href: "/collections/earrings" },
  { label: "Necklaces", href: "/collections/necklaces" },
  { label: "Bangles", href: "/collections/bangles" },
  { label: "Our Story", href: "/about" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="utility-bar">A little heritage. A lasting impression.</div>
      <div className="header-main">
        <button
          className="icon-button mobile-menu-button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href="/" className="brand-lockup" aria-label="NAMO NAMO jewels home">
          <span className="brand-mark" aria-hidden="true">✧</span>
          <span className="brand-name">NAMO NAMO</span>
          <span className="brand-subtitle">j e w e l s</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link href={link.href} key={link.label}>{link.label}</Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/search" className="icon-button" aria-label="Search"><Search size={19} /></Link>
          <Link href="/account" className="icon-button account-action" aria-label="Account"><UserRound size={19} /></Link>
          <Link href="/wishlist" className="icon-button wishlist-action" aria-label="Wishlist"><Heart size={19} /></Link>
          <Link href="/cart" className="icon-button" aria-label="Shopping bag"><ShoppingBag size={19} /></Link>
        </div>
      </div>
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link href={link.href} key={link.label} onClick={() => setMenuOpen(false)}>{link.label}</Link>
          ))}
          <Link href="/account" onClick={() => setMenuOpen(false)}>My account</Link>
        </nav>
      )}
    </header>
  );
}