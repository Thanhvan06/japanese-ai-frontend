import React, { useState } from "react";
import styles from "../styles/Chatbot.module.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { FiTrash2 } from "react-icons/fi";
import { FiPlus, FiMic } from "react-icons/fi";

const Chatbot = () => {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input };
    const botMsg = { from: "bot", text: "Phân tích: " + input };

    if (selectedChat === null) {
      const newChat = {
        id: Date.now(),
        title: input,
        history: [userMsg, botMsg],
      };
      setChatHistory([newChat, ...chatHistory]);
      setSelectedChat(newChat.id);
      setMessages(newChat.history);
    } else {
      const updated = chatHistory.map((chat) =>
        chat.id === selectedChat
          ? { ...chat, history: [...chat.history, userMsg, botMsg] }
          : chat
      );
      setChatHistory(updated);
      setMessages((prev) => [...prev, userMsg, botMsg]);
    }
    setInput("");
  };

  const handleSelectChat = (id) => {
    const chat = chatHistory.find((c) => c.id === id);
    setSelectedChat(id);
    setMessages(chat.history);
  };

  const handleDeleteChat = (id) => {
    const updated = chatHistory.filter((chat) => chat.id !== id);
    setChatHistory(updated);
    if (selectedChat === id) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <div className={styles.chatContainer}>
          {/* ===== Giao diện trống ===== */}
          {chatHistory.length === 0 && (
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

          {chatHistory.length > 0 && (
            <div className={styles.chatLayout}>
              <div className={styles.sidebarChat}>
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`${styles.chatItem} ${
                      selectedChat === chat.id ? styles.active : ""
                    }`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <span>{chat.title}</span>
                    <FiTrash2
                      className={styles.deleteIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.chatBox}>
                <div className={styles.messages}>
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={
                        msg.from === "user"
                          ? styles.userMsg
                          : styles.botMsg
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
