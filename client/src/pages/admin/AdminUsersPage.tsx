import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, UserCheck, UserX, Users } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { adminUsersApi } from '../../services/admin.api';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'client' | 'admin' | 'superadmin';
  isActive: boolean;
  authProvider?: string;
  createdAt: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  client:     { label: 'Client',      bg: '#f3f4f6',              color: '#4b5563' },
  admin:      { label: 'Admin',       bg: 'rgba(0,154,68,0.1)',   color: '#009A44' },
  superadmin: { label: 'Super Admin', bg: '#ede9fe',              color: '#7c3aed' },
};

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Confirm dialogs
  const [confirmToggle, setConfirmToggle] = useState<User | null>(null);
  const [confirmRole, setConfirmRole] = useState<{ user: User; newRole: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminUsersApi.getList({ page, search: search || undefined, role: roleFilter || undefined });
      setUsers(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter]);

  const handleToggleStatus = async () => {
    if (!confirmToggle) return;
    setActionLoading(true);
    try {
      await adminUsersApi.updateStatus(confirmToggle._id, !confirmToggle.isActive);
      toast.success(confirmToggle.isActive ? 'Compte suspendu' : 'Compte réactivé');
      setConfirmToggle(null);
      fetchUsers();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!confirmRole) return;
    setActionLoading(true);
    try {
      await adminUsersApi.updateRole(confirmRole.user._id, confirmRole.newRole);
      toast.success('Rôle mis à jour');
      setConfirmRole(null);
      fetchUsers();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Admin — Clients | Sunu Shop</title></Helmet>
      <AdminLayout title="Clients">
        <AdminPageHeader
          title="Clients & Utilisateurs"
          subtitle={total > 0 ? `${total} utilisateur${total > 1 ? 's' : ''} enregistré${total > 1 ? 's' : ''}` : undefined}
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Clients' }]}
        />

        <div className="flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1" style={{ maxWidth: 320 }}>
              <Search size={15} className="absolute text-gray-400" style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full border border-gray-200 rounded-lg text-sm py-2 pr-3 focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                style={{ paddingLeft: 34 }}
                placeholder="Nom, email..."
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg text-sm py-2 px-3 bg-white focus:outline-none"
            >
              <option value="">Tous les rôles</option>
              <option value="client">Client</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-4 flex flex-col gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="rounded-full bg-gray-200 shrink-0" style={{ width: 36, height: 36 }} />
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded h-3 w-1/3 mb-1.5" />
                      <div className="bg-gray-200 rounded h-3 w-1/2" />
                    </div>
                    <div className="bg-gray-200 rounded h-6 w-16" />
                    <div className="bg-gray-200 rounded h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <AdminEmptyState
                icon={Users}
                title="Aucun utilisateur trouvé"
                description={search || roleFilter ? 'Essayez de modifier les filtres.' : 'Aucun compte enregistré pour l\'instant.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Inscription</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const roleCfg = ROLE_LABELS[u.role] || ROLE_LABELS.client;
                      return (
                        <tr key={u._id} className="hover:bg-gray-50 transition-colors border-t">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                                style={{ width: 36, height: 36, backgroundColor: 'rgba(0,154,68,0.1)', color: '#009A44' }}
                              >
                                {u.firstName?.[0]}{u.lastName?.[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 mb-0">{u.firstName} {u.lastName}</p>
                                {u.authProvider && u.authProvider !== 'local' && (
                                  <span className="text-xs text-gray-400 capitalize">via {u.authProvider}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-600 mb-0">{u.email}</p>
                            {u.phone && <p className="text-xs text-gray-400 mb-0">{u.phone}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              onChange={e => setConfirmRole({ user: u, newRole: e.target.value })}
                              className="rounded-full font-medium border-0 cursor-pointer px-3 py-1"
                              style={{ backgroundColor: roleCfg.bg, color: roleCfg.color, fontSize: 12 }}
                            >
                              <option value="client">Client</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Super Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{
                                backgroundColor: u.isActive ? 'rgba(0,154,68,0.1)' : 'rgba(227,27,35,0.1)',
                                color: u.isActive ? '#007A35' : '#E31B23',
                              }}
                            >
                              {u.isActive ? 'Actif' : 'Suspendu'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setConfirmToggle(u)}
                              title={u.isActive ? 'Suspendre le compte' : 'Réactiver le compte'}
                              className="p-1.5 rounded-lg border-0 cursor-pointer transition-colors"
                              style={{
                                backgroundColor: u.isActive ? 'rgba(227,27,35,0.08)' : 'rgba(0,154,68,0.08)',
                                color: u.isActive ? '#E31B23' : '#009A44',
                              }}
                            >
                              {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 bg-white"
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 bg-white"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>

      {/* Confirm suspension/réactivation */}
      <AdminConfirmDialog
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={handleToggleStatus}
        loading={actionLoading}
        variant={confirmToggle?.isActive ? 'danger' : 'warning'}
        title={confirmToggle?.isActive ? 'Suspendre le compte ?' : 'Réactiver le compte ?'}
        message={
          confirmToggle?.isActive
            ? `Le compte de ${confirmToggle.firstName} ${confirmToggle.lastName} sera suspendu. L'utilisateur ne pourra plus se connecter.`
            : `Le compte de ${confirmToggle?.firstName} ${confirmToggle?.lastName} sera réactivé.`
        }
        confirmLabel={confirmToggle?.isActive ? 'Suspendre' : 'Réactiver'}
      />

      {/* Confirm changement de rôle */}
      <AdminConfirmDialog
        open={!!confirmRole}
        onClose={() => setConfirmRole(null)}
        onConfirm={handleChangeRole}
        loading={actionLoading}
        variant="warning"
        title="Changer le rôle ?"
        message={`Le rôle de ${confirmRole?.user.firstName} ${confirmRole?.user.lastName} passera à "${ROLE_LABELS[confirmRole?.newRole ?? '']?.label ?? confirmRole?.newRole}".`}
        confirmLabel="Confirmer"
      />
    </>
  );
}
