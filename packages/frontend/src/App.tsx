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
      <div className="min-h-screen bg-surface">
        <Sidebar />
        <main className="ml-[240px] min-h-screen">
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
