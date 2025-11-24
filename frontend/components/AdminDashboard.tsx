
import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Users, Flag, Activity, Settings, LogOut, 
  Search, Check, X, AlertCircle, ArrowLeft, ClipboardList,
  Database, Server, Wifi, Eye, Download, ShieldAlert, ToggleLeft, ToggleRight
} from 'lucide-react';
import { 
  fetchAdminData, subscribeToSystemStats, approveReport, removeReport, suspendUser, getLogs,
  AdminUser, AuditLog, ReportItem, SystemStat 
} from '../frontend/services/adminService';

interface AdminDashboardProps {
  onNavigate: (view: 'landing' | 'dashboard' | 'profile' | 'admin') => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(true);

  // State for Data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<SystemStat>({ cpu: 0, latency: 0, queries: 0, uptime: 99.9 });

  // Charts History
  const [cpuHistory, setCpuHistory] = useState<number[]>(new Array(20).fill(5));
  const [latencyHistory, setLatencyHistory] = useState<number[]>(new Array(20).fill(10));
  const [queryHistory, setQueryHistory] = useState<number[]>(new Array(20).fill(20));

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');
  
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('All');

  // Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [systemLockdown, setSystemLockdown] = useState(false);

  // Modal & Toast State
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Initial Fetch
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchAdminData();
      setUsers(data.users);
      setLogs(data.logs);
      setReports(data.reports);
      setStats(data.stats);
      setLoading(false);
    };
    loadData();
  }, []);

  // Real-time System Stats Subscription
  useEffect(() => {
    const unsubscribe = subscribeToSystemStats((newStats) => {
      setStats(newStats);
      setCpuHistory(prev => [...prev.slice(1), newStats.cpu]);
      setLatencyHistory(prev => [...prev.slice(1), newStats.latency]);
      setQueryHistory(prev => [...prev.slice(1), Math.min(newStats.queries, 200)]); 
    });
    return () => unsubscribe();
  }, []);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Actions
  const handleApproveReport = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReports(approveReport(id));
    const data = getLogs();
    setLogs(data);
    setSelectedReport(null);
    showToast('Report approved successfully.');
  };

  const handleRemoveReport = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReports(removeReport(id));
    const data = getLogs();
    setLogs(data);
    setSelectedReport(null);
    showToast('Content removed.', 'success');
  };

  const handleSuspendUser = (id: number) => {
    setUsers(suspendUser(id));
    const data = getLogs();
    setLogs(data);
    showToast('User status updated.');
  };

  const handleExportData = () => {
      showToast('Exporting system logs to CSV...', 'info');
  };

  const handleEditUser = (name: string) => {
      showToast(`Edit form for ${name} coming soon.`, 'info');
  };

  // Filtering Logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'All' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'All' || u.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                          l.admin.toLowerCase().includes(logSearch.toLowerCase()) ||
                          l.reason.toLowerCase().includes(logSearch.toLowerCase());
    const matchesAction = logActionFilter === 'All' || l.action === logActionFilter;
    return matchesSearch && matchesAction;
  });

  const uniqueLogActions = ['All', ...Array.from(new Set(logs.map(l => l.action)))];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505] text-white" role="status">
        <span className="sr-only">Loading Admin Panel...</span>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00C2FF]"></div>
      </div>
    );
  }

  // --- Render Helpers for Views ---

  const renderDashboardView = () => (
      <div className="animate-fade-in">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Total Users', val: users.length.toLocaleString(), change: '+2.5%', color: 'text-green-400', bg: 'bg-blue-500/5' },
            { title: 'Reported Items', val: reports.length.toString(), change: reports.length > 5 ? '+12%' : '-5%', color: reports.length > 5 ? 'text-red-400' : 'text-green-400', bg: 'bg-yellow-500/5' },
            { title: 'Pending Approvals', val: '15', change: '-0.5%', color: 'text-orange-400', bg: 'bg-orange-500/5' },
            { title: 'System Uptime', val: `${stats.uptime}%`, change: '+0.01%', color: 'text-green-400', bg: 'bg-green-500/5' },
          ].map((stat, i) => (
            <div key={i} className={`bg-[#0B0E14] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors ${stat.bg}`}>
              <h3 className="text-sm text-gray-400 font-medium mb-2">{stat.title}</h3>
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-bold text-white">{stat.val}</span>
                <span className={`text-xs font-bold py-0.5 px-1.5 rounded bg-white/5 ${stat.color}`}>{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Live System Monitor</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CPU */}
                <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden min-h-[160px]">
                    <div className="z-10 flex justify-between items-start">
                        <div>
                             <p className="text-xs text-gray-400 mb-1 flex items-center"><Server className="w-3 h-3 mr-1" /> CPU Load</p>
                             <p className={`text-2xl font-bold ${stats.cpu > 80 ? 'text-red-400' : 'text-[#00C2FF]'}`}>{stats.cpu}%</p>
                        </div>
                    </div>
                    <div className="w-full h-16 flex items-end space-x-1 z-10 mt-4">
                        {cpuHistory.map((h, i) => (
                            <div key={i} className={`flex-1 rounded-t-sm transition-all duration-300 ${h > 80 ? 'bg-red-500/60' : 'bg-[#00C2FF]/40'}`} style={{height: `${Math.min(h, 100)}%`}}></div>
                        ))}
                    </div>
                </div>

                {/* Latency */}
                <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden min-h-[160px]">
                    <div className="z-10">
                        <p className="text-xs text-gray-400 mb-1 flex items-center"><Wifi className="w-3 h-3 mr-1" /> API Latency</p>
                        <p className={`text-2xl font-bold ${stats.latency > 100 ? 'text-orange-400' : 'text-green-400'}`}>{stats.latency}ms</p>
                    </div>
                    <div className="w-full h-16 flex items-end space-x-1 z-10 mt-4">
                        {latencyHistory.map((h, i) => (
                            <div key={i} className={`flex-1 rounded-t-sm transition-all duration-300 ${h > 100 ? 'bg-orange-500/60' : 'bg-green-500/40'}`} style={{height: `${Math.min((h/150)*100, 100)}%`}}></div>
                        ))}
                    </div>
                </div>

                {/* Queries */}
                <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden min-h-[160px]">
                    <div className="z-10">
                        <p className="text-xs text-gray-400 mb-1 flex items-center"><Database className="w-3 h-3 mr-1" /> Database Queries</p>
                        <p className="text-2xl font-bold text-teal-400">{stats.queries}/sec</p>
                    </div>
                    <div className="w-full h-16 flex items-end space-x-1 z-10 mt-4">
                        {queryHistory.map((h, i) => (
                            <div key={i} className="flex-1 bg-teal-500/40 rounded-t-sm transition-all duration-300" style={{height: `${Math.min((h / 200) * 100, 100)}%`}}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-[#0B0E14] border border-white/5 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-bold">Recent Audit Logs</h3>
                      <button onClick={() => setActiveTab('Audit Logs')} className="text-xs text-[#00C2FF] hover:underline focus:outline-none focus:ring-2 focus:ring-[#00C2FF] rounded">View All</button>
                  </div>
                  <div className="p-4">
                      {logs.slice(0, 5).map(log => (
                          <div key={log.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                              <div>
                                  <p className="text-sm text-gray-300">{log.action}</p>
                                  <p className="text-xs text-gray-500">{log.time}</p>
                              </div>
                              <span className={`px-2 py-0.5 text-[10px] rounded border ${log.badge}`}>
                                  {log.admin}
                              </span>
                          </div>
                      ))}
                  </div>
             </div>

             <div className="bg-[#0B0E14] border border-white/5 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-bold">Pending Reports</h3>
                      <button onClick={() => setActiveTab('Content Moderation')} className="text-xs text-[#00C2FF] hover:underline focus:outline-none focus:ring-2 focus:ring-[#00C2FF] rounded">View All</button>
                  </div>
                  <div className="p-4">
                      {reports.length === 0 ? <div className="text-gray-500 text-sm">No pending reports.</div> : (
                          reports.slice(0, 3).map(rep => (
                              <div key={rep.id} className="mb-3 last:mb-0 bg-[#161B26] p-3 rounded-lg border border-white/5">
                                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                                      <span>{rep.type}</span>
                                      <span>{rep.time}</span>
                                  </div>
                                  <p className="text-sm text-white truncate">"{rep.text}"</p>
                              </div>
                          ))
                      )}
                  </div>
             </div>
        </div>
      </div>
  );

  const renderUserManagementView = () => (
      <div className="bg-[#0B0E14] border border-white/5 rounded-xl overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-white/5 flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between">
            <h2 className="text-lg font-bold text-white">User Accounts</h2>
            
            <div className="flex flex-wrap items-center gap-2">
                <select 
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="bg-[#161B26] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-gray-300 focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF]"
                    aria-label="Filter by Role"
                >
                    <option value="All">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Moderator">Moderator</option>
                    <option value="User">User</option>
                </select>

                <select 
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="bg-[#161B26] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-gray-300 focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF]"
                    aria-label="Filter by Status"
                >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                </select>

                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="bg-[#161B26] border border-white/10 rounded-lg py-1.5 pl-7 pr-3 text-xs text-white focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] w-40"
                        aria-label="Search users"
                    />
                </div>
            </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
                <thead className="bg-[#161B26]">
                    <tr className="text-gray-400 border-b border-white/5">
                        <th scope="col" className="p-4 font-medium">User</th>
                        <th scope="col" className="p-4 font-medium">Email</th>
                        <th scope="col" className="p-4 font-medium">Role</th>
                        <th scope="col" className="p-4 font-medium">Status</th>
                        <th scope="col" className="p-4 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.length > 0 ? filteredUsers.map(user => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 flex items-center">
                                <div className={`w-8 h-8 rounded-full ${user.avatar} flex items-center justify-center mr-3 text-xs font-bold text-white`}>
                                    {user.name.charAt(0)}
                                </div>
                                {user.name}
                            </td>
                            <td className="p-4 text-gray-400">{user.email}</td>
                            <td className="p-4 text-gray-300">{user.role}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    user.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                    {user.status}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={() => handleEditUser(user.name)}
                                        className="text-blue-400 hover:text-blue-300 text-xs font-medium focus:outline-none focus:underline"
                                        aria-label={`Edit user ${user.name}`}
                                    >
                                        Edit
                                    </button>
                                    <span className="text-gray-600" aria-hidden="true">|</span>
                                    <button 
                                      onClick={() => handleSuspendUser(user.id)}
                                      className="text-yellow-400 hover:text-yellow-300 text-xs font-medium focus:outline-none focus:underline"
                                      aria-label={`${user.status === 'Active' ? 'Suspend' : 'Activate'} user ${user.name}`}
                                    >
                                      {user.status === 'Active' ? 'Suspend' : 'Activate'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500 text-sm">No users found matching filters.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
  );

  const renderAuditLogView = () => (
    <div className="bg-[#0B0E14] border border-white/5 rounded-xl overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Audit Logs</h2>
            <div className="flex items-center space-x-2">
                    <select 
                    value={logActionFilter}
                    onChange={(e) => setLogActionFilter(e.target.value)}
                    className="bg-[#161B26] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-gray-300 focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF]"
                    aria-label="Filter logs by action"
                >
                    {uniqueLogActions.map(action => (
                        <option key={action} value={action}>{action === 'All' ? 'All Actions' : action}</option>
                    ))}
                </select>
                <div className="relative w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search logs..." 
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="w-full bg-[#161B26] border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs text-gray-300 focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF]"
                        aria-label="Search logs"
                    />
                </div>
            </div>
        </div>
        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#161B26] z-10">
                    <tr className="text-gray-400 border-b border-white/5">
                        <th scope="col" className="p-4 font-medium">Timestamp</th>
                        <th scope="col" className="p-4 font-medium">Admin</th>
                        <th scope="col" className="p-4 font-medium">Action</th>
                        <th scope="col" className="p-4 font-medium">Target</th>
                        <th scope="col" className="p-4 font-medium">Reason / Detail</th>
                    </tr>
                </thead>
                <tbody className="text-gray-300">
                    {filteredLogs.length > 0 ? filteredLogs.map(log => (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors animate-fade-in">
                            <td className="p-4 font-mono text-gray-500">{log.time}</td>
                            <td className="p-4 font-medium">{log.admin}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded border text-[10px] uppercase font-bold tracking-wide ${log.badge}`}>
                                    {log.action}
                                </span>
                            </td>
                            <td className="p-4 text-gray-400">{log.target}</td>
                            <td className="p-4 text-gray-400">{log.reason}</td>
                        </tr>
                    )) : (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No logs found.</td></tr>
                    )}
                </tbody>
                </table>
        </div>
    </div>
  );

  const renderModerationView = () => (
      <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-6 h-fit animate-fade-in">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              Report Queue
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full" aria-label={`${reports.length} pending reports`}>{reports.length}</span>
          </h2>
          <div className="space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-2">
              {reports.length === 0 ? (
                  <div className="text-gray-500 text-sm italic text-center py-12 flex flex-col items-center">
                      <Check className="w-12 h-12 mb-4 text-green-500 opacity-50" />
                      No pending reports. Great job!
                  </div>
              ) : (
                  reports.map(item => (
                      <div 
                          key={item.id} 
                          onClick={() => setSelectedReport(item)}
                          className="bg-[#161B26] rounded-lg p-4 border border-white/5 hover:border-white/20 hover:bg-[#1E2330] transition-all cursor-pointer animate-scale-in group focus:outline-none focus:ring-2 focus:ring-[#00C2FF]"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedReport(item)}
                          role="button"
                          aria-label={`View report from ${item.reporter}`}
                      >
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-xs text-gray-500">By: <span className="text-gray-300">{item.reporter}</span></span>
                              <span className="text-xs text-gray-500">{item.time}</span>
                          </div>
                          <p className="text-sm text-white italic mb-2 line-clamp-2 group-hover:text-[#00C2FF] transition-colors">"{item.text}"</p>
                          <div className="flex items-center justify-between">
                              <div className="flex items-center mb-3">
                                  <AlertCircle className="w-3 h-3 text-red-400 mr-1" />
                                  <span className="text-xs text-red-400 font-medium">{item.reason}</span>
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1"><Eye className="w-3 h-3" /> View Details</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                              <button 
                                  onClick={(e) => handleApproveReport(item.id, e)}
                                  className="flex items-center justify-center px-3 py-2 bg-[#00C2FF]/10 hover:bg-[#00C2FF]/20 text-[#00C2FF] text-xs font-bold rounded transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-[#00C2FF]"
                                  aria-label="Approve report"
                              >
                                  <Check className="w-3 h-3 mr-1" /> Approve
                              </button>
                              <button 
                                  onClick={(e) => handleRemoveReport(item.id, e)}
                                  className="flex items-center justify-center px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                                  aria-label="Remove reported content"
                              >
                                  <X className="w-3 h-3 mr-1" /> Remove
                              </button>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
  );

  const renderSettingsView = () => (
      <div className="max-w-3xl bg-[#0B0E14] border border-white/5 rounded-xl p-8 animate-fade-in">
          <h2 className="text-xl font-bold text-white mb-6">System Settings</h2>
          
          <div className="space-y-8">
              {/* Maintenance */}
              <div className="flex items-center justify-between p-4 bg-[#161B26] rounded-lg border border-white/5">
                  <div>
                      <h3 className="text-white font-medium mb-1">Maintenance Mode</h3>
                      <p className="text-gray-400 text-sm">Prevents non-admin users from accessing the platform.</p>
                  </div>
                  <button 
                    onClick={() => {
                        if (window.confirm(`Are you sure you want to ${maintenanceMode ? 'disable' : 'enable'} Maintenance Mode?`)) {
                            setMaintenanceMode(!maintenanceMode);
                            showToast(maintenanceMode ? 'Maintenance mode disabled' : 'Maintenance mode enabled', 'info');
                        }
                    }}
                    className={`transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C2FF] rounded-full ${maintenanceMode ? 'text-[#00C2FF]' : 'text-gray-500'}`}
                    aria-pressed={maintenanceMode}
                    aria-label="Toggle Maintenance Mode"
                  >
                      {maintenanceMode ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                  </button>
              </div>

              {/* Lockdown */}
              <div className="flex items-center justify-between p-4 bg-[#161B26] rounded-lg border border-white/5">
                  <div>
                      <h3 className="text-white font-medium mb-1">System Lockdown</h3>
                      <p className="text-gray-400 text-sm">Disables all write operations and sign-ups.</p>
                  </div>
                  <button 
                    onClick={() => {
                        if (window.confirm(`Are you sure you want to ${systemLockdown ? 'lift' : 'activate'} System Lockdown? This will affect all users.`)) {
                            setSystemLockdown(!systemLockdown);
                            showToast(systemLockdown ? 'System lockdown lifted' : 'System lockdown activated', 'error');
                        }
                    }}
                    className={`transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full ${systemLockdown ? 'text-red-500' : 'text-gray-500'}`}
                    aria-pressed={systemLockdown}
                    aria-label="Toggle System Lockdown"
                  >
                      {systemLockdown ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                  </button>
              </div>

              {/* Export */}
              <div>
                  <h3 className="text-white font-medium mb-4">Data Export</h3>
                  <button 
                    onClick={handleExportData}
                    className="flex items-center px-4 py-2 bg-[#1E2330] hover:bg-[#2a3040] border border-white/10 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#00C2FF]"
                  >
                      <Download className="w-4 h-4 mr-2" />
                      Export System Logs (CSV)
                  </button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans selection:bg-[#00C2FF] selection:text-black relative overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B0E14] border-r border-white/5 flex flex-col shrink-0 z-10">
        <div className="p-6 flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 rounded-lg bg-[#00C2FF]/10 flex items-center justify-center">
                <div className="w-4 h-4 bg-[#00C2FF] rotate-45"></div>
            </div>
            <span className="text-lg font-bold">MicroClimate</span>
            <span className="text-xs bg-[#1E2330] px-2 py-0.5 rounded text-gray-400">Admin</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4" aria-label="Admin Navigation">
            {/* BACK BUTTON ADDED */}
            <button
              onClick={() => onNavigate('landing')}
              className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors mb-4 border border-white/5 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              Back to App
            </button>

          {[
            { name: 'Dashboard', icon: LayoutGrid },
            { name: 'User Management', icon: Users },
            { name: 'Content Moderation', icon: Flag },
            { name: 'Audit Logs', icon: ClipboardList },
            { name: 'System Health', icon: Activity },
            { name: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#00C2FF] ${
                activeTab === item.name 
                  ? 'bg-[#003344] text-[#00C2FF] border border-[#00C2FF]/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              aria-current={activeTab === item.name ? 'page' : undefined}
            >
              <item.icon className={`w-5 h-5 mr-3 ${activeTab === item.name ? 'text-[#00C2FF]' : 'text-gray-500'}`} />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-0" role="main">
          <h1 className="text-2xl font-bold text-white mb-6">{activeTab}</h1>
          
          {activeTab === 'Dashboard' && renderDashboardView()}
          {activeTab === 'User Management' && renderUserManagementView()}
          {activeTab === 'Content Moderation' && renderModerationView()}
          {activeTab === 'Audit Logs' && renderAuditLogView()}
          {activeTab === 'System Health' && renderDashboardView()}
          {activeTab === 'Settings' && renderSettingsView()}

        {/* Report Details Modal */}
        {selectedReport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="bg-[#0B0E14] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-scale-in">
                    <button 
                        onClick={() => setSelectedReport(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#00C2FF] rounded"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center space-x-3 mb-6">
                         <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                             <AlertCircle className="w-6 h-6" />
                         </div>
                         <div>
                             <h3 id="modal-title" className="text-xl font-bold text-white">Report Details</h3>
                             <p className="text-sm text-gray-400">ID: #{selectedReport.id} • {selectedReport.type}</p>
                         </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="bg-[#161B26] p-4 rounded-lg border border-white/5">
                             <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Reported Content</p>
                             <p className="text-white italic text-lg">"{selectedReport.text}"</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="bg-[#161B26] p-3 rounded-lg">
                                 <p className="text-xs text-gray-500 mb-1">Reported By</p>
                                 <p className="text-sm text-white font-medium flex items-center"><Users className="w-3 h-3 mr-2 text-gray-400"/> {selectedReport.reporter}</p>
                             </div>
                             <div className="bg-[#161B26] p-3 rounded-lg">
                                 <p className="text-xs text-gray-500 mb-1">Reason</p>
                                 <p className="text-sm text-red-400 font-medium flex items-center"><AlertCircle className="w-3 h-3 mr-2"/> {selectedReport.reason}</p>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <button 
                            onClick={() => handleRemoveReport(selectedReport.id)}
                            className="py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                         >
                            Remove Content
                         </button>
                         <button 
                            onClick={() => handleApproveReport(selectedReport.id)}
                            className="py-3 bg-[#161B26] hover:bg-[#1E2330] border border-white/10 text-white font-bold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C2FF]"
                         >
                            Approve (Ignore)
                         </button>
                    </div>
                </div>
            </div>
        )}

        {/* Toast Notification */}
        {toast && (
             <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up" role="alert" aria-live="polite">
                 <div className={`px-6 py-3 rounded-full shadow-2xl border flex items-center space-x-3 ${
                     toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                     toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                     'bg-blue-500/10 border-blue-500/20 text-blue-400'
                 } backdrop-blur-md`}>
                     {toast.type === 'success' ? <Check className="w-4 h-4" /> : toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                     <span className="text-sm font-medium">{toast.message}</span>
                 </div>
             </div>
        )}

      </main>
    </div>
  );
};
