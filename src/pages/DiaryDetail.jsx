import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function DiaryDetail() {
  const { id } = useParams();

  const [diary, setDiary] = useState({
    id: id || "new",
    title: "",
    cover: "", 
    content: "",
    date: "",
  });

  useEffect(() => {
    const today = new Date();
    const formatted = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    setDiary((prev) => ({ ...prev, date: formatted }));

  }, [id]);

  const fileInputRef = useRef(null);

  const handleCoverClick = () => {
    fileInputRef.current?.click();
  };

  const handleCoverChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setDiary((prev) => ({ ...prev, cover: url }));
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14">
        <Header />

        <main className="p-6">
          {/* Cover large */}
          <div
            className="w-full h-40 bg-gray-200 rounded-md mb-6 overflow-hidden flex items-center justify-center relative"
            onClick={handleCoverClick}
            role="button"
          >
            {diary.cover ? (
              <img src={diary.cover} alt="cover" className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-500">Thêm hình ảnh</div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <input
              value={diary.title}
              onChange={(e) => setDiary((p) => ({ ...p, title: e.target.value }))}
              placeholder="Tiêu đề"
              className="text-3xl font-bold w-full focus:outline-none border-none"
            />
            <div className="text-gray-400 text-sm ml-6 whitespace-nowrap">{diary.date}</div>
          </div>

          <div className="border-t border-gray-200 mb-4" />

          <ContentEditor
            initialValue={diary.content}
            onChange={(value) => setDiary((p) => ({ ...p, content: value }))}
          />
        </main>
      </div>
    </div>
  );
}

function ContentEditor({ initialValue, onChange }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue || "");
  const ref = useRef(null);

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  return (
    <div>
      {!editing && !value ? (
        <div
          className="text-gray-400 cursor-text"
          onClick={() => setEditing(true)}
        >
          Nhập nội dung
        </div>
      ) : null}

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange && onChange(e.target.value);
        }}
        onBlur={() => {
          if (value === "") setEditing(false);
        }}
        className="w-full min-h-[300px] border-none focus:outline-none resize-none text-gray-700"
        placeholder=""
      />

      <div className="flex justify-center">
            <button className="bg-[#4aa6e0] hover:bg-[#77BEF0] text-white font-semibold px-8 py-3 rounded-full shadow-md transition">
              Lưu
            </button>
          </div>
      
    </div>
    
  );
}
