import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EMOJI = { Plumbing: '🔧', Tutoring: '📚', Photography: '📷', Cleaning: '🧹', 'Tech Repair': '💻', Barber: '✂️', Tailoring: '🧵', Design: '🎨', Other: '⭐' };

// ── 3-Dot Review Menu ──
function ReviewMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position:'relative', display:'inline-flex' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background:'none', border:'1px solid #e5e7eb', cursor:'pointer', padding:'3px 8px', borderRadius:6,
          color:'#6b7280', fontSize:16, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all .15s' }}
        onMouseEnter={e=>{e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.borderColor='#d1d5db';}}
        onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.borderColor='#e5e7eb';}}
        title="More options">
        •••
      </button>
      {open && (
        <div style={{ position:'absolute', right:0, top:'calc(100% + 4px)', background:'#fff', borderRadius:10,
          boxShadow:'0 8px 28px rgba(0,0,0,.12)', border:'1px solid #e5e7eb', zIndex:200, minWidth:160, overflow:'hidden' }}>
          <button onClick={() => { setOpen(false); onEdit(); }}
            style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'12px 16px', background:'none', border:'none',
              cursor:'pointer', fontSize:14, color:'#374151', fontWeight:500, textAlign:'left', borderBottom:'1px solid #f3f4f6' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
            onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <span style={{ fontSize:15 }}>✏️</span> Edit review
          </button>
          <button onClick={() => { setOpen(false); onDelete(); }}
            style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'12px 16px', background:'none', border:'none',
              cursor:'pointer', fontSize:14, color:'#dc2626', fontWeight:500, textAlign:'left' }}
            onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
            onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <span style={{ fontSize:15 }}>🗑️</span> Delete review
          </button>
        </div>
      )}
    </div>
  );
}

