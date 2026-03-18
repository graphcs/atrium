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
      <Header title="Campaigns" subtitle="Configure and manage your ad campaigns" />

      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-txt-2 font-display">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="card p-16 text-center animate-fade-in">
            <p className="text-txt-2 font-display text-sm mb-1">No campaigns yet</p>
            <p className="text-txt-3 font-display text-xs mb-5">
              Campaigns define your bidding strategy, budget, and targeting rules
            </p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
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
