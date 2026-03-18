import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuctionStore } from '../../stores/auction-store';

export default function SpendChart() {
  const history = useAuctionStore((s) => s.metricsHistory);

  const data = history.map((h, i) => ({
    idx: i,
    winRate: +(h.winRate * 100).toFixed(1),
    spend: +h.spend.toFixed(2),
  }));

  return (
    <div className="card p-6 animate-fade-in h-full flex flex-col">
      <span className="section-label">Performance Trend</span>
      <div className="flex-1 mt-4 min-h-[200px]">
        {data.length < 2 ? (
          <div className="flex items-center justify-center h-full text-txt-3 font-display text-sm">
            Waiting for auction data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="winGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5a8af2" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#5a8af2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#252833"
                vertical={false}
              />
              <XAxis dataKey="idx" hide />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#5c5e6a', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickFormatter={(v) => `${v}%`}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1d27',
                  border: '1px solid #252833',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '12px',
                  color: '#e4e5ea',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
                formatter={(value: number) => [`${value}%`, 'Win Rate']}
                labelFormatter={() => ''}
              />
              <Area
                type="monotone"
                dataKey="winRate"
                stroke="#5a8af2"
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
