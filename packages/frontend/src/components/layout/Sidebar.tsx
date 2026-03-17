import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Radio, Zap } from 'lucide-react';
import { useAuctionStore } from '../../stores/auction-store';
import clsx from 'clsx';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/auction', icon: Radio, label: 'Live Auction' },
];

export default function Sidebar() {
  const simState = useAuctionStore((s) => s.simulatorState);
  const isRunning = simState?.status === 'running';

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] z-50 flex flex-col border-r border-white/[0.04] bg-void-50/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.04]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-atrium-500 to-atrium-700 flex items-center justify-center shadow-lg shadow-atrium-500/20">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight text-white">
          atrium
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-atrium-500/10 text-atrium-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.15)]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
              )
            }
          >
            <Icon className={clsx('w-4 h-4 transition-colors')} />
            <span className="font-display">{label}</span>
            {to === '/auction' && isRunning && (
              <span className="ml-auto w-2 h-2 rounded-full bg-neon-green animate-pulse-slow shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Simulator status footer */}
      <div className="px-4 py-4 border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'w-1.5 h-1.5 rounded-full transition-colors',
              isRunning ? 'bg-neon-green shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-gray-600'
            )}
          />
          <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
            {isRunning ? 'Engine Live' : 'Engine Idle'}
          </span>
        </div>
        {isRunning && simState && (
          <div className="mt-2 text-[11px] font-mono text-gray-600">
            {simState.stats.requestsPerSecond.toFixed(0)} req/s
          </div>
        )}
      </div>
    </aside>
  );
}
