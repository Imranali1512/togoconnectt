import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef } from 'react';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const hasPlan = user && user.plan && user.plan !== 'basic';

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">T</div>
            TogoConnect
          </Link>

          <div className="navbar-links">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} className={`nav-link${isActive(l.to) ? ' active' : ''}`}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="navbar-actions">
            {user ? (
              <>
                {/* User avatar dropdown */}
                <div ref={dropRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setDropOpen(d => !d)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'none', border: '1.5px solid #e5e7eb',
                      borderRadius: 100, padding: '5px 12px 5px 6px',
                      cursor: 'pointer', transition: 'border-color .2s',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    {user.avatar
                      ? <img src={user.avatar} alt="avatar" style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                      : <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:800, flexShrink:0 }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                    }
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f1923' }} className="nav-user-name">
                      {user.name?.split(' ')[0]}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: .5, transition: 'transform .2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }}>
                      <path d="M2 4l4 4 4-4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {dropOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                      background: '#fff', border: '1px solid #e5e7eb',
                      borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)',
                      minWidth: 200, zIndex: 999, overflow: 'hidden'
                    }}>
                      {/* User info */}
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display:'flex', alignItems:'center', gap:10 }}>
                        {user.avatar
                          ? <img src={user.avatar} alt="avatar" style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                          : <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14, fontWeight:800, flexShrink:0 }}>
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                        }
                        <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f1923' }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{user.email}</div>
                        <div style={{
                          display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 700,
                          padding: '2px 10px', borderRadius: 100,
                          background: user.plan === 'premium' ? '#f5f3ff' : user.plan === 'standard' ? '#ecfdf5' : user.plan === 'basic' ? '#f3f4f6' : '#f9fafb',
                          color: user.plan === 'premium' ? '#7c3aed' : user.plan === 'standard' ? '#0f6e56' : user.plan === 'basic' ? '#374151' : '#9ca3af',
                        }}>
                          {user.plan === 'premium' ? 'Premium' : user.plan === 'standard' ? 'Standard' : user.plan === 'basic' ? 'Basic' : 'Free'} Plan
                        </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      {[
                        { label: 'Dashboard', to: '/dashboard?tab=overview' },
                ...(user.role_admin ? [{ label: 'Admin Panel', to: '/admin' }] : []),
                        { label: 'Messages', to: '/dashboard?tab=messages' },
                        ...(hasPlan ? [{ label: 'My Listings', to: '/dashboard?tab=listings' }] : []),
                        { label: 'Settings', to: '/dashboard?tab=settings' },
                        { label: 'Pricing', to: '/pricing' },
                      ].map(item => (
                        <div key={item.label}
                          onClick={() => { setDropOpen(false); navigate(item.to); }}
                          style={{
                            padding: '11px 16px', fontSize: 14, color: '#374151',
                            cursor: 'pointer', transition: 'background .15s', fontWeight: 500,
                            display: 'flex', alignItems: 'center', gap: 10
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          {item.label}
                        </div>
                      ))}

                      <div style={{ borderTop: '1px solid #f3f4f6' }}>
                        <div
                          onClick={() => { logout(); navigate('/'); }}
                          style={{
                            padding: '11px 16px', fontSize: 14, color: '#dc2626',
                            cursor: 'pointer', fontWeight: 600,
                            transition: 'background .15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          Log out
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login"><button className="btn-ghost nav-desktop-only">Log in</button></Link>
                <Link to="/pricing"><button className="btn-primary">View plans</button></Link>
              </>
            )}

            {/* Hamburger */}
            <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <span className={`ham-line${menuOpen ? ' open' : ''}`}></span>
              <span className={`ham-line${menuOpen ? ' open' : ''}`}></span>
              <span className={`ham-line${menuOpen ? ' open' : ''}`}></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu-inner" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="navbar-logo"><div className="logo-icon">T</div>TogoConnect</div>
              <button className="mobile-menu-close" onClick={() => setMenuOpen(false)}>x</button>
            </div>
            <div className="mobile-menu-links">
              {NAV_LINKS.map(l => (
                <Link key={l.to} to={l.to} className={`mobile-nav-link${isActive(l.to) ? ' active' : ''}`}>{l.label}</Link>
              ))}
            </div>
            <div className="mobile-menu-actions">
              {user ? (
                <>
                  <Link to="/dashboard" className="mobile-btn-primary">Dashboard</Link>
                  <Link to="/dashboard?tab=messages" className="mobile-btn-outline">Messages</Link>
                  <button className="mobile-btn-outline" onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}>Log out</button>
                </>
              ) : (
                <>
                  <Link to="/signup" className="mobile-btn-primary">Sign up free</Link>
                  <Link to="/login" className="mobile-btn-outline">Log in</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
