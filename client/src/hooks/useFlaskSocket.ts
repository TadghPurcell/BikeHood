// useSocket.ts
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const useSocket = (serverUrl: string) => {
  // Create the socket instance immediately.
  const [socket] = useState<Socket>(() => {
    const newSocket = io(serverUrl, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
    });
    console.log("Socket created synchronously");
    return newSocket;
  });
  
  // We can initialize isConnected based on the socket's current status.
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const connectionStart = Date.now();
    console.log(`Attempting to connect to ${serverUrl} at ${new Date(connectionStart).toISOString()}`);
    
    socket.on("connect", () => {
      const connectTime = Date.now();
      console.log(`Socket.IO connected at ${new Date(connectTime).toISOString()} (took ${connectTime - connectionStart} ms)`);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error: any) => {
      console.error("Socket.IO connection error:", error);
    });

    socket.on("connect_timeout", (timeout: any) => {
      console.error("Socket.IO connection timeout:", timeout);
    });

    socket.on("bike_added", (data: any) => {
      console.log("Received 'bike_added' event:", data);
      setMessages((prev) => [...prev, data]);
    });

    socket.on("error", (error: any) => {
      console.error("Socket.IO error:", error);
    });

    return () => {
      console.log("Closing Socket.IO connection");
      console.log("Cleanup disabled for development: not closing Socket.IO connection");
      // socket.close();
    };
  }, [serverUrl, socket]);

  const sendMessage = (event: string, data: any) => {
    if (socket && socket.connected) {
      console.log(`Emitting event "${event}" with data:`, data);
      socket.emit(event, data);
    } else {
      console.warn(`Socket not connected (socket.connected: ${socket ? socket.connected : "no socket"}); cannot emit event "${event}"`);
    }
  };

  return { socket, isConnected, messages, sendMessage };
};

export default useSocket;