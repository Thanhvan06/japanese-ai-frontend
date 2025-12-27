import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StudyRoomTabBar from "../components/StudyRoomTabBar";
import DraggableWindow from "../components/DraggableWindow";
import PomodoroTimer from "../components/PomodoroTimer";
import MusicPlayer from "../components/MusicPlayer";
import AmbientSoundMixer from "../components/AmbientSoundMixer";
import TodoList from "../components/TodoList";
import NotePad from "../components/NotePad";
import DraggableNote from "../components/DraggableNote";
import ThemeSelector from "../components/ThemeSelector";
import {
  FaClock,
  FaMusic,
  FaVolumeUp,
  FaCheckSquare,
  FaStickyNote,
  FaYoutube,
  FaPalette,
} from "react-icons/fa";
import { getPersonalRoomState, updatePersonalRoomState } from "../services/personalRoomService";

const DEFAULT_THEMES = [
  { id: 1, name: "Ocean Blue", image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800", color: "#4aa6e0" },
  { id: 2, name: "Forest Green", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", color: "#22c55e" },
  { id: 3, name: "Sunset Orange", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", color: "#f97316" },
  { id: 4, name: "Lavender Purple", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", color: "#a855f7" },
  { id: 5, name: "Rose Pink", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800", color: "#ec4899" },
  { id: 6, name: "Sky Blue", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800", color: "#3b82f6" },
];

export default function PersonalStudyRoom({ panelColor = "#4aa6e0" }) {
  const [themeColor, setThemeColor] = useState(panelColor);
  const [backgroundImage, setBackgroundImage] = useState(DEFAULT_THEMES[0].image);
  const [playlist, setPlaylist] = useState([]);
  const [showVideo, setShowVideo] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [maxZIndex, setMaxZIndex] = useState(100);
  const [loading, setLoading] = useState(true);
  const [timerDuration, setTimerDuration] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [windows, setWindows] = useState({
    timer: { visible: false, minimized: false, position: { x: 50, y: 50 }, zIndex: 10 },
    music: { visible: false, minimized: false, position: { x: 500, y: 50 }, zIndex: 11 },
    ambient: { visible: false, minimized: false, position: { x: 950, y: 50 }, zIndex: 12 },
    todo: { visible: false, minimized: false, position: { x: 50, y: 400 }, zIndex: 13 },
    notes: { visible: false, minimized: false, position: { x: 500, y: 400 }, zIndex: 14 },
    video: { visible: false, minimized: false, position: { x: 200, y: 200 }, zIndex: 15 },
    theme: { visible: false, minimized: false, position: { x: 300, y: 100 }, zIndex: 16 },
  });

  // Restore state from backend on mount
  useEffect(() => {
    const restoreState = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await getPersonalRoomState();
        const state = res.state || {};

        // Apply theme
        if (state.theme) {
          if (state.theme.color) {
            setThemeColor(state.theme.color);
          }
          if (state.theme.image) {
            setBackgroundImage(state.theme.image);
          } else if (state.theme.color && !state.theme.image) {
            setBackgroundImage(null);
          }
        }

        // Apply playlist
        if (Array.isArray(state.playlist)) {
          setPlaylist(state.playlist);
        }
      } catch (err) {
        console.error("Failed to restore state:", err);
      } finally {
        setLoading(false);
      }
    };
    restoreState();
  }, []);

  // ===== FULLSCREEN TOGGLE (ADDED) =====
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
  
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);  

  // --- HÀM XỬ LÝ KẾT NỐI TODO -> TIMER ---
  const handleStartTaskTimer = (duration) => {
    setTimerDuration(duration);
    setIsTimerActive(true);

    // Tự động mở cửa sổ Timer và đưa lên trên cùng
    setMaxZIndex(prev => prev + 1);
    setWindows(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        visible: true,
        minimized: false, // Đảm bảo không bị ẩn
        zIndex: maxZIndex + 1
      }
    }));
  };

  const handleTimerComplete = () => {
    setIsTimerActive(false);
    // Có thể thêm âm thanh thông báo hoặc alert tại đây
    // new Audio('/sounds/bell.mp3').play(); 
  };
  // ---------------------------------------

  const handleThemeChange = async (selectedTheme) => {
    const newColor = selectedTheme.color || panelColor;
    const newImage = selectedTheme.image || null;

    // Update local state immediately
    setThemeColor(newColor);
    setBackgroundImage(newImage);
    setWindows(prev => ({ ...prev, theme: { ...prev.theme, visible: false } }));

    // Save to backend
    try {
      await updatePersonalRoomState({
        theme: {
          color: newColor,
          image: newImage,
        },
      });
    } catch (err) {
      console.error("Failed to save theme:", err);
    }
  };

  const handleWindowClose = (windowId) => {
    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], visible: false } }));
  };

  const handleWindowMinimize = (windowId, minimized) => {
    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], minimized } }));
  };

  const handleZIndexChange = (windowId) => {
    setMaxZIndex(prev => prev + 1);
    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], zIndex: maxZIndex + 1 } }));
  };

  const toggleWindow = (windowId) => {
    setWindows(prev => {
      const current = prev[windowId];
  
      // Nếu đang visible → đóng
      if (current.visible) {
        return {
          ...prev,
          [windowId]: {
            ...current,
            visible: false,
            minimized: false,
          },
        };
      }
  
      // Nếu đang đóng → mở
      setMaxZIndex(prevZ => prevZ + 1);
  
      return {
        ...prev,
        [windowId]: {
          ...current,
          visible: true,
          minimized: false,
          zIndex: maxZIndex + 1,
        },
      };
    });
  };
  

  const backgroundStyle = backgroundImage
    ? {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }
    : {
      background: `linear-gradient(to bottom right, ${themeColor}10, ${themeColor}20, ${themeColor}30)`,
    };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center">
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {!isFullscreen && <Sidebar />}
      <div
        className={`flex-1 relative overflow-hidden ${isFullscreen ? "" : "ml-14"
          }`}
      >
        {!isFullscreen && <Header />}
        <div
          className="absolute inset-0"
          style={backgroundStyle}
        >
          <div
            className="absolute inset-0 transition-opacity"
            style={{
              backgroundColor: backgroundImage ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.1)"
            }}
          />

          {/* Tab Bar - Bottom Right */}
          <StudyRoomTabBar onWindowToggle={toggleWindow} windows={windows} onToggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />

          {/* Windows - Only render if visible */}
          {windows.timer.visible && (
            <DraggableWindow
              id="timer"
              title="Pomodoro Timer"
              icon={FaClock}
              initialPosition={windows.timer.position}
              initialSize={{ width: 400, height: 500 }}
              onClose={handleWindowClose}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.timer.minimized}
              zIndex={windows.timer.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              {/* GHÉP NỐI: Truyền state vào Timer */}
              <PomodoroTimer
                defaultMinutes={25}
                panelColor={themeColor}
                initialTime={timerDuration}
                isActive={isTimerActive}
                onComplete={handleTimerComplete}
              />
            </DraggableWindow>
          )}

          {windows.music.visible && (
            <DraggableWindow
              id="music"
              title="Music Player"
              icon={FaMusic}
              initialPosition={windows.music.position}
              initialSize={{ width: 450, height: 600 }}
              onClose={handleWindowClose}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.music.minimized}
              zIndex={windows.music.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              <MusicPlayer
                panelColor={themeColor}
                playlist={playlist}
                onPlaylistChange={async (newPlaylist) => {
                  setPlaylist(newPlaylist);
                  try {
                    await updatePersonalRoomState({ playlist: newPlaylist });
                  } catch (err) {
                    console.error("Failed to save playlist:", err);
                  }
                }}
                onVideoToggle={(show, id) => {
                  setShowVideo(show);
                  setVideoId(id);
                  if (show) {
                    setWindows(prev => ({
                      ...prev,
                      video: { ...prev.video, visible: true, zIndex: maxZIndex + 1 }
                    }));
                    setMaxZIndex(prev => prev + 1);
                  }
                }}
              />
            </DraggableWindow>
          )}

          {windows.ambient.visible && (
            <DraggableWindow
              id="ambient"
              title="Ambient Sounds"
              icon={FaVolumeUp}
              initialPosition={windows.ambient.position}
              initialSize={{ width: 400, height: 500 }}
              onClose={handleWindowClose}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.ambient.minimized}
              zIndex={windows.ambient.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              <AmbientSoundMixer panelColor={themeColor} />
            </DraggableWindow>
          )}

          {windows.todo.visible && (
            <DraggableWindow
              id="todo"
              title="Todo List"
              icon={FaCheckSquare}
              initialPosition={windows.todo.position}
              initialSize={{ width: 450, height: 500 }}
              onClose={handleWindowClose}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.todo.minimized}
              zIndex={windows.todo.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              {/* GHÉP NỐI: Truyền hàm handleStartTaskTimer vào TodoList */}
              <TodoList onStartTask={handleStartTaskTimer} />
            </DraggableWindow>
          )}

          {windows.notes.visible && (
            <DraggableWindow
              id="notes"
              title="Notes"
              icon={FaStickyNote}
              initialPosition={windows.notes.position}
              initialSize={{ width: 500, height: 400 }}
              onClose={handleWindowClose}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.notes.minimized}
              zIndex={windows.notes.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              <NotePad onNotesChange={setNotes} />
            </DraggableWindow>
          )}

          {windows.video.visible && showVideo && videoId && (
            <DraggableWindow
              id="video"
              title="YouTube Video"
              icon={FaYoutube}
              initialPosition={windows.video.position}
              initialSize={{ width: 800, height: 500 }}
              onClose={() => {
                setShowVideo(false);
                setVideoId(null);
                handleWindowClose('video');
              }}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.video.minimized}
              zIndex={windows.video.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              <div className="w-full h-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded"
                />
              </div>
            </DraggableWindow>
          )}

          {windows.theme.visible && (
            <DraggableWindow
              id="theme"
              title="Theme & Background"
              icon={FaPalette}
              initialPosition={windows.theme.position}
              initialSize={{ width: 600, height: 700 }}
              onClose={handleWindowClose}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.theme.minimized}
              zIndex={windows.theme.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              <ThemeSelector
                isOpen={true}
                onClose={() => handleWindowClose('theme')}
                onThemeSelect={handleThemeChange}
                currentTheme={null}
              />
            </DraggableWindow>
          )}

          {/* Draggable Notes on Screen */}
          <main className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="pointer-events-auto">
              {notes.map((note) => (
                <DraggableNote
                  key={note.id}
                  note={note}
                  onUpdate={(id, updatedNote) => {
                    setNotes(notes.map((n) => n.id === id ? updatedNote : n));
                  }}
                  onDelete={(id) => {
                    setNotes(notes.filter((n) => n.id !== id));
                  }}
                  onColorChange={(id, color) => {
                    setNotes(notes.map((n) => n.id === id ? { ...n, color } : n));
                  }}
                />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}