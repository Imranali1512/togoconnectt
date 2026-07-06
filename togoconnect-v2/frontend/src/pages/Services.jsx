import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { TOGO_LOCATIONS, ALL_REGIONS, SERVICE_CATEGORIES, getCitiesByRegion } from '../data/locations';
import ListingCard from '../components/ListingCard';

const CATEGORIES = ['All categories', ...SERVICE_CATEGORIES];

const RATINGS = [
  { label: 'Any rating', value: 0 },
  { label: '3+ stars', value: 3 },
  { label: '4+ stars', value: 4 },
  { label: '4.5+ stars', value: 4.5 },
];

export default function Services() {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('category') ? [searchParams.get('category')] : []
  );
  const [location, setLocation] = useState('All locations');
  const [selectedRegion, setSelectedRegion] = useState('All regions');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(999999999);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevant');
  const [showAllCats, setShowAllCats] = useState(false);
  const [showRentals, setShowRentals] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    // category filter handled client-side for multi-select
    if (location !== 'All locations') params.city = location;
    if (selectedRegion && selectedRegion !== 'All regions') params.region = selectedRegion;
    axios.get('/api/listings', { params })
      .then(r => setListings(r.data))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [search, location, selectedRegion]);

  const handleCategoryToggle = (cat) => {
    if (cat === 'All categories') {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSearch = () => setSearch(searchInput);

  const filtered = listings.filter(l => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(l.category)) return false;
    if (remoteOnly && !l.is_remote) return false;
    if (Number(l.price) > maxPrice) return false;
    if (Number(l.rating || 0) < minRating) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
    return (b.featured || 0) - (a.featured || 0);
  });

  return (
    <>
      {/* Search bar top */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="filter-wrap filter-search-wrap" style={{ flex: 1 }}>
              <span className="filter-icon">🔍</span>
              <input
                type="text"
                placeholder="Search services..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1 }}
              />
            </div>
            <button className="btn-primary" onClick={handleSearch} style={{ padding: '0 24px', borderRadius: 10, fontWeight: 700 }}>
              Search
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 0 60px', minHeight: 'calc(100vh - 130px)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'start' }}>

            {/* ── LEFT SIDEBAR ── */}
            <div style={{ position: 'sticky', top: 80, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', paddingRight: 4 }}>

              {/* Category */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 12 }}>Category</div>

                <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, fontSize:14, cursor:'pointer', fontWeight:selectedCategories.length===0?700:400 }}>
                  <input type="checkbox" checked={selectedCategories.length === 0} onChange={() => setSelectedCategories([])} style={{ accentColor:'var(--green)' }} />
                  All categories
                </label>

                {/* Services */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6, marginTop:4 }}>Services</div>
                  {['Plumbing','Beauty','Barber','Tutoring','Photography','Tech','Cleaning','Tailoring','Design','Moving','Catering','Electrical','Construction','Mechanic','Legal','Medical','Finance'].slice(0, showAllCats ? 99 : 6).map(cat => (
                    <label key={cat} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, fontSize:13, cursor:'pointer' }}>
                      <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => handleCategoryToggle(cat)} style={{ accentColor:'var(--green)' }} />
                      {cat}
                    </label>
                  ))}
                  <button onClick={() => setShowAllCats(s => !s)}
                    style={{ background:'none', border:'none', color:'var(--green-dark)', fontSize:12, fontWeight:600, cursor:'pointer', padding:'3px 0', marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                    {showAllCats ? '▲ Show less' : '▼ More services'}
                  </button>
                </div>

                {/* Real Estate */}
                <div>
                  <button onClick={() => setShowRentals(s => !s)}
                    style={{ display:'flex', justifyContent:'space-between', width:'100%', background:'none', border:'none', cursor:'pointer', padding:'6px 0', fontSize:11, fontWeight:700, color:showRentals?'var(--green-dark)':'#9ca3af', textTransform:'uppercase', letterSpacing:'.06em', borderTop:'1px solid #f3f4f6' }}>
                    <span>Real Estate</span>
                    <span>{showRentals ? '▲' : '▼'}</span>
                  </button>
                  {showRentals && ['House Rental','Apartment Rental','Land Rental','Store/Shop Rental','Office Rental','Land for Sale','House for Sale','Apartment for Sale'].map(cat => (
                    <label key={cat} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, fontSize:13, cursor:'pointer' }}>
                      <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => handleCategoryToggle(cat)} style={{ accentColor:'var(--green)' }} />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 10 }}>Region</div>
                <select value={selectedRegion}
                  onChange={e => { setSelectedRegion(e.target.value); setLocation('All locations'); }}
                  style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:8, padding:'8px 10px', fontSize:14, color:'var(--text)', background:'#fff', outline:'none' }}>
                  <option value="All regions">All regions</option>
                  {ALL_REGIONS.map(r => <option key={r} value={r}>{r === 'Région Maritime' ? 'Maritime (Lomé)' :
                     r === 'Région des Plateaux' ? 'Plateaux' :
                     r === 'Région Centrale' ? 'Centrale' :
                     r === 'Région de la Kara' ? 'Kara' :
                     r === 'Région des Savanes' ? 'Savanes' : r}</option>)}
                </select>
              </div>

              {/* City */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 10 }}>City</div>
                <select value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:8, padding:'8px 10px', fontSize:14, color:'var(--text)', background:'#fff', outline:'none', marginBottom:10 }}>
                  <option value="All locations">All cities</option>
                  {getCitiesByRegion(selectedRegion).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer' }}>
                  <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} />
                  Remote only
                </label>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 12 }}>Price (CFA)</div>
                <input
                  type="range"
                  min={0} max={1000000} step={5000}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--green)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>0</span>
                  <span>{maxPrice >= 1000000 ? 'Any' : Number(maxPrice).toLocaleString()}</span>
                </div>
              </div>

              {/* Minimum rating */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 12 }}>Minimum rating</div>
                {RATINGS.map(r => (
                  <div key={r.value}
                    onClick={() => setMinRating(r.value)}
                    style={{
                      fontSize: 14, padding: '7px 12px', borderRadius: 8, marginBottom: 5,
                      cursor: 'pointer', fontWeight: minRating === r.value ? 700 : 400,
                      color: minRating === r.value ? 'var(--green-dark)' : 'var(--text)',
                      background: minRating === r.value ? 'var(--green-light)' : 'transparent'
                    }}>
                    {r.label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT CONTENT ── */}
            <div>
              {/* Results bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  {loading ? 'Loading...' : `${sorted.length} services found`}
                </span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  style={{
                    border: '1.5px solid var(--border)', borderRadius: 8,
                    padding: '7px 12px', fontSize: 13, background: '#fff',
                    color: 'var(--text)', outline: 'none', cursor: 'pointer'
                  }}>
                  <option value="relevant">Most relevant</option>
                  <option value="rating">Highest rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              {loading ? (
                <div className="loader"><div className="spinner"></div></div>
              ) : sorted.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <h3>No services found</h3>
                  <p>Try adjusting your filters or search with different keywords.</p>
                </div>
              ) : (
                <div className="listings-grid">
                  {sorted.map(l => <ListingCard key={l.id} listing={l} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
