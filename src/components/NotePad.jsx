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
    <div>
      <h4 className="font-semibold mb-3">Ghi chú</h4>

      {/* Add note */}
      <div className="flex gap-2 mb-4">
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Thêm ghi chú mới..."
          className="flex-1 px-3 py-2 rounded text-sm focus:outline-none"
        />
        <button
          onClick={addNote}
          className="px-3 py-2 text-sm rounded bg-[#50B0FA] hover:bg-[#238ACC] text-white"
        >
          Thêm
        </button>
      </div>

      {/* Notes list */}
      <div className="grid grid-cols-2 gap-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`${note.color} rounded-lg p-3 relative shadow-md`}
          >
            <textarea
              value={note.content}
              onChange={(e) =>
                updateNote(note.id, e.target.value)
              }
              className="w-full bg-transparent text-sm resize-none focus:outline-none"
              rows={4}
            />

            {/* Actions */}
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-1">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => changeColor(note.id, color)}
                    className={`w-4 h-4 rounded-full ${color} border`}
                  />
                ))}
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                className="text-xs text-black/60 hover:text-black"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
