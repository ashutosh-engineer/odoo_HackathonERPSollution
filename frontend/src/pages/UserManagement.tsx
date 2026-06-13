import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { odooSearchRead, odooCall } from '../utils/api';

interface UserData {
  id: number;
  name: string;
  login: string;
  shiv_role: string;
  is_active_shiv: boolean;
  locked_until: string | false;
}

export const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionError, setActionError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await odooSearchRead('res.users', [], [
        'name', 'login', 'shiv_role', 'is_active_shiv', 'locked_until'
      ]);
      setUsers(data as UserData[]);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (action: string, id: number) => {
    try {
      setActionError(null);
      await odooCall('res.users', action, [[id]]);
      await fetchUsers();
    } catch (err: any) {
      setActionError(`Action failed: ${err.message || err}`);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.login.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.shiv_role && user.shiv_role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-grow flex flex-col min-h-[calc(100vh-64px)] w-full">
      {actionError && (
        <div className="w-full px-lg mt-4">
          <div className="bg-error-container text-error px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {actionError}
          </div>
        </div>
      )}
      {/* Header Area */}
      <div className="flex justify-between items-center px-lg py-md bg-white border-b border-outline-variant">
        <h2 className="font-headline-sm text-headline-sm font-bold text-primary">User Permissions &amp; Access Control</h2>
        <div className="flex items-center gap-md">
          <div className="relative w-64 md:w-80 group">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              className="w-full pl-[36px] pr-sm py-xs bg-surface-container border border-outline-variant rounded-lg text-body-md font-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all group-hover:bg-surface-container-high" 
              placeholder="Search users or roles..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="bg-primary text-white px-md py-sm rounded-lg font-label-md text-label-md flex items-center gap-sm hover:opacity-90 active:opacity-80 transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            Add New User
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div className="p-lg flex-grow flex flex-col gap-lg bg-surface">
        {/* Main Data Table Container */}
        <div className="bg-white rounded-lg border border-outline-variant overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Name</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Role</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right sticky right-0 bg-surface-container-low shadow-[-4px_0_4px_rgba(0,0,0,0.02)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-on-surface-variant animate-pulse font-bold">Loading Users...</td></tr>
                ) : filteredUsers.map((user) => {
                  const suspended = !user.is_active_shiv || user.locked_until;
                  return (
                    <tr key={user.id} className={`hover:bg-primary/5 transition-colors group ${suspended ? 'bg-surface-container-low/30 opacity-70' : ''}`}>
                      <td className={`px-md py-md ${suspended ? 'text-on-surface-variant' : ''}`}>
                        <div className="flex items-center gap-sm">
                          <div className={`w-9 h-9 rounded-full overflow-hidden bg-surface-container border border-outline-variant flex items-center justify-center text-primary ${suspended ? 'grayscale' : ''}`}>
                            <span className="material-symbols-outlined">person</span>
                          </div>
                          <div>
                            <p className={`font-label-md text-label-md ${suspended ? '' : 'text-on-surface'}`}>{user.name}</p>
                            <p className={`font-body-sm text-body-sm ${suspended ? '' : 'text-on-surface-variant'}`}>{user.login}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-md py-md">
                        <span className={`inline-flex items-center px-sm py-[2px] rounded-full text-[11px] font-bold uppercase tracking-tighter border`}>
                          {user.shiv_role || 'No Role'}
                        </span>
                      </td>
                      <td className="px-md py-md">
                        <span className={`inline-flex items-center gap-xs px-sm py-[2px] rounded-full text-[11px] font-bold ${suspended ? 'bg-danger-brick/10 text-danger-brick' : 'bg-success-forest/10 text-success-forest'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${suspended ? 'bg-danger-brick' : 'bg-success-forest'}`}></span> 
                          {user.locked_until ? 'Locked' : (!user.is_active_shiv ? 'Deactivated' : 'Active')}
                        </span>
                      </td>
                      <td className="px-md py-md text-right sticky right-0 bg-white group-hover:bg-transparent shadow-[-4px_0_4px_rgba(0,0,0,0.02)]">
                        {suspended ? (
                          <div className="flex items-center justify-end gap-xs">
                            {user.locked_until ? (
                              <button onClick={() => handleAction('action_unlock_account', user.id)} className="px-sm py-xs text-primary font-label-md text-label-md hover:underline">Unlock</button>
                            ) : (
                              <button onClick={() => handleAction('action_reactivate_user', user.id)} className="px-sm py-xs text-primary font-label-md text-label-md hover:underline">Reactivate</button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-xs">
                            <button onClick={() => handleAction('action_force_password_reset', user.id)} className="p-xs hover:bg-warning-amber/10 text-on-surface-variant hover:text-warning-amber rounded transition-colors" title="Force Password Reset">
                              <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                            </button>
                            <button onClick={() => handleAction('action_deactivate_user', user.id)} className="p-xs hover:bg-danger-brick/10 text-on-surface-variant hover:text-danger-brick rounded transition-colors" title="Deactivate">
                              <span className="material-symbols-outlined text-[20px]">person_off</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
