import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(timestamp));
}

export default function App() {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [assignedName, setAssignedName] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    const nextSocket = io({
      transports: ["websocket", "polling"]
    });

    nextSocket.on("connect", () => setStatus("connected"));
    nextSocket.on("disconnect", () => setStatus("disconnected"));
    nextSocket.on("connect_error", () => setStatus("disconnected"));
    nextSocket.on("chat:user-assigned", ({ name }) => setAssignedName(name));
    nextSocket.on("chat:history", (history) => {
      setMessages(Array.isArray(history) ? history : []);
    });
    nextSocket.on("chat:message", (message) => {
      setMessages((current) => [...current, message]);
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !socket || status !== "connected") {
      return;
    }

    socket.emit("chat:message", { text });
    setDraft("");
  }

  return (
    <main className="app-shell">
      <section className="chat-panel" aria-label="Global chatroom">
        <header className="chat-header">
          <div>
            <h1>SigitChat</h1>
            <p>{assignedName ? `You are ${assignedName}` : "Waiting for assignment"}</p>
          </div>
          <span className={`status status-${status}`}>{status}</span>
        </header>

        <div className="message-list" role="log" aria-live="polite">
          {messages.length === 0 ? (
            <div className="empty-state">No messages yet.</div>
          ) : (
            messages.map((message) => (
              <article className="message" key={message.id}>
                <div className="message-meta">
                  <strong>{message.senderName}</strong>
                  <time dateTime={message.timestamp}>{formatTime(message.timestamp)}</time>
                </div>
                <p>{message.text}</p>
              </article>
            ))
          )}
          <div ref={endRef} />
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <input
            aria-label="Message"
            autoComplete="off"
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message"
            value={draft}
          />
          <button disabled={!draft.trim() || status !== "connected"} type="submit">
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