function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            fontSize: readonly ? 16 : 26,
            cursor: readonly ? 'default' : 'pointer',
            color: star <= (hover || value) ? '#f59e0b' : '#d1d5db',
            transition: 'color .15s',
            userSelect: 'none'
          }}>★</span>
      ))}
    </div>
  );
}

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [msgError, setMsgError] = useState('');

  // Review form state
  const [reportSent, setReportSent] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const REPORT_CATEGORIES = [
    { value: 'fake_listing', label: 'Fake or misleading listing' },
    { value: 'scam', label: 'Scam or fraud' },
    { value: 'inappropriate', label: 'Inappropriate or offensive content' },
    { value: 'wrong_price', label: 'Wrong or misleading price' },
    { value: 'spam', label: 'Spam or duplicate listing' },
    { value: 'illegal', label: 'Illegal service or product' },
    { value: 'other', label: 'Other (describe below)' },
  ];

  const handleReport = () => {
    if (!user) { navigate('/login'); return; }
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportCategory) return;
    const reason = reportCategory === 'other'
      ? reportDetail
      : REPORT_CATEGORIES.find(c => c.value === reportCategory)?.label + (reportDetail ? ': ' + reportDetail : '');
    if (!reason.trim()) return;
    setReportLoading(true);
    try {
      await axios.post('/api/reports', {
        reported_user_id: listing.seller_id,
        reported_listing_id: listing.id,
        reason
      });
      setReportSent(true);
      setShowReportModal(false);
    } catch { alert('Failed to submit. Please try again.'); }
    finally { setReportLoading(false); }
  };

  const [reviewRating, setReviewRating] = useState(0);
  const [editingReview, setEditingReview] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // review id to delete
  const myReview = user ? (listing?.reviews || []).find(r => r.user_id === user.id) : null;
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchListing = () => {
    setLoading(true);
    axios.get(`/api/listings/${id}`)
      .then(r => setListing(r.data))
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchListing(); }, [id]);

  const handleMessage = async () => {
    if (!user) { navigate('/login'); return; }
    if (!message.trim()) return;
    try {
      await axios.post('/api/messages', { receiver_id: listing.seller_id, listing_id: listing.id, text: message });
      setSent(true); setMessage('');
      // After 1.5s redirect to dashboard messages tab
      setTimeout(() => navigate('/dashboard?tab=messages'), 1500);
    } catch { setMsgError('Could not send. Please try again.'); }
  };

  const handleReviewSubmit = async () => {
    if (!user) { navigate('/login'); return; }
    if (reviewRating === 0) { setReviewError('Please select a star rating.'); return; }
    if (!reviewComment.trim()) { setReviewError('Please write a comment.'); return; }
    setReviewSubmitting(true); setReviewError('');
    try {
      await axios.post(`/api/listings/${id}/review`, { rating: reviewRating, comment: reviewComment });
      if (!editingReview) setReviewSuccess(true);
      setEditingReview(false);
      setReviewComment('');
      setReviewRating(0);
      fetchListing();
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Could not submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Check if user already reviewed
  const alreadyReviewed = listing?.reviews?.some(r => r.user_id === user?.id);

  if (loading) return <div className="loader"><div className="spinner"></div></div>;
  if (!listing) return (
    <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <h2>Listing not found</h2>
      <Link to="/services" className="btn-primary" style={{ display: 'inline-block', marginTop: 20, textDecoration: 'none' }}>Browse services</Link>
    </div>
  );

  const reviews = listing.reviews || [];
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  return (
    <div className="listing-detail">
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span>›</span>
          <Link to="/services" style={{ color: 'var(--text-muted)' }}>Services</Link>
          <span>›</span>
          <span style={{ color: 'var(--green-dark)', fontWeight: 500 }}>{listing.category}</span>
        </div>

        <div className="listing-detail-grid">
          {/* LEFT */}
          <div>
            <div className="listing-detail-img">
              {listing.image
                ? <img src={listing.image} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 18 }} />
                : <span>{EMOJI[listing.category] || '⭐'}</span>
              }
            </div>

            <div style={{ display: 'inline-block', background: 'var(--green-light)', color: 'var(--green-dark)', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
              {listing.category}
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }}>{listing.title}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--green),var(--green-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800 }}>
                  {listing.seller_name?.charAt(0)}
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>by <strong style={{ color: 'var(--text)' }}>{listing.seller_name}</strong></span>
              </div>
            </div>

            <div className="listing-detail-meta">
              <span className="meta-pill">⭐ {avgRating.toFixed(1)} ({reviews.length} reviews)</span>
              <span className="meta-pill">📍 {listing.is_remote ? 'Remote / Online' : listing.city}</span>
            </div>
            <div style={{ marginTop:14 }}>
              <button onClick={handleReport} disabled={reportSent}
                style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:reportSent?'#9ca3af':'#dc2626', background:reportSent?'#f3f4f6':'#fef2f2', border:`1.5px solid ${reportSent?'#e5e7eb':'#fca5a5'}`, borderRadius:8, padding:'8px 16px', cursor:reportSent?'default':'pointer', transition:'all .15s' }}
                onMouseEnter={e=>{if(!reportSent){e.currentTarget.style.background='#fee2e2';e.currentTarget.style.borderColor='#ef4444';}}}
                onMouseLeave={e=>{if(!reportSent){e.currentTarget.style.background='#fef2f2';e.currentTarget.style.borderColor='#fca5a5';}}}>
                <span style={{ fontSize:14 }}>{reportSent ? '✓' : '⚑'}</span>
                {reportSent ? 'Report submitted' : 'Report this listing'}
              </button>
            </div>

            <div style={{ marginTop: 28, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>About this service</h3>
              <p className="listing-detail-desc">{listing.description || 'No description provided.'}</p>
            </div>

      {/* Delete Review Confirm Modal */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setDeleteConfirm(null)}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:400, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)', textAlign:'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:44, marginBottom:12 }}>🗑️</div>
            <h3 style={{ fontSize:18, fontWeight:800, color:'#0f1923', marginBottom:8 }}>Delete review?</h3>
            <p style={{ fontSize:14, color:'#6b7280', lineHeight:1.7, marginBottom:24 }}>
              Are you sure you want to delete your review? This action cannot be undone.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={async () => {
                try {
                  await axios.delete(`/api/listings/${id}/review`);
                  setDeleteConfirm(null);
                  fetchListing();
                } catch { alert('Could not delete review. Please try again.'); }
              }} style={{ flex:1, padding:'11px', border:'none', borderRadius:8, background:'#dc2626', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14 }}>
                Yes, delete
              </button>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex:1, padding:'11px', border:'1.5px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14, color:'#6b7280', fontWeight:600 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setShowReportModal(false)}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:480, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontSize:17, fontWeight:800, color:'#0f1923', margin:0 }}>Report this listing</h3>
              <button onClick={() => setShowReportModal(false)} style={{ background:'none', border:'none', fontSize:22, color:'#9ca3af', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:18, lineHeight:1.6 }}>Help us keep TogoConnect safe. Select the reason for your report.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              {[
                { value:'fake_listing', label:'Fake or misleading listing' },
                { value:'scam', label:'Scam or fraud attempt' },
                { value:'inappropriate', label:'Inappropriate or offensive content' },
                { value:'wrong_price', label:'Wrong or misleading price' },
                { value:'spam', label:'Spam or duplicate listing' },
                { value:'illegal', label:'Illegal service' },
                { value:'other', label:'Other reason' },
              ].map(opt => (
                <label key={opt.value} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:`1.5px solid ${reportCategory===opt.value?'var(--green)':'#e5e7eb'}`, borderRadius:8, cursor:'pointer', background:reportCategory===opt.value?'#f0fdf4':'#fff' }}>
                  <input type="radio" name="reportCat" value={opt.value} checked={reportCategory===opt.value} onChange={() => setReportCategory(opt.value)} style={{ accentColor:'var(--green)' }} />
                  <span style={{ fontSize:14, color:'#374151', fontWeight:reportCategory===opt.value?700:400 }}>{opt.label}</span>
                </label>
              ))}
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>
                {reportCategory === 'other' ? 'Describe the issue *' : 'Additional details (optional)'}
              </label>
              <textarea value={reportDetail} onChange={e => setReportDetail(e.target.value)} placeholder="Provide more details..." rows={3}
                style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', fontSize:14, boxSizing:'border-box', resize:'vertical', fontFamily:'inherit', outline:'none' }} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={submitReport} disabled={!reportCategory||reportLoading||(reportCategory==='other'&&!reportDetail.trim())} className="btn-primary"
                style={{ flex:1, padding:'11px', opacity:(!reportCategory||(reportCategory==='other'&&!reportDetail.trim()))?0.5:1 }}>
                {reportLoading ? 'Submitting...' : 'Submit Report'}
              </button>
              <button onClick={() => setShowReportModal(false)} style={{ padding:'11px 20px', border:'1.5px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14 }}>Cancel</button>
            </div>
            <p style={{ fontSize:11, color:'#9ca3af', marginTop:12, textAlign:'center' }}>All reports are confidential and reviewed within 24 hours.</p>
          </div>
        </div>
      )}

            {/* ── REVIEWS SECTION ── */}
            <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                  Reviews
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 14, marginLeft: 8 }}>({reviews.length})</span>
                </h3>
                {reviews.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StarRating value={Math.round(avgRating)} readonly />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>{avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div style={{ background: 'var(--bg-gray)', borderRadius: 12, padding: '28px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No reviews yet. Be the first to review this service!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ background:'#fff', borderRadius:12, padding:'16px 18px', border:'1px solid #f0f0f0', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                      {/* Header: avatar + name + stars + 3-dot */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,var(--green),var(--green-dark))', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14, fontWeight:800, flexShrink:0 }}>
                          {r.user_name?.charAt(0)}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:'#0f1923' }}>{r.user_name}</div>
                          <div style={{ marginTop:2 }}><StarRating value={r.rating} readonly /></div>
                        </div>
                        {user && r.user_id === user.id && (
                          <ReviewMenu
                            onEdit={() => { setEditingReview(true); setReviewRating(r.rating); setReviewComment(r.comment||''); }}
                            onDelete={() => setDeleteConfirm(r.id)}
                          />
                        )}
                      </div>
                      {r.comment && <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.7, margin:0, paddingLeft:46 }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* ── ADD REVIEW ── */}
              <div style={{ background: '#f8fffe', border: '1.5px solid var(--border)', borderRadius: 14, padding: '24px 22px', marginTop: 8 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                  {user ? 'Write a review' : 'Want to leave a review?'}
                </h4>

                {!user ? (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 14 }}>
                      You need to be logged in to add a rating or review.
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '9px 22px' }}>
                        🔐 Log in
                      </button>
                      <button onClick={() => navigate('/signup')}
                        style={{ padding: '9px 22px', border: '1.5px solid var(--green)', borderRadius: 8, background: 'transparent', color: 'var(--green-dark)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                        Sign up
                      </button>
                    </div>
                  </div>
                ) : alreadyReviewed && !editingReview ? (
                  <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:10, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, color:'#15803d', fontSize:14, fontWeight:600 }}>
                      <span style={{ fontSize:18 }}>✅</span> You've reviewed this service
                    </div>
                  </div>
                ) : editingReview ? (
                  <div style={{ background:'#fff', border:'1.5px solid var(--green)', borderRadius:12, padding:'20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#0f1923' }}>Edit your review</div>
                      <button onClick={() => { setEditingReview(false); setReviewRating(0); setReviewComment(''); }}
                        style={{ background:'none', border:'none', fontSize:20, color:'#9ca3af', cursor:'pointer', lineHeight:1 }}>×</button>
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:6, fontWeight:600 }}>Rating</div>
                      <StarRating value={reviewRating} onChange={setReviewRating} />
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:6, fontWeight:600 }}>Review</div>
                      <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                        placeholder="Share your experience..."
                        style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:9, padding:'11px 13px', fontSize:14, resize:'vertical', minHeight:90, outline:'none', fontFamily:'inherit', lineHeight:1.6, background:'#fff', boxSizing:'border-box' }} />
                    </div>
                    {reviewError && <div style={{ color:'#dc2626', fontSize:13, marginBottom:10 }}>{reviewError}</div>}
                    <div style={{ display:'flex', gap:10 }}>
                      <button className="btn-primary" onClick={handleReviewSubmit} disabled={reviewSubmitting} style={{ padding:'10px 24px' }}>
                        {reviewSubmitting ? 'Saving...' : 'Save changes'}
                      </button>
                      <button onClick={() => { setEditingReview(false); setReviewRating(0); setReviewComment(''); }}
                        style={{ padding:'10px 20px', border:'1.5px solid var(--border)', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14, color:'#6b7280' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : reviewSuccess ? (
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: 16, color: '#15803d', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
                    <strong>Review submitted!</strong>
                    <p style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>Thank you for your feedback.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Your rating</div>
                      <StarRating value={reviewRating} onChange={setReviewRating} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Your review</div>
                      <textarea
                        placeholder="Share your experience with this service..."
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        style={{
                          width: '100%', border: '1.5px solid var(--border)', borderRadius: 9,
                          padding: '11px 13px', fontSize: 14, resize: 'vertical', minHeight: 100,
                          outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
                          background: '#fff', boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    {reviewError && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{reviewError}</div>}
                    <button
                      className="btn-primary"
                      onClick={handleReviewSubmit}
                      disabled={reviewSubmitting}
                      style={{ padding: '10px 24px' }}>
                      {reviewSubmitting ? 'Submitting...' : '⭐ Submit review'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Contact card */}
          <div>
            <div className="contact-card">
              <div className="price">
                {listing.price_type === 'from' ? 'From ' : ''}{Number(listing.price).toLocaleString()} CFA
              </div>
              <div className="price-label">
                {listing.price_type === 'hourly' ? 'per hour' : listing.price_type === 'from' ? 'starting price' : 'fixed price'} · Free to contact
              </div>

              {sent ? (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '18px', color: '#15803d', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                  <strong>Message sent!</strong>
                  <p style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>The seller will get back to you soon.</p>
                  <button onClick={() => navigate('/dashboard')} style={{ marginTop: 12, padding: '8px 18px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    View in Chat →
                  </button>
                </div>
              ) : (
                <>
                  <textarea
                    placeholder={`Hi ${listing.seller_name?.split(' ')[0]}, I'm interested in your service and would like to know more...`}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                  {msgError && <div className="error-msg">{msgError}</div>}
                  <button className="btn-primary" style={{ width: '100%', padding: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleMessage}>
                    {user ? <><span>💬</span> Chat with seller</> : <><span>🔐</span> Log in to chat</>}
                  </button>
                  {user && (
                    <button onClick={() => navigate('/dashboard')} style={{ width: '100%', marginTop: 8, padding: '10px', border: '1.5px solid var(--border)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--green-dark)' }}>
                      📥 View all chats
                    </button>
                  )}
                </>
              )}

              <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg-gray)', borderRadius: 9, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                ✅ No booking fees &nbsp;·&nbsp; ✅ Direct contact &nbsp;·&nbsp; ✅ 100% free
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
