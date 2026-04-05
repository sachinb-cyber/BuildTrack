'use client';
import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Page, Btn, Input, Select, Modal, Loading, Badge } from '@/components/UI';
import { formatDate } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const ROLES = ['admin', 'accountant', 'engineer'];
const DEPARTMENTS = ['engineering', 'accounts', 'admin', 'procurement', 'management', 'other'];

const roleColor = { admin: 'var(--red)', accountant: 'var(--yellow)', engineer: 'var(--accent)' };
const roleBg    = { admin: 'rgba(232,74,95,0.1)', accountant: 'rgba(226,183,20,0.1)', engineer: 'rgba(59,130,246,0.1)' };
const roleIcon  = { admin: '🛡️', accountant: '💼', engineer: '⚙️' };

const initForm = { name:'', email:'', password:'', role:'engineer', phone:'', addToStaff:false, department:'engineering', baseSalary:'' };

export default function UsersPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm]           = useState(initForm);
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    if (!hasRole('admin')) { router.replace('/'); return; }
  }, [user]);

  const fetchUsers = useCallback(async () => {
    try {
      const r = await api.get('/users');
      setUsers(r.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── Create user ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', {
        ...form,
        baseSalary: form.baseSalary ? Number(form.baseSalary) : 0,
      });
      toast.success(`User "${form.name}" created${form.addToStaff ? ' and added to Staff' : ''}`);
      setShowAdd(false);
      setForm(initForm);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error creating user');
    } finally { setSaving(false); }
  };

  /* ── Edit user ── */
  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role, phone: u.phone || '', isActive: u.isActive, password: '' });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password;
      await api.put(`/users/${editUser._id}`, payload);
      toast.success('User updated');
      setEditUser(null);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error updating user');
    } finally { setSaving(false); }
  };

  /* ── Delete user ── */
  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Cannot delete user');
    } finally { setSaving(false); }
  };

  /* ── Toggle active ── */
  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? `${u.name} deactivated` : `${u.name} activated`);
      fetchUsers();
    } catch { toast.error('Error'); }
  };

  if (loading) return <Layout><Loading/></Layout>;

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const byRole = ROLES.map(r => ({ role: r, count: users.filter(u => u.role === r).length }));

  return (
    <Layout>
      <Page
        title="User Management"
        subtitle={`${users.length} users · Admin only`}
        actions={
          <Btn icon={<span style={{ fontSize:16 }}>+</span>} onClick={() => setShowAdd(true)}>Add User</Btn>
        }
      >
        {/* Role summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {byRole.map(({ role, count }) => (
            <div key={role} style={{ background:'var(--bg-card)', border:`1px solid ${roleColor[role]}30`, borderRadius:'var(--radius)', padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:roleBg[role], border:`1px solid ${roleColor[role]}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                {roleIcon[role]}
              </div>
              <div>
                <div style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.04em' }}>{count}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', textTransform:'capitalize', fontWeight:600 }}>{role}s</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom:16 }}>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or role…"
            style={{ maxWidth:360 }}
          />
        </div>

        {/* User cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-muted)', fontSize:13 }}>No users found.</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
            {filtered.map((u, i) => {
              const isSelf = u._id === user?._id;
              return (
                <div key={u._id} className={`animate-in delay-${(i % 6) + 1}`} style={{ background:'var(--bg-card)', borderRadius:'var(--radius)', border:`1px solid ${u.isActive ? roleColor[u.role] + '30' : 'var(--border)'}`, padding:20, opacity: u.isActive ? 1 : 0.55, transition:'all 0.25s' }}>
                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:42, height:42, borderRadius:10, background:`linear-gradient(135deg, ${roleColor[u.role]}, ${roleColor[u.role]}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'white', flexShrink:0 }}>
                        {u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>
                          {u.name} {isSelf && <span style={{ fontSize:10, color:'var(--accent-light)', fontWeight:600 }}>(you)</span>}
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', padding:'3px 10px', borderRadius:12, background:roleBg[u.role], color:roleColor[u.role], border:`1px solid ${roleColor[u.role]}40` }}>
                      {roleIcon[u.role]} {u.role}
                    </span>
                  </div>

                  {/* Details */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14, fontSize:12, color:'var(--text-muted)' }}>
                    <div>📅 Joined {formatDate(u.createdAt)}</div>
                    <div>{u.isActive ? '🟢 Active' : '🔴 Inactive'}</div>
                    {u.phone && <div style={{ gridColumn:'1/-1' }}>📞 {u.phone}</div>}
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:6 }}>
                    <Btn size="sm" variant="secondary" style={{ flex:1 }} onClick={() => openEdit(u)}>✏ Edit</Btn>
                    {!isSelf && (
                      <Btn size="sm" variant={u.isActive ? 'ghost' : 'success'} onClick={() => toggleActive(u)}>
                        {u.isActive ? '⏸ Disable' : '▶ Enable'}
                      </Btn>
                    )}
                    {!isSelf && (
                      <Btn size="sm" variant="danger" onClick={() => setDeleteTarget(u)}>🗑</Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Add User Modal ── */}
        <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setForm(initForm); }} title="Add New User">
          <form onSubmit={handleAdd}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <Input label="Full Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))} placeholder="e.g., Rahul Sharma"/>
              <Input label="Email Address" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email:e.target.value }))} placeholder="rahul@company.com"/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <Input label="Password" type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password:e.target.value }))} placeholder="Min 6 characters"/>
              <Input label="Phone (optional)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone:e.target.value }))} placeholder="+91 98765 43210"/>
            </div>
            <Select
              label="Role"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role:e.target.value }))}
              options={ROLES.map(r => ({ value:r, label:`${roleIcon[r]} ${r.charAt(0).toUpperCase() + r.slice(1)}` }))}
              style={{ marginBottom:20 }}
            />

            {/* Add to staff toggle */}
            <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', marginBottom:20 }}>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginBottom: form.addToStaff ? 14 : 0 }}>
                <div
                  onClick={() => setForm(f => ({ ...f, addToStaff:!f.addToStaff }))}
                  style={{ width:38, height:22, borderRadius:11, background: form.addToStaff ? 'var(--accent)' : 'var(--bg-deep)', border:'1px solid var(--border)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}
                >
                  <div style={{ position:'absolute', top:2, left: form.addToStaff ? 18 : 2, width:16, height:16, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }}/>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Also add to Staff records</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>Creates a Staff entry for salary tracking</div>
                </div>
              </label>
              {form.addToStaff && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, paddingTop:4 }}>
                  <Select
                    label="Department"
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department:e.target.value }))}
                    options={DEPARTMENTS.map(d => ({ value:d, label:d.charAt(0).toUpperCase() + d.slice(1) }))}
                  />
                  <Input label="Base Salary (₹/month)" type="number" value={form.baseSalary} onChange={e => setForm(f => ({ ...f, baseSalary:e.target.value }))} placeholder="0"/>
                </div>
              )}
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <Btn variant="secondary" onClick={() => { setShowAdd(false); setForm(initForm); }}>Cancel</Btn>
              <Btn type="submit" disabled={saving}>{saving ? '⏳ Creating…' : '+ Create User'}</Btn>
            </div>
          </form>
        </Modal>

        {/* ── Edit User Modal ── */}
        <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title={`Edit — ${editUser?.name}`}>
          {editUser && (
            <form onSubmit={handleEdit}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <Input label="Full Name" required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name:e.target.value }))}/>
                <Input label="Email" type="email" required value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email:e.target.value }))}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <Select
                  label="Role"
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role:e.target.value }))}
                  options={ROLES.map(r => ({ value:r, label:`${roleIcon[r]} ${r.charAt(0).toUpperCase() + r.slice(1)}` }))}
                  disabled={editUser._id === user?._id}
                />
                <Input label="Phone" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone:e.target.value }))}/>
              </div>
              <Input
                label="New Password (leave blank to keep current)"
                type="password"
                value={editForm.password}
                onChange={e => setEditForm(f => ({ ...f, password:e.target.value }))}
                placeholder="Leave blank to keep current"
                style={{ marginBottom:16 }}
              />
              {/* Active toggle */}
              {editUser._id !== user?._id && (
                <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginBottom:20, background:'var(--bg-elevated)', padding:'12px 14px', borderRadius:10, border:'1px solid var(--border)' }}>
                  <div
                    onClick={() => setEditForm(f => ({ ...f, isActive:!f.isActive }))}
                    style={{ width:38, height:22, borderRadius:11, background: editForm.isActive ? 'var(--green)' : 'var(--bg-deep)', border:'1px solid var(--border)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}
                  >
                    <div style={{ position:'absolute', top:2, left: editForm.isActive ? 18 : 2, width:16, height:16, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }}/>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>
                    {editForm.isActive ? '🟢 Account Active' : '🔴 Account Disabled'}
                  </span>
                </label>
              )}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
                <Btn variant="secondary" onClick={() => setEditUser(null)}>Cancel</Btn>
                <Btn type="submit" disabled={saving}>{saving ? '⏳ Saving…' : 'Save Changes'}</Btn>
              </div>
            </form>
          )}
        </Modal>

        {/* ── Delete confirmation ── */}
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User">
          <div style={{ textAlign:'center', padding:'8px 0 20px' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Delete "{deleteTarget?.name}"?</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>
              This removes their login access permanently. Their records (deliveries, expenses etc.) are kept.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <Btn variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
              <Btn variant="danger" disabled={saving} onClick={handleDelete}>{saving ? '⏳…' : 'Yes, Delete'}</Btn>
            </div>
          </div>
        </Modal>
      </Page>
    </Layout>
  );
}
