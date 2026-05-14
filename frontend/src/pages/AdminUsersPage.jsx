import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
    Users,
    Search,
    Filter,
    ShieldAlert,
    ShieldCheck,
    MoreVertical,
    Mail,
    Phone,
    Calendar,
    ArrowLeft,
    ChevronRight,
    Ban,
    UserCheck,
    AlertCircle,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../layouts/DashboardLayout';
import { getAllUsers, toggleUserBan } from '../api/stationApi';
import { selectToken } from '../features/auth/authSelectors';
import { useNavigate } from 'react-router-dom';

const AdminUsersPage = () => {
    const token = useSelector(selectToken);
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await getAllUsers(token);
            setUsers(response.data?.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBan = async (user) => {
        const action = user.isBanned ? 'unban' : 'ban';
        let reason = '';

        if (action === 'ban') {
            reason = window.prompt('Enter reason for banning this user:', 'Violating terms of service');
            if (reason === null) return; // User cancelled prompt
        } else {
            if (!window.confirm(`Are you sure you want to unban ${user.name || user.email}?`)) return;
        }

        setProcessingId(user._id);
        try {
            const response = await toggleUserBan(user._id, reason, token);
            if (response.data.success) {
                toast.success(`User ${action === 'ban' ? 'banned' : 'unbanned'} successfully`);
                // Update local state
                setUsers(users.map(u => u._id === user._id ? response.data.user : u));
            }
        } catch (error) {
            console.error(`Error ${action}ning user:`, error);
            toast.error(`Failed to ${action} user`);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch =
                (user.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.mobile?.includes(searchTerm));

            const matchesRole = filterRole === 'All' || user.role === filterRole;
            const matchesStatus = filterStatus === 'All' ||
                (filterStatus === 'Banned' ? user.isBanned : !user.isBanned);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, filterRole, filterStatus]);

    const stats = useMemo(() => {
        return {
            total: users.length,
            banned: users.filter(u => u.isBanned).length,
            admins: users.filter(u => u.role === 'admin').length,
            owners: users.filter(u => u.role === 'station_owner').length,
        };
    }, [users]);

    return (
  
            <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">

                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Users Management</h1>
                        <p className="text-sm text-slate-500 font-medium">Manage user accounts, roles, and access status</p>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Total Users" value={stats.total} icon={<Users size={16} />} color="blue" />
                <StatBox label="Banned" value={stats.banned} icon={<Ban size={16} />} color="red" />
                <StatBox label="Admins" value={stats.admins} icon={<ShieldCheck size={16} />} color="indigo" />
                <StatBox label="Station Owners" value={stats.owners} icon={<UserCheck size={16} />} color="emerald" />
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email or mobile..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative min-w-[140px]">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 appearance-none outline-none focus:ring-2 focus:ring-emerald-500/20"
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                        >
                            <option value="All">All Roles</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="station_owner">Host</option>
                            <option value="operator">Operator</option>
                        </select>
                    </div>
                    <div className="relative min-w-[140px]">
                        <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 appearance-none outline-none focus:ring-2 focus:ring-emerald-500/20"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Banned">Banned</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table/Grid */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cancellations</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 size={32} className="text-emerald-500 animate-spin" />
                                            <p className="text-sm font-bold text-slate-400">Fetching user network...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <p className="text-sm font-bold text-slate-400">No users found matching your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-black text-slate-400">
                                                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-800 truncate">{user.name || 'Anonymous User'}</p>
                                                    <p className="text-[10px] font-medium text-slate-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Mail size={12} />
                                                    <span className="text-[11px] font-bold">{user.email || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Phone size={12} />
                                                    <span className="text-[11px] font-bold">{user.mobile || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getRoleStyles(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-sm font-black ${user.cancellationCount >= 2 ? 'text-red-500' : 'text-slate-800'}`}>
                                                    {user.cancellationCount || 0}
                                                </span>
                                                {user.cancellationCount >= 2 && <span className="text-[8px] font-bold text-red-400 uppercase">Warning</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isBanned ? (
                                                <div className="flex flex-col">
                                                    <span className="flex items-center gap-1 text-red-500 font-black text-[10px] uppercase tracking-widest">
                                                        <ShieldAlert size={10} /> Banned
                                                    </span>
                                                    <span className="text-[8px] text-slate-400 font-medium mt-0.5 max-w-[120px] truncate" title={user.banReason}>
                                                        {user.banReason}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="flex items-center gap-1 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                                                    <ShieldCheck size={10} /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleBan(user)}
                                                    disabled={processingId === user._id}
                                                    className={`p-2 rounded-xl transition-all ${user.isBanned
                                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        }`}
                                                    title={user.isBanned ? 'Unban User' : 'Ban User'}
                                                >
                                                    {processingId === user._id ? (
                                                        <Loader2 size={18} className="animate-spin" />
                                                    ) : user.isBanned ? (
                                                        <UserCheck size={18} />
                                                    ) : (
                                                        <Ban size={18} />
                                                    )}
                                                </button>
                                                <button className="p-2 text-slate-300 hover:text-slate-600 transition-all">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <AlertCircle size={14} />
                    <span>Note: Users with 5+ cancellations are automatically banned by the system.</span>
                </div>
            </div>
      
    );
};

const StatBox = ({ label, value, icon, color }) => {
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-500 border-blue-100',
        red: 'bg-red-50 text-red-500 border-red-100',
        indigo: 'bg-indigo-50 text-indigo-500 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-500 border-emerald-100',
    };

    return (
        <div className={`bg-white p-4 rounded-2xl border ${colorStyles[color]} border-l-4 shadow-sm group hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
                <div className={`${colorStyles[color]} w-7 h-7 rounded-lg flex items-center justify-center shrink-0`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-xl font-black text-slate-800">{value}</h3>
        </div>
    );
};

const getRoleStyles = (role) => {
    switch (role) {
        case 'admin': return 'bg-indigo-100 text-indigo-600';
        case 'station_owner': return 'bg-emerald-100 text-emerald-600';
        case 'operator': return 'bg-amber-100 text-amber-600';
        default: return 'bg-slate-100 text-slate-600';
    }
};

export default AdminUsersPage;
