import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuctionStore } from '../../stores/auction-store';

export default function SpendChart() {
  const history = useAuctionStore((s) => s.metricsHistory);

  const data = history.map((h, i) => ({
    idx: i,
    winRate: +(h.winRate * 100).toFixed(1),
    spend: +h.spend.toFixed(2),
  }));

  return (
    <div className="glass-panel p-6 animate-fade-in">
      <span className="text-[10px] font-mono text-gray-500 tracking-[0.15em] uppercase">
        Win Rate Over Time
      </span>
      <div className="mt-4 h-[200px]">
        {data.length < 2 ? (
          <div className="flex items-center justify-center h-full text-gray-600 font-mono text-sm">
            Waiting for data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="winGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="idx" hide />
              <YAxis
                domain={[0, 100]}
                hide
              />
              <Tooltip
                contentStyle={{
                  background: '#0d1224',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '11px',
                  color: '#93c5fd',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
                formatter={(value: number) => [`${value}%`, 'Win Rate']}
                labelFormatter={() => ''}
              />
              <Area
                type="monotone"
                dataKey="winRate"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#winGradient)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
