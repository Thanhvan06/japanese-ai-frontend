import { useState, useRef, useEffect } from "react";
import { FaStickyNote, FaTimes } from "react-icons/fa";

const NOTE_COLORS = [
  "bg-yellow-200",
  "bg-pink-200",
  "bg-green-200",
  "bg-blue-200",
  "bg-purple-200",
];

export default function DraggableNote({ note, onUpdate, onDelete, onColorChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: note.x || 0, y: note.y || 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const noteRef = useRef(null);

  useEffect(() => {
    setPosition({ x: note.x || 0, y: note.y || 0 });
  }, [note.x, note.y]);

  const handleMouseDown = (e) => {
    if (e.target.closest('textarea, button, input')) return;
    
    setIsDragging(true);
    const rect = noteRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    let currentPosition = { ...position };

    const handleMouseMove = (e) => {
      if (!noteRef.current) return;
      const parentRect = noteRef.current.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
      const newX = e.clientX - parentRect.left - dragOffset.x;
      const newY = e.clientY - parentRect.top - dragOffset.y;
      currentPosition = { 
        x: Math.max(0, Math.min(newX, (noteRef.current.offsetParent?.clientWidth || window.innerWidth) - 250)),
        y: Math.max(0, Math.min(newY, (noteRef.current.offsetParent?.clientHeight || window.innerHeight) - 200))
      };
      setPosition(currentPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (onUpdate) {
        onUpdate(note.id, { ...note, x: currentPosition.x, y: currentPosition.y });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, note, onUpdate, position]);

  return (
    <div
      ref={noteRef}
      className={`absolute ${note.color} rounded-lg shadow-lg cursor-move ${
        isDragging ? "z-50 opacity-90" : "z-40"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "250px",
      }}
    >
      {/* Header - Draggable area */}
      <div
        className="px-3 py-2 bg-black bg-opacity-10 rounded-t-lg flex items-center justify-between cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <FaStickyNote className="w-4 h-4 text-gray-600" />
          <span className="text-xs font-medium text-gray-700">Ghi chú</span>
        </div>
        <button
          onClick={() => onDelete(note.id)}
          className="text-xs text-gray-600 hover:text-red-600 transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <FaTimes />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <textarea
          value={note.content}
          onChange={(e) => onUpdate(note.id, { ...note, content: e.target.value })}
          className="w-full bg-transparent text-sm resize-none focus:outline-none text-gray-800"
          rows={6}
          placeholder="Viết ghi chú..."
          onMouseDown={(e) => e.stopPropagation()}
        />

        {/* Color picker */}
        <div className="flex gap-1 mt-2 pt-2 border-t border-gray-300 border-opacity-30">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(note.id, color)}
              className={`w-5 h-5 rounded-full ${color} border-2 transition-all ${
                note.color === color ? "border-gray-600 scale-110" : "border-transparent"
              }`}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

