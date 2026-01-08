import React, { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { FiTrash2, FiPlus, FiMic, FiSend } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import axios from "axios";

const API_BASE = "http://localhost:4000/api/chat"; 

const Chatbot = () => {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]); 
  const [selectedChat, setSelectedChat] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // TODO: sau này lấy từ auth / token
  const userId = 1;

  // Auto scroll to bottom khi có message mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    if (!input.trim() || isLoading) return;

    let sessionId = selectedChat;
    let firstQuestion = input;

    setIsLoading(true);

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
      const errorMsg = { 
        from: "bot", 
        text: "❌ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau." 
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmptyState = chatHistory.length === 0 && messages.length === 0;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 flex overflow-hidden min-h-0">
          {isEmptyState ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="max-w-2xl w-full text-center">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-[#4aa6e0] rounded-full mb-4">
                    <FaRobot className="text-white text-4xl" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    Chào mừng đến với Chatbot AI
                  </h2>
                  <p className="text-gray-600">
                    Hỏi tôi bất cứ điều gì về tiếng Nhật!
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <FiPlus className="text-gray-400 text-xl" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Ví dụ: 'Cách sử dụng は và が?' hoặc 'Giải thích ngữ pháp N5'..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="p-2 bg-[#4aa6e0] text-white rounded-lg hover:bg-[#3a8bc0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiSend />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setInput("Giải thích ngữ pháp N5")}>
                    <h3 className="font-semibold text-gray-800 mb-2">💡 Ngữ pháp</h3>
                    <p className="text-sm text-gray-600">Hỏi về ngữ pháp tiếng Nhật</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setInput("Từ vựng về gia đình")}>
                    <h3 className="font-semibold text-gray-800 mb-2">📚 Từ vựng</h3>
                    <p className="text-sm text-gray-600">Học từ vựng theo chủ đề</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setInput("Cách phát âm は và わ")}>
                    <h3 className="font-semibold text-gray-800 mb-2">🗣️ Phát âm</h3>
                    <p className="text-sm text-gray-600">Cải thiện phát âm</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setInput("Bài tập luyện tập")}>
                    <h3 className="font-semibold text-gray-800 mb-2">✏️ Luyện tập</h3>
                    <p className="text-sm text-gray-600">Làm bài tập thực hành</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Sidebar */}
              <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <button
                  onClick={handleNewChat}
                  className="m-4 flex items-center gap-2 px-4 py-3 bg-[#4aa6e0] text-white rounded-lg hover:bg-[#3a8bc0] transition-colors font-medium"
                >
                  <FiPlus className="text-lg" />
                  <span>Cuộc trò chuyện mới</span>
                </button>

                <div className="flex-1 overflow-y-auto px-2 pb-4">
                  <div className="space-y-1">
                    {chatHistory.map((chat) => (
                      <div
                        key={chat.session_id}
                        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChat === chat.session_id
                            ? "bg-[#e0f7fa] border border-[#4aa6e0]"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleSelectChat(chat.session_id)}
                        title={chat.topic || "Cuộc trò chuyện mới"}
                      >
                        <span className="flex-1 text-sm text-gray-700 truncate">
                          {chat.topic || "Cuộc trò chuyện mới"}
                        </span>
                        <FiTrash2
                          className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.session_id);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat area */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
                {/* Messages area - scrollable */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-4 ${
                          msg.from === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.from === "bot" && (
                          <div className="w-8 h-8 rounded-full bg-[#4aa6e0] flex items-center justify-center flex-shrink-0">
                            <FaRobot className="text-white text-sm" />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            msg.from === "user"
                              ? "bg-[#4aa6e0] text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">
                            {msg.text}
                          </div>
                        </div>
                        {msg.from === "user" && (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-600 text-xs font-semibold">B</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-4 justify-start">
                        <div className="w-8 h-8 rounded-full bg-[#4aa6e0] flex items-center justify-center flex-shrink-0">
                          <FaRobot className="text-white text-sm" />
                        </div>
                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input area - fixed at bottom */}
                <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 shadow-sm">
                      <button
                        onClick={handleNewChat}
                        className="p-2 text-gray-400 hover:text-[#4aa6e0] transition-colors"
                        title="Cuộc trò chuyện mới"
                      >
                        <FiPlus className="text-xl" />
                      </button>
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Nhập câu hỏi của bạn..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 disabled:opacity-50"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2 bg-[#4aa6e0] text-white rounded-lg hover:bg-[#3a8bc0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Gửi (Enter)"
                      >
                        <FiSend />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
