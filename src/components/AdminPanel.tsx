import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Database, RefreshCw, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import {
  ApiError,
  fetchAdminAssets,
  fetchAdminAudit,
  fetchAdminDeposits,
  fetchAdminOverview,
  fetchAdminTrades,
  fetchAdminUsers,
  reviewAdminDeposit,
  setAdminUserRole,
  setAdminUserStatus,
  type AdminAssetRow,
  type AdminAuditRow,
  type AdminDepositRow,
  type AdminOverview,
  type AdminTradeRow,
  type AdminUserRow
} from '../lib/api';

interface AdminPanelProps {
  theme: 'dark' | 'light';
  currentRole: string;
}

type AdminTab = 'overview' | 'users' | 'deposits' | 'trades' | 'assets' | 'audit';

const ADMIN_ROLES = ['USER', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'ASSET_ADMIN', 'SUPPORT_ADMIN'];

export default function AdminPanel({ theme, currentRole }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [trades, setTrades] = useState<AdminTradeRow[]>([]);
  const [assets, setAssets] = useState<AdminAssetRow[]>([]);
  const [audit, setAudit] = useState<AdminAuditRow[]>([]);
  const [deposits, setDeposits] = useState<AdminDepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const isDark = theme === 'dark';
  const canManageUsers = currentRole === 'SUPER_ADMIN';
  const canReviewDeposits = currentRole === 'SUPER_ADMIN' || currentRole === 'FINANCE_ADMIN';

  const cardClass = useMemo(
    () => isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200',
    [isDark]
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextOverview, nextUsers, nextTrades, nextAssets, nextAudit, nextDeposits] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminUsers(),
        fetchAdminTrades(),
        fetchAdminAssets(),
        fetchAdminAudit(),
        fetchAdminDeposits()
      ]);
      setOverview(nextOverview);
      setUsers(nextUsers);
      setTrades(nextTrades);
      setAssets(nextAssets);
      setAudit(nextAudit);
      setDeposits(nextDeposits);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (user: AdminUserRow) => {
    if (!canManageUsers) return;
    setBusyId(user.id);
    setError('');
    try {
      await setAdminUserStatus(user.id, !user.isActive);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update user status.');
    } finally {
      setBusyId('');
    }
  };

  const reviewDeposit = async (deposit: AdminDepositRow, status: 'APPROVED' | 'REJECTED') => {
    if (!canReviewDeposits || deposit.status !== 'PENDING') return;
    setBusyId(deposit.id);
    setError('');
    try {
      await reviewAdminDeposit(deposit.id, status);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not review deposit.');
    } finally {
      setBusyId('');
    }
  };

  const updateRole = async (user: AdminUserRow, role: string) => {
    if (!canManageUsers || role === user.role) return;
    setBusyId(user.id);
    setError('');
    try {
      await setAdminUserRole(user.id, role);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update user role.');
    } finally {
      setBusyId('');
    }
  };

  const nav: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'deposits', label: 'Deposits' },
    { id: 'trades', label: 'Trades' },
    { id: 'assets', label: 'Assets' },
    { id: 'audit', label: 'Audit Log' }
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-500 text-xs font-black uppercase tracking-widest">
            <ShieldCheck size={16} />
            RWA Administration
          </div>
          <h1 className="text-2xl md:text-3xl font-black mt-2">Operations Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1">Users, pending deposits, trades, assets and audited admin actions.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold ${cardClass}`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400">{error}</div>}

      <div className={`flex flex-wrap gap-1 rounded-2xl border p-1.5 ${cardClass}`}>
        {nav.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${tab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && !overview ? (
        <div className={`rounded-3xl border p-12 text-center text-sm text-slate-400 ${cardClass}`}>Loading admin data…</div>
      ) : null}

      {tab === 'overview' && overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Users', overview.totals.users, <Users size={17} />],
            ['Active Users', overview.totals.activeUsers, <Activity size={17} />],
            ['Trades', overview.totals.trades, <TrendingUp size={17} />],
            ['Assets', overview.totals.assets, <Database size={17} />],
            ['User Balances', `${overview.totals.userBalancesUsdt.toFixed(2)} USDT`, <Users size={17} />],
            ['Buy Volume', `${overview.totals.buyVolumeUsdt.toFixed(2)} USDT`, <TrendingUp size={17} />],
            ['Sell Volume', `${overview.totals.sellVolumeUsdt.toFixed(2)} USDT`, <TrendingUp size={17} />],
            ['Trading Fees', `${overview.totals.feesUsdt.toFixed(2)} USDT`, <ShieldCheck size={17} />]
          ].map(([label, value, icon]) => (
            <div key={String(label)} className={`rounded-3xl border p-5 ${cardClass}`}>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{label as string}</span><span className="text-blue-500">{icon as React.ReactNode}</span>
              </div>
              <p className="text-xl font-black mt-3">{value as React.ReactNode}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className={`rounded-3xl border overflow-hidden ${cardClass}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-400 border-b border-slate-800/60">
                <tr><th className="p-4 text-start">User</th><th className="p-4 text-start">Role</th><th className="p-4 text-end">Balance</th><th className="p-4 text-center">Status</th><th className="p-4 text-end">Created</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="p-4"><p className="font-bold">{user.name}</p><p className="text-[10px] text-slate-500 mt-1">{user.email}</p></td>
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={e => void updateRole(user, e.target.value)}
                        disabled={!canManageUsers || busyId === user.id}
                        className={`rounded-lg border px-2 py-1.5 text-[10px] ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}
                      >
                        {ADMIN_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </td>
                    <td className="p-4 text-end font-mono font-bold">{user.usdtBalance.toFixed(2)} USDT</td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => void updateStatus(user)}
                        disabled={!canManageUsers || busyId === user.id}
                        className={`rounded-full px-3 py-1 text-[10px] font-black ${user.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}
                      >
                        {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="p-4 text-end text-slate-500 font-mono text-[10px]">{new Date(user.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!canManageUsers && <p className="p-4 text-[10px] text-slate-500 border-t border-slate-800/40">Only SUPER_ADMIN can change roles or account status.</p>}
        </div>
      )}

      {tab === 'deposits' && (
        <div className={`rounded-3xl border overflow-hidden ${cardClass}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-400 border-b border-slate-800/60">
                <tr>
                  <th className="p-4 text-start">User</th>
                  <th className="p-4 text-start">Network / TxID</th>
                  <th className="p-4 text-end">Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {deposits.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No deposit requests yet.</td></tr>
                ) : deposits.map(deposit => (
                  <tr key={deposit.id}>
                    <td className="p-4"><p className="font-bold">{deposit.userName}</p><p className="text-[10px] text-slate-500 mt-1">{deposit.userEmail}</p></td>
                    <td className="p-4">
                      <p className="font-black text-blue-400">{deposit.network.toUpperCase()}</p>
                      <p className="text-[10px] font-mono text-slate-500 mt-1 break-all">{deposit.txid}</p>
                    </td>
                    <td className="p-4 text-end font-mono font-bold">{deposit.amountUsdt.toFixed(2)} USDT</td>
                    <td className="p-4 text-center">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black ${
                        deposit.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : deposit.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                      }`}>{deposit.status}</span>
                    </td>
                    <td className="p-4 text-end">
                      {deposit.status === 'PENDING' && canReviewDeposits ? (
                        <div className="inline-flex gap-2">
                          <button type="button" disabled={busyId === deposit.id} onClick={() => void reviewDeposit(deposit, 'APPROVED')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-black text-white">Approve</button>
                          <button type="button" disabled={busyId === deposit.id} onClick={() => void reviewDeposit(deposit, 'REJECTED')} className="rounded-lg bg-rose-600 px-3 py-1.5 text-[10px] font-black text-white">Reject</button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">{deposit.reviewedAt ? new Date(deposit.reviewedAt).toLocaleString() : '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!canReviewDeposits && <p className="p-4 text-[10px] text-slate-500 border-t border-slate-800/40">Only SUPER_ADMIN or FINANCE_ADMIN can approve deposits.</p>}
        </div>
      )}

      {tab === 'trades' && (
        <div className={`rounded-3xl border overflow-hidden ${cardClass}`}><div className="overflow-x-auto"><table className="w-full text-xs">
          <thead className="text-slate-400 border-b border-slate-800/60"><tr><th className="p-4 text-start">User</th><th className="p-4 text-start">Trade</th><th className="p-4 text-end">Shares</th><th className="p-4 text-end">Gross</th><th className="p-4 text-end">Fee</th><th className="p-4 text-end">Time</th></tr></thead>
          <tbody className="divide-y divide-slate-800/40">{trades.map(trade => <tr key={trade.id}><td className="p-4"><p className="font-bold">{trade.userName}</p><p className="text-[10px] text-slate-500">{trade.userEmail}</p></td><td className="p-4 font-bold"><span className={trade.type === 'BUY' ? 'text-emerald-400' : 'text-amber-400'}>{trade.type}</span> {trade.assetId}</td><td className="p-4 text-end font-mono">{trade.shares.toLocaleString()}</td><td className="p-4 text-end font-mono">{trade.grossUsdt.toFixed(2)}</td><td className="p-4 text-end font-mono">{trade.feeUsdt.toFixed(2)}</td><td className="p-4 text-end text-[10px] text-slate-500">{new Date(trade.createdAt).toLocaleString()}</td></tr>)}</tbody>
        </table></div></div>
      )}

      {tab === 'assets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{assets.map(asset => <div key={asset.id} className={`rounded-3xl border p-5 ${cardClass}`}><div className="flex items-start justify-between"><div><p className="text-blue-500 font-mono font-black">{asset.id}</p><p className="font-bold mt-1">{asset.enName}</p></div><span className={`text-xs font-black ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%</span></div><p className="text-lg font-black mt-5">{asset.price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} USDT</p><p className="text-[10px] text-slate-500 mt-2">Market update: {asset.marketUpdatedAt ? new Date(asset.marketUpdatedAt).toLocaleString() : 'Not available'}</p></div>)}</div>
      )}

      {tab === 'audit' && (
        <div className={`rounded-3xl border divide-y divide-slate-800/40 ${cardClass}`}>{audit.length ? audit.map(item => <div key={item.id} className="p-4"><div className="flex flex-col md:flex-row md:items-center justify-between gap-2"><div><p className="text-xs font-black text-blue-400">{item.action}</p><p className="text-xs mt-1">{item.description}</p></div><span className="text-[10px] font-mono text-slate-500">{new Date(item.createdAt).toLocaleString()}</span></div><p className="text-[9px] text-slate-600 mt-2">Admin: {item.adminUserId}{item.targetUserId ? ` • Target: ${item.targetUserId}` : ''}</p></div>) : <p className="p-8 text-center text-xs text-slate-500">No admin actions recorded yet.</p>}</div>
      )}
    </section>
  );
}
