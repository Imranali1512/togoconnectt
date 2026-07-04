import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ListingCard from '../components/ListingCard';

const CATEGORIES = [
  { name: 'Plumbing', emoji: '🔧', count: '24+ pros' },
  { name: 'Tutoring', emoji: '📚', count: '38+ tutors' },
  { name: 'Photography', emoji: '📷', count: '15+ studios' },
  { name: 'Cleaning', emoji: '🧹', count: '30+ services' },
  { name: 'Tech Repair', emoji: '💻', count: '20+ techs' },
  { name: 'Barber', emoji: '✂️', count: '42+ barbers' },
  { name: 'Tailoring', emoji: '🧵', count: '18+ tailors' },
  { name: 'Design', emoji: '🎨', count: '22+ designers' },
];

const TESTIMONIALS = [
  { text: 'Found an amazing plumber in minutes. Direct contact, no fees — exactly what I needed.', name: 'Afia Mensah', role: 'Homeowner, Lomé', initials: 'AM' },
  { text: 'TogoConnect helped grow my photography business. Clients from all across Togo now!', name: 'Komi Adjovi', role: 'Wedding Photographer', initials: 'KA' },
  { text: 'My tutor is fantastic. Connected in one day and my grades have improved so much.', name: 'Esinam Komlan', role: 'Student, Kpalimé', initials: 'EK' },
];

const FALLBACK = [
  { id:'d1', title:'Expert Plumbing Repairs & Installation', category:'Plumbing', seller_name:'Kossi Mensah', rating:4.8, num_reviews:42, city:'Lomé', price:15000, price_type:'from', featured:1 },
  { id:'d2', title:'Mobile Barber — Fresh Cuts at Home', category:'Barber', seller_name:'Yao Adjovi', rating:4.9, num_reviews:87, city:'Lomé', price:5000, price_type:'fixed', featured:1 },
  { id:'d3', title:'Math & Science Tutoring', category:'Tutoring', seller_name:'Afi Komlan', rating:4.7, num_reviews:31, city:'Remote', price:8000, price_type:'fixed', featured:1, is_remote:1 },
  { id:'d4', title:'Event & Wedding Photography', category:'Photography', seller_name:'Komi Photography', rating:5.0, num_reviews:19, city:'Lomé', price:75000, price_type:'from', featured:1 },
  { id:'d5', title:'Laptop & Phone Repair', category:'Tech Repair', seller_name:'Tech Fix Togo', rating:4.6, num_reviews:54, city:'Sokodé', price:10000, price_type:'from', featured:1 },
  { id:'d6', title:'Custom Tailoring & Traditional Wear', category:'Tailoring', seller_name:'Atelier Sika', rating:4.9, num_reviews:112, city:'Kpalimé', price:20000, price_type:'from', featured:1 },
  { id:'d7', title:'Home Cleaning Service', category:'Cleaning', seller_name:'Ama Clean Co.', rating:4.5, num_reviews:68, city:'Lomé', price:12000, price_type:'fixed', featured:1 },
  { id:'d8', title:'Website & Logo Design', category:'Design', seller_name:'Studio Akossiwa', rating:4.8, num_reviews:27, city:'Remote', price:50000, price_type:'from', featured:1, is_remote:1 },
];

