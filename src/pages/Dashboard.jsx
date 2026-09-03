import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetDashboardStatsQuery } from '../features/api/analyticsApiSlice';
import { useGetGlobalLogsQuery } from '../features/api/timelineApiSlice';
import { useGetAssignableUsersQuery } from '../features/api/usersApiSlice';
import { Users, UserPlus, Briefcase, IndianRupee, Activity, List, Clock, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Dashboard = () => {
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const { data: stats, isLoading, error } = useGetDashboardStatsQuery();
  const { data: logs, isLoading: logsLoading } = useGetGlobalLogsQuery(
    selectedUserId ? { userId: selectedUserId } : {}
  );
  const { data: teamUsers } = useGetAssignableUsersQuery();

  if (isLoading) return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  if (error) return <div className="text-red-500">Error loading dashboard: {error.message}</div>;

  const pieData = [
    { name: 'Open', value: stats?.deals.open || 0, color: '#3b82f6' }, // blue-600
    { name: 'Won', value: stats?.deals.won || 0, color: '#16a34a' }, // green-600
    { name: 'Lost', value: stats?.deals.lost || 0, color: '#dc2626' } // red-600
  ].filter(item => item.value > 0); // Only show segments with data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Overview</h1>
        <p className="text-gray-500">Your CRM activity at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Leads */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Leads</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats?.leads.total || 0}</h3>
            <p className="text-xs text-green-600 mt-2 font-medium">{stats?.leads.conversionRate}% Conversion</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Customers</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats?.customers.total || 0}</h3>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pipeline Value</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{(stats?.deals.pipelineValue || 0).toLocaleString()}</h3>
            <p className="text-xs text-blue-600 mt-2 font-medium">{stats?.deals.open || 0} Open Deals</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <Briefcase className="w-6 h-6 text-purple-600" />
          </div>
        </div>

        {/* Won Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Won Revenue</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{(stats?.deals.wonRevenue || 0).toLocaleString()}</h3>
            <p className="text-xs text-green-600 mt-2 font-medium">{stats?.deals.won || 0} Won Deals</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <IndianRupee className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Deal Stats Breakdown with Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Deals Breakdown</h3>
          
          <div className="flex-1 min-h-[250px] mt-4 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} Deals`, 'Count']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-sm flex items-center justify-center h-full">
                No deals data available
              </div>
            )}
          </div>
        </div>

        {/* Activities Stats */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Activities Overview</h3>
            <Activity className="text-gray-400 w-5 h-5" />
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div className="bg-yellow-50 rounded-xl p-4 text-center">
               <div className="text-2xl font-bold text-yellow-700">{stats?.activities.pending}</div>
               <div className="text-xs font-medium text-yellow-600 mt-1 uppercase">Pending</div>
             </div>
             <div className="bg-green-50 rounded-xl p-4 text-center">
               <div className="text-2xl font-bold text-green-700">{stats?.activities.completed}</div>
               <div className="text-xs font-medium text-green-600 mt-1 uppercase">Completed</div>
             </div>
             <div className="bg-red-50 rounded-xl p-4 text-center">
               <div className="text-2xl font-bold text-red-700">{stats?.activities.overdue}</div>
               <div className="text-xs font-medium text-red-600 mt-1 uppercase">Overdue</div>
             </div>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <List className="text-gray-400 w-5 h-5" />
            <h3 className="text-lg font-bold text-gray-900">System Logs</h3>
          </div>
          
          {/* Filter Dropdown */}
          {teamUsers && teamUsers.length > 0 && (
            <select
              className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-2 px-3 border shadow-sm"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">All Team Logs</option>
              {teamUsers.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          )}
        </div>
        
        <div className="p-0">
          {logsLoading ? (
            <div className="p-6 text-center text-gray-500">Loading logs...</div>
          ) : logs && logs.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {logs.slice(0, 5).map(log => (
                <li key={log._id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{log.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">{log.onModel}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center space-x-3 text-xs text-gray-400">
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(log.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>By: {log.createdBy?.name || 'Unknown'}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-gray-500">No logs found.</div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
          <Link to="/system-logs" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center transition">
            View All Logs <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
