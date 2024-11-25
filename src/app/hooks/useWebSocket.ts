import { useEffect, useRef, useState } from "react";

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (
  url: string,et
  options: UseWebSocketOptions = {}
) => {
  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const webSocketRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);

  const connectWebSocket = () => {
    setIsReconnecting(false);
    attemptsRef.current = 0;

    const ws = new WebSocket(url);
    webSocketRef.current = ws;

    ws.onopen = (event) => {
      setIsConnected(true);
      setIsReconnecting(false);
      if (onOpen) onOpen(event);
    };

    ws.onmessage = (event) => {
      if (onMessage) onMessage(event);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      if (onClose) onClose(event);

      // Attempt reconnection if allowed
      if (attemptsRef.current < reconnectAttempts) {
        setIsReconnecting(true);
        attemptsRef.current++;
        setTimeout(connectWebSocket, reconnectInterval);
      }
    };

    ws.onerror = (event) => {
      if (onError) onError(event);
    };
  };

  useEffect(() => {
    connectWebSocket();

    // Cleanup on component unmount
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [url]);

  const sendMessage = (message: string) => {
    if (
      webSocketRef.current &&
      webSocketRef.current.readyState === WebSocket.OPEN
    ) {
      webSocketRef.current.send(message);
    } else {
      console.error("WebSocket is not open. Unable to send message.");
    }
  };

  return { isConnected, isReconnecting, sendMessage };
};
