import { useState } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuctionStore } from '../../stores/auction-store';
import clsx from 'clsx';

export default function SimulatorControls() {
  const { post } = useApi();
  const simState = useAuctionStore((s) => s.simulatorState);
  const clearBids = useAuctionStore((s) => s.clearBids);
  const isRunning = simState?.status === 'running';

  const [rps, setRps] = useState(50);
  const [aggression, setAggression] = useState(0.6);

  const start = () => post('/simulator/start', { requestsPerSecond: rps, competitorAggressiveness: aggression });
  const stop = () => post('/simulator/stop');
  const reset = () => { post('/simulator/reset'); clearBids(); };

  return (
    <div className="glass-panel p-5 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-gray-500 tracking-[0.15em] uppercase">
          Simulator Control
        </span>
        <div className={clsx(
          'data-tag',
          isRunning ? 'bg-neon-green/10 text-neon-green' : 'bg-gray-500/10 text-gray-500'
        )}>
          {simState?.status ?? 'idle'}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={start}
          disabled={isRunning}
          className={clsx('btn-glow btn-glow-green flex-1 flex items-center justify-center gap-2', isRunning && 'opacity-40 cursor-not-allowed')}
        >
          <Play className="w-3.5 h-3.5" />
          Start
        </button>
        <button
          onClick={stop}
          disabled={!isRunning}
          className={clsx('btn-glow btn-glow-red flex-1 flex items-center justify-center gap-2', !isRunning && 'opacity-40 cursor-not-allowed')}
        >
          <Square className="w-3.5 h-3.5" />
          Stop
        </button>
        <button
          onClick={reset}
          className="btn-glow btn-glow-neutral flex items-center justify-center gap-2 px-3"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <SliderField
          label="Requests / sec"
          value={rps}
          min={1}
          max={200}
          onChange={setRps}
          display={`${rps}`}
        />
        <SliderField
          label="Competitor Aggression"
          value={aggression}
          min={0}
          max={1}
          step={0.05}
          onChange={setAggression}
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
        <span className="text-[11px] font-mono text-gray-400">{label}</span>
        <span className="text-[11px] font-mono text-atrium-400">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-atrium-500
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(59,130,246,0.4)]
          [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}
