import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const sc = (s) => s>=80?'#0f6e56':s>=50?'#f59e0b':s>=20?'#ef4444':'#dc2626';
const sb = (s) => s>=80?'#ecfdf5':s>=50?'#fefce8':s>=20?'#fef2f2':'#fef2f2';
const fmt = (n) => Number(n||0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [listings, setListings] = useState([]);
  const [billing, setBilling] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ name:'', email:'', password:'', role:'buyer', plan:'none', city:'Lomé' });
  const [adjustPts, setAdjustPts] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [reportFilter, setReportFilter] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [noteValue, setNoteValue] = useState('');
  const [showManualReport, setShowManualReport] = useState(false);
  const [manualReport, setManualReport] = useState({ reported_user_id:'', reported_listing_id:'', reason:'' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!user.role_admin) { navigate('/dashboard'); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    try {
      const [s, u, r, l, b] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/reports'),
        axios.get('/api/admin/listings'),
        axios.get('/api/admin/billing'),
      ]);
      setStats(s.data); setUsers(u.data); setReports(r.data); setListings(l.data); setBilling(b.data);
    } catch {}
  };

  const showToast = (msg, dur=3000) => { setToast(msg); setTimeout(()=>setToast(''), dur); };

  const loadUsers = async () => {
    const r = await axios.get('/api/admin/users', { params:{ search, filter } });
    setUsers(r.data);
  };

  const openUser = async (id) => {
    const r = await axios.get(`/api/admin/users/${id}`);
    setSelectedUser(r.data);
  };

  const handleRestrict = (id, restrict) => {
    if (restrict) {
      setNoteModal({ title:'Restrict Account', placeholder:'Reason for restriction...', onConfirm: async (note) => {
        await axios.put(`/api/admin/users/${id}/restrict`, { restrict:true, reason:note||'Restricted by admin' });
        showToast('User restricted'); loadAll(); if(selectedUser?.id==id) openUser(id);
      }});
    } else {
      setConfirmModal({ title:'Restore Account', message:'Are you sure you want to restore this account? Their listings will go live again.', onConfirm: async () => {
        await axios.put(`/api/admin/users/${id}/restrict`, { restrict:false, reason:'Restored by admin' });
        showToast('User restored'); loadAll(); if(selectedUser?.id==id) openUser(id);
      }});
    }
  };

  const handleDelete = (id, name) => {
    setConfirmModal({ title:'Delete User', message:`Delete "${name}" permanently? This cannot be undone.`, danger:true, onConfirm: async () => {
      await axios.delete(`/api/admin/users/${id}`);
      showToast('User deleted'); setSelectedUser(null); loadAll();
    }});
  };

  const handleWarn = (id) => {
    if (!warnReason) return;
    setConfirmModal({
      title: 'Issue Warning',
      message: `Issue warning (-15 pts) to this user for: "${warnReason}"?`,
      confirmText: 'Issue Warning',
      confirmColor: '#f59e0b',
      onConfirm: async () => {
        await axios.put(`/api/admin/users/${id}/adjust-score`, { points:-15, reason:warnReason });
        showToast('Warning issued'); setWarnReason('');
        loadAll(); openUser(id);
      }
    });
  };

  const handleAdjust = async (id) => {
    if (!adjustPts || !adjustReason) return;
    await axios.put(`/api/admin/users/${id}/adjust-score`, { points:parseInt(adjustPts), reason:adjustReason });
    showToast('Score adjusted'); setAdjustPts(''); setAdjustReason('');
    loadAll(); openUser(id);
  };

  const handleCreateUser = async () => {
    if (!newUser.name||!newUser.email||!newUser.password) return;
    await axios.post('/api/admin/users', newUser);
    showToast('User created'); setShowCreateUser(false);
    setNewUser({ name:'',email:'',password:'',role:'buyer',plan:'none',city:'Lomé' });
    loadAll();
  };

  const handleReport = (id, status, action='') => {
    const titles = { warn:'Issue Warning', restrict:'Restrict User', restore:'Restore User', dismiss_restore:'Mark as False Report', '':'Update Report' };
    setNoteModal({ title: titles[action]||'Update Report', placeholder:'Add a note (optional)...', onConfirm: async (note) => {
      await axios.put(`/api/admin/reports/${id}`, { status, admin_note:note, action });
      showToast('Done'); loadAll();
    }});
  };

  const handleRemoveListing = async (id) => {
    if (!window.confirm('Remove this listing?')) return;
    await axios.delete(`/api/admin/listings/${id}`);
    showToast('Listing removed'); loadAll();
  };

  if (!user?.role_admin) return null;

  const TABS = [
    { id:'overview', label:'Overview' },
    { id:'users', label:`Users (${users.length})` },
    { id:'reports', label:`Reports`, badge: reports.filter(r=>r.status==='pending').length },
    { id:'ai_decisions', label:'AI Decisions', badge: reports.filter(r=>r.status==='auto_actioned').length },
    { id:'listings', label:'Listings' },
    { id:'billing', label:'Billing' },
  ];

  return (
    <div style={{ background:'#f1f5f9', minHeight:'100vh' }}>
      {/* Top bar */}
      <div style={{ background:'linear-gradient(135deg,#0f1923,#1e3a5f)', padding:'0', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ background:'var(--green)', color:'#fff', fontWeight:900, fontSize:16, padding:'6px 12px', borderRadius:8 }}>TC</div>
            <div>
              <div style={{ color:'#fff', fontWeight:800, fontSize:16 }}>TogoConnect Admin</div>
              <div style={{ color:'rgba(255,255,255,.5)', fontSize:11 }}>Super Admin Panel</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {toast && <div style={{ background:'#1D9E75', color:'#fff', fontSize:13, fontWeight:600, padding:'7px 16px', borderRadius:8 }}>{toast}</div>}
            <button onClick={() => setShowCreateUser(true)}
              style={{ padding:'8px 16px', background:'var(--green)', border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              + Create User
            </button>
            <Link to="/dashboard"><button style={{ padding:'8px 16px', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13 }}>Dashboard</button></Link>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display:'flex', padding:'0 32px', gap:2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'12px 20px', border:'none', background:'transparent', cursor:'pointer', fontSize:14,
              fontWeight: tab===t.id ? 700 : 400,
              color: tab===t.id ? '#fff' : 'rgba(255,255,255,.55)',
              borderBottom: tab===t.id ? '2.5px solid var(--green)' : '2.5px solid transparent',
              display:'flex', alignItems:'center', gap:6
            }}>
              {t.label}
              {t.badge > 0 && <span style={{ background:'#dc2626', color:'#fff', fontSize:10, fontWeight:800, padding:'1px 6px', borderRadius:100 }}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'28px 32px' }}>

        {/* ── OVERVIEW ── */}
        {tab==='overview' && stats && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              {[
                { label:'Total Users', value:stats.totalUsers, color:'#0f6e56', sub:'registered accounts' },
                { label:'Restricted', value:stats.restricted, color:'#dc2626', sub:'blocked accounts' },
                { label:'Active Listings', value:stats.activeListings, color:'#7c3aed', sub:`of ${stats.totalListings} total` },
                { label:'Pending Reports', value:stats.pendingReports, color:'#f59e0b', sub:'need review' },
                { label:'Total Messages', value:stats.totalMessages, color:'#0ea5e9', sub:'all conversations' },
                { label:'Active Plans', value:stats.activePlans, color:'#0f6e56', sub:'paying users' },
                { label:'Total Revenue', value:`${fmt(stats.revenue)} CFA`, color:'#7c3aed', sub:'all time' },
                { label:'Listings/User', value:stats.totalUsers>0?(stats.activeListings/stats.totalUsers).toFixed(1):'0', color:'#6b7280', sub:'average' },
              ].map(s => (
                <div key={s.label} style={{ background:'#fff', borderRadius:12, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
                  <div style={{ fontSize:26, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0f1923', marginBottom:2 }}>{s.label}</div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Recent reports */}
            <div style={{ background:'#fff', borderRadius:14, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <div style={{ fontWeight:800, fontSize:16, color:'#0f1923' }}>Pending Reports</div>
                <button onClick={() => setTab('reports')} style={{ fontSize:13, color:'var(--green)', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>View all →</button>
              </div>
              {reports.filter(r=>r.status==='pending').length === 0
                ? <div style={{ color:'#9ca3af', textAlign:'center', padding:'20px 0' }}>No pending reports</div>
                : reports.filter(r=>r.status==='pending').slice(0,6).map(r => (
                  <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f3f4f6' }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#0f1923' }}>
                        <span style={{ color:'#0f6e56' }}>{r.reporter_name}</span> reported <span style={{ color:'#dc2626' }}>{r.reported_name||'a user'}</span>
                      </div>
                      {r.listing_title && (
                        <a href={`/listings/${r.reported_listing_id}`} target="_blank" rel="noreferrer"
                          style={{ fontSize:11, color:'var(--green)', fontWeight:600, textDecoration:'none' }}>
                          📋 Listing: {r.listing_title}
                        </a>
                      )}
                      <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{r.reason} · {fmtDate(r.created_at)}</div>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => handleReport(r.id,'resolved','warn')} style={{ padding:'5px 8px', background:'#fefce8', border:'1px solid #fbbf24', borderRadius:6, color:'#92400e', fontWeight:600, cursor:'pointer', fontSize:11 }}>Warn</button>
                      <button onClick={() => handleReport(r.id,'resolved','restrict')} style={{ padding:'5px 8px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, color:'#dc2626', fontWeight:600, cursor:'pointer', fontSize:11 }}>Restrict</button>
                      {r.reported_listing_id && <button onClick={async()=>{ await axios.delete(`/api/admin/listings/${r.reported_listing_id}`); await axios.put(`/api/admin/reports/${r.id}`,{status:'resolved',admin_note:'Listing removed by admin'}); showToast('Listing removed'); loadAll(); }} style={{ padding:'5px 8px', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, color:'#dc2626', fontWeight:700, cursor:'pointer', fontSize:11 }}>Remove Listing</button>}
                      <button onClick={() => handleReport(r.id,'dismissed','dismiss_restore')} style={{ padding:'5px 8px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:6, color:'#0f6e56', fontWeight:600, cursor:'pointer', fontSize:11 }}>False</button>
                      <button onClick={() => handleReport(r.id,'dismissed')} style={{ padding:'5px 8px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:6, color:'#6b7280', fontWeight:600, cursor:'pointer', fontSize:11 }}>Dismiss</button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab==='users' && (
          <div style={{ display:'grid', gridTemplateColumns:selectedUser?'1fr 400px':'1fr', gap:20, alignItems:'start' }}>
            <div>
              <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadUsers()}
                  placeholder="Search name or email..."
                  style={{ flex:1, minWidth:200, border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 14px', fontSize:14, outline:'none', background:'#fff' }} />
                <select value={filter} onChange={e=>{setFilter(e.target.value); setTimeout(loadUsers,50);}}
                  style={{ border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 14px', fontSize:14, background:'#fff', cursor:'pointer' }}>
                  <option value="">All users</option>
                  <option value="restricted">Restricted</option>
                  <option value="warned">Warned</option>
                  <option value="active">Active plans</option>
                </select>
                <button onClick={loadUsers} style={{ padding:'9px 20px', background:'var(--green)', border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer' }}>Search</button>
              </div>

              <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e5e7eb' }}>
                      {['User','Plan','Trust','Reports','Status','Actions'].map(h=>(
                        <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u=>(
                      <tr key={u.id} onClick={()=>openUser(u.id)} style={{ borderBottom:'1px solid #f8fafc', cursor:'pointer', background:selectedUser?.id===u.id?'#f0fdf4':'#fff', transition:'background .1s' }}
                        onMouseEnter={e=>{if(selectedUser?.id!==u.id)e.currentTarget.style.background='#f9fafb';}}
                        onMouseLeave={e=>{if(selectedUser?.id!==u.id)e.currentTarget.style.background='#fff';}}>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ fontWeight:700, color:'#0f1923' }}>{u.name}</div>
                          <div style={{ fontSize:11, color:'#9ca3af' }}>{u.email}</div>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, background:u.plan==='none'?'#f3f4f6':'#ecfdf5', color:u.plan==='none'?'#6b7280':'#0f6e56', textTransform:'capitalize' }}>
                            {u.plan||'none'}
                          </span>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:50, height:6, background:'#f3f4f6', borderRadius:100, overflow:'hidden' }}>
                              <div style={{ width:`${u.trust_score??100}%`, background:sc(u.trust_score??100), height:'100%', borderRadius:100 }}/>
                            </div>
                            <span style={{ fontWeight:800, color:sc(u.trust_score??100), fontSize:13, minWidth:24 }}>{u.trust_score??100}</span>
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px', color: u.report_count>0?'#dc2626':'#9ca3af', fontWeight:u.report_count>0?700:400 }}>
                          {u.report_count||0}
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, background:u.restricted?'#fef2f2':'#f0fdf4', color:u.restricted?'#dc2626':'#0f6e56' }}>
                            {u.restricted?'Restricted':'Active'}
                          </span>
                        </td>
                        <td style={{ padding:'12px 16px' }} onClick={e=>e.stopPropagation()}>
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={()=>openUser(u.id)} style={{ padding:'5px 10px', border:'1px solid #e5e7eb', borderRadius:6, background:'#fff', cursor:'pointer', fontSize:12 }}>View</button>
                            <button onClick={()=>handleRestrict(u.id,!u.restricted)}
                              style={{ padding:'6px 14px', border:'none', borderRadius:6, background:u.restricted?'#16a34a':'#fef2f2', cursor:'pointer', fontSize:12, color:u.restricted?'#fff':'#dc2626', fontWeight:700 }}>
                              {u.restricted ? 'Restore' : 'Restrict'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User detail */}
            {selectedUser && (
              <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,.06)', position:'sticky', top:80, maxHeight:'calc(100vh - 100px)', overflowY:'auto' }}>
                <div style={{ padding:'18px 22px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#fff', zIndex:10 }}>
                  <h3 style={{ fontSize:16, fontWeight:800, color:'#0f1923', margin:0 }}>{selectedUser.name}</h3>
                  <button onClick={()=>setSelectedUser(null)} style={{ background:'none', border:'none', fontSize:22, color:'#9ca3af', cursor:'pointer' }}>×</button>
                </div>
                <div style={{ padding:'18px 22px' }}>
                  <div style={{ fontSize:12, color:'#9ca3af', marginBottom:16 }}>{selectedUser.email}</div>

                  {/* Restriction info */}
                  {selectedUser.restricted === 1 && (
                    <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
                      <div style={{ fontSize:12, fontWeight:800, color:'#dc2626', marginBottom:6 }}>Account Restricted</div>
                      {(() => {
                        const lastEvent = (selectedUser.events||[]).find(e => e.event_type==='auto_restrict'||e.event_type==='admin_restrict');
                        const autoEvent = (selectedUser.events||[]).find(e => e.event_type==='auto_restrict');
                        const adminEvent = (selectedUser.events||[]).find(e => e.event_type==='admin_restrict');
                        return (
                          <div style={{ fontSize:12, color:'#991b1b', lineHeight:1.6 }}>
                            <div><strong>Type:</strong> {autoEvent ? 'Auto-restricted (too many reports)' : 'Manually restricted by admin'}</div>
                            {lastEvent && <div><strong>Since:</strong> {new Date(lastEvent.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>}
                            {adminEvent && adminEvent.description && <div><strong>Reason:</strong> {adminEvent.description}</div>}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Trust circle */}
                  <div style={{ textAlign:'center', marginBottom:18 }}>
                    <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:80, height:80, borderRadius:'50%', background:sb(selectedUser.trust_score??100), border:`3px solid ${sc(selectedUser.trust_score??100)}` }}>
                      <span style={{ fontSize:22, fontWeight:800, color:sc(selectedUser.trust_score??100) }}>{selectedUser.trust_score??100}</span>
                    </div>
                    <div style={{ fontSize:12, color:'#9ca3af', marginTop:6 }}>Trust Score</div>
                  </div>

                  {/* Info grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
                    {[
                      { label:'Plan', value:selectedUser.plan||'none' },
                      { label:'Status', value:selectedUser.restricted?'Restricted':'Active' },
                      { label:'Active Listings', value:selectedUser.listings?.filter(l=>l.active).length||0 },
                      { label:'Total Reports', value:selectedUser.reports?.length||0 },
                      { label:'Messages', value:selectedUser.message_count||0 },
                      { label:'Joined', value:fmtDate(selectedUser.created_at) },
                    ].map(r=>(
                      <div key={r.label} style={{ background:'#f9fafb', borderRadius:8, padding:'10px 12px' }}>
                        <div style={{ fontSize:10, color:'#9ca3af', textTransform:'uppercase', fontWeight:700, letterSpacing:'.04em', marginBottom:2 }}>{r.label}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#0f1923' }}>{r.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:18 }}>
                    {selectedUser.restricted ? (
                      <button onClick={()=>handleRestrict(selectedUser.id, false)}
                        style={{ padding:'13px 16px', border:'none', borderRadius:8, background:'#16a34a', color:'#fff', fontWeight:800, cursor:'pointer', fontSize:15, width:'100%', letterSpacing:'.01em', boxShadow:'0 3px 10px rgba(22,163,74,.35)' }}>
                        Restore Account
                      </button>
                    ) : (
                      <button onClick={()=>handleRestrict(selectedUser.id, true)}
                        style={{ padding:'13px 16px', border:'none', borderRadius:8, background:'#dc2626', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14, width:'100%' }}>
                        Restrict Account
                      </button>
                    )}
                    <button onClick={()=>handleDelete(selectedUser.id, selectedUser.name)}
                      style={{ padding:'10px', border:'1.5px solid #fca5a5', borderRadius:8, background:'#fff', color:'#dc2626', fontWeight:700, cursor:'pointer', fontSize:13 }}>
                      Delete User
                    </button>
                  </div>

                  {/* Warn */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>Issue Warning (-15 pts)</div>
                    <div style={{ display:'flex', gap:6 }}>
                      <input value={warnReason} onChange={e=>setWarnReason(e.target.value)} placeholder="Reason..."
                        style={{ flex:1, border:'1.5px solid #e5e7eb', borderRadius:6, padding:'7px 10px', fontSize:12, outline:'none' }} />
                      <button onClick={()=>handleWarn(selectedUser.id)} disabled={!warnReason}
                        style={{ padding:'7px 14px', background:'#f59e0b', border:'none', borderRadius:6, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:12 }}>Warn</button>
                    </div>
                  </div>

                  {/* Adjust Score */}
                  <div style={{ marginBottom:18, background:'#f9fafb', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:8 }}>Adjust Trust Score</div>
                    <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                      <input type="number" value={adjustPts} onChange={e=>setAdjustPts(e.target.value)} placeholder="+10 or -10"
                        style={{ width:90, border:'1.5px solid #e5e7eb', borderRadius:6, padding:'8px 10px', fontSize:13, outline:'none', background:'#fff' }} />
                      <input value={adjustReason} onChange={e=>setAdjustReason(e.target.value)} placeholder="Reason for adjustment..."
                        style={{ flex:1, border:'1.5px solid #e5e7eb', borderRadius:6, padding:'8px 10px', fontSize:13, outline:'none', background:'#fff' }} />
                    </div>
                    <button onClick={()=>handleAdjust(selectedUser.id)} disabled={!adjustPts||!adjustReason}
                      style={{ width:'100%', padding:'9px', background: (!adjustPts||!adjustReason) ? '#9ca3af' : (parseInt(adjustPts)>0 ? '#0f6e56' : '#dc2626'),
                        border:'none', borderRadius:7, color:'#fff', fontWeight:700, cursor:(!adjustPts||!adjustReason)?'not-allowed':'pointer', fontSize:13, transition:'all .2s' }}>
                      {adjustPts && parseInt(adjustPts) > 0 ? `+ Add ${adjustPts} pts` : adjustPts && parseInt(adjustPts) < 0 ? `− Deduct ${Math.abs(adjustPts)} pts` : 'Apply Adjustment'}
                    </button>
                  </div>

                  {/* Billing history */}
                  {selectedUser.billing?.length > 0 && (
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:8 }}>Billing History</div>
                      {selectedUser.billing.map(b=>(
                        <div key={b.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f9fafb', fontSize:12 }}>
                          <div>
                            <span style={{ fontWeight:700, textTransform:'capitalize' }}>{b.plan}</span>
                            <span style={{ color:'#9ca3af' }}> · {b.period}</span>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontWeight:700 }}>{fmt(b.amount)} CFA</div>
                            <div style={{ color:'#9ca3af', fontSize:11 }}>{fmtDate(b.created_at)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trust events */}
                  <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:8 }}>Activity Log</div>
                  <div style={{ maxHeight:200, overflowY:'auto' }}>
                    {(selectedUser.events||[]).map(e=>(
                      <div key={e.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f9fafb', fontSize:12 }}>
                        <div>
                          <div style={{ color:'#374151' }}>{e.event_type.replace(/_/g,' ')}</div>
                          {e.description && <div style={{ color:'#9ca3af', fontSize:11 }}>{e.description}</div>}
                        </div>
                        <span style={{ fontWeight:800, color:e.points<0?'#dc2626':'#0f6e56', flexShrink:0, marginLeft:8 }}>{e.points>0?'+':''}{e.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab==='reports' && (
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>

              {['','pending','resolved','dismissed','auto_actioned'].map(s=>(
                <button key={s} onClick={()=>setReportFilter(s)}
                  style={{ padding:'7px 16px', border:'1.5px solid '+(reportFilter===s?'var(--green)':'#e5e7eb'), borderRadius:8, background:reportFilter===s?'var(--green)':'#fff', color:reportFilter===s?'#fff':'#374151', fontWeight:reportFilter===s?700:400, cursor:'pointer', fontSize:13 }}>
                  {s||'All'} {s==='pending'&&`(${reports.filter(r=>r.status==='pending').length})`}
                </button>
              ))}
            </div>
            <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e5e7eb' }}>
                    {['Reporter','Reported','Reason','AI Verdict','Date','Status','Actions'].map(h=>(
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.filter(r=>!reportFilter||r.status===reportFilter).map(r=>(
                    <tr key={r.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ fontWeight:600, color:'#0f1923' }}>{r.reporter_name}</div>
                        <div style={{ fontSize:11, color:'#9ca3af' }}>{r.reporter_email}</div>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ fontWeight:600, color:'#dc2626' }}>{r.reported_name||'—'}</div>
                        {r.reported_email && <div style={{ fontSize:11, color:'#9ca3af' }}>{r.reported_email}</div>}
                        {r.listing_title && (
                          <a href={`/listings/${r.reported_listing_id}`} target="_blank" rel="noreferrer"
                            style={{ fontSize:11, color:'var(--green)', fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:3, marginTop:3 }}>
                            📋 {r.listing_title.length>30?r.listing_title.slice(0,30)+'...':r.listing_title}
                          </a>
                        )}
                      </td>
                      <td style={{ padding:'12px 16px', color:'#374151', maxWidth:180 }}>{r.reason}</td>
                      <td style={{ padding:'12px 16px' }}>
                        {/* Parse AI verdict from admin_note */}
                        {(() => {
                          const note = r.admin_note || '';
                          const match = note.match(/AI: (valid|suspicious|fake) \((\d+)%/);
                          if (!match) return <span style={{ fontSize:11, color:'#9ca3af' }}>Pending</span>;
                          const verdict = match[1];
                          const conf = match[2];
                          const colors = { valid:'#0f6e56', suspicious:'#f59e0b', fake:'#dc2626' };
                          const bgs = { valid:'#ecfdf5', suspicious:'#fefce8', fake:'#fef2f2' };
                          return (
                            <div>
                              <span style={{ fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:100, background:bgs[verdict], color:colors[verdict], textTransform:'capitalize' }}>
                                {verdict}
                              </span>
                              <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>{conf}% confidence</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding:'12px 16px', color:'#9ca3af', fontSize:12, whiteSpace:'nowrap' }}>{fmtDate(r.created_at)}</td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, textTransform:'capitalize',
                          background:r.status==='pending'?'#fefce8':r.status==='resolved'?'#ecfdf5':r.status==='auto_actioned'?'#fef2f2':'#f3f4f6',
                          color:r.status==='pending'?'#92400e':r.status==='resolved'?'#0f6e56':r.status==='auto_actioned'?'#dc2626':'#6b7280' }}>
                          {r.status?.replace('_',' ')}
                        </span>
                        {r.admin_note && <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>{r.admin_note}</div>}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        {r.status==='pending' && (
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                            <button onClick={()=>handleReport(r.id,'resolved','warn')} style={{ padding:'5px 8px', background:'#fefce8', border:'1px solid #fbbf24', borderRadius:5, color:'#92400e', fontWeight:600, cursor:'pointer', fontSize:11 }}>Warn</button>
                            <button onClick={()=>handleReport(r.id,'resolved','restrict')} style={{ padding:'5px 8px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:5, color:'#dc2626', fontWeight:600, cursor:'pointer', fontSize:11 }}>Restrict</button>
                            <button onClick={()=>handleReport(r.id,'dismissed')} style={{ padding:'5px 8px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:5, color:'#6b7280', fontWeight:600, cursor:'pointer', fontSize:11 }}>Dismiss</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Manual Report Modal */}
        {showManualReport && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
            onClick={() => setShowManualReport(false)}>
            <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:480, width:'100%' }} onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                <h3 style={{ fontSize:17, fontWeight:800, color:'#0f1923', margin:0 }}>Add Manual Report</h3>
                <button onClick={() => setShowManualReport(false)} style={{ background:'none', border:'none', fontSize:22, color:'#9ca3af', cursor:'pointer' }}>×</button>
              </div>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:18 }}>Create a report against a user — this will be logged and trigger auto-decision.</p>

              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Reported User ID *</label>
                <div style={{ display:'flex', gap:8 }}>
                  <input type="number" value={manualReport.reported_user_id}
                    onChange={e => setManualReport(p=>({...p, reported_user_id:e.target.value}))}
                    placeholder="User ID (from Users tab)"
                    style={{ flex:1, border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 12px', fontSize:14, outline:'none' }} />
                  <div style={{ display:'flex', alignItems:'center', fontSize:12, color:'#9ca3af', padding:'0 8px' }}>
                    {manualReport.reported_user_id && users.find(u=>u.id==manualReport.reported_user_id)?.name
                      ? <span style={{ color:'#0f6e56', fontWeight:700 }}>{users.find(u=>u.id==manualReport.reported_user_id)?.name}</span>
                      : 'Enter user ID'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Listing ID (optional)</label>
                <input type="number" value={manualReport.reported_listing_id}
                  onChange={e => setManualReport(p=>({...p, reported_listing_id:e.target.value}))}
                  placeholder="If report is about a specific listing"
                  style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 12px', fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Reason / Violation *</label>
                <textarea value={manualReport.reason}
                  onChange={e => setManualReport(p=>({...p, reason:e.target.value}))}
                  placeholder="Describe the violation in detail..."
                  rows={4}
                  style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', fontSize:14, boxSizing:'border-box', resize:'vertical', fontFamily:'inherit', outline:'none' }} />
              </div>

              <div style={{ background:'#fefce8', border:'1px solid #fbbf24', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400e', marginBottom:18 }}>
                This will be logged as an admin report and trigger automatic scoring. The user will NOT be notified.
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button
                  disabled={!manualReport.reported_user_id || !manualReport.reason.trim()}
                  onClick={async () => {
                    try {
                      await axios.post('/api/reports', {
                        reported_user_id: parseInt(manualReport.reported_user_id),
                        reported_listing_id: manualReport.reported_listing_id ? parseInt(manualReport.reported_listing_id) : undefined,
                        reason: '[Admin Report] ' + manualReport.reason,
                      });
                      showToast('Manual report created');
                      setShowManualReport(false);
                      setManualReport({ reported_user_id:'', reported_listing_id:'', reason:'' });
                      loadAll();
                    } catch(err) { showToast(err.response?.data?.message || 'Failed'); }
                  }}
                  className="btn-primary"
                  style={{ flex:1, padding:'11px', opacity:(!manualReport.reported_user_id||!manualReport.reason.trim())?0.5:1 }}>
                  Submit Report
                </button>
                <button onClick={() => setShowManualReport(false)}
                  style={{ padding:'11px 20px', border:'1.5px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── LISTINGS ── */}
        {tab==='listings' && (
          <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e5e7eb' }}>
                  {['Title','Seller','Trust','Category','Price','Status','Action'].map(h=>(
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listings.map(l=>(
                  <tr key={l.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                    <td style={{ padding:'12px 16px', fontWeight:600, color:'#0f1923', maxWidth:200 }}>{l.title}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ color:'#374151' }}>{l.seller_name}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>{l.seller_email}</div>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontWeight:800, color:sc(l.trust_score??100) }}>{l.trust_score??100}</span>
                    </td>
                    <td style={{ padding:'12px 16px', color:'#6b7280' }}>{l.category}</td>
                    <td style={{ padding:'12px 16px', fontWeight:600 }}>{fmt(l.price)} CFA</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, background:l.active?'#ecfdf5':'#fef2f2', color:l.active?'#0f6e56':'#dc2626' }}>
                        {l.active?'Active':'Hidden'}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      {l.active
                        ? <button onClick={()=>handleRemoveListing(l.id)} style={{ padding:'5px 12px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, color:'#dc2626', fontWeight:600, cursor:'pointer', fontSize:12 }}>Remove</button>
                        : <span style={{ fontSize:12, color:'#9ca3af' }}>Removed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── AI DECISIONS ── */}
        {tab==='ai_decisions' && (
          <div>
            <div style={{ marginBottom:20 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:'#0f1923', marginBottom:4 }}>AI Auto Decisions</h2>
              <p style={{ fontSize:13, color:'#6b7280' }}>Reports where AI took automatic action. Review and override if needed.</p>
            </div>
            <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e5e7eb' }}>
                    {['Reporter','Reported','Reason','AI Analysis','Auto Action','Override'].map(h=>(
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.filter(r=>r.status==='auto_actioned').map(r=>{
                    const note = r.admin_note || '';
                    const aiMatch = note.match(/AI: (valid|suspicious|fake) \((\d+)%\) — ([^|]+)/);
                    const autoMatch = note.match(/Auto: (\w+)/);
                    const verdict = aiMatch?.[1] || '—';
                    const conf = aiMatch?.[2] || '—';
                    const reasoning = aiMatch?.[3]?.trim() || '—';
                    const autoAction = autoMatch?.[1] || '—';
                    const vColors = { valid:'#0f6e56', suspicious:'#f59e0b', fake:'#dc2626' };
                    const vBgs = { valid:'#ecfdf5', suspicious:'#fefce8', fake:'#fef2f2' };
                    return (
                      <tr key={r.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ fontWeight:600, color:'#374151' }}>{r.reporter_name}</div>
                          <div style={{ fontSize:11, color:'#9ca3af' }}>{r.reporter_email}</div>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ fontWeight:600, color:'#dc2626' }}>{r.reported_name||'—'}</div>
                          <div style={{ fontSize:11, color:'#9ca3af' }}>{r.reported_email}</div>
                        </td>
                        <td style={{ padding:'12px 16px', color:'#374151', maxWidth:140 }}>{r.reason}</td>
                        <td style={{ padding:'12px 16px', maxWidth:220 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                            <span style={{ fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:100, background:vBgs[verdict]||'#f3f4f6', color:vColors[verdict]||'#6b7280', textTransform:'capitalize' }}>{verdict}</span>
                            <span style={{ fontSize:11, color:'#9ca3af' }}>{conf}% confidence</span>
                          </div>
                          <div style={{ fontSize:11, color:'#6b7280', lineHeight:1.4 }}>{reasoning}</div>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, textTransform:'capitalize',
                            background:autoAction==='restricted'?'#fef2f2':autoAction==='warned'?'#fefce8':'#f3f4f6',
                            color:autoAction==='restricted'?'#dc2626':autoAction==='warned'?'#92400e':'#6b7280' }}>
                            {autoAction}
                          </span>
                          {r.reported_trust!=null && <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>User score: {r.reported_trust}</div>}
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            <button onClick={()=>handleReport(r.id,'resolved','restore')}
                              style={{ padding:'5px 10px', background:'#ecfdf5', border:'1px solid #86efac', borderRadius:6, color:'#0f6e56', fontWeight:700, cursor:'pointer', fontSize:11 }}>
                              Overturn — Restore
                            </button>
                            <button onClick={()=>handleReport(r.id,'resolved','restrict')}
                              style={{ padding:'5px 10px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, color:'#dc2626', fontWeight:700, cursor:'pointer', fontSize:11 }}>
                              Escalate — Restrict
                            </button>
                            <button onClick={()=>handleReport(r.id,'dismissed')}
                              style={{ padding:'5px 10px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:6, color:'#6b7280', fontWeight:600, cursor:'pointer', fontSize:11 }}>
                              Dismiss
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {reports.filter(r=>r.status==='auto_actioned').length === 0 && (
                    <tr><td colSpan={6} style={{ padding:'32px', textAlign:'center', color:'#9ca3af' }}>No AI auto decisions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── BILLING ── */}
        {tab==='billing' && (
          <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e5e7eb' }}>
                  {['User','Plan','Amount','Period','Started','Expires','Status'].map(h=>(
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {billing.map(b=>(
                  <tr key={b.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ fontWeight:600, color:'#0f1923' }}>{b.user_name}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>{b.user_email}</div>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontWeight:700, textTransform:'capitalize', color:'#0f6e56' }}>{b.plan}</span>
                    </td>
                    <td style={{ padding:'12px 16px', fontWeight:700 }}>{fmt(b.amount)} CFA</td>
                    <td style={{ padding:'12px 16px', textTransform:'capitalize', color:'#6b7280' }}>{b.period}</td>
                    <td style={{ padding:'12px 16px', color:'#6b7280', fontSize:12 }}>{fmtDate(b.started_at)}</td>
                    <td style={{ padding:'12px 16px', color:'#6b7280', fontSize:12 }}>{fmtDate(b.expires_at)}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, textTransform:'capitalize',
                        background:b.status==='active'?'#ecfdf5':b.status==='expired'?'#fef2f2':'#f3f4f6',
                        color:b.status==='active'?'#0f6e56':b.status==='expired'?'#dc2626':'#6b7280' }}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:420, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#0f1923', marginBottom:10 }}>{confirmModal.title}</h3>
            <p style={{ fontSize:14, color:'#6b7280', marginBottom:24, lineHeight:1.6 }}>{confirmModal.message}</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
                style={{ flex:1, padding:'11px', border:'none', borderRadius:8, background:confirmModal.danger?'#dc2626':'var(--green)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14 }}>
                Confirm
              </button>
              <button onClick={() => setConfirmModal(null)}
                style={{ padding:'11px 20px', border:'1.5px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14, color:'#6b7280' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Note Modal ── */}
      {noteModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:440, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#0f1923', marginBottom:16 }}>{noteModal.title}</h3>
            <textarea value={noteValue} onChange={e=>setNoteValue(e.target.value)}
              placeholder={noteModal.placeholder||'Add a note...'}
              rows={3}
              style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', fontSize:14, boxSizing:'border-box', resize:'vertical', fontFamily:'inherit', outline:'none', marginBottom:18 }}
              onFocus={e=>e.target.style.borderColor='var(--green)'}
              onBlur={e=>e.target.style.borderColor='#e5e7eb'}
              autoFocus
            />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { noteModal.onConfirm(noteValue); setNoteModal(null); setNoteValue(''); }}
                style={{ flex:1, padding:'11px', border:'none', borderRadius:8, background:'var(--green)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14 }}>
                Confirm
              </button>
              <button onClick={() => { setNoteModal(null); setNoteValue(''); }}
                style={{ padding:'11px 20px', border:'1.5px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14, color:'#6b7280' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setConfirmModal(null)}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:420, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:18, fontWeight:800, color:'#0f1923', marginBottom:10 }}>{confirmModal.title}</h3>
            <p style={{ fontSize:14, color:'#6b7280', lineHeight:1.7, marginBottom:24 }}>{confirmModal.message}</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={async()=>{ await confirmModal.onConfirm(); setConfirmModal(null); }}
                style={{ flex:1, padding:'11px', border:'none', borderRadius:8, background:confirmModal.confirmColor||'#0f6e56', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14 }}>
                {confirmModal.confirmText || 'Confirm'}
              </button>
              <button onClick={()=>setConfirmModal(null)}
                style={{ padding:'11px 22px', border:'1.5px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14, color:'#6b7280' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Note Modal ── */}
      {noteModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => { setNoteModal(null); setNoteValue(''); }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:440, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:18, fontWeight:800, color:'#0f1923', marginBottom:8 }}>{noteModal.title}</h3>
            <p style={{ fontSize:14, color:'#6b7280', lineHeight:1.6, marginBottom:18 }}>{noteModal.message}</p>
            <textarea value={noteValue} onChange={e=>setNoteValue(e.target.value)}
              placeholder={noteModal.placeholder || 'Add note...'}
              rows={3}
              style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', fontSize:14, boxSizing:'border-box', fontFamily:'inherit', outline:'none', resize:'vertical', marginBottom:18 }}
              onFocus={e=>e.target.style.borderColor='var(--green)'}
              onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={async()=>{ await noteModal.onConfirm(noteValue); setNoteModal(null); setNoteValue(''); }}
                style={{ flex:1, padding:'11px', border:'none', borderRadius:8, background:noteModal.confirmColor||'#0f6e56', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14 }}>
                {noteModal.confirmText || 'Confirm'}
              </button>
              <button onClick={()=>{ setNoteModal(null); setNoteValue(''); }}
                style={{ padding:'11px 22px', border:'1.5px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14, color:'#6b7280' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={()=>setShowCreateUser(false)}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:440, width:'100%' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontSize:17, fontWeight:800, color:'#0f1923', margin:0 }}>Create New User</h3>
              <button onClick={()=>setShowCreateUser(false)} style={{ background:'none', border:'none', fontSize:22, color:'#9ca3af', cursor:'pointer' }}>×</button>
            </div>
            {[
              { label:'Full Name *', key:'name', type:'text', ph:'John Doe' },
              { label:'Email *', key:'email', type:'email', ph:'user@example.com' },
              { label:'Password *', key:'password', type:'password', ph:'Min 6 characters' },
              { label:'City', key:'city', type:'text', ph:'Lomé' },
            ].map(f=>(
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>{f.label}</label>
                <input type={f.type} value={newUser[f.key]} onChange={e=>setNewUser(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph}
                  style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 12px', fontSize:14, boxSizing:'border-box', outline:'none' }} />
              </div>
            ))}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Role</label>
                <select value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))}
                  style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 12px', fontSize:14, background:'#fff' }}>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Plan</label>
                <select value={newUser.plan} onChange={e=>setNewUser(p=>({...p,plan:e.target.value}))}
                  style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 12px', fontSize:14, background:'#fff' }}>
                  <option value="none">Free</option>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleCreateUser} disabled={!newUser.name||!newUser.email||!newUser.password}
                className="btn-primary" style={{ flex:1, padding:'11px' }}>Create User</button>
              <button onClick={()=>setShowCreateUser(false)} style={{ padding:'11px 20px', border:'1.5px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
