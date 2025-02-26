import React, { createContext, useContext, ReactNode } from "react";
import useSocket from "./useFlaskSocket";

interface SocketProviderProps {
    serverUrl: string;
    children: ReactNode;
  }
  
  const SocketContext = createContext<any>(null);
  
  export const SocketProvider: React.FC<SocketProviderProps> = ({ serverUrl, children }) => {
    const socketData = useSocket(serverUrl);
    return (
      <SocketContext.Provider value={socketData}>
        {children}
      </SocketContext.Provider>
    );
  };
  
  export const useSocketContext = () => {
    return useContext(SocketContext);
  };