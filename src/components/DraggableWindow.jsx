import { useState, useRef, useEffect } from "react";
import { FaTimes, FaWindowMinimize } from "react-icons/fa";

export default function DraggableWindow({
  id,
  title,
  icon: Icon,
  children,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 400, height: 500 },
  onClose,
  onMinimize,
  isMinimized = false,
  zIndex = 10,
  onZIndexChange,
}) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef(null);

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  const handleMouseDown = (e) => {
    if (e.target.closest('button, input, textarea, select')) return;
    setIsDragging(true);
    const rect = windowRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    if (onZIndexChange) {
      onZIndexChange(id);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!windowRef.current) return;
      const parentRect = windowRef.current.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
      const newX = e.clientX - parentRect.left - dragOffset.x;
      const newY = e.clientY - parentRect.top - dragOffset.y;
      const maxX = (windowRef.current.offsetParent?.clientWidth || window.innerWidth) - initialSize.width;
      const maxY = (windowRef.current.offsetParent?.clientHeight || window.innerHeight) - 50;
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, initialSize.width]);

  if (isMinimized) {
    return (
      <div
        ref={windowRef}
        className="fixed bg-white rounded-lg shadow-lg border border-gray-300 cursor-pointer"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '200px',
          height: '40px',
          zIndex: zIndex,
        }}
        onClick={() => onMinimize && onMinimize(id, false)}
      >
        <div className="h-full flex items-center justify-between px-3 bg-gray-100 rounded-t-lg">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="text-sm" />}
            <span className="text-sm font-medium text-gray-700 truncate">{title}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className={`fixed bg-white rounded-lg shadow-2xl border border-gray-300 ${
        isDragging ? 'cursor-move' : ''
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${initialSize.width}px`,
        height: `${initialSize.height}px`,
        zIndex: zIndex,
      }}
    >
      {/* Header */}
      <div
        className="h-10 bg-gray-100 rounded-t-lg flex items-center justify-between px-3 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon className="text-sm text-gray-600 flex-shrink-0" />}
          <span className="text-sm font-medium text-gray-700 truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onMinimize && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMinimize(id, true);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Minimize"
            >
              <FaWindowMinimize className="text-xs text-gray-600" />
            </button>
          )}
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(id);
              }}
              className="p-1 hover:bg-red-200 rounded transition-colors"
              aria-label="Close"
            >
              <FaTimes className="text-xs text-gray-600 hover:text-red-600" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-2.5rem)] overflow-auto p-4">
        {children}
      </div>
    </div>
  );
}

