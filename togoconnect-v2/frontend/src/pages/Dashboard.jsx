import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { TOGO_LOCATIONS, ALL_REGIONS, SERVICE_CATEGORIES, getCitiesByRegion } from '../data/locations';

const PLAN_INFO = {
  none:     { label: 'Free',     color: '#9ca3af', bg: '#f9fafb', limit: 0,           textColor: '#6b7280' },
  basic:    { label: 'Basic',    color: '#6b7280', bg: '#f3f4f6', limit: 1,           textColor: '#374151' },
  standard: { label: 'Standard', color: '#0f6e56', bg: '#ecfdf5', limit: 10,          textColor: '#0f6e56' },
  premium:  { label: 'Premium',  color: '#7c3aed', bg: '#f5f3ff', limit: 'Unlimited', textColor: '#7c3aed' },
};
// Categories and cities from locations data
const CATEGORIES = SERVICE_CATEGORIES;

// ── Small reusable input ──
const Field = ({ label, value, onChange, type='text', placeholder='', as='input' }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
    {as === 'textarea'
      ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3}
          style={{ width:'100%', border:'1.5px solid #d1d5db', borderRadius:8, padding:'9px 12px', fontSize:14, boxSizing:'border-box', fontFamily:'inherit', resize:'vertical', outline:'none' }}
          onFocus={e=>e.target.style.borderColor='var(--green)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
      : <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          style={{ width:'100%', border:'1.5px solid #d1d5db', borderRadius:8, padding:'9px 12px', fontSize:14, boxSizing:'border-box', outline:'none' }}
          onFocus={e=>e.target.style.borderColor='var(--green)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
    }
  </div>
);

export default function Dashboard() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const getTab = () => new URLSearchParams(location.search).get('tab') || 'overview';
  const [tab, setTab] = useState(getTab);

  // Sync tab with URL when URL changes (e.g. from navbar dropdown)
  useEffect(() => {
    setTab(getTab());
  }, [location.search]);
  const [myListings, setMyListings] = useState([]);
  const [planInfo, setPlanInfo] = useState(null);
  const [unread, setUnread] = useState(0); // active conversations
  const [unreadMsgs, setUnreadMsgs] = useState(0); // unread messages count

  useEffect(() => { if (!user) navigate('/login'); }, [user]);
  const hasPlan = user && user.plan && user.plan !== 'none';
  const pi = PLAN_INFO[user?.plan] || PLAN_INFO.basic;

  const [billingStatus, setBillingStatus] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [trustData, setTrustData] = useState(null);

  const refreshListings = () => {
    axios.get('/api/listings/my').then(r => {
      setMyListings(r.data.listings || []);
      setPlanInfo({ plan: r.data.plan, limit: r.data.limit });
    }).catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    if (hasPlan) refreshListings();
    // Always fetch billing status — needed to show expiry warning
    axios.get('/api/billing/status').then(r => setBillingStatus(r.data)).catch(() => {});
    axios.get('/api/billing').then(r => setBillingHistory(r.data)).catch(() => {});
    axios.get('/api/messages/unread-count').then(r => { setUnread(r.data.count||0); setUnreadMsgs(r.data.unread||0); }).catch(() => {});
    axios.get('/api/trust/my').then(r => setTrustData(r.data)).catch(() => {});
  }, [user]);

  if (!user) return null;
  const atLimit = hasPlan && planInfo && planInfo.limit !== 'unlimited' && myListings.length >= planInfo.limit;

  const tabs = [
    { id:'overview', label:'Overview' },
    ...(hasPlan ? [{ id:'listings', label:'My Listings' }] : []),
    { id:'messages', label:`Messages${unreadMsgs>0?` (${unreadMsgs})`:''}`},
    ...(hasPlan ? [{ id:'billing', label:'Billing' }] : []),
    { id:'settings', label:'Settings' },
    { id:'trust', label:'Trust Score' },
    ...(!hasPlan ? [{ id:'plans', label:'Upgrade Plan' }] : []),
  ];

  const goTab = (id) => { setTab(id); navigate(`/dashboard?tab=${id}`, { replace: true }); };

  return (
    <div style={{ background:'#f9fafb', minHeight:'calc(100vh - 64px)', padding:'32px 0 60px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, marginBottom:2, color:'#0f1923' }}>
          {user.isNew ? `Welcome, ${user.name.split(' ')[0]}!` : `Welcome back, ${user.name.split(' ')[0]}`}
        </h1>
            <p style={{ fontSize:13, color:'#9ca3af' }}>{user.email}</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ background:pi.bg, color:pi.textColor, fontWeight:700, fontSize:12, padding:'5px 14px', borderRadius:100, border:`1.5px solid ${pi.color}30` }}>
              {pi.label} Plan
            </span>
            <Link to="/pricing"><button style={{ fontSize:12, padding:'5px 14px', borderRadius:8, border:'1.5px solid var(--green)', background:'transparent', color:'var(--green-dark)', fontWeight:700, cursor:'pointer' }}>Upgrade</button></Link>
          </div>
        </div>

        {/* Stats for paid */}
        {hasPlan && (
          <div className='dash-stats-grid' style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
            {[
              { label:'Active Listings', value:myListings.length, color:'#0f6e56' },
              { label:'Listing Limit', value:pi.limit==='Unlimited'?'Unlimited':pi.limit, color:'#7c3aed' },
              { label:'Active Chats', value:unread, color:'#0f6e56' },
              { label:'Plan', value:pi.label, color:'#d97706' },
            ].map(s => (
              <div key={s.label} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'20px' }}>
                <div style={{ fontSize:24, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
                <div style={{ fontSize:12, color:'#9ca3af', fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Restricted account banner ── */}
        {trustData?.restricted && (
          <div style={{ background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:10, padding:'16px 20px', marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
            <div>
              <div style={{ fontWeight:700, color:'#dc2626', fontSize:15, marginBottom:4 }}>Account Suspended</div>
              <div style={{ fontSize:13, color:'#991b1b', lineHeight:1.6 }}>
                Your account has been suspended due to community guidelines violations. You cannot send messages, add listings, or purchase plans.
              </div>
              {trustData.restricted_until ? (
                <div style={{ marginTop:8, fontSize:13, color:'#dc2626', fontWeight:600 }}>
                  ⏱ Suspended until: <strong>{new Date(trustData.restricted_until).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</strong>
                  {' '}({Math.ceil((new Date(trustData.restricted_until)-new Date())/86400000)} days remaining)
                </div>
              ) : (
                <div style={{ marginTop:8, fontSize:13, color:'#dc2626', fontWeight:700 }}>⛔ Permanent suspension</div>
              )}
              <div style={{ marginTop:6, fontSize:12, color:'#9ca3af' }}>
                Suspension #{trustData.restrict_count || 1} · Contact hello@togoconnect.com to appeal
              </div>
            </div>
            <div style={{ background:'#dc2626', color:'#fff', fontSize:18, fontWeight:800, padding:'12px 16px', borderRadius:8, flexShrink:0, textAlign:'center', minWidth:70 }}>
              <div>0 pts</div>
              <div style={{ fontSize:10, fontWeight:400, opacity:.8, marginTop:2 }}>trust score</div>
            </div>
          </div>
        )}

        {/* ── Plan status banners ── */}
        {billingStatus?.expired && (
          <div style={{ background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:10, padding:'14px 20px', marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
            <div>
              <div style={{ fontWeight:700, color:'#dc2626', fontSize:15, marginBottom:3 }}>Your plan has expired</div>
              <div style={{ fontSize:13, color:'#991b1b', lineHeight:1.5 }}>Your listings are hidden from the marketplace. Reactivate your plan to go live again.</div>
            </div>
            <Link to="/pricing" style={{ flexShrink:0 }}>
              <button style={{ padding:'10px 22px', background:'#dc2626', border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' }}>
                Reactivate plan
              </button>
            </Link>
          </div>
        )}

        {billingStatus?.warning && !billingStatus?.expired && (
          <div style={{ background:'#fffbeb', border:'1.5px solid #fbbf24', borderRadius:10, padding:'14px 20px', marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
            <div>
              <div style={{ fontWeight:700, color:'#92400e', fontSize:15, marginBottom:3 }}>
                Plan expiring in {billingStatus.days_left} day{billingStatus.days_left!==1?'s':''}
              </div>
              <div style={{ fontSize:13, color:'#78350f', lineHeight:1.5 }}>
                Renew your {billingStatus.plan} plan now to keep your listings live without interruption.
              </div>
            </div>
            <Link to="/pricing" style={{ flexShrink:0 }}>
              <button style={{ padding:'10px 22px', background:'#f59e0b', border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' }}>
                Renew now
              </button>
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className='dash-tabs' style={{ display:'flex', gap:2, borderBottom:'2px solid #e5e7eb', marginBottom:24 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => goTab(t.id)} style={{
              padding:'10px 20px', border:'none', background:'transparent', cursor:'pointer',
              fontWeight:tab===t.id?700:500, fontSize:14,
              color:tab===t.id?'var(--green-dark)':'#6b7280',
              borderBottom:tab===t.id?'2px solid var(--green)':'2px solid transparent',
              marginBottom:-2, whiteSpace:'nowrap'
            }}>{t.label}</button>
          ))}
        </div>

        {tab==='overview' && (hasPlan ? <OverviewTab myListings={myListings} pi={pi} atLimit={atLimit} unread={unread} goTab={goTab} user={user} billingStatus={billingStatus} trustData={trustData} /> : <FreeOverviewTab user={user} unread={unread} goTab={goTab} trustData={trustData} />)}
        {tab==='listings' && hasPlan && <ListingsTab myListings={myListings} pi={pi} atLimit={atLimit} refreshListings={refreshListings} />}
        {tab==='messages' && <MessagesTab userId={user.id} />}
        {tab==='settings' && <SettingsTab user={user} login={login} />}
        {tab==='billing' && <BillingTab billingStatus={billingStatus} billingHistory={billingHistory} />}
        {tab==='trust' && <TrustTab trustData={trustData} />}
        {tab==='plans' && !hasPlan && <PlansTab />}
      </div>
    </div>
  );
}

// ── Free/Basic Overview ──
function FreeOverviewTab({ user, unread, goTab }) {
  const navigate = useNavigate();
  const plans = [
    { name:'Basic', price:2500, listings:'1 listing', color:'#6b7280', bg:'#f3f4f6' },
    { name:'Standard', price:9900, listings:'10 listings', color:'#0f6e56', bg:'#ecfdf5', popular:true },
    { name:'Premium', price:24900, listings:'Unlimited', color:'#7c3aed', bg:'#f5f3ff' },
  ];

  return (
    <div>
      {/* Welcome hero */}
      <div style={{ background:'linear-gradient(135deg,#0f6e56,#1D9E75)', borderRadius:16, padding:'32px 36px', marginBottom:24, color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, opacity:.8, marginBottom:6, letterSpacing:'.05em', textTransform:'uppercase' }}>
            {user.isNew ? 'Getting started' : 'Welcome to TogoConnect'}
          </div>
          <h2 style={{ fontSize:26, fontWeight:800, marginBottom:8 }}>
            {user.isNew ? `Welcome, ${user.name.split(' ')[0]}!` : `Welcome back, ${user.name.split(' ')[0]}`}
          </h2>
          <p style={{ fontSize:14, opacity:.85, maxWidth:380, lineHeight:1.6 }}>
            {user.isNew
              ? "Great to have you here! Start by browsing services or upgrade your plan to list your own services and reach clients across Togo."
              : "Good to see you again. Browse services and chat with sellers. Upgrade your plan to start listing your own services."}
          </p>
        </div>
        <div style={{ textAlign:'center', background:'rgba(255,255,255,.15)', borderRadius:12, padding:'20px 28px', backdropFilter:'blur(8px)' }}>
          <div style={{ fontSize:13, opacity:.8, marginBottom:4 }}>Current Plan</div>
          <div style={{ fontSize:22, fontWeight:800 }}>Basic</div>
          <div style={{ fontSize:12, opacity:.7, marginTop:2 }}>Free forever</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className='dash-quick-grid' style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
        {[
          { label:'Browse Services', sub:'Find professionals near you', action:()=>navigate('/services'), btn:'Browse now' },
          { label:'Messages', sub:`${unread>0?unread+' active chat'+(unread>1?'s':''):'No chats yet'}`, action:()=>goTab('messages'), btn:'Open chats' },
          { label:'Settings', sub:'Update your profile info', action:()=>goTab('settings'), btn:'Edit profile' },
        ].map(c => (
          <div key={c.label} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'20px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#0f1923' }}>{c.label}</div>
            <div style={{ fontSize:13, color:'#9ca3af', flex:1 }}>{c.sub}</div>
            <button onClick={c.action} className="btn-plan btn-plan-outline" style={{ fontSize:13 }}>
              {c.btn}
            </button>
          </div>
        ))}
      </div>

      {/* Upgrade section */}
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'#0f1923', marginBottom:4 }}>Unlock more with a plan</div>
        <div style={{ fontSize:13, color:'#9ca3af', marginBottom:18 }}>Start listing your services and reach thousands of clients across Togo.</div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {plans.map(plan => (
            <div key={plan.name} style={{ background:'#fff', border:plan.popular?'2px solid var(--green)':'1px solid #e5e7eb', borderRadius:14, padding:'20px', position:'relative' }}>
              {plan.popular && (
                <div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', background:'var(--green)', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 14px', borderRadius:100, whiteSpace:'nowrap' }}>
                  Most Popular
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:'#0f1923' }}>{plan.name}</div>
                  <div style={{ fontSize:12, color:plan.color, fontWeight:600, marginTop:2 }}>{plan.listings}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:plan.popular?'var(--green-dark)':'#0f1923' }}>{plan.price.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>CFA/mo</div>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout', { state:{ plan:plan.name, price:plan.price, period:'monthly' }})}
                className={plan.popular ? 'btn-plan btn-plan-fill' : 'btn-plan btn-plan-outline'}
                style={{ marginTop:14 }}>
                Get {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Paid Plan Overview ──
function OverviewTab({ myListings, pi, atLimit, unread, goTab, user, billingStatus }) {
  const usedPct = pi.limit === 'Unlimited' ? 0 : Math.min((myListings.length / pi.limit) * 100, 100);
  const daysLeft = billingStatus?.days_left;
  const expiresAt = billingStatus?.expires_at ? new Date(billingStatus.expires_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : null;

  return (
    <div>
      {/* Hero banner */}
      <div style={{ background:'linear-gradient(135deg,#0f6e56,#1D9E75)', borderRadius:16, padding:'28px 36px', marginBottom:24, color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:600, opacity:.75, marginBottom:6, letterSpacing:'.06em', textTransform:'uppercase' }}>
            {user?.isNew ? 'Plan activated' : 'Your workspace'}
          </div>
          <h2 style={{ fontSize:24, fontWeight:800, marginBottom:6 }}>
            {user?.isNew ? `Welcome, ${user?.name?.split(' ')[0]}!` : `Welcome back, ${user?.name?.split(' ')[0]}`}
          </h2>
          <p style={{ fontSize:13, opacity:.85, lineHeight:1.6 }}>
            {user?.isNew
              ? 'Your plan is active. Start by adding your first service listing.'
              : `You have ${myListings.length} active listing${myListings.length!==1?'s':''}. ${atLimit?'Upgrade to add more.':'Add more to reach more clients.'}`}
          </p>
        </div>
        <div style={{ textAlign:'center', background:'rgba(255,255,255,.15)', borderRadius:12, padding:'18px 28px', minWidth:160 }}>
          <div style={{ fontSize:12, opacity:.75, marginBottom:3 }}>Current Plan</div>
          <div style={{ fontSize:22, fontWeight:800 }}>{pi.label}</div>
          <div style={{ fontSize:11, opacity:.7, marginTop:2 }}>{pi.limit==='Unlimited'?'Unlimited listings':`Up to ${pi.limit} listing${pi.limit>1?'s':''}`}</div>
          {expiresAt && (
            <div style={{ fontSize:11, marginTop:6, opacity:.85, background:'rgba(255,255,255,.15)', borderRadius:6, padding:'3px 8px' }}>
              {daysLeft <= 5
                ? <span style={{ color:'#fef08a', fontWeight:700 }}>Expires in {daysLeft}d</span>
                : <span>Renews {expiresAt}</span>
              }
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'Active Listings', value:myListings.length, sub:`of ${pi.limit==='Unlimited'?'unlimited':pi.limit} allowed`, color:'#0f6e56' },
          { label:'Active Chats', value:unread, sub:unread>0?`${unread} conversation${unread>1?'s':''}`:'No conversations yet', color:'#0f6e56' },
          { label:'Plan', value:pi.label, sub:'View upgrade options', color:pi.textColor, link:true },
        ].map(s => (
          <div key={s.label} onClick={s.link?()=>window.location.href='/pricing':undefined}
            style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'20px 22px', cursor:s.link?'pointer':'default', transition:'box-shadow .2s' }}
            onMouseEnter={e=>{if(s.link)e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'}}
            onMouseLeave={e=>{if(s.link)e.currentTarget.style.boxShadow='none'}}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontSize:12, color:'#9ca3af' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Listing usage bar */}
      {pi.limit !== 'Unlimited' && (
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'20px 24px', marginBottom:22 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:14, fontWeight:600, color:'#374151' }}>Listing usage</span>
            <span style={{ fontSize:13, fontWeight:700, color:atLimit?'#dc2626':'#0f6e56' }}>{myListings.length} / {pi.limit}</span>
          </div>
          <div style={{ background:'#f3f4f6', borderRadius:100, height:10, overflow:'hidden', marginBottom:atLimit?12:0 }}>
            <div style={{ width:`${usedPct}%`, background:atLimit?'#dc2626':'linear-gradient(90deg,#1D9E75,#0f6e56)', height:'100%', borderRadius:100, transition:'width .4s' }} />
          </div>
          {atLimit && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13 }}>
              <span style={{ color:'#dc2626', fontWeight:500 }}>You have reached your listing limit</span>
              <Link to="/pricing" style={{ color:'#dc2626', fontWeight:700, textDecoration:'none', fontSize:13 }}>Upgrade plan</Link>
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {[
          { label:'Add New Listing', sub:atLimit?'Upgrade to add more':'Create a new service listing', action:()=>goTab('listings'), disabled:atLimit, primary:true },
          { label:'Messages', sub:unread>0?`${unread} active chat${unread>1?'s':''}`:'Chat with clients', action:()=>goTab('messages'), primary:false },
          { label:'My Listings', sub:`Manage your ${myListings.length} listing${myListings.length!==1?'s':''}`, action:()=>goTab('listings'), primary:false },
        ].map(a => (
          <div key={a.label} style={{ background:'#fff', border:`1.5px solid ${a.primary&&!a.disabled?'var(--green)':'#e5e7eb'}`, borderRadius:12, padding:'20px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#0f1923' }}>{a.label}</div>
            <div style={{ fontSize:13, color:'#9ca3af', flex:1 }}>{a.sub}</div>
            <button onClick={a.action} disabled={a.disabled}
              className={a.primary?'btn-primary':''}
              style={!a.primary?{ padding:'8px 0', background:'transparent', border:'1.5px solid var(--green)', borderRadius:8, color:'var(--green-dark)', fontWeight:700, fontSize:13, cursor:'pointer', width:'100%' }:{ width:'100%', padding:'9px', opacity:a.disabled?0.5:1 }}>
              {a.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Listings Tab ──
function ListingsTab({ myListings, pi, atLimit, refreshListings }) {
  const navigate = useNavigate();
  const EMPTY_FORM = { title:'', description:'', category:'Plumbing', price:'', price_type:'fixed', city:'Lomé', is_remote:false };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [listingRegion, setListingRegion] = useState('Région Maritime');
  const fileRef = useRef();

  const set = (k, v) => setForm(p => ({...p, [k]: v}));

  const handleImageUpload = async (files) => {
    setUploading(true);
    const newImgs = [...images];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append('image', file);
        const r = await axios.post('/api/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        newImgs.push({ url: r.data.url, preview: URL.createObjectURL(file) });
      } catch { setError('Image upload failed. Max 5MB per image.'); }
    }
    setImages(newImgs);
    setUploading(false);
  };

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));
  const makePrimary = (i) => {
    const imgs = [...images];
    const [moved] = imgs.splice(i, 1);
    imgs.unshift(moved);
    setImages(imgs);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.price) { setError('Title and price are required'); return; }
    setLoading(true); setError('');
    try {
      const payload = { ...form, price: Number(form.price), image: images[0]?.url || '', images: images.map(i => i.url) };
      if (editId) await axios.put(`/api/listings/${editId}`, payload);
      else await axios.post('/api/listings', payload);
      await refreshListings();
      setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setImages([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save listing');
    } finally { setLoading(false); }
  };

  const handleEdit = async (l) => {
    setForm({ title:l.title, description:l.description, category:l.category, price:l.price, price_type:l.price_type, city:l.city, is_remote:!!l.is_remote });
    // Set region based on city
    const cityRegion = Object.entries(TOGO_LOCATIONS).find(([, v]) => v.cities.includes(l.city))?.[0] || 'Région Maritime';
    setListingRegion(cityRegion);
    // Load existing images
    try {
      const r = await axios.get(`/api/listings/${l.id}`);
      const imgs = r.data.images || [];
      setImages(imgs.length > 0 ? imgs.map(i => ({ url: i.url, preview: i.url })) : l.image ? [{ url: l.image, preview: l.image }] : []);
    } catch { setImages(l.image ? [{ url: l.image, preview: l.image }] : []); }
    setEditId(l.id); setShowForm(true); window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await axios.delete(`/api/listings/${id}`);
      await refreshListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setImages([]); setError(''); };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:17, fontWeight:700, color:'#0f1923' }}>My Listings ({myListings.length} / {pi.limit==='Unlimited'?'Unlimited':pi.limit})</h2>
        <button onClick={() => showForm ? cancelForm() : setShowForm(true)} disabled={atLimit&&!showForm}
          className="btn-primary" style={{ padding:'9px 20px', opacity:atLimit&&!showForm?0.5:1 }}>
          {showForm ? 'Cancel' : 'Add Listing'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background:'#fff', border:'1.5px solid var(--green)', borderRadius:14, padding:28, marginBottom:24 }}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:22, color:'#0f1923' }}>{editId ? 'Edit Listing' : 'New Listing'}</h3>
          {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:16 }}>{error}</div>}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Title *" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Expert Plumbing Services" />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Category</label>
              <select value={CATEGORIES.includes(form.category) ? form.category : 'Other'}
                onChange={e => { if(e.target.value === 'Other') set('category',''); else set('category', e.target.value); }}
                style={{ width:'100%', border:'1.5px solid #d1d5db', borderRadius:8, padding:'9px 12px', fontSize:14, background:'#fff', marginBottom: (!CATEGORIES.includes(form.category) || form.category === '') && (!CATEGORIES.slice(0,-1).includes(form.category)) ? 8 : 0 }}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
              {(!CATEGORIES.slice(0,-1).includes(form.category)) && (
                <input
                  value={CATEGORIES.slice(0,-1).includes(form.category) ? '' : form.category}
                  onChange={e => set('category', e.target.value)}
                  placeholder="Type your service category e.g. Electrician, Mechanic..."
                  style={{ width:'100%', border:'1.5px solid var(--green)', borderRadius:8, padding:'9px 12px', fontSize:14, boxSizing:'border-box', marginTop:8, outline:'none' }}
                  autoFocus
                />
              )}
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Region</label>
              <select value={listingRegion}
                onChange={e => { setListingRegion(e.target.value); set('city', getCitiesByRegion(e.target.value)[0] || 'Lomé'); }}
                style={{ width:'100%', border:'1.5px solid #d1d5db', borderRadius:8, padding:'9px 12px', fontSize:14, background:'#fff' }}>
                {ALL_REGIONS.map(r => <option key={r} value={r}>{r.replace('Région ','')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>City</label>
              <select value={form.city} onChange={e=>set('city',e.target.value)}
                style={{ width:'100%', border:'1.5px solid #d1d5db', borderRadius:8, padding:'9px 12px', fontSize:14, background:'#fff' }}>
                {getCitiesByRegion(listingRegion).map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Field label="Price (CFA) *" type="number" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="15000" />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Price Type</label>
              <select value={form.price_type} onChange={e=>set('price_type',e.target.value)}
                style={{ width:'100%', border:'1.5px solid #d1d5db', borderRadius:8, padding:'9px 12px', fontSize:14, background:'#fff' }}>
                <option value="fixed">Fixed</option>
                <option value="from">Starting from</option>
                <option value="hourly">Per hour</option>
              </select>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer', fontWeight:600, color:'#374151' }}>
                <input type="checkbox" checked={form.is_remote} onChange={e=>set('is_remote',e.target.checked)} />
                Remote / Online service
              </label>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Description" as="textarea" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe your service in detail..." />
            </div>

            {/* Image upload */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:10 }}>
                Images {images.length > 0 && <span style={{ color:'#9ca3af', fontWeight:400 }}>({images.length} — first is main)</span>}
              </label>

              {/* Image previews */}
              {images.length > 0 && (
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                  {images.map((img, i) => (
                    <div key={i} style={{ position:'relative', width:100, height:80 }}>
                      <img src={img.preview || img.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:8, border:i===0?'2.5px solid var(--green)':'2px solid #e5e7eb' }} />
                      {i === 0 && <span style={{ position:'absolute', top:3, left:3, background:'var(--green)', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:4 }}>Main</span>}
                      <button onClick={() => removeImage(i)} style={{ position:'absolute', top:3, right:3, background:'#dc2626', color:'#fff', border:'none', borderRadius:'50%', width:18, height:18, cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>x</button>
                      {i > 0 && <button onClick={() => makePrimary(i)} style={{ position:'absolute', bottom:3, left:3, background:'rgba(0,0,0,.6)', color:'#fff', border:'none', borderRadius:4, fontSize:9, padding:'1px 5px', cursor:'pointer' }}>Main</button>}
                    </div>
                  ))}
                </div>
              )}

              <input ref={fileRef} type="file" accept="image/*" multiple onChange={e=>handleImageUpload(e.target.files)} style={{ display:'none' }} />
              <button onClick={() => fileRef.current.click()} disabled={uploading}
                style={{ padding:'9px 18px', border:'1.5px dashed #d1d5db', borderRadius:8, background:'#f9fafb', cursor:'pointer', fontSize:13, color:'#6b7280', fontWeight:600 }}>
                {uploading ? 'Uploading...' : '+ Upload images'}
              </button>
              <div style={{ fontSize:11, color:'#9ca3af', marginTop:5 }}>JPG, PNG, WebP — max 5MB each</div>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ padding:'10px 28px' }}>
              {loading ? 'Saving...' : editId ? 'Save Changes' : 'Publish Listing'}
            </button>
            <button onClick={cancelForm} style={{ padding:'10px 20px', border:'1.5px solid #d1d5db', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      {myListings.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:48, textAlign:'center', color:'#9ca3af' }}>
          <p style={{ fontSize:15 }}>No listings yet. Click "Add Listing" to get started.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {myListings.map(l => (
            <div key={l.id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'18px 20px', display:'flex', alignItems:'center', gap:16 }}>
              {l.image
                ? <img src={l.image} alt={l.title} style={{ width:56, height:56, borderRadius:10, objectFit:'cover', flexShrink:0 }} />
                : <div style={{ width:56, height:56, borderRadius:10, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'var(--green-dark)', flexShrink:0 }}>{l.title?.charAt(0)}</div>
              }
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:2, color:'#0f1923' }}>{l.title}</div>
                <div style={{ fontSize:13, color:'#9ca3af' }}>{l.category} · {l.is_remote?'Remote':l.city} · {Number(l.price).toLocaleString()} CFA</div>
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <button onClick={() => navigate(`/listings/${l.id}`)} style={{ padding:'7px 14px', border:'1.5px solid #e5e7eb', borderRadius:7, background:'#fff', cursor:'pointer', fontSize:13 }}>View</button>
                <button onClick={() => handleEdit(l)} style={{ padding:'7px 14px', border:'1.5px solid var(--green)', borderRadius:7, background:'#fff', cursor:'pointer', fontSize:13, color:'var(--green-dark)', fontWeight:600 }}>Edit</button>
                <button onClick={() => handleDelete(l.id)} style={{ padding:'7px 14px', border:'1.5px solid #fecaca', borderRadius:7, background:'#fff', cursor:'pointer', fontSize:13, color:'#dc2626', fontWeight:600 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ──
function SettingsTab({ user, login }) {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({ name:user.name||'', city:user.city||'', bio:user.bio||'', phone:user.phone||'' });
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '');
  const [pwd, setPwd] = useState({ current:'', newPwd:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text:'', type:'' });
  const avatarRef = useRef();

  const showMsg = (text, type='success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text:'', type:'' }), 3500); };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const r = await axios.post('/api/upload/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAvatar(r.data.url);
    } catch { showMsg('Avatar upload failed', 'error'); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await axios.put('/api/auth/profile', { ...profile, avatar });
      // Preserve token + merge fresh server data including avatar
      const updated = { ...user, ...data, token: user.token, avatar: avatar || data.avatar || '' };
      login(updated);
      showMsg('Profile saved successfully');
    } catch { showMsg('Failed to save profile', 'error'); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (pwd.newPwd !== pwd.confirm) { showMsg('Passwords do not match', 'error'); return; }
    if (pwd.newPwd.length < 6) { showMsg('Password must be at least 6 characters', 'error'); return; }
    setSaving(true);
    try {
      await axios.put('/api/auth/password', { currentPassword: pwd.current, newPassword: pwd.newPwd });
      setPwd({ current:'', newPwd:'', confirm:'' });
      showMsg('Password changed successfully');
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to change password', 'error'); }
    finally { setSaving(false); }
  };

  const sections = [
    { id:'profile', label:'Profile' },
    { id:'password', label:'Password' },
    { id:'account', label:'Account Info' },
  ];

  return (
    <div className='dash-settings-grid' style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:24, alignItems:'start' }}>
      {/* Sidebar */}
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
        {sections.map(s => (
          <div key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding:'12px 18px', cursor:'pointer', fontSize:14, fontWeight:activeSection===s.id?700:500,
            color:activeSection===s.id?'var(--green-dark)':'#374151',
            background:activeSection===s.id?'#f0fdf4':'#fff',
            borderLeft:`3px solid ${activeSection===s.id?'var(--green)':'transparent'}`,
            borderBottom:'1px solid #f3f4f6'
          }}>{s.label}</div>
        ))}
      </div>

      {/* Content */}
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:28 }}>
        {msg.text && (
          <div style={{ background:msg.type==='error'?'#fef2f2':'#f0fdf4', border:`1px solid ${msg.type==='error'?'#fecaca':'#86efac'}`, borderRadius:8, padding:'10px 16px', fontSize:13, color:msg.type==='error'?'#dc2626':'#15803d', marginBottom:20 }}>
            {msg.text}
          </div>
        )}

        {/* Profile section */}
        {activeSection === 'profile' && (
          <>
            <h3 style={{ fontSize:17, fontWeight:700, marginBottom:24, color:'#0f1923' }}>Profile Information</h3>

            {/* Avatar */}
            <div style={{ marginBottom:28, paddingBottom:28, borderBottom:'1px solid #f3f4f6' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:14 }}>Profile Photo</div>
              <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                {/* Avatar circle */}
                <div style={{ position:'relative', flexShrink:0 }}>
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--green)', display:'block' }} />
                    : <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:28, fontWeight:800 }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                  }
                  {/* Small camera overlay */}
                  <div
                    onClick={() => avatarRef.current.click()}
                    style={{ position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:'50%', background:'var(--green)', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#0f1923', marginBottom:4 }}>{user.name}</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginBottom:12 }}>JPG or PNG, max 5MB</div>
                  <input ref={avatarRef} type="file" accept="image/*" onChange={e=>handleAvatarUpload(e.target.files[0])} style={{ display:'none' }} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => avatarRef.current.click()} className="btn-primary" style={{ padding:'8px 18px', fontSize:13 }}>
                      Upload photo
                    </button>
                    {avatarPreview && (
                      <button onClick={() => { setAvatar(''); setAvatarPreview(''); }} style={{ padding:'8px 16px', border:'1.5px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13, color:'#6b7280', fontWeight:500 }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Field label="Full Name" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} placeholder="Your full name" />
            <Field label="Phone Number" type="tel" value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))} placeholder="+228 XX XX XX XX" />
            <Field label="City" value={profile.city} onChange={e=>setProfile(p=>({...p,city:e.target.value}))} placeholder="Lome, Sokode..." />
            <Field label="Bio" as="textarea" value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} placeholder="Tell clients about yourself..." />

            <button className="btn-primary" onClick={saveProfile} disabled={saving} style={{ padding:'10px 28px' }}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </>
        )}

        {/* Password section */}
        {activeSection === 'password' && (
          <>
            <h3 style={{ fontSize:17, fontWeight:700, marginBottom:24, color:'#0f1923' }}>Change Password</h3>
            <Field label="Current Password" type="password" value={pwd.current} onChange={e=>setPwd(p=>({...p,current:e.target.value}))} placeholder="Enter current password" />
            <Field label="New Password" type="password" value={pwd.newPwd} onChange={e=>setPwd(p=>({...p,newPwd:e.target.value}))} placeholder="Min. 6 characters" />
            <Field label="Confirm New Password" type="password" value={pwd.confirm} onChange={e=>setPwd(p=>({...p,confirm:e.target.value}))} placeholder="Repeat new password" />
            <button className="btn-primary" onClick={savePassword} disabled={saving||!pwd.current||!pwd.newPwd||!pwd.confirm} style={{ padding:'10px 28px' }}>
              {saving ? 'Updating...' : 'Change password'}
            </button>
          </>
        )}

        {/* Account info */}
        {activeSection === 'account' && (
          <>
            <h3 style={{ fontSize:17, fontWeight:700, marginBottom:24, color:'#0f1923' }}>Account Details</h3>
            {[
              { label:'Email', value:user.email },
              { label:'Plan', value:PLAN_INFO[user.plan]?.label || 'Basic' },
              { label:'Role', value:user.role || 'buyer' },
              { label:'Member since', value:new Date().toLocaleDateString() },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid #f3f4f6', fontSize:14 }}>
                <span style={{ color:'#6b7280', fontWeight:500 }}>{row.label}</span>
                <span style={{ color:'#0f1923', fontWeight:600 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ marginTop:20 }}>
              <Link to="/pricing"><button className="btn-primary" style={{ padding:'10px 24px' }}>Upgrade plan</button></Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Billing Tab ──
function BillingTab({ billingStatus, billingHistory }) {
  const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  const fmtAmt  = n => Number(n).toLocaleString() + ' CFA';

  const statusColor = { active:'#0f6e56', expired:'#dc2626', cancelled:'#6b7280' };
  const statusBg    = { active:'#ecfdf5', expired:'#fef2f2', cancelled:'#f3f4f6' };

  return (
    <div>

      {/* Current plan status card */}
      {billingStatus && billingStatus.active_billing && (
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:24, marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#0f1923', marginBottom:18 }}>Active Plan</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {[
              { label:'Plan', value: billingStatus.plan?.charAt(0).toUpperCase() + billingStatus.plan?.slice(1) },
              { label:'Period', value: billingStatus.active_billing.period === 'yearly' ? 'Annual' : 'Monthly' },
              { label:'Started', value: fmtDate(billingStatus.active_billing.started_at) },
              { label:'Expires', value: fmtDate(billingStatus.active_billing.expires_at) },
              { label:'Amount paid', value: fmtAmt(billingStatus.active_billing.amount) },
              { label:'Days remaining', value: billingStatus.days_left !== null ? `${billingStatus.days_left} day${billingStatus.days_left!==1?'s':''}` : '-' },
            ].map(r => (
              <div key={r.label} style={{ padding:'12px 14px', background:'#f9fafb', borderRadius:9 }}>
                <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:3, textTransform:'uppercase', letterSpacing:'.04em' }}>{r.label}</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#0f1923' }}>{r.value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {billingStatus.days_left !== null && (
            <div style={{ marginTop:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6b7280', marginBottom:6 }}>
                <span>Plan duration</span>
                <span style={{ fontWeight:700, color: billingStatus.days_left <= 5 ? '#dc2626' : '#0f6e56' }}>
                  {billingStatus.days_left} days left
                </span>
              </div>
              <div style={{ background:'#f3f4f6', borderRadius:100, height:8, overflow:'hidden' }}>
                <div style={{
                  width: `${Math.max(5, Math.min(100, (billingStatus.days_left / (billingStatus.active_billing.period === 'yearly' ? 365 : 30)) * 100))}%`,
                  background: billingStatus.days_left <= 5 ? '#dc2626' : 'linear-gradient(90deg,#1D9E75,#0f6e56)',
                  height:'100%', borderRadius:100, transition:'width .4s'
                }} />
              </div>
            </div>
          )}

          <div style={{ marginTop:18, display:'flex', gap:10 }}>
            <Link to="/pricing">
              <button className="btn-primary" style={{ padding:'9px 22px' }}>Renew / Upgrade</button>
            </Link>
          </div>
        </div>
      )}

      {/* Billing history */}
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:24 }}>
        <div style={{ fontSize:16, fontWeight:700, color:'#0f1923', marginBottom:18 }}>Billing History</div>
        {billingHistory.length === 0 ? (
          <div style={{ textAlign:'center', color:'#9ca3af', padding:'24px 0', fontSize:14 }}>No billing records yet.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr style={{ borderBottom:'2px solid #f3f4f6' }}>
                {['Plan','Amount','Period','Date','Expires','Status'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:12, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {billingHistory.map(b => (
                <tr key={b.id} style={{ borderBottom:'1px solid #f9fafb' }}>
                  <td style={{ padding:'12px 10px', fontWeight:700, color:'#0f1923' }}>{b.plan?.charAt(0).toUpperCase()+b.plan?.slice(1)}</td>
                  <td style={{ padding:'12px 10px', color:'#374151' }}>{fmtAmt(b.amount)}</td>
                  <td style={{ padding:'12px 10px', color:'#6b7280', textTransform:'capitalize' }}>{b.period}</td>
                  <td style={{ padding:'12px 10px', color:'#6b7280' }}>{fmtDate(b.created_at)}</td>
                  <td style={{ padding:'12px 10px', color:'#6b7280' }}>{fmtDate(b.expires_at)}</td>
                  <td style={{ padding:'12px 10px' }}>
                    <span style={{ background:statusBg[b.status]||'#f3f4f6', color:statusColor[b.status]||'#6b7280', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, textTransform:'capitalize' }}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Plans Tab ──
function PlansTab() {
  const navigate = useNavigate();
  const plans = [
    { name:'Basic', price:2500, listings:1, features:['1 service listing','Unlimited messages','Reviews'] },
    { name:'Standard', price:9900, listings:10, features:['Up to 10 listings','Unlimited messages','Verified badge','Reviews'], popular:true },
    { name:'Premium', price:24900, listings:'Unlimited', features:['Unlimited listings','Unlimited messages','Verified badge','Featured placement','Priority support'] },
  ];
  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:'#0f1923', marginBottom:6 }}>Upgrade to sell your services</h2>
        <p style={{ fontSize:14, color:'#6b7280' }}>Choose a plan to start listing your services on TogoConnect.</p>
      </div>
      <div className='dash-plans-grid' style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {plans.map(plan => (
          <div key={plan.name} style={{ background:'#fff', border:plan.popular?'2px solid var(--green)':'1px solid #e5e7eb', borderRadius:14, padding:24, position:'relative' }}>
            {plan.popular && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'var(--green)', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 14px', borderRadius:100, whiteSpace:'nowrap' }}>Most Popular</div>}
            <div style={{ fontSize:17, fontWeight:800, color:'#0f1923', marginBottom:4 }}>{plan.name}</div>
            <div style={{ marginBottom:16 }}>
              <span style={{ fontSize:28, fontWeight:800, color:plan.popular?'var(--green-dark)':'#0f1923' }}>{plan.price.toLocaleString()}</span>
              <span style={{ fontSize:13, color:'#9ca3af' }}> CFA/mo</span>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:plan.popular?'var(--green-dark)':'#374151', marginBottom:14, paddingBottom:14, borderBottom:'1px solid #f3f4f6' }}>
              {plan.listings} listing{plan.listings!==1?'s':''}
            </div>
            {plan.features.map(f => (
              <div key={f} style={{ fontSize:13, color:'#374151', marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ color:'var(--green)', fontWeight:700, fontSize:15 }}>+</span> {f}
              </div>
            ))}
            <button onClick={() => navigate('/checkout', { state: { plan:plan.name, price:plan.price, period:'monthly' } })}
              className={plan.popular ? 'btn-plan btn-plan-fill' : 'btn-plan btn-plan-outline'}
              style={{ marginTop:16 }}>
              Get {plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trust Score Tab ──
function TrustTab({ trustData }) {
  if (!trustData) return <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>Loading...</div>;

  const score = trustData.trust_score ?? 100;
  const restricted = trustData.restricted;
  const restrictedUntil = trustData.restricted_until;
  const restrictCount = trustData.restrict_count || 0;
  const events = trustData.events || [];

  const daysLeft = restrictedUntil
    ? Math.max(0, Math.ceil((new Date(restrictedUntil) - new Date()) / 86400000))
    : null;

  const getScoreColor = (s) => {
    if (s >= 80) return '#0f6e56';
    if (s >= 50) return '#f59e0b';
    if (s >= 20) return '#ef4444';
    return '#dc2626';
  };

  const getScoreLabel = (s) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Fair';
    if (s >= 20) return 'Poor';
    return 'Restricted';
  };

  const getEventIcon = (type) => {
    const icons = {
      abusive_message: '⚠️',
      abusive_listing: '🚫',
      spam_listing: '📵',
      reported_by_user: '🚩',
      admin_warning: '⛔',
      good_review: '⭐',
      completed_chat: '✅',
    };
    return icons[type] || '📋';
  };

  const color = getScoreColor(score);

  return (
    <div>
      {/* Score card */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {/* Circle score */}
          <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="48" fill="none" stroke="#f3f4f6" strokeWidth="10" />
              <circle cx="55" cy="55" r="48" fill="none" stroke={color} strokeWidth="10"
                strokeDasharray={`${(score / 100) * 301.6} 301.6`}
                strokeLinecap="round"
                transform="rotate(-90 55 55)"
                style={{ transition: 'stroke-dasharray .5s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>/ 100</div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f1923', marginBottom: 4 }}>
              Trust Score: <span style={{ color }}>{getScoreLabel(score)}</span>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 12 }}>
              {restricted
                ? 'Your account is restricted. You cannot send messages, add listings, or purchase plans.'
                : score >= 80
                ? 'Your account is in great standing. Keep it up!'
                : score >= 50
                ? 'Your account has some warnings. Avoid abusive content to maintain access.'
                : 'Your account is at risk. Further violations may lead to restriction.'}
            </div>

            {/* Progress bar */}
            <div style={{ background: '#f3f4f6', borderRadius: 100, height: 10, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${score}%`, background: color, height: '100%', borderRadius: 100, transition: 'width .5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
              <span>0 — Restricted</span>
              <span>50 — Fair</span>
              <span>100 — Excellent</span>
            </div>
          </div>
        </div>

        {restricted && (
          <div style={{ marginTop: 18, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontWeight:700, color:'#dc2626', fontSize:14, marginBottom:8 }}>Account Suspended</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              <div style={{ background:'#fff', borderRadius:7, padding:'8px 12px' }}>
                <div style={{ fontSize:10, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>Suspension #</div>
                <div style={{ fontSize:15, fontWeight:800, color:'#dc2626' }}>{restrictCount}</div>
              </div>
              <div style={{ background:'#fff', borderRadius:7, padding:'8px 12px' }}>
                <div style={{ fontSize:10, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>Duration</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#dc2626' }}>
                  {restrictedUntil ? `${daysLeft} days left` : 'Permanent'}
                </div>
              </div>
            </div>
            {restrictedUntil && (
              <div style={{ fontSize:12, color:'#991b1b', marginBottom:8 }}>
                <strong>Lifts on:</strong> {new Date(restrictedUntil).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
              </div>
            )}
            <div style={{ fontSize:12, color:'#dc2626' }}>
              {restrictCount === 1 ? 'Next offense: 15-day suspension' :
               restrictCount === 2 ? 'Next offense: 30-day suspension' :
               restrictCount === 3 ? 'Next offense: Permanent ban' : 'This is a permanent ban'}
            </div>
            <div style={{ marginTop:8, fontSize:12, color:'#9ca3af' }}>
              Contact <strong>hello@togoconnect.com</strong> to appeal this decision.
            </div>
          </div>
        )}
      </div>

      {/* Rules */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 22, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f1923', marginBottom: 16 }}>How trust score works</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Abusive message sent', pts: '-10', bad: true },
            { label: 'Abusive listing content', pts: '-20', bad: true },
            { label: 'Reported by another user', pts: '-5', bad: true },
            { label: 'Admin warning issued', pts: '-15', bad: true },
            { label: 'Receiving a review', pts: '+2', bad: false },
            { label: 'Active conversation', pts: '+1', bad: false },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: r.bad ? '#fef9f9' : '#f0fdf4', borderRadius: 8, border: `1px solid ${r.bad ? '#fee2e2' : '#bbf7d0'}` }}>
              <span style={{ fontSize: 13, color: '#374151' }}>{r.label}</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: r.bad ? '#dc2626' : '#0f6e56' }}>{r.pts} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event history */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 22 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f1923', marginBottom: 16 }}>Activity log</div>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0', fontSize: 14 }}>
            No violations recorded. Keep it up!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: e.points < 0 ? '#fef9f9' : '#f0fdf4', borderRadius: 10, border: `1px solid ${e.points < 0 ? '#fee2e2' : '#bbf7d0'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{getEventIcon(e.event_type)}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
                      {({'auto_report_action':'Reported by a user',
                         'reported_by_user':'Reported by a user',
                         'abusive_message':'Abusive message warning',
                         'abusive_listing':'Inappropriate listing warning',
                         'admin_warning':'Warning issued',
                         'admin_restrict':'Account restricted',
                         'admin_restore':'Account restored',
                         'admin_adjustment':'Score adjusted by admin',
                         'false_report':'False report penalty',
                         'auto_restrict':'Account auto-restricted',
                         'good_review':'Received a good review',
                         'completed_chat':'Active conversation bonus',
                         'report_action':'Action taken on report',
                       })[e.event_type] || e.event_type.replace(/_/g,' ')}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 16, color: e.points < 0 ? '#dc2626' : '#0f6e56', flexShrink: 0, marginLeft: 12 }}>
                  {e.points > 0 ? '+' : ''}{e.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── WhatsApp Messenger ──
function MessagesTab({ userId }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showChatReport, setShowChatReport] = useState(false);
  const [chatReportCat, setChatReportCat] = useState('');
  const [chatReportDetail, setChatReportDetail] = useState('');
  const bottomRef = useRef(null);
  const selectedRef = useRef(null);
  const lastCountRef = useRef(0);

  const loadConversations = async () => {
    try {
      const r = await axios.get('/api/messages');
      const convMap = {};
      r.data.forEach(m => {
        const otherId   = m.sender_id===userId ? m.receiver_id   : m.sender_id;
        const otherName = m.sender_id===userId ? m.receiver_name : m.sender_name;
        if (!convMap[otherId]) convMap[otherId] = { otherId, otherName, listingTitle:m.listing_title, listingId:m.listing_id, lastText:m.text, unread:0 };
        if (m.receiver_id===userId && !m.read) convMap[otherId].unread++;
      });
      const list = Object.values(convMap);
      setConversations(list);
      if (!selectedRef.current && list.length > 0) selectConv(list[0]);
    } catch {}
  };

  const selectConv = async (conv) => {
    selectedRef.current = conv;
    setSelected(conv);
    setMessages([]);
    lastCountRef.current = 0;
    try {
      const r = await axios.get(`/api/messages/conversation/${conv.otherId}`);
      setMessages(r.data);
      lastCountRef.current = r.data.length;
      setConversations(prev => prev.map(c => c.otherId===conv.otherId?{...c,unread:0}:c));
    } catch {}
  };

  useEffect(() => {
    const poll = async () => {
      const cur = selectedRef.current;
      if (!cur) return;
      try { const r = await axios.get(`/api/messages/conversation/${cur.otherId}`); setMessages(r.data); } catch {}
    };
    loadConversations();
    const t1 = setInterval(poll, 2000);
    const t2 = setInterval(loadConversations, 4000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [userId]);

  useEffect(() => {
    if (messages.length > lastCountRef.current) {
      lastCountRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior:'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()||!selected||sending) return;
    setSending(true); const t=text; setText('');
    try {
      const r = await axios.post('/api/messages', { receiver_id:selected.otherId, listing_id:selected.listingId, text:t });
      setMessages(prev=>[...prev,r.data]); loadConversations();
    } catch { setText(t); }
    finally { setSending(false); }
  };

  const initials = n => n?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?';
  const fmtTime  = d => new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  const fmtDay   = d => { const dt=new Date(d),t=new Date(); return dt.toDateString()===t.toDateString()?'Today':dt.toLocaleDateString([],{month:'short',day:'numeric'}); };
  const grouped  = messages.reduce((a,m)=>{const k=fmtDay(m.created_at);if(!a[k])a[k]=[];a[k].push(m);return a;},{});

  return (
    <div className='dash-messenger' style={{ display:'flex', height:580, background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.06)' }}>
      {/* Sidebar */}
      <div className='dash-messenger-sidebar' style={{ width:300, borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', background:'#fafafa' }}>
        <div style={{ padding:'18px 20px', borderBottom:'1px solid #e5e7eb', background:'#fff' }}>
          <div style={{ fontWeight:800, fontSize:16, color:'#0f1923' }}>Chats</div>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {conversations.length===0
            ? <div style={{ padding:32, textAlign:'center', color:'#9ca3af', fontSize:13 }}>No conversations yet.<br/>Message a seller to start!</div>
            : conversations.map(conv => {
              const active=selected?.otherId===conv.otherId;
              return (
                <div key={conv.otherId} onClick={()=>selectConv(conv)} style={{ padding:'14px 18px', cursor:'pointer', background:active?'#f0fdf4':'#fff', borderBottom:'1px solid #f3f4f6', borderLeft:`3px solid ${active?'var(--green)':'transparent'}`, display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#1D9E75,#0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:15, fontWeight:800 }}>
                    {initials(conv.otherName)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontWeight:700, fontSize:14, color:'#0f1923' }}>{conv.otherName}</span>
                      {conv.unread>0 && <span style={{ background:'var(--green)', color:'#fff', borderRadius:100, fontSize:11, fontWeight:700, padding:'2px 8px' }}>{conv.unread}</span>}
                    </div>
                    {conv.listingTitle && <div style={{ fontSize:11, color:'var(--green-dark)', fontWeight:600, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.listingTitle}</div>}
                    <div style={{ fontSize:12, color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.lastText}</div>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Chat window */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#f9fafb' }}>
        {!selected
          ? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af' }}><p style={{ fontSize:15, fontWeight:600 }}>Select a conversation</p></div>
          : <>
            <div style={{ padding:'14px 20px', background:'#fff', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14, fontWeight:800, flexShrink:0 }}>{initials(selected.otherName)}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:15, color:'#0f1923' }}>{selected.otherName}</div>
                {selected.listingTitle && selected.listingId && (
                  <a href={`/listings/${selected.listingId}`} style={{ fontSize:12, color:'var(--green-dark)', fontWeight:600, textDecoration:'none' }}>Re: {selected.listingTitle}</a>
                )}
              </div>
              <button onClick={() => setShowChatReport(true)}
                style={{ padding:'6px 12px', border:'1.5px solid #fca5a5', borderRadius:7, background:'#fff', color:'#dc2626', fontWeight:600, cursor:'pointer', fontSize:12, flexShrink:0 }}>
                Report
              </button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:4, background:'#f0faf7' }}>
              {messages.length===0 && <div style={{ textAlign:'center', color:'#9ca3af', fontSize:13, margin:'auto' }}>No messages yet. Say hello!</div>}
              {Object.entries(grouped).map(([day,dayMsgs]) => (
                <div key={day}>
                  <div style={{ textAlign:'center', margin:'12px 0 8px' }}>
                    <span style={{ background:'#e5e7eb', color:'#6b7280', fontSize:11, fontWeight:600, padding:'3px 12px', borderRadius:100 }}>{day}</span>
                  </div>
                  {dayMsgs.map((m,i) => {
                    const mine=m.sender_id===userId;
                    const showAvatar=!mine&&(i===0||dayMsgs[i-1]?.sender_id!==m.sender_id);
                    return (
                      <div key={m.id} style={{ display:'flex', justifyContent:mine?'flex-end':'flex-start', marginBottom:6, alignItems:'flex-end', gap:8 }}>
                        {!mine && <div style={{ width:28, height:28, borderRadius:'50%', background:showAvatar?'linear-gradient(135deg,#1D9E75,#0F6E56)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:800, flexShrink:0 }}>{showAvatar?initials(selected.otherName):''}</div>}
                        <div style={{ maxWidth:'65%' }}>
                          {i===0&&m.listing_title&&m.listing_id&&(
                            <a href={`/listings/${m.listing_id}`} style={{ textDecoration:'none', display:'block', marginBottom:5 }}>
                              <div style={{ background:'#f0fdf4', border:'1.5px solid #6ee7b7', borderRadius:10, padding:'7px 12px', fontSize:12, color:'#065f46', fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                                <div><div style={{ fontSize:10, color:'#6b7280', marginBottom:1 }}>Service</div><div>{m.listing_title}</div></div>
                                <span style={{ marginLeft:'auto', fontSize:12, opacity:.6 }}>Go</span>
                              </div>
                            </a>
                          )}
                          <div style={{ padding:'10px 14px', borderRadius:mine?'18px 18px 4px 18px':'18px 18px 18px 4px', background:mine?'#1D9E75':'#ffffff', color:mine?'#ffffff':'#111827', fontSize:14, lineHeight:1.6, boxShadow:mine?'0 2px 8px rgba(29,158,117,.35)':'0 1px 4px rgba(0,0,0,.10)', border:mine?'none':'1px solid #e5e7eb' }}>
                            {m.text}
                          </div>
                          <div style={{ fontSize:11, color:'#9ca3af', marginTop:4, textAlign:mine?'right':'left', paddingRight:2 }}>
                            {fmtTime(m.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Chat Report Modal */}
            {showChatReport && (
              <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
                onClick={() => setShowChatReport(false)}>
                <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:440, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                    <h3 style={{ fontSize:16, fontWeight:800, color:'#0f1923', margin:0 }}>Report {selected?.otherName}</h3>
                    <button onClick={() => setShowChatReport(false)} style={{ background:'none', border:'none', fontSize:22, color:'#9ca3af', cursor:'pointer', lineHeight:1 }}>×</button>
                  </div>
                  <p style={{ fontSize:13, color:'#6b7280', marginBottom:16, lineHeight:1.6 }}>Select the reason for your report. All reports are reviewed within 24 hours.</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                    {[
                      { value:'harassment', label:'Harassment or threatening messages' },
                      { value:'abusive', label:'Abusive or offensive language' },
                      { value:'scam', label:'Scam or fraud attempt' },
                      { value:'spam', label:'Spam messages' },
                      { value:'fake_seller', label:'Fake seller or impersonation' },
                      { value:'inappropriate', label:'Inappropriate content' },
                      { value:'other', label:'Other reason' },
                    ].map(opt => (
                      <label key={opt.value} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:`1.5px solid ${chatReportCat===opt.value?'var(--green)':'#e5e7eb'}`, borderRadius:8, cursor:'pointer', background:chatReportCat===opt.value?'#f0fdf4':'#fff', transition:'all .15s' }}>
                        <input type="radio" name="chatRepOpt" value={opt.value} checked={chatReportCat===opt.value} onChange={() => setChatReportCat(opt.value)} style={{ accentColor:'var(--green)' }} />
                        <span style={{ fontSize:13, color:'#374151', fontWeight:chatReportCat===opt.value?700:400 }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <div style={{ marginBottom:18 }}>
                    <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>
                      {chatReportCat==='other' ? 'Describe the issue *' : 'Additional details (optional)'}
                    </label>
                    <textarea value={chatReportDetail} onChange={e => setChatReportDetail(e.target.value)}
                      placeholder="Provide more details to help our team..."
                      rows={3} style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', fontSize:13, boxSizing:'border-box', fontFamily:'inherit', outline:'none', resize:'vertical' }}
                      onFocus={e=>e.target.style.borderColor='var(--green)'}
                      onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button
                      disabled={!chatReportCat || (chatReportCat==='other' && !chatReportDetail.trim())}
                      onClick={() => {
                        const reasonMap = { harassment:'Harassment/threatening messages', abusive:'Abusive language', scam:'Scam/fraud', spam:'Spam', fake_seller:'Fake seller', inappropriate:'Inappropriate content', other:'' };
                        const reason = (chatReportCat==='other' ? chatReportDetail : reasonMap[chatReportCat]) + (chatReportDetail && chatReportCat!=='other' ? ': '+chatReportDetail : '');
                        axios.post('/api/reports', { reported_user_id: selected.otherId, reason })
                          .then(() => { setShowChatReport(false); setChatReportCat(''); setChatReportDetail(''); alert('Report submitted. Our team will review it within 24 hours.'); })
                          .catch(() => alert('Failed to submit report. Please try again.'));
                      }}
                      className="btn-primary"
                      style={{ flex:1, padding:'11px', opacity:(!chatReportCat||(chatReportCat==='other'&&!chatReportDetail.trim()))?0.5:1 }}>
                      Submit Report
                    </button>
                    <button onClick={() => { setShowChatReport(false); setChatReportCat(''); setChatReportDetail(''); }}
                      style={{ padding:'11px 20px', border:'1.5px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14, color:'#6b7280' }}>
                      Cancel
                    </button>
                  </div>
                  <p style={{ fontSize:11, color:'#9ca3af', marginTop:10, textAlign:'center' }}>Reports are confidential. False reports may affect your trust score.</p>
                </div>
              </div>
            )}

            <div style={{ padding:'12px 16px', background:'#fff', borderTop:'1px solid #e5e7eb', display:'flex', gap:10, alignItems:'center' }}>
              <input value={text} onChange={e=>setText(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}}
                placeholder="Type a message..."
                style={{ flex:1, border:'1.5px solid #e5e7eb', borderRadius:24, padding:'10px 18px', fontSize:14, outline:'none', background:'#f9fafb', fontFamily:'inherit' }}
                onFocus={e=>e.target.style.borderColor='var(--green)'}
                onBlur={e=>e.target.style.borderColor='#e5e7eb'}
              />
              <button onClick={sendMessage} disabled={sending||!text.trim()} style={{ background:text.trim()?'var(--green)':'#e5e7eb', color:text.trim()?'#fff':'#9ca3af', border:'none', borderRadius:'50%', width:44, height:44, cursor:text.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                &rarr;
              </button>
            </div>
          </>
        }
      </div>
    </div>
  );
}
