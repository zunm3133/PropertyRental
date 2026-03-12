import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  
  useEffect(() => {
    if (currentUser) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL);
      setSocket(newSocket);

      return () => newSocket.close();
    } else {
      socket?.disconnect();
      setSocket(null);
    }
  }, [currentUser]);

  
  useEffect(() => {
    if (currentUser && socket) {
      socket.emit("newUser", currentUser.id);
    }
  }, [currentUser, socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};