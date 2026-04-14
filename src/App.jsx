import { useState, useEffect, useRef, useCallback } from 'react';

// ─── CONFIG ───
// Change this to your VPS IP/domain after deploying backend
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.kanshalive.com';

// ─── API helpers ───
function getAuthHeader() {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Basic ${token}` } : {};
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Styles ───
const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0a0a0c;--surface:#111114;--surface2:#18181c;--surface3:#222228;
    --border:#2a2a32;--border-hover:#3a3a44;
    --text:#e8e8ec;--text2:#9898a4;--text3:#68687a;
    --accent:#6c5ce7;--accent2:#8b7cf7;--accent-glow:rgba(108,92,231,.15);
    --green:#00d2a0;--green-glow:rgba(0,210,160,.12);
    --red:#ff6b6b;--red-glow:rgba(255,107,107,.12);
    --orange:#ffa53e;--orange-glow:rgba(255,165,62,.12);
    --blue:#4da6ff;
    --font:'DM Sans',system-ui,sans-serif;
    --mono:'JetBrains Mono',monospace;
    --radius:12px;--radius-sm:8px;
  }
  html{font-size:15px}
  body{
    font-family:var(--font);background:var(--bg);color:var(--text);
    min-height:100vh;-webkit-font-smoothing:antialiased;
  }
  ::selection{background:var(--accent);color:#fff}
  input,button,textarea,select{font-family:inherit}

  .app{
    display:flex;flex-direction:column;min-height:100vh;
  }

  /* ─── Navbar ─── */
  .nav{
    display:flex;align-items:center;justify-content:space-between;
    padding:16px 32px;border-bottom:1px solid var(--border);
    background:rgba(17,17,20,.8);backdrop-filter:blur(20px);
    position:sticky;top:0;z-index:100;
  }
  .nav-brand{
    display:flex;align-items:center;gap:10px;font-weight:700;font-size:1.15rem;
    letter-spacing:-.02em;
  }
  .nav-brand .dot{
    width:10px;height:10px;border-radius:50%;background:var(--accent);
    box-shadow:0 0 12px var(--accent);
  }
  .nav-links{display:flex;gap:4px}
  .nav-link{
    padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;
    color:var(--text2);font-size:.9rem;font-weight:500;
    transition:all .2s;border:none;background:none;
  }
  .nav-link:hover{color:var(--text);background:var(--surface2)}
  .nav-link.active{color:var(--accent2);background:var(--accent-glow)}
  .nav-right{display:flex;align-items:center;gap:12px}
  .btn-logout{
    padding:6px 14px;border-radius:var(--radius-sm);cursor:pointer;
    color:var(--text3);font-size:.82rem;font-weight:500;
    border:1px solid var(--border);background:none;transition:all .2s;
  }
  .btn-logout:hover{border-color:var(--red);color:var(--red)}

  /* ─── Main layout ─── */
  .main{flex:1;padding:40px 32px;max-width:1100px;margin:0 auto;width:100%}

  /* ─── Login page ─── */
  .login-wrap{
    display:flex;align-items:center;justify-content:center;
    min-height:calc(100vh - 80px);
  }
  .login-card{
    background:var(--surface);border:1px solid var(--border);
    border-radius:16px;padding:48px 40px;width:100%;max-width:400px;
    box-shadow:0 20px 60px rgba(0,0,0,.4);
  }
  .login-card h2{
    font-size:1.5rem;font-weight:700;margin-bottom:8px;letter-spacing:-.03em;
  }
  .login-card .sub{color:var(--text2);font-size:.9rem;margin-bottom:32px}

  /* ─── Form elements ─── */
  .field{margin-bottom:20px}
  .field label{
    display:block;font-size:.82rem;font-weight:600;color:var(--text2);
    margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em;
  }
  .field input,.field textarea,.field select{
    width:100%;padding:12px 16px;border-radius:var(--radius-sm);
    border:1px solid var(--border);background:var(--surface2);color:var(--text);
    font-size:.95rem;transition:all .2s;outline:none;
  }
  .field input:focus,.field textarea:focus{
    border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow);
  }
  .field textarea{min-height:100px;resize:vertical;font-family:var(--mono);font-size:.85rem}

  /* ─── Buttons ─── */
  .btn{
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    padding:12px 24px;border-radius:var(--radius-sm);font-size:.95rem;
    font-weight:600;cursor:pointer;transition:all .2s;border:none;
  }
  .btn-primary{
    background:var(--accent);color:#fff;
    box-shadow:0 4px 16px rgba(108,92,231,.3);
  }
  .btn-primary:hover{background:var(--accent2);transform:translateY(-1px)}
  .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
  .btn-full{width:100%}
  .btn-sm{padding:8px 16px;font-size:.85rem}
  .btn-ghost{background:var(--surface2);color:var(--text);border:1px solid var(--border)}
  .btn-ghost:hover{border-color:var(--accent);color:var(--accent2)}
  .btn-green{background:var(--green);color:#000;box-shadow:0 4px 16px rgba(0,210,160,.3)}
  .btn-green:hover{transform:translateY(-1px)}

  /* ─── Upload area ─── */
  .upload-zone{
    border:2px dashed var(--border);border-radius:16px;
    padding:60px 40px;text-align:center;cursor:pointer;
    transition:all .3s;background:var(--surface);
    position:relative;overflow:hidden;
  }
  .upload-zone:hover,.upload-zone.drag{
    border-color:var(--accent);background:var(--accent-glow);
  }
  .upload-zone.has-file{
    border-color:var(--green);background:var(--green-glow);
  }
  .upload-icon{font-size:3rem;margin-bottom:16px;opacity:.6}
  .upload-zone h3{font-size:1.2rem;margin-bottom:8px;font-weight:600}
  .upload-zone p{color:var(--text2);font-size:.9rem}
  .upload-zone input{
    position:absolute;inset:0;opacity:0;cursor:pointer;
  }
  .file-badge{
    display:inline-flex;align-items:center;gap:8px;
    background:var(--surface2);padding:8px 16px;border-radius:var(--radius-sm);
    margin-top:16px;font-family:var(--mono);font-size:.85rem;
  }
  .file-badge .x{
    cursor:pointer;color:var(--text3);
    padding:2px 6px;border-radius:4px;
  }
  .file-badge .x:hover{background:var(--red-glow);color:var(--red)}

  /* ─── Job tracker ─── */
  .job-card{
    background:var(--surface);border:1px solid var(--border);
    border-radius:var(--radius);padding:24px;margin-top:24px;
  }
  .job-header{
    display:flex;justify-content:space-between;align-items:center;
    margin-bottom:16px;
  }
  .job-header h4{font-size:1rem;font-weight:600}
  .status-badge{
    padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:600;
    text-transform:uppercase;letter-spacing:.05em;
  }
  .status-badge.queued{background:var(--surface3);color:var(--text2)}
  .status-badge.processing{background:var(--orange-glow);color:var(--orange)}
  .status-badge.completed{background:var(--green-glow);color:var(--green)}
  .status-badge.failed{background:var(--red-glow);color:var(--red)}

  .progress-bar{
    width:100%;height:6px;background:var(--surface3);
    border-radius:3px;overflow:hidden;margin:12px 0;
  }
  .progress-fill{
    height:100%;background:linear-gradient(90deg,var(--accent),var(--green));
    border-radius:3px;transition:width .5s ease;
  }
  .job-status-text{color:var(--text2);font-size:.88rem;margin-bottom:8px}
  .job-meta{color:var(--text3);font-size:.8rem;font-family:var(--mono)}

  /* ─── Admin panel ─── */
  .settings-grid{
    display:grid;gap:20px;
  }
  .settings-section{
    background:var(--surface);border:1px solid var(--border);
    border-radius:var(--radius);padding:28px;
  }
  .settings-section h3{
    font-size:1.05rem;font-weight:700;margin-bottom:20px;
    display:flex;align-items:center;gap:10px;
  }
  .settings-section h3 span{font-size:1.2rem}

  /* ─── Jobs table ─── */
  .table-wrap{overflow-x:auto;margin-top:20px}
  table{width:100%;border-collapse:collapse;font-size:.88rem}
  th{
    text-align:left;padding:10px 14px;color:var(--text3);
    font-weight:600;font-size:.78rem;text-transform:uppercase;
    letter-spacing:.06em;border-bottom:1px solid var(--border);
  }
  td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text2)}
  tr:hover td{color:var(--text);background:var(--surface2)}

  /* ─── Toast ─── */
  .toast{
    position:fixed;bottom:24px;right:24px;padding:14px 24px;
    border-radius:var(--radius-sm);font-size:.9rem;font-weight:500;
    z-index:1000;animation:slideUp .3s ease;max-width:400px;
    box-shadow:0 8px 32px rgba(0,0,0,.4);
  }
  .toast.success{background:var(--green);color:#000}
  .toast.error{background:var(--red);color:#fff}
  @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}

  /* ─── Server status indicator ─── */
  .server-status{
    display:flex;align-items:center;gap:6px;
    font-size:.78rem;color:var(--text3);
  }
  .server-dot{
    width:8px;height:8px;border-radius:50%;
  }
  .server-dot.online{background:var(--green);box-shadow:0 0 8px var(--green)}
  .server-dot.offline{background:var(--red);box-shadow:0 0 8px var(--red)}
  .server-dot.checking{background:var(--orange);animation:pulse 1s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

  /* ─── Responsive ─── */
  @media(max-width:640px){
    .nav{padding:12px 16px}
    .main{padding:24px 16px}
    .login-card{padding:32px 24px}
    .upload-zone{padding:40px 24px}
  }
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className={`toast ${type}`}>{message}</div>;
}

function ServerStatus({ status }) {
  const cls = status === 'online' ? 'online' : status === 'checking' ? 'checking' : 'offline';
  const label = status === 'online' ? 'Server online' : status === 'checking' ? 'Checking...' : 'Server offline';
  return (
    <div className="server-status">
      <div className={`server-dot ${cls}`} />
      <span>{label}</span>
    </div>
  );
}

// ─── Login ───
function LoginPage({ onLogin, toast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_email', email);
        onLogin();
      } else {
        toast('Invalid credentials', 'error');
      }
    } catch (err) {
      toast('Cannot connect to server', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Sign in</h2>
        <p className="sub">Admin access only. No public registration.</p>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

// ─── Upload Page ───
function UploadPage({ toast }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

const handleFile = (f) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']; const allowedExts = ['.pdf', '.doc', '.docx', '.txt']; const ext = f ? f.name.toLowerCase().slice(f.name.lastIndexOf('.')) : ''; if (f && (allowedTypes.includes(f.type) || allowedExts.includes(ext))) {
      setFile(f);
    } else {
      toast('Only PDF, DOC, DOCX, and TXT files accepted', 'error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast('File uploaded! Processing started.', 'success');
        setActiveJob({ id: data.jobId, status: 'queued', progress: 0, statusMessage: 'Starting...' });
        startPolling(data.jobId);
      } else {
        toast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      toast('Upload failed: ' + err.message, 'error');
    }
    setUploading(false);
  };

  const startPolling = (jobId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/job/${jobId}`);
        const job = await res.json();
        setActiveJob(job);
        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          if (job.status === 'completed') toast('Report ready for download!', 'success');
          if (job.status === 'failed') toast('Processing failed: ' + job.error, 'error');
        }
      } catch (e) {
        // silent
      }
    }, 2000);
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleDownload = () => {
    if (activeJob?.downloadUrl) {
      window.open(`${API_BASE}${activeJob.downloadUrl}`, '_blank');
    }
  };

  const statusClass =
    activeJob?.status === 'completed' ? 'completed' :
    activeJob?.status === 'failed' ? 'failed' :
    activeJob?.status === 'queued' ? 'queued' : 'processing';

  return (
    <div>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-.03em' }}>
        Upload Report
      </h2>
      <p style={{ color: 'var(--text2)', marginBottom: 32 }}>
        Upload a PDF file. It will be processed through ryne.ai, the Turnitin report will be fetched and compressed automatically.
      </p>

      <div
        className={`upload-zone ${dragging ? 'drag' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <div className="upload-icon">{file ? '✓' : '↑'}</div>
        <h3>{file ? 'File selected' : 'Drop your PDF here'}</h3>
        <p>{file ? '' : 'or click to browse'}</p>
        {file && (
          <div className="file-badge">
            📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            <span className="x" onClick={(e) => { e.stopPropagation(); setFile(null); }}>✕</span>
          </div>
        )}
      </div>

      {file && !activeJob && (
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Start Processing'}
          </button>
        </div>
      )}

      {activeJob && (
        <div className="job-card">
          <div className="job-header">
            <h4>Job: {activeJob.fileName || file?.name}</h4>
            <span className={`status-badge ${statusClass}`}>{activeJob.status}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${activeJob.progress || 0}%` }} />
          </div>
          <p className="job-status-text">{activeJob.statusMessage}</p>
          <p className="job-meta">ID: {activeJob.id}</p>
          {activeJob.status === 'completed' && (
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-green" onClick={handleDownload}>
                ↓ Download Compressed Report
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 12 }}
                onClick={() => { setActiveJob(null); setFile(null); }}
              >
                Process another
              </button>
            </div>
          )}
          {activeJob.status === 'failed' && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => { setActiveJob(null); setFile(null); }}
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Admin Settings ───
function AdminSettings({ toast }) {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api('/api/admin/settings');
      setSettings(data);
      setForm(data);
    } catch (e) {
      toast('Failed to load settings', 'error');
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      toast('Settings saved!', 'success');
      load();
    } catch (e) {
      toast('Save failed: ' + e.message, 'error');
    }
    setSaving(false);
  };

  if (!settings) return <p style={{ color: 'var(--text2)' }}>Loading settings...</p>;

  return (
    <div>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-.03em' }}>
        Settings
      </h2>
      <p style={{ color: 'var(--text2)', marginBottom: 32 }}>
        Update credentials and API keys. Leave fields with dots (••••) unchanged to keep current values.
      </p>

      <div className="settings-grid">
        <div className="settings-section">
          <h3><span>🔐</span> Ryne.ai Credentials</h3>
          <div className="field">
            <label>Email</label>
            <input value={form.ryne_email || ''} onChange={(e) => setForm({ ...form, ryne_email: e.target.value })} />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={form.ryne_password || ''}
              onChange={(e) => setForm({ ...form, ryne_password: e.target.value })}
              placeholder="Leave blank to keep current"
            />
          </div>
        </div>

        <div className="settings-section">
          <h3><span>🗄️</span> Supabase Config</h3>
          <div className="field">
            <label>API URL</label>
            <input value={form.supabase_url || ''} onChange={(e) => setForm({ ...form, supabase_url: e.target.value })} />
          </div>
          <div className="field">
            <label>API Key</label>
            <input value={form.supabase_api_key || ''} onChange={(e) => setForm({ ...form, supabase_api_key: e.target.value })} />
          </div>
          <div className="field">
            <label>Authorization Token</label>
            <textarea
              value={form.supabase_auth_token || ''}
              onChange={(e) => setForm({ ...form, supabase_auth_token: e.target.value })}
              placeholder="Bearer eyJ..."
              style={{ minHeight: 80 }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button className="btn btn-ghost" onClick={load}>Reset</button>
      </div>
    </div>
  );
}

// ─── Admin Jobs ───
function AdminJobs({ toast }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api('/api/admin/jobs');
      setJobs(data);
    } catch (e) {
      toast('Failed to load jobs', 'error');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [load]);

  const clearCompleted = async () => {
    try {
      await api('/api/admin/jobs/completed', { method: 'DELETE' });
      toast('Cleared completed jobs', 'success');
      load();
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-.03em' }}>Jobs</h2>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>{jobs.length} total jobs</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
          <button className="btn btn-ghost btn-sm" onClick={clearCompleted}>Clear completed</button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text2)' }}>Loading...</p>
      ) : jobs.length === 0 ? (
        <div className="settings-section" style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          No jobs yet. Upload a file to start.
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Created</th>
                <th>Completed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const cls =
                  j.status === 'completed' ? 'completed' :
                  j.status === 'failed' ? 'failed' :
                  j.status === 'queued' ? 'queued' : 'processing';
                return (
                  <tr key={j.id}>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: '.82rem' }}>{j.fileName}</td>
                    <td><span className={`status-badge ${cls}`}>{j.status}</span></td>
                    <td>{j.progress}%</td>
                    <td style={{ fontSize: '.82rem' }}>{fmtDate(j.createdAt)}</td>
                    <td style={{ fontSize: '.82rem' }}>{fmtDate(j.completedAt)}</td>
                    <td>
                      {j.status === 'completed' && j.downloadUrl && (
                        <a
                          href={`${API_BASE}${j.downloadUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-green btn-sm"
                          style={{ textDecoration: 'none', fontSize: '.78rem', padding: '4px 12px' }}
                        >
                          ↓ Download
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  APP ROOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('admin_token'));
  const [page, setPage] = useState('upload');
  const [toastData, setToastData] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');

  const showToast = useCallback((message, type = 'success') => {
    setToastData({ message, type, key: Date.now() });
  }, []);

  // Check server health
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
        setServerStatus(res.ok ? 'online' : 'offline');
      } catch {
        setServerStatus('offline');
      }
    };
    check();
    const i = setInterval(check, 30000);
    return () => clearInterval(i);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    setLoggedIn(false);
    setPage('upload');
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <nav className="nav">
          <div className="nav-brand">
            <div className="dot" />
            <span>ReportAuto</span>
          </div>
          {loggedIn && (
            <div className="nav-links">
              <button className={`nav-link ${page === 'upload' ? 'active' : ''}`} onClick={() => setPage('upload')}>
                Upload
              </button>
              <button className={`nav-link ${page === 'jobs' ? 'active' : ''}`} onClick={() => setPage('jobs')}>
                Jobs
              </button>
              <button className={`nav-link ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}>
                Settings
              </button>
            </div>
          )}
          <div className="nav-right">
            <ServerStatus status={serverStatus} />
            {loggedIn && (
              <button className="btn-logout" onClick={handleLogout}>Sign out</button>
            )}
          </div>
        </nav>

        <div className="main">
          {!loggedIn ? (
            <LoginPage onLogin={() => setLoggedIn(true)} toast={showToast} />
          ) : page === 'upload' ? (
            <UploadPage toast={showToast} />
          ) : page === 'jobs' ? (
            <AdminJobs toast={showToast} />
          ) : (
            <AdminSettings toast={showToast} />
          )}
        </div>

        {toastData && (
          <Toast
            key={toastData.key}
            message={toastData.message}
            type={toastData.type}
            onClose={() => setToastData(null)}
          />
        )}
      </div>
    </>
  );
}
