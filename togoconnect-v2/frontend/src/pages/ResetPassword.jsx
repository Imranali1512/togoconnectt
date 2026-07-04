import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [valid, setValid] = useState(null); // null=loading, true=valid, false=invalid
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!token) { setValid(false); return; }
    axios.get(`/api/auth/verify-reset-token/${token}`)
      .then(r => setValid(r.data.valid))
      .catch(() => setValid(false));
  }, [token]);

  const validate = () => {
    const e = {};
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (!form.confirm) e.confirm = 'Please confirm your password';
    else if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { token, password: form.password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Something went wrong. Please try again.' });
    } finally { setLoading(false); }
  };

  if (valid === null) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#6b7280' }}>Verifying your link...</div>
      </div>
    </div>
  );

  if (valid === false) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f1923', marginBottom: 8 }}>Invalid or expired link</h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>This reset link is invalid or has expired. Please request a new one.</p>
        <Link to="/forgot-password">
          <button className="btn-primary" style={{ width: '100%', padding: '12px' }}>Request new link</button>
        </Link>
      </div>
    </div>
  );

  if (done) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#ecfdf5', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>✓</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f1923', marginBottom: 8 }}>Password reset!</h2>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Your password has been updated. Redirecting to login...</p>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">T</div>
          <span className="logo-text">TogoConnect</span>
        </div>

        <h2 className="auth-title">Set new password</h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Choose a strong password for your account.</p>

        {errors.general && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>New password</label>
            <div className="pw-wrap">
              <input type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => { setForm(f => ({...f, password: e.target.value})); setErrors(err => ({...err, password: ''})); }}
                placeholder="At least 6 characters" />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label>Confirm new password</label>
            <input type={showPw ? 'text' : 'password'} value={form.confirm}
              onChange={e => { setForm(f => ({...f, confirm: e.target.value})); setErrors(err => ({...err, confirm: ''})); }}
              placeholder="Repeat your password" />
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Updating...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
