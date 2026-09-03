import { useState } from 'react';
import { useGetGlobalLogsQuery } from '../features/api/timelineApiSlice';
import { useGetAssignableUsersQuery } from '../features/api/usersApiSlice';
import { Clock } from 'lucide-react';

const SystemLogs = () => {
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const { data: logs, isLoading: logsLoading } = useGetGlobalLogsQuery(
    selectedUserId ? { userId: selectedUserId } : {}
  );
  const { data: teamUsers } = useGetAssignableUsersQuery();

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-500 mt-1">Track all activities across your team.</p>
        </div>
        
        {/* Filter Dropdown */}
        {teamUsers && teamUsers.length > 0 && (
          <select
            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-2.5 px-4 border shadow-sm bg-white"
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {logsLoading ? (
          <div className="p-8 text-center text-gray-500">Loading logs...</div>
        ) : logs && logs.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {logs.map(log => (
              <li key={log._id} className="p-5 sm:p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{log.action}</p>
                    <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md inline-block">{log.onModel}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center space-x-3 text-sm text-gray-400">
                  <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5"/> {new Date(log.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>By: {log.createdBy?.name || 'Unknown'}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center text-gray-500">No logs found.</div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
