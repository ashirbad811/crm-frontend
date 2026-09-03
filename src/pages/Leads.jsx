import { useState } from 'react';
import { useGetLeadsQuery, useCreateLeadMutation, useConvertLeadMutation, useUpdateLeadMutation } from '../features/api/leadsApiSlice';
import { useGetAssignableUsersQuery } from '../features/api/usersApiSlice';
import { Search, Filter, Plus, X, ArrowRightLeft, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRBAC } from '../hooks/useRBAC';
import LeadDetailsModal from '../components/LeadDetailsModal';

const Leads = () => {
  const { hasPermission } = useRBAC();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({ title: '', firstName: '', lastName: '', email: '', phone: '', company: '', source: 'Website', priority: 'Medium' });

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState(null);
  const [convertData, setConvertData] = useState({ dealValue: '', dealProbability: 50, expectedClosingDate: '' });

  const [detailsModalLeadId, setDetailsModalLeadId] = useState(null);

  const { data, isLoading, error } = useGetLeadsQuery({ page, limit: 10, search, status });
  const { data: assignableUsers } = useGetAssignableUsersQuery(undefined, { skip: !hasPermission('Leads', 'Assign') });
  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  const [convertLead, { isLoading: isConverting }] = useConvertLeadMutation();
  const [updateLead] = useUpdateLeadMutation();

  const handleAssignChange = async (leadId, newAssignedTo) => {
    try {
      await updateLead({ id: leadId, assignedTo: newAssignedTo }).unwrap();
      toast.success('Lead assigned successfully');
    } catch (err) {
      toast.error('Failed to assign lead');
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      await createLead(newLead).unwrap();
      toast.success('Lead created successfully');
      setIsModalOpen(false);
      setNewLead({ title: '', firstName: '', lastName: '', email: '', phone: '', company: '', source: 'Website', priority: 'Medium' });
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Failed to create lead');
    }
  };

  const openConvertModal = (lead) => {
    setLeadToConvert(lead);
    setConvertData({ dealValue: '', dealProbability: 50, expectedClosingDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] });
    setIsConvertModalOpen(true);
  };

  const handleConvertLead = async (e) => {
    e.preventDefault();
    try {
      await convertLead({ id: leadToConvert._id, data: convertData }).unwrap();
      toast.success('Lead converted to Customer and Deal successfully!');
      setIsConvertModalOpen(false);
      setLeadToConvert(null);
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Failed to convert lead');
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await updateLead({ id: leadId, status: newStatus }).unwrap();
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64">Loading leads...</div>;
  if (error) return <div className="text-red-500">Error loading leads: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
        {hasPermission('Leads', 'Create') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center sm:justify-start space-x-2 transition"
          >
            <Plus className="w-5 h-5" />
            <span>New Lead</span>
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center w-full">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search leads by name, email, company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-gray-500 shrink-0" />
          <select
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Unqualified">Unqualified</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Table & Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {data?.leads?.map((lead) => (
            <div key={lead._id} className="p-4 space-y-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => setDetailsModalLeadId(lead._id)}>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{lead.firstName} {lead.lastName}</h3>
                    <p className="text-xs text-gray-500 font-medium">{lead.company || lead.title || '-'}</p>
                  </div>
                </div>
                <div>
                  {lead.isConverted ? (
                    <span className="px-2 inline-flex text-[10px] leading-4 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {lead.status}
                    </span>
                  ) : hasPermission('Leads', 'Edit') ? (
                    <select
                      className={`text-[10px] font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer
                        ${lead.status === 'New' ? 'bg-green-100 text-green-800' : ''}
                        ${lead.status === 'Contacted' ? 'bg-blue-100 text-blue-800' : ''}
                        ${lead.status === 'Qualified' ? 'bg-purple-100 text-purple-800' : ''}
                        ${lead.status === 'Lost' || lead.status === 'Unqualified' ? 'bg-red-100 text-red-800' : ''}
                      `}
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                    >
                      <option value="New" className="bg-white text-gray-900">New</option>
                      <option value="Contacted" className="bg-white text-gray-900">Contacted</option>
                      <option value="Qualified" className="bg-white text-gray-900">Qualified</option>
                      <option value="Unqualified" className="bg-white text-gray-900">Unqualified</option>
                      <option value="Lost" className="bg-white text-gray-900">Lost</option>
                    </select>
                  ) : (
                    <span className="px-2 inline-flex text-[10px] leading-4 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {lead.status}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-gray-400 font-medium mb-0.5">Email</span>
                  <span className="text-gray-800 truncate">{lead.email}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 font-medium mb-0.5">Assigned To</span>
                  {hasPermission('Leads', 'Assign') ? (
                    <select
                      className="text-[10px] py-0.5 px-1 bg-white border border-gray-200 rounded truncate w-full"
                      value={lead.assignedTo?._id || ''}
                      onChange={(e) => handleAssignChange(lead._id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Unassigned</option>
                      {assignableUsers?.map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-gray-800">{lead.assignedTo?.name || 'Unassigned'}</span>
                  )}
                </div>
              </div>
              
              <div className="pt-2 space-y-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setDetailsModalLeadId(lead._id); }}
                  className="w-full py-2.5 rounded-lg transition flex items-center justify-center space-x-2 text-sm font-semibold shadow-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  <FileText className="w-4 h-4" />
                  <span>Add Note / Details</span>
                </button>
                {!lead.isConverted && hasPermission('Leads', 'Convert') && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (lead.status === 'Qualified') openConvertModal(lead); }}
                    disabled={lead.status !== 'Qualified'}
                    className={`w-full py-2.5 rounded-lg transition flex items-center justify-center space-x-2 text-sm font-semibold shadow-sm
                      ${lead.status === 'Qualified' 
                        ? 'text-white bg-blue-600 hover:bg-blue-700 cursor-pointer' 
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-80'}
                    `}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Convert to Customer</span>
                  </button>
                )}
                {lead.isConverted && (
                  <div className="w-full py-2.5 rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center justify-center font-semibold text-sm shadow-sm">
                    Converted
                  </div>
                )}
              </div>
            </div>
          ))}
          {data?.leads?.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No leads found. Create a new lead to get started.
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.leads?.map((lead) => (
                <tr key={lead._id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setDetailsModalLeadId(lead._id)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{lead.firstName} {lead.lastName}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.company || '-'}</div>
                    <div className="text-sm text-gray-500">{lead.title || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.isConverted ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {lead.status}
                      </span>
                    ) : hasPermission('Leads', 'Edit') ? (
                      <select
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer
                          ${lead.status === 'New' ? 'bg-green-100 text-green-800' : ''}
                          ${lead.status === 'Contacted' ? 'bg-blue-100 text-blue-800' : ''}
                          ${lead.status === 'Qualified' ? 'bg-purple-100 text-purple-800' : ''}
                          ${lead.status === 'Lost' || lead.status === 'Unqualified' ? 'bg-red-100 text-red-800' : ''}
                        `}
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="New" className="bg-white text-gray-900">New</option>
                        <option value="Contacted" className="bg-white text-gray-900">Contacted</option>
                        <option value="Qualified" className="bg-white text-gray-900">Qualified</option>
                        <option value="Unqualified" className="bg-white text-gray-900">Unqualified</option>
                        <option value="Lost" className="bg-white text-gray-900">Lost</option>
                      </select>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {lead.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hasPermission('Leads', 'Assign') ? (
                      <select
                        className="text-xs py-1 px-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 w-full"
                        value={lead.assignedTo?._id || ''}
                        onChange={(e) => handleAssignChange(lead._id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">Unassigned</option>
                        {assignableUsers?.map(u => (
                          <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{lead.assignedTo?.name || 'Unassigned'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDetailsModalLeadId(lead._id); }}
                        className="text-gray-600 hover:text-blue-600 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-200 px-3 py-1 rounded-md transition flex items-center space-x-1"
                        title="Add Note & View Details"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Notes</span>
                      </button>
                      {!lead.isConverted && hasPermission('Leads', 'Convert') && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); if (lead.status === 'Qualified') openConvertModal(lead); }}
                        disabled={lead.status !== 'Qualified'}
                        title={lead.status !== 'Qualified' ? 'Lead must be Qualified to convert' : 'Convert to Customer'}
                        className={`px-3 py-1 rounded-md transition flex items-center justify-end w-full space-x-1
                          ${lead.status === 'Qualified' 
                            ? 'text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 cursor-pointer' 
                            : 'text-gray-400 bg-gray-50 cursor-not-allowed opacity-60'}
                        `}
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Convert</span>
                      </button>
                    )}
                    {lead.isConverted && (
                      <span className="text-green-600 font-medium text-xs bg-green-50 border border-green-200 px-2 py-1 rounded-md inline-flex items-center w-full justify-center">Converted</span>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
              {data?.leads?.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    No leads found. Create a new lead to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                Previous
              </button>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(page * 10, data.totalLeads)}</span> of <span className="font-medium">{data.totalLeads}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto slide-up-animation">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Create New Lead</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="p-4 sm:p-6 pb-28 sm:pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input required type="text" value={newLead.firstName} onChange={e => setNewLead({...newLead, firstName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input required type="text" value={newLead.lastName} onChange={e => setNewLead({...newLead, lastName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input required type="text" value={newLead.title} onChange={e => setNewLead({...newLead, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input type="text" value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500">
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={newLead.priority} onChange={e => setNewLead({...newLead, priority: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                {hasPermission('Leads', 'Assign') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                    <select 
                      value={newLead.assignedTo || ''} 
                      onChange={e => setNewLead({...newLead, assignedTo: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Self (Default)</option>
                      {assignableUsers?.map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isCreating ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead Modal */}
      {isConvertModalOpen && leadToConvert && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto slide-up-animation">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Convert Lead</h2>
              <button onClick={() => setIsConvertModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="px-6 pt-4 pb-2 bg-blue-50/50">
              <p className="text-sm text-gray-700">
                Converting <strong>{leadToConvert.firstName} {leadToConvert.lastName}</strong> ({leadToConvert.company}) will create a new Customer and a new Deal in your pipeline.
              </p>
            </div>
            <form onSubmit={handleConvertLead} className="p-4 sm:p-6 pb-28 sm:pb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value (₹)</label>
                <input required type="number" min="0" value={convertData.dealValue} onChange={e => setConvertData({...convertData, dealValue: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Probability to Win (%)</label>
                <input required type="number" min="0" max="100" value={convertData.dealProbability} onChange={e => setConvertData({...convertData, dealProbability: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Closing Date</label>
                <input required type="date" value={convertData.expectedClosingDate} onChange={e => setConvertData({...convertData, expectedClosingDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsConvertModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isConverting} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {isConverting ? 'Converting...' : 'Confirm Conversion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModalLeadId && (
        <LeadDetailsModal leadId={detailsModalLeadId} onClose={() => setDetailsModalLeadId(null)} />
      )}
    </div>
  );
};

export default Leads;
