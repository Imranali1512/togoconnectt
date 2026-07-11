import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const { pathname } = useLocation();
  const isActive = (path) => pathname === path;

  const fl = (to, label) => (
    <Link to={to} style={{
      display: 'block',
      fontSize: 13,
      marginBottom: 9,
      fontWeight: isActive(to) ? 700 : 400,
      color: isActive(to) ? '#5DCAA5' : '#475569',
      borderLeft: isActive(to) ? '2px solid #1D9E75' : '2px solid transparent',
      paddingLeft: isActive(to) ? 8 : 0,
      transition: 'all .15s',
    }}
    onMouseEnter={e => { if (!isActive(to)) e.currentTarget.style.color = '#fff'; }}
    onMouseLeave={e => { if (!isActive(to)) e.currentTarget.style.color = '#475569'; }}
    >{label}</Link>
  );

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">T</div>
              <span className="footer-logo-text">TogoConnect</span>
            </div>
            <p>The simple, trusted way to find and offer local services across Togo and West Africa.</p>
            <div style={{ marginTop:16, fontSize:13, color:'#334155' }}>
              <div>📧 hello@togoconnect.com</div>
              <div style={{ marginTop:4 }}>📍 Lomé, Togo</div>
            </div>
            <div className="footer-social" style={{ marginTop:16 }}>
              <div className="social-btn">𝕏</div>
              <div className="social-btn">f</div>
              <div className="social-btn">in</div>
              <div className="social-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></div>
            </div>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            {fl('/services','Browse Services')}
            {fl('/pricing','Pricing & Plans')}
            {fl('/signup','Become a Seller')}
            {fl('/login','Sign In')}
            {fl('/dashboard','Dashboard')}
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            {fl('/about','About Us')}
            {fl('/blog','Blog')}
            {fl('/careers','Careers')}
            {fl('/contact','Contact Us')}
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            {fl('/how-it-works','How It Works')}
            {fl('/safety-tips','Safety Tips')}
            {fl('/help','Help Center')}
            {fl('/privacy','Privacy Policy')}
            {fl('/terms','Terms & Conditions')}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 TogoConnect. All Rights Reserved. Built by <strong style={{ color:'#5DCAA5' }}><a href="https://hfdesignsllc.com/" target="_blank" rel="noreferrer" style={{ color:"#1D9E75", textDecoration:"none", fontWeight:700 }}>HF Design LLC</a></strong>.</span>
          <div className="footer-badge">
            <span className="footer-badge-dot"></span>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
