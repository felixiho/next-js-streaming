"use client";

import React, { useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

const Websocket = () => {
  const [messages, setMessages] = useState<string[]>([]);

  const { isConnected, sendMessage } = useWebSocket("ws://localhost:3000/ws", {
    onOpen: () => console.log("WebSocket connected"),
    onMessage: (event) => {
      console.log("Received message:", event.data);
      setMessages((prev) => [...prev, event.data]);
    },
    onClose: () => console.log("WebSocket disconnected"),
    onError: (event) => console.error("WebSocket error:", event),
  });

  const handleSendMessage = () => {
    sendMessage("Hello from Next.js!");
  };

  return (
    <div>
      <h1>WebSocket Demo</h1>
      <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>
      <button onClick={handleSendMessage} disabled={!isConnected}>
        Send Message
      </button>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};

export default Websocket;
