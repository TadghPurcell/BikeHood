import { useState, useEffect, useRef } from "react";

const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      console.log("Received:", event.data);
      setMessages((prev) => [...prev, event.data]); 
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const sendMessage = (message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log("Sending:", message);
      socketRef.current.send(message);
    } else {
      console.warn("WebSocket is not connected");
    }
  };

  return { isConnected, messages, sendMessage };
};

export default useWebSocket;
