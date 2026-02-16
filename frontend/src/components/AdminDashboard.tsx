import { useEffect, useState, useCallback } from 'react';
import { Users, CreditCard, Shield, Trash2, Check, X, Pencil, Plus, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminGetUsers, adminDeleteUser, adminUpdateCredits, adminUpdateEmail, adminUpdateCreditLimit } from '../utils/api';
import { toast } from './Toast';

interface AdminUser {
  id: number;
  email: string;
  credits_used: number;
  credit_limit: number;
  is_admin: number;
  created_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCredits, setEditingCredits] = useState<number | null>(null);
  const [editingEmail, setEditingEmail] = useState<number | null>(null);
  const [editingLimit, setEditingLimit] = useState<number | null>(null);
  const [creditValue, setCreditValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [limitValue, setLimitValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await adminGetUsers();
      setUsers(data.users);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleDelete(userId: number) {
    try {
      await adminDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setConfirmDelete(null);
      toast('User deleted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  }

  async function handleSaveCredits(userId: number) {
    const credits = parseInt(creditValue, 10);
    if (isNaN(credits) || credits < 0) {
      toast('Enter a valid number', 'error');
      return;
    }
    try {
      await adminUpdateCredits(userId, credits);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits_used: credits } : u));
      setEditingCredits(null);
      toast('Credits updated', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  async function handleSaveEmail(userId: number) {
    if (!emailValue.trim()) {
      toast('Enter a valid email', 'error');
      return;
    }
    try {
      await adminUpdateEmail(userId, emailValue.trim());
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, email: emailValue.trim() } : u));
      setEditingEmail(null);
      toast('Email updated', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  async function handleSaveLimit(userId: number) {
    const limit = parseInt(limitValue, 10);
    if (isNaN(limit) || limit < 0) {
      toast('Enter a valid number', 'error');
      return;
    }
    try {
      await adminUpdateCreditLimit(userId, limit);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, credit_limit: limit } : u));
      setEditingLimit(null);
      toast('Credit limit updated', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  async function handleQuickAdjustLimit(userId: number, currentLimit: number, delta: number) {
    const newLimit = Math.max(0, currentLimit + delta);
    try {
      await adminUpdateCreditLimit(userId, newLimit);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, credit_limit: newLimit } : u));
      toast(`Credit limit set to ${newLimit}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  const totalUsers = users.length;
  const totalCredits = users.reduce((sum, u) => sum + (u.credits_used || 0), 0);
  const adminCount = users.filter(u => u.is_admin).length;

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-navy-900 border border-navy-700 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-navy-700 rounded w-24 mb-3" />
              <div className="h-8 bg-navy-700 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-6 animate-pulse">
          <div className="h-4 bg-navy-700 rounded w-32 mb-4" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-navy-700 rounded mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users size={18} className="text-teal-400" />
            <span className="text-sm text-slate-400">Total Users</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalUsers}</p>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard size={18} className="text-teal-400" />
            <span className="text-sm text-slate-400">Total Credits Used</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalCredits}</p>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={18} className="text-teal-400" />
            <span className="text-sm text-slate-400">Admin Accounts</span>
          </div>
          <p className="text-3xl font-bold text-white">{adminCount}</p>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-navy-700">
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase">ID</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase">Email</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase">Credits Used</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase">Credit Limit</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase">Role</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase">Created</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-navy-700/50 hover:bg-navy-800/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-300">{u.id}</td>

                  {/* Email Cell */}
                  <td className="px-4 py-3 text-sm">
                    {editingEmail === u.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="email"
                          value={emailValue}
                          onChange={e => setEmailValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveEmail(u.id)}
                          className="bg-navy-800 border border-navy-600 rounded px-2 py-1 text-sm text-white w-48 focus:outline-none focus:border-teal-400"
                          autoFocus
                        />
                        <button onClick={() => handleSaveEmail(u.id)} className="text-teal-400 hover:text-teal-300 cursor-pointer p-1">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingEmail(null)} className="text-slate-400 hover:text-slate-300 cursor-pointer p-1">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 group">
                        <span className="text-slate-300">{u.email}</span>
                        <button
                          onClick={() => { setEditingEmail(u.id); setEmailValue(u.email); }}
                          className="text-slate-500 hover:text-teal-400 cursor-pointer p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Credits Used Cell */}
                  <td className="px-4 py-3 text-sm">
                    {u.is_admin ? (
                      <span className="text-slate-600">&mdash;</span>
                    ) : editingCredits === u.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={creditValue}
                          onChange={e => setCreditValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveCredits(u.id)}
                          className="bg-navy-800 border border-navy-600 rounded px-2 py-1 text-sm text-white w-20 focus:outline-none focus:border-teal-400"
                          min={0}
                          autoFocus
                        />
                        <button onClick={() => handleSaveCredits(u.id)} className="text-teal-400 hover:text-teal-300 cursor-pointer p-1">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingCredits(null)} className="text-slate-400 hover:text-slate-300 cursor-pointer p-1">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 group">
                        <span className={`${(u.credits_used || 0) >= (u.credit_limit || 5) ? 'text-red-400' : 'text-slate-300'}`}>
                          {u.credits_used || 0}
                        </span>
                        <button
                          onClick={() => { setEditingCredits(u.id); setCreditValue(String(u.credits_used || 0)); }}
                          className="text-slate-500 hover:text-teal-400 cursor-pointer p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Credit Limit Cell */}
                  <td className="px-4 py-3 text-sm">
                    {u.is_admin ? (
                      <span className="text-slate-600">&mdash;</span>
                    ) : editingLimit === u.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={limitValue}
                          onChange={e => setLimitValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveLimit(u.id)}
                          className="bg-navy-800 border border-navy-600 rounded px-2 py-1 text-sm text-white w-20 focus:outline-none focus:border-teal-400"
                          min={0}
                          autoFocus
                        />
                        <button onClick={() => handleSaveLimit(u.id)} className="text-teal-400 hover:text-teal-300 cursor-pointer p-1">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingLimit(null)} className="text-slate-400 hover:text-slate-300 cursor-pointer p-1">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 group">
                        <button
                          onClick={() => handleQuickAdjustLimit(u.id, u.credit_limit || 5, -1)}
                          className="text-slate-500 hover:text-red-400 cursor-pointer p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Decrease limit"
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          onClick={() => { setEditingLimit(u.id); setLimitValue(String(u.credit_limit || 5)); }}
                          className="text-teal-400 font-medium hover:underline cursor-pointer min-w-[1.5rem] text-center"
                        >
                          {u.credit_limit ?? 5}
                        </button>
                        <button
                          onClick={() => handleQuickAdjustLimit(u.id, u.credit_limit || 5, 5)}
                          className="text-slate-500 hover:text-teal-400 cursor-pointer p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Increase limit by 5"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3 text-sm">
                    {u.is_admin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-400/10 text-teal-400 rounded-full text-xs font-medium">
                        <Shield size={10} /> Admin
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">User</span>
                    )}
                  </td>

                  {/* Created At */}
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-sm">
                    {u.id === user?.id ? (
                      <span className="text-xs text-slate-500">You</span>
                    ) : confirmDelete === u.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-400 mr-1">Delete?</span>
                        <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300 cursor-pointer p-1">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="text-slate-400 hover:text-slate-300 cursor-pointer p-1">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(u.id)}
                        className="text-slate-500 hover:text-red-400 cursor-pointer p-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
