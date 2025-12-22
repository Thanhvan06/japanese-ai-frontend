import { useState} from "react";
import { FaCheck } from "react-icons/fa";

// 30 unique predefined themes - removed duplicates
const PREDEFINED_THEMES = [
  { id: 1, name: "Ocean Blue", image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800", color: "#4aa6e0" },
  { id: 2, name: "Forest Green", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", color: "#22c55e" },
  { id: 3, name: "Sunset Orange", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", color: "#f97316" },
  { id: 4, name: "Lavender Purple", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", color: "#a855f7" },
  { id: 5, name: "Rose Pink", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800", color: "#ec4899" },
  { id: 6, name: "Sky Blue", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800", color: "#3b82f6" },
  { id: 7, name: "Emerald", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800", color: "#10b981" },
  { id: 8, name: "Amber", image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800", color: "#f59e0b" },
  { id: 9, name: "Indigo", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800", color: "#6366f1" },
  { id: 10, name: "Teal", image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800", color: "#14b8a6" },
  { id: 11, name: "Crimson", image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800", color: "#dc2626" },
  { id: 12, name: "Violet", image: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800", color: "#8b5cf6" },
  { id: 13, name: "Cyan", image: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800", color: "#06b6d4" },
  { id: 14, name: "Lime", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800", color: "#84cc16" },
  { id: 15, name: "Fuchsia", image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800", color: "#d946ef" },
  { id: 16, name: "Slate", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=80", color: "#64748b" },
  { id: 17, name: "Stone", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800", color: "#78716c" },
  { id: 18, name: "Zinc", image: "https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800", color: "#71717a" },
  { id: 19, name: "Neutral", image: "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=800", color: "#737373" },
  { id: 20, name: "Red", image: "https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=800", color: "#ef4444" },
  { id: 21, name: "Yellow", image: "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=800", color: "#eab308" },
  { id: 22, name: "Blue", image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800", color: "#2563eb" },
  { id: 23, name: "Green", image: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800", color: "#16a34a" },
  { id: 24, name: "Purple", image: "https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=800", color: "#9333ea" },
  { id: 25, name: "Pink", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800", color: "#db2777" },
  { id: 26, name: "Turquoise", image: "https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?w=800", color: "#0891b2" },
  { id: 27, name: "Mint", image: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800", color: "#059669" },
  { id: 28, name: "Peach", image: "https://images.unsplash.com/photo-1468276311594-df7cb65d8df6?w=800", color: "#fb923c" },
  { id: 29, name: "Navy", image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800", color: "#1e40af" },
  { id: 30, name: "Charcoal", image: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800", color: "#374151" },
];

export default function ThemeSelector({ 
  isOpen, 
  onThemeSelect,
  currentTheme 
}) {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedColor, setUploadedColor] = useState("#50B0FA");
  const [urlInput, setUrlInput] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result;
        setUploadedImage(imageUrl);
        setUploadedColor("#50B0FA");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlLoad = () => {
    const url = urlInput.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setUploadedImage(url);
      setUploadedColor("#50B0FA");
    } else if (url) {
      alert('Vui lòng nhập URL hợp lệ (bắt đầu bằng http:// hoặc https://)');
    }
  };

  const handleThemeSelect = (theme) => {
    const themeData = {
      type: "predefined",
      id: theme.id,
      image: theme.image,
      color: theme.color,
      name: theme.name
    };
    onThemeSelect(themeData);
  };

  const handleUploadedThemeSelect = () => {
    if (uploadedImage) {
      const themeData = {
        type: "uploaded",
        image: uploadedImage,
        color: uploadedColor,
        name: "Custom Upload"
      };
      onThemeSelect(themeData);
      // Reset preview after applying
      setUploadedImage(null);
      setUrlInput("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full overflow-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Chọn giao diện</h2>
        </div>

        {/* Upload Section */}
        <div className="mb-8 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Tải lên hình ảnh/GIF của bạn
          </h3>
          <div className="space-y-3">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dán URL hình ảnh/GIF:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/image.gif"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUrlLoad();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleUrlLoad}
                  className="px-6 py-2 bg-[#50B0FA] text-white rounded-lg hover:bg-[#3d9de6] 
                    active:bg-[#2a8ad3] transition-all duration-200 text-sm font-medium 
                    shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  Tải
                </button>
              </div>
            </div>

            {/* File Upload and Preview */}
            <div className="flex items-center space-x-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg 
                  text-center text-sm font-medium text-gray-700 transition-colors 
                  border border-gray-300">
                  Chọn file từ máy
                </div>
              </label>
              {uploadedImage && (
                <>
                  <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-[#50B0FA] shadow-md">
                    <img
                      src={uploadedImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        alert('Không thể tải hình ảnh từ URL này');
                        setUploadedImage(null);
                      }}
                    />
                  </div>
                  <button
                    onClick={handleUploadedThemeSelect}
                    className="px-6 py-2 bg-[#50B0FA] text-white rounded-lg 
                      hover:bg-[#3d9de6] active:bg-[#2a8ad3] transition-all duration-200 
                      text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    Áp dụng
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Predefined Themes Grid */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Giao diện có sẵn (30 chủ đề)
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {PREDEFINED_THEMES.map((theme) => (
              <div
                key={theme.id}
                onClick={() => handleThemeSelect(theme)}
                className={`relative cursor-pointer rounded-lg overflow-hidden 
                  border-2 transition-all hover:scale-105 hover:shadow-lg ${
                  currentTheme?.id === theme.id
                    ? "border-[#50B0FA] ring-2 ring-[#50B0FA]/30"
                    : "border-gray-200 hover:border-[#50B0FA]/50"
                }`}
              >
                <div 
                  className="aspect-square relative"
                  style={{
                    background: `linear-gradient(135deg, ${theme.color}40, ${theme.color}60, ${theme.color}80)`
                  }}
                >
                  <img
                    src={theme.image}
                    alt={theme.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs font-medium truncate drop-shadow-lg">
                      {theme.name}
                    </p>
                  </div>
                </div>
                {currentTheme?.id === theme.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-[#50B0FA] rounded-full flex items-center justify-center shadow-lg">
                      <FaCheck className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}