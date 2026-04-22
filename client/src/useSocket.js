import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useSocket = () => {
    const socketRef = useRef(null);

    if (!socketRef.current) {
        socketRef.current = io('/');
    }

    useEffect(() => {
        return () => socketRef.current.disconnect(); // cleanup on unmount
    }, []);

    return socketRef.current;
};