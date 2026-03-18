import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Radio, Activity } from 'lucide-react';
import { useAuctionStore } from '../../stores/auction-store';
import clsx from 'clsx';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', desc: 'Performance overview' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns', desc: 'Manage ad campaigns' },
  { to: '/auction', icon: Radio, label: 'Live Auction', desc: 'Run simulations' },
];

export default function Sidebar() {
  const simState = useAuctionStore((s) => s.simulatorState);
  const isRunning = simState?.status === 'running';

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] z-50 flex flex-col border-r border-border bg-surface-1">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-display font-bold text-base text-txt-1 tracking-tight">
            Atrium
          </span>
          <span className="block text-[10px] font-mono text-txt-3 -mt-0.5">Ad Auction Platform</span>
        </div>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group cursor-pointer',
                isActive
                  ? 'bg-accent-subtle text-accent border border-accent-border'
                  : 'text-txt-2 hover:text-txt-1 hover:bg-surface-2 border border-transparent'
              )
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            <span className="font-display">{label}</span>
            {to === '/auction' && isRunning && (
              <span className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-mono text-success">LIVE</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Engine status */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div
            className={clsx(
              'w-2 h-2 rounded-full transition-colors',
              isRunning ? 'bg-success' : 'bg-txt-3'
            )}
          />
          <span className="text-xs font-display font-medium text-txt-2">
            {isRunning ? 'Engine Running' : 'Engine Idle'}
          </span>
        </div>
        {isRunning && simState && (
          <div className="mt-1.5 ml-[18px] text-xs font-mono text-txt-3">
            {simState.stats.requestsPerSecond.toFixed(0)} req/s &middot; {simState.stats.totalRequests.toLocaleString()} processed
          </div>
        )}
      </div>
    </aside>
  );
}
