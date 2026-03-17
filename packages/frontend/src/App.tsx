import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import AuctionLive from './pages/AuctionLive';
import { useSocket } from './hooks/useSocket';

export default function App() {
  useSocket();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-void bg-grid-pattern bg-grid relative">
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-atrium-500/[0.02] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-atrium-700/[0.02] rounded-full blur-[100px]" />
        </div>

        <Sidebar />

        <main className="ml-[220px] min-h-screen relative">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/auction" element={<AuctionLive />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