export default function Home() {
  const [listings, setListings] = useState(FALLBACK);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/listings?featured=1')
      .then(r => { if (r.data.length > 0) setListings(r.data.slice(0,8)); })
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/services${search.trim() ? `?search=${encodeURIComponent(search)}` : ''}`);
  };

  return (
    <>
      {/* ═══ HERO — Full Width ═══ */}
      <section className="hero-full">
        {/* bg blobs */}
        <div className="hf-blob hf-blob1"></div>
        <div className="hf-blob hf-blob2"></div>
        <div className="hf-blob hf-blob3"></div>

        <div className="container hf-inner">
          {/* Badge */}
          <div className="hf-badge">
            <span className="hf-dot"></span>
            Togo's #1 Service Marketplace
          </div>

          {/* Heading */}
          <h1 className="hf-h1">
            Find skilled pros to get<br/>
            things done <em>across Togo.</em>
          </h1>

          {/* Sub */}
          <p className="hf-sub">
            Discover trusted local professionals for home repairs, tutoring, photography and more.<br/>
            Connect directly — no middlemen, zero fees.
          </p>

          {/* Search */}
          <form className="hf-search" onSubmit={handleSearch}>
            <span className="hf-search-ico">🔍</span>
            <input
              type="text"
              placeholder="What service are you looking for?"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit">Search now</button>
          </form>

          {/* Tags */}
          <div className="hf-tags">
            <span className="hf-tags-label">Popular:</span>
            {[{e:'🔧',t:'Plumber'},{e:'📚',t:'Tutor'},{e:'📷',t:'Photographer'},{e:'✂️',t:'Barber'},{e:'🧹',t:'Cleaner'},{e:'💻',t:'Tech Repair'}].map(item=>(
              <span key={item.t} className="hf-tag" onClick={()=>navigate(`/services?search=${item.t.toLowerCase()}`)}>
                {item.e} {item.t}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="hf-stats">
            {[
              {n:'500+', l:'Verified sellers', ico:'👥'},
              {n:'2,000+', l:'Happy clients', ico:'😊'},
              {n:'4.8★', l:'Average rating', ico:'⭐'},
              {n:'100%', l:'Free to use', ico:'💚'},
              {n:'8', l:'Service categories', ico:'📋'},
            ].map(s=>(
              <div key={s.l} className="hf-stat">
                {/* <div className="hf-stat-ico">{s.ico}</div> */}
                <div className="hf-stat-n">{s.n}</div>
                <div className="hf-stat-l">{s.l}</div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hf-ctas">
            <Link to="/services">
              <button className="hf-btn-primary">Browse services →</button>
            </Link>
            <Link to="/signup">
              <button className="hf-btn-secondary">Join as seller — Free</button>
            </Link>
          </div>

          {/* Trust */}
          <div className="hf-trust">
            <span className="hf-trust-pill">🔒 SSL Encrypted</span>
            <span className="hf-trust-pill">✅ Verified sellers</span>
            <span className="hf-trust-pill">💚 Zero hidden fees</span>
            <span className="hf-trust-pill">⚡ Instant messaging</span>
          </div>
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header-row">
            <div>
              <div className="section-label">Browse by category</div>
              <h2 className="section-title">Find exactly what you need</h2>
            </div>
            <Link to="/services" className="link-more">See all →</Link>
          </div>
          <div className='home-cat-grid' style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {CATEGORIES.map((cat,i)=>(
              <div key={cat.name}
                onClick={()=>navigate(`/services?category=${cat.name}`)}
                style={{
                  position:'relative', overflow:'hidden',
                  background: i%3===0 ? 'linear-gradient(135deg,#0f6e56,#1D9E75)' : i%3===1 ? '#fff' : '#f9fafb',
                  border: i%3===0 ? 'none' : '1.5px solid #e5e7eb',
                  borderRadius:16, padding:'28px 22px',
                  cursor:'pointer', transition:'all .22s',
                  boxShadow: i%3===0 ? '0 8px 28px rgba(29,158,117,.22)' : '0 2px 8px rgba(0,0,0,.04)'
                }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow=i%3===0?'0 16px 40px rgba(29,158,117,.32)':'0 8px 24px rgba(0,0,0,.10)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=i%3===0?'0 8px 28px rgba(29,158,117,.22)':'0 2px 8px rgba(0,0,0,.04)';}}>
                {/* Decorative circle */}
                <div style={{
                  position:'absolute', top:-18, right:-18,
                  width:80, height:80, borderRadius:'50%',
                  background: i%3===0 ? 'rgba(255,255,255,.10)' : 'rgba(29,158,117,.06)'
                }}/>
                <div style={{
                  fontSize:11, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase',
                  color: i%3===0 ? 'rgba(255,255,255,.7)' : 'var(--green)',
                  marginBottom:10
                }}>
                  {cat.count}
                </div>
                <div style={{
                  fontSize:18, fontWeight:800,
                  color: i%3===0 ? '#fff' : '#0f1923',
                  marginBottom:6, lineHeight:1.2
                }}>
                  {cat.name}
                </div>
                <div style={{
                  fontSize:12, fontWeight:600,
                  color: i%3===0 ? 'rgba(255,255,255,.75)' : '#9ca3af'
                }}>
                  Browse services →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="section">
        <div className="container">
          <div style={{textAlign:'center',marginBottom:48}}>
            <div className="section-label">Simple process</div>
            <h2 className="section-title">How TogoConnect works</h2>
            <p className="section-sub" style={{margin:'0 auto'}}>Three easy steps to connect with the right professional.</p>
          </div>
          <div className="steps-grid">
            {[
              {n:'1',title:'Search',desc:'Browse by category, city, price or rating to find the perfect professional for your needs.'},
              {n:'2',title:'Connect',desc:'Message the seller directly. Discuss your needs and get a custom quote — free.'},
              {n:'3',title:'Get it done',desc:'Agree on terms, get the job done, and leave an honest review for the community.'},
            ].map(s=>(
              <div key={s.n} className="step-card">
                <div className="step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED LISTINGS ═══ */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header-row">
            <div>
              <div className="section-label">Top picks</div>
              <h2 className="section-title">Featured services</h2>
            </div>
            <Link to="/services" className="link-more">See all →</Link>
          </div>
          <div className="listings-grid">
            {listings.map(l=><ListingCard key={l.id} listing={l}/>)}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="section section-dark">
        <div className="container">
          <div style={{textAlign:'center',marginBottom:44}}>
            <div className="section-label" style={{color:'var(--gm)'}}>What people say</div>
            <h2 className="section-title">Loved across Togo</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t,i)=>(
              <div key={i} className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="cta-banner">
        <div className="container">
          <div className="section-label" style={{color:'var(--gm)',marginBottom:10}}>Join thousands of Togolese</div>
          <h2>Ready to grow your business?</h2>
          <p>Sign up as a seller and reach thousands of buyers — completely free.</p>
          <div className="cta-buttons">
            <Link to="/signup"><button className="btn-white">Get started — it's free</button></Link>
            <Link to="/pricing"><button className="btn-outline-white">View plans →</button></Link>
          </div>
        </div>
      </section>
    </>
  );
}
