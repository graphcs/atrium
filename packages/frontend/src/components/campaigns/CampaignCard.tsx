import type { Campaign } from '@atrium/shared';
import { CampaignStatus } from '@atrium/shared';
import { Play, Pause, Trash2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import clsx from 'clsx';

const statusConfig: Record<string, { color: string; bg: string }> = {
  draft: { color: 'text-gray-400', bg: 'bg-gray-500/10' },
  active: { color: 'text-neon-green', bg: 'bg-neon-green/10' },
  paused: { color: 'text-neon-amber', bg: 'bg-neon-amber/10' },
  completed: { color: 'text-atrium-400', bg: 'bg-atrium-500/10' },
};

export default function CampaignCard({
  campaign,
  onUpdate,
}: {
  campaign: Campaign;
  onUpdate: () => void;
}) {
  const { patch, del } = useApi();
  const sc = statusConfig[campaign.status] ?? statusConfig.draft;
  const pct = campaign.budget.total > 0 ? (campaign.budget.spent / campaign.budget.total) * 100 : 0;

  const activate = async () => {
    await patch(`/campaigns/${campaign.id}/status`, { status: CampaignStatus.Active });
    onUpdate();
  };
  const pause = async () => {
    await patch(`/campaigns/${campaign.id}/status`, { status: CampaignStatus.Paused });
    onUpdate();
  };
  const remove = async () => {
    await del(`/campaigns/${campaign.id}`);
    onUpdate();
  };

  return (
    <div className="glass-panel p-5 animate-slide-up group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold text-white text-sm">{campaign.name}</h3>
          <span className={clsx('data-tag mt-1', sc.bg, sc.color)}>
            {campaign.status}
          </span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {campaign.status !== CampaignStatus.Active ? (
            <button onClick={activate} className="p-1.5 rounded-md hover:bg-neon-green/10 text-gray-500 hover:text-neon-green transition-colors">
              <Play className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={pause} className="p-1.5 rounded-md hover:bg-neon-amber/10 text-gray-500 hover:text-neon-amber transition-colors">
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={remove} className="p-1.5 rounded-md hover:bg-neon-red/10 text-gray-500 hover:text-neon-red transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Budget bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-1.5">
          <span>Budget</span>
          <span>${campaign.budget.spent.toFixed(2)} / ${campaign.budget.total.toFixed(0)}</span>
        </div>
        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-atrium-600 to-atrium-400 transition-all duration-500"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Targeting summary */}
      <div className="flex flex-wrap gap-1">
        {campaign.targeting.geos?.slice(0, 3).map((g) => (
          <span key={g} className="data-tag bg-white/[0.03] text-gray-500">{g}</span>
        ))}
        {campaign.targeting.devices?.slice(0, 2).map((d) => (
          <span key={d} className="data-tag bg-white/[0.03] text-gray-500">{d}</span>
        ))}
        <span className="data-tag bg-atrium-500/10 text-atrium-500">
          ${campaign.budget.maxBidCpm} CPM
        </span>
      </div>
    </div>
  );
}
