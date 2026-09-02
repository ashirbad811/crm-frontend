import { useGetDealsQuery, useUpdateDealMutation } from '../features/api/dealsApiSlice';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';

const STAGES = ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const Deals = () => {
  const { data, isLoading, error } = useGetDealsQuery({ limit: 100 });
  const [updateDeal] = useUpdateDealMutation();

  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [dealToLost, setDealToLost] = useState(null);
  const [lostReason, setLostReason] = useState('');

  const validTransitions = {
    'Qualification': ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    'Discovery': ['Proposal', 'Negotiation', 'Won', 'Lost'],
    'Proposal': ['Negotiation', 'Won', 'Lost'],
    'Negotiation': ['Won', 'Lost'],
    'Won': [],
    'Lost': []
  };

  const handleStageChange = async (deal, newStage) => {
    if (!validTransitions[deal.stage].includes(newStage)) {
      return toast.error(`Invalid transition from ${deal.stage} to ${newStage}`);
    }

    if (newStage === 'Lost') {
      setDealToLost(deal);
      setLostReason('');
      setLostModalOpen(true);
      return;
    }

    try {
      await updateDeal({ id: deal._id, stage: newStage }).unwrap();
      toast.success(`Deal moved to ${newStage}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update deal stage');
    }
  };

  const submitLostReason = async () => {
    if (!lostReason) return toast.error('Lost reason is required');
    try {
      await updateDeal({ id: dealToLost._id, stage: 'Lost', lostReason }).unwrap();
      toast.success('Deal marked as Lost');
      setLostModalOpen(false);
      setDealToLost(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to mark deal as Lost');
    }
  };

  if (isLoading) return <div className="flex justify-center h-64 items-center">Loading pipeline...</div>;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  const deals = data?.deals || [];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Deal Pipeline</h1>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto pb-4 w-full">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter(deal => deal.stage === stage);
          const stageTotal = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

          return (
            <div key={stage} className="w-[85vw] sm:w-80 flex-shrink-0 bg-gray-100/50 rounded-xl flex flex-col snap-center">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-gray-700">{stage}</h3>
                  <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  ${stageTotal.toLocaleString()}
                </div>
              </div>
              
              <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[300px]">
                {stageDeals.map((deal) => (
                  <div key={deal._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
                    <h4 className="font-semibold text-gray-900 mb-1">{deal.title}</h4>
                    <p className="text-sm text-gray-500 mb-3">{deal.customerId?.company || deal.customerId?.name}</p>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-sm font-bold text-gray-900">${deal.value.toLocaleString()}</div>
                        <div className="text-xs text-green-600 font-medium">{deal.probability}% win prob</div>
                      </div>
                      
                      <select 
                        className="text-xs border border-gray-300 rounded p-1"
                        value={deal.stage}
                        onChange={(e) => handleStageChange(deal, e.target.value)}
                      >
                        {STAGES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {lostModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Mark Deal as Lost</h2>
              <button onClick={() => setLostModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason why the deal with <strong>{dealToLost?.customerId?.company || dealToLost?.customerId?.name}</strong> was lost.</p>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500 mb-4 h-24 resize-none"
              placeholder="e.g. Lost to competitor X, Budget issues..."
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setLostModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={submitLostReason} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Mark Lost</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deals;
