import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link href="/" className="footer-wordmark">NAMO NAMO <span>jewels</span></Link>
          <p>Indian heritage, seen through a contemporary lens.</p>
        </div>
        <div className="footer-column">
          <h3>Explore</h3>
          <Link href="/collections">All jewellery</Link>
          <Link href="/collections/earrings">Earrings</Link>
          <Link href="/collections/necklaces">Necklaces</Link>
          <Link href="/collections/bangles">Bangles</Link>
        </div>
        <div className="footer-column">
          <h3>About</h3>
          <Link href="/about">Our story</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/care">Jewellery care</Link>
        </div>
        <div className="footer-column">
          <h3>Customer care</h3>
          <Link href="/shipping">Shipping information</Link>
          <Link href="/faq">FAQs</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} NAMO NAMO jewels</span>
        <span>Made for moments that matter.</span>
      </div>
    </footer>
  );
}