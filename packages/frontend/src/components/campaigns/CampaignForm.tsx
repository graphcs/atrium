import { useState } from 'react';
import { X } from 'lucide-react';
import { GEO_COUNTRIES, IAB_CATEGORIES, DeviceType } from '@atrium/shared';
import { useApi } from '../../hooks/useApi';
import clsx from 'clsx';

const DEVICES = Object.values(DeviceType);

export default function CampaignForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { post } = useApi();

  const [name, setName] = useState('');
  const [budgetTotal, setBudgetTotal] = useState(1000);
  const [budgetDaily, setBudgetDaily] = useState(100);
  const [maxBidCpm, setMaxBidCpm] = useState(8);
  const [geos, setGeos] = useState<string[]>(['US', 'GB']);
  const [devices, setDevices] = useState<string[]>(['desktop', 'mobile']);
  const [categories, setCategories] = useState<string[]>(['IAB1', 'IAB19']);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const submit = async () => {
    if (!name.trim()) return;
    await post('/campaigns', {
      name,
      budget: { total: budgetTotal, daily: budgetDaily, maxBidCpm },
      targeting: { geos, devices, categories },
      creative: {
        id: 'creative-1',
        name: 'Default Video',
        vastUrl: 'https://example.com/vast.xml',
        duration: 15,
        width: 1920,
        height: 1080,
        mimeType: 'video/mp4',
      },
    });
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg max-h-[80vh] overflow-y-auto m-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
          <h2 className="font-display font-bold text-lg text-white">New Campaign</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Name */}
          <Field label="Campaign Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q1 Brand Awareness"
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-atrium-500/30 focus:ring-1 focus:ring-atrium-500/10 transition-colors"
            />
          </Field>

          {/* Budget */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Total Budget ($)">
              <NumberInput value={budgetTotal} onChange={setBudgetTotal} />
            </Field>
            <Field label="Daily Cap ($)">
              <NumberInput value={budgetDaily} onChange={setBudgetDaily} />
            </Field>
            <Field label="Max CPM ($)">
              <NumberInput value={maxBidCpm} onChange={setMaxBidCpm} step={0.5} />
            </Field>
          </div>

          {/* Geos */}
          <Field label="Geo Targeting">
            <div className="flex flex-wrap gap-1.5">
              {[...GEO_COUNTRIES].map((g) => (
                <button
                  key={g}
                  onClick={() => toggleItem(geos, g, setGeos)}
                  className={clsx(
                    'data-tag cursor-pointer transition-colors',
                    geos.includes(g)
                      ? 'bg-atrium-500/20 text-atrium-400 border border-atrium-500/20'
                      : 'bg-white/[0.03] text-gray-500 border border-transparent hover:bg-white/[0.06]',
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>

          {/* Devices */}
          <Field label="Device Targeting">
            <div className="flex flex-wrap gap-1.5">
              {DEVICES.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleItem(devices, d, setDevices)}
                  className={clsx(
                    'data-tag cursor-pointer transition-colors',
                    devices.includes(d)
                      ? 'bg-neon-green/15 text-neon-green border border-neon-green/20'
                      : 'bg-white/[0.03] text-gray-500 border border-transparent hover:bg-white/[0.06]',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>

          {/* Categories */}
          <Field label="Content Categories">
            <div className="flex flex-wrap gap-1.5">
              {[...IAB_CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => toggleItem(categories, c, setCategories)}
                  className={clsx(
                    'data-tag cursor-pointer transition-colors',
                    categories.includes(c)
                      ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20'
                      : 'bg-white/[0.03] text-gray-500 border border-transparent hover:bg-white/[0.06]',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-white/[0.04]">
          <button onClick={onClose} className="btn-glow btn-glow-neutral">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className={clsx('btn-glow btn-glow-blue', !name.trim() && 'opacity-40 cursor-not-allowed')}
          >
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-mono text-gray-500 tracking-[0.1em] uppercase mb-2 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-atrium-500/30 focus:ring-1 focus:ring-atrium-500/10 transition-colors"
    />
  );
}
