import React, { useEffect, useState, createContext, useContext } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const SocketContext = createContext<{ socket: Socket | null }>({ socket: null });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast, error } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const socketUrl = import.meta.env.VITE_WS_URL || "http://localhost:3001";
    const newSocket = io(socketUrl);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      newSocket.emit("join", user.id);
    });

    // SOS Alerts
    newSocket.on("sos_alert", (data: any) => {
      error(`🚨 EMERGENCY SOS: ${data.message || "Outbreak reported near you!"}`);
    });

    // Detection Alerts
    newSocket.on("detection_alert", (data: any) => {
      toast(`🦠 New ${data.disease} reported in ${data.district}!`, 'info');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, toast, error]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);
