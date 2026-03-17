import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import type { Campaign } from '@atrium/shared';
import Header from '../components/layout/Header';
import CampaignCard from '../components/campaigns/CampaignCard';
import CampaignForm from '../components/campaigns/CampaignForm';
import { useApi } from '../hooks/useApi';

export default function Campaigns() {
  const { get } = useApi();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const data = await get<Campaign[]>('/campaigns');
    setCampaigns(data);
  }, [get]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Campaigns" />

      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 font-mono">
              {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-glow btn-glow-blue flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="glass-panel p-16 text-center animate-fade-in">
            <div className="text-gray-600 font-mono text-sm mb-4">No campaigns yet</div>
            <button
              onClick={() => setShowForm(true)}
              className="btn-glow btn-glow-blue inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create your first campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} onUpdate={load} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <CampaignForm onClose={() => setShowForm(false)} onCreated={load} />
      )}
    </div>
  );
}
