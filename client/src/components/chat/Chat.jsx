import { useContext, useEffect, useRef, useState } from "react";
import "./chat.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { format } from "timeago.js";
import { SocketContext } from "../../context/SocketContext";
import { useNotificationStore } from "../../lib/notificationStore";

function Chat({ chats }) {
  const [chat, setChat] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const messageEndRef = useRef();
  const decrease = useNotificationStore((state) => state.decrease);

 
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleOpenChat = async (id, receiver) => {
    try {
      const res = await apiRequest("/chats/" + id);
      if (!res.data.seenBy?.includes(currentUser.id)) {
        decrease();
      }
      setChat({ ...res.data, receiver });
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const text = formData.get("text");

  if (!text) return;
  try {
    const res = await apiRequest.post("/messages/" + chat.id, { text });
    setChat((prev) => ({ ...prev, messages: [...prev.messages, res.data] }));
    e.target.reset();

    
    if (socket && socket.connected) {
      socket.emit("sendMessage", {
        receiverId: chat.receiver.id,
        data: res.data,
      });
    } else {
      
      console.warn("Socket disconnected. Message saved but not emitted live.");
    }
  } catch (err) {
    console.log(err);
  }
};

  useEffect(() => {
    const read = async () => {
      try {
        await apiRequest.put("/chats/read/" + chat.id);
      } catch (err) {
        console.log(err);
      }
    };

    
    if (chat && socket) {
      socket.on("getMessage", (data) => {
        if (chat.id === data.chatId) {
          setChat((prev) => ({ ...prev, messages: [...prev.messages, data] }));
          read();
        }
      });
    }
    return () => {
      socket?.off("getMessage");
    };
  }, [socket, chat]);

  return (
    <div className="chat">
      <div className={`messages ${chat ? "hidden" : ""}`}>
        <h1>Messages</h1>
        <div className="list">
          {chats?.map((c) => {
            if (!c.receiver) return null; 

            return (
              <div
                className={`message ${
                  c.seenBy?.includes(currentUser.id) || chat?.id === c.id
                    ? "read"
                    : "unread"
                }`}
                key={c.id}
                onClick={() => handleOpenChat(c.id, c.receiver)}
              >
                <img src={c.receiver.avatar || "/noavatar.jpg"} alt="" />
                <div className="content">
                  <span className="username">{c.receiver.username}</span>
                  <p className="preview">{c.lastMessage || "Start a conversation..."}</p>
                </div>
                {!c.seenBy?.includes(currentUser.id) && chat?.id !== c.id && (
                  <div className="dot"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {chat && (
        <div className="chatBox">
          <div className="top">
            <div className="user">
              <img src={chat.receiver?.avatar || "/noavatar.jpg"} alt="" />
              <div className="meta">
                <span className="name">{chat.receiver?.username || "Unknown User"}</span>
                <span className="status">Online</span>
              </div>
            </div>
            <span className="close" onClick={() => setChat(null)}>
              ✕
            </span>
          </div>
          
          <div className="center">
            {chat.messages?.map((message) => (
              <div
                className={`chatMessage ${
                  message.userId === currentUser.id ? "own" : ""
                }`}
                key={message.id}
              >
                <div className="bubble">
                  <p>{message.text}</p>
                </div>
                <span className="time">{format(message.createdAt)}</span>
              </div>
            ))}
            <div ref={messageEndRef}></div>
          </div>
          
          <form 
            onSubmit={handleSubmit} 
            className={`bottom ${currentUser.isRestricted ? "disabled" : ""}`}
          >
            <textarea 
              name="text" 
              placeholder={currentUser.isRestricted ? "Chat disabled (Account Restricted)" : "Type a message..."}
              disabled={currentUser.isRestricted}
            ></textarea>
            <button disabled={currentUser.isRestricted}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chat;