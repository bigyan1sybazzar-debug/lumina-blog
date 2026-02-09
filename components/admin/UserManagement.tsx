import React, { useState } from 'react';
import { User, Users, Shield, CheckCircle, X, Trash2, Filter, ArrowUpDown, Clock } from 'lucide-react';
import { User as UserType } from '../../types';

interface UserManagementProps {
    users: UserType[];
    onChangeRole: (userId: string, newRole: string) => Promise<void>;
    onApproveUser: (userId: string) => Promise<void>;
    onRejectUser: (userId: string) => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onChangeRole, onApproveUser, onRejectUser }) => {
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

    const filteredUsers = users
        .filter(user => {
            if (statusFilter === 'all') return true;
            return user.status === statusFilter;
        })
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return 'Unknown';
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User size={24} className="text-blue-500" />
                        User Management
                        <span className="text-xs font-normal text-gray-500 ml-2">({filteredUsers.length} users)</span>
                    </h2>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Status Filter */}
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
                            <Filter size={14} className="text-gray-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-300 focus:ring-0 outline-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending Only</option>
                                <option value="approved">Approved Only</option>
                                <option value="rejected">Rejected Only</option>
                            </select>
                        </div>

                        {/* Sort Filter */}
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
                            <ArrowUpDown size={14} className="text-gray-500" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-300 focus:ring-0 outline-none cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Registered</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700" src={user.avatar} alt="" />
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</div>
                                                <div className="text-xs text-gray-500 select-all">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-900 dark:text-gray-200 font-medium flex items-center gap-1">
                                                <Clock size={12} className="text-gray-400" />
                                                {formatDateTime(user.createdAt)}
                                            </span>
                                            {user.updatedAt && user.updatedAt !== user.createdAt && (
                                                <span className="text-[10px] text-gray-400 mt-0.5">Updated: {formatDateTime(user.updatedAt)}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={user.role}
                                            onChange={(e) => onChangeRole(user.id, e.target.value)}
                                            className="block w-full pl-2 pr-8 py-1.5 text-xs font-bold border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="user">User</option>
                                            <option value="editor">Editor</option>
                                            <option value="moderator">Moderator</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-[10px] font-black uppercase tracking-wider rounded-full ${user.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            user.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {user.status || 'pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            {user.status !== 'approved' && (
                                                <button
                                                    onClick={() => onApproveUser(user.id)}
                                                    className="p-2 bg-green-50 dark:bg-green-900/10 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all"
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            {user.status !== 'rejected' && (
                                                <button
                                                    onClick={() => onRejectUser(user.id)}
                                                    className="p-2 bg-red-50 dark:bg-red-900/10 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                                                    title="Reject"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <Users size={48} className="mb-2" />
                                        <p className="text-sm font-bold uppercase tracking-widest">No users found match your filters</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
