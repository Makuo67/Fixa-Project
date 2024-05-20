import { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client'


const SocketContext = createContext();


const SocketContextProvider = ({ children }) => {
     const [socket, setSocket] = useState(null);
     useEffect(() => {
          setSocket(io.connect(`${process.env.NEXT_PUBLIC_API_BASE_URL}`, {
               transports: ["websocket"]
          }));
     }, []);

     return (
          // the Provider gives access to the context to its children
          <SocketContext.Provider value={socket}>
               {children}
          </SocketContext.Provider>
     );

}
export { SocketContext, SocketContextProvider }
