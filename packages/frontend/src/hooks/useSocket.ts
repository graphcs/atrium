import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuctionStore } from '../stores/auction-store';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const addBidResult = useAuctionStore((s) => s.addBidResult);
  const setMetrics = useAuctionStore((s) => s.setMetrics);
  const setSimulatorState = useAuctionStore((s) => s.setSimulatorState);

  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('bid_result', addBidResult);
    socket.on('metrics_update', setMetrics);
    socket.on('simulator_state', setSimulatorState);

    return () => {
      socket.disconnect();
    };
  }, [addBidResult, setMetrics, setSimulatorState]);

  return socketRef.current;
}
