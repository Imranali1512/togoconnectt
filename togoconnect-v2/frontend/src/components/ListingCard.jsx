import { useNavigate } from 'react-router-dom';

export default function ListingCard({ listing }) {
  const navigate = useNavigate();
  const initials = listing.seller_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
  // seller_avatar comes from listings JOIN with users in backend
  const sellerAvatar = listing.seller_avatar || listing.seller?.avatar || null;

  return (
    <div className="listing-card" onClick={() => navigate(`/listings/${listing.id}`)}>
      <div className="listing-img">
        {listing.image
          ? <img src={listing.image} alt={listing.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#e8f5f0', color:'var(--green-dark)', fontSize:32, fontWeight:800 }}>
              {listing.title?.charAt(0)}
            </div>
        }
      </div>

      <div className="listing-body">
        <div className="listing-category">{listing.category}</div>
        <div className="listing-title">{listing.title}</div>
        <div className="listing-seller">
          {sellerAvatar
            ? <img src={sellerAvatar} alt={listing.seller_name} style={{ width:24, height:24, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
            : <div className="seller-avatar">{initials}</div>
          }
          {listing.seller_name}
        </div>
        <div className="listing-location">
          <span style={{ color:'#9ca3af', fontSize:13 }}>
            {listing.is_remote ? 'Remote / Online' : listing.city}
          </span>
        </div>
        <div className="listing-footer-meta">
          <span className="listing-rating">
            ★ {Number(listing.rating || 0).toFixed(1)}
            <span>({listing.num_reviews || 0})</span>
          </span>
          <span className="listing-price">
            {listing.price_type === 'from' ? 'From ' : ''}
            {Number(listing.price).toLocaleString()} CFA
          </span>
        </div>
      </div>

      <div className="listing-card-footer">
        <button className="btn-msg" onClick={e => { e.stopPropagation(); navigate(`/listings/${listing.id}`); }}>
          Message seller
        </button>
      </div>
    </div>
  );
}
