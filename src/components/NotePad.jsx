import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

const NOTE_COLORS = [
  "bg-yellow-200",
  "bg-pink-200",
  "bg-green-200",
  "bg-blue-200",
  "bg-purple-200",
];

export default function NotePad({ onNotesChange }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");

  // Load notes
  useEffect(() => {
    const saved = localStorage.getItem("studyRoomNotes");
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, []);

  // Save notes
  useEffect(() => {
    localStorage.setItem("studyRoomNotes", JSON.stringify(notes));
    if (onNotesChange) {
      onNotesChange(notes);
    }
  }, [notes, onNotesChange]);

  const addNote = () => {
    if (!newNote.trim()) return;

    const randomX = Math.random() * (window.innerWidth - 300);
    const randomY = Math.random() * (window.innerHeight - 200) + 100;

    setNotes([
      ...notes,
      {
        id: Date.now(),
        content: newNote,
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
        x: randomX,
        y: randomY,
      },
    ]);
    setNewNote("");
  };

  const updateNote = (id, content) => {
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, content } : note
      )
    );
  };

  const deleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const changeColor = (id, color) => {
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, color } : note
      )
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h4 className="font-semibold mb-3 text-lg">Ghi chú</h4>
  
      {/* Input Area mới - Dùng textarea rộng hơn */}
      <div className="flex flex-col gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Thêm ghi chú mới..."
          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none border focus:ring-2 focus:ring-[#50B0FA] transition-all"
          rows={3}
        />
        <div className="flex justify-center">
          <button
            onClick={addNote}
            className="px-8 py-2 text-sm font-medium rounded-full bg-[#50B0FA] hover:bg-[#238ACC] text-white shadow-sm transition-all active:scale-95"
          >
            Thêm ghi chú
          </button>
        </div>
      </div>
  
      {/* Danh sách ghi chú */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`${note.color} rounded-xl p-4 shadow-md flex flex-col min-h-[200px] transition-transform hover:scale-[1.02]`}
          >
            {/* Textarea nội dung chiếm toàn bộ không gian phía trên */}
            <textarea
              value={note.content}
              onChange={(e) => updateNote(note.id, e.target.value)}
              className="w-full bg-transparent text-sm resize-none focus:outline-none flex-1 leading-relaxed"
              placeholder="Nội dung ghi chú..."
            />
  
            {/* Actions - Căn giữa phía dưới */}
            <div className="flex flex-col items-center gap-3 mt-4 pt-3 border-t border-black/10">
              {/* Chọn màu */}
              <div className="flex gap-2">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => changeColor(note.id, color)}
                    className={`w-6 h-6 rounded-full ${color} border border-black/10 hover:ring-2 ring-offset-1 ring-gray-400 transition-all`}
                  />
                ))}
              </div>
              
              {/* Nút xóa */}
              <button
                onClick={() => deleteNote(note.id)}
                className="p-2 rounded-full bg-white/40 hover:bg-red-100 hover:text-red-600 transition-colors text-black/60"
                title="Xóa ghi chú"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
