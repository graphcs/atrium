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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg max-h-[80vh] overflow-y-auto m-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-lg text-txt-1">New Campaign</h2>
            <p className="text-xs text-txt-3 font-display mt-0.5">Set up your bidding parameters</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-2 text-txt-3 hover:text-txt-1 transition-colors cursor-pointer"
          >
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
              placeholder="e.g. Q1 Brand Awareness"
              className="input-field"
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
                    'tag cursor-pointer transition-colors border',
                    geos.includes(g)
                      ? 'bg-accent-subtle text-accent border-accent-border'
                      : 'bg-surface-2 text-txt-3 border-border hover:border-border-light hover:text-txt-2',
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
                    'tag cursor-pointer transition-colors border',
                    devices.includes(d)
                      ? 'bg-success-subtle text-success border-success-border'
                      : 'bg-surface-2 text-txt-3 border-border hover:border-border-light hover:text-txt-2',
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
                    'tag cursor-pointer transition-colors border',
                    categories.includes(c)
                      ? 'bg-accent-subtle text-accent border-accent-border'
                      : 'bg-surface-2 text-txt-3 border-border hover:border-border-light hover:text-txt-2',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="btn-primary"
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
      <label className="section-label mb-2 block">{label}</label>
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
      className="input-field"
    />
  );
}
