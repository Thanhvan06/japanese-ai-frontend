import { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlay, FaCheck, FaTimes } from "react-icons/fa";

export default function TodoList({ onStartTask }) {
  const [todos, setTodos] = useState([]);
  
  // State cho thêm mới
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoTime, setNewTodoTime] = useState(""); // State cho thời gian (phút)

  // State cho edit
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editTime, setEditTime] = useState(""); // State edit thời gian

  // Load todos
  useEffect(() => {
    const savedTodos = localStorage.getItem("studyRoomTodos");
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (e) {
        console.error("Error loading todos:", e);
      }
    }
  }, []);

  // Save todos
  useEffect(() => {
    localStorage.setItem("studyRoomTodos", JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      const newTodo = {
        id: Date.now(),
        text: newTodoText.trim(),
        duration: newTodoTime ? parseInt(newTodoTime) : 0, // Lưu thời gian (phút)
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTodos([...todos, newTodo]);
      setNewTodoText("");
      setNewTodoTime("");
    }
  };

  const handleToggleComplete = (id) => {
    setTodos(todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleDelete = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // --- Chức năng Edit ---
  const handleStartEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditTime(todo.duration || ""); 
  };

  const handleSaveEdit = (id) => {
    if (editText.trim()) {
      setTodos(todos.map((todo) =>
          todo.id === id ? { 
            ...todo, 
            text: editText.trim(),
            duration: editTime ? parseInt(editTime) : 0 
          } : todo
      ));
      setEditingId(null);
      setEditText("");
      setEditTime("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditTime("");
  };
  // ---------------------

  // Xử lý khi bấm nút Play trên task
  const handlePlayTask = (todo) => {
    if (onStartTask) {
        // Gửi duration của task này ra component cha
        onStartTask(todo.duration);
    }
  };

  const activeTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <div>
      <h4 className="font-semibold mb-4">Danh sách công việc</h4>

      {/* Input thêm task mới */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex gap-2 bg-gray-200 bg-opacity-20 rounded px-2">
            <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
            placeholder="Tên công việc..."
            className="flex-1 py-2 bg-transparent text-sm text-black placeholder-black placeholder-opacity-50 focus:outline-none"
            />
            <input 
                type="number"
                value={newTodoTime}
                onChange={(e) => setNewTodoTime(e.target.value)}
                placeholder="Phút"
                className="w-16 py-2 bg-transparent text-sm text-black placeholder-black placeholder-opacity-50 focus:outline-none text-right border-l border-gray-400 border-opacity-30"
            />
        </div>
        <button
          onClick={handleAddTodo}
          className="px-4 py-2 bg-[#50B0FA] hover:bg-[#238ACC] rounded text-sm font-medium text-white transition-colors"
        >
          Thêm
        </button>
      </div>

      {/* Danh sách Active */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {activeTodos.map((todo) => (
          <div key={todo.id} className="flex items-center gap-2 p-2 bg-white bg-opacity-10 rounded hover:bg-opacity-20 transition-all border border-transparent hover:border-white hover:border-opacity-20">
            
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggleComplete(todo.id)}
              className="rounded cursor-pointer"
            />

            {editingId === todo.id ? (
              <div className="flex-1 flex gap-1 items-center">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 px-2 py-1 bg-white bg-opacity-80 rounded text-sm text-black focus:outline-none"
                  autoFocus
                />
                <input 
                    type="number"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="Min"
                    className="w-12 px-1 py-1 bg-white bg-opacity-80 rounded text-sm text-black focus:outline-none text-center"
                />
                <button onClick={() => handleSaveEdit(todo.id)} className="p-1 text-green-600 bg-white rounded hover:bg-green-100">
                    <FaCheck />
                </button>
                <button onClick={handleCancelEdit} className="p-1 text-red-500 bg-white rounded hover:bg-red-100">
                    <FaTimes />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 flex justify-between items-center text-sm">
                    <span className={todo.completed ? "line-through opacity-50" : ""}>
                        {todo.text}
                    </span>
                    {todo.duration > 0 && (
                        <span className="text-xs bg-gray-500 bg-opacity-20 px-2 py-0.5 rounded text-gray-700 ml-2">
                            {todo.duration}p
                        </span>
                    )}
                </div>

                <div className="flex gap-1">
                    {/* Nút Play */}
                    {todo.duration > 0 && (
                        <button 
                            onClick={() => handlePlayTask(todo)}
                            title="Bắt đầu làm task này"
                            className="p-1.5 hover:bg-blue-500 hover:text-white rounded-full transition-colors text-[#50B0FA]"
                        >
                            <FaPlay className="w-3 h-3" />
                        </button>
                    )}
                    
                    <button onClick={() => handleStartEdit(todo)} className="p-1.5 hover:bg-yellow-500 hover:text-white rounded-full transition-colors text-gray-600">
                        <FaEdit className="w-3 h-3" />
                    </button>
                    
                    <button onClick={() => handleDelete(todo.id)} className="p-1.5 hover:bg-red-500 hover:text-white rounded-full transition-colors text-red-500">
                        <FaTrash className="w-3 h-3" />
                    </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      
       {/* Completed Todos */}
       {completedTodos.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <div className="text-xs text-green-500 text-opacity-60 mb-2">Hoàn thành</div>
            {completedTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-2 p-2 bg-white bg-opacity-5 rounded"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleComplete(todo.id)}
                  className="rounded"
                />
                <span className="flex-1 text-sm line-through text-black text-opacity-50">
                  {todo.text}
                </span>
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="p-1 hover:bg-gray-200 hover:bg-opacity-20 rounded transition-colors"
                  aria-label="Delete"
                >
                  <FaTrash className="w-3 h-3 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}