import { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Load todos from localStorage
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

  // Save todos to localStorage
  useEffect(() => {
    localStorage.setItem("studyRoomTodos", JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      const newTodo = {
        id: Date.now(),
        text: newTodoText.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTodos([...todos, newTodo]);
      setNewTodoText("");
    }
  };

  const handleToggleComplete = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDelete = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleStartEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const handleSaveEdit = (id) => {
    if (editText.trim()) {
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, text: editText.trim() } : todo
        )
      );
      setEditingId(null);
      setEditText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const activeTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <div>
      <h4 className="font-semibold mb-4">Danh sách công việc</h4>

      {/* Add Todo Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
          placeholder="Thêm công việc mới..."
          className="flex-1 px-3 py-2 bg-gray-200 bg-opacity-20 rounded text-sm text-black placeholder-black placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-opacity-50"
        />
        <button
          onClick={handleAddTodo}
          className="px-4 py-2 bg-[#50B0FA] hover:bg-[#238ACC] hover:bg-opacity-20 rounded text-sm font-medium hover:bg-opacity-40 transition-colors text-white"
        >
          Thêm
        </button>
      </div>

      {/* Todo List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {/* Active Todos */}
        {activeTodos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-2 p-2 bg-white bg-opacity-10 rounded"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggleComplete(todo.id)}
              className="rounded"
            />
            {editingId === todo.id ? (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSaveEdit(todo.id);
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="flex-1 px-2 py-1 bg-white bg-opacity-30 rounded text-sm text-white focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit(todo.id)}
                  className="px-2 py-1 bg-white bg-opacity-30 rounded text-xs hover:bg-opacity-40"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-2 py-1 bg-white bg-opacity-30 rounded text-xs hover:bg-opacity-40"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <span
                  className={`flex-1 text-sm ${
                    todo.completed ? "line-through text-white text-opacity-50" : ""
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => handleStartEdit(todo)}
                  className="p-1 hover:bg-gray-200 hover:bg-opacity-20 rounded transition-colors"
                  aria-label="Edit"
                >
                  <FaEdit className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="p-1 hover:bg-gray-200 hover:bg-opacity-20 rounded transition-colors"
                  aria-label="Delete"
                >
                  <FaTrash className="w-3 h-3 text-red-600" />
                </button>
              </>
            )}
          </div>
        ))}

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

        {todos.length === 0 && (
          <div className="text-center text-sm text-black text-opacity-50 py-4">
            Chưa có công việc nào
          </div>
        )}
      </div>
    </div>
  );
}

