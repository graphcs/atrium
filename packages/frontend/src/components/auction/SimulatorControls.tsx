import { useState } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuctionStore } from '../../stores/auction-store';
import clsx from 'clsx';

export default function SimulatorControls() {
  const { post, patch } = useApi();
  const simState = useAuctionStore((s) => s.simulatorState);
  const clearBids = useAuctionStore((s) => s.clearBids);
  const isRunning = simState?.status === 'running';

  const [rps, setRps] = useState(50);
  const [aggression, setAggression] = useState(0.6);

  const start = () => post('/simulator/start', { requestsPerSecond: rps, competitorAggressiveness: aggression });
  const stop = () => post('/simulator/stop');
  const reset = () => { post('/simulator/reset'); clearBids(); };

  // Live-update config while simulator is running
  const updateRps = (v: number) => {
    setRps(v);
    if (isRunning) patch('/simulator/config', { requestsPerSecond: v });
  };
  const updateAggression = (v: number) => {
    setAggression(v);
    if (isRunning) patch('/simulator/config', { competitorAggressiveness: v });
  };

  return (
    <div className="card p-5 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="section-label">Simulator</span>
        <span className={clsx(
          'tag border',
          isRunning
            ? 'bg-success-subtle text-success border-success-border'
            : 'bg-surface-2 text-txt-3 border-border'
        )}>
          {simState?.status ?? 'idle'}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={start}
          disabled={isRunning}
          className="btn-success flex-1"
        >
          <Play className="w-3.5 h-3.5" />
          Start
        </button>
        <button
          onClick={stop}
          disabled={!isRunning}
          className="btn-danger flex-1"
        >
          <Square className="w-3.5 h-3.5" />
          Stop
        </button>
        <button
          onClick={reset}
          className="btn-ghost px-3"
          aria-label="Reset simulator"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Configuration sliders */}
      <div className="space-y-4 pt-1">
        <SliderField
          label="Requests per second"
          value={rps}
          min={1}
          max={200}
          onChange={updateRps}
          display={`${rps}`}
        />
        <SliderField
          label="Competitor aggressiveness"
          value={aggression}
          min={0}
          max={1}
          step={0.05}
          onChange={updateAggression}
          display={`${(aggression * 100).toFixed(0)}%`}
        />
      </div>
    </div>
  );
}

function SliderField({
  label, value, min, max, step = 1, onChange, display,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; display: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-display text-txt-2">{label}</span>
        <span className="text-xs font-mono font-semibold text-accent">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
