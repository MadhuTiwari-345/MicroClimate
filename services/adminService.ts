
// Simulated Admin Data Service

export interface SystemStat {
  cpu: number;
  latency: number;
  queries: number;
  uptime: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Moderator' | 'User';
  status: 'Active' | 'Suspended';
  avatar: string;
}

export interface AuditLog {
  id: number;
  time: string;
  admin: string;
  action: string;
  target: string;
  reason: string;
  badge: string;
}

export interface ReportItem {
  id: number;
  reporter: string;
  time: string;
  text: string;
  reason: string;
  type: 'Comment' | 'Post';
}

// Mock Initial Data
let users: AdminUser[] = [
  { id: 1, name: 'Alex Doe', email: 'alex.doe@example.com', role: 'Moderator', status: 'Active', avatar: 'bg-blue-500' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'User', status: 'Active', avatar: 'bg-purple-500' },
  { id: 3, name: 'Sam Wilson', email: 'sam.wilson@example.com', role: 'User', status: 'Suspended', avatar: 'bg-yellow-500' },
  { id: 4, name: 'Chris Evans', email: 'chris.evans@example.com', role: 'Admin', status: 'Active', avatar: 'bg-green-500' },
  { id: 5, name: 'Pat Taylor', email: 'pat.taylor@example.com', role: 'User', status: 'Active', avatar: 'bg-pink-500' },
];

let logs: AuditLog[] = [
  { id: 1, time: new Date().toISOString().slice(0, 19).replace('T', ' '), admin: 'AdminUser', action: 'User Deleted', target: 'john_doe_123', reason: 'Violation of ToS', badge: 'bg-red-500/20 text-red-400 border-red-500/50' },
  { id: 2, time: new Date(Date.now() - 3600000).toISOString().slice(0, 19).replace('T', ' '), admin: 'Alex Doe', action: 'User Suspended', target: 'sam.wilson@ex...', reason: 'Duration: 7 days', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
  { id: 3, time: new Date(Date.now() - 7200000).toISOString().slice(0, 19).replace('T', ' '), admin: 'AdminUser', action: 'Comment Hidden', target: 'Comment ID: #84321', reason: 'Spam content', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
];

let reports: ReportItem[] = [
  { id: 101, reporter: 'user_alpha', time: '2 hours ago', text: '"This data visualization is completely inaccurate."', reason: 'Spam', type: 'Comment' },
  { id: 102, reporter: 'user_beta', time: '5 hours ago', text: '"Check out this amazing offer at..."', reason: 'Misleading', type: 'Post' },
];

// Simulate Fetching Data
export const fetchAdminData = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    users: [...users],
    logs: [...logs],
    reports: [...reports],
    stats: {
      cpu: Math.floor(Math.random() * 30) + 10, // 10-40%
      latency: Math.floor(Math.random() * 40) + 20, // 20-60ms
      queries: Math.floor(Math.random() * 100) + 50, // 50-150
      uptime: 99.98
    }
  };
};

// Simulate Real-time System Updates
export const subscribeToSystemStats = (callback: (stats: SystemStat) => void) => {
  const interval = setInterval(() => {
    const newStats = {
      cpu: Math.floor(Math.random() * 40) + 10,
      latency: Math.floor(Math.random() * 50) + 20,
      queries: Math.floor(Math.random() * 150) + 50,
      uptime: 99.99
    };
    callback(newStats);
  }, 2000); // Update every 2 seconds

  return () => clearInterval(interval);
};

// Simulate Action: Approve Report
export const approveReport = (id: number) => {
  reports = reports.filter(r => r.id !== id);
  addLog('Admin', 'Report Approved', `ID: #${id}`, 'Content Safe', 'bg-green-500/20 text-green-400 border-green-500/50');
  return [...reports];
};

// Simulate Action: Remove Report
export const removeReport = (id: number) => {
  reports = reports.filter(r => r.id !== id);
  addLog('Admin', 'Content Removed', `ID: #${id}`, 'Violation', 'bg-red-500/20 text-red-400 border-red-500/50');
  return [...reports];
};

// Simulate Action: Suspend User
export const suspendUser = (id: number) => {
  users = users.map(u => u.id === id ? { ...u, status: 'Suspended' } : u);
  const user = users.find(u => u.id === id);
  if (user) {
    addLog('Admin', 'User Suspended', user.email, 'Manual Action', 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50');
  }
  return [...users];
};

// Helper to add logs
const addLog = (admin: string, action: string, target: string, reason: string, badge: string) => {
  const newLog: AuditLog = {
    id: Date.now(),
    time: new Date().toISOString().slice(0, 19).replace('T', ' '),
    admin,
    action,
    target,
    reason,
    badge
  };
  logs = [newLog, ...logs];
};

export const getLogs = () => [...logs];
