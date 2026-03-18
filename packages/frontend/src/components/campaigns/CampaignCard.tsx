import type { Campaign } from '@atrium/shared';
import { CampaignStatus } from '@atrium/shared';
import { Play, Pause, Trash2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import clsx from 'clsx';

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  draft: { color: 'text-txt-2', bg: 'bg-surface-2', border: 'border-border' },
  active: { color: 'text-success', bg: 'bg-success-subtle', border: 'border-success-border' },
  paused: { color: 'text-warning', bg: 'bg-warning-subtle', border: 'border-warning-border' },
  completed: { color: 'text-accent', bg: 'bg-accent-subtle', border: 'border-accent-border' },
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
    <div className="card p-5 animate-slide-up group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold text-txt-1 text-sm">{campaign.name}</h3>
          <span className={clsx('tag mt-1.5 border', sc.bg, sc.color, sc.border)}>
            {campaign.status}
          </span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {campaign.status !== CampaignStatus.Active ? (
            <button
              onClick={activate}
              className="p-2 rounded-lg hover:bg-success-subtle text-txt-3 hover:text-success transition-colors cursor-pointer"
              aria-label="Activate campaign"
            >
              <Play className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={pause}
              className="p-2 rounded-lg hover:bg-warning-subtle text-txt-3 hover:text-warning transition-colors cursor-pointer"
              aria-label="Pause campaign"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={remove}
            className="p-2 rounded-lg hover:bg-danger-subtle text-txt-3 hover:text-danger transition-colors cursor-pointer"
            aria-label="Delete campaign"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Budget bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] font-mono text-txt-3 mb-1.5">
          <span>Budget</span>
          <span>${campaign.budget.spent.toFixed(2)} / ${campaign.budget.total.toFixed(0)}</span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Targeting tags */}
      <div className="flex flex-wrap gap-1.5">
        {campaign.targeting.geos?.slice(0, 3).map((g) => (
          <span key={g} className="tag bg-surface-2 text-txt-3 border border-border">{g}</span>
        ))}
        {campaign.targeting.devices?.slice(0, 2).map((d) => (
          <span key={d} className="tag bg-surface-2 text-txt-3 border border-border">{d}</span>
        ))}
        <span className="tag bg-accent-subtle text-accent border border-accent-border">
          ${campaign.budget.maxBidCpm} CPM
        </span>
      </div>
    </div>
  );
}
