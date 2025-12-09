import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { api } from "../lib/api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function DiaryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [diary, setDiary] = useState({
    id: id || "new",
    title: "",
    content_jp: "",
    images: [],
    date: "",
  });

  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const loadDiary = useCallback(async () => {
    if (!id || id === "new" || isNaN(parseInt(id, 10))) {
      return;
    }
    
    try {
      setLoading(true);
      const data = await api(`/api/diaries/${id}`);
      const date = new Date(data.created_at);
      const formatted = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      
      const existingImages = (data.images || []).map(img => ({
        url: img,
        preview: img.startsWith('/') ? `${BASE_URL}${img}` : img,
        isNew: false,
      }));
      
      setDiary({
        id: data.id,
        title: data.title || "",
        content_jp: data.content_jp || "",
        images: data.images || [],
        date: formatted,
      });
      setUploadedImages(existingImages);
    } catch (error) {
      console.error("Error loading diary:", error);
      alert("Không thể tải nhật ký");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const today = new Date();
    const formatted = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    setDiary((prev) => ({ ...prev, date: formatted }));

    if (!isNew && id) {
      loadDiary();
    }
  }, [id, isNew, loadDiary]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isNew: true,
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      const removed = newImages[index];
      if (removed.isNew && removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("title", diary.title);
      formData.append("content_jp", diary.content_jp);

      // Add new image files
      const newImageFiles = uploadedImages.filter(img => img.isNew && img.file);
      newImageFiles.forEach((img) => {
        formData.append("images", img.file);
      });

      // If updating, also send existing image URLs as separate field
      if (!isNew && id && !isNaN(parseInt(id, 10))) {
        const existingImageUrls = uploadedImages
          .filter(img => !img.isNew)
          .map(img => img.url);
        formData.append("existing_images", JSON.stringify(existingImageUrls));
      }

      const token = localStorage.getItem("token");
      const url = isNew 
        ? `${BASE_URL}/api/diaries`
        : `${BASE_URL}/api/diaries/${id}`;

      // Validate id for PUT requests
      if (!isNew && (!id || id === "new" || isNaN(parseInt(id, 10)))) {
        throw new Error("Invalid diary ID");
      }

      const response = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Lỗi khi lưu nhật ký");
      }

      await response.json();
      navigate("/diary");
    } catch (error) {
      console.error("Error saving diary:", error);
      alert(error.message || "Không thể lưu nhật ký");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || id === "new" || isNaN(parseInt(id, 10))) {
      return;
    }

    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/diaries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Lỗi khi xóa nhật ký");
      }

      navigate("/diary");
    } catch (error) {
      console.error("Error deleting diary:", error);
      alert(error.message || "Không thể xóa nhật ký");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 ml-14">
          <Header />
          <main className="p-6 flex items-center justify-center">
            <div className="text-gray-400">Đang tải...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14">
        <Header />

        <main className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <input
              value={diary.title}
              onChange={(e) => setDiary((p) => ({ ...p, title: e.target.value }))}
              placeholder="Tiêu đề nhật ký"
              className="text-3xl font-bold w-full focus:outline-none border-none"
            />
            <div className="flex items-center gap-4">
              <div className="text-gray-400 text-sm whitespace-nowrap">{diary.date}</div>
              {!isNew && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2"
                  title="Xóa nhật ký"
                >
                  <span>Xóa</span>
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 mb-6" />

          {/* Image Gallery */}
          {uploadedImages.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={img.preview || img.url || img}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
                      title="Xóa ảnh"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Images Button */}
          <div className="mb-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-2"
            >
              <span>📷</span>
              <span>Thêm ảnh</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* Content Editor */}
          <ContentEditor
            initialValue={diary.content_jp}
            onChange={(value) => setDiary((p) => ({ ...p, content_jp: value }))}
          />

          {/* Save Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#4aa6e0] hover:bg-[#77BEF0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-full shadow-md transition"
            >
              {saving ? "Đang lưu..." : "Lưu nhật ký"}
            </button>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa nhật ký này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContentEditor({ initialValue, onChange }) {
  const [value, setValue] = useState(initialValue || "");
  const [grammarErrors, setGrammarErrors] = useState([]);
  const [selectedError, setSelectedError] = useState(null);
  const [checkingGrammar, setCheckingGrammar] = useState(false);
  const ref = useRef(null);
  const debounceTimer = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    setValue(initialValue || "");
    setGrammarErrors([]);
  }, [initialValue]);

  // Debounced grammar check
  const checkGrammar = async (text) => {
    if (!text || text.trim().length === 0) {
      setGrammarErrors([]);
      return;
    }

    try {
      setCheckingGrammar(true);
      const token = localStorage.getItem("token");
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
      
      const response = await fetch(`${BASE_URL}/api/diaries/check-grammar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        setGrammarErrors(data.errors || []);
      } else {
        setGrammarErrors([]);
      }
    } catch (error) {
      console.error("Error checking grammar:", error);
      setGrammarErrors([]);
    } finally {
      setCheckingGrammar(false);
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange && onChange(newValue);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced grammar check
    debounceTimer.current = setTimeout(() => {
      checkGrammar(newValue);
    }, 500);
  };

  const handleAcceptSuggestion = (error, suggestion) => {
    const before = value.substring(0, error.start_index);
    const after = value.substring(error.end_index);
    const newValue = before + suggestion + after;
    
    setValue(newValue);
    onChange && onChange(newValue);
    setSelectedError(null);
    
    // Recheck grammar after applying suggestion
    setTimeout(() => {
      checkGrammar(newValue);
    }, 100);
  };

  const handleTextClick = (e) => {
    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    
    // Find error at cursor position
    const error = grammarErrors.find(
      (err) => cursorPos >= err.start_index && cursorPos <= err.end_index
    );
    
    if (error) {
      setSelectedError(error);
    } else {
      setSelectedError(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Render text with error highlights
  const renderTextWithHighlights = () => {
    if (grammarErrors.length === 0) {
      // Luôn trả về array, ngay cả khi không có lỗi
      return [{ text: value, isError: false, error: null }];
    }

    const parts = [];
    let lastIndex = 0;

    // Sort errors by start_index
    const sortedErrors = [...grammarErrors].sort((a, b) => a.start_index - b.start_index);

    sortedErrors.forEach((error) => {
      // Add text before error
      if (error.start_index > lastIndex) {
        parts.push({
          text: value.substring(lastIndex, error.start_index),
          isError: false,
          error: null,
        });
      }

      // Add error text
      parts.push({
        text: value.substring(error.start_index, error.end_index),
        isError: true,
        error: error,
      });

      lastIndex = error.end_index;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push({
        text: value.substring(lastIndex),
        isError: false,
        error: null,
      });
    }

    return parts;
  };

  // Calculate tooltip position based on error location
  const getTooltipPosition = () => {
    if (!ref.current || !selectedError) return { top: 0, left: 0 };
    
    const textBeforeError = value.substring(0, selectedError.start_index);
    const lines = textBeforeError.split('\n');
    const lineNumber = lines.length - 1;
    const lineHeight = 24; // Approximate line height
    const padding = 16;
    
    return {
      top: `${lineNumber * lineHeight + padding + 20}px`,
      left: `${padding}px`,
    };
  };

  return (
    <div className="relative">
      {/* Grammar checking indicator */}
      {checkingGrammar && (
        <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#77BEF0] border-t-transparent rounded-full animate-spin"></div>
          <span>Đang kiểm tra ngữ pháp...</span>
        </div>
      )}

      {/* Error count */}
      {grammarErrors.length > 0 && !checkingGrammar && (
        <div className="mb-2 text-sm text-orange-600 flex items-center gap-2">
          <span>⚠️</span>
          <span>Tìm thấy {grammarErrors.length} lỗi ngữ pháp - Click vào từ gạch chân để xem đề xuất</span>
        </div>
      )}

      <div className="relative">
        {/* Overlay for highlighting (positioned behind textarea) */}
        <div
          className="absolute inset-0 pointer-events-none p-4 whitespace-pre-wrap break-words text-gray-700 overflow-hidden rounded-lg"
          style={{
            fontFamily: "inherit",
            fontSize: "inherit",
            lineHeight: "inherit",
            zIndex: 1,
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {value.length === 0 ? (
            <span className="text-gray-400">Viết nội dung nhật ký của bạn bằng tiếng Nhật...</span>
          ) : (
            renderTextWithHighlights().map((part, idx) => {
              if (part.isError) {
                const isSelected = selectedError?.start_index === part.error.start_index;
                return (
                  <span
                    key={idx}
                    className={`underline decoration-red-500 decoration-2 ${
                      isSelected ? "bg-red-300" : "bg-red-200"
                    }`}
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    {part.text}
                  </span>
                );
              }
              return <span key={idx}>{part.text}</span>;
            })
          )}
        </div>

        {/* Textarea (transparent text, visible cursor) */}
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          onClick={handleTextClick}
          onKeyUp={handleTextClick}
          onSelect={handleTextClick}
          className="w-full min-h-[400px] border border-gray-200 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-[#77BEF0] resize-none text-transparent caret-gray-700 relative z-10 bg-transparent"
          placeholder="Viết nội dung nhật ký của bạn bằng tiếng Nhật..."
          style={{
            color: "transparent",
          }}
        />
      </div>

      {/* Tooltip for suggestions */}
      {selectedError && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bg-white border-2 border-red-300 rounded-lg shadow-xl p-4 min-w-[280px] max-w-[400px]"
          style={getTooltipPosition()}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="text-sm font-semibold text-gray-800">
              Lỗi: <span className="text-red-600">"{selectedError.original_word}"</span>
            </div>
            <button
              onClick={() => setSelectedError(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              title="Đóng"
            >
              ×
            </button>
          </div>
          {selectedError.suggestions && selectedError.suggestions.length > 0 ? (
            <div>
              <div className="text-xs text-gray-600 mb-2 font-medium">Đề xuất sửa:</div>
              <div className="space-y-1.5">
                {selectedError.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAcceptSuggestion(selectedError, suggestion)}
                    className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-sm text-gray-800 transition-all hover:shadow-sm"
                  >
                    ✓ {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">Không có đề xuất sửa chữa</div>
          )}
        </div>
      )}
    </div>
  );
}

