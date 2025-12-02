import React, { useEffect, useState } from "react";
import styles from "../styles/Chatbot.module.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { FiTrash2, FiPlus, FiMic } from "react-icons/fi";
import axios from "axios";

const API_BASE = "http://localhost:4000/api/chat"; 

const Chatbot = () => {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]); 
  const [selectedChat, setSelectedChat] = useState(null); 
  const [messages, setMessages] = useState([]);

  // TODO: sau này lấy từ auth / tokengit
  const userId = 1;

  // ==== load danh sách sessions khi vào trang ====
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await axios.get(`${API_BASE}/sessions`, {
          params: { user_id: userId },
        });
        setChatHistory(res.data);
      } catch (err) {
        console.error("Fetch sessions error:", err);
      }
    };
    fetchSessions();
  }, [userId]);

  // ==== load messages của 1 session ====
  const loadMessages = async (sessionId) => {
    try {
      const res = await axios.get(`${API_BASE}/messages/${sessionId}`);
      const msgs = res.data.map((m) => ({
        id: m.message_id,
        from: m.sender_type === "user" ? "user" : "bot",
        text: m.content,
      }));
      setMessages(msgs);
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  };

  // ==== tạo new chat (session mới) ====
  const handleNewChat = async () => {
    try {
      const res = await axios.post(`${API_BASE}/sessions`, {
        user_id: userId,
      });
      const newSession = res.data; // { session_id, topic, ... }

      setChatHistory((prev) => [newSession, ...prev]);
      setSelectedChat(newSession.session_id);
      setMessages([]);
      setInput("");
    } catch (err) {
      console.error("Create session error:", err);
    }
  };

  // ==== gửi message ====
  const handleSend = async () => {
    if (!input.trim()) return;

    let sessionId = selectedChat;
    let firstQuestion = input;

    try {
      // nếu chưa có session → tạo mới
      if (!sessionId) {
        const sessionRes = await axios.post(`${API_BASE}/sessions`, {
          user_id: userId,
          topic: firstQuestion,
        });
        const newSession = sessionRes.data;
        sessionId = newSession.session_id;
        setSelectedChat(sessionId);
        setChatHistory((prev) => [newSession, ...prev]);
      }

      const userMsg = { from: "user", text: input };
      const textToSend = input;
      setInput("");
      setMessages((prev) => [...prev, userMsg]);

      const res = await axios.post(`${API_BASE}/send`, {
        session_id: sessionId,
        content: textToSend,
      });

      const { botMessage } = res.data;
      const botMsg = { from: "bot", text: botMessage.content };
      setMessages((prev) => [...prev, botMsg]);

      // update topic hiển thị trong danh sách
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.session_id === sessionId
            ? { ...chat, topic: chat.topic || textToSend.slice(0, 100) }
            : chat
        )
      );
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const handleSelectChat = async (sessionId) => {
    setSelectedChat(sessionId);
    await loadMessages(sessionId);
  };

   const handleDeleteChat = async (sessionId) => {
    try {
      // gửi yêu cầu xóa lên backend
      await axios.delete(`${API_BASE}/sessions/${sessionId}`, {
        data: { user_id: userId },
      });

      // cập nhật UI sau khi xóa DB thành công
      const updated = chatHistory.filter((c) => c.session_id !== sessionId);
      setChatHistory(updated);
      if (selectedChat === sessionId) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Delete session error:", err);
      // tùy chọn: hiển thị thông báo lỗi cho user
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const isEmptyState = chatHistory.length === 0 && messages.length === 0;

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <div className={styles.chatContainer}>
          {isEmptyState && (
            <div className={styles.emptyState}>
              <h3>Bạn muốn học gì?</h3>
              <div className={styles.inputBox}>
                <FiPlus />
                <input
                  type="text"
                  placeholder="Hỏi gì đó đi..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <FiMic />
              </div>
            </div>
          )}

          {!isEmptyState && (
            <div className={styles.chatLayout}>
              {/* sidebar trái */}
              <div className={styles.sidebarChat}>
                <button className={styles.newChatBtn} onClick={handleNewChat}>
                  <FiPlus />
                  <span>New chat</span>
                </button>

                <div className={styles.chatList}>
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.session_id}
                      className={`${styles.chatItem} ${
                        selectedChat === chat.session_id ? styles.active : ""
                      }`}
                      onClick={() => handleSelectChat(chat.session_id)}
                      title={chat.topic || "New chat"}
                    >
                      <span className={styles.chatTitle}>
                        {chat.topic || "New chat"}
                      </span>
                      <FiTrash2
                        className={styles.deleteIcon}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.session_id);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* khung chat chính */}
              <div className={styles.chatBox}>
                <div className={styles.messages}>
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={
                        msg.from === "user" ? styles.userMsg : styles.botMsg
                      }
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                <div className={styles.inputBox}>
                  <FiPlus />
                  <input
                    type="text"
                    placeholder="Hỏi gì đó đi..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <FiMic />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
